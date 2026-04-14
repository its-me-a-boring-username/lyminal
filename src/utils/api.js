import { trackUserEvent } from "./events.js";

export async function postJson(url, body, session) {
  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {}),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    trackUserEvent(session, "api_failed", {
      endpoint: url,
      status_code: res.status,
      code: data?.code || null,
    });
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return data;
}
