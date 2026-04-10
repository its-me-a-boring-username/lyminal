export const ACTION_TYPES = ["forward", "schedule", "find"];

const FORWARD_HINTS = ["send", "email", "share", "delegate", "ea", "forward", "message"];
const SCHEDULE_HINTS = ["schedule", "book", "calendar", "appointment", "remind", "call", "meeting"];

export function inferActionType(text = "") {
  const value = String(text || "").toLowerCase();
  if (FORWARD_HINTS.some((hint) => value.includes(hint))) return "forward";
  if (SCHEDULE_HINTS.some((hint) => value.includes(hint))) return "schedule";
  return "find";
}

export function normalizeActionItem(item, index = 0) {
  if (!item) {
    return { id: `ai_${Date.now()}_${index}`, text: "", type: "find" };
  }

  if (typeof item === "string") {
    const text = item.trim();
    return {
      id: `legacy_${Date.now()}_${index}`,
      text,
      type: inferActionType(text),
    };
  }

  const text = String(item.text || "").trim();
  const rawType = String(item.type || "").toLowerCase();
  const type = ACTION_TYPES.includes(rawType) ? rawType : inferActionType(text);

  return {
    id: item.id || `legacy_${Date.now()}_${index}`,
    text,
    type,
  };
}

export function normalizeActionItems(items = []) {
  return (items || []).map((item, index) => normalizeActionItem(item, index));
}

export function hasTypedShape(items = []) {
  return (items || []).every(
    (item) => item && typeof item === "object" && ACTION_TYPES.includes(String(item.type || "").toLowerCase())
  );
}

export function buildForwardBody(items = []) {
  const lines = ["Please take care of these action items:", ""];
  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.text}`);
  });
  return lines.join("\n");
}
