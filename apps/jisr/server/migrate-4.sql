-- جسر العطاء: زر «أعِد عرضه» لما أُلغي (لصاحبه وللإدارة)
create or replace function jisr_owner_action(_code text, _act text) returns json
language plpgsql security definer set search_path = public as $$
declare me text := jisr_me(); it jisr_items;
begin
  select * into it from jisr_items where code = _code for update;
  if not found or (it.owner <> me and not jisr_is_admin(me)) then return json_build_object('err', 'not_found'); end if;
  if it.given or it.status = 'given' then return json_build_object('err', 'closed'); end if;
  -- إعادة عرض ما أُلغي: يعود إلى قائمة الانتظار بالرمز نفسه، ويُنشر في واتساب مرة جديدة
  if _act = 'relist' then
    if not (it.cancelled or it.status = 'cancelled') then return json_build_object('err', 'closed'); end if;
    perform jisr_log('posted', it.code, it.owner);
    update jisr_items set cancelled = false, cancelled_at = null, queue = '{}', wa_sent_at = null,
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
      status = case when status <> 'shown' then 'cancelled' else status end,
      cancelled_at = now() where code = it.code;
  else return json_build_object('err', 'bad_action');
  end if;
  return json_build_object('ok', true);
end $$;
