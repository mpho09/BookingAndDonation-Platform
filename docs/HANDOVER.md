# Riverside Community Hub — Staff Handover Guide

This is a plain-language guide for Riverside staff, not developers. For
technical setup, see `README.md`.

## Logging in as staff

1. Go to the site and click **Log in** (top right).
2. Use the email and password you were given when your account was set up.
3. Once logged in, you'll see a **Staff dashboard** link in the top menu —
   that's your control panel. Members don't see this link.

If you don't yet have a staff account, ask an admin to create one for you
(see "Promoting someone to staff or admin" below).

## Approving or rejecting a booking

1. Open **Staff dashboard**.
2. The **Bookings** tab shows requests, filtered to **Pending** by default —
   that's your to-do list.
3. Each request shows the room/equipment, who asked for it, the date and
   time, and any notes they left.
4. Click **Approve** or **Reject**. The member is notified automatically —
   you don't need to message them separately.
5. You can switch the filter dropdown to see Approved, Rejected, or
   Cancelled bookings too.

The system will not let two people double-book the same room or equipment
for an overlapping time, even if you both try to approve conflicting
requests — the second approval will fail with an error.

## Looking up a member

1. Open **Staff dashboard → Members**.
2. Type a name in the search box — results update as you type.
3. You'll see their role, membership tier, and join date.

## Renewing a membership

Membership renewal is manual (there's no payment gateway yet — see
"What's not included" below). An **admin** account can update someone's
tier from the member directory; if you're staff (not admin) and a member
needs renewing, pass it to an admin.

## Viewing donations and exporting for the board/funders

1. Open **Staff dashboard → Donations**.
2. You'll see every donation: donor name (or "Anonymous"), amount,
   which campaign it went to, and the date.
3. Click **Export CSV** to download the full list as a spreadsheet you can
   open in Excel or Google Sheets — handy for board packs or funder
   reports.

## The donation drive progress bar

The homepage and the Donate page both show a live progress bar toward the
current campaign's goal (e.g. "R50,000 for winter parcels"). It updates
automatically every time someone donates — nobody needs to update it by
hand.

## Promoting someone to staff or admin

This currently requires a one-line database update by whoever manages the
Supabase project (see `README.md`, "Set up Supabase," step 5). If Riverside
wants a proper in-app way to do this later, that's a natural next feature
to add.

## What's not included (by design, for this version)

- **No real payment processing.** Donations are recorded, but no money is
  actually collected through the site yet — that would need a payment
  provider like Paystack or Stripe connected, which the project brief
  marks as optional.
- **No automatic recurring billing.** "Adopt a food parcel" pledges are
  logged as an intention to give monthly; someone still needs to follow
  up with the donor directly.
- **No automated email reminders** for upcoming bookings or expiring
  memberships — notifications currently only appear inside the site.

None of these are required for day-one use; they're the natural "phase 2"
list if Riverside wants to keep building on this.
