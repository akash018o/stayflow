-- Links a booking to the Razorpay order created for it, so the webhook
-- (which only knows the order_id) can find the right booking to confirm.
alter table bookings add column razorpay_order_id text;
create index if not exists bookings_razorpay_order_id_idx on bookings (razorpay_order_id);

-- Narrow, publicly-readable view so a guest's own browser can poll their
-- booking's status after paying, without bookings' full RLS lockdown
-- (guest_name/email/payment_id) being exposed. Same "expose a view, keep
-- the base table locked" pattern as room_availability from Phase 5.
create view booking_status as
  select id, status, check_in, check_out, total_price
  from bookings;
