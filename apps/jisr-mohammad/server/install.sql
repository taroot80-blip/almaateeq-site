-- =========================================================
-- منصة جسر العطاء — ملف التثبيت الكامل (نسخة مستقلة)
-- طريقة الاستخدام: Supabase ← SQL Editor ← New query ← الصق الملف كاملاً ← Run
-- يُشغَّل مرة واحدة فقط على مشروع جديد
-- =========================================================

create extension if not exists pgcrypto with schema extensions;

-- =========================================================
-- جسر محمد (jisr.mohammad) — قاعدة بيانات مستقلة
-- المخطط الأساسي: الجداول + الإعدادات + حاوية الصور
-- =========================================================

create table if not exists public.jisr_users (
  id              bigserial primary key,
  phone           text not null unique,
  name            text not null,
  pin_hash        text not null,
  status          text not null default 'active' check (status in ('active','suspended')),
  is_admin        boolean not null default false,
  failed_attempts int not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now(),
  last_login_at   timestamptz
);
comment on table public.jisr_users is 'جسر العطاء: المستخدمون (متبرعون ومستفيدون ومشرفون) — الدخول برقم الجوال ورمز سري شخصي';

create table if not exists public.jisr_sessions (
  token      uuid primary key default gen_random_uuid(),
  user_id    bigint not null references public.jisr_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '60 days'
);
create index if not exists jisr_sessions_user_idx on public.jisr_sessions(user_id);

create table if not exists public.jisr_items (
  id             bigserial primary key,
  code           text not null unique,
  donor_id       bigint not null references public.jisr_users(id) on delete cascade,
  categories     text[] not null default '{}',
  title          text not null,
  details        text,
  condition      text,
  area           text,
  neighborhood   text,
  pickup_method  text,
  pickup_from    text,
  pickup_to      text,
  photos         text[] not null default '{}',
  status         text not null default 'pending'
                 check (status in ('pending','approved','booked','delivered','cancelled','expired','rejected')),
  is_test        boolean not null default false,
  admin_note     text,
  created_at     timestamptz not null default now(),
  approved_at    timestamptz,
  expires_at     timestamptz,
  booked_by      bigint references public.jisr_users(id) on delete set null,
  booked_at      timestamptz,
  delivered_at   timestamptz,
  cancelled_at   timestamptz
);
comment on table public.jisr_items is 'جسر العطاء: المعروضات (التبرعات العينية)';
create index if not exists jisr_items_status_idx on public.jisr_items(status, expires_at);
create index if not exists jisr_items_donor_idx  on public.jisr_items(donor_id);
create index if not exists jisr_items_booked_idx on public.jisr_items(booked_by);

create table if not exists public.jisr_requests (
  id         bigserial primary key,
  item_id    bigint not null references public.jisr_items(id) on delete cascade,
  user_id    bigint not null references public.jisr_users(id) on delete cascade,
  status     text not null default 'waiting' check (status in ('waiting','won','lost','released','withdrawn')),
  created_at timestamptz not null default now(),
  unique (item_id, user_id)
);
comment on table public.jisr_requests is 'جسر العطاء: طلبات الحجز بالكود';
create index if not exists jisr_requests_user_idx on public.jisr_requests(user_id, created_at);

create table if not exists public.jisr_settings (
  key   text primary key,
  value jsonb not null
);
comment on table public.jisr_settings is 'جسر العطاء: إعدادات المنصة التي يتحكم بها المشرف';

insert into public.jisr_settings(key, value) values
  ('booking_mode',         '"auto"'),      -- auto = أول من يدخل الكود | admin = المشرف يختار من الطلبات
  ('require_approval',     'true'),        -- العروض الجديدة تحتاج موافقة المشرف قبل الظهور
  ('trial_mode',           'true'),        -- وضع التجربة: كل ما يُضاف يُعلَّم كتجربة
  ('item_hours',           '24'),          -- مدة ظهور الغرض بعد اعتماده
  ('pickup_hours',         '24'),          -- مهلة الاستلام بعد الحجز
  ('max_bookings_per_day', '1'),           -- أقصى عدد حجوزات للشخص خلال 24 ساعة
  ('whatsapp_name',        '"مجموعة جسر العطاء"'),
  ('whatsapp_link',        '""'),
  ('announcement',         '""')
on conflict (key) do nothing;

-- منع أي وصول مباشر للجداول: كل العمليات تمر عبر الدوال المحكومة
alter table public.jisr_users    enable row level security;
alter table public.jisr_sessions enable row level security;
alter table public.jisr_items    enable row level security;
alter table public.jisr_requests enable row level security;
alter table public.jisr_settings enable row level security;

revoke all on public.jisr_users, public.jisr_sessions, public.jisr_items,
              public.jisr_requests, public.jisr_settings from anon, authenticated;

