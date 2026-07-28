import { useEffect, useState } from 'react'
import { getSession, checkIsOwner, signInOwner, signOutOwner } from '../lib/auth'
import { fetchAllBookings, fetchRooms, fetchRoomTypes, fetchBlockedDates } from '../lib/queries'
import { createBlockedDate, deleteBlockedDate } from '../lib/mutations'
import { supabase } from '../lib/supabase'
import type { Booking, Room, RoomType, BlockedDate } from '../types'

type AuthState = 'checking' | 'logged-out' | 'not-owner' | 'owner'

export default function OwnerDashboardPage() {
  const [authState, setAuthState] = useState<AuthState>('checking')
  const [userId, setUserId] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])

  const [blockRoomId, setBlockRoomId] = useState('')
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockSubmitting, setBlockSubmitting] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)

  // Check for an existing session on load, then keep listening for
  // login/logout events (e.g. the sign-out button below).
  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        setAuthState('logged-out')
        return
      }
      setUserId(session.user.id)
      checkIsOwner(session.user.id).then((isOwner) => {
        setAuthState(isOwner ? 'owner' : 'not-owner')
      })
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthState('logged-out')
        setUserId(null)
        return
      }
      setUserId(session.user.id)
      checkIsOwner(session.user.id).then((isOwner) => {
        setAuthState(isOwner ? 'owner' : 'not-owner')
      })
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (authState !== 'owner') return
    Promise.all([fetchAllBookings(), fetchRooms(), fetchRoomTypes(), fetchBlockedDates()])
      .then(([b, r, rt, bd]) => {
        setBookings(b)
        setRooms(r)
        setRoomTypes(rt)
        setBlockedDates(bd)
        setDataStatus('ready')
      })
      .catch((err) => {
        console.error('Failed to load owner dashboard data:', err)
        setDataStatus('error')
      })
  }, [authState])

  async function handleLogin() {
    setLoginSubmitting(true)
    setLoginError(null)
    try {
      await signInOwner(loginEmail.trim(), loginPassword)
      // onAuthStateChange above picks up the new session automatically.
    } catch (err) {
      console.error('Login failed:', err)
      setLoginError('Incorrect email or password.')
    } finally {
      setLoginSubmitting(false)
    }
  }

  function hasBookingConflict(roomId: string, start: string, end: string): boolean {
    return bookings.some(
      (b) => b.room_id === roomId && b.status !== 'cancelled' && b.check_in < end && b.check_out > start,
    )
  }

  async function handleAddBlock() {
    if (!blockRoomId || !blockStart || !blockEnd) return
    if (hasBookingConflict(blockRoomId, blockStart, blockEnd)) {
      setBlockError('This room already has a guest booking in that range — blocking it would conflict with a paying guest.')
      return
    }
    setBlockSubmitting(true)
    setBlockError(null)
    try {
      await createBlockedDate({
        roomId: blockRoomId,
        startDate: blockStart,
        endDate: blockEnd,
        reason: blockReason,
      })
      const updated = await fetchBlockedDates()
      setBlockedDates(updated)
      setBlockRoomId('')
      setBlockStart('')
      setBlockEnd('')
      setBlockReason('')
    } catch (err) {
      console.error('Failed to add blocked date:', err)
      setBlockError('Could not add that block. Check the dates and try again.')
    } finally {
      setBlockSubmitting(false)
    }
  }

  async function handleRemoveBlock(id: string) {
    try {
      await deleteBlockedDate(id)
      setBlockedDates((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      console.error('Failed to remove blocked date:', err)
    }
  }

  function roomLabel(roomId: string): string {
    const room = rooms.find((r) => r.id === roomId)
    if (!room) return 'Unknown room'
    const roomType = roomTypes.find((rt) => rt.id === room.room_type_id)
    return roomType ? `${roomType.name} \u2014 ${room.room_label}` : room.room_label
  }

  if (authState === 'checking') {
    return <p className="p-8 text-sm text-muted">Checking login…</p>
  }

  if (authState === 'logged-out') {
    return (
      <div className="px-7 py-8 max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-semibold text-ink mb-4">Owner login</h1>
        <div className="flex flex-col gap-2">
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            className="border border-border-soft rounded-lg px-3 py-2 text-sm text-ink bg-card"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="border border-border-soft rounded-lg px-3 py-2 text-sm text-ink bg-card"
          />
        </div>
        {loginError && <p className="text-xs text-brass mt-2">{loginError}</p>}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loginSubmitting || !loginEmail || !loginPassword}
          className="w-full mt-4 bg-teal text-card rounded-lg py-3 text-sm font-medium disabled:opacity-40"
        >
          {loginSubmitting ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-xs text-muted mt-4">
          Owner accounts are created manually, not through this form — see SETUP.md.
        </p>
      </div>
    )
  }

  if (authState === 'not-owner') {
    return (
      <div className="p-8">
        <p className="text-ink mb-3">
          This account ({userId}) is signed in but isn't registered as an owner.
        </p>
        <button
          type="button"
          onClick={() => signOutOwner()}
          className="text-sm bg-teal text-card rounded-lg py-2 px-4"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="px-7 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Owner dashboard</h1>
        <button
          type="button"
          onClick={() => signOutOwner()}
          className="text-xs text-muted border border-border-soft rounded-lg py-1.5 px-3"
        >
          Sign out
        </button>
      </div>

      {dataStatus === 'loading' && <p className="text-sm text-muted">Loading…</p>}
      {dataStatus === 'error' && <p className="text-sm text-brass">Couldn't load dashboard data.</p>}

      {dataStatus === 'ready' && (
        <>
          <section className="mb-10">
            <h2 className="font-display text-lg font-semibold text-ink mb-3">Bookings</h2>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted">No bookings yet.</p>
            ) : (
              <div className="border border-border-soft rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-stone text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium text-muted">Room</th>
                      <th className="px-3 py-2 font-medium text-muted">Guest</th>
                      <th className="px-3 py-2 font-medium text-muted">Dates</th>
                      <th className="px-3 py-2 font-medium text-muted">Status</th>
                      <th className="px-3 py-2 font-medium text-muted">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-t border-border-soft">
                        <td className="px-3 py-2 text-ink">{roomLabel(b.room_id)}</td>
                        <td className="px-3 py-2 text-ink">
                          {b.guest_name}
                          <div className="text-xs text-muted">{b.guest_email}</div>
                        </td>
                        <td className="px-3 py-2 text-ink">
                          {b.check_in} &rarr; {b.check_out}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-teal-dark bg-teal-tint px-2 py-1 rounded-md">
                            {b.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-data text-ink">
                          ₹{Number(b.total_price).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink mb-3">Blocked dates</h2>

            <div className="border border-border-soft rounded-xl p-4 mb-4 flex flex-col gap-2 max-w-md">
              <select
                value={blockRoomId}
                onChange={(e) => setBlockRoomId(e.target.value)}
                className="border border-border-soft rounded-lg px-3 py-2 text-sm text-ink bg-card"
              >
                <option value="">Select a room</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {roomLabel(r.id)}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  className="border border-border-soft rounded-lg px-3 py-2 text-sm text-ink bg-card flex-1"
                />
                <input
                  type="date"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  className="border border-border-soft rounded-lg px-3 py-2 text-sm text-ink bg-card flex-1"
                />
              </div>
              <input
                type="text"
                placeholder="Reason (optional)"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="border border-border-soft rounded-lg px-3 py-2 text-sm text-ink bg-card"
              />
              {blockError && <p className="text-xs text-brass">{blockError}</p>}
              <button
                type="button"
                onClick={handleAddBlock}
                disabled={blockSubmitting || !blockRoomId || !blockStart || !blockEnd}
                className="bg-teal text-card rounded-lg py-2 text-sm font-medium disabled:opacity-40"
              >
                {blockSubmitting ? 'Adding…' : 'Add block'}
              </button>
            </div>

            {blockedDates.length === 0 ? (
              <p className="text-sm text-muted">No manual blocks set.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {blockedDates.map((b) => (
                  <li
                    key={b.id}
                    className="border border-border-soft rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                  >
                    <span className="text-ink">
                      {roomLabel(b.room_id)} &middot; {b.start_date} &rarr; {b.end_date}
                      {b.reason && <span className="text-muted"> ({b.reason})</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(b.id)}
                      className="text-xs text-brass"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
