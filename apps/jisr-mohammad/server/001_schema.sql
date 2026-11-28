-- =========================================================
-- جسر محمد — قاعدة بيانات مستقلة (مشروع Supabase خاص به)
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
comment on table public.jisr_users is 'جسر محمد: المستخدمون (متبرعون ومستفيدون ومشرفون) — الدخول برقم الجوال ورمز سري شخصي';

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
comment on table public.jisr_items is 'جسر محمد: المعروضات (التبرعات العينية)';
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
comment on table public.jisr_requests is 'جسر محمد: طلبات الحجز بالكود';
create index if not exists jisr_requests_user_idx on public.jisr_requests(user_id, created_at);

create table if not exists public.jisr_settings (
  key   text primary key,
  value jsonb not null
);
comment on table public.jisr_settings is 'جسر محمد: إعدادات المنصة التي يتحكم بها المشرف';

insert into public.jisr_settings(key, value) values
  ('booking_mode',         '"auto"'),      -- auto = أول من يدخل الكود | admin = المشرف يختار من الطلبات
  ('require_approval',     'true'),        -- العروض الجديدة تحتاج موافقة المشرف قبل الظهور
  ('trial_mode',           'true'),        -- وضع التجربة: كل ما يُضاف يُعلَّم كتجربة
  ('item_hours',           '24'),          -- مدة ظهور الغرض بعد اعتماده
  ('pickup_hours',         '24'),          -- مهلة الاستلام بعد الحجز
  ('max_bookings_per_day', '1'),           -- أقصى عدد حجوزات للشخص خلال 24 ساعة
  ('whatsapp_name',        '"مجموعة جسر محمد"'),
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
