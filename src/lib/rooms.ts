import type { Room } from '../types'

export function countRoomsOfType(rooms: Room[], roomTypeId: string): number {
  return rooms.filter((r) => r.room_type_id === roomTypeId).length
}
