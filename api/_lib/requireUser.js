import { createClient } from "@supabase/supabase-js";

function getClientForToken(token) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase public env vars are not configured.");
  }
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Missing auth token." });
    return null;
  }

  const client = getClientForToken(token);
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    res.status(401).json({ error: "Invalid auth token." });
    return null;
  }

  return { user: data.user, token };
}
