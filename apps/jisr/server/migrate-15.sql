-- جسر العطاء: تحديث 15 — الصفحات القديمة المفتوحة قبل التحديث تسجّل الرقم دون خطأ، ويُطلب البلد عند الحجز
create or replace function jisr_claim_phone(_name text, _phone text) returns json
language sql security definer set search_path = public, auth as $$ select jisr_claim_phone0(_name, _phone) $$;
revoke execute on function jisr_claim_phone(text, text) from public, anon;
grant execute on function jisr_claim_phone(text, text) to authenticated;