-- حاوية الصور (عامة للقراءة، رفع صور فقط بحد 2 ميغابايت)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('jisr-photos', 'jisr-photos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;


create policy "jisr photos upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'jisr-photos' and (storage.foldername(name))[1] = 'items');


-- =========================================================
-- جسر العطاء — الدوال (واجهة برمجية آمنة)
-- كل دالة تتحقق من الجلسة والصلاحية بنفسها
-- =========================================================

-- ---------- أدوات داخلية ----------
create or replace function public.jisr_setting(k text)
returns jsonb language sql stable security definer set search_path = public as $$
  select value from public.jisr_settings where key = k
$$;

create or replace function public.jisr_norm_phone(p text)
returns text language plpgsql immutable set search_path = public as $$
declare d text;
begin
  d := translate(coalesce(p,''), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  d := regexp_replace(d, '\D', '', 'g');
  if d like '00966%' then d := '0' || substr(d, 6);
  elsif d like '966%' then d := '0' || substr(d, 4);
  elsif d like '5%' and length(d) = 9 then d := '0' || d;
  end if;
  if d !~ '^05[0-9]{8}$' then return null; end if;
  return d;
end $$;

create or replace function public.jisr_auth(p_token uuid)
returns public.jisr_users language plpgsql stable security definer set search_path = public as $$
declare u public.jisr_users;
begin
  select u2.* into u from public.jisr_sessions s join public.jisr_users u2 on u2.id = s.user_id
   where s.token = p_token and s.expires_at > now();
  if u.id is null then raise exception 'انتهت الجلسة، فضلاً سجّل الدخول من جديد' using errcode = 'P0001'; end if;
  if u.status <> 'active' then raise exception 'هذا الرقم موقوف. للاستفسار تواصل مع إدارة المبادرة' using errcode = 'P0001'; end if;
  return u;
end $$;

create or replace function public.jisr_require_admin(p_token uuid)
returns public.jisr_users language plpgsql stable security definer set search_path = public as $$
declare u public.jisr_users;
begin
  u := public.jisr_auth(p_token);
  if not u.is_admin then raise exception 'هذه الصفحة للمشرفين فقط' using errcode = 'P0001'; end if;
  return u;
end $$;

-- تحديث الحالات المنتهية (يُستدعى تلقائياً)
create or replace function public.jisr_housekeep()
returns void language sql security definer set search_path = public as $$
  update public.jisr_items set status = 'expired'
   where status = 'approved' and expires_at is not null and expires_at < now();
$$;

create or replace function public.jisr_new_code()
returns text language plpgsql volatile security definer set search_path = public as $$
declare c text; i int := 0;
begin
  loop
    c := lpad((floor(random() * 90000) + 10000)::int::text, 5, '0');
    exit when not exists (select 1 from public.jisr_items where code = c);
    i := i + 1;
    if i > 50 then raise exception 'تعذّر توليد كود'; end if;
  end loop;
  return c;
end $$;

-- ---------- الدخول والتسجيل ----------
create or replace function public.jisr_login(p_phone text, p_pin text, p_name text default null)
returns jsonb language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  ph text := public.jisr_norm_phone(p_phone);
  u public.jisr_users;
  t uuid;
  first_admin boolean;
begin
  if ph is null then raise exception 'رقم الجوال غير صحيح. اكتبه بصيغة 05xxxxxxxx' using errcode = 'P0001'; end if;
  if coalesce(p_pin,'') !~ '^[0-9]{4}$' then raise exception 'الرمز السري يتكون من 4 أرقام' using errcode = 'P0001'; end if;

  select * into u from public.jisr_users where phone = ph;

  if u.id is null then
    if coalesce(trim(p_name),'') = '' then
      return jsonb_build_object('need_name', true);
    end if;
    select not exists (select 1 from public.jisr_users where is_admin) into first_admin;
    insert into public.jisr_users(phone, name, pin_hash, is_admin)
    values (ph, left(trim(p_name), 60), crypt(p_pin, gen_salt('bf')), first_admin)
    returning * into u;
  else
    if u.locked_until is not null and u.locked_until > now() then
      return jsonb_build_object('error', 'محاولات كثيرة خاطئة. حاول بعد 15 دقيقة');
    end if;
    if u.pin_hash <> crypt(p_pin, u.pin_hash) then
      update public.jisr_users
         set failed_attempts = failed_attempts + 1,
             locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else null end
       where id = u.id;
      -- نُعيد الخطأ كنتيجة (لا كاستثناء) حتى يُحفظ عدّاد المحاولات
      return jsonb_build_object('error', 'الرمز السري غير صحيح');
    end if;
    if u.status <> 'active' then raise exception 'هذا الرقم موقوف. للاستفسار تواصل مع إدارة المبادرة' using errcode = 'P0001'; end if;
    update public.jisr_users set failed_attempts = 0, locked_until = null, last_login_at = now() where id = u.id;
  end if;

  insert into public.jisr_sessions(user_id) values (u.id) returning token into t;
  return jsonb_build_object('token', t, 'user',
    jsonb_build_object('id', u.id, 'name', u.name, 'phone', u.phone, 'is_admin', u.is_admin));
end $$;

create or replace function public.jisr_me(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare u public.jisr_users;
begin
  u := public.jisr_auth(p_token);
  return jsonb_build_object('id', u.id, 'name', u.name, 'phone', u.phone, 'is_admin', u.is_admin);
end $$;

create or replace function public.jisr_logout(p_token uuid)
returns void language sql security definer set search_path = public as $$
  delete from public.jisr_sessions where token = p_token;
$$;

-- ---------- الإعدادات العامة ----------
create or replace function public.jisr_public_settings()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_object_agg(key, value) from public.jisr_settings
   where key in ('booking_mode','item_hours','pickup_hours','max_bookings_per_day','whatsapp_name','whatsapp_link','announcement','trial_mode','require_approval');
$$;

-- ---------- عرض اليوم (عام) ----------
create or replace function public.jisr_public_items()
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  perform public.jisr_housekeep();
  return coalesce((
    select jsonb_agg(x order by x->>'sort' desc) from (
      select jsonb_build_object(
        'id', i.id, 'code', i.code, 'categories', i.categories, 'title', i.title, 'details', i.details,
        'condition', i.condition, 'area', i.area, 'neighborhood', i.neighborhood,
        'pickup_method', i.pickup_method, 'pickup_from', i.pickup_from, 'pickup_to', i.pickup_to,
        'photos', i.photos, 'status', i.status, 'is_test', i.is_test,
        'approved_at', i.approved_at, 'expires_at', i.expires_at,
        'sort', coalesce(i.approved_at, i.created_at)) as x
      from public.jisr_items i
      where (i.status = 'approved' and i.expires_at > now())
         or (i.status in ('booked','delivered') and coalesce(i.booked_at, i.approved_at) > now() - interval '24 hours')
    ) q), '[]'::jsonb);
end $$;

-- ---------- عرض غرض ----------
create or replace function public.jisr_offer_item(p_token uuid, p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  u public.jisr_users;
  c text;
  needs_ok boolean := coalesce((public.jisr_setting('require_approval'))::boolean, true);
  trial boolean    := coalesce((public.jisr_setting('trial_mode'))::boolean, false);
  hrs int          := coalesce((public.jisr_setting('item_hours'))::int, 24);
  st text;
  cats text[];
  ph text[];
begin
  u := public.jisr_auth(p_token);
  if coalesce(trim(p->>'title'),'') = '' then raise exception 'اكتب اسم الغرض' using errcode = 'P0001'; end if;
  if not coalesce((p->>'pledge')::boolean, false) then raise exception 'يلزم الموافقة على التعهد' using errcode = 'P0001'; end if;
  select coalesce(array_agg(v), '{}') into cats from jsonb_array_elements_text(coalesce(p->'categories','[]')) v;
  if array_length(cats,1) is null then raise exception 'اختر تصنيفاً واحداً على الأقل' using errcode = 'P0001'; end if;
  select coalesce(array_agg(v), '{}') into ph from (select v from jsonb_array_elements_text(coalesce(p->'photos','[]')) v limit 3) s;
  if (select count(*) from public.jisr_items where donor_id = u.id and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'وصلت للحد الأقصى من العروض اليومية (10)' using errcode = 'P0001';
  end if;

  c := public.jisr_new_code();
  st := case when needs_ok and not u.is_admin then 'pending' else 'approved' end;

  insert into public.jisr_items(code, donor_id, categories, title, details, condition, area, neighborhood,
      pickup_method, pickup_from, pickup_to, photos, status, is_test, approved_at, expires_at)
  values (c, u.id, cats, left(trim(p->>'title'),120), left(p->>'details',600), p->>'condition', p->>'area',
      left(p->>'neighborhood',80), p->>'pickup_method', p->>'pickup_from', p->>'pickup_to', ph, st, trial,
      case when st = 'approved' then now() end,
      case when st = 'approved' then now() + make_interval(hours => hrs) end);

  return jsonb_build_object('code', c, 'status', st);
end $$;

-- ---------- الحجز بالكود ----------
create or replace function public.jisr_book(p_token uuid, p_code text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  u public.jisr_users;
  it public.jisr_items;
  mode text := coalesce(public.jisr_setting('booking_mode') #>> '{}', 'auto');
  maxb int  := coalesce((public.jisr_setting('max_bookings_per_day'))::int, 1);
  code_clean text := regexp_replace(translate(coalesce(p_code,''), '٠١٢٣٤٥٦٧٨٩', '0123456789'), '\D', '', 'g');
  n int;
begin
  u := public.jisr_auth(p_token);
  perform public.jisr_housekeep();
  select * into it from public.jisr_items where code = code_clean for update;
  if it.id is null then raise exception 'الكود غير صحيح، تأكد منه' using errcode = 'P0001'; end if;
  if it.donor_id = u.id then raise exception 'لا يمكنك حجز غرض أعلنته أنت' using errcode = 'P0001'; end if;
  if it.status = 'pending' then raise exception 'هذا الغرض لم يُعتمد بعد' using errcode = 'P0001'; end if;
  if it.status in ('booked','delivered') then raise exception 'عذراً، سبقك غيرك إلى هذا الغرض' using errcode = 'P0001'; end if;
  if it.status <> 'approved' then raise exception 'هذا الغرض لم يعد متاحاً' using errcode = 'P0001'; end if;
  if exists (select 1 from public.jisr_requests where item_id = it.id and user_id = u.id) then
    raise exception 'سبق أن طلبت هذا الغرض' using errcode = 'P0001';
  end if;

  select count(*) into n from public.jisr_requests
   where user_id = u.id and status in ('won','waiting') and created_at > now() - interval '24 hours';
  if n >= maxb then
    raise exception 'استفدت خلال آخر 24 ساعة، أتح الفرصة لغيرك وحاول لاحقاً' using errcode = 'P0001';
  end if;

  if mode = 'admin' then
    insert into public.jisr_requests(item_id, user_id, status) values (it.id, u.id, 'waiting');
    return jsonb_build_object('result', 'waiting', 'title', it.title);
  end if;

  update public.jisr_items set status = 'booked', booked_by = u.id, booked_at = now() where id = it.id;
  insert into public.jisr_requests(item_id, user_id, status) values (it.id, u.id, 'won');
  return jsonb_build_object('result', 'won', 'title', it.title,
    'donor_name', (select name from public.jisr_users where id = it.donor_id),
    'donor_phone', (select phone from public.jisr_users where id = it.donor_id),
    'pickup_from', it.pickup_from, 'pickup_to', it.pickup_to, 'area', it.area, 'neighborhood', it.neighborhood);
end $$;

-- ---------- حسابي ----------
create or replace function public.jisr_my(p_token uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare u public.jisr_users;
begin
  u := public.jisr_auth(p_token);
  perform public.jisr_housekeep();
  return jsonb_build_object(
    'user', jsonb_build_object('id', u.id, 'name', u.name, 'phone', u.phone, 'is_admin', u.is_admin),
    'offers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'code', i.code, 'title', i.title, 'status', i.status, 'photos', i.photos,
        'categories', i.categories, 'created_at', i.created_at, 'expires_at', i.expires_at,
        'booked_at', i.booked_at, 'delivered_at', i.delivered_at,
        'booker_name', b.name, 'booker_phone', b.phone,
        'waiting', (select count(*) from public.jisr_requests r where r.item_id = i.id and r.status = 'waiting'))
        order by i.created_at desc)
      from public.jisr_items i left join public.jisr_users b on b.id = i.booked_by
      where i.donor_id = u.id and i.created_at > now() - interval '60 days'), '[]'::jsonb),
    'bookings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'item_id', i.id, 'code', i.code, 'title', i.title, 'item_status', i.status, 'req_status', r.status,
        'photos', i.photos, 'area', i.area, 'neighborhood', i.neighborhood,
        'pickup_from', i.pickup_from, 'pickup_to', i.pickup_to, 'requested_at', r.created_at,
        'booked_at', i.booked_at,
        'donor_name', case when r.status = 'won' then d.name end,
        'donor_phone', case when r.status = 'won' and i.status = 'booked' then d.phone end)
        order by r.created_at desc)
      from public.jisr_requests r join public.jisr_items i on i.id = r.item_id
      join public.jisr_users d on d.id = i.donor_id
      where r.user_id = u.id and r.created_at > now() - interval '60 days'), '[]'::jsonb)
  );
