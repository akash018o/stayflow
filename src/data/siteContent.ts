// Static site content -- separate from room/booking data, which comes
// from Supabase. This is copy the owner would actually edit by hand.

export const CHECK_IN_TIME = '12:00 PM'
export const CHECK_OUT_TIME = '11:00 AM'

export const aboutText =
  "Akash Homestay sits a short walk from the ghats, where the Ganga runs cold and clear through the Himalayan foothills. Three room types, each looking out on a different part of the valley — river, mountain, or the wider valley beyond. Home-cooked meals, quiet mornings, and easy access to Rishikesh's temples, cafes, and rafting put-ins."

export interface Testimonial {
  name: string
  quote: string
}

// Static, curated quotes -- not a live guest review system. A real
// review feature (guest-submitted, moderated, tied to a booking) was
// explicitly marked out of scope back in Phase 0; this is just content,
// the same way the "about" text above is.
export const testimonials: Testimonial[] = [
  {
    name: 'Priya M.',
    quote:
      'Woke up to the sound of the river every morning. The Riverside Deluxe balcony was worth it on its own.',
  },
  {
    name: 'Daniel K.',
    quote:
      "Walked to the ghats in ten minutes, back in time for breakfast. Exactly the quiet base we wanted after the trek.",
  },
  {
    name: 'Ritu & family',
    quote:
      'The Valley Suite had enough room for all four of us, and the host helped us sort a rafting trip on short notice.',
  },
]
