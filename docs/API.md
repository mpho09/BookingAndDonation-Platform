# API Reference

Base URL: `http://localhost:4000/api` (local) — override via `VITE_API_URL` on
the frontend and `FRONTEND_ORIGIN`/`PORT` on the backend once deployed.

All authenticated routes expect:

```
Authorization: Bearer <supabase_access_token>
```

The frontend attaches this automatically from the current Supabase session
(see `frontend/src/lib/api.ts`). Every list endpoint accepts `?page=` and
`?pageSize=` (default 20, max 100) and returns `{ ...items, total }`.

Roles referenced below: **public** (no token), **member**, **staff**,
**admin**. `staff`/`admin` means either role is accepted.

---

## Resources (`/resources`)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/resources` | public | Active rooms & equipment catalogue |
| GET | `/resources/:id/availability?from=&to=` | public | Pending/approved bookings for a resource in a window (ISO dates; defaults to now → +30 days) |
| POST | `/resources` | staff/admin | Create a resource. Body: `{ name, type: "room"\|"equipment", capacity?, description? }` |
| PATCH | `/resources/:id` | staff/admin | Partial update, same shape as POST |
| DELETE | `/resources/:id` | staff/admin | Soft delete (sets `active = false`) |

## Bookings (`/bookings`)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/bookings/mine` | member | The caller's own bookings |
| GET | `/bookings?status=` | staff/admin | Full queue, optionally filtered by status |
| POST | `/bookings` | member | Body: `{ resource_id, start_time (ISO), end_time (ISO), notes? }`. Returns `409` if the slot overlaps an existing pending/approved booking — this is enforced by a Postgres exclusion constraint, not just application logic |
| PATCH | `/bookings/:id/status` | staff/admin | Body: `{ status: "approved"\|"rejected" }`. Fires an in-app notification to the member |
| PATCH | `/bookings/:id/cancel` | member | Cancels the caller's own booking, only while it is still `pending` |

## Campaigns (`/campaigns`)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/campaigns?active=true` | public | Donation drives, optionally filtered to active only |
| POST | `/campaigns` | staff/admin | Body: `{ title, description?, goal_amount, active? }` |
| PATCH | `/campaigns/:id` | staff/admin | Partial update |

## Donations (`/donations`)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/donations` | public | Body: `{ amount, campaign_id?, is_recurring?, donor_name?, donor_email? }`. Works for anonymous visitors and logged-in members; if a valid token is sent, `donor_id` is set automatically |
| GET | `/donations` | staff/admin | Paginated donation history |
| GET | `/donations/export` | staff/admin | CSV download (most recent 5,000 rows) |

## Profiles (`/profiles`)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/profiles/me` | member+ | Caller's own profile, including a computed `expiring_soon` flag |
| PATCH | `/profiles/me` | member+ | Body: `{ full_name?, phone? }` |
| GET | `/profiles?search=` | staff/admin | Member directory, paginated, `search` matches on name |
| PATCH | `/profiles/:id/renew` | admin | Manual membership renewal. Body: `{ membership_tier }` |

## Notifications (`/notifications`)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/notifications/mine` | member+ | Caller's own notifications, paginated |
| PATCH | `/notifications/:id/read` | member+ | Marks one notification as read |

## Admin (`/admin`)

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/admin/reports` | staff/admin | `{ bookings_this_month, pending_bookings, total_donations, active_members }` |

## Error shape

Every error response is `{ "error": string, "details"?: unknown }`. `details`
is only present on `400` validation failures and contains the Zod field
errors.

## Health check

`GET /api/health` → `{ "ok": true }` — useful for confirming the backend and
its Supabase connection are both up before wiring the frontend to it.