end $$;

-- إجراءات صاحب الغرض: تم التسليم / إلغاء الغرض / لم يستلم (إتاحته لغيره)
create or replace function public.jisr_donor_action(p_token uuid, p_item bigint, p_action text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  u public.jisr_users;
  it public.jisr_items;
  hrs int := coalesce((public.jisr_setting('item_hours'))::int, 24);
begin
  u := public.jisr_auth(p_token);
  select * into it from public.jisr_items where id = p_item for update;
  if it.id is null or (it.donor_id <> u.id and not u.is_admin) then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  if p_action = 'delivered' then
    if it.status <> 'booked' then raise exception 'لا يمكن تأكيد التسليم إلا لغرض محجوز' using errcode = 'P0001'; end if;
    update public.jisr_items set status = 'delivered', delivered_at = now() where id = it.id;
  elsif p_action = 'cancel' then
    if it.status in ('delivered','cancelled') then raise exception 'لا يمكن إلغاء هذا الغرض' using errcode = 'P0001'; end if;
    update public.jisr_items set status = 'cancelled', cancelled_at = now() where id = it.id;
    update public.jisr_requests set status = 'lost' where item_id = it.id and status = 'waiting';
  elsif p_action = 'no_show' then
    if it.status <> 'booked' then raise exception 'الغرض غير محجوز' using errcode = 'P0001'; end if;
    update public.jisr_requests set status = 'released' where item_id = it.id and user_id = it.booked_by;
    update public.jisr_items set status = 'approved', booked_by = null, booked_at = null,
           expires_at = now() + make_interval(hours => hrs) where id = it.id;
  else
    raise exception 'إجراء غير معروف' using errcode = 'P0001';
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- المستفيد يعتذر عن الحجز
create or replace function public.jisr_withdraw(p_token uuid, p_item bigint)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  u public.jisr_users;
  it public.jisr_items;
  hrs int := coalesce((public.jisr_setting('item_hours'))::int, 24);
begin
  u := public.jisr_auth(p_token);
  select * into it from public.jisr_items where id = p_item for update;
  update public.jisr_requests set status = 'withdrawn'
   where item_id = p_item and user_id = u.id and status in ('waiting','won');
  if it.status = 'booked' and it.booked_by = u.id then
    update public.jisr_items set status = 'approved', booked_by = null, booked_at = null,
           expires_at = now() + make_interval(hours => hrs) where id = it.id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ---------- المشرف ----------
create or replace function public.jisr_admin_items(p_token uuid, p_status text default null, p_search text default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  perform public.jisr_require_admin(p_token);
  perform public.jisr_housekeep();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', i.id, 'code', i.code, 'title', i.title, 'details', i.details, 'categories', i.categories,
      'condition', i.condition, 'area', i.area, 'neighborhood', i.neighborhood,
      'pickup_method', i.pickup_method, 'pickup_from', i.pickup_from, 'pickup_to', i.pickup_to,
      'photos', i.photos, 'status', i.status, 'is_test', i.is_test, 'created_at', i.created_at,
      'expires_at', i.expires_at, 'booked_at', i.booked_at, 'admin_note', i.admin_note,
      'donor_name', d.name, 'donor_phone', d.phone, 'booker_name', b.name, 'booker_phone', b.phone,
      'requests', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'name', ru.name, 'phone', ru.phone,
                     'status', r.status, 'at', r.created_at,
                     'past_wins', (select count(*) from public.jisr_requests r2 where r2.user_id = ru.id and r2.status = 'won'))
                     order by r.created_at), '[]'::jsonb)
                   from public.jisr_requests r join public.jisr_users ru on ru.id = r.user_id where r.item_id = i.id))
      order by i.created_at desc)
    from (select * from public.jisr_items order by created_at desc limit 500) i
    join public.jisr_users d on d.id = i.donor_id
    left join public.jisr_users b on b.id = i.booked_by
    where (p_status is null or p_status = '' or i.status = p_status)
      and (p_search is null or p_search = '' or i.code = p_search or i.title ilike '%'||p_search||'%' or d.phone like '%'||p_search||'%')
    ), '[]'::jsonb);
