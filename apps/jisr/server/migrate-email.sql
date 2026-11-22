-- =====================================================================
-- جسر العطاء: التحقق بالإيميل بدل رسائل الجوال، والإعلان بلا صورة وبالحي
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

-- رقم الإدارة مربوط بإيميل المبادرة، فلا يأخذه غيره
update jisr_profiles set email = 'jisr.alataa@gmail.com' where phone = '96566669594';
