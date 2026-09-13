import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { getPagination } from "../lib/pagination.js";

export const donationsRouter = Router();

const donationSchema = z.object({
  amount: z.number().positive(),
  campaign_id: z.string().uuid().optional(),
  is_recurring: z.boolean().optional(),
  donor_name: z.string().optional(),
  donor_email: z.string().email().optional(),
});

// POST /api/donations — public. Works for anonymous visitors and logged-in
// members alike (RLS: donations are insert-open by policy).
donationsRouter.post("/", optionalAuth, async (req, res) => {
  const parsed = donationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const payload = {
    ...parsed.data,
    donor_id: req.user?.id ?? null,
  };

  const { data, error } = await supabaseAdmin.from("donations").insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ donation: data });
});

// GET /api/donations — staff/admin only, paginated.
donationsRouter.get("/", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const { from, to } = getPagination(req);
  const { data, error, count } = await req.supabase!
    .from("donations")
    .select("*, campaign:campaigns(title)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ donations: data, total: count });
});

// GET /api/donations/export — staff/admin only, full CSV (bounded to the
// most recent 5,000 rows to avoid an unbounded query on a large table).
donationsRouter.get("/export", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const { data, error } = await req.supabase!
    .from("donations")
    .select("id, amount, is_recurring, donor_name, donor_email, created_at, campaign:campaigns(title)")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) return res.status(500).json({ error: error.message });

  const header = "id,amount,is_recurring,donor_name,donor_email,campaign,created_at";
  const rows = (data ?? []).map((d: any) =>
    [
      d.id,
      d.amount,
      d.is_recurring,
      csvSafe(d.donor_name),
      csvSafe(d.donor_email),
      csvSafe(d.campaign?.title),
      d.created_at,
    ].join(",")
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=donations.csv");
  res.send([header, ...rows].join("\n"));
});

function csvSafe(value: unknown): string {
  if (value == null) return "";
  const str = String(value).replace(/"/g, '""');
  return /[,"\n]/.test(str) ? `"${str}"` : str;
}