end $$;

create or replace function public.jisr_admin_decide(p_token uuid, p_item bigint, p_approve boolean, p_note text default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare hrs int := coalesce((public.jisr_setting('item_hours'))::int, 24);
begin
  perform public.jisr_require_admin(p_token);
  if p_approve then
    update public.jisr_items set status = 'approved', approved_at = now(),
           expires_at = now() + make_interval(hours => hrs), admin_note = coalesce(p_note, admin_note)
     where id = p_item and status in ('pending','expired','rejected','cancelled');
  else
    update public.jisr_items set status = 'rejected', admin_note = coalesce(p_note, admin_note)
     where id = p_item and status in ('pending','approved');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- اختيار المستفيد في نمط "المشرف يختار"
create or replace function public.jisr_admin_pick(p_token uuid, p_request bigint)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare r public.jisr_requests; it public.jisr_items;
begin
  perform public.jisr_require_admin(p_token);
  select * into r from public.jisr_requests where id = p_request;
  select * into it from public.jisr_items where id = r.item_id for update;
  if it.status <> 'approved' then raise exception 'الغرض غير متاح للحجز' using errcode = 'P0001'; end if;
  update public.jisr_items set status = 'booked', booked_by = r.user_id, booked_at = now() where id = it.id;
  update public.jisr_requests set status = case when id = r.id then 'won' else 'lost' end
   where item_id = it.id and status = 'waiting';
  return jsonb_build_object('ok', true);
end $$;

-- اختيار عشوائي (قرعة) من الطلبات
create or replace function public.jisr_admin_draw(p_token uuid, p_item bigint)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare rid bigint;
begin
  perform public.jisr_require_admin(p_token);
  select id into rid from public.jisr_requests where item_id = p_item and status = 'waiting' order by random() limit 1;
  if rid is null then raise exception 'لا توجد طلبات على هذا الغرض' using errcode = 'P0001'; end if;
  return public.jisr_admin_pick(p_token, rid);
end $$;

create or replace function public.jisr_admin_edit_item(p_token uuid, p_item bigint, p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  perform public.jisr_require_admin(p_token);
  update public.jisr_items set
    title         = coalesce(nullif(p->>'title',''), title),
    details       = coalesce(p->>'details', details),
    pickup_from   = coalesce(p->>'pickup_from', pickup_from),
    pickup_to     = coalesce(p->>'pickup_to', pickup_to),
    expires_at    = case when p ? 'extend_hours' then greatest(coalesce(expires_at, now()), now()) + make_interval(hours => (p->>'extend_hours')::int) else expires_at end,
    status        = case when p ? 'extend_hours' and status = 'expired' then 'approved' else status end,
    admin_note    = coalesce(p->>'admin_note', admin_note)
  where id = p_item;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.jisr_admin_delete_item(p_token uuid, p_item bigint)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  perform public.jisr_require_admin(p_token);
  delete from public.jisr_items where id = p_item;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.jisr_admin_users(p_token uuid, p_search text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform public.jisr_require_admin(p_token);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', u.id, 'name', u.name, 'phone', u.phone, 'status', u.status, 'is_admin', u.is_admin,
      'created_at', u.created_at, 'last_login_at', u.last_login_at,
      'offers', (select count(*) from public.jisr_items i where i.donor_id = u.id),
      'delivered', (select count(*) from public.jisr_items i where i.donor_id = u.id and i.status = 'delivered'),
      'wins', (select count(*) from public.jisr_requests r where r.user_id = u.id and r.status = 'won'),
      'no_shows', (select count(*) from public.jisr_requests r where r.user_id = u.id and r.status = 'released'))
      order by u.created_at desc)
    from (select * from public.jisr_users
           where p_search is null or p_search = '' or phone like '%'||p_search||'%' or name ilike '%'||p_search||'%'
           order by created_at desc limit 300) u), '[]'::jsonb);
