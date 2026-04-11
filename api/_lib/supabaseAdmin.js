import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

let admin = null;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRole) {
    throw new Error("Supabase admin env vars are not configured.");
  }
  if (!admin) {
    admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}
