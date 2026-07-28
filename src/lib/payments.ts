import { supabase } from './supabase'

export interface RazorpayOrder {
  order_id: string
  amount: number
  currency: string
  key_id: string
}

export async function createRazorpayOrder(bookingId: string): Promise<RazorpayOrder> {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { booking_id: bookingId },
  })
  if (error) throw error
  return data as RazorpayOrder
}