end $$;

-- إيقاف/تفعيل، منح/سحب الإشراف، إعادة ضبط الرمز السري
create or replace function public.jisr_admin_set_user(p_token uuid, p_user bigint, p_action text)
returns jsonb language plpgsql volatile security definer set search_path = public, extensions as $$
declare me public.jisr_users;
begin
  me := public.jisr_require_admin(p_token);
  if p_user = me.id and p_action in ('suspend','unadmin') then
    raise exception 'لا يمكنك تطبيق هذا الإجراء على حسابك' using errcode = 'P0001';
  end if;
  if p_action = 'suspend' then
    update public.jisr_users set status = 'suspended' where id = p_user;
    delete from public.jisr_sessions where user_id = p_user;
  elsif p_action = 'activate' then update public.jisr_users set status = 'active' where id = p_user;
  elsif p_action = 'admin'    then update public.jisr_users set is_admin = true where id = p_user;
  elsif p_action = 'unadmin'  then update public.jisr_users set is_admin = false where id = p_user;
  elsif p_action = 'reset_pin' then
    -- يعيد الرمز إلى آخر 4 أرقام من الجوال، ويُطلب من الشخص تغييره
    update public.jisr_users set pin_hash = crypt(right(phone, 4), gen_salt('bf')), failed_attempts = 0, locked_until = null where id = p_user;
    delete from public.jisr_sessions where user_id = p_user;
  else raise exception 'إجراء غير معروف' using errcode = 'P0001';
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.jisr_change_pin(p_token uuid, p_old text, p_new text)
returns jsonb language plpgsql volatile security definer set search_path = public, extensions as $$
declare u public.jisr_users;
begin
  u := public.jisr_auth(p_token);
  if u.pin_hash <> crypt(p_old, u.pin_hash) then raise exception 'الرمز الحالي غير صحيح' using errcode = 'P0001'; end if;
  if coalesce(p_new,'') !~ '^[0-9]{4}$' then raise exception 'الرمز الجديد 4 أرقام' using errcode = 'P0001'; end if;
  update public.jisr_users set pin_hash = crypt(p_new, gen_salt('bf')) where id = u.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.jisr_admin_get_settings(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform public.jisr_require_admin(p_token);
  return (select jsonb_object_agg(key, value) from public.jisr_settings);
end $$;

create or replace function public.jisr_admin_set_settings(p_token uuid, p jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare k text; v jsonb;
begin
  perform public.jisr_require_admin(p_token);
  for k, v in select * from jsonb_each(p) loop
    if k in ('booking_mode','require_approval','trial_mode','item_hours','pickup_hours',
             'max_bookings_per_day','whatsapp_name','whatsapp_link','announcement') then
      insert into public.jisr_settings(key, value) values (k, v)
      on conflict (key) do update set value = excluded.value;
    end if;
  end loop;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.jisr_admin_clear_test(p_token uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare n int;
begin
  perform public.jisr_require_admin(p_token);
  delete from public.jisr_items where is_test;
  get diagnostics n = row_count;
  return jsonb_build_object('deleted', n);
end $$;

-- ---------- الإحصاء ----------
create or replace function public.jisr_admin_stats(p_token uuid, p_from date, p_to date, p_include_test boolean default false)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare res jsonb;
begin
  perform public.jisr_require_admin(p_token);
  perform public.jisr_housekeep();
  with it as (
    select * from public.jisr_items
     where created_at::date between p_from and p_to and (p_include_test or not is_test)
  )
  select jsonb_build_object(
    'total',      (select count(*) from it),
    'by_status',  (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from it group by status) s),
    'by_category',(select coalesce(jsonb_agg(jsonb_build_object('k', c, 'n', n) order by n desc), '[]')
                     from (select unnest(categories) c, count(*) n from it group by 1) s),
    'by_area',    (select coalesce(jsonb_agg(jsonb_build_object('k', coalesce(nullif(area,''),'غير محدد'), 'n', n) order by n desc), '[]')
                     from (select area, count(*) n from it group by 1) s),
    'by_day',     (select coalesce(jsonb_agg(jsonb_build_object('k', d, 'n', n) order by d), '[]')
                     from (select created_at::date d, count(*) n from it group by 1) s),
    'donors',     (select count(distinct donor_id) from it),
    'beneficiaries', (select count(distinct booked_by) from it where booked_by is not null),
    'requests',   (select count(*) from public.jisr_requests r join it on it.id = r.item_id),
    'avg_hours_to_book', (select round(avg(extract(epoch from (booked_at - approved_at))/3600)::numeric, 1) from it where booked_at is not null and approved_at is not null),
    'new_users',  (select count(*) from public.jisr_users where created_at::date between p_from and p_to)
  ) into res;
  return res;
end $$;

-- ---------- الصلاحيات ----------
-- سحب التنفيذ من كل دوال jisr_ فقط (لا تتأثر دوال موقع الجمعية الأخرى)، ثم منح الدوال العامة
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname like 'jisr\_%' loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

grant execute on function
  public.jisr_login(text, text, text),
  public.jisr_me(uuid),
  public.jisr_logout(uuid),
  public.jisr_public_settings(),
  public.jisr_public_items(),
  public.jisr_offer_item(uuid, jsonb),
  public.jisr_book(uuid, text),
  public.jisr_my(uuid),
  public.jisr_donor_action(uuid, bigint, text),
  public.jisr_withdraw(uuid, bigint),
  public.jisr_change_pin(uuid, text, text),
  public.jisr_admin_items(uuid, text, text),
  public.jisr_admin_decide(uuid, bigint, boolean, text),
  public.jisr_admin_pick(uuid, bigint),
  public.jisr_admin_draw(uuid, bigint),
  public.jisr_admin_edit_item(uuid, bigint, jsonb),
  public.jisr_admin_delete_item(uuid, bigint),
  public.jisr_admin_users(uuid, text),
  public.jisr_admin_set_user(uuid, bigint, text),
  public.jisr_admin_get_settings(uuid),
  public.jisr_admin_set_settings(uuid, jsonb),
  public.jisr_admin_clear_test(uuid),
  public.jisr_admin_stats(uuid, date, date, boolean)
to anon, authenticated;


-- =========================================================
-- جسر العطاء — التحديث الثاني (نوفمبر 2026)
-- البلدة عند التسجيل، كود بصيغة QT-7982، الحجز بقرار المشرف،
-- تأكيد الاستلام من المستلم، إحصاء المستفيدين حسب البلدة
-- يُشغَّل بعد 001 و 002
-- =========================================================

alter table public.jisr_users add column if not exists town text;

create or replace function public.jisr_new_code()
returns text language plpgsql volatile security definer set search_path = public as $$
declare c text; i int := 0; L text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
begin
  loop
    c := substr(L, 1 + floor(random()*24)::int, 1) || substr(L, 1 + floor(random()*24)::int, 1) || '-'
         || lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
    exit when not exists (select 1 from public.jisr_items where code = c);
    i := i + 1;
    if i > 50 then raise exception 'تعذّر توليد كود'; end if;
  end loop;
  return c;
end $$;

create or replace function public.jisr_norm_code(p text)
returns text language sql immutable set search_path = public as $$
  select case when x ~ '^[A-Z]{2}[0-9]{4}$' then substr(x,1,2) || '-' || substr(x,3) else x end
  from (select regexp_replace(upper(translate(coalesce(p,''), '٠١٢٣٤٥٦٧٨٩', '0123456789')), '[^A-Z0-9]', '', 'g') as x) s
$$;

drop function if exists public.jisr_login(text, text, text);
create or replace function public.jisr_login(p_phone text, p_pin text, p_name text default null, p_town text default null)
returns jsonb language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  ph text := public.jisr_norm_phone(p_phone);
  u public.jisr_users;
  t uuid;
  first_admin boolean;
begin
  if ph is null then raise exception 'رقم الجوال غير صحيح. اكتبه بصيغة 05xxxxxxxx' using errcode = 'P0001'; end if;
  if coalesce(p_pin,'') !~ '^[0-9]{4}$' then raise exception 'الرمز السري يتكون من 4 أرقام' using errcode = 'P0001'; end if;
  select * into u from public.jisr_users where phone = ph;
  if u.id is null then
    if coalesce(trim(p_name),'') = '' or coalesce(trim(p_town),'') = '' then
      return jsonb_build_object('need_name', true);
    end if;
    select not exists (select 1 from public.jisr_users where is_admin) into first_admin;
    insert into public.jisr_users(phone, name, town, pin_hash, is_admin)
    values (ph, left(trim(p_name), 60), left(trim(p_town), 60), crypt(p_pin, gen_salt('bf')), first_admin)
    returning * into u;
  else
    if u.locked_until is not null and u.locked_until > now() then
      return jsonb_build_object('error', 'محاولات كثيرة خاطئة. حاول بعد 15 دقيقة');
    end if;
    if u.pin_hash <> crypt(p_pin, u.pin_hash) then
      update public.jisr_users
         set failed_attempts = failed_attempts + 1,
             locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' else null end
       where id = u.id;
      return jsonb_build_object('error', 'الرمز السري غير صحيح');
    end if;
    if u.status <> 'active' then raise exception 'هذا الرقم موقوف. للاستفسار تواصل مع إدارة المبادرة' using errcode = 'P0001'; end if;
    update public.jisr_users set failed_attempts = 0, locked_until = null, last_login_at = now() where id = u.id;
  end if;
  insert into public.jisr_sessions(user_id) values (u.id) returning token into t;
  return jsonb_build_object('token', t, 'user',
    jsonb_build_object('id', u.id, 'name', u.name, 'phone', u.phone, 'town', u.town, 'is_admin', u.is_admin));
end $$;

create or replace function public.jisr_me(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare u public.jisr_users;
begin
  u := public.jisr_auth(p_token);
  return jsonb_build_object('id', u.id, 'name', u.name, 'phone', u.phone, 'town', u.town, 'is_admin', u.is_admin);
end $$;

create or replace function public.jisr_update_profile(p_token uuid, p_name text, p_town text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare u public.jisr_users;
begin
  u := public.jisr_auth(p_token);
  if coalesce(trim(p_name),'') = '' or coalesce(trim(p_town),'') = '' then
    raise exception 'الاسم والبلدة مطلوبان' using errcode = 'P0001';
  end if;
  update public.jisr_users set name = left(trim(p_name),60), town = left(trim(p_town),60) where id = u.id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.jisr_book(p_token uuid, p_code text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  u public.jisr_users;
  it public.jisr_items;
  mode text := coalesce(public.jisr_setting('booking_mode') #>> '{}', 'auto');
  maxb int  := coalesce((public.jisr_setting('max_bookings_per_day'))::int, 1);
  code_clean text := public.jisr_norm_code(p_code);
  n int;
begin
  u := public.jisr_auth(p_token);
  perform public.jisr_housekeep();
  select * into it from public.jisr_items where code = code_clean for update;
  if it.id is null then raise exception 'الكود غير صحيح، تأكد منه' using errcode = 'P0001'; end if;
  if it.donor_id = u.id then raise exception 'لا يمكنك حجز غرض أعلنته أنت' using errcode = 'P0001'; end if;
  if it.status = 'pending' then raise exception 'هذا الغرض لم يُعتمد بعد' using errcode = 'P0001'; end if;
  if it.status in ('booked','delivered') then raise exception 'عذراً، تم حجز هذا الغرض' using errcode = 'P0001'; end if;
  if it.status <> 'approved' then raise exception 'هذا الغرض لم يعد متاحاً' using errcode = 'P0001'; end if;
  if exists (select 1 from public.jisr_requests where item_id = it.id and user_id = u.id) then
    raise exception 'سبق أن سجّلت طلبك على هذا الغرض' using errcode = 'P0001';
  end if;
  select count(*) into n from public.jisr_requests
   where user_id = u.id and status = 'won' and created_at > now() - interval '24 hours';
  if n >= maxb then
    raise exception 'استفدت خلال آخر 24 ساعة، أتح الفرصة لغيرك وحاول لاحقاً' using errcode = 'P0001';
  end if;

  if mode = 'admin' then
    insert into public.jisr_requests(item_id, user_id, status) values (it.id, u.id, 'waiting');
    return jsonb_build_object('result', 'waiting', 'title', it.title, 'code', it.code);
  end if;

  update public.jisr_items set status = 'booked', booked_by = u.id, booked_at = now() where id = it.id;
  insert into public.jisr_requests(item_id, user_id, status) values (it.id, u.id, 'won');
  return jsonb_build_object('result', 'won', 'title', it.title, 'code', it.code,
    'donor_name', (select name from public.jisr_users where id = it.donor_id),
    'donor_phone', (select phone from public.jisr_users where id = it.donor_id),
    'pickup_from', it.pickup_from, 'pickup_to', it.pickup_to, 'area', it.area, 'neighborhood', it.neighborhood);
end $$;

create or replace function public.jisr_donor_action(p_token uuid, p_item bigint, p_action text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare
  u public.jisr_users;
  it public.jisr_items;
  hrs int := coalesce((public.jisr_setting('item_hours'))::int, 24);
begin
  u := public.jisr_auth(p_token);
  select * into it from public.jisr_items where id = p_item for update;
  if it.id is null then raise exception 'غير موجود' using errcode = 'P0001'; end if;
  if not (it.donor_id = u.id or u.is_admin or (p_action = 'delivered' and it.booked_by = u.id)) then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  if p_action = 'delivered' then
    if it.status <> 'booked' then raise exception 'لا يمكن تأكيد التسليم إلا لغرض محجوز' using errcode = 'P0001'; end if;
    update public.jisr_items set status = 'delivered', delivered_at = now() where id = it.id;
  elsif p_action = 'cancel' then
    if it.status in ('delivered','cancelled') then raise exception 'لا يمكن إلغاء هذا الغرض' using errcode = 'P0001'; end if;
    update public.jisr_items set status = 'cancelled', cancelled_at = now() where id = it.id;
    update public.jisr_requests set status = 'lost' where item_id = it.id and status = 'waiting';
  elsif p_action = 'no_show' then
    if it.status <> 'booked' then raise exception 'الغرض غير محجوز' using errcode = 'P0001'; end if;
    update public.jisr_requests set status = 'released' where item_id = it.id and user_id = it.booked_by;
    -- يعود الغرض متاحاً، ويبقى بقية الطالبين في الانتظار ليختار المشرف منهم
    update public.jisr_requests set status = 'waiting' where item_id = it.id and status = 'lost';
    update public.jisr_items set status = 'approved', booked_by = null, booked_at = null,
           expires_at = greatest(coalesce(expires_at, now()), now() + make_interval(hours => hrs)) where id = it.id;
  else
    raise exception 'إجراء غير معروف' using errcode = 'P0001';
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.jisr_my(p_token uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare u public.jisr_users;
begin
  u := public.jisr_auth(p_token);
  perform public.jisr_housekeep();
  return jsonb_build_object(
    'user', jsonb_build_object('id', u.id, 'name', u.name, 'phone', u.phone, 'town', u.town, 'is_admin', u.is_admin),
    'offers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'code', i.code, 'title', i.title, 'status', i.status, 'photos', i.photos,
        'categories', i.categories, 'created_at', i.created_at, 'expires_at', i.expires_at,
        'booked_at', i.booked_at, 'delivered_at', i.delivered_at,
        'booker_name', b.name, 'booker_phone', b.phone, 'booker_town', b.town,
        'waiting', (select count(*) from public.jisr_requests r where r.item_id = i.id and r.status = 'waiting'))
        order by i.created_at desc)
      from public.jisr_items i left join public.jisr_users b on b.id = i.booked_by
      where i.donor_id = u.id and i.created_at > now() - interval '60 days'), '[]'::jsonb),
    'bookings', coalesce((
      select jsonb_agg(jsonb_build_object(
        'item_id', i.id, 'code', i.code, 'title', i.title, 'item_status', i.status, 'req_status', r.status,
        'photos', i.photos, 'area', i.area, 'neighborhood', i.neighborhood,
        'pickup_method', i.pickup_method, 'pickup_from', i.pickup_from, 'pickup_to', i.pickup_to,
        'requested_at', r.created_at, 'booked_at', i.booked_at,
        'donor_name', case when r.status = 'won' then d.name end,
        'donor_phone', case when r.status = 'won' and i.status = 'booked' then d.phone end)
        order by r.created_at desc)
      from public.jisr_requests r join public.jisr_items i on i.id = r.item_id
      join public.jisr_users d on d.id = i.donor_id
      where r.user_id = u.id and r.created_at > now() - interval '60 days'), '[]'::jsonb)
  );
end $$;

create or replace function public.jisr_admin_items(p_token uuid, p_status text default null, p_search text default null)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
begin
  perform public.jisr_require_admin(p_token);
  perform public.jisr_housekeep();
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', i.id, 'code', i.code, 'title', i.title, 'details', i.details, 'categories', i.categories,
      'condition', i.condition, 'area', i.area, 'neighborhood', i.neighborhood,
      'pickup_method', i.pickup_method, 'pickup_from', i.pickup_from, 'pickup_to', i.pickup_to,
      'photos', i.photos, 'status', i.status, 'is_test', i.is_test, 'created_at', i.created_at,
      'expires_at', i.expires_at, 'booked_at', i.booked_at, 'admin_note', i.admin_note,
      'donor_name', d.name, 'donor_phone', d.phone, 'donor_town', d.town,
      'booker_name', b.name, 'booker_phone', b.phone, 'booker_town', b.town,
      'requests', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'name', ru.name, 'phone', ru.phone, 'town', ru.town,
                     'status', r.status, 'at', r.created_at,
                     'past_wins', (select count(*) from public.jisr_requests r2 where r2.user_id = ru.id and r2.status = 'won'),
                     'no_shows', (select count(*) from public.jisr_requests r3 where r3.user_id = ru.id and r3.status = 'released'))
                     order by r.created_at), '[]'::jsonb)
                   from public.jisr_requests r join public.jisr_users ru on ru.id = r.user_id where r.item_id = i.id))
      order by i.created_at desc)
    from (select * from public.jisr_items order by created_at desc limit 500) i
    join public.jisr_users d on d.id = i.donor_id
    left join public.jisr_users b on b.id = i.booked_by
    where (p_status is null or p_status = '' or i.status = p_status)
      and (p_search is null or p_search = '' or i.code = public.jisr_norm_code(p_search) or i.title ilike '%'||p_search||'%' or d.phone like '%'||p_search||'%')
    ), '[]'::jsonb);
