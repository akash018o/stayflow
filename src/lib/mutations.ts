import { supabase } from './supabase'
import type { Booking } from '../types'

export interface CreateBookingParams {
  roomTypeId: string
  checkIn: string // yyyy-MM-dd
  checkOut: string // yyyy-MM-dd
  guestName: string
  guestEmail: string
}

// Calls the create_booking() database function -- never inserts into
// `bookings` directly. The function is where the room gets picked and
// locked atomically; doing that in JS here would reintroduce the exact
// race condition Phase 6 exists to close.
export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_room_type_id: params.roomTypeId,
    p_check_in: params.checkIn,
    p_check_out: params.checkOut,
    p_guest_name: params.guestName,
    p_guest_email: params.guestEmail,
  })
  if (error) throw error
  return data as Booking
}

// These two only succeed for a logged-in owner -- the "owners can manage
// blocked_dates" RLS policy from Phase 1 is what actually allows the
// insert/delete here, same as everywhere else owner access is enforced.
export interface CreateBlockedDateParams {
  roomId: string
  startDate: string
  endDate: string
  reason: string
}

export async function createBlockedDate(params: CreateBlockedDateParams): Promise<void> {
  const { error } = await supabase.from('blocked_dates').insert({
    room_id: params.roomId,
    start_date: params.startDate,
    end_date: params.endDate,
    reason: params.reason || null,
  })
  if (error) throw error
}

export async function deleteBlockedDate(id: string): Promise<void> {
  const { error } = await supabase.from('blocked_dates').delete().eq('id', id)
  if (error) throw error
}
