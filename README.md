# Riverside Community Hub

Membership, facility booking, and donations platform for Riverside Community
Hub — built for Melsoft Academy Company Project 3.

A single web platform where the public can register as members, book rooms
and equipment, and donate to the food-parcel drive, while staff get an admin
dashboard to approve bookings, manage members, and report to funders.

## Architecture

```
riverside-hub/
├── frontend/     React + TypeScript + Vite + Tailwind CSS (React Router)
├── backend/      Node.js + Express + TypeScript (REST API)
├── supabase/     schema.sql — Postgres schema, RLS policies, seed data
└── docs/         API reference + client handover doc
```

- **Auth & data**: Supabase (Postgres + Supabase Auth). The frontend talks to
  Supabase directly only for auth (sign up / sign in / session). All data
  reads and writes go through the Express API.
- **Authorization is enforced twice, deliberately**: the Express API checks
  the caller's role before handling a request, *and* every database query
  runs through a Supabase client scoped to that user's JWT, so Postgres
  Row Level Security is the actual backstop — not just hidden UI or an
  `if` statement in a route handler.
- **Type safety**: `frontend/src/types` and `backend/src/types` mirror each
  other, so the shape of every API request/response is shared, not
  duplicated by hand.

## Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project

## 1. Set up Supabase

1. Create a new Supabase project.
2. Open the SQL editor and run the contents of `supabase/schema.sql`. This
   creates every table, the RLS policies, the triggers (auto-profile on
   signup, campaign totals, booking-status notifications), and seed data
   (5 sample resources, 1 donation campaign).
3. In **Authentication → Providers**, keep email/password enabled. In
   **Authentication → Settings**, keep "Confirm email" on (the brief
   requires email verification).
4. Copy your project's URL, `anon` key, and `service_role` key from
   **Project Settings → API** — you'll need them below.
5. To make yourself an admin for testing: sign up through the app once,
   then in the SQL editor run:
   ```sql
   update profiles set role = 'admin' where id = '<your-user-id-from-auth.users>';
   ```

## 2. Run the backend

```bash
cd backend
cp .env.example .env   # fill in your Supabase URL + keys
npm install
npm run dev             # http://localhost:4000
```

## 3. Run the frontend

```bash
cd frontend
cp .env.example .env    # fill in your Supabase URL + anon key
npm install
npm run dev              # http://localhost:5173
```

Open `http://localhost:5173`. Sign up as a member, browse Facilities, and
request a booking. Promote your account to `staff` or `admin` (see step 5
above) to see the staff dashboard at `/admin`.

## Deployment

| Layer | Where |
|---|---|
| Frontend | Vercel or Netlify — set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` as environment variables, build command `npm run build`, output `dist` |
| Backend | Render or Railway — set the four backend env vars from `.env.example`, start command `npm run build && npm start` |
| Database | Supabase (managed) — no extra deployment needed beyond running `schema.sql` |

Once deployed, update the backend's `FRONTEND_ORIGIN` and the frontend's
`VITE_API_URL` to the real deployed URLs.

## What's implemented against the brief

- Email/password auth with verification, member profile, membership tiers,
  automatic "expiring soon" flag (§5.1)
- Booking calendar/availability view per resource, DB-level conflict
  prevention via a Postgres exclusion constraint (not just UI validation),
  approve/reject workflow with automatic in-app notifications (§5.2)
- Public donation form (one-off and "adopt a parcel" pledge), live progress
  bar, admin CSV export (§5.3)
- Admin dashboard: pending queue, member directory with search, simple
  reporting (§5.4)
- Public landing, facility catalogue, and donation drive pages (§5.5)
- RLS on every table, input validation (Zod) on every route, paginated
  list endpoints, loading/empty/error states throughout the UI (§7)

**Not implemented** (marked optional/stretch in the brief): a real payment
gateway, real recurring billing, a waitlist queue, and chart-based
analytics. Recurring pledges are logged as intent per the brief's own
allowance ("recurring can be logged as intent, not real recurring
billing").

See `docs/API.md` for the full route reference and `docs/HANDOVER.md` for
a non-technical guide aimed at Riverside's staff.
# BookingAndDonation-Platform
