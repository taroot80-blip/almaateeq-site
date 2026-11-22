-- =====================================================================
-- جسر العطاء: التحقق بالإيميل بدل رسائل الجوال، والإعلان بلا صورة وبالحي، وعدّاد إلغاء الحجز
-- الهوية = الإيميل (يصله رمز التحقق)، ورقم الجوال للتواصل الكتابي عبر واتساب فقط.
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================

alter table jisr_profiles add column if not exists email text;

-- رقم المستخدم الحالي: من ملفه المرتبط بحسابه (الإيميل الموثّق)
create or replace function jisr_me() returns text
language sql stable security definer set search_path = public as $$
  select phone from public.jisr_profiles where user_id = auth.uid() limit 1
$$;

-- إكمال البيانات أول مرة: الاسم ورقم واتساب. الرقم لا يأخذه إلا صاحبه
drop function if exists jisr_set_profile(text);
create or replace function jisr_set_profile(_name text, _phone text default null) returns json
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); em text; p text; cur jisr_profiles;
begin
  if uid is null then return json_build_object('err', 'login'); end if;
  select lower(email) into em from auth.users where id = uid;
  select * into cur from jisr_profiles where user_id = uid;
  if found then
    update jisr_profiles set email = em,
      name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end
    where user_id = uid;
    return json_build_object('ok', true, 'phone', cur.phone);
  end if;
  p := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  if p !~ '^\d{10,13}$' then return json_build_object('err', 'bad_phone'); end if;
  -- رقم مسجّل لحساب آخر، أو حجزته الإدارة لإيميل آخر
  if exists (select 1 from jisr_profiles where phone = p and
      ((user_id is not null and user_id <> uid) or (email is not null and email <> em))) then
    return json_build_object('err', 'phone_taken');
  end if;
  insert into jisr_profiles (phone, user_id, email, name) values (p, uid, em, left(coalesce(trim(_name), ''), 30))
  on conflict (phone) do update set user_id = uid, email = em,
    name = case when excluded.name <> '' then excluded.name else jisr_profiles.name end;
  return json_build_object('ok', true, 'phone', p);
end $$;
grant execute on function jisr_set_profile(text, text) to authenticated;

-- اللوحة: تخبر الواجهة إن كان المستخدم دخل بإيميله ولم يكمل رقمه بعد
create or replace function jisr_board_auth() returns json
language plpgsql security definer set search_path = public as $$
begin
  return json_build_object('signedIn', auth.uid() is not null,
    'needProfile', auth.uid() is not null and not exists (select 1 from jisr_profiles where user_id = auth.uid()),
    'email', (select email from auth.users where id = auth.uid()));
end $$;
grant execute on function jisr_board_auth() to anon, authenticated;

-- ---------- الإعلان: الصورة اختيارية، والبادئة من المنطقة والحي ----------
drop function if exists jisr_post(text, text, text, text, text, text, text[], text, text);
create or replace function jisr_post(_title text, _det text, _area text, _cond text, _pick text, _cat text,
  _photos text[] default '{}', _pick_from text default null, _pick_to text default null, _prefix text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); pre text; c text; st text;
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
  insert into jisr_items (code, owner, title, det, area, cond, pick, cat, photos, pick_from, pick_to)
  values (c, me, left(_title, 80), left(coalesce(_det, ''), 400), left(_area, 60), left(coalesce(_cond, ''), 60),
          left(coalesce(_pick, ''), 80), coalesce(nullif(_cat, ''), 'أخرى ومتنوعات'), (coalesce(_photos, '{}'))[1:3], _pick_from, _pick_to);
  perform jisr_log('posted', c, me);
  perform jisr_fill(now());
  select status into st from jisr_items where code = c;
  return json_build_object('ok', true, 'code', c, 'status', st);
end $$;
grant execute on function jisr_post(text, text, text, text, text, text, text[], text, text, text) to authenticated;

