import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.\n' +
      'Run this with: node --env-file=.env scripts/test-race-condition.mjs',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Valley Suite has only 1 physical room -- both requests are forced to
// fight over the exact same room, which is the clearest possible proof
// the conflict-prevention logic works (or doesn't).
const ROOM_TYPE_ID = '33333333-3333-3333-3333-333333333333' // Valley Suite
const CHECK_IN = '2026-09-01'
const CHECK_OUT = '2026-09-03'

async function attemptBooking(label) {
  const { data, error } = await supabase.rpc('create_booking', {
    p_room_type_id: ROOM_TYPE_ID,
    p_check_in: CHECK_IN,
    p_check_out: CHECK_OUT,
    p_guest_name: `Race Test ${label}`,
    p_guest_email: `racetest-${label}@example.com`,
  })
  return { label, data, error: error?.message ?? null }
}

async function main() {
  console.log(`Firing two simultaneous bookings for Valley Suite, ${CHECK_IN} -> ${CHECK_OUT}...\n`)

  const [a, b] = await Promise.all([attemptBooking('A'), attemptBooking('B')])

  console.log('Result A:', a.error ? `REJECTED (${a.error})` : `SUCCEEDED (booking ${a.data.id})`)
  console.log('Result B:', b.error ? `REJECTED (${b.error})` : `SUCCEEDED (booking ${b.data.id})`)

  const succeeded = [a, b].filter((r) => !r.error)

  if (succeeded.length === 1) {
    console.log('\nPASS -- exactly one request succeeded, the other was correctly rejected.')
  } else if (succeeded.length === 2) {
    console.log('\nFAIL -- both requests succeeded. Double-booking occurred; the conflict-prevention logic has a bug.')
  } else {
    console.log(
      '\nInconclusive -- neither request succeeded. Check that 2026-09-01 to 2026-09-03 on Valley Suite is actually free before re-running (delete any leftover test bookings in Table Editor, or change the dates in this script).',
    )
  }
}

main()
