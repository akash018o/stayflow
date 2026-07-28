import type { RoomType, Room, Booking } from '../types'

// Retired from live use as of Phase 5 -- pages now fetch from Supabase via
// lib/queries.ts. Kept as fixtures: same content as supabase/seed.sql,
// useful for Phase 9 tests without needing a live database.

export const mockRoomTypes: RoomType[] = [
  {
    id: 'rt-deluxe',
    name: 'Riverside Deluxe',
    description: 'River-view balcony, sleeps 3',
    price_per_night: 3200,
    max_guests: 3,
    images: [],
    view_variant: 'river',
  },
  {
    id: 'rt-standard',
    name: 'Mountain Standard',
    description: 'Simple, comfortable, sleeps 2',
    price_per_night: 2200,
    max_guests: 2,
    images: [],
    view_variant: 'mountain',
  },
  {
    id: 'rt-suite',
    name: 'Valley Suite',
    description: 'Family suite with living area, sleeps 4',
    price_per_night: 4800,
    max_guests: 4,
    images: [],
    view_variant: 'valley',
  },
]

export const mockRooms: Room[] = [
  { id: 'r1', room_type_id: 'rt-deluxe', room_label: 'Deluxe-1' },
  { id: 'r2', room_type_id: 'rt-deluxe', room_label: 'Deluxe-2' },
  { id: 'r3', room_type_id: 'rt-deluxe', room_label: 'Deluxe-3' },
  { id: 'r4', room_type_id: 'rt-standard', room_label: 'Standard-1' },
  { id: 'r5', room_type_id: 'rt-standard', room_label: 'Standard-2' },
  { id: 'r6', room_type_id: 'rt-suite', room_label: 'Suite-1' },
]

// Deluxe (3 rooms): only Aug 10-12 has all 3 rooms overlapping
// Standard (2 rooms): only Aug 7 has both rooms overlapping
// Suite (1 room): any booking blocks the whole type
export const mockBookings: Booking[] = [
  { id: 'b1', room_id: 'r1', guest_name: 'A. Sharma', guest_email: 'a@example.com', check_in: '2026-08-10', check_out: '2026-08-13', status: 'confirmed', total_price: 9600, payment_id: null },
  { id: 'b2', room_id: 'r2', guest_name: 'R. Verma', guest_email: 'r@example.com', check_in: '2026-08-10', check_out: '2026-08-12', status: 'confirmed', total_price: 6400, payment_id: null },
  { id: 'b3', room_id: 'r3', guest_name: 'K. Singh', guest_email: 'k@example.com', check_in: '2026-08-11', check_out: '2026-08-13', status: 'confirmed', total_price: 6400, payment_id: null },
  { id: 'b4', room_id: 'r4', guest_name: 'M. Das', guest_email: 'm@example.com', check_in: '2026-08-05', check_out: '2026-08-08', status: 'confirmed', total_price: 6600, payment_id: null },
  { id: 'b5', room_id: 'r5', guest_name: 'P. Rao', guest_email: 'p@example.com', check_in: '2026-08-07', check_out: '2026-08-09', status: 'confirmed', total_price: 4400, payment_id: null },
  { id: 'b6', room_id: 'r6', guest_name: 'S. Iyer', guest_email: 's@example.com', check_in: '2026-08-15', check_out: '2026-08-18', status: 'confirmed', total_price: 14400, payment_id: null },
]
