-- =====================================================================
-- جسر العطاء: تحديث 5 — يشمل تحديثَي 3 و4، فيكفي تشغيله وحده.
-- ما انتهى يومه ولم يُحجز لا يُحذف تلقائيًا: يبقى يومض، ولصاحبه وللإدارة «جدّد» أو «احذف».
-- يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
alter table jisr_items add column if not exists expired boolean not null default false;
alter table jisr_settings add column if not exists exp_mode text not null default 'flash';

-- ما انتهى وقته لا يشغل نافذة، فتمتلئ النوافذ من قائمة الانتظار
create or replace function jisr_fill(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare free int;
begin
  select s.slots - (select count(*) from jisr_items where status = 'shown' and not expired and not cancelled) into free from jisr_settings s where id = 1;
  if free > 0 then
    update jisr_items set status = 'shown', shows = shows + 1, shown_at = _t
    where code in (select code from jisr_items where status = 'waiting' order by created limit free);
  end if;
end $$;

create or replace function jisr_clear_expired() returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select code from jisr_items where status = 'shown' and expired and not given and not cancelled and cardinality(queue) = 0 for update loop
    perform jisr_to_store(r.code, now());
    update jisr_items set expired = false where code = r.code;
  end loop;
end $$;

create or replace function jisr_roll(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare r record; m text;
begin
  select exp_mode into m from jisr_settings where id = 1;
  for r in select * from jisr_items where status = 'shown' for update loop
    if r.given then update jisr_items set status = 'given', expired = false where code = r.code;
    elsif r.cancelled then perform jisr_to_store(r.code, _t, false);
    elsif cardinality(r.queue) > 0 then update jisr_items set status = 'reserved', expired = false where code = r.code;
    elsif m = 'flash' then update jisr_items set expired = true where code = r.code;  -- يبقى ويومض
    else perform jisr_to_store(r.code, _t);
    end if;
  end loop;
  update jisr_settings set cycle_start = _t where id = 1;
  perform jisr_fill(_t);
end $$;

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
    'slots', s.slots, 'me', me, 'profile', prof, 'waMode', s.wa_mode, 'expMode', s.exp_mode,
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
  elsif _act = 'clear_expired' then perform jisr_clear_expired();
  elsif _act = 'remove' then  -- إزالة إعلان خاطئ أو مشتبه به نهائيًا
    perform jisr_log('removed', _arg, me);
    delete from jisr_items where code = _arg;
    perform jisr_fill(now());
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
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
    perform jisr_log('posted', it.code, it.owner);
    update jisr_items set cancelled = false, cancelled_at = null, queue = '{}', wa_sent_at = null, expired = false,
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
revoke execute on function jisr_clear_expired() from public, anon, authenticated;
