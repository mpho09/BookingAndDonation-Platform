import type { NextFunction, Request, Response } from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin, supabaseForToken } from "../lib/supabase.js";
import type { UserRole } from "../types/index.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string | null; role: UserRole };
      /** RLS-scoped Supabase client for this request's user. */
      supabase?: SupabaseClient;
    }
  }
}

/**
 * Verifies the Authorization: Bearer <access_token> header against Supabase,
 * then loads the caller's role from `profiles` and attaches:
 *   req.user      — { id, email, role }
 *   req.supabase  — a client scoped to the user's own JWT, so every query
 *                    made through it is still subject to RLS.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: "No profile found for this account" });
  }

  req.user = { id: data.user.id, email: data.user.email ?? null, role: profile.role };
  req.supabase = supabaseForToken(token);
  next();
}

/** Gate a route to one or more roles. Must run after requireAuth. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

/**
 * Optional auth: attaches req.user/req.supabase when a valid token is
 * present, but never rejects the request. Useful for endpoints that are
 * public but behave differently for logged-in users (e.g. donations).
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();

  const { data } = await supabaseAdmin.auth.getUser(token);
  if (data.user) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    req.user = { id: data.user.id, email: data.user.email ?? null, role: profile?.role ?? "member" };
    req.supabase = supabaseForToken(token);
  }
  next();
}
