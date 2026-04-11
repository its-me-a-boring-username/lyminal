const THEME_STORAGE_KEY = "lyminal_theme";

export const DEFAULT_THEME = {
  appearance: "system",
  selectedTheme: "warm_earth",
};

const THEME_VARS = {
  warm_earth: { "--ly-bg": "#faf8f5", "--ly-ink": "#1c1410", "--ly-accent": "#b5472a" },
  terracotta_sage: { "--ly-bg": "#faf8f5", "--ly-ink": "#1c1410", "--ly-accent": "#b5614a" },
  plum_teal: { "--ly-bg": "#f8f6f8", "--ly-ink": "#231b24", "--ly-accent": "#9b6b8a" },
  blush_eucalyptus: { "--ly-bg": "#faf7f6", "--ly-ink": "#231c1a", "--ly-accent": "#c17a6f" },
  forest: { "--ly-bg": "#f4f8f5", "--ly-ink": "#102516", "--ly-accent": "#1a4a30" },
  violet: { "--ly-bg": "#f7f6fa", "--ly-ink": "#1e1828", "--ly-accent": "#4a1a7a" },
  rose: { "--ly-bg": "#faf6f7", "--ly-ink": "#261217", "--ly-accent": "#6e1a2e" },
  ocean: { "--ly-bg": "#f5f8fb", "--ly-ink": "#0f1f2a", "--ly-accent": "#0e3a5c" },
  ink: { "--ly-bg": "#f5f5f5", "--ly-ink": "#0a0a0a", "--ly-accent": "#0a0a0a" },
};

function resolveMode(appearance) {
  if (appearance === "light" || appearance === "dark") return appearance;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function loadThemeFromStorage() {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_THEME };
    const parsed = JSON.parse(raw);
    return {
      appearance: ["system", "light", "dark"].includes(parsed?.appearance) ? parsed.appearance : DEFAULT_THEME.appearance,
      selectedTheme: typeof parsed?.selectedTheme === "string" ? parsed.selectedTheme : DEFAULT_THEME.selectedTheme,
    };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

export function persistThemeToStorage(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

export function applyTheme({ appearance, selectedTheme }) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const mode = resolveMode(appearance);
  const vars = THEME_VARS[selectedTheme] || THEME_VARS[DEFAULT_THEME.selectedTheme];

  root.setAttribute("data-appearance", appearance || DEFAULT_THEME.appearance);
  root.setAttribute("data-theme", selectedTheme || DEFAULT_THEME.selectedTheme);
  root.setAttribute("data-color-mode", mode);
  root.classList.toggle("dark", mode === "dark");

  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
}

export function getThemePayload(appearance, selectedTheme) {
  return {
    appearance: ["system", "light", "dark"].includes(appearance) ? appearance : DEFAULT_THEME.appearance,
    selected_theme: selectedTheme || DEFAULT_THEME.selectedTheme,
  };
}
