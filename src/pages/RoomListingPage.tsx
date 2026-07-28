import { useEffect, useState } from 'react'
import { Wifi, Coffee, Mountain, ParkingCircle, Flame, Droplet } from 'lucide-react'
import ContourDivider from '../components/ContourDivider'
import RoomCard from '../components/RoomCard'
import HeroIllustration from '../components/HeroIllustration'
import { fetchRoomTypes, fetchRooms } from '../lib/queries'
import { countRoomsOfType } from '../lib/rooms'
import { isSupabaseConfigured } from '../lib/supabase'
import { CHECK_IN_TIME, CHECK_OUT_TIME, aboutText, testimonials } from '../data/siteContent'
import type { RoomType, Room } from '../types'

const amenities = [
  { Icon: Wifi, label: 'Free Wi-Fi' },
  { Icon: Coffee, label: 'Breakfast included' },
  { Icon: Mountain, label: 'River & mountain views' },
  { Icon: ParkingCircle, label: 'Free parking' },
  { Icon: Flame, label: 'Evening bonfire' },
  { Icon: Droplet, label: '24/7 hot water' },
]

export default function RoomListingPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    Promise.all([fetchRoomTypes(), fetchRooms()])
      .then(([rt, r]) => {
        setRoomTypes(rt)
        setRooms(r)
        setStatus('ready')
      })
      .catch((err) => {
        console.error('Failed to load rooms from Supabase:', err)
        setStatus('error')
      })
  }, [])

  return (
    <>
      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-8 items-center px-7 pt-10 pb-8">
        <div>
          <p className="font-data text-[11px] tracking-wider uppercase text-muted mb-2">
            Rishikesh, Uttarakhand
          </p>
          <h1 className="font-display text-4xl font-semibold text-ink mb-3">Akash Homestay</h1>
          <p className="text-sm text-muted max-w-md mb-5">
            Riverside rooms and wood balconies, five minutes from the ghats.
          </p>
          <a
            href="#rooms"
            className="inline-block bg-teal text-card rounded-lg py-2.5 px-5 text-sm font-medium"
          >
            View rooms &amp; book
          </a>
        </div>
        <HeroIllustration className="w-full h-56 md:h-64 rounded-xl" />
      </div>

      <ContourDivider />

      {/* Amenities */}
      <div className="px-7 py-8 grid grid-cols-2 sm:grid-cols-3 gap-5">
        {amenities.map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5">
            <Icon size={18} className="text-teal shrink-0" />
            <span className="text-sm text-ink">{label}</span>
          </div>
        ))}
      </div>

      <ContourDivider />

      {/* Rooms */}
      <div id="rooms" className="px-7 pt-8 pb-3">
        <h2 className="font-display text-xl font-semibold text-ink mb-1.5">Rooms</h2>
        <p className="text-xs text-muted">
          Check-in from {CHECK_IN_TIME} &middot; Check-out by {CHECK_OUT_TIME}
        </p>
      </div>

      {status === 'loading' && <p className="px-7 py-6 text-sm text-muted">Loading rooms…</p>}

      {status === 'error' && (
        <p className="px-7 py-6 text-sm text-brass max-w-md">
          {isSupabaseConfigured
            ? "Couldn't load rooms from Supabase. Check that the migration and seed SQL have been run in your project's SQL Editor."
            : 'Supabase is not configured yet. Copy .env.example to .env and add your project URL and anon key (see SETUP.md).'}
        </p>
      )}

      {status === 'ready' && (
        <div
          className="grid gap-4 px-7 pt-4 pb-10"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        >
          {roomTypes.map((roomType) => (
            <RoomCard
              key={roomType.id}
              roomType={roomType}
              roomCount={countRoomsOfType(rooms, roomType.id)}
            />
          ))}
        </div>
      )}

      <ContourDivider />

      {/* About */}
      <div className="px-7 py-10 max-w-2xl">
        <h2 className="font-display text-xl font-semibold text-ink mb-3">About the stay</h2>
        <p className="text-sm text-muted leading-relaxed">{aboutText}</p>
      </div>

      <ContourDivider />

      {/* Testimonials */}
      <div className="px-7 py-10">
        <h2 className="font-display text-xl font-semibold text-ink mb-5">From past guests</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-card border border-border-soft rounded-xl p-4">
              <p className="text-sm text-ink leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
              <p className="text-xs text-muted font-data">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
