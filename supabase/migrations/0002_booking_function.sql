-- Layer 2 first: a hard constraint that makes overlapping active bookings
-- for the same room physically impossible to store, no matter what path
-- the insert came from.

create extension if not exists btree_gist;

alter table bookings
  add column stay_range daterange generated always as (daterange(check_in, check_out, '[)')) stored;

alter table bookings
  add constraint no_overlapping_bookings
  exclude using gist (room_id with =, stay_range with &&)
  where (status <> 'cancelled');

-- Layer 1: the function the frontend actually calls. It picks a free room
-- of the requested type and creates the booking in one transaction.
--
-- "for update skip locked" locks the candidate room row for the duration
-- of this transaction. If a second call to this same function runs at the
-- same moment for the same room type, it skips any room already locked by
-- the first call and looks at the next one instead -- so two concurrent
-- requests can't both walk away thinking the same room is free.
--
-- security definer lets this function insert into `bookings` even though
-- the anon role has no direct insert policy on that table (see Phase 5) --
-- this function is the only door in.
create or replace function create_booking(
  p_room_type_id uuid,
  p_check_in date,
  p_check_out date,
  p_guest_name text,
  p_guest_email text
)
returns bookings
language plpgsql
security definer
as $$
declare
  v_room_id uuid;
  v_price numeric;
  v_nights int;
  v_total numeric;
  v_booking bookings;
begin
  if p_check_out <= p_check_in then
    raise exception 'check_out must be after check_in';
  end if;

  select price_per_night into v_price from room_types where id = p_room_type_id;
  if v_price is null then
    raise exception 'Room type not found';
  end if;

  v_nights := p_check_out - p_check_in;
  v_total := v_price * v_nights;

  select r.id into v_room_id
  from rooms r
  where r.room_type_id = p_room_type_id
    and not exists (
      select 1 from bookings b
      where b.room_id = r.id
        and b.status <> 'cancelled'
        and b.check_in < p_check_out
        and b.check_out > p_check_in
    )
    and not exists (
      select 1 from blocked_dates bd
      where bd.room_id = r.id
        and bd.start_date < p_check_out
        and bd.end_date > p_check_in
    )
  order by r.id
  for update skip locked
  limit 1;

  if v_room_id is null then
    raise exception 'No rooms of this type are available for those dates';
  end if;

  -- Created as 'pending', not 'confirmed' -- Phase 7's payment webhook is
  -- what flips it to 'confirmed'. Without that wired up yet, bookings will
  -- stay pending, which is correct for this phase.
  insert into bookings (room_id, guest_name, guest_email, check_in, check_out, status, total_price)
  values (v_room_id, p_guest_name, p_guest_email, p_check_in, p_check_out, 'pending', v_total)
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function create_booking(uuid, date, date, text, text) to anon;
