import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const resourcesRouter = Router();

// GET /api/resources — public catalogue, no auth required.
resourcesRouter.get("/", async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from("resources")
    .select("*")
    .eq("active", true)
    .order("type")
    .order("name");

  if (error) return res.status(500).json({ error: error.message });
  res.json({ resources: data });
});

// GET /api/resources/:id/availability?from=ISO&to=ISO — existing
// pending/approved bookings in the window, so the UI can render a calendar
// and pre-empt conflicts before submitting (the DB still enforces this).
resourcesRouter.get("/:id/availability", async (req, res) => {
  const from = typeof req.query.from === "string" ? req.query.from : new Date().toISOString();
  const to =
    typeof req.query.to === "string"
      ? req.query.to
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, start_time, end_time, status")
    .eq("resource_id", req.params.id)
    .in("status", ["pending", "approved"])
    .gte("start_time", from)
    .lte("end_time", to)
    .order("start_time");

  if (error) return res.status(500).json({ error: error.message });
  res.json({ bookings: data });
});

const resourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["room", "equipment"]),
  capacity: z.number().int().positive().nullable().optional(),
  description: z.string().optional(),
});

// POST /api/resources — staff/admin only.
resourcesRouter.post("/", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const parsed = resourceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { data, error } = await req.supabase!
    .from("resources")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ resource: data });
});

// PATCH /api/resources/:id — staff/admin only.
resourcesRouter.patch("/:id", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const parsed = resourceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { data, error } = await req.supabase!
    .from("resources")
    .update(parsed.data)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ resource: data });
});

// DELETE /api/resources/:id — soft delete (active = false), staff/admin only.
resourcesRouter.delete("/:id", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const { error } = await req.supabase!
    .from("resources")
    .update({ active: false })
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});
