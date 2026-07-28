-- Mirrors the mock data from Phases 3-4, so the live site behaves
-- identically to what you already tested before this was real data.

insert into room_types (id, name, description, price_per_night, max_guests, images, view_variant) values
  ('11111111-1111-1111-1111-111111111111', 'Riverside Deluxe', 'River-view balcony, sleeps 3', 3200, 3, '{}', 'river'),
  ('22222222-2222-2222-2222-222222222222', 'Mountain Standard', 'Simple, comfortable, sleeps 2', 2200, 2, '{}', 'mountain'),
  ('33333333-3333-3333-3333-333333333333', 'Valley Suite', 'Family suite with living area, sleeps 4', 4800, 4, '{}', 'valley');

insert into rooms (id, room_type_id, room_label) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Deluxe-1'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Deluxe-2'),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Deluxe-3'),
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Standard-1'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Standard-2'),
  ('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Suite-1');

insert into bookings (room_id, guest_name, guest_email, check_in, check_out, status, total_price) values
  ('a1111111-1111-1111-1111-111111111111', 'A. Sharma', 'a@example.com', '2026-08-10', '2026-08-13', 'confirmed', 9600),
  ('a2222222-2222-2222-2222-222222222222', 'R. Verma', 'r@example.com', '2026-08-10', '2026-08-12', 'confirmed', 6400),
  ('a3333333-3333-3333-3333-333333333333', 'K. Singh', 'k@example.com', '2026-08-11', '2026-08-13', 'confirmed', 6400),
  ('b1111111-1111-1111-1111-111111111111', 'M. Das', 'm@example.com', '2026-08-05', '2026-08-08', 'confirmed', 6600),
  ('b2222222-2222-2222-2222-222222222222', 'P. Rao', 'p@example.com', '2026-08-07', '2026-08-09', 'confirmed', 4400),
  ('c1111111-1111-1111-1111-111111111111', 'S. Iyer', 's@example.com', '2026-08-15', '2026-08-18', 'confirmed', 14400);
