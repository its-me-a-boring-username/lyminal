import { requireUser } from "../_lib/requireUser.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (!auth) return;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "Google OAuth env vars are not configured." });
  }

  const state = encodeURIComponent(`${auth.user.id}:${Date.now()}`);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
    state,
  });

  res.status(200).json({ url: `${GOOGLE_AUTH_URL}?${params.toString()}` });
}
