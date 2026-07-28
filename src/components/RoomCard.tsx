import { Link } from 'react-router-dom'
import type { RoomType } from '../types'
import RoomIllustration from './RoomIllustration'

interface RoomCardProps {
  roomType: RoomType
  roomCount: number
}

export default function RoomCard({ roomType, roomCount }: RoomCardProps) {
  const isPremium = roomType.view_variant === 'valley'

  return (
    <div className="bg-card border border-border-soft rounded-xl p-4 flex flex-col gap-2 transition-shadow hover:shadow-md">
      <RoomIllustration variant={roomType.view_variant} className="w-full h-28 rounded-lg" />
      <h3 className="font-display text-base font-semibold text-ink">{roomType.name}</h3>
      <p className="text-xs text-muted leading-relaxed">{roomType.description}</p>
      <span className="text-xs text-teal-dark bg-teal-tint px-2 py-1 rounded-md self-start">
        {roomCount} {roomCount === 1 ? 'room' : 'rooms'} of this type
      </span>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-data text-base font-medium text-ink">
          ₹{roomType.price_per_night.toLocaleString('en-IN')}
        </span>
        <span className="text-xs text-muted">/night</span>
      </div>
      <Link
        to={`/rooms/${roomType.id}`}
        className={`mt-1 text-center rounded-lg py-2 text-sm font-medium text-card ${
          isPremium ? 'bg-brass' : 'bg-teal'
        }`}
      >
        View & book
      </Link>
    </div>
  )
}
