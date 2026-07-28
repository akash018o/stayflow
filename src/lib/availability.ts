import { addDays, format } from 'date-fns'
import type { Room } from '../types'

export interface BusyInterval {
  room_id: string
  start: Date // inclusive
  end: Date // exclusive
}

// Mirrors the Phase 1 SQL overlap query. A date is unavailable for a room
// TYPE only when every physical room of that type has a busy interval
// covering it -- a busy interval being a guest booking OR an owner block.
export function computeUnavailableDates(
  roomTypeId: string,
  rooms: Room[],
  intervals: BusyInterval[],
  windowDays = 90,
): Set<string> {
  const roomIds = rooms.filter((r) => r.room_type_id === roomTypeId).map((r) => r.id)
  const relevant = intervals.filter((iv) => roomIds.includes(iv.room_id))

  const unavailable = new Set<string>()
  const today = new Date()

  for (let i = 0; i < windowDays; i++) {
    const date = addDays(today, i)
    const busyRoomIds = new Set(
      relevant.filter((iv) => date >= iv.start && date < iv.end).map((iv) => iv.room_id),
    )
    if (roomIds.length > 0 && roomIds.every((id) => busyRoomIds.has(id))) {
      unavailable.add(format(date, 'yyyy-MM-dd'))
    }
  }

  return unavailable
}
