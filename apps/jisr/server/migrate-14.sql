-- =====================================================================
-- جسر العطاء: تحديث 14 — البلد بند أساسي في التسجيل، وشرط للحجز، والتقرير التفصيلي للإدارة
-- بعد تحديث 13. يُلصق في SQL Editor ثم Run. يمكن تشغيله أكثر من مرة.
-- =====================================================================
alter table jisr_profiles add column if not exists area text;

create or replace function jisr_area_ok(_a text) returns boolean language sql immutable as $$
  select trim(coalesce(_a, '')) in ('تاروت','القطيف','سيهات','العوامية','صفوى','الأوجام','أم الحمام','الجارودية','الجش','أم الساهك','القديح','الدمام')
$$;

-- حفظ البلد أو تغييره لصاحب الحساب
create or replace function jisr_set_area(_area text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me();
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if not jisr_area_ok(_area) then return json_build_object('err', 'bad_area'); end if;
  update jisr_profiles set area = trim(_area) where phone = me;
  return json_build_object('ok', true, 'area', trim(_area));
end $$;
revoke execute on function jisr_set_area(text) from public, anon;
grant execute on function jisr_set_area(text) to authenticated;

-- التسجيل بالرقم صار يأخذ البلد أيضًا: الدالة القديمة تبقى باسم jisr_claim_phone0
do $$ begin
  if exists (select 1 from pg_proc where proname = 'jisr_claim_phone' and pronargs = 2) then
    alter function jisr_claim_phone(text, text) rename to jisr_claim_phone0;
  end if;
end $$;
create or replace function jisr_claim_phone(_name text, _phone text, _area text) returns json
language plpgsql security definer set search_path = public, auth as $$
declare r json;
begin
  if not jisr_area_ok(_area) then return json_build_object('err', 'bad_area'); end if;
  r := jisr_claim_phone0(_name, _phone);
  if (r ->> 'ok') is not null then
    update jisr_profiles set area = trim(_area) where user_id = auth.uid() or phone = (r ->> 'phone');
  end if;
  return r;
end $$;
revoke execute on function jisr_claim_phone0(text, text) from public, anon, authenticated;
revoke execute on function jisr_claim_phone(text, text, text) from public, anon;
grant execute on function jisr_claim_phone(text, text, text) to authenticated;

create or replace function jisr_book(_code text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items; pos int; act int; mx int;
begin
  if me is null then return json_build_object('err', 'login'); end if;
  if exists (select 1 from jisr_profiles where phone = me and banned) then return json_build_object('err', 'banned'); end if;
  -- البلد شرط للحجز: لا يحجز من لم يختر بلده
  if coalesce((select trim(area) from jisr_profiles where phone = me), '') = '' then return json_build_object('err', 'need_area'); end if;
  perform jisr_tick();
  select * into it from jisr_items where code = upper(trim(_code)) for update;
  if not found then return json_build_object('err', 'not_found'); end if;
  if it.cancelled or it.status = 'cancelled' then return json_build_object('err', 'cancelled'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'given'); end if;
  -- لا يحجز أحد غرضه، إلا الأدمن في غرض التجربة ليجرّب الدورة كاملة وحده
  if it.owner = me and not (it.test and jisr_is_admin(me)) then return json_build_object('err', 'own'); end if;
  pos := array_position(it.queue, me);
  if pos is null then
    if it.status <> 'shown' then return json_build_object('err', 'not_shown'); end if;
    if cardinality(it.queue) = 0 then
      select max_active into mx from jisr_settings where id = 1;
      select count(*) into act from jisr_items where queue[1] = me and not given and not cancelled and status in ('shown','reserved');
      if act >= mx then return json_build_object('err', 'limit', 'max', mx); end if;
    end if;
    update jisr_items set queue = array_append(queue, me),
      queue_t = queue_t || jsonb_build_object(me, floor(extract(epoch from now()) * 1000)),
      confirmed = case when cardinality(queue) = 0 then jisr_auto_confirm() else confirmed end,
      booked_at = case when cardinality(queue) = 0 then now() else booked_at end
    where code = it.code returning * into it;
    perform jisr_log('booked', it.code, me);
    pos := array_position(it.queue, me);
  end if;
  return json_build_object('ok', true, 'code', it.code, 'pos', pos - 1, 'confirmed', it.confirmed);
end $$;

create or replace function jisr_board() returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); adm boolean; prof json; res json;
begin
  perform jisr_tick();
  adm := jisr_is_admin(me);
  select json_build_object('name', name, 'isAdmin', is_admin, 'banned', banned, 'testMode', coalesce(test_mode, false), 'area', area) into prof from jisr_profiles where phone = me;
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
        'approved', i.approved, 'confirmed', i.confirmed, 'test', i.test, 'givenAt', floor(extract(epoch from i.given_at) * 1000),
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

-- التقرير التفصيلي للإدارة: كل غرض بعارضه ومستلمه، وتسلسل استلام كل مستفيد
create or replace function jisr_report() returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); res json;
begin
  if not jisr_is_admin(me) then return json_build_object('err', 'not_admin'); end if;
  with g as (
    select i.*, coalesce((select e.who from jisr_events e where e.type = 'given' and e.code = i.code order by e.t desc limit 1),
                         case when i.given then i.queue[1] end) as taker
    from jisr_items i where not coalesce(i.test, false)
  ), s as (
    select g.*, case when g.given and g.taker is not null then
      row_number() over (partition by case when g.given then g.taker end order by coalesce(g.given_at, g.created)) end as seq
    from g
  )
  select coalesce(json_agg(json_build_object(
      'code', s.code, 't', floor(extract(epoch from s.created) * 1000),
      'owner', s.owner, 'ownerName', po.name, 'area', coalesce(nullif(trim(split_part(s.area, '/', 1)), ''), 'غير محدد'),
      'title', s.title, 'cat', s.cat, 'status', s.status, 'given', s.given, 'cancelled', s.cancelled, 'expired', s.expired,
      'approved', s.approved, 'queueLen', cardinality(s.queue),
      'taker', s.taker, 'takerName', pt.name, 'takerArea', pt.area,
      'givenAt', floor(extract(epoch from s.given_at) * 1000), 'seq', s.seq
    ) order by s.created desc), '[]'::json) into res
  from s left join jisr_profiles po on po.phone = s.owner
         left join jisr_profiles pt on pt.phone = s.taker;
  return json_build_object('ok', true, 'rows', res);
end $$;
revoke execute on function jisr_report() from public, anon;
grant execute on function jisr_report() to authenticated;
