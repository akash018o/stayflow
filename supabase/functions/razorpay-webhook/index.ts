import { createClient } from 'jsr:@supabase/supabase-js@2'

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  const expected = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return expected === signature
}

// Razorpay POSTs to this URL directly. This function never calls Razorpay
// to ask "did it work" -- Razorpay tells it, whenever it's ready. The
// signature check is the only thing distinguishing a real Razorpay
// notification from anyone else posting fake JSON at this public URL.
Deno.serve(async (req) => {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  const isValid = await verifySignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET)
  if (!isValid) {
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed', payment_id: payment.id })
      .eq('razorpay_order_id', payment.order_id)
      .eq('status', 'pending') // don't touch a booking that's already confirmed or cancelled

    if (error) {
      console.error('Failed to confirm booking after payment:', error)
      return new Response('Database update failed', { status: 500 })
    }
  }

  return new Response('OK', { status: 200 })
})
