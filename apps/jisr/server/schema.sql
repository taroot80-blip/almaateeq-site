-- =====================================================================
-- جسر العطاء: قاعدة بيانات الخادم (Supabase / PostgreSQL)
-- تُنسخ كلها وتُلصق في: Supabase ← SQL Editor ← New query ← Run
-- يمكن تشغيلها أكثر من مرة دون ضرر.
--
-- المبدأ: لا يقرأ أحد الجداول مباشرة. كل قراءة وكتابة تمر بدوال على الخادم،
-- فيحكم الخادم وحده بمن سبق إلى الكود، ولا يظهر رقم أحد إلا لمن يحق له.
-- =====================================================================

-- ---------- الجداول ----------
create table if not exists jisr_settings (
  id int primary key default 1 check (id = 1),
  cycle_start timestamptz not null default now(),   -- بداية دفعة اليوم الحالية
  slots int not null default 9,                     -- عدد نوافذ المقتنيات
  max_active int not null default 3                 -- أقصى عدد حجوزات نشطة (الأول في الدور) للشخص
);
insert into jisr_settings (id) values (1) on conflict do nothing;

create table if not exists jisr_profiles (
  phone text primary key,                -- بصيغة 9665xxxxxxxx
  user_id uuid unique,
  name text not null default '',
  is_admin boolean not null default false,
  banned boolean not null default false, -- موقوف: لا يحجز ولا يعرض
  created_at timestamptz not null default now()
);

create table if not exists jisr_items (
  code text primary key,                 -- مثل SN-5504
  owner text not null,
  title text not null,
  det text not null default '',
  area text not null,
  cond text not null default '',
  pick text not null default '',
  cat text not null default 'أخرى ومتنوعات',
  icon text not null default 'box',
  photos text[] not null default '{}',   -- روابط الصور في مساحة التخزين
  pick_from text, pick_to text,          -- وقت الاستلام، يُحفظ مرة واحدة
  status text not null default 'waiting' check (status in ('waiting','shown','reserved','given','cancelled')),
  given boolean not null default false,
  cancelled boolean not null default false,
  queue text[] not null default '{}',    -- أرقام الحاجزين بالترتيب: الأول صاحب الحجز
  shows int not null default 0,
  created timestamptz not null default now(),
  shown_at timestamptz, booked_at timestamptz, given_at timestamptz, cancelled_at timestamptz
);
alter table jisr_items add column if not exists cancels int not null default 0;  -- كم مرة أُلغي الحجز الأول
create index if not exists jisr_items_status on jisr_items (status);
create index if not exists jisr_items_owner on jisr_items (owner);

-- سجل الحركة للإحصاء: posted عُرض، booked حُجز، given أُخذ، cancelled أُلغي، returned أُعيد
create table if not exists jisr_events (
  id bigserial primary key,
  t timestamptz not null default now(),
  type text not null,
  code text, who text, area text, cat text
);
create index if not exists jisr_events_t on jisr_events (t);

-- لا وصول مباشر للجداول من التطبيق
alter table jisr_settings enable row level security;
alter table jisr_profiles enable row level security;
alter table jisr_items    enable row level security;
alter table jisr_events   enable row level security;
revoke all on jisr_settings, jisr_profiles, jisr_items, jisr_events from anon, authenticated;

-- ---------- دوال مساعدة ----------
-- رقم المستخدم الحالي الموثّق برسالة التحقق
create or replace function jisr_me() returns text
language sql stable security definer set search_path = public, auth as $$
  select nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '') from auth.users where id = auth.uid()
$$;

create or replace function jisr_is_admin(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from jisr_profiles where phone = p), false)
$$;

create or replace function jisr_log(_type text, _code text, _who text) returns void
language plpgsql security definer set search_path = public as $$
declare a text; c text;
begin
  select coalesce(nullif(trim(split_part(area, '/', 1)), ''), 'غير محدد'), cat into a, c from jisr_items where code = _code;
  insert into jisr_events (type, code, who, area, cat) values (_type, _code, _who, coalesce(a, 'غير محدد'), coalesce(c, 'أخرى ومتنوعات'));
end $$;

-- ما لم يُستلم: يُكتب عليه «أُلغي» ويبقى عند صاحبه
create or replace function jisr_to_store(_code text, _t timestamptz, _log boolean default true) returns void
language plpgsql security definer set search_path = public as $$
declare o text;
begin
  update jisr_items set status = 'cancelled', cancelled_at = coalesce(cancelled_at, _t), queue = '{}' where code = _code returning owner into o;
  if _log then perform jisr_log('cancelled', _code, o); end if;
end $$;

