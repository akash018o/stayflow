import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import RoomIllustration from '../components/RoomIllustration'
import BookingCalendar from '../components/BookingCalendar'
import { fetchRoomTypes, fetchRooms, fetchAvailabilityRows, fetchBlockedDates } from '../lib/queries'
import { countRoomsOfType } from '../lib/rooms'
import { computeUnavailableDates, type BusyInterval } from '../lib/availability'
import { isSupabaseConfigured } from '../lib/supabase'
import { CHECK_IN_TIME, CHECK_OUT_TIME } from '../data/siteContent'
import type { RoomType, Room } from '../types'

type Status = 'loading' | 'ready' | 'error' | 'not-found'

export default function RoomDetailPage() {
  const { roomTypeId } = useParams()
  const [roomType, setRoomType] = useState<RoomType | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!roomTypeId) return

    Promise.all([fetchRoomTypes(), fetchRooms(), fetchAvailabilityRows(), fetchBlockedDates()])
      .then(([roomTypes, allRooms, availabilityRows, blockedDates]) => {
        const match = roomTypes.find((rt) => rt.id === roomTypeId)
        if (!match) {
          setStatus('not-found')
          return
        }

        const intervals: BusyInterval[] = [
          ...availabilityRows.map((row) => ({
            room_id: row.room_id,
            start: new Date(row.check_in),
            end: new Date(row.check_out),
          })),
          ...blockedDates.map((b) => ({
            room_id: b.room_id,
            start: new Date(b.start_date),
            end: new Date(b.end_date),
          })),
        ]

        setRoomType(match)
        setRooms(allRooms)
        setUnavailableDates(computeUnavailableDates(roomTypeId, allRooms, intervals))
        setStatus('ready')
      })
      .catch((err) => {
        console.error('Failed to load room detail from Supabase:', err)
        setStatus('error')
      })
  }, [roomTypeId])

  if (status === 'loading') {
    return <p className="p-8 text-sm text-muted">Loading…</p>
  }

  if (status === 'not-found') {
    return (
      <div className="p-8">
        <p className="text-ink mb-2">Room not found.</p>
        <Link to="/" className="text-teal underline">Back to listing</Link>
      </div>
    )
  }

  if (status === 'error' || !roomType) {
    return (
      <p className="p-8 text-sm text-brass max-w-md">
        {isSupabaseConfigured
          ? "Couldn't load this room from Supabase. Check that the migration and seed SQL have been run."
          : 'Supabase is not configured yet. Copy .env.example to .env and add your project URL and anon key (see SETUP.md).'}
      </p>
    )
  }

  const roomCount = countRoomsOfType(rooms, roomType.id)

  return (
    <div className="px-7 py-8 max-w-2xl mx-auto">
      <Link to="/" className="text-xs text-muted mb-4 inline-block">
        &larr; Back to all rooms
      </Link>

      <RoomIllustration variant={roomType.view_variant} className="w-full h-56 rounded-xl mb-5" />

      <h1 className="font-display text-2xl font-semibold text-ink mb-1.5">{roomType.name}</h1>
      <p className="text-sm text-muted mb-3">{roomType.description}</p>

      <span className="text-xs text-teal-dark bg-teal-tint px-2 py-1 rounded-md inline-block mb-4">
        {roomCount} {roomCount === 1 ? 'room' : 'rooms'} of this type available to book
      </span>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="font-data text-xl font-medium text-ink">
          ₹{roomType.price_per_night.toLocaleString('en-IN')}
        </span>
        <span className="text-sm text-muted">/night</span>
      </div>

      <p className="text-xs text-muted mb-6">
        Check-in from {CHECK_IN_TIME} &middot; Check-out by {CHECK_OUT_TIME}
      </p>

      <div className="border border-border-soft rounded-xl p-4">
        <BookingCalendar
          roomTypeId={roomType.id}
          unavailableDates={unavailableDates}
          pricePerNight={roomType.price_per_night}
        />
      </div>
    </div>
  )
}
