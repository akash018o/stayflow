# Connecting Akash Homestay to a real Supabase project

I can't create this project or run this SQL for you — it needs your own
Supabase account. Follow these steps in order.

## 1. Create the project

Go to https://supabase.com, sign in, and create a new project. Pick any
region close to India (e.g. Mumbai/`ap-south-1` if offered). Wait for
provisioning to finish (a couple of minutes).

## 2. Run the schema migration

In your Supabase project, open **SQL Editor** → **New query**. Paste the
entire contents of `supabase/migrations/0001_init.sql` and run it.

Check: **Table Editor** should now show `room_types`, `rooms`, `bookings`,
`blocked_dates`, and `owners`.

## 3. Run the seed data

New query again, paste the entire contents of `supabase/seed.sql`, run it.

Check: `room_types` should have 3 rows, `rooms` should have 6, `bookings`
should have 6.

## 4. Get your API credentials

**Settings** → **API**. Copy:
- **Project URL**
- **anon public** key (NOT the `service_role` key — that one must never
  go in frontend code)

## 5. Set your environment variables

Copy `.env.example` to `.env` in the project root, and fill in:

```
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 6. Run it

```
npm install
npm run dev
```

Open the URL it gives you. The room listing should load — same three
rooms, same prices, same colors as before. Open a room's detail page and
check August 2026: the same unavailable dates from Phase 4 (Aug 10-12 on
Deluxe, Aug 7 on Standard, Aug 15-17 on Suite) should still show up,
except now they're coming from a real database instead of a mock array.

## If something breaks

Tell me the exact error message (browser console, or the terminal running
`npm run dev`) and I can help debug it — I can't reproduce your live
database from here, so the error text is what I have to work with.

---

## Phase 7: Payments (Razorpay + Edge Functions)

This phase needs three things set up: the schema change, a Razorpay test
account, and the two Edge Functions deployed. More moving parts than
Phase 5 — follow this in order.

### 1. Run the new migration

SQL Editor → paste the actual contents of `supabase/migrations/0003_payments.sql` → Run.

### 2. Create a Razorpay test account

Go to https://razorpay.com, sign up, and make sure you're in **Test Mode**
(toggle is usually top-left of the dashboard). Test mode uses fake cards —
no real money moves.

**Settings → API Keys → Generate Test Key** — copy the **Key ID** and
**Key Secret**. The secret is only shown once; save it somewhere.

### 3. Install the Supabase CLI (if you don't have it)

```
npm install -g supabase
```

Then log in and link this project:

```
supabase login
supabase link --project-ref your-project-ref
```

(Your project ref is in the Supabase dashboard URL: `supabase.com/dashboard/project/<this-part>`.)

### 4. Set your Razorpay secrets on Supabase

These are Edge Function secrets, not `.env` — they never reach the browser.

```
supabase secrets set RAZORPAY_KEY_ID=your_test_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_test_key_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=pick_any_string_for_now
```

(`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already available to
every Edge Function automatically — you don't set those yourself.)

### 5. Deploy both Edge Functions

```
supabase functions deploy create-razorpay-order
supabase functions deploy razorpay-webhook --no-verify-jwt
```

The `--no-verify-jwt` flag on the webhook is important and easy to miss:
by default Supabase rejects any request to an Edge Function that doesn't
carry a Supabase login token. Razorpay obviously doesn't have one, so
without that flag, Razorpay's calls get rejected before your code even
runs.

### 6. Point Razorpay at your webhook

In the Razorpay dashboard: **Settings → Webhooks → Add New Webhook**.

- **URL**: `https://your-project-ref.supabase.co/functions/v1/razorpay-webhook`
- **Active events**: check `payment.captured`
- **Secret**: set this to the *same* string you used for
  `RAZORPAY_WEBHOOK_SECRET` in step 4 — if you used a placeholder there,
  go back and run `supabase secrets set RAZORPAY_WEBHOOK_SECRET=...` again
  with whatever you enter here, then redeploy the webhook function.

### 7. Test it

`npm run dev`, book a room, and when the Razorpay checkout window opens,
use a Razorpay **test card**: card number `4111 1111 1111 1111`, any
future expiry date, any CVV, any name. It should show "Payment received —
confirming your booking…" and then flip to "Booking confirmed" within a
few seconds once the webhook lands.

### If it gets stuck on "confirming"

That means the webhook never reached your function, or its signature
didn't verify. Check: **Supabase Dashboard → Edge Functions →
razorpay-webhook → Logs** for errors, and **Razorpay Dashboard →
Webhooks → your webhook → recent deliveries** to see if Razorpay even
tried to call it and what response it got back. Paste me what you find.

---

## Phase 8: Owner dashboard access

There's no public "sign up as owner" page, on purpose — this property has
one owner, and a self-serve signup would let anyone register themselves
as an owner and read every guest's name and email. Instead, you create
your own owner login once, manually.

### 1. Run the new migration

SQL Editor → paste the actual contents of `supabase/migrations/0004_owner_access.sql` → Run.

### 2. Create your login in Supabase Auth

**Authentication → Users → Add User**. Enter your email and a password.
Supabase-dashboard-created users are auto-confirmed, so you can log in
immediately — no email verification step needed.

Copy the **User UID** shown after creating it.

### 3. Link that login to the owners table

SQL Editor → new query:

```sql
insert into owners (id, email) values ('paste-the-user-uid-here', 'your-email@example.com');
```

### 4. Log in

`npm run dev`, click **Owner login** in the header, use the email/password
from step 2. You should see the bookings table and blocked-dates manager.

If you see "this account isn't registered as an owner" after logging in,
step 3 didn't complete — check the UID was pasted correctly.

---

## Phase 10: Deployment

Same overall process as JobTrack. Two things are different: no Edge
Function proxy needed on Vercel's side (Razorpay's webhook and order
creation already live on Supabase, not Vercel), and there are only two
environment variables to set instead of one.

### 1. Push to GitHub

If this project isn't already a git repo:

```
git init
git add .
git commit -m "StayFlow through Phase 9"
```

Create a new repo on GitHub, then:

```
git remote add origin https://github.com/your-username/stayflow.git
git branch -M main
git push -u origin main
```

### 2. Import into Vercel

vercel.com → **New Project** → import that GitHub repo. Vercel
auto-detects Vite; the default build command (`npm run build`) and
output directory (`dist`) are already correct, same as JobTrack.

### 3. Set environment variables

In the Vercel project's **Settings → Environment Variables**, add the
same two values from your local `.env`:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Nothing Razorpay-related goes here — those secrets live on Supabase's
Edge Functions, never in the frontend.

### 4. Deploy, then test the live URL end-to-end

Once it's live, repeat the same booking + payment test you just ran
locally, but on the real Vercel URL. Nothing else needs reconfiguring —
Supabase and Razorpay's webhook don't know or care where the frontend is
hosted.
