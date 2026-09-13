import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const campaignsRouter = Router();

// GET /api/campaigns — public, used for the donation drive progress bar.
campaignsRouter.get("/", async (req, res) => {
  let query = supabaseAdmin.from("campaigns").select("*").order("created_at", { ascending: false });
  if (req.query.active === "true") query = query.eq("active", true);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ campaigns: data });
});

const campaignSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  goal_amount: z.number().positive(),
  active: z.boolean().optional(),
});

// POST /api/campaigns — staff/admin only.
campaignsRouter.post("/", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const parsed = campaignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { data, error } = await req.supabase!.from("campaigns").insert(parsed.data).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ campaign: data });
});

// PATCH /api/campaigns/:id — staff/admin only.
campaignsRouter.patch("/:id", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const parsed = campaignSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { data, error } = await req.supabase!
    .from("campaigns")
    .update(parsed.data)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ campaign: data });
});
