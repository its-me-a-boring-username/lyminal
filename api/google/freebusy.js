import { requireUser } from "../_lib/requireUser.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = await requireUser(req, res);
  if (!auth) return;

  const { accessToken, startIso, endIso } = req.body || {};
  if (!accessToken || !startIso || !endIso) {
    return res.status(400).json({ error: "accessToken, startIso, and endIso are required." });
  }

  try {
    const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ timeMin: startIso, timeMax: endIso, items: [{ id: "primary" }] }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(400).json({ error: data?.error?.message || "Google freeBusy failed." });

    const busy = data?.calendars?.primary?.busy || [];
    res.status(200).json({ busy });
  } catch (error) {
    console.error("[google/freebusy]", error);
    res.status(500).json({ error: error.message || "Freebusy request failed." });
  }
}
