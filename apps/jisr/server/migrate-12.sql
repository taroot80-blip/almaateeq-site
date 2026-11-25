-- =====================================================================
-- جسر العطاء: تحديث 12
--  • رفض العرض يحذفه من المنصة نهائيًا، ويبقى في الإحصاء مرفوضًا
--  • ما انتهى وقت عرضه ولم يحجزه أحد يُسجَّل في الإحصاء «انتهى ولم يُحجز»
--  • ما استلمه المستفيد يبقى بختمه 15 دقيقة ثم يختفي عن الجميع، وتفرغ نافذته (والأدمن يراه في سجله)
-- يُلصق في SQL Editor ثم Run بعد التحديث 11. يمكن تشغيله أكثر من مرة.
-- =====================================================================

create or replace function jisr_fill(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare free int;
begin
  select s.slots - (select count(*) from jisr_items where status = 'shown' and not expired and not cancelled
                     and not (given and given_at < _t - interval '15 minutes')) into free from jisr_settings s where id = 1;
  if free > 0 then
    update jisr_items set status = 'shown', shows = shows + 1, shown_at = _t
    where code in (select code from jisr_items where status = 'waiting' and approved order by coalesce(approved_at, created) limit free);
  end if;
end $$;

-- رفض العرض: يُحذف من المنصة، ويبقى أثره في الإحصاء
create or replace function jisr_reject(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me();
begin
  if not jisr_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  if not exists (select 1 from jisr_items where code = _code) then return json_build_object('err', 'not_found'); end if;
  perform jisr_log('rejected', _code, me);   -- يبقى في الإحصاء: عُرض ثم رُفض
  delete from jisr_items where code = _code;
  perform jisr_fill(now());
  return json_build_object('ok', true);
end $$;
revoke execute on function jisr_reject(text) from public, anon;
grant execute on function jisr_reject(text) to authenticated;

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
    'approveMode', s.approve_mode, 'confirmMode', s.confirm_mode,
    'items', coalesce((select json_agg(json_build_object(
        'code', i.code, 'title', i.title, 'det', i.det, 'area', i.area, 'cond', i.cond, 'pick', i.pick,
        'cat', i.cat, 'icon', i.icon, 'photos', i.photos,
        'pickTime', case when i.pick_from is null then null else json_build_object('from', i.pick_from, 'to', i.pick_to) end,
        'status', i.status, 'given', i.given, 'cancelled', i.cancelled, 'shows', i.shows, 'cancels', i.cancels, 'relists', i.relists, 'expired', i.expired, 'waSent', case when adm or i.owner = me then i.wa_sent_at is not null end,
        'approved', i.approved, 'confirmed', i.confirmed, 'givenAt', floor(extract(epoch from i.given_at) * 1000),
        'created', floor(extract(epoch from i.created) * 1000),
        'shownAt', floor(extract(epoch from i.shown_at) * 1000),
        'bookedAt', floor(extract(epoch from i.booked_at) * 1000),
        'ownerName', (select case when pr.show_name and coalesce(pr.name, '') <> '' then pr.name end from jisr_profiles pr where pr.phone = i.owner),
        'owner', case when adm or i.owner = me or (i.queue[1] = me and i.confirmed) then i.owner end,
        'queueLen', cardinality(i.queue),
        'myPos', coalesce(array_position(i.queue, me) - 1, -1),
        'first', case when adm or (i.owner = me and i.confirmed) then i.queue[1] end,
        'queue', case when adm then to_json(i.queue) end,
        'queueT', case when adm then i.queue_t end
      ) order by i.created)
      from jisr_items i
      where ((i.status = 'shown' and s.wa_mode <> 'whatsapp') or (me is not null and (i.owner = me or me = any(i.queue))))
            and not (i.given and i.given_at < now() - interval '15 minutes')
         or (adm and i.created > now() - interval '62 days')), '[]'::json),
    'log', case when adm then coalesce((select json_agg(json_build_object('t', floor(extract(epoch from e.t) * 1000), 'type', e.type, 'code', e.code, 'who', e.who, 'area', e.area, 'cat', e.cat) order by e.t)
        from jisr_events e where e.t > now() - interval '62 days'), '[]'::json) end,
    'people', case when adm then coalesce((select json_object_agg(phone, name) from jisr_profiles), '{}'::json) end
  ) into res from jisr_settings s where s.id = 1;
  return res;
end $$;

-- نهاية الدفعة: ما انتهى وقته ولم يحجزه أحد يُسجَّل في الإحصاء
create or replace function jisr_roll(_t timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare r record; m text;
begin
  select exp_mode into m from jisr_settings where id = 1;
  for r in select * from jisr_items where status = 'shown' for update loop
    if r.given then update jisr_items set status = 'given', expired = false where code = r.code;
    elsif r.cancelled then perform jisr_to_store(r.code, _t, false);
    elsif cardinality(r.queue) > 0 then update jisr_items set status = 'reserved', expired = false where code = r.code;
    elsif m = 'flash' then
      if not r.expired then perform jisr_log('expired', r.code, r.owner); end if;
      update jisr_items set expired = true where code = r.code;  -- يبقى ويومض
    else perform jisr_log('expired', r.code, r.owner); perform jisr_to_store(r.code, _t);
    end if;
  end loop;
  update jisr_settings set cycle_start = _t where id = 1;
  perform jisr_fill(_t);
end $$;
