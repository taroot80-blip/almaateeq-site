-- =====================================================================
-- جسر العطاء: تحديث 11 — خطة البنود الثمانية
--  • العرض الجديد يبقى عالقًا حتى يقبله أحد الأدمنية (أو تلقائيًا إن اختارت الإدارة ذلك)
--  • يُحفظ وقت حجز كل مستفيد، ويرى الأدمن الحاجزين بالترتيب ويؤكد الحجز لأحدهم،
--    أو تختار الإدارة «تلقائي بالترتيب»
--  • المستفيد نفسه يستطيع الضغط على «تم الاستلام» كما يضغطه العارض
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================

-- ما سبق التحديث مقبول، وما يُرفع بعده ينتظر الموافقة
alter table jisr_items add column if not exists approved boolean not null default true;
alter table jisr_items alter column approved set default false;
alter table jisr_items add column if not exists approved_at timestamptz;
alter table jisr_items add column if not exists confirmed boolean not null default true;
alter table jisr_items add column if not exists queue_t jsonb not null default '{}'::jsonb;   -- {رقم: وقت الحجز}
alter table jisr_settings add column if not exists approve_mode text not null default 'manual';  -- manual | auto
alter table jisr_settings add column if not exists confirm_mode text not null default 'auto';    -- auto | manual

-- هل يؤكَّد الحجز تلقائيًا للأول؟
create or replace function jisr_auto_confirm() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select confirm_mode = 'auto' from jisr_settings where id = 1), true)
$$;

create or replace function jisr_to_store(_code text, _t timestamptz, _log boolean default true) returns void
language plpgsql security definer set search_path = public as $$
declare o text;
begin
  update jisr_items set status = 'cancelled', cancelled_at = coalesce(cancelled_at, _t), queue = '{}', queue_t = '{}', confirmed = true
  where code = _code returning owner into o;
  if _log then perform jisr_log('cancelled', _code, o); end if;
end $$;

