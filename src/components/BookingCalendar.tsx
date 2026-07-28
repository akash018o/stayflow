import { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import { createBooking } from '../lib/mutations'
import { createRazorpayOrder } from '../lib/payments'
import { fetchBookingStatus } from '../lib/queries'
import type { Booking } from '../types'

interface BookingCalendarProps {
  roomTypeId: string
  unavailableDates: Set<string>
  pricePerNight: number
}

type PayStatus =
  | 'idle'
  | 'creating-order'
  | 'checkout-open'
  | 'confirming'
  | 'confirmed'
  | 'confirming-slow'
  | 'cancelled'
  | 'error'

function toKey(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function BookingCalendar({ roomTypeId, unavailableDates, pricePerNight }: BookingCalendarProps) {
  const today = startOfDay(new Date())
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today))
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [payStatus, setPayStatus] = useState<PayStatus>('idle')

  const days = useMemo(() => {
    const start = startOfMonth(visibleMonth)
    const end = endOfMonth(visibleMonth)
    return eachDayOfInterval({ start, end })
  }, [visibleMonth])

  const isPast = (date: Date) => isBefore(date, today)
  const isUnavailable = (date: Date) => unavailableDates.has(toKey(date))
  const isInRange = (date: Date) => !!checkIn && !!checkOut && date > checkIn && date < checkOut

  function handleDayClick(date: Date) {
    if (isPast(date) || isUnavailable(date)) return

    if (!checkIn || checkOut || isBefore(date, checkIn)) {
      setCheckIn(date)
      setCheckOut(null)
      setRangeError(null)
      return
    }

    if (isSameDay(date, checkIn)) return

    let cursor = addDays(checkIn, 1)
    while (isBefore(cursor, date)) {
      if (isUnavailable(cursor)) {
        setRangeError('That range crosses a date with no rooms free — pick a shorter range.')
        return
      }
      cursor = addDays(cursor, 1)
    }

    setCheckOut(date)
    setRangeError(null)
  }

  const nights = checkIn && checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000) : 0
  const totalPrice = nights * pricePerNight
  const canSubmit = !!checkIn && !!checkOut && guestName.trim() !== '' && guestEmail.trim() !== ''

  async function pollForConfirmation(bookingId: string) {
    for (let i = 0; i < 10; i++) {
      await sleep(2000)
      try {
        const status = await fetchBookingStatus(bookingId)
        if (status === 'confirmed') {
          setPayStatus('confirmed')
          return
        }
      } catch (err) {
        console.error('Failed to poll booking status:', err)
      }
    }
    // Payment likely succeeded, but the webhook hasn't landed yet (or isn't
    // configured). Not an error -- just slower than the happy path.
    setPayStatus('confirming-slow')
  }

  async function startPayment(booking: Booking) {
    setPayStatus('creating-order')
    try {
      const order = await createRazorpayOrder(booking.id)

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'Akash Homestay',
        description: `${nights} night stay`,
        prefill: { name: guestName, email: guestEmail },
        handler: () => {
          // Fires once Razorpay's checkout completes client-side. This does
          // NOT confirm the booking by itself -- it just means it's time to
          // start watching for the webhook to confirm it server-side.
          setPayStatus('confirming')
          pollForConfirmation(booking.id)
        },
        modal: {
          ondismiss: () => setPayStatus('cancelled'),
        },
      })

      setPayStatus('checkout-open')
      rzp.open()
    } catch (err) {
      console.error('Could not start payment:', err)
      setPayStatus('error')
    }
  }

  async function handleSubmit() {
    if (!checkIn || !checkOut || !canSubmit) return
    setSubmitStatus('submitting')
    setSubmitError(null)
    try {
      const booking = await createBooking({
        roomTypeId,
        checkIn: toKey(checkIn),
        checkOut: toKey(checkOut),
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
      })
      setConfirmedBooking(booking)
      setSubmitStatus('idle')
      startPayment(booking)
    } catch (err) {
      console.error('Booking failed:', err)
      const message = err instanceof Error ? err.message : ''
      setSubmitError(
        message.includes('No rooms')
          ? 'Someone just booked those dates. Pick a different range.'
          : 'Could not create the booking. Please try again.',
      )
      setSubmitStatus('error')
    }
  }

  if (confirmedBooking) {
    return (
      <div>
        <p className="font-display text-base font-semibold text-ink mb-1">
          {payStatus === 'confirmed' ? 'Booking confirmed' : 'Booking requested'}
        </p>
        <p className="text-sm text-muted mb-3">
          {format(new Date(confirmedBooking.check_in), 'd MMM')} &rarr;{' '}
          {format(new Date(confirmedBooking.check_out), 'd MMM')}
        </p>
        <span className="text-xs text-teal-dark bg-teal-tint px-2 py-1 rounded-md inline-block mb-3">
          Status: {payStatus === 'confirmed' ? 'confirmed' : confirmedBooking.status}
        </span>
        <p className="font-data text-base font-medium text-ink mb-3">
          ₹{confirmedBooking.total_price.toLocaleString('en-IN')}
        </p>

        {payStatus === 'creating-order' && <p className="text-xs text-muted">Setting up payment…</p>}
        {payStatus === 'checkout-open' && <p className="text-xs text-muted">Complete payment in the window that opened.</p>}
        {payStatus === 'confirming' && <p className="text-xs text-muted">Payment received — confirming your booking…</p>}
        {payStatus === 'confirmed' && <p className="text-xs text-muted">You're all set.</p>}
        {payStatus === 'confirming-slow' && (
          <p className="text-xs text-brass">
            Payment went through, but confirmation is taking longer than usual. It'll update once
            the payment is processed.
          </p>
        )}
        {payStatus === 'cancelled' && (
          <div>
            <p className="text-xs text-brass mb-2">Payment was cancelled. Your booking is still on hold.</p>
            <button
              type="button"
              onClick={() => startPayment(confirmedBooking)}
              className="text-sm bg-teal text-card rounded-lg py-2 px-4"
            >
              Retry payment
            </button>
          </div>
        )}
        {payStatus === 'error' && (
          <div>
            <p className="text-xs text-brass mb-2">Couldn't start payment.</p>
            <button
              type="button"
              onClick={() => startPayment(confirmedBooking)}
              className="text-sm bg-teal text-card rounded-lg py-2 px-4"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
          disabled={isSameMonth(visibleMonth, today)}
          className="text-sm text-muted px-2 py-1 disabled:opacity-30"
        >
          &larr;
        </button>
        <p className="font-display text-sm font-semibold text-ink">{format(visibleMonth, 'MMMM yyyy')}</p>
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          className="text-sm text-muted px-2 py-1"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: days[0].getDay() }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map((date) => {
          const past = isPast(date)
          const unavailable = isUnavailable(date)
          const selected = (checkIn && isSameDay(date, checkIn)) || (checkOut && isSameDay(date, checkOut))
          const inRange = isInRange(date)

          let classes = 'text-xs rounded-md py-1.5 '
          if (past) classes += 'text-border-soft cursor-default'
          else if (unavailable) classes += 'text-muted line-through cursor-not-allowed bg-stone'
          else if (selected) classes += 'bg-teal text-card cursor-pointer'
          else if (inRange) classes += 'bg-teal-tint text-teal-dark cursor-pointer'
          else classes += 'text-ink cursor-pointer'

          return (
            <button
              key={toKey(date)}
              type="button"
              onClick={() => handleDayClick(date)}
              disabled={past || unavailable}
              className={classes}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>

      {rangeError && <p className="text-xs text-brass mt-2">{rangeError}</p>}

      <div className="mt-4 pt-4 border-t border-border-soft flex items-center justify-between">
        <p className="text-xs text-muted">
          {checkIn && checkOut
            ? `${format(checkIn, 'd MMM')} \u2192 ${format(checkOut, 'd MMM')} \u00b7 ${nights} ${nights === 1 ? 'night' : 'nights'}`
            : checkIn
              ? `${format(checkIn, 'd MMM')} \u2192 select check-out`
              : 'Select a check-in date'}
        </p>
        <p className="font-data text-sm font-medium text-ink">
          {checkIn && checkOut ? `\u20b9${totalPrice.toLocaleString('en-IN')}` : '\u2014'}
        </p>
      </div>

      {checkIn && checkOut && (
        <div className="mt-4 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Full name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="border border-border-soft rounded-lg px-3 py-2 text-sm text-ink bg-card"
          />
          <input
            type="email"
            placeholder="Email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="border border-border-soft rounded-lg px-3 py-2 text-sm text-ink bg-card"
          />
        </div>
      )}

      {submitError && <p className="text-xs text-brass mt-2">{submitError}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || submitStatus === 'submitting'}
        className="w-full mt-4 bg-teal text-card rounded-lg py-3 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitStatus === 'submitting' ? 'Requesting…' : 'Request booking & pay'}
      </button>
    </div>
  )
}
