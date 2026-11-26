-- =====================================================================
-- جسر العطاء: تحديث 13 — «وضع التجربة» للأدمن
--  • الأدمن يشغّله من لوحة الإدارة، فيصبح عرضه «في الانتظار» كأي عضو، ويستطيع حجز غرضه بنفسه
--  • أغراض التجربة عليها علامة «تجربة»، ولا تدخل الإحصاء، وتُمسح بضغطة
-- يُلصق في SQL Editor ثم Run بعد التحديث 12. يمكن تشغيله أكثر من مرة.
-- =====================================================================

alter table jisr_items add column if not exists test boolean not null default false;
alter table jisr_profiles add column if not exists test_mode boolean not null default false;

-- أحداث أغراض التجربة لا تُسجَّل، فلا تدخل الإحصاء
create or replace function jisr_log(_type text, _code text, _who text) returns void
language plpgsql security definer set search_path = public as $$
declare a text; c text; t boolean;
begin
  select coalesce(nullif(trim(split_part(area, '/', 1)), ''), 'غير محدد'), cat, test into a, c, t from jisr_items where code = _code;
  if coalesce(t, false) then return; end if;
  insert into jisr_events (type, code, who, area, cat) values (_type, _code, _who, coalesce(a, 'غير محدد'), coalesce(c, 'أخرى ومتنوعات'));
end $$;
revoke execute on function jisr_log(text, text, text) from public, anon, authenticated;

create or replace function jisr_post(_title text, _det text, _area text, _cond text, _pick text, _cat text,
  _photos text[] default '{}', _pick_from text default null, _pick_to text default null, _prefix text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); pre text; c text; st text; ok boolean; tm boolean;
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
  -- الأدمن في وضع التجربة: عرضه «في الانتظار» كأي عضو، ويُعلَّم «تجربة»
  tm := jisr_is_admin(me) and coalesce((select test_mode from jisr_profiles where phone = me), false);
  ok := (jisr_is_admin(me) and not tm) or coalesce((select approve_mode = 'auto' from jisr_settings where id = 1), false);
  insert into jisr_items (code, owner, title, det, area, cond, pick, cat, photos, pick_from, pick_to, approved, approved_at, test)
  values (c, me, left(_title, 80), left(coalesce(_det, ''), 400), left(_area, 60), left(coalesce(_cond, ''), 60),
          left(coalesce(_pick, ''), 80), coalesce(nullif(_cat, ''), 'أخرى ومتنوعات'), (coalesce(_photos, '{}'))[1:3], _pick_from, _pick_to,
          ok, case when ok then now() end, tm);
  perform jisr_log('posted', c, me);
  perform jisr_fill(now());
  select status into st from jisr_items where code = c;
  return json_build_object('ok', true, 'code', c, 'status', st, 'approved', ok);
end $$;

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
  -- لا يحجز أحد غرضه، إلا الأدمن في غرض التجربة ليجرّب الدورة كاملة وحده
  if it.owner = me and not (it.test and jisr_is_admin(me)) then return json_build_object('err', 'own'); end if;
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

-- تشغيل وضع التجربة وإطفاؤه، ومسح أغراض التجربة كلها
create or replace function jisr_test(_act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); n int;
begin
  if not jisr_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if _act in ('on', 'off') then
    update jisr_profiles set test_mode = (_act = 'on') where phone = me;
    return json_build_object('ok', true);
  elsif _act = 'clear' then
    delete from jisr_items where test;
    get diagnostics n = row_count;
    perform jisr_fill(now());
    return json_build_object('ok', true, 'n', n);
  end if;
  return json_build_object('err', 'bad_action');
end $$;
revoke execute on function jisr_test(text) from public, anon;
grant execute on function jisr_test(text) to authenticated;

create or replace function jisr_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); adm boolean; prof json; res json;
begin
  perform jisr_tick();
  adm := jisr_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned, 'testMode', coalesce(test_mode, false)) into prof from jisr_profiles where phone = me;
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
        'approved', i.approved, 'confirmed', i.confirmed, 'test', i.test, 'givenAt', floor(extract(epoch from i.given_at) * 1000),
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
      where ((i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue))))
            and not (i.given and i.given_at < now() - interval '15 minutes')
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from jisr_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from jisr_profiles), '{}'::json) end
  ) into res from jisr_settings s where s.id = 1;
  return res;
end $$;