-- لا يدخل النوافذ إلا ما قبلته الإدارة
create or replace function jisr_fill(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare free int;
begin
  select s.slots - (select count(*) from jisr_items where status = 'shown' and not expired and not cancelled) into free from jisr_settings s where id = 1;
  if free > 0 then
    update jisr_items set status = 'shown', shows = shows + 1, shown_at = _t
    where code in (select code from jisr_items where status = 'waiting' and approved order by coalesce(approved_at, created) limit free);
  end if;
end $$;

create or replace function jisr_post(_title text, _det text, _area text, _cond text, _pick text, _cat text,
  _photos text[] default '{}', _pick_from text default null, _pick_to text default null, _prefix text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); pre text; c text; st text; ok boolean;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from jisr_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  if coalesce(_title, '') = '' or coalesce(_area, '') = '' then return json_build_object('err', 'missing'); end if;
  pre := case when upper(coalesce(_prefix, '')) ~ '^[A-Z]{2}$' then upper(_prefix) else
    coalesce((json_build_object('تاروت','TR','القطيف','QT','سيهات','SN','العوامية','AW','صفوى','SF','الأوجام','AJ',
      'أم الحمام','UH','الجارودية','JR','الجش','JS','أم الساهك','US','القديح','QD','الدمام','DM') ->> trim(split_part(_area, '/', 1))), 'JA') end;
  loop
    c := pre || '-' || (1000 + floor(random() * 9000))::int;
    exit when not exists (select 1 from jisr_items where code = c);
  end loop;
  -- عرض الأدمن نفسه مقبول، وكذلك كل عرض إن اختارت الإدارة القبول التلقائي
  ok := jisr_is_admin(me) or coalesce((select approve_mode = 'auto' from jisr_settings where id = 1), false);
  insert into jisr_items (code, owner, title, det, area, cond, pick, cat, photos, pick_from, pick_to, approved, approved_at)
  values (c, me, left(_title, 80), left(coalesce(_det, ''), 400), left(_area, 60), left(coalesce(_cond, ''), 60),
          left(coalesce(_pick, ''), 80), coalesce(nullif(_cat, ''), 'أخرى ومتنوعات'), (coalesce(_photos, '{}'))[1:3], _pick_from, _pick_to,
          ok, case when ok then now() end);
  perform jisr_log('posted', c, me);
  perform jisr_fill(now());
  select status into st from jisr_items where code = c;
  return json_build_object('ok', true, 'code', c, 'status', st, 'approved', ok);
end $$;
grant execute on function jisr_post(text, text, text, text, text, text, text[], text, text, text) to authenticated;

-- الحجز: يدخل الحاجز الدور ويُحفظ وقته؛ والأول يُؤكَّد تلقائيًا أو ينتظر تأكيد الأدمن
create or replace function jisr_book(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items; pos int; act int; mx int;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from jisr_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  perform jisr_tick();
  select * into it from jisr_items where code = upper(trim(_code)) for update;
  if not found then return json_build_object('err', 'not_found'); end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'cancelled'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'given'); end if;
  if it.owner = me then return json_build_object('err', 'own'); end if;
  pos := array_position(it.queue, me);
  if pos is null then
    if it.status <> 'shown' then return json_build_object('err', 'not_shown'); end if;
    if cardinality(it.queue) = 0 then
      select max_active into mx from jisr_settings where id = 1;
      select count(*) into act from jisr_items where queue[1] = me and not given and not cancelled and status in ('shown','reserved');
      if act >= mx then return json_build_object('err', 'limit', 'max', mx); end if;
    end if;
    update jisr_items set queue = array_append(queue, me),
      queue_t = queue_t || jsonb_build_object(me, floor(extract(epoch from now()) * 1000)),
      confirmed = case when cardinality(queue) = 0 then jisr_auto_confirm() else confirmed end,
      booked_at = case when cardinality(queue) = 0 then now() else booked_at end
    where code = it.code returning * into it;
    perform jisr_log('booked', it.code, me);
    pos := array_position(it.queue, me);
  end if;
  return json_build_object('ok', true, 'code', it.code, 'pos', pos - 1, 'confirmed', it.confirmed);
end $$;

-- التنازل عن الحجز: من أي مكان في الدور
create or replace function jisr_cancel_booking(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items; first boolean;
begin
  select * into it from jisr_items where code = _code for update;
  if not found or not (me = any(it.queue)) then return json_build_object('err', 'not_found'); end if;
  first := it.queue[1] = me;
  perform jisr_log('returned', it.code, me);
  update jisr_items set queue = array_remove(queue, me), queue_t = queue_t - me,
    booked_at = case when first then now() else booked_at end,
    confirmed = case when first then jisr_auto_confirm() else confirmed end,
    cancels = cancels + case when first then 1 else 0 end where code = it.code;
  perform jisr_tick();
  return json_build_object('ok', true);
end $$;

-- مهلة الاستلام (24 ساعة) تُحسب من تأكيد الحجز فقط
create or replace function jisr_tick() returns void
language plpgsql security definer set search_path = public as $$
declare cs timestamptz; r record; ac boolean := jisr_auto_confirm();
begin
  perform pg_advisory_xact_lock(4460);
  loop
    select cycle_start into cs from jisr_settings where id = 1;
    exit when now() < cs + interval '1 day';
    perform jisr_roll(cs + interval '1 day');
  end loop;
  for r in select * from jisr_items where status in ('shown','reserved') and not given and not cancelled for update loop
    while cardinality(r.queue) > 0 and r.confirmed and now() - r.booked_at > interval '1 day' loop
      perform jisr_log('returned', r.code, r.queue[1]);
      r.queue_t := r.queue_t - r.queue[1];
      r.queue := r.queue[2:]; r.booked_at := r.booked_at + interval '1 day'; r.cancels := r.cancels + 1; r.confirmed := ac;
    end loop;
    update jisr_items set queue = r.queue, queue_t = r.queue_t, booked_at = r.booked_at, cancels = r.cancels, confirmed = r.confirmed where code = r.code;
    if r.status = 'reserved' and cardinality(r.queue) = 0 then perform jisr_to_store(r.code, now()); end if;
  end loop;
  perform jisr_fill(now());
end $$;

-- أفعال العارض والأدمن، و«تم الاستلام» يضغطه العارض أو المستفيد المؤكَّد له
create or replace function jisr_owner_action(_code text, _act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items; holder boolean;
begin
  select * into it from jisr_items where code = _code for update;
  if not found then return json_build_object('err', 'not_found'); end if;
  holder := me is not null and it.queue[1] = me and it.confirmed;
  if it.owner <> me and not jisr_is_admin(me) and not (holder and _act = 'given') then return json_build_object('err', 'not_found'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'closed'); end if;
  if _act = 'relist' then
    if it.expired and not it.cancelled and it.status = 'shown' then
      update jisr_items set expired = false, shown_at = now() where code = it.code;
      return json_build_object('ok', true);
    end if;
    if not (it.cancelled or it.status = 'cancelled') then return json_build_object('err', 'closed'); end if;
    if it.relists >= 3 then return json_build_object('err', 'relist_limit'); end if;
    perform jisr_log('posted', it.code, it.owner);
    update jisr_items set cancelled = false, cancelled_at = null, queue = '{}', queue_t = '{}', confirmed = true, wa_sent_at = null, expired = false, relists = relists + 1,
      status = case when status = 'shown' then 'shown' else 'waiting' end, created = now() where code = it.code;
    perform jisr_fill(now());
    return json_build_object('ok', true);
  end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'closed'); end if;
  if _act = 'given' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    if not it.confirmed then return json_build_object('err', 'not_confirmed'); end if;
    perform jisr_log('given', it.code, it.queue[1]);
    update jisr_items set given = true, given_at = now(), queue = '{}', queue_t = '{}',
      status = case when status = 'reserved' then 'given' else status end where code = it.code;
  elsif _act = 'skip' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform jisr_log('returned', it.code, it.queue[1]);
    update jisr_items set queue = queue[2:], queue_t = queue_t - it.queue[1], booked_at = now(), cancels = cancels + 1,
      confirmed = jisr_auto_confirm() where code = it.code;
    if it.status = 'reserved' and cardinality(it.queue) = 1 then perform jisr_to_store(it.code, now()); end if;
  elsif _act = 'cancel' then
    perform jisr_log('cancelled', it.code, it.owner);
    update jisr_items set cancelled = true, queue = '{}', queue_t = '{}', confirmed = true,
      status = case when status <> 'shown' or expired then 'cancelled' else status end,
      cancelled_at = now() where code = it.code;
    perform jisr_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;

-- أدوات الأدمن الجديدة: قبول العرض، تأكيد الحجز لأحد الحاجزين، ووضعا القبول والتأكيد
create or replace function jisr_manage(_act text, _code text default null, _arg text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items;
begin
  if not jisr_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if _act = 'approve_mode' then
    if _arg not in ('manual','auto') then return json_build_object('err', 'bad_action'); end if;
    update jisr_settings set approve_mode = _arg where id = 1;
    if _arg = 'auto' then update jisr_items set approved = true, approved_at = now() where not approved and status = 'waiting' and not cancelled; perform jisr_fill(now()); end if;
    return json_build_object('ok', true);
  elsif _act = 'confirm_mode' then
    if _arg not in ('manual','auto') then return json_build_object('err', 'bad_action'); end if;
    update jisr_settings set confirm_mode = _arg where id = 1;
    if _arg = 'auto' then update jisr_items set confirmed = true, booked_at = now() where not confirmed and cardinality(queue) > 0 and not given and not cancelled; end if;
    return json_build_object('ok', true);
  end if;
  select * into it from jisr_items where code = _code for update;
  if not found then return json_build_object('err', 'not_found'); end if;
  if _act = 'approve' then
    if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'closed'); end if;
    update jisr_items set approved = true, approved_at = coalesce(approved_at, now()) where code = it.code;
    perform jisr_log('approved', it.code, me);
    perform jisr_fill(now());
    return json_build_object('ok', true, 'status', (select status from jisr_items where code = it.code));
  elsif _act = 'confirm' then   -- _arg: رقم الحاجز الذي يختاره الأدمن
    if it.given or it.cancelled then return json_build_object('err', 'closed'); end if;
    if not (_arg = any(it.queue)) then return json_build_object('err', 'not_found'); end if;
    update jisr_items set queue = array_prepend(_arg, array_remove(queue, _arg)), confirmed = true, booked_at = now() where code = it.code;
    perform jisr_log('confirmed', it.code, _arg);
    return json_build_object('ok', true);
  end if;
  return json_build_object('err', 'bad_action');
end $$;
revoke execute on function jisr_manage(text, text, text) from public, anon;
grant execute on function jisr_manage(text, text, text) to authenticated;

create or replace function jisr_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); adm boolean; prof json; res json;
begin
  perform jisr_tick();
  adm := jisr_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned) into prof from jisr_profiles where phone = me;
  select json_build_object(
    'serverNow', floor(extract(epoch from now()) * 1000),
    'cycleStart', floor(extract(epoch from s.cycle_start) * 1000),
    'slots', s.slots, 'me', me, 'profile', prof, 'waMode', s.wa_mode, 'expMode', s.exp_mode, 'groupName', s.group_name, 'groupLink', s.group_link,
    'approveMode', s.approve_mode, 'confirmMode', s.confirm_mode,
    'items', coalesce((select json_agg(json_build_object(
        'code', i.code, 'title', i.title, 'det', i.det, 'area', i.area, 'cond', i.cond, 'pick', i.pick,
        'cat', i.cat, 'icon', i.icon, 'photos', i.photos,
        'pickTime', case when i.pick_from is null then null else json_build_object('from', i.pick_from, 'to', i.pick_to) end,
        'status', i.status, 'given', i.given, 'cancelled', i.cancelled, 'shows', i.shows, 'cancels', i.cancels, 'relists', i.relists, 'expired', i.expired, 'waSent', case when adm or i.owner = me then i.wa_sent_at is not null end,
        'approved', i.approved, 'confirmed', i.confirmed,
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'ownerName', (select case when pr.show_name and coalesce(pr.name, '') <> '' then pr.name end from jisr_profiles pr where pr.phone = i.owner),
        'owner', case when adm or i.owner = me or (i.queue[1] = me and i.confirmed) then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or (i.owner = me and i.confirmed) then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end,
        'queueT', case when adm then i.queue_t end
      ) order by i.created)
      from jisr_items i
      where (i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from jisr_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from jisr_profiles), '{}'::json) end
  ) into res from jisr_settings s where s.id = 1;
  return res;
end $$;

-- تعديل العرض: للعارض والأدمن ما دام الغرض لم يُسلَّم ولم يُلغَ (الكود يبقى كما هو)
create or replace function jisr_edit_item(_code text, _title text, _det text, _area text, _cond text, _pick text, _cat text, _photos text[] default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items;
begin
  select * into it from jisr_items where code = _code for update;
  if not found or me is null or (it.owner <> me and not jisr_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.cancelled or it.status in ('given','cancelled') then return json_build_object('err', 'closed'); end if;
  if coalesce(_title, '') = '' or coalesce(_area, '') = '' then return json_build_object('err', 'missing'); end if;
  update jisr_items set title = left(_title, 80), det = left(coalesce(_det, ''), 400), area = left(_area, 60),
    cond = left(coalesce(_cond, ''), 60), pick = left(coalesce(_pick, ''), 80), cat = coalesce(nullif(_cat, ''), cat),
    photos = case when _photos is null then photos else _photos[1:3] end where code = it.code;
  perform jisr_log('edited', it.code, me);
  return json_build_object('ok', true);
end $$;
revoke execute on function jisr_edit_item(text, text, text, text, text, text, text, text[]) from public, anon;
grant execute on function jisr_edit_item(text, text, text, text, text, text, text, text[]) to authenticated;

-- وقت الاستلام: يعدّله العارض متى شاء بتحريك العقارب، ما دام الغرض لم يُسلَّم ولم يُلغَ
create or replace function jisr_set_pick_time(_code text, _from text, _to text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items;
begin
  select * into it from jisr_items where code = _code for update;
  if not found or (it.owner <> me and not jisr_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.cancelled then return json_build_object('err', 'closed'); end if;
  update jisr_items set pick_from = left(_from, 20), pick_to = left(_to, 20) where code = _code;
  return json_build_object('ok', true);
end $$;
