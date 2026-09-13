import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getPagination } from "../lib/pagination.js";

export const notificationsRouter = Router();

// GET /api/notifications/mine
notificationsRouter.get("/mine", requireAuth, async (req, res) => {
  const { from, to } = getPagination(req);
  const { data, error, count } = await req.supabase!
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ notifications: data, total: count });
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch("/:id/read", requireAuth, async (req, res) => {
  const { data, error } = await req.supabase!
    .from("notifications")
    .update({ read: true })
    .eq("id", req.params.id)
    .eq("user_id", req.user!.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ notification: data });
});