-- ملء النوافذ الفارغة من قائمة الانتظار، الأقدم أولًا
create or replace function jisr_fill(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare free int;
begin
  select s.slots - (select count(*) from jisr_items where status = 'shown') into free from jisr_settings s where id = 1;
  if free > 0 then
    update jisr_items set status = 'shown', shows = shows + 1, shown_at = _t
    where code in (select code from jisr_items where status = 'waiting' order by created limit free);
  end if;
end $$;

-- تجديد الدفعة: ما أُخذ يُثبت، وما حُجز يبقى محجوزًا حتى مهلته، والباقي أُلغي
create or replace function jisr_roll(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from jisr_items where status = 'shown' for update loop
    if r.given then update jisr_items set status = 'given' where code = r.code;
    elsif r.cancelled then perform jisr_to_store(r.code, _t, false); -- سُجّل إلغاؤه حين ألغاه صاحبه
    elsif cardinality(r.queue) > 0 then update jisr_items set status = 'reserved' where code = r.code;
    else perform jisr_to_store(r.code, _t);
    end if;
  end loop;
  update jisr_settings set cycle_start = _t where id = 1;
  perform jisr_fill(_t);
end $$;

-- النبض: يُستدعى كل دقيقة بالجدولة، ومع كل قراءة احتياطًا
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

-- ---------- ما يستدعيه التطبيق ----------
-- حفظ الاسم أو الكنية بعد التحقق من الرقم
create or replace function jisr_set_profile(_name text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me();
begin
  if me is null then return json_build_object('err', 'login'); end if;
  insert into jisr_profiles (phone, user_id, name) values (me, auth.uid(), left(coalesce(trim(_name), ''), 30))
  on conflict (phone) do update set user_id = excluded.user_id,
    name = case when excluded.name <> '' then excluded.name else jisr_profiles.name end;
  return json_build_object('ok', true);
end $$;

-- كل ما تحتاجه الواجهة في طلب واحد. لا يظهر رقم المتبرع إلا له ولصاحب الحجز الأول وللإدارة
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

-- إعلان غرض جديد: الكود يولّده الخادم من بادئة المنطقة
create or replace function jisr_post(_title text, _det text, _area text, _cond text, _pick text, _cat text,
  _photos text[], _pick_from text default null, _pick_to text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); pre text; c text; st text;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from jisr_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  if coalesce(cardinality(_photos), 0) = 0 or coalesce(_title, '') = '' or coalesce(_area, '') = '' then return json_build_object('err', 'missing'); end if;
  pre := coalesce((json_build_object('تاروت','TR','القطيف','QT','سيهات','SN','العوامية','AW','صفوى','SF','الأوجام','AJ',
    'أم الحمام','UH','الجارودية','JR','الجش','JS','أم الساهك','US','القديح','QD','الدمام','DM') ->> trim(split_part(_area, '/', 1))), 'JA');
  loop
    c := pre || '-' || (1000 + floor(random() * 9000))::int;
    exit when not exists (select 1 from jisr_items where code = c);
  end loop;
  insert into jisr_items (code, owner, title, det, area, cond, pick, cat, photos, pick_from, pick_to)
  values (c, me, left(_title, 80), left(coalesce(_det, ''), 400), left(_area, 60), left(coalesce(_cond, ''), 60),
          left(coalesce(_pick, ''), 80), coalesce(nullif(_cat, ''), 'أخرى ومتنوعات'), _photos[1:3], _pick_from, _pick_to);
  perform jisr_log('posted', c, me);
  perform jisr_fill(now());
  select status into st from jisr_items where code = c;
  return json_build_object('ok', true, 'code', c, 'status', st);
end $$;

-- الحجز بالكود: الصف يُقفل، فأول من يصل هو الأول مهما تزامن الإرسال
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
      booked_at = case when cardinality(queue) = 0 then now() else booked_at end
    where code = it.code returning * into it;
    perform jisr_log('booked', it.code, me);
    pos := array_position(it.queue, me);
  end if;
  return json_build_object('ok', true, 'code', it.code, 'pos', pos - 1);
end $$;

-- إلغاء الحاجز لحجزه
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

-- أفعال المتبرع على غرضه: تم التسليم، لم يحضر، ألغِ العرض
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

-- وقت الاستلام: يُحفظ مرة واحدة، ولا يغيّره بعدها إلا الإدارة
create or replace function jisr_set_pick_time(_code text, _from text, _to text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items;
begin
  select * into it from jisr_items where code = _code for update;
  if not found or (it.owner <> me and not jisr_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.pick_from is not null and not jisr_is_admin(me) then return json_build_object('err', 'locked'); end if;
  update jisr_items set pick_from = left(_from, 20), pick_to = left(_to, 20) where code = _code;
  return json_build_object('ok', true);
end $$;

-- ---------- أدوات الإدارة ----------
-- _act: roll (جدّد الدفعة الآن)، wipe (امسح المعروضات)، ban / unban (إيقاف رقم)، admin / unadmin، unlock_time
create or replace function jisr_admin(_act text, _arg text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me();
begin
  if not jisr_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if _act = 'roll' then perform jisr_roll(now());
  elsif _act = 'wipe' then delete from jisr_items where status in ('waiting','shown','reserved');
  elsif _act in ('ban','unban') then
    insert into jisr_profiles (phone) values (_arg) on conflict do nothing;
    update jisr_profiles set banned = (_act = 'ban') where phone = _arg;
  elsif _act in ('admin','unadmin') then
    insert into jisr_profiles (phone) values (_arg) on conflict do nothing;
    update jisr_profiles set is_admin = (_act = 'admin') where phone = _arg and phone <> me;
  elsif _act = 'unlock_time' then update jisr_items set pick_from = null, pick_to = null where code = _arg;
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;

-- صور المعروضات المنتهية منذ أكثر من 7 أيام، لتحذفها الإدارة من التخزين
create or replace function jisr_old_photos() returns json
language plpgsql security definer set search_path = public as $$
begin
  if not jisr_is_admin(jisr_me()) then return json_build_object('err', 'not_admin'); end if;
  return json_build_object('ok', true, 'codes', coalesce((select json_agg(json_build_object('code', code, 'photos', photos))
    from jisr_items where cardinality(photos) > 0 and status in ('given','cancelled')
      and coalesce(given_at, cancelled_at, created) < now() - interval '7 days'), '[]'::json));
end $$;

create or replace function jisr_forget_photos(_codes text[]) returns json
language plpgsql security definer set search_path = public as $$
begin
  if not jisr_is_admin(jisr_me()) then return json_build_object('err', 'not_admin'); end if;
  update jisr_items set photos = '{}' where code = any(_codes) and status in ('given','cancelled');
  return json_build_object('ok', true);
end $$;

-- الصلاحيات: الدوال الداخلية لا يستدعيها التطبيق
revoke execute on function jisr_log(text, text, text), jisr_to_store(text, timestamptz, boolean), jisr_fill(timestamptz),
  jisr_roll(timestamptz), jisr_tick(), jisr_is_admin(text), jisr_me() from public, anon, authenticated;
grant execute on function jisr_board() to anon, authenticated;
grant execute on function jisr_set_profile(text), jisr_post(text, text, text, text, text, text, text[], text, text),
  jisr_book(text), jisr_cancel_booking(text), jisr_owner_action(text, text), jisr_set_pick_time(text, text, text),
  jisr_admin(text, text), jisr_old_photos(), jisr_forget_photos(text[]) to authenticated;

-- ---------- تخزين الصور ----------
-- مجلد عام القراءة؛ كل مستخدم يرفع في مجلده فقط، والإدارة تحذف
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('jisr', 'jisr', true, 1048576, array['image/jpeg','image/webp','image/png'])
    on conflict (id) do nothing;
    drop policy if exists "jisr read" on storage.objects;
    drop policy if exists "jisr upload own" on storage.objects;
    drop policy if exists "jisr admin delete" on storage.objects;
    create policy "jisr read" on storage.objects for select using (bucket_id = 'jisr');
    create policy "jisr upload own" on storage.objects for insert to authenticated
      with check (bucket_id = 'jisr' and (storage.foldername(name))[1] = auth.uid()::text);
    create policy "jisr admin delete" on storage.objects for delete to authenticated
      using (bucket_id = 'jisr' and exists (select 1 from public.jisr_profiles p where p.user_id = auth.uid() and p.is_admin));
  end if;
end $$;

-- ---------- الجدولة كل دقيقة (إن كانت إضافة pg_cron مفعّلة) ----------
do $$ begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.unschedule(jobid) from cron.job where jobname = 'jisr-tick';
    perform cron.schedule('jisr-tick', '* * * * *', 'select public.jisr_tick()');
  end if;
exception when others then raise notice 'الجدولة لم تُفعّل، والنبض يعمل مع كل فتح للتطبيق: %', sqlerrm;
end $$;

-- ---------- الهوية بالإيميل (تحل محل التحقق برسائل الجوال) ----------

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

-- ---------- بعد التشغيل: اجعل رقمك من الإدارة (غيّر الرقم) ----------
-- insert into jisr_profiles (phone, email, is_admin) values ('9665XXXXXXXX', 'name@gmail.com', true)
--   on conflict (phone) do update set is_admin = true, email = excluded.email;
