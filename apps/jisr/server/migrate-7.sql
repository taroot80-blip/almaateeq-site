-- =====================================================================
-- جسر العطاء: تحديث 7 — الإدارة تضع رابط الانضمام إلى مجموعة واتساب واسمها من المنصة
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
alter table jisr_settings add column if not exists group_name text not null default 'جسر العطاء الثاني 2️⃣';
alter table jisr_settings add column if not exists group_link text not null default 'https://chat.whatsapp.com/Jlydg5jeog868RHfjUVbLS';

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
      from jisr_items i
      where (i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue)))
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from jisr_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from jisr_profiles), '{}'::json) end
  ) into res from jisr_settings s where s.id = 1;
  return res;
end $$;

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
  elsif _act = 'exp_mode' then  -- ما انتهى وقته: يومض حتى يقرر صاحبه، أو يُلغى تلقائيًا
    if _arg not in ('flash','auto') then return json_build_object('err', 'bad_action'); end if;
    update jisr_settings set exp_mode = _arg where id = 1;
    if _arg = 'auto' then perform jisr_clear_expired(); end if;
  elsif _act = 'set_end' then  -- الإدارة تغيّر موعد انتهاء العد التنازلي (_arg: الموعد بالملّي ثانية)
    if _arg !~ '^[0-9]{12,14}$' or to_timestamp(_arg::bigint / 1000.0) <= now() or to_timestamp(_arg::bigint / 1000.0) > now() + interval '2 days'
      then return json_build_object('err', 'bad_action'); end if;
    update jisr_settings set cycle_start = to_timestamp(_arg::bigint / 1000.0) - interval '1 day' where id = 1;
  elsif _act = 'group_link' then  -- رابط دعوة مجموعة واتساب
    if _arg !~ '^https://chat\.whatsapp\.com/[A-Za-z0-9]{10,40}$' then return json_build_object('err', 'bad_link'); end if;
    update jisr_settings set group_link = _arg where id = 1;
  elsif _act = 'group_name' then
    if length(trim(coalesce(_arg, ''))) < 2 then return json_build_object('err', 'bad_action'); end if;
    update jisr_settings set group_name = left(trim(_arg), 60) where id = 1;
  elsif _act = 'clear_expired' then perform jisr_clear_expired();
  elsif _act = 'remove' then  -- إزالة إعلان خاطئ أو مشتبه به نهائيًا
    perform jisr_log('removed', _arg, me);
    delete from jisr_items where code = _arg;
    perform jisr_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;
