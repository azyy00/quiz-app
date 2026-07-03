import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./url";

/**
 * Service-role client for API routes only. Bypasses RLS — used for
 * game control and server-side scoring so players can't cheat.
 * Never import this from client components.
 */
export function createAdminClient() {
  return createClient(
    supabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
