-- نموذج: قاعدة بيانات الخادم الخاصة به وحده (Supabase مستقل). تُلصق كلها في SQL Editor ثم Run مرة واحدة.
-- =====================================================================
-- نموذج: قاعدة بيانات الخادم (Supabase / PostgreSQL)
-- تُنسخ كلها وتُلصق في: Supabase ← SQL Editor ← New query ← Run
-- يمكن تشغيلها أكثر من مرة دون ضرر.
--
-- المبدأ: لا يقرأ أحد الجداول مباشرة. كل قراءة وكتابة تمر بدوال على الخادم،
-- فيحكم الخادم وحده بمن سبق إلى الكود، ولا يظهر رقم أحد إلا لمن يحق له.
-- =====================================================================

-- ---------- الجداول ----------
create table if not exists nmj_settings (
  id int primary key default 1 check (id = 1),
  cycle_start timestamptz not null default now(),   -- بداية دفعة اليوم الحالية
  slots int not null default 9,                     -- عدد نوافذ المقتنيات
  max_active int not null default 3                 -- أقصى عدد حجوزات نشطة (الأول في الدور) للشخص
);
insert into nmj_settings (id) values (1) on conflict do nothing;
-- أين تُنشر المعروضات: المنصة فقط، أو واتساب فقط، أو كلاهما (تتحكم فيه الإدارة)
alter table nmj_settings add column if not exists wa_mode text not null default 'both';

create table if not exists nmj_profiles (
  phone text primary key,                -- بصيغة 9665xxxxxxxx
  user_id uuid unique,
  name text not null default '',
  is_admin boolean not null default false,
  banned boolean not null default false, -- موقوف: لا يحجز ولا يعرض
  created_at timestamptz not null default now()
);

create table if not exists nmj_items (
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
alter table nmj_items add column if not exists cancels int not null default 0;  -- كم مرة أُلغي الحجز الأول
alter table nmj_items add column if not exists wa_sent_at timestamptz;          -- متى نُشر في مجموعة واتساب (مرة واحدة)
create index if not exists nmj_items_status on nmj_items (status);
create index if not exists nmj_items_owner on nmj_items (owner);

-- سجل الحركة للإحصاء: posted عُرض، booked حُجز، given أُخذ، cancelled أُلغي، returned أُعيد
create table if not exists nmj_events (
  id bigserial primary key,
  t timestamptz not null default now(),
  type text not null,
  code text, who text, area text, cat text
);
create index if not exists nmj_events_t on nmj_events (t);

-- لا وصول مباشر للجداول من التطبيق
alter table nmj_settings enable row level security;
alter table nmj_profiles enable row level security;
alter table nmj_items    enable row level security;
alter table nmj_events   enable row level security;
revoke all on nmj_settings, nmj_profiles, nmj_items, nmj_events from anon, authenticated;

-- ---------- دوال مساعدة ----------
-- رقم المستخدم الحالي الموثّق برسالة التحقق
create or replace function nmj_me() returns text
language sql stable security definer set search_path = public, auth as $$
  select nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), '') from auth.users where id = auth.uid()
$$;

create or replace function nmj_is_admin(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from nmj_profiles where phone = p), false)
$$;

create or replace function nmj_log(_type text, _code text, _who text) returns void
language plpgsql security definer set search_path = public as $$
declare a text; c text;
begin
  select coalesce(nullif(trim(split_part(area, '/', 1)), ''), 'غير محدد'), cat into a, c from nmj_items where code = _code;
  insert into nmj_events (type, code, who, area, cat) values (_type, _code, _who, coalesce(a, 'غير محدد'), coalesce(c, 'أخرى ومتنوعات'));
end $$;

-- ما لم يُستلم: يُكتب عليه «أُلغي» ويبقى عند صاحبه
create or replace function nmj_to_store(_code text, _t timestamptz, _log boolean default true) returns void
language plpgsql security definer set search_path = public as $$
declare o text;
begin
  update nmj_items set status = 'cancelled', cancelled_at = coalesce(cancelled_at, _t), queue = '{}' where code = _code returning owner into o;
  if _log then perform nmj_log('cancelled', _code, o); end if;
end $$;

