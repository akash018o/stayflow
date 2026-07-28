import { createClient } from 'jsr:@supabase/supabase-js@2'

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Browsers require these headers on every response (including errors) for
// a cross-origin request -- our frontend at localhost:5173 calling this
// function at supabase.co counts as cross-origin. Without this, the
// browser blocks the response before our JS ever sees it, regardless of
// whether the function itself succeeded.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // The browser sends this OPTIONS request first, before the real POST,
  // to ask "am I allowed to call this?" It needs a response with the CORS
  // headers, or the real request never gets sent at all.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const { booking_id } = await req.json()
  if (!booking_id) {
    return new Response(JSON.stringify({ error: 'booking_id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, total_price, status')
    .eq('id', booking_id)
    .single()

  if (error || !booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (booking.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Booking is not awaiting payment' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const amountPaise = Math.round(Number(booking.total_price) * 100)

  const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: booking.id,
    }),
  })

  if (!orderRes.ok) {
    console.error('Razorpay order creation failed:', await orderRes.text())
    return new Response(JSON.stringify({ error: 'Could not create payment order' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const order = await orderRes.json()

  await supabase.from('bookings').update({ razorpay_order_id: order.id }).eq('id', booking.id)

  return new Response(
    JSON.stringify({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: RAZORPAY_KEY_ID,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
