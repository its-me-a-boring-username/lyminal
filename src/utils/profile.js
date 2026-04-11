import { supabase } from "../supabaseClient.js";
import { normalizeTier } from "./entitlements.js";
import { DEFAULT_THEME, getThemePayload } from "./theme.js";

export async function loadUserProfile(session) {
  if (!session?.user?.id) {
    return {
      tier: "free",
      appearance: DEFAULT_THEME.appearance,
      selectedTheme: DEFAULT_THEME.selectedTheme,
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("tier, appearance, selected_theme")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error || !data) {
    return {
      tier: "free",
      appearance: DEFAULT_THEME.appearance,
      selectedTheme: DEFAULT_THEME.selectedTheme,
    };
  }

  return {
    tier: normalizeTier(data.tier),
    appearance: ["system", "light", "dark"].includes(data.appearance) ? data.appearance : DEFAULT_THEME.appearance,
    selectedTheme: data.selected_theme || DEFAULT_THEME.selectedTheme,
  };
}

export async function saveThemePreference(session, appearance, selectedTheme) {
  if (!session?.user?.id) return;
  const payload = getThemePayload(appearance, selectedTheme);
  await supabase
    .from("profiles")
    .upsert({
      id: session.user.id,
      ...payload,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
}