end $$;

create or replace function public.jisr_admin_users(p_token uuid, p_search text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform public.jisr_require_admin(p_token);
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', u.id, 'name', u.name, 'phone', u.phone, 'town', u.town, 'status', u.status, 'is_admin', u.is_admin,
      'created_at', u.created_at, 'last_login_at', u.last_login_at,
      'offers', (select count(*) from public.jisr_items i where i.donor_id = u.id),
      'delivered', (select count(*) from public.jisr_items i where i.donor_id = u.id and i.status = 'delivered'),
      'wins', (select count(*) from public.jisr_requests r where r.user_id = u.id and r.status = 'won'),
      'no_shows', (select count(*) from public.jisr_requests r where r.user_id = u.id and r.status = 'released'))
      order by u.created_at desc)
    from (select * from public.jisr_users
           where p_search is null or p_search = '' or phone like '%'||p_search||'%' or name ilike '%'||p_search||'%' or town ilike '%'||p_search||'%'
           order by created_at desc limit 300) u), '[]'::jsonb);
end $$;

create or replace function public.jisr_admin_stats(p_token uuid, p_from date, p_to date, p_include_test boolean default false)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare res jsonb;
begin
  perform public.jisr_require_admin(p_token);
  perform public.jisr_housekeep();
  with it as (
    select * from public.jisr_items
     where created_at::date between p_from and p_to and (p_include_test or not is_test)
  )
  select jsonb_build_object(
    'total',      (select count(*) from it),
    'by_status',  (select coalesce(jsonb_object_agg(status, n), '{}') from (select status, count(*) n from it group by status) s),
    'by_category',(select coalesce(jsonb_agg(jsonb_build_object('k', c, 'n', n) order by n desc), '[]')
                     from (select unnest(categories) c, count(*) n from it group by 1) s),
    'by_area',    (select coalesce(jsonb_agg(jsonb_build_object('k', coalesce(nullif(area,''),'غير محدد'), 'n', n) order by n desc), '[]')
                     from (select area, count(*) n from it group by 1) s),
    'by_ben_town',(select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', n) order by n desc), '[]')
                     from (select coalesce(nullif(u.town,''),'غير محدد') k, count(*) n from it join public.jisr_users u on u.id = it.booked_by group by 1) s),
    'by_day',     (select coalesce(jsonb_agg(jsonb_build_object('k', d, 'n', n) order by d), '[]')
                     from (select created_at::date d, count(*) n from it group by 1) s),
    'donors',     (select count(distinct donor_id) from it),
    'beneficiaries', (select count(distinct booked_by) from it where booked_by is not null),
    'requests',   (select count(*) from public.jisr_requests r join it on it.id = r.item_id),
    'avg_hours_to_book', (select round(avg(extract(epoch from (booked_at - approved_at))/3600)::numeric, 1) from it where booked_at is not null and approved_at is not null),
    'new_users',  (select count(*) from public.jisr_users where created_at::date between p_from and p_to)
  ) into res;
  return res;
end $$;

-- الحجز بقرار المشرف هو الافتراضي
update public.jisr_settings set value = '"admin"' where key = 'booking_mode';

-- الصلاحيات
revoke execute on function public.jisr_norm_code(text) from public, anon, authenticated;
revoke execute on function public.jisr_new_code() from public, anon, authenticated;
revoke execute on function public.jisr_login(text,text,text,text) from public;
revoke execute on function public.jisr_update_profile(uuid,text,text) from public;
grant execute on function public.jisr_login(text,text,text,text), public.jisr_update_profile(uuid,text,text) to anon, authenticated;
