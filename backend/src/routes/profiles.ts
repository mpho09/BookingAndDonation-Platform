import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getPagination } from "../lib/pagination.js";

export const profilesRouter = Router();

// GET /api/profiles/me
profilesRouter.get("/me", requireAuth, async (req, res) => {
  const { data, error } = await req.supabase!.from("profiles").select("*").eq("id", req.user!.id).single();
  if (error) return res.status(500).json({ error: error.message });

  // "expiring soon" flag: joined 11+ months ago on a non-free tier, i.e.
  // roughly 30 days from a yearly renewal. Kept simple per the brief
  // (manual admin renewal, no payment gateway).
  const joined = new Date(data.joined_at);
  const daysSinceJoin = (Date.now() - joined.getTime()) / (1000 * 60 * 60 * 24);
  const expiringSoon = data.membership_tier !== "free" && daysSinceJoin >= 335 && daysSinceJoin <= 365;

  res.json({ profile: { ...data, expiring_soon: expiringSoon } });
});

const updateSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
});

// PATCH /api/profiles/me
profilesRouter.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { data, error } = await req.supabase!
    .from("profiles")
    .update(parsed.data)
    .eq("id", req.user!.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ profile: data });
});

// GET /api/profiles — staff/admin: member directory with search + pagination.
profilesRouter.get("/", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const { from, to } = getPagination(req);
  let query = req.supabase!
    .from("profiles")
    .select("id, full_name, phone, role, membership_tier, joined_at", { count: "exact" })
    .order("full_name")
    .range(from, to);

  if (typeof req.query.search === "string" && req.query.search.trim()) {
    query = query.ilike("full_name", `%${req.query.search.trim()}%`);
  }

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ profiles: data, total: count });
});

const tierSchema = z.object({ membership_tier: z.enum(["free", "standard", "family"]) });

// PATCH /api/profiles/:id/renew — admin manually renews/changes a member's tier.
profilesRouter.patch("/:id/renew", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = tierSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { data, error } = await req.supabase!
    .from("profiles")
    .update({ membership_tier: parsed.data.membership_tier, joined_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ profile: data });
});
