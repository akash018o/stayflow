// Mirrors the Phase 1 schema. Kept in one place so every component
// imports the same shape of data instead of redefining it locally.

export interface RoomType {
  id: string
  name: string
  description: string
  price_per_night: number
  max_guests: number
  images: string[]
  view_variant: 'river' | 'mountain' | 'valley'
}

export interface Room {
  id: string
  room_type_id: string
  room_label: string // e.g. "Deluxe-1"
}

export interface Booking {
  id: string
  room_id: string
  guest_name: string
  guest_email: string
  check_in: string // ISO date
  check_out: string // ISO date
  status: 'pending' | 'confirmed' | 'cancelled'
  total_price: number
  payment_id: string | null
}

export interface BlockedDate {
  id: string
  room_id: string
  start_date: string
  end_date: string
  reason: string | null
}