-- ملء النوافذ الفارغة من قائمة الانتظار، الأقدم أولًا
create or replace function nmj_fill(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare free int;
begin
  select s.slots - (select count(*) from nmj_items where status = 'shown') into free from nmj_settings s where id = 1;
  if free > 0 then
    update nmj_items set status = 'shown', shows = shows + 1, shown_at = _t
    where code in (select code from nmj_items where status = 'waiting' order by created limit free);
  end if;
end $$;

-- تجديد الدفعة: ما أُخذ يُثبت، وما حُجز يبقى محجوزًا حتى مهلته، والباقي أُلغي
create or replace function nmj_roll(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from nmj_items where status = 'shown' for update loop
    if r.given then update nmj_items set status = 'given' where code = r.code;
    elsif r.cancelled then perform nmj_to_store(r.code, _t, false); -- سُجّل إلغاؤه حين ألغاه صاحبه
    elsif cardinality(r.queue) > 0 then update nmj_items set status = 'reserved' where code = r.code;
    else perform nmj_to_store(r.code, _t);
    end if;
  end loop;
  update nmj_settings set cycle_start = _t where id = 1;
  perform nmj_fill(_t);
end $$;

-- النبض: يُستدعى كل دقيقة بالجدولة، ومع كل قراءة احتياطًا
create or replace function nmj_tick() returns void
language plpgsql security definer set search_path = public as $$
declare cs timestamptz; r record;
begin
  perform pg_advisory_xact_lock(4460);  -- لا يعمل نبضان في الوقت نفسه
  loop
    select cycle_start into cs from nmj_settings where id = 1;
    exit when now() < cs + interval '1 day';
    perform nmj_roll(cs + interval '1 day');
  end loop;
  -- انتهاء مهلة الاستلام (24 ساعة) ينقل الحجز لمن بعده
  for r in select * from nmj_items where status in ('shown','reserved') and not given and not cancelled for update loop
    while cardinality(r.queue) > 0 and now() - r.booked_at > interval '1 day' loop
      perform nmj_log('returned', r.code, r.queue[1]);
      r.queue := r.queue[2:]; r.booked_at := r.booked_at + interval '1 day'; r.cancels := r.cancels + 1;
    end loop;
    update nmj_items set queue = r.queue, booked_at = r.booked_at, cancels = r.cancels where code = r.code;
    if r.status = 'reserved' and cardinality(r.queue) = 0 then perform nmj_to_store(r.code, now()); end if;
  end loop;
  perform nmj_fill(now());
end $$;

-- ---------- ما يستدعيه التطبيق ----------
-- حفظ الاسم أو الكنية بعد التحقق من الرقم
create or replace function nmj_set_profile(_name text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me();
begin
  if me is null then return json_build_object('err', 'login'); end if;
  insert into nmj_profiles (phone, user_id, name) values (me, auth.uid(), left(coalesce(trim(_name), ''), 30))
  on conflict (phone) do update set user_id = excluded.user_id,
    name = case when excluded.name <> '' then excluded.name else nmj_profiles.name end;
  return json_build_object('ok', true);
end $$;

-- كل ما تحتاجه الواجهة في طلب واحد. لا يظهر رقم المتبرع إلا له ولصاحب الحجز الأول وللإدارة
create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned) into prof from nmj_profiles where phone = me;
  select json_build_object(
    'serverNow', floor(extract(epoch from now()) * 1000),
    'cycleStart', floor(extract(epoch from s.cycle_start) * 1000),
    'slots', s.slots, 'me', me, 'profile', prof, 'waMode', s.wa_mode,
    'items', coalesce((select json_agg(json_build_object(
        'code', i.code, 'title', i.title, 'det', i.det, 'area', i.area, 'cond', i.cond, 'pick', i.pick,
        'cat', i.cat, 'icon', i.icon, 'photos', i.photos,
        'pickTime', case when i.pick_from is null then null else json_build_object('from', i.pick_from, 'to', i.pick_to) end,
        'status', i.status, 'given', i.given, 'cancelled', i.cancelled, 'shows', i.shows, 'cancels', i.cancels, 'waSent', case when adm or i.owner = me then i.wa_sent_at is not null end,
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'owner', case when adm or i.owner = me or i.queue[1] = me then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or i.owner = me then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end
      ) order by i.created)
      from nmj_items i
      where (i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;

-- إعلان غرض جديد: الكود يولّده الخادم من بادئة المنطقة
create or replace function nmj_post(_title text, _det text, _area text, _cond text, _pick text, _cat text,
  _photos text[], _pick_from text default null, _pick_to text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); pre text; c text; st text;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from nmj_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  if coalesce(cardinality(_photos), 0) = 0 or coalesce(_title, '') = '' or coalesce(_area, '') = '' then return json_build_object('err', 'missing'); end if;
  pre := coalesce((json_build_object('تاروت','TR','القطيف','QT','سيهات','SN','العوامية','AW','صفوى','SF','الأوجام','AJ',
    'أم الحمام','UH','الجارودية','JR','الجش','JS','أم الساهك','US','القديح','QD','الدمام','DM') ->> trim(split_part(_area, '/', 1))), 'JA');
  loop
    c := pre || '-' || (1000 + floor(random() * 9000))::int;
    exit when not exists (select 1 from nmj_items where code = c);
  end loop;
  insert into nmj_items (code, owner, title, det, area, cond, pick, cat, photos, pick_from, pick_to)
  values (c, me, left(_title, 80), left(coalesce(_det, ''), 400), left(_area, 60), left(coalesce(_cond, ''), 60),
          left(coalesce(_pick, ''), 80), coalesce(nullif(_cat, ''), 'أخرى ومتنوعات'), _photos[1:3], _pick_from, _pick_to);
  perform nmj_log('posted', c, me);
  perform nmj_fill(now());
  select status into st from nmj_items where code = c;
  return json_build_object('ok', true, 'code', c, 'status', st);
end $$;

-- الحجز بالكود: الصف يُقفل، فأول من يصل هو الأول مهما تزامن الإرسال
create or replace function nmj_book(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items; pos int; act int; mx int;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from nmj_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  perform nmj_tick();
  select * into it from nmj_items where code = upper(trim(_code)) for update;
  if not found then return json_build_object('err', 'not_found'); end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'cancelled'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'given'); end if;
  if it.owner = me then return json_build_object('err', 'own'); end if;
  pos := array_position(it.queue, me);
  if pos is null then
    if it.status <> 'shown' then return json_build_object('err', 'not_shown'); end if;
    if cardinality(it.queue) = 0 then
      select max_active into mx from nmj_settings where id = 1;
      select count(*) into act from nmj_items where queue[1] = me and not given and not cancelled and status in ('shown','reserved');
      if act >= mx then return json_build_object('err', 'limit', 'max', mx); end if;
    end if;
    update nmj_items set queue = array_append(queue, me),
      booked_at = case when cardinality(queue) = 0 then now() else booked_at end
    where code = it.code returning * into it;
    perform nmj_log('booked', it.code, me);
    pos := array_position(it.queue, me);
  end if;
  return json_build_object('ok', true, 'code', it.code, 'pos', pos - 1);
end $$;

-- إلغاء الحاجز لحجزه
create or replace function nmj_cancel_booking(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items;
begin
  select * into it from nmj_items where code = _code for update;
  if not found or not (me = any(it.queue)) then return json_build_object('err', 'not_found'); end if;
  perform nmj_log('returned', it.code, me);
  -- صاحب الأحقية الأولى تنازل: يُعدّ إلغاءً، ومن أراده بعدها عاد آخر الطابور
  update nmj_items set queue = array_remove(queue, me),
    booked_at = case when queue[1] = me then now() else booked_at end,
    cancels = cancels + case when queue[1] = me then 1 else 0 end where code = it.code;
  perform nmj_tick();
  return json_build_object('ok', true);
end $$;

-- أفعال المتبرع على غرضه: تم التسليم، لم يحضر، ألغِ العرض
create or replace function nmj_owner_action(_code text, _act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items;
begin
  select * into it from nmj_items where code = _code for update;
  if not found or (it.owner <> me and not nmj_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.cancelled or it.status in ('given','cancelled') then return json_build_object('err', 'closed'); end if;
  if _act = 'given' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform nmj_log('given', it.code, it.queue[1]);
    update nmj_items set given = true, given_at = now(), queue = '{}',
      status = case when status = 'reserved' then 'given' else status end where code = it.code;
  elsif _act = 'skip' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform nmj_log('returned', it.code, it.queue[1]);
    update nmj_items set queue = queue[2:], booked_at = now(), cancels = cancels + 1 where code = it.code;
    if it.status = 'reserved' and cardinality(it.queue) = 1 then perform nmj_to_store(it.code, now()); end if;
  elsif _act = 'cancel' then
    perform nmj_log('cancelled', it.code, it.owner);
    update nmj_items set cancelled = true, queue = '{}',
      status = case when status <> 'shown' then 'cancelled' else status end,
      cancelled_at = now() where code = it.code;
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;

-- وقت الاستلام: يُحفظ مرة واحدة، ولا يغيّره بعدها إلا الإدارة
create or replace function nmj_set_pick_time(_code text, _from text, _to text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items;
begin
  select * into it from nmj_items where code = _code for update;
  if not found or (it.owner <> me and not nmj_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.pick_from is not null and not nmj_is_admin(me) then return json_build_object('err', 'locked'); end if;
  update nmj_items set pick_from = left(_from, 20), pick_to = left(_to, 20) where code = _code;
  return json_build_object('ok', true);
end $$;

-- ---------- أدوات الإدارة ----------
-- _act: roll (جدّد الدفعة الآن)، wipe (امسح المعروضات)، ban / unban (إيقاف رقم)، admin / unadmin، unlock_time
create or replace function nmj_admin(_act text, _arg text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me();
begin
  if not nmj_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if _act = 'roll' then perform nmj_roll(now());
  elsif _act = 'wipe' then delete from nmj_items where status in ('waiting','shown','reserved');
  elsif _act in ('ban','unban') then
    insert into nmj_profiles (phone) values (_arg) on conflict do nothing;
    update nmj_profiles set banned = (_act = 'ban') where phone = _arg;
  elsif _act in ('admin','unadmin') then
    insert into nmj_profiles (phone) values (_arg) on conflict do nothing;
    update nmj_profiles set is_admin = (_act = 'admin') where phone = _arg and phone <> me;
  elsif _act = 'unlock_time' then update nmj_items set pick_from = null, pick_to = null where code = _arg;
  elsif _act = 'wa_mode' then
    if _arg not in ('platform','whatsapp','both') then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set wa_mode = _arg where id = 1;
  elsif _act = 'wa_sent' then update nmj_items set wa_sent_at = coalesce(wa_sent_at, now()) where code = _arg;
  elsif _act = 'remove' then  -- إزالة إعلان خاطئ أو مشتبه به نهائيًا
    perform nmj_log('removed', _arg, me);
    delete from nmj_items where code = _arg;
    perform nmj_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;

-- صور المعروضات المنتهية منذ أكثر من 7 أيام، لتحذفها الإدارة من التخزين
create or replace function nmj_old_photos() returns json
language plpgsql security definer set search_path = public as $$
begin
  if not nmj_is_admin(nmj_me()) then return json_build_object('err', 'not_admin'); end if;
  return json_build_object('ok', true, 'codes', coalesce((select json_agg(json_build_object('code', code, 'photos', photos))
    from nmj_items where cardinality(photos) > 0 and status in ('given','cancelled')
      and coalesce(given_at, cancelled_at, created) < now() - interval '7 days'), '[]'::json));
end $$;

create or replace function nmj_forget_photos(_codes text[]) returns json
language plpgsql security definer set search_path = public as $$
begin
  if not nmj_is_admin(nmj_me()) then return json_build_object('err', 'not_admin'); end if;
  update nmj_items set photos = '{}' where code = any(_codes) and status in ('given','cancelled');
  return json_build_object('ok', true);
end $$;

-- الصلاحيات: الدوال الداخلية لا يستدعيها التطبيق
revoke execute on function nmj_log(text, text, text), nmj_to_store(text, timestamptz, boolean), nmj_fill(timestamptz),
  nmj_roll(timestamptz), nmj_tick(), nmj_is_admin(text), nmj_me() from public, anon, authenticated;
grant execute on function nmj_board() to anon, authenticated;
grant execute on function nmj_set_profile(text), nmj_post(text, text, text, text, text, text, text[], text, text),
  nmj_book(text), nmj_cancel_booking(text), nmj_owner_action(text, text), nmj_set_pick_time(text, text, text),
  nmj_admin(text, text), nmj_old_photos(), nmj_forget_photos(text[]) to authenticated;

-- ---------- تخزين الصور ----------
-- مجلد عام القراءة؛ كل مستخدم يرفع في مجلده فقط، والإدارة تحذف
do $$ begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('nmj', 'nmj', true, 1048576, array['image/jpeg','image/webp','image/png'])
    on conflict (id) do nothing;
    drop policy if exists "nmj read" on storage.objects;
    drop policy if exists "nmj upload own" on storage.objects;
    drop policy if exists "nmj admin delete" on storage.objects;
    create policy "nmj read" on storage.objects for select using (bucket_id = 'nmj');
    create policy "nmj upload own" on storage.objects for insert to authenticated
      with check (bucket_id = 'nmj' and (storage.foldername(name))[1] = auth.uid()::text);
    create policy "nmj admin delete" on storage.objects for delete to authenticated
      using (bucket_id = 'nmj' and exists (select 1 from public.nmj_profiles p where p.user_id = auth.uid() and p.is_admin));
  end if;
end $$;

-- ---------- الجدولة كل دقيقة (إن كانت إضافة pg_cron مفعّلة) ----------
do $$ begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.unschedule(jobid) from cron.job where jobname = 'nmj-tick';
    perform cron.schedule('nmj-tick', '* * * * *', 'select public.nmj_tick()');
  end if;
exception when others then raise notice 'الجدولة لم تُفعّل، والنبض يعمل مع كل فتح للتطبيق: %', sqlerrm;
end $$;

-- ---------- الهوية بالإيميل (تحل محل التحقق برسائل الجوال) ----------

alter table nmj_profiles add column if not exists email text;

-- رقم المستخدم الحالي: من ملفه المرتبط بحسابه (الإيميل الموثّق)
create or replace function nmj_me() returns text
language sql stable security definer set search_path = public as $$
  select phone from public.nmj_profiles where user_id = auth.uid() limit 1
$$;

-- إكمال البيانات أول مرة: الاسم ورقم واتساب. الرقم لا يأخذه إلا صاحبه
drop function if exists nmj_set_profile(text);
create or replace function nmj_set_profile(_name text, _phone text default null) returns json
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); em text; p text; cur nmj_profiles;
begin
  if uid is null then return json_build_object('err', 'login'); end if;
  select lower(email) into em from auth.users where id = uid;
  select * into cur from nmj_profiles where user_id = uid;
  if found then
    update nmj_profiles set email = em,
      name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end
    where user_id = uid;
    return json_build_object('ok', true, 'phone', cur.phone);
  end if;
  p := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  if p !~ '^\d{10,13}$' then return json_build_object('err', 'bad_phone'); end if;
  -- رقم مسجّل لحساب آخر، أو حجزته الإدارة لإيميل آخر
  if exists (select 1 from nmj_profiles where phone = p and
      ((user_id is not null and user_id <> uid) or (email is not null and email <> em))) then
    return json_build_object('err', 'phone_taken');
  end if;
  insert into nmj_profiles (phone, user_id, email, name) values (p, uid, em, left(coalesce(trim(_name), ''), 30))
  on conflict (phone) do update set user_id = uid, email = em,
    name = case when excluded.name <> '' then excluded.name else nmj_profiles.name end;
  return json_build_object('ok', true, 'phone', p);
end $$;
grant execute on function nmj_set_profile(text, text) to authenticated;

-- اللوحة: تخبر الواجهة إن كان المستخدم دخل بإيميله ولم يكمل رقمه بعد
create or replace function nmj_board_auth() returns json
language plpgsql security definer set search_path = public as $$
begin
  return json_build_object('signedIn', auth.uid() is not null,
    'needProfile', auth.uid() is not null and not exists (select 1 from nmj_profiles where user_id = auth.uid()),
    'email', (select email from auth.users where id = auth.uid()));
end $$;
grant execute on function nmj_board_auth() to anon, authenticated;


-- ---------- الإعلان: الصورة اختيارية، والبادئة من المنطقة والحي ----------
drop function if exists nmj_post(text, text, text, text, text, text, text[], text, text);
create or replace function nmj_post(_title text, _det text, _area text, _cond text, _pick text, _cat text,
  _photos text[] default '{}', _pick_from text default null, _pick_to text default null, _prefix text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); pre text; c text; st text;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from nmj_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  if coalesce(_title, '') = '' or coalesce(_area, '') = '' then return json_build_object('err', 'missing'); end if;
  pre := case when upper(coalesce(_prefix, '')) ~ '^[A-Z]{2}$' then upper(_prefix) else
    coalesce((json_build_object('تاروت','TR','القطيف','QT','سيهات','SN','العوامية','AW','صفوى','SF','الأوجام','AJ',
      'أم الحمام','UH','الجارودية','JR','الجش','JS','أم الساهك','US','القديح','QD','الدمام','DM') ->> trim(split_part(_area, '/', 1))), 'JA') end;
  loop
    c := pre || '-' || (1000 + floor(random() * 9000))::int;
    exit when not exists (select 1 from nmj_items where code = c);
  end loop;
  insert into nmj_items (code, owner, title, det, area, cond, pick, cat, photos, pick_from, pick_to)
  values (c, me, left(_title, 80), left(coalesce(_det, ''), 400), left(_area, 60), left(coalesce(_cond, ''), 60),
          left(coalesce(_pick, ''), 80), coalesce(nullif(_cat, ''), 'أخرى ومتنوعات'), (coalesce(_photos, '{}'))[1:3], _pick_from, _pick_to);
  perform nmj_log('posted', c, me);
  perform nmj_fill(now());
  select status into st from nmj_items where code = c;
  return json_build_object('ok', true, 'code', c, 'status', st);
end $$;
grant execute on function nmj_post(text, text, text, text, text, text, text[], text, text, text) to authenticated;

-- ---------- بعد التشغيل: اجعل رقمك من الإدارة (غيّر الرقم) ----------
-- insert into nmj_profiles (phone, email, is_admin) values ('9665XXXXXXXX', 'name@gmail.com', true)
--   on conflict (phone) do update set is_admin = true, email = excluded.email;
-- =====================================================================
-- نموذج: التحقق بالإيميل بدل رسائل الجوال، والإعلان بلا صورة وبالحي، وعدّاد إلغاء الحجز، والتحكم في النشر بواتساب
-- الهوية = الإيميل (يصله رمز التحقق)، ورقم الجوال للتواصل الكتابي عبر واتساب فقط.
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================

alter table nmj_profiles add column if not exists email text;

-- رقم المستخدم الحالي: من ملفه المرتبط بحسابه (الإيميل الموثّق)
create or replace function nmj_me() returns text
language sql stable security definer set search_path = public as $$
  select phone from public.nmj_profiles where user_id = auth.uid() limit 1
$$;

-- إكمال البيانات أول مرة: الاسم ورقم واتساب. الرقم لا يأخذه إلا صاحبه
drop function if exists nmj_set_profile(text);
create or replace function nmj_set_profile(_name text, _phone text default null) returns json
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); em text; p text; cur nmj_profiles;
begin
  if uid is null then return json_build_object('err', 'login'); end if;
  select lower(email) into em from auth.users where id = uid;
  select * into cur from nmj_profiles where user_id = uid;
  if found then
    update nmj_profiles set email = em,
      name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end
    where user_id = uid;
    return json_build_object('ok', true, 'phone', cur.phone);
  end if;
  p := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  if p !~ '^\d{10,13}$' then return json_build_object('err', 'bad_phone'); end if;
  -- رقم مسجّل لحساب آخر، أو حجزته الإدارة لإيميل آخر
  if exists (select 1 from nmj_profiles where phone = p and
      ((user_id is not null and user_id <> uid) or (email is not null and email <> em))) then
    return json_build_object('err', 'phone_taken');
  end if;
  insert into nmj_profiles (phone, user_id, email, name) values (p, uid, em, left(coalesce(trim(_name), ''), 30))
  on conflict (phone) do update set user_id = uid, email = em,
    name = case when excluded.name <> '' then excluded.name else nmj_profiles.name end;
  return json_build_object('ok', true, 'phone', p);
end $$;
grant execute on function nmj_set_profile(text, text) to authenticated;

-- اللوحة: تخبر الواجهة إن كان المستخدم دخل بإيميله ولم يكمل رقمه بعد
create or replace function nmj_board_auth() returns json
language plpgsql security definer set search_path = public as $$
begin
  return json_build_object('signedIn', auth.uid() is not null,
    'needProfile', auth.uid() is not null and not exists (select 1 from nmj_profiles where user_id = auth.uid()),
    'email', (select email from auth.users where id = auth.uid()));
end $$;
grant execute on function nmj_board_auth() to anon, authenticated;

-- ---------- الإعلان: الصورة اختيارية، والبادئة من المنطقة والحي ----------
drop function if exists nmj_post(text, text, text, text, text, text, text[], text, text);
create or replace function nmj_post(_title text, _det text, _area text, _cond text, _pick text, _cat text,
  _photos text[] default '{}', _pick_from text default null, _pick_to text default null, _prefix text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); pre text; c text; st text;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from nmj_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  if coalesce(_title, '') = '' or coalesce(_area, '') = '' then return json_build_object('err', 'missing'); end if;
  pre := case when upper(coalesce(_prefix, '')) ~ '^[A-Z]{2}$' then upper(_prefix) else
    coalesce((json_build_object('تاروت','TR','القطيف','QT','سيهات','SN','العوامية','AW','صفوى','SF','الأوجام','AJ',
      'أم الحمام','UH','الجارودية','JR','الجش','JS','أم الساهك','US','القديح','QD','الدمام','DM') ->> trim(split_part(_area, '/', 1))), 'JA') end;
  loop
    c := pre || '-' || (1000 + floor(random() * 9000))::int;
    exit when not exists (select 1 from nmj_items where code = c);
  end loop;
  insert into nmj_items (code, owner, title, det, area, cond, pick, cat, photos, pick_from, pick_to)
  values (c, me, left(_title, 80), left(coalesce(_det, ''), 400), left(_area, 60), left(coalesce(_cond, ''), 60),
          left(coalesce(_pick, ''), 80), coalesce(nullif(_cat, ''), 'أخرى ومتنوعات'), (coalesce(_photos, '{}'))[1:3], _pick_from, _pick_to);
  perform nmj_log('posted', c, me);
  perform nmj_fill(now());
  select status into st from nmj_items where code = c;
  return json_build_object('ok', true, 'code', c, 'status', st);
end $$;
grant execute on function nmj_post(text, text, text, text, text, text, text[], text, text, text) to authenticated;

-- ---------- عدّاد «أُلغي الحجز» وطابور الأحقية ----------
alter table nmj_items add column if not exists cancels int not null default 0;
create or replace function nmj_tick() returns void
language plpgsql security definer set search_path = public as $$
declare cs timestamptz; r record;
begin
  perform pg_advisory_xact_lock(4460);  -- لا يعمل نبضان في الوقت نفسه
  loop
    select cycle_start into cs from nmj_settings where id = 1;
    exit when now() < cs + interval '1 day';
    perform nmj_roll(cs + interval '1 day');
  end loop;
  -- انتهاء مهلة الاستلام (24 ساعة) ينقل الحجز لمن بعده
  for r in select * from nmj_items where status in ('shown','reserved') and not given and not cancelled for update loop
    while cardinality(r.queue) > 0 and now() - r.booked_at > interval '1 day' loop
      perform nmj_log('returned', r.code, r.queue[1]);
      r.queue := r.queue[2:]; r.booked_at := r.booked_at + interval '1 day'; r.cancels := r.cancels + 1;
    end loop;
    update nmj_items set queue = r.queue, booked_at = r.booked_at, cancels = r.cancels where code = r.code;
    if r.status = 'reserved' and cardinality(r.queue) = 0 then perform nmj_to_store(r.code, now()); end if;
  end loop;
  perform nmj_fill(now());
end $$;
create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned) into prof from nmj_profiles where phone = me;
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
      from nmj_items i
      where i.status = 'shown' or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;
create or replace function nmj_cancel_booking(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items;
begin
  select * into it from nmj_items where code = _code for update;
  if not found or not (me = any(it.queue)) then return json_build_object('err', 'not_found'); end if;
  perform nmj_log('returned', it.code, me);
  -- صاحب الأحقية الأولى تنازل: يُعدّ إلغاءً، ومن أراده بعدها عاد آخر الطابور
  update nmj_items set queue = array_remove(queue, me),
    booked_at = case when queue[1] = me then now() else booked_at end,
    cancels = cancels + case when queue[1] = me then 1 else 0 end where code = it.code;
  perform nmj_tick();
  return json_build_object('ok', true);
end $$;
create or replace function nmj_owner_action(_code text, _act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items;
begin
  select * into it from nmj_items where code = _code for update;
  if not found or (it.owner <> me and not nmj_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.cancelled or it.status in ('given','cancelled') then return json_build_object('err', 'closed'); end if;
  if _act = 'given' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform nmj_log('given', it.code, it.queue[1]);
    update nmj_items set given = true, given_at = now(), queue = '{}',
      status = case when status = 'reserved' then 'given' else status end where code = it.code;
  elsif _act = 'skip' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform nmj_log('returned', it.code, it.queue[1]);
    update nmj_items set queue = queue[2:], booked_at = now(), cancels = cancels + 1 where code = it.code;
    if it.status = 'reserved' and cardinality(it.queue) = 1 then perform nmj_to_store(it.code, now()); end if;
  elsif _act = 'cancel' then
    perform nmj_log('cancelled', it.code, it.owner);
    update nmj_items set cancelled = true, queue = '{}',
      status = case when status <> 'shown' then 'cancelled' else status end,
      cancelled_at = now() where code = it.code;
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;

-- ---------- النشر في واتساب: المنصة / واتساب / كلاهما، ونشر كل غرض مرة واحدة ----------
alter table nmj_settings add column if not exists wa_mode text not null default 'both';
alter table nmj_items add column if not exists wa_sent_at timestamptz;
create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned) into prof from nmj_profiles where phone = me;
  select json_build_object(
    'serverNow', floor(extract(epoch from now()) * 1000),
    'cycleStart', floor(extract(epoch from s.cycle_start) * 1000),
    'slots', s.slots, 'me', me, 'profile', prof, 'waMode', s.wa_mode,
    'items', coalesce((select json_agg(json_build_object(
        'code', i.code, 'title', i.title, 'det', i.det, 'area', i.area, 'cond', i.cond, 'pick', i.pick,
        'cat', i.cat, 'icon', i.icon, 'photos', i.photos,
        'pickTime', case when i.pick_from is null then null else json_build_object('from', i.pick_from, 'to', i.pick_to) end,
        'status', i.status, 'given', i.given, 'cancelled', i.cancelled, 'shows', i.shows, 'cancels', i.cancels, 'waSent', case when adm or i.owner = me then i.wa_sent_at is not null end,
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'owner', case when adm or i.owner = me or i.queue[1] = me then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or i.owner = me then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end
      ) order by i.created)
      from nmj_items i
      where (i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;
create or replace function nmj_admin(_act text, _arg text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me();
begin
  if not nmj_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if _act = 'roll' then perform nmj_roll(now());
  elsif _act = 'wipe' then delete from nmj_items where status in ('waiting','shown','reserved');
  elsif _act in ('ban','unban') then
    insert into nmj_profiles (phone) values (_arg) on conflict do nothing;
    update nmj_profiles set banned = (_act = 'ban') where phone = _arg;
  elsif _act in ('admin','unadmin') then
    insert into nmj_profiles (phone) values (_arg) on conflict do nothing;
    update nmj_profiles set is_admin = (_act = 'admin') where phone = _arg and phone <> me;
  elsif _act = 'unlock_time' then update nmj_items set pick_from = null, pick_to = null where code = _arg;
  elsif _act = 'wa_mode' then
    if _arg not in ('platform','whatsapp','both') then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set wa_mode = _arg where id = 1;
  elsif _act = 'wa_sent' then update nmj_items set wa_sent_at = coalesce(wa_sent_at, now()) where code = _arg;
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;

-- رقم الإدارة مربوط بإيميل المبادرة، فلا يأخذه غيره
-- (حُذف ربط إيميل مدير جسر العطاء: نموذج يبدأ بلا مدير، ويُضاف مديره بالسطر المعلّق في أول الملف)
-- =====================================================================
-- نموذج: تحديث 5 — يشمل تحديثَي 3 و4، فيكفي تشغيله وحده.
-- ما انتهى يومه ولم يُحجز لا يُحذف تلقائيًا: يبقى يومض، ولصاحبه وللإدارة «جدّد» أو «احذف».
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
alter table nmj_items add column if not exists expired boolean not null default false;
alter table nmj_settings add column if not exists exp_mode text not null default 'flash';

-- ما انتهى وقته لا يشغل نافذة، فتمتلئ النوافذ من قائمة الانتظار
create or replace function nmj_fill(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare free int;
begin
  select s.slots - (select count(*) from nmj_items where status = 'shown' and not expired and not cancelled) into free from nmj_settings s where id = 1;
  if free > 0 then
    update nmj_items set status = 'shown', shows = shows + 1, shown_at = _t
    where code in (select code from nmj_items where status = 'waiting' order by created limit free);
  end if;
end $$;

create or replace function nmj_clear_expired() returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select code from nmj_items where status = 'shown' and expired and not given and not cancelled and cardinality(queue) = 0 for update loop
    perform nmj_to_store(r.code, now());
    update nmj_items set expired = false where code = r.code;
  end loop;
end $$;

create or replace function nmj_roll(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare r record; m text;
begin
  select exp_mode into m from nmj_settings where id = 1;
  for r in select * from nmj_items where status = 'shown' for update loop
    if r.given then update nmj_items set status = 'given', expired = false where code = r.code;
    elsif r.cancelled then perform nmj_to_store(r.code, _t, false);
    elsif cardinality(r.queue) > 0 then update nmj_items set status = 'reserved', expired = false where code = r.code;
    elsif m = 'flash' then update nmj_items set expired = true where code = r.code;  -- يبقى ويومض
    else perform nmj_to_store(r.code, _t);
    end if;
  end loop;
  update nmj_settings set cycle_start = _t where id = 1;
  perform nmj_fill(_t);
end $$;

create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned) into prof from nmj_profiles where phone = me;
  select json_build_object(
    'serverNow', floor(extract(epoch from now()) * 1000),
    'cycleStart', floor(extract(epoch from s.cycle_start) * 1000),
    'slots', s.slots, 'me', me, 'profile', prof, 'waMode', s.wa_mode, 'expMode', s.exp_mode,
    'items', coalesce((select json_agg(json_build_object(
        'code', i.code, 'title', i.title, 'det', i.det, 'area', i.area, 'cond', i.cond, 'pick', i.pick,
        'cat', i.cat, 'icon', i.icon, 'photos', i.photos,
        'pickTime', case when i.pick_from is null then null else json_build_object('from', i.pick_from, 'to', i.pick_to) end,
        'status', i.status, 'given', i.given, 'cancelled', i.cancelled, 'shows', i.shows, 'cancels', i.cancels, 'expired', i.expired, 'waSent', case when adm or i.owner = me then i.wa_sent_at is not null end,
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'owner', case when adm or i.owner = me or i.queue[1] = me then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or i.owner = me then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end
      ) order by i.created)
      from nmj_items i
      where (i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;

create or replace function nmj_admin(_act text, _arg text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me();
begin
  if not nmj_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if _act = 'roll' then perform nmj_roll(now());
  elsif _act = 'wipe' then delete from nmj_items where status in ('waiting','shown','reserved');
  elsif _act in ('ban','unban') then
    insert into nmj_profiles (phone) values (_arg) on conflict do nothing;
    update nmj_profiles set banned = (_act = 'ban') where phone = _arg;
  elsif _act in ('admin','unadmin') then
    insert into nmj_profiles (phone) values (_arg) on conflict do nothing;
    update nmj_profiles set is_admin = (_act = 'admin') where phone = _arg and phone <> me;
  elsif _act = 'unlock_time' then update nmj_items set pick_from = null, pick_to = null where code = _arg;
  elsif _act = 'wa_mode' then
    if _arg not in ('platform','whatsapp','both') then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set wa_mode = _arg where id = 1;
  elsif _act = 'wa_sent' then update nmj_items set wa_sent_at = coalesce(wa_sent_at, now()) where code = _arg;
  elsif _act = 'exp_mode' then  -- ما انتهى وقته: يومض حتى يقرر صاحبه، أو يُلغى تلقائيًا
    if _arg not in ('flash','auto') then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set exp_mode = _arg where id = 1;
    if _arg = 'auto' then perform nmj_clear_expired(); end if;
  elsif _act = 'clear_expired' then perform nmj_clear_expired();
  elsif _act = 'remove' then  -- إزالة إعلان خاطئ أو مشتبه به نهائيًا
    perform nmj_log('removed', _arg, me);
    delete from nmj_items where code = _arg;
    perform nmj_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;

create or replace function nmj_owner_action(_code text, _act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items;
begin
  select * into it from nmj_items where code = _code for update;
  if not found or (it.owner <> me and not nmj_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'closed'); end if;
  -- إعادة عرض ما أُلغي: يعود إلى قائمة الانتظار بالرمز نفسه، ويُنشر في واتساب مرة جديدة
  if _act = 'relist' then
    if it.expired and not it.cancelled and it.status = 'shown' then  -- تجديد ما انتهى وقته ليوم جديد
      update nmj_items set expired = false, shown_at = now() where code = it.code;
      return json_build_object('ok', true);
    end if;
    if not (it.cancelled or it.status = 'cancelled') then return json_build_object('err', 'closed'); end if;
    perform nmj_log('posted', it.code, it.owner);
    update nmj_items set cancelled = false, cancelled_at = null, queue = '{}', wa_sent_at = null, expired = false,
      status = case when status = 'shown' then 'shown' else 'waiting' end, created = now() where code = it.code;
    perform nmj_fill(now());
    return json_build_object('ok', true);
  end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'closed'); end if;
  if _act = 'given' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform nmj_log('given', it.code, it.queue[1]);
    update nmj_items set given = true, given_at = now(), queue = '{}',
      status = case when status = 'reserved' then 'given' else status end where code = it.code;
  elsif _act = 'skip' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform nmj_log('returned', it.code, it.queue[1]);
    update nmj_items set queue = queue[2:], booked_at = now(), cancels = cancels + 1 where code = it.code;
    if it.status = 'reserved' and cardinality(it.queue) = 1 then perform nmj_to_store(it.code, now()); end if;
  elsif _act = 'cancel' then
    perform nmj_log('cancelled', it.code, it.owner);
    update nmj_items set cancelled = true, queue = '{}',
      status = case when status <> 'shown' or expired then 'cancelled' else status end,
      cancelled_at = now() where code = it.code;
    perform nmj_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;
revoke execute on function nmj_clear_expired() from public, anon, authenticated;
-- =====================================================================
-- نموذج: تحديث 6 — الإدارة تغيّر موعد انتهاء العد التنازلي بساعة العقارب
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
create or replace function nmj_admin(_act text, _arg text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me();
begin
  if not nmj_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if _act = 'roll' then perform nmj_roll(now());
  elsif _act = 'wipe' then delete from nmj_items where status in ('waiting','shown','reserved');
  elsif _act in ('ban','unban') then
    insert into nmj_profiles (phone) values (_arg) on conflict do nothing;
    update nmj_profiles set banned = (_act = 'ban') where phone = _arg;
  elsif _act in ('admin','unadmin') then
    insert into nmj_profiles (phone) values (_arg) on conflict do nothing;
    update nmj_profiles set is_admin = (_act = 'admin') where phone = _arg and phone <> me;
  elsif _act = 'unlock_time' then update nmj_items set pick_from = null, pick_to = null where code = _arg;
  elsif _act = 'wa_mode' then
    if _arg not in ('platform','whatsapp','both') then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set wa_mode = _arg where id = 1;
  elsif _act = 'wa_sent' then update nmj_items set wa_sent_at = coalesce(wa_sent_at, now()) where code = _arg;
  elsif _act = 'exp_mode' then  -- ما انتهى وقته: يومض حتى يقرر صاحبه، أو يُلغى تلقائيًا
    if _arg not in ('flash','auto') then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set exp_mode = _arg where id = 1;
    if _arg = 'auto' then perform nmj_clear_expired(); end if;
  elsif _act = 'set_end' then  -- الإدارة تغيّر موعد انتهاء العد التنازلي (_arg: الموعد بالملّي ثانية)
    if _arg !~ '^[0-9]{12,14}$' or to_timestamp(_arg::bigint / 1000.0) <= now() or to_timestamp(_arg::bigint / 1000.0) > now() + interval '2 days'
      then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set cycle_start = to_timestamp(_arg::bigint / 1000.0) - interval '1 day' where id = 1;
  elsif _act = 'clear_expired' then perform nmj_clear_expired();
  elsif _act = 'remove' then  -- إزالة إعلان خاطئ أو مشتبه به نهائيًا
    perform nmj_log('removed', _arg, me);
    delete from nmj_items where code = _arg;
    perform nmj_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;
-- =====================================================================
-- نموذج: تحديث 7 — الإدارة تضع رابط الانضمام إلى مجموعة واتساب واسمها من المنصة
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
alter table nmj_settings add column if not exists group_name text not null default 'نموذج الثاني 2️⃣';
alter table nmj_settings add column if not exists group_link text not null default 'https://chat.whatsapp.com/Jlydg5jeog868RHfjUVbLS';

create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned) into prof from nmj_profiles where phone = me;
  select json_build_object(
    'serverNow', floor(extract(epoch from now()) * 1000),
    'cycleStart', floor(extract(epoch from s.cycle_start) * 1000),
    'slots', s.slots, 'me', me, 'profile', prof, 'waMode', s.wa_mode, 'expMode', s.exp_mode, 'groupName', s.group_name, 'groupLink', s.group_link,
    'items', coalesce((select json_agg(json_build_object(
        'code', i.code, 'title', i.title, 'det', i.det, 'area', i.area, 'cond', i.cond, 'pick', i.pick,
        'cat', i.cat, 'icon', i.icon, 'photos', i.photos,
        'pickTime', case when i.pick_from is null then null else json_build_object('from', i.pick_from, 'to', i.pick_to) end,
        'status', i.status, 'given', i.given, 'cancelled', i.cancelled, 'shows', i.shows, 'cancels', i.cancels, 'expired', i.expired, 'waSent', case when adm or i.owner = me then i.wa_sent_at is not null end,
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'owner', case when adm or i.owner = me or i.queue[1] = me then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or i.owner = me then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end
      ) order by i.created)
      from nmj_items i
      where (i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;

create or replace function nmj_admin(_act text, _arg text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me();
begin
  if not nmj_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if _act = 'roll' then perform nmj_roll(now());
  elsif _act = 'wipe' then delete from nmj_items where status in ('waiting','shown','reserved');
  elsif _act in ('ban','unban') then
    insert into nmj_profiles (phone) values (_arg) on conflict do nothing;
    update nmj_profiles set banned = (_act = 'ban') where phone = _arg;
  elsif _act in ('admin','unadmin') then
    insert into nmj_profiles (phone) values (_arg) on conflict do nothing;
    update nmj_profiles set is_admin = (_act = 'admin') where phone = _arg and phone <> me;
  elsif _act = 'unlock_time' then update nmj_items set pick_from = null, pick_to = null where code = _arg;
  elsif _act = 'wa_mode' then
    if _arg not in ('platform','whatsapp','both') then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set wa_mode = _arg where id = 1;
  elsif _act = 'wa_sent' then update nmj_items set wa_sent_at = coalesce(wa_sent_at, now()) where code = _arg;
  elsif _act = 'exp_mode' then  -- ما انتهى وقته: يومض حتى يقرر صاحبه، أو يُلغى تلقائيًا
    if _arg not in ('flash','auto') then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set exp_mode = _arg where id = 1;
    if _arg = 'auto' then perform nmj_clear_expired(); end if;
  elsif _act = 'set_end' then  -- الإدارة تغيّر موعد انتهاء العد التنازلي (_arg: الموعد بالملّي ثانية)
    if _arg !~ '^[0-9]{12,14}$' or to_timestamp(_arg::bigint / 1000.0) <= now() or to_timestamp(_arg::bigint / 1000.0) > now() + interval '2 days'
      then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set cycle_start = to_timestamp(_arg::bigint / 1000.0) - interval '1 day' where id = 1;
  elsif _act = 'group_link' then  -- رابط دعوة مجموعة واتساب
    if _arg !~ '^https://chat\.whatsapp\.com/[A-Za-z0-9]{10,40}$' then return json_build_object('err', 'bad_link'); end if;
    update nmj_settings set group_link = _arg where id = 1;
  elsif _act = 'group_name' then
    if length(trim(coalesce(_arg, ''))) < 2 then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set group_name = left(trim(_arg), 60) where id = 1;
  elsif _act = 'clear_expired' then perform nmj_clear_expired();
  elsif _act = 'remove' then  -- إزالة إعلان خاطئ أو مشتبه به نهائيًا
    perform nmj_log('removed', _arg, me);
    delete from nmj_items where code = _arg;
    perform nmj_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;
-- =====================================================================
-- نموذج: تحديث 8 — عدّاد إعادة العرض: ثلاث مرات فقط، ثم يُصوَّر الغرض ويُعرض إعلانًا جديدًا
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
alter table nmj_items add column if not exists relists int not null default 0;

create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned) into prof from nmj_profiles where phone = me;
  select json_build_object(
    'serverNow', floor(extract(epoch from now()) * 1000),
    'cycleStart', floor(extract(epoch from s.cycle_start) * 1000),
    'slots', s.slots, 'me', me, 'profile', prof, 'waMode', s.wa_mode, 'expMode', s.exp_mode, 'groupName', s.group_name, 'groupLink', s.group_link,
    'items', coalesce((select json_agg(json_build_object(
        'code', i.code, 'title', i.title, 'det', i.det, 'area', i.area, 'cond', i.cond, 'pick', i.pick,
        'cat', i.cat, 'icon', i.icon, 'photos', i.photos,
        'pickTime', case when i.pick_from is null then null else json_build_object('from', i.pick_from, 'to', i.pick_to) end,
        'status', i.status, 'given', i.given, 'cancelled', i.cancelled, 'shows', i.shows, 'cancels', i.cancels, 'relists', i.relists, 'expired', i.expired, 'waSent', case when adm or i.owner = me then i.wa_sent_at is not null end,
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'owner', case when adm or i.owner = me or i.queue[1] = me then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or i.owner = me then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end
      ) order by i.created)
      from nmj_items i
      where (i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;

create or replace function nmj_owner_action(_code text, _act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items;
begin
  select * into it from nmj_items where code = _code for update;
  if not found or (it.owner <> me and not nmj_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'closed'); end if;
  -- إعادة عرض ما أُلغي: يعود إلى قائمة الانتظار بالرمز نفسه، ويُنشر في واتساب مرة جديدة
  if _act = 'relist' then
    if it.expired and not it.cancelled and it.status = 'shown' then  -- تجديد ما انتهى وقته ليوم جديد
      update nmj_items set expired = false, shown_at = now() where code = it.code;
      return json_build_object('ok', true);
    end if;
    if not (it.cancelled or it.status = 'cancelled') then return json_build_object('err', 'closed'); end if;
    if it.relists >= 3 then return json_build_object('err', 'relist_limit'); end if;  -- ثلاث إعادات فقط، ثم يُصوَّر ويُعرض من جديد
    perform nmj_log('posted', it.code, it.owner);
    update nmj_items set cancelled = false, cancelled_at = null, queue = '{}', wa_sent_at = null, expired = false, relists = relists + 1,
      status = case when status = 'shown' then 'shown' else 'waiting' end, created = now() where code = it.code;
    perform nmj_fill(now());
    return json_build_object('ok', true);
  end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'closed'); end if;
  if _act = 'given' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform nmj_log('given', it.code, it.queue[1]);
    update nmj_items set given = true, given_at = now(), queue = '{}',
      status = case when status = 'reserved' then 'given' else status end where code = it.code;
  elsif _act = 'skip' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform nmj_log('returned', it.code, it.queue[1]);
    update nmj_items set queue = queue[2:], booked_at = now(), cancels = cancels + 1 where code = it.code;
    if it.status = 'reserved' and cardinality(it.queue) = 1 then perform nmj_to_store(it.code, now()); end if;
  elsif _act = 'cancel' then
    perform nmj_log('cancelled', it.code, it.owner);
    update nmj_items set cancelled = true, queue = '{}',
      status = case when status <> 'shown' or expired then 'cancelled' else status end,
      cancelled_at = now() where code = it.code;
    perform nmj_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;
-- =====================================================================
-- نموذج: تحديث 9 — النسخة المفتوحة (almaateeq.com/namodaj): الدخول برقم الواتساب فقط بلا إيميل
-- يعتمد على «الدخول المجهول» في Supabase (Authentication → Sign In / Providers → Allow anonymous sign-ins)
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
create or replace function nmj_claim_phone(_name text, _phone text) returns json
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); anon boolean; p text; cur nmj_profiles; owner_anon boolean;
begin
  if uid is null then return json_build_object('err', 'login'); end if;
  select coalesce(is_anonymous, false) into anon from auth.users where id = uid;
  if not anon then return nmj_set_profile(_name, _phone); end if;   -- حساب بإيميل: المسار العادي
  select * into cur from nmj_profiles where user_id = uid;
  if found then
    update nmj_profiles set name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end where user_id = uid;
    return json_build_object('ok', true, 'phone', cur.phone);
  end if;
  p := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  if p !~ '^\d{10,13}$' then return json_build_object('err', 'bad_phone'); end if;
  select * into cur from nmj_profiles where phone = p;
  if found then
    -- رقم موثّق بإيميل أو محجوز للإدارة لا يُؤخذ برقم فقط؛ ورقم دخل به صاحبه بلا إيميل يعود له من جهاز جديد
    select coalesce(is_anonymous, false) into owner_anon from auth.users where id = cur.user_id;
    if cur.email is not null or cur.is_admin or (cur.user_id is not null and not coalesce(owner_anon, false)) then
      return json_build_object('err', 'phone_taken');
    end if;
    update nmj_profiles set user_id = uid,
      name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end where phone = p;
    return json_build_object('ok', true, 'phone', p);
  end if;
  insert into nmj_profiles (phone, user_id, name) values (p, uid, left(coalesce(trim(_name), ''), 30));
  return json_build_object('ok', true, 'phone', p);
end $$;
revoke execute on function nmj_claim_phone(text, text) from public, anon;
grant execute on function nmj_claim_phone(text, text) to authenticated;
-- =====================================================================
-- نموذج: تحديث 10 — في النسخة المفتوحة يظهر اسم المعلن بجانب زر «احجز» (لمن دخل برقمه فيها فقط)
-- يشمل تحديث 9، فيكفي تشغيله وحده. يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
alter table nmj_profiles add column if not exists show_name boolean not null default false;

create or replace function nmj_claim_phone(_name text, _phone text) returns json
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); anon boolean; p text; cur nmj_profiles; owner_anon boolean;
begin
  if uid is null then return json_build_object('err', 'login'); end if;
  select coalesce(is_anonymous, false) into anon from auth.users where id = uid;
  if not anon then return nmj_set_profile(_name, _phone); end if;   -- حساب بإيميل: المسار العادي
  select * into cur from nmj_profiles where user_id = uid;
  if found then
    update nmj_profiles set show_name = true, name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end where user_id = uid;
    return json_build_object('ok', true, 'phone', cur.phone);
  end if;
  p := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  if p !~ '^\d{10,13}$' then return json_build_object('err', 'bad_phone'); end if;
  select * into cur from nmj_profiles where phone = p;
  if found then
    -- رقم موثّق بإيميل أو محجوز للإدارة لا يُؤخذ برقم فقط؛ ورقم دخل به صاحبه بلا إيميل يعود له من جهاز جديد
    select coalesce(is_anonymous, false) into owner_anon from auth.users where id = cur.user_id;
    if cur.email is not null or cur.is_admin or (cur.user_id is not null and not coalesce(owner_anon, false)) then
      return json_build_object('err', 'phone_taken');
    end if;
    update nmj_profiles set user_id = uid, show_name = true,
      name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end where phone = p;
    return json_build_object('ok', true, 'phone', p);
  end if;
  insert into nmj_profiles (phone, user_id, name, show_name) values (p, uid, left(coalesce(trim(_name), ''), 30), true);
  return json_build_object('ok', true, 'phone', p);
end $$;
revoke execute on function nmj_claim_phone(text, text) from public, anon;
grant execute on function nmj_claim_phone(text, text) to authenticated;

create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned) into prof from nmj_profiles where phone = me;
  select json_build_object(
    'serverNow', floor(extract(epoch from now()) * 1000),
    'cycleStart', floor(extract(epoch from s.cycle_start) * 1000),
    'slots', s.slots, 'me', me, 'profile', prof, 'waMode', s.wa_mode, 'expMode', s.exp_mode, 'groupName', s.group_name, 'groupLink', s.group_link,
    'items', coalesce((select json_agg(json_build_object(
        'code', i.code, 'title', i.title, 'det', i.det, 'area', i.area, 'cond', i.cond, 'pick', i.pick,
        'cat', i.cat, 'icon', i.icon, 'photos', i.photos,
        'pickTime', case when i.pick_from is null then null else json_build_object('from', i.pick_from, 'to', i.pick_to) end,
        'status', i.status, 'given', i.given, 'cancelled', i.cancelled, 'shows', i.shows, 'cancels', i.cancels, 'relists', i.relists, 'expired', i.expired, 'waSent', case when adm or i.owner = me then i.wa_sent_at is not null end,
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'ownerName', (select case when pr.show_name and coalesce(pr.name, '') <> '' then pr.name end from nmj_profiles pr where pr.phone = i.owner),
        'owner', case when adm or i.owner = me or i.queue[1] = me then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or i.owner = me then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end
      ) order by i.created)
      from nmj_items i
      where (i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;
-- =====================================================================
-- نموذج: تحديث 11 — خطة البنود الثمانية
--  • العرض الجديد يبقى عالقًا حتى يقبله أحد الأدمنية (أو تلقائيًا إن اختارت الإدارة ذلك)
--  • يُحفظ وقت حجز كل مستفيد، ويرى الأدمن الحاجزين بالترتيب ويؤكد الحجز لأحدهم،
--    أو تختار الإدارة «تلقائي بالترتيب»
--  • المستفيد نفسه يستطيع الضغط على «تم الاستلام» كما يضغطه العارض
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================

-- ما سبق التحديث مقبول، وما يُرفع بعده ينتظر الموافقة
alter table nmj_items add column if not exists approved boolean not null default true;
alter table nmj_items alter column approved set default false;
alter table nmj_items add column if not exists approved_at timestamptz;
alter table nmj_items add column if not exists confirmed boolean not null default true;
alter table nmj_items add column if not exists queue_t jsonb not null default '{}'::jsonb;   -- {رقم: وقت الحجز}
alter table nmj_settings add column if not exists approve_mode text not null default 'manual';  -- manual | auto
alter table nmj_settings add column if not exists confirm_mode text not null default 'auto';    -- auto | manual

-- هل يؤكَّد الحجز تلقائيًا للأول؟
create or replace function nmj_auto_confirm() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select confirm_mode = 'auto' from nmj_settings where id = 1), true)
$$;

create or replace function nmj_to_store(_code text, _t timestamptz, _log boolean default true) returns void
language plpgsql security definer set search_path = public as $$
declare o text;
begin
  update nmj_items set status = 'cancelled', cancelled_at = coalesce(cancelled_at, _t), queue = '{}', queue_t = '{}', confirmed = true
  where code = _code returning owner into o;
  if _log then perform nmj_log('cancelled', _code, o); end if;
end $$;

-- لا يدخل النوافذ إلا ما قبلته الإدارة
create or replace function nmj_fill(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare free int;
begin
  select s.slots - (select count(*) from nmj_items where status = 'shown' and not expired and not cancelled) into free from nmj_settings s where id = 1;
  if free > 0 then
    update nmj_items set status = 'shown', shows = shows + 1, shown_at = _t
    where code in (select code from nmj_items where status = 'waiting' and approved order by coalesce(approved_at, created) limit free);
  end if;
end $$;

create or replace function nmj_post(_title text, _det text, _area text, _cond text, _pick text, _cat text,
  _photos text[] default '{}', _pick_from text default null, _pick_to text default null, _prefix text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); pre text; c text; st text; ok boolean;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from nmj_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  if coalesce(_title, '') = '' or coalesce(_area, '') = '' then return json_build_object('err', 'missing'); end if;
  pre := case when upper(coalesce(_prefix, '')) ~ '^[A-Z]{2}$' then upper(_prefix) else
    coalesce((json_build_object('تاروت','TR','القطيف','QT','سيهات','SN','العوامية','AW','صفوى','SF','الأوجام','AJ',
      'أم الحمام','UH','الجارودية','JR','الجش','JS','أم الساهك','US','القديح','QD','الدمام','DM') ->> trim(split_part(_area, '/', 1))), 'JA') end;
  loop
    c := pre || '-' || (1000 + floor(random() * 9000))::int;
    exit when not exists (select 1 from nmj_items where code = c);
  end loop;
  -- عرض الأدمن نفسه مقبول، وكذلك كل عرض إن اختارت الإدارة القبول التلقائي
  ok := nmj_is_admin(me) or coalesce((select approve_mode = 'auto' from nmj_settings where id = 1), false);
  insert into nmj_items (code, owner, title, det, area, cond, pick, cat, photos, pick_from, pick_to, approved, approved_at)
  values (c, me, left(_title, 80), left(coalesce(_det, ''), 400), left(_area, 60), left(coalesce(_cond, ''), 60),
          left(coalesce(_pick, ''), 80), coalesce(nullif(_cat, ''), 'أخرى ومتنوعات'), (coalesce(_photos, '{}'))[1:3], _pick_from, _pick_to,
          ok, case when ok then now() end);
  perform nmj_log('posted', c, me);
  perform nmj_fill(now());
  select status into st from nmj_items where code = c;
  return json_build_object('ok', true, 'code', c, 'status', st, 'approved', ok);
end $$;
grant execute on function nmj_post(text, text, text, text, text, text, text[], text, text, text) to authenticated;

-- الحجز: يدخل الحاجز الدور ويُحفظ وقته؛ والأول يُؤكَّد تلقائيًا أو ينتظر تأكيد الأدمن
create or replace function nmj_book(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items; pos int; act int; mx int;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from nmj_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  perform nmj_tick();
  select * into it from nmj_items where code = upper(trim(_code)) for update;
  if not found then return json_build_object('err', 'not_found'); end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'cancelled'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'given'); end if;
  if it.owner = me then return json_build_object('err', 'own'); end if;
  pos := array_position(it.queue, me);
  if pos is null then
    if it.status <> 'shown' then return json_build_object('err', 'not_shown'); end if;
    if cardinality(it.queue) = 0 then
      select max_active into mx from nmj_settings where id = 1;
      select count(*) into act from nmj_items where queue[1] = me and not given and not cancelled and status in ('shown','reserved');
      if act >= mx then return json_build_object('err', 'limit', 'max', mx); end if;
    end if;
    update nmj_items set queue = array_append(queue, me),
      queue_t = queue_t || jsonb_build_object(me, floor(extract(epoch from now()) * 1000)),
      confirmed = case when cardinality(queue) = 0 then nmj_auto_confirm() else confirmed end,
      booked_at = case when cardinality(queue) = 0 then now() else booked_at end
    where code = it.code returning * into it;
    perform nmj_log('booked', it.code, me);
    pos := array_position(it.queue, me);
  end if;
  return json_build_object('ok', true, 'code', it.code, 'pos', pos - 1, 'confirmed', it.confirmed);
end $$;

-- التنازل عن الحجز: من أي مكان في الدور
create or replace function nmj_cancel_booking(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items; first boolean;
begin
  select * into it from nmj_items where code = _code for update;
  if not found or not (me = any(it.queue)) then return json_build_object('err', 'not_found'); end if;
  first := it.queue[1] = me;
  perform nmj_log('returned', it.code, me);
  update nmj_items set queue = array_remove(queue, me), queue_t = queue_t - me,
    booked_at = case when first then now() else booked_at end,
    confirmed = case when first then nmj_auto_confirm() else confirmed end,
    cancels = cancels + case when first then 1 else 0 end where code = it.code;
  perform nmj_tick();
  return json_build_object('ok', true);
end $$;

-- مهلة الاستلام (24 ساعة) تُحسب من تأكيد الحجز فقط
create or replace function nmj_tick() returns void
language plpgsql security definer set search_path = public as $$
declare cs timestamptz; r record; ac boolean := nmj_auto_confirm();
begin
  perform pg_advisory_xact_lock(4460);
  loop
    select cycle_start into cs from nmj_settings where id = 1;
    exit when now() < cs + interval '1 day';
    perform nmj_roll(cs + interval '1 day');
  end loop;
  for r in select * from nmj_items where status in ('shown','reserved') and not given and not cancelled for update loop
    while cardinality(r.queue) > 0 and r.confirmed and now() - r.booked_at > interval '1 day' loop
      perform nmj_log('returned', r.code, r.queue[1]);
      r.queue_t := r.queue_t - r.queue[1];
      r.queue := r.queue[2:]; r.booked_at := r.booked_at + interval '1 day'; r.cancels := r.cancels + 1; r.confirmed := ac;
    end loop;
    update nmj_items set queue = r.queue, queue_t = r.queue_t, booked_at = r.booked_at, cancels = r.cancels, confirmed = r.confirmed where code = r.code;
    if r.status = 'reserved' and cardinality(r.queue) = 0 then perform nmj_to_store(r.code, now()); end if;
  end loop;
  perform nmj_fill(now());
end $$;

-- أفعال العارض والأدمن، و«تم الاستلام» يضغطه العارض أو المستفيد المؤكَّد له
create or replace function nmj_owner_action(_code text, _act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items; holder boolean;
begin
  select * into it from nmj_items where code = _code for update;
  if not found then return json_build_object('err', 'not_found'); end if;
  holder := me is not null and it.queue[1] = me and it.confirmed;
  if it.owner <> me and not nmj_is_admin(me) and not (holder and _act = 'given') then return json_build_object('err', 'not_found'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'closed'); end if;
  if _act = 'relist' then
    if it.expired and not it.cancelled and it.status = 'shown' then
      update nmj_items set expired = false, shown_at = now() where code = it.code;
      return json_build_object('ok', true);
    end if;
    if not (it.cancelled or it.status = 'cancelled') then return json_build_object('err', 'closed'); end if;
    if it.relists >= 3 then return json_build_object('err', 'relist_limit'); end if;
    perform nmj_log('posted', it.code, it.owner);
    update nmj_items set cancelled = false, cancelled_at = null, queue = '{}', queue_t = '{}', confirmed = true, wa_sent_at = null, expired = false, relists = relists + 1,
      status = case when status = 'shown' then 'shown' else 'waiting' end, created = now() where code = it.code;
    perform nmj_fill(now());
    return json_build_object('ok', true);
  end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'closed'); end if;
  if _act = 'given' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    if not it.confirmed then return json_build_object('err', 'not_confirmed'); end if;
    perform nmj_log('given', it.code, it.queue[1]);
    update nmj_items set given = true, given_at = now(), queue = '{}', queue_t = '{}',
      status = case when status = 'reserved' then 'given' else status end where code = it.code;
  elsif _act = 'skip' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform nmj_log('returned', it.code, it.queue[1]);
    update nmj_items set queue = queue[2:], queue_t = queue_t - it.queue[1], booked_at = now(), cancels = cancels + 1,
      confirmed = nmj_auto_confirm() where code = it.code;
    if it.status = 'reserved' and cardinality(it.queue) = 1 then perform nmj_to_store(it.code, now()); end if;
  elsif _act = 'cancel' then
    perform nmj_log('cancelled', it.code, it.owner);
    update nmj_items set cancelled = true, queue = '{}', queue_t = '{}', confirmed = true,
      status = case when status <> 'shown' or expired then 'cancelled' else status end,
      cancelled_at = now() where code = it.code;
    perform nmj_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;

-- أدوات الأدمن الجديدة: قبول العرض، تأكيد الحجز لأحد الحاجزين، ووضعا القبول والتأكيد
create or replace function nmj_manage(_act text, _code text default null, _arg text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items;
begin
  if not nmj_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if _act = 'approve_mode' then
    if _arg not in ('manual','auto') then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set approve_mode = _arg where id = 1;
    if _arg = 'auto' then update nmj_items set approved = true, approved_at = now() where not approved and status = 'waiting' and not cancelled; perform nmj_fill(now()); end if;
    return json_build_object('ok', true);
  elsif _act = 'confirm_mode' then
    if _arg not in ('manual','auto') then return json_build_object('err', 'bad_action'); end if;
    update nmj_settings set confirm_mode = _arg where id = 1;
    if _arg = 'auto' then update nmj_items set confirmed = true, booked_at = now() where not confirmed and cardinality(queue) > 0 and not given and not cancelled; end if;
    return json_build_object('ok', true);
  end if;
  select * into it from nmj_items where code = _code for update;
  if not found then return json_build_object('err', 'not_found'); end if;
  if _act = 'approve' then
    if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'closed'); end if;
    update nmj_items set approved = true, approved_at = coalesce(approved_at, now()) where code = it.code;
    perform nmj_log('approved', it.code, me);
    perform nmj_fill(now());
    return json_build_object('ok', true, 'status', (select status from nmj_items where code = it.code));
  elsif _act = 'confirm' then   -- _arg: رقم الحاجز الذي يختاره الأدمن
    if it.given or it.cancelled then return json_build_object('err', 'closed'); end if;
    if not (_arg = any(it.queue)) then return json_build_object('err', 'not_found'); end if;
    update nmj_items set queue = array_prepend(_arg, array_remove(queue, _arg)), confirmed = true, booked_at = now() where code = it.code;
    perform nmj_log('confirmed', it.code, _arg);
    return json_build_object('ok', true);
  end if;
  return json_build_object('err', 'bad_action');
end $$;
revoke execute on function nmj_manage(text, text, text) from public, anon;
grant execute on function nmj_manage(text, text, text) to authenticated;

create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned) into prof from nmj_profiles where phone = me;
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
        'ownerName', (select case when pr.show_name and coalesce(pr.name, '') <> '' then pr.name end from nmj_profiles pr where pr.phone = i.owner),
        'owner', case when adm or i.owner = me or (i.queue[1] = me and i.confirmed) then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or (i.owner = me and i.confirmed) then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end,
        'queueT', case when adm then i.queue_t end
      ) order by i.created)
      from nmj_items i
      where (i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;

-- تعديل العرض: للعارض والأدمن ما دام الغرض لم يُسلَّم ولم يُلغَ (الكود يبقى كما هو)
create or replace function nmj_edit_item(_code text, _title text, _det text, _area text, _cond text, _pick text, _cat text, _photos text[] default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items;
begin
  select * into it from nmj_items where code = _code for update;
  if not found or me is null or (it.owner <> me and not nmj_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.cancelled or it.status in ('given','cancelled') then return json_build_object('err', 'closed'); end if;
  if coalesce(_title, '') = '' or coalesce(_area, '') = '' then return json_build_object('err', 'missing'); end if;
  update nmj_items set title = left(_title, 80), det = left(coalesce(_det, ''), 400), area = left(_area, 60),
    cond = left(coalesce(_cond, ''), 60), pick = left(coalesce(_pick, ''), 80), cat = coalesce(nullif(_cat, ''), cat),
    photos = case when _photos is null then photos else _photos[1:3] end where code = it.code;
  perform nmj_log('edited', it.code, me);
  return json_build_object('ok', true);
end $$;
revoke execute on function nmj_edit_item(text, text, text, text, text, text, text, text[]) from public, anon;
grant execute on function nmj_edit_item(text, text, text, text, text, text, text, text[]) to authenticated;

-- وقت الاستلام: يعدّله العارض متى شاء بتحريك العقارب، ما دام الغرض لم يُسلَّم ولم يُلغَ
create or replace function nmj_set_pick_time(_code text, _from text, _to text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items;
begin
  select * into it from nmj_items where code = _code for update;
  if not found or (it.owner <> me and not nmj_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.cancelled then return json_build_object('err', 'closed'); end if;
  update nmj_items set pick_from = left(_from, 20), pick_to = left(_to, 20) where code = _code;
  return json_build_object('ok', true);
end $$;
-- =====================================================================
-- نموذج: تحديث 12
--  • رفض العرض يحذفه من المنصة نهائيًا، ويبقى في الإحصاء مرفوضًا
--  • ما انتهى وقت عرضه ولم يحجزه أحد يُسجَّل في الإحصاء «انتهى ولم يُحجز»
--  • ما استلمه المستفيد يبقى بختمه 15 دقيقة ثم يختفي عن الجميع، وتفرغ نافذته (والأدمن يراه في سجله)
-- يُلصق في SQL Editor ثم Run بعد التحديث 11. يمكن تشغيله أكثر من مرة.
-- =====================================================================

create or replace function nmj_fill(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare free int;
begin
  select s.slots - (select count(*) from nmj_items where status = 'shown' and not expired and not cancelled
                     and not (given and given_at < _t - interval '15 minutes')) into free from nmj_settings s where id = 1;
  if free > 0 then
    update nmj_items set status = 'shown', shows = shows + 1, shown_at = _t
    where code in (select code from nmj_items where status = 'waiting' and approved order by coalesce(approved_at, created) limit free);
  end if;
end $$;

-- رفض العرض: يُحذف من المنصة، ويبقى أثره في الإحصاء
create or replace function nmj_reject(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me();
begin
  if not nmj_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if not exists (select 1 from nmj_items where code = _code) then return json_build_object('err', 'not_found'); end if;
  perform nmj_log('rejected', _code, me);   -- يبقى في الإحصاء: عُرض ثم رُفض
  delete from nmj_items where code = _code;
  perform nmj_fill(now());
  return json_build_object('ok', true);
end $$;
revoke execute on function nmj_reject(text) from public, anon;
grant execute on function nmj_reject(text) to authenticated;

create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned) into prof from nmj_profiles where phone = me;
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
        'approved', i.approved, 'confirmed', i.confirmed, 'givenAt', floor(extract(epoch from i.given_at) * 1000),
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'ownerName', (select case when pr.show_name and coalesce(pr.name, '') <> '' then pr.name end from nmj_profiles pr where pr.phone = i.owner),
        'owner', case when adm or i.owner = me or (i.queue[1] = me and i.confirmed) then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or (i.owner = me and i.confirmed) then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end,
        'queueT', case when adm then i.queue_t end
      ) order by i.created)
      from nmj_items i
      where ((i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue))))
            and not (i.given and i.given_at < now() - interval '15 minutes')
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;

-- نهاية الدفعة: ما انتهى وقته ولم يحجزه أحد يُسجَّل في الإحصاء
create or replace function nmj_roll(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare r record; m text;
begin
  select exp_mode into m from nmj_settings where id = 1;
  for r in select * from nmj_items where status = 'shown' for update loop
    if r.given then update nmj_items set status = 'given', expired = false where code = r.code;
    elsif r.cancelled then perform nmj_to_store(r.code, _t, false);
    elsif cardinality(r.queue) > 0 then update nmj_items set status = 'reserved', expired = false where code = r.code;
    elsif m = 'flash' then
      if not r.expired then perform nmj_log('expired', r.code, r.owner); end if;
      update nmj_items set expired = true where code = r.code;  -- يبقى ويومض
    else perform nmj_log('expired', r.code, r.owner); perform nmj_to_store(r.code, _t);
    end if;
  end loop;
  update nmj_settings set cycle_start = _t where id = 1;
  perform nmj_fill(_t);
end $$;
-- نموذج: تحديث 16 — يجمع تحديثَي 13 و14 بالترتيب الصحيح (وضع التجربة + البلد والتقرير). آمن للتشغيل أكثر من مرة.
-- =====================================================================
-- نموذج: تحديث 13 — «وضع التجربة» للأدمن
--  • الأدمن يشغّله من لوحة الإدارة، فيصبح عرضه «في الانتظار» كأي عضو، ويستطيع حجز غرضه بنفسه
--  • أغراض التجربة عليها علامة «تجربة»، ولا تدخل الإحصاء، وتُمسح بضغطة
-- يُلصق في SQL Editor ثم Run بعد التحديث 12. يمكن تشغيله أكثر من مرة.
-- =====================================================================

alter table nmj_items add column if not exists test boolean not null default false;
alter table nmj_profiles add column if not exists test_mode boolean not null default false;

-- أحداث أغراض التجربة لا تُسجَّل، فلا تدخل الإحصاء
create or replace function nmj_log(_type text, _code text, _who text) returns void
language plpgsql security definer set search_path = public as $$
declare a text; c text; t boolean;
begin
  select coalesce(nullif(trim(split_part(area, '/', 1)), ''), 'غير محدد'), cat, test into a, c, t from nmj_items where code = _code;
  if coalesce(t, false) then return; end if;
  insert into nmj_events (type, code, who, area, cat) values (_type, _code, _who, coalesce(a, 'غير محدد'), coalesce(c, 'أخرى ومتنوعات'));
end $$;
revoke execute on function nmj_log(text, text, text) from public, anon, authenticated;

create or replace function nmj_post(_title text, _det text, _area text, _cond text, _pick text, _cat text,
  _photos text[] default '{}', _pick_from text default null, _pick_to text default null, _prefix text default null) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); pre text; c text; st text; ok boolean; tm boolean;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from nmj_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  if coalesce(_title, '') = '' or coalesce(_area, '') = '' then return json_build_object('err', 'missing'); end if;
  pre := case when upper(coalesce(_prefix, '')) ~ '^[A-Z]{2}$' then upper(_prefix) else
    coalesce((json_build_object('تاروت','TR','القطيف','QT','سيهات','SN','العوامية','AW','صفوى','SF','الأوجام','AJ',
      'أم الحمام','UH','الجارودية','JR','الجش','JS','أم الساهك','US','القديح','QD','الدمام','DM') ->> trim(split_part(_area, '/', 1))), 'JA') end;
  loop
    c := pre || '-' || (1000 + floor(random() * 9000))::int;
    exit when not exists (select 1 from nmj_items where code = c);
  end loop;
  -- عرض الأدمن نفسه مقبول، وكذلك كل عرض إن اختارت الإدارة القبول التلقائي
  -- الأدمن في وضع التجربة: عرضه «في الانتظار» كأي عضو، ويُعلَّم «تجربة»
  tm := nmj_is_admin(me) and coalesce((select test_mode from nmj_profiles where phone = me), false);
  ok := (nmj_is_admin(me) and not tm) or coalesce((select approve_mode = 'auto' from nmj_settings where id = 1), false);
  insert into nmj_items (code, owner, title, det, area, cond, pick, cat, photos, pick_from, pick_to, approved, approved_at, test)
  values (c, me, left(_title, 80), left(coalesce(_det, ''), 400), left(_area, 60), left(coalesce(_cond, ''), 60),
          left(coalesce(_pick, ''), 80), coalesce(nullif(_cat, ''), 'أخرى ومتنوعات'), (coalesce(_photos, '{}'))[1:3], _pick_from, _pick_to,
          ok, case when ok then now() end, tm);
  perform nmj_log('posted', c, me);
  perform nmj_fill(now());
  select status into st from nmj_items where code = c;
  return json_build_object('ok', true, 'code', c, 'status', st, 'approved', ok);
end $$;

create or replace function nmj_book(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items; pos int; act int; mx int;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from nmj_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  perform nmj_tick();
  select * into it from nmj_items where code = upper(trim(_code)) for update;
  if not found then return json_build_object('err', 'not_found'); end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'cancelled'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'given'); end if;
  -- لا يحجز أحد غرضه، إلا الأدمن في غرض التجربة ليجرّب الدورة كاملة وحده
  if it.owner = me and not (it.test and nmj_is_admin(me)) then return json_build_object('err', 'own'); end if;
  pos := array_position(it.queue, me);
  if pos is null then
    if it.status <> 'shown' then return json_build_object('err', 'not_shown'); end if;
    if cardinality(it.queue) = 0 then
      select max_active into mx from nmj_settings where id = 1;
      select count(*) into act from nmj_items where queue[1] = me and not given and not cancelled and status in ('shown','reserved');
      if act >= mx then return json_build_object('err', 'limit', 'max', mx); end if;
    end if;
    update nmj_items set queue = array_append(queue, me),
      queue_t = queue_t || jsonb_build_object(me, floor(extract(epoch from now()) * 1000)),
      confirmed = case when cardinality(queue) = 0 then nmj_auto_confirm() else confirmed end,
      booked_at = case when cardinality(queue) = 0 then now() else booked_at end
    where code = it.code returning * into it;
    perform nmj_log('booked', it.code, me);
    pos := array_position(it.queue, me);
  end if;
  return json_build_object('ok', true, 'code', it.code, 'pos', pos - 1, 'confirmed', it.confirmed);
end $$;

-- تشغيل وضع التجربة وإطفاؤه، ومسح أغراض التجربة كلها
create or replace function nmj_test(_act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); n int;
begin
  if not nmj_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if _act in ('on', 'off') then
    update nmj_profiles set test_mode = (_act = 'on') where phone = me;
    return json_build_object('ok', true);
  elsif _act = 'clear' then
    delete from nmj_items where test;
    get diagnostics n = row_count;
    perform nmj_fill(now());
    return json_build_object('ok', true, 'n', n);
  end if;
  return json_build_object('err', 'bad_action');
end $$;
revoke execute on function nmj_test(text) from public, anon;
grant execute on function nmj_test(text) to authenticated;

create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned, 'testMode', coalesce(test_mode, false)) into prof from nmj_profiles where phone = me;
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
        'ownerName', (select case when pr.show_name and coalesce(pr.name, '') <> '' then pr.name end from nmj_profiles pr where pr.phone = i.owner),
        'owner', case when adm or i.owner = me or (i.queue[1] = me and i.confirmed) then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or (i.owner = me and i.confirmed) then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end,
        'queueT', case when adm then i.queue_t end
      ) order by i.created)
      from nmj_items i
      where ((i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue))))
            and not (i.given and i.given_at < now() - interval '15 minutes')
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;
-- =====================================================================
-- نموذج: تحديث 14 — البلد بند أساسي في التسجيل، وشرط للحجز، والتقرير التفصيلي للإدارة
-- بعد تحديث 13. يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
alter table nmj_profiles add column if not exists area text;

create or replace function nmj_area_ok(_a text) returns boolean language sql immutable as $$
  select trim(coalesce(_a, '')) in ('تاروت','القطيف','سيهات','العوامية','صفوى','الأوجام','أم الحمام','الجارودية','الجش','أم الساهك','القديح','الدمام')
$$;

-- حفظ البلد أو تغييره لصاحب الحساب
create or replace function nmj_set_area(_area text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me();
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if not nmj_area_ok(_area) then return json_build_object('err', 'bad_area'); end if;
  update nmj_profiles set area = trim(_area) where phone = me;
  return json_build_object('ok', true, 'area', trim(_area));
end $$;
revoke execute on function nmj_set_area(text) from public, anon;
grant execute on function nmj_set_area(text) to authenticated;

-- التسجيل بالرقم صار يأخذ البلد أيضًا: الدالة القديمة تبقى باسم nmj_claim_phone0
do $$ begin
  if exists (select 1 from pg_proc where proname = 'nmj_claim_phone' and pronargs = 2)
     and not exists (select 1 from pg_proc where proname = 'nmj_claim_phone0') then
    alter function nmj_claim_phone(text, text) rename to nmj_claim_phone0;
  end if;
end $$;
create or replace function nmj_claim_phone(_name text, _phone text, _area text) returns json
language plpgsql security definer set search_path = public, auth as $$
declare r json;
begin
  if not nmj_area_ok(_area) then return json_build_object('err', 'bad_area'); end if;
  r := nmj_claim_phone0(_name, _phone);
  if (r ->> 'ok') is not null then
    update nmj_profiles set area = trim(_area) where user_id = auth.uid() or phone = (r ->> 'phone');
  end if;
  return r;
end $$;
revoke execute on function nmj_claim_phone0(text, text) from public, anon, authenticated;
revoke execute on function nmj_claim_phone(text, text, text) from public, anon;
grant execute on function nmj_claim_phone(text, text, text) to authenticated;

create or replace function nmj_book(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); it nmj_items; pos int; act int; mx int;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from nmj_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  -- البلد شرط للحجز: لا يحجز من لم يختر بلده
  if coalesce((select trim(area) from nmj_profiles where phone = me), '') = '' then return json_build_object('err', 'need_area'); end if;
  perform nmj_tick();
  select * into it from nmj_items where code = upper(trim(_code)) for update;
  if not found then return json_build_object('err', 'not_found'); end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'cancelled'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'given'); end if;
  -- لا يحجز أحد غرضه، إلا الأدمن في غرض التجربة ليجرّب الدورة كاملة وحده
  if it.owner = me and not (it.test and nmj_is_admin(me)) then return json_build_object('err', 'own'); end if;
  pos := array_position(it.queue, me);
  if pos is null then
    if it.status <> 'shown' then return json_build_object('err', 'not_shown'); end if;
    if cardinality(it.queue) = 0 then
      select max_active into mx from nmj_settings where id = 1;
      select count(*) into act from nmj_items where queue[1] = me and not given and not cancelled and status in ('shown','reserved');
      if act >= mx then return json_build_object('err', 'limit', 'max', mx); end if;
    end if;
    update nmj_items set queue = array_append(queue, me),
      queue_t = queue_t || jsonb_build_object(me, floor(extract(epoch from now()) * 1000)),
      confirmed = case when cardinality(queue) = 0 then nmj_auto_confirm() else confirmed end,
      booked_at = case when cardinality(queue) = 0 then now() else booked_at end
    where code = it.code returning * into it;
    perform nmj_log('booked', it.code, me);
    pos := array_position(it.queue, me);
  end if;
  return json_build_object('ok', true, 'code', it.code, 'pos', pos - 1, 'confirmed', it.confirmed);
end $$;

create or replace function nmj_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); adm boolean; prof json; res json;
begin
  perform nmj_tick();
  adm := nmj_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned, 'testMode', coalesce(test_mode, false), 'area', area) into prof from nmj_profiles where phone = me;
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
        'ownerName', (select case when pr.show_name and coalesce(pr.name, '') <> '' then pr.name end from nmj_profiles pr where pr.phone = i.owner),
        'owner', case when adm or i.owner = me or (i.queue[1] = me and i.confirmed) then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or (i.owner = me and i.confirmed) then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end,
        'queueT', case when adm then i.queue_t end
      ) order by i.created)
      from nmj_items i
      where ((i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue))))
            and not (i.given and i.given_at < now() - interval '15 minutes')
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from nmj_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from nmj_profiles), '{}'::json) end
  ) into res from nmj_settings s where s.id = 1;
  return res;
end $$;

-- التقرير التفصيلي للإدارة: كل غرض بعارضه ومستلمه، وتسلسل استلام كل مستفيد
create or replace function nmj_report() returns json
language plpgsql security definer set search_path = public as $$
declare me text := nmj_me(); res json;
begin
  if not nmj_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  with g as (
    select i.*, coalesce((select e.who from nmj_events e where e.type = 'given' and e.code = i.code order by e.t desc limit 1),
                         case when i.given then i.queue[1] end) as taker
    from nmj_items i where not coalesce(i.test, false)
  ), s as (
    select g.*, case when g.given and g.taker is not null then
      row_number() over (partition by case when g.given then g.taker end order by coalesce(g.given_at, g.created)) end as seq
    from g
  )
  select coalesce(json_agg(json_build_object(
      'code', s.code, 't', floor(extract(epoch from s.created) * 1000),
      'owner', s.owner, 'ownerName', po.name, 'area', coalesce(nullif(trim(split_part(s.area, '/', 1)), ''), 'غير محدد'),
      'title', s.title, 'cat', s.cat, 'status', s.status, 'given', s.given, 'cancelled', s.cancelled, 'expired', s.expired,
      'approved', s.approved, 'queueLen', cardinality(s.queue),
      'taker', s.taker, 'takerName', pt.name, 'takerArea', pt.area,
      'givenAt', floor(extract(epoch from s.given_at) * 1000), 'seq', s.seq
    ) order by s.created desc), '[]'::json) into res
  from s left join nmj_profiles po on po.phone = s.owner
         left join nmj_profiles pt on pt.phone = s.taker;
  return json_build_object('ok', true, 'rows', res);
end $$;
revoke execute on function nmj_report() from public, anon;
grant execute on function nmj_report() to authenticated;
-- نموذج: تحديث 15 — الصفحات القديمة المفتوحة قبل التحديث تسجّل الرقم دون خطأ، ويُطلب البلد عند الحجز
create or replace function nmj_claim_phone(_name text, _phone text) returns json
language sql security definer set search_path = public, auth as $$ select nmj_claim_phone0(_name, _phone) $$;
revoke execute on function nmj_claim_phone(text, text) from public, anon;
grant execute on function nmj_claim_phone(text, text) to authenticated;
