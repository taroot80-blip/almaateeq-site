-- =====================================================================
-- جسر العطاء: تحديث 3 — زر «أزل الإعلان نهائيًا» للإدارة
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
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
  elsif _act = 'wa_mode' then
    if _arg not in ('platform','whatsapp','both') then return json_build_object('err', 'bad_action'); end if;
    update jisr_settings set wa_mode = _arg where id = 1;
  elsif _act = 'wa_sent' then update jisr_items set wa_sent_at = coalesce(wa_sent_at, now()) where code = _arg;
  elsif _act = 'remove' then  -- إزالة إعلان خاطئ أو مشتبه به نهائيًا
    perform jisr_log('removed', _arg, me);
    delete from jisr_items where code = _arg;
    perform jisr_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;
