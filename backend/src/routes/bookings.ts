import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getPagination } from "../lib/pagination.js";

export const bookingsRouter = Router();

// GET /api/bookings/mine — the logged-in member's own bookings.
// RLS also enforces this (members can only read their own rows), so this
// filter is belt-and-suspenders, not the sole safeguard.
bookingsRouter.get("/mine", requireAuth, async (req, res) => {
  const { from, to } = getPagination(req);
  const { data, error, count } = await req.supabase!
    .from("bookings")
    .select("*, resource:resources(name, type)", { count: "exact" })
    .eq("member_id", req.user!.id)
    .order("start_time", { ascending: false })
    .range(from, to);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ bookings: data, total: count });
});

// GET /api/bookings — staff/admin: full queue, filterable by status.
bookingsRouter.get("/", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const { from, to } = getPagination(req);
  let query = req.supabase!
    .from("bookings")
    .select("*, resource:resources(name, type), member:profiles(full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (typeof req.query.status === "string") {
    query = query.eq("status", req.query.status);
  }

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ bookings: data, total: count });
});

const createBookingSchema = z.object({
  resource_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  notes: z.string().optional(),
});

// POST /api/bookings — member creates a booking request (starts "pending").
// Double-booking is prevented by a Postgres EXCLUDE constraint, so a
// conflicting request fails at the DB layer even if this check is bypassed.
bookingsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  if (new Date(parsed.data.end_time) <= new Date(parsed.data.start_time)) {
    return res.status(400).json({ error: "end_time must be after start_time" });
  }

  const { data, error } = await req.supabase!
    .from("bookings")
    .insert({ ...parsed.data, member_id: req.user!.id })
    .select()
    .single();

  if (error) {
    // Postgres exclusion-constraint violation code is 23P01.
    if (error.code === "23P01") {
      return res.status(409).json({ error: "That resource is already booked for part of this time slot" });
    }
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json({ booking: data });
});

const statusSchema = z.object({ status: z.enum(["approved", "rejected"]) });

// PATCH /api/bookings/:id/status — staff/admin approve or reject.
// A DB trigger fires a notification to the member automatically.
bookingsRouter.patch("/:id/status", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { data, error } = await req.supabase!
    .from("bookings")
    .update({ status: parsed.data.status })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ booking: data });
});

// PATCH /api/bookings/:id/cancel — member cancels their own pending booking.
bookingsRouter.patch("/:id/cancel", requireAuth, async (req, res) => {
  const { data, error } = await req.supabase!
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", req.params.id)
    .eq("member_id", req.user!.id)
    .eq("status", "pending")
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Booking not found, not yours, or no longer pending" });
  res.json({ booking: data });
});
