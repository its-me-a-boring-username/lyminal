import { supabase } from "../supabaseClient.js";

const SESSION_ID_KEY = "lyminal_session_id";

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return `fallback_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function getOnceKey(userId, eventName, scope) {
  return `lyminal_event_${scope}_${userId}_${eventName}`;
}

function shouldSkipForOnceScope(userId, eventName, onceScope) {
  if (!onceScope || !userId) return false;
  try {
    const storage = onceScope === "session" ? sessionStorage : localStorage;
    const key = getOnceKey(userId, eventName, onceScope);
    if (storage.getItem(key) === "1") return true;
    storage.setItem(key, "1");
    return false;
  } catch {
    return false;
  }
}

export async function trackUserEvent(session, eventName, metadata = {}, options = {}) {
  const userId = session?.user?.id;
  if (!userId || !eventName) return;

  const onceScope = options.onceScope || null; // "session" | "local" | null
  if (shouldSkipForOnceScope(userId, eventName, onceScope)) return;

  try {
    const payload = {
      user_id: userId,
      event_name: eventName,
      occurred_at: new Date().toISOString(),
      platform: "web",
      session_id: getSessionId(),
      metadata,
    };

    const { error } = await supabase.from("user_events").insert(payload);
    if (error) throw error;
  } catch (error) {
    console.warn(`[Analytics] Failed to track ${eventName}:`, error?.message || error);
  }
}

export function mapStepToScreenName(step) {
  switch (step) {
    case "active":
      return "home";
    case "plan":
      return "plan";
    case "progress":
      return "progress";
    case "account":
      return "account";
    case "chart":
    case "chart-view":
      return "chart";
    case "chat":
      return "chat";
    case "goal-picker":
      return "goal_picker";
    default:
      return null;
  }
}
