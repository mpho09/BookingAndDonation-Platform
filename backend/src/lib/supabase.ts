import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY — copy .env.example to .env and fill it in."
  );
}

/**
 * Service-role client. Bypasses RLS entirely — use ONLY for trusted
 * server-side operations (verifying JWTs, admin-only aggregate reports).
 * Never send this client's results straight to a user without your own
 * authorization check first.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Per-request client scoped to the calling user's JWT. Queries made with
 * this client are subject to Postgres RLS policies exactly as if the user
 * queried Supabase directly, so row-level access rules are enforced by the
 * database, not by application code.
 */
export function supabaseForToken(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