-- ---------- عدّاد «أُلغي الحجز» وطابور الأحقية ----------
alter table jisr_items add column if not exists cancels int not null default 0;
create or replace function jisr_tick() returns void
language plpgsql security definer set search_path = public as $$
declare cs timestamptz; r record;
begin
  perform pg_advisory_xact_lock(4460);  -- لا يعمل نبضان في الوقت نفسه
  loop
    select cycle_start into cs from jisr_settings where id = 1;
    exit when now() < cs + interval '1 day';
    perform jisr_roll(cs + interval '1 day');
  end loop;
  -- انتهاء مهلة الاستلام (24 ساعة) ينقل الحجز لمن بعده
  for r in select * from jisr_items where status in ('shown','reserved') and not given and not cancelled for update loop
    while cardinality(r.queue) > 0 and now() - r.booked_at > interval '1 day' loop
      perform jisr_log('returned', r.code, r.queue[1]);
      r.queue := r.queue[2:]; r.booked_at := r.booked_at + interval '1 day'; r.cancels := r.cancels + 1;
    end loop;
    update jisr_items set queue = r.queue, booked_at = r.booked_at, cancels = r.cancels where code = r.code;
    if r.status = 'reserved' and cardinality(r.queue) = 0 then perform jisr_to_store(r.code, now()); end if;
  end loop;
  perform jisr_fill(now());
end $$;
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
    'slots', s.slots, 'me', me, 'profile', prof,
    'items', coalesce((select json_agg(json_build_object(
        'code', i.code, 'title', i.title, 'det', i.det, 'area', i.area, 'cond', i.cond, 'pick', i.pick,
        'cat', i.cat, 'icon', i.icon, 'photos', i.photos,
        'pickTime', case when i.pick_from is null then null else json_build_object('from', i.pick_from, 'to', i.pick_to) end,
        'status', i.status, 'given', i.given, 'cancelled', i.cancelled, 'shows', i.shows, 'cancels', i.cancels,
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'owner', case when adm or i.owner = me or i.queue[1] = me then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or i.owner = me then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end
      ) order by i.created)
      from jisr_items i
      where i.status = 'shown' or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from jisr_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from jisr_profiles), '{}'::json) end
  ) into res from jisr_settings s where s.id = 1;
  return res;
end $$;
create or replace function jisr_cancel_booking(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items;
begin
  select * into it from jisr_items where code = _code for update;
  if not found or not (me = any(it.queue)) then return json_build_object('err', 'not_found'); end if;
  perform jisr_log('returned', it.code, me);
  -- صاحب الأحقية الأولى تنازل: يُعدّ إلغاءً، ومن أراده بعدها عاد آخر الطابور
  update jisr_items set queue = array_remove(queue, me),
    booked_at = case when queue[1] = me then now() else booked_at end,
    cancels = cancels + case when queue[1] = me then 1 else 0 end where code = it.code;
  perform jisr_tick();
  return json_build_object('ok', true);
end $$;
create or replace function jisr_owner_action(_code text, _act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items;
begin
  select * into it from jisr_items where code = _code for update;
  if not found or (it.owner <> me and not jisr_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.cancelled or it.status in ('given','cancelled') then return json_build_object('err', 'closed'); end if;
  if _act = 'given' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform jisr_log('given', it.code, it.queue[1]);
    update jisr_items set given = true, given_at = now(), queue = '{}',
      status = case when status = 'reserved' then 'given' else status end where code = it.code;
  elsif _act = 'skip' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform jisr_log('returned', it.code, it.queue[1]);
    update jisr_items set queue = queue[2:], booked_at = now(), cancels = cancels + 1 where code = it.code;
    if it.status = 'reserved' and cardinality(it.queue) = 1 then perform jisr_to_store(it.code, now()); end if;
  elsif _act = 'cancel' then
    perform jisr_log('cancelled', it.code, it.owner);
    update jisr_items set cancelled = true, queue = '{}',
      status = case when status <> 'shown' then 'cancelled' else status end,
      cancelled_at = now() where code = it.code;
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;

-- رقم الإدارة مربوط بإيميل المبادرة، فلا يأخذه غيره
update jisr_profiles set email = 'jisr.alataa@gmail.com' where phone = '96566669594';
