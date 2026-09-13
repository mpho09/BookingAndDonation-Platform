import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminRouter = Router();

// GET /api/admin/reports — simple counters for the admin dashboard.
adminRouter.get("/reports", requireAuth, requireRole("staff", "admin"), async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [bookingsThisMonth, totalDonations, activeMembers, pendingBookings] = await Promise.all([
    req.supabase!
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    req.supabase!.from("donations").select("amount"),
    req.supabase!.from("profiles").select("id", { count: "exact", head: true }).eq("role", "member"),
    req.supabase!.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  if (totalDonations.error) return res.status(500).json({ error: totalDonations.error.message });

  const totalDonationAmount = (totalDonations.data ?? []).reduce(
    (sum: number, d: { amount: number }) => sum + Number(d.amount),
    0
  );

  res.json({
    bookings_this_month: bookingsThisMonth.count ?? 0,
    pending_bookings: pendingBookings.count ?? 0,
    total_donations: totalDonationAmount,
    active_members: activeMembers.count ?? 0,
  });
});
