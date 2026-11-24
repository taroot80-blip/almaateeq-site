-- =====================================================================
-- جسر العطاء: تحديث 8 — عدّاد إعادة العرض: ثلاث مرات فقط، ثم يُصوَّر الغرض ويُعرض إعلانًا جديدًا
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
alter table jisr_items add column if not exists relists int not null default 0;

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

create or replace function jisr_owner_action(_code text, _act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items;
begin
  select * into it from jisr_items where code = _code for update;
  if not found or (it.owner <> me and not jisr_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'closed'); end if;
  -- إعادة عرض ما أُلغي: يعود إلى قائمة الانتظار بالرمز نفسه، ويُنشر في واتساب مرة جديدة
  if _act = 'relist' then
    if it.expired and not it.cancelled and it.status = 'shown' then  -- تجديد ما انتهى وقته ليوم جديد
      update jisr_items set expired = false, shown_at = now() where code = it.code;
      return json_build_object('ok', true);
    end if;
    if not (it.cancelled or it.status = 'cancelled') then return json_build_object('err', 'closed'); end if;
    if it.relists >= 3 then return json_build_object('err', 'relist_limit'); end if;  -- ثلاث إعادات فقط، ثم يُصوَّر ويُعرض من جديد
    perform jisr_log('posted', it.code, it.owner);
    update jisr_items set cancelled = false, cancelled_at = null, queue = '{}', wa_sent_at = null, expired = false, relists = relists + 1,
      status = case when status = 'shown' then 'shown' else 'waiting' end, created = now() where code = it.code;
    perform jisr_fill(now());
    return json_build_object('ok', true);
  end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'closed'); end if;
  if _act = 'given' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform jisr_log('given', it.code, it.queue[1]);
    update jisr_items set given = true, given_at = now(), queue = '{}',
      status = case when status = 'reserved' then 'given' else status end where code = it.code;
  elsif _act = 'skip' then
    if cardinality(it.queue) = 0 then return json_build_object('err', 'no_booker'); end if;
    perform jisr_log('returned', it.code, it.queue[1]);
    update jisr_items set queue = queue[2:], booked_at = now(), cancels = cancels + 1 where code = it.code;
    if it.status = 'reserved' and cardinality(it.queue) = 1 then perform jisr_to_store(it.code, now()); end if;
  elsif _act = 'cancel' then
    perform jisr_log('cancelled', it.code, it.owner);
    update jisr_items set cancelled = true, queue = '{}',
      status = case when status <> 'shown' or expired then 'cancelled' else status end,
      cancelled_at = now() where code = it.code;
    perform jisr_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;
