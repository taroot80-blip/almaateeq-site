-- =====================================================================
-- جسر العطاء: تحديث 10 — في النسخة المفتوحة يظهر اسم المعلن بجانب زر «احجز» (لمن دخل برقمه فيها فقط)
-- يشمل تحديث 9، فيكفي تشغيله وحده. يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
alter table jisr_profiles add column if not exists show_name boolean not null default false;

create or replace function jisr_claim_phone(_name text, _phone text) returns json
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); anon boolean; p text; cur jisr_profiles; owner_anon boolean;
begin
  if uid is null then return json_build_object('err', 'login'); end if;
  select coalesce(is_anonymous, false) into anon from auth.users where id = uid;
  if not anon then return jisr_set_profile(_name, _phone); end if;   -- حساب بإيميل: المسار العادي
  select * into cur from jisr_profiles where user_id = uid;
  if found then
    update jisr_profiles set show_name = true, name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end where user_id = uid;
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
    update jisr_profiles set user_id = uid, show_name = true,
      name = case when coalesce(trim(_name), '') <> '' then left(trim(_name), 30) else name end where phone = p;
    return json_build_object('ok', true, 'phone', p);
  end if;
  insert into jisr_profiles (phone, user_id, name, show_name) values (p, uid, left(coalesce(trim(_name), ''), 30), true);
  return json_build_object('ok', true, 'phone', p);
end $$;
revoke execute on function jisr_claim_phone(text, text) from public, anon;
grant execute on function jisr_claim_phone(text, text) to authenticated;

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
    'slots', s.slots, 'me', me, 'profile', prof, 'waMode', s.wa_mode, 'expMode', s.exp_mode, 'groupName', s.group_name, 'groupLink', s.group_link,
    'items', coalesce((select json_agg(json_build_object(
        'code', i.code, 'title', i.title, 'det', i.det, 'area', i.area, 'cond', i.cond, 'pick', i.pick,
        'cat', i.cat, 'icon', i.icon, 'photos', i.photos,
        'pickTime', case when i.pick_from is null then null else json_build_object('from', i.pick_from, 'to', i.pick_to) end,
        'status', i.status, 'given', i.given, 'cancelled', i.cancelled, 'shows', i.shows, 'cancels', i.cancels, 'relists', i.relists, 'expired', i.expired, 'waSent', case when adm or i.owner = me then i.wa_sent_at is not null end,
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'ownerName', (select case when pr.show_name and coalesce(pr.name, '') <> '' then pr.name end from jisr_profiles pr where pr.phone = i.owner),
        'owner', case when adm or i.owner = me or i.queue[1] = me then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or i.owner = me then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end
      ) order by i.created)
      from jisr_items i
      where (i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from jisr_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from jisr_profiles), '{}'::json) end
  ) into res from jisr_settings s where s.id = 1;
  return res;
end $$;
