-- =====================================================================
-- جسر العطاء: تحديث 9 — النسخة المفتوحة (almaateeq.com/jisr2): الدخول برقم الواتساب فقط بلا إيميل
-- يعتمد على «الدخول المجهول» في Supabase (Authentication → Sign In / Providers → Allow anonymous sign-ins)
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
create or replace function jisr_claim_phone(_name text, _phone text) returns json
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); anon boolean; p text; cur jisr_profiles; owner_anon boolean;
begin
  if uid is null then return json_build_object('err', 'login'); end if;
  select coalesce(is_anonymous, false) into anon from auth.users where id = uid;
  if not anon then return jisr_set_profile(_name, _phone); end if;   -- حساب بإيميل: المسار العادي
  select * into cur from jisr_profiles where user_id = uid;
  if found then
    update jisr_profiles set name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end where user_id = uid;
    return json_build_object('ok', true, 'phone', cur.phone);
  end if;
  p := regexp_replace(coalesce(_phone, ''), '\D', '', 'g');
  if p !~ '^\d{10,13}$' then return json_build_object('err', 'bad_phone'); end if;
  select * into cur from jisr_profiles where phone = p;
  if found then
    -- رقم موثّق بإيميل أو محجوز للإدارة لا يُؤخذ برقم فقط؛ ورقم دخل به صاحبه بلا إيميل يعود له من جهاز جديد
    select coalesce(is_anonymous, false) into owner_anon from auth.users where id = cur.user_id;
    if cur.email is not null or cur.is_admin or (cur.user_id is not null and not coalesce(owner_anon, false)) then
      return json_build_object('err', 'phone_taken');
    end if;
    update jisr_profiles set user_id = uid,
      name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end where phone = p;
    return json_build_object('ok', true, 'phone', p);
  end if;
  insert into jisr_profiles (phone, user_id, name) values (p, uid, left(coalesce(trim(_name), ''), 30));
  return json_build_object('ok', true, 'phone', p);
end $$;
revoke execute on function jisr_claim_phone(text, text) from public, anon;
grant execute on function jisr_claim_phone(text, text) to authenticated;
