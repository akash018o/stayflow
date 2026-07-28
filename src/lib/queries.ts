import { supabase } from './supabase'
import type { RoomType, Room, BlockedDate, Booking } from '../types'

export async function fetchRoomTypes(): Promise<RoomType[]> {
  const { data, error } = await supabase.from('room_types').select('*').order('price_per_night')
  if (error) throw error
  return data as RoomType[]
}

export async function fetchRooms(): Promise<Room[]> {
  const { data, error } = await supabase.from('rooms').select('*')
  if (error) throw error
  return data as Room[]
}

export interface AvailabilityRow {
  room_id: string
  check_in: string
  check_out: string
}

// Reads from the room_availability VIEW, never the bookings table directly --
// that view exposes only room_id/check_in/check_out, so guest name/email/
// payment_id never reach the browser via the public anon key.
export async function fetchAvailabilityRows(): Promise<AvailabilityRow[]> {
  const { data, error } = await supabase.from('room_availability').select('room_id, check_in, check_out')
  if (error) throw error
  return data as AvailabilityRow[]
}

export async function fetchBlockedDates(): Promise<BlockedDate[]> {
  const { data, error } = await supabase.from('blocked_dates').select('*')
  if (error) throw error
  return data as BlockedDate[]
}

// Full booking rows, guest PII included. Only returns data at all because
// of the "owners can read all bookings" RLS policy (0004) -- for anyone
// without a row in `owners`, this same query returns an empty result, not
// an error, since RLS filters rows rather than blocking the query itself.
export async function fetchAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase.from('bookings').select('*').order('check_in')
  if (error) throw error
  return data as Booking[]
}

// Reads from the booking_status VIEW (id/status/dates/price only) --
// lets a guest's browser poll their own booking after paying, without
// bookings' full RLS lockdown exposing anyone else's name or email.
export async function fetchBookingStatus(bookingId: string): Promise<string> {
  const { data, error } = await supabase.from('booking_status').select('status').eq('id', bookingId).single()
  if (error) throw error
  return data.status as string
}
