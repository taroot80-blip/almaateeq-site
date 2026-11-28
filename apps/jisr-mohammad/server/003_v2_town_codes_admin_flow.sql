-- =========================================================
-- جسر محمد — التحديث الثاني (نوفمبر 2026)
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
insert into public.jisr_settings(key, value) values ('site_url', '"https://almaateeq.com/jisr-mohammad"') on conflict (key) do nothing;

-- الصلاحيات
revoke execute on function public.jisr_norm_code(text) from public, anon, authenticated;
revoke execute on function public.jisr_new_code() from public, anon, authenticated;
revoke execute on function public.jisr_login(text,text,text,text) from public;
revoke execute on function public.jisr_update_profile(uuid,text,text) from public;
grant execute on function public.jisr_login(text,text,text,text), public.jisr_update_profile(uuid,text,text) to anon, authenticated;
