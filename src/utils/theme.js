const THEME_STORAGE_KEY = "lyminal_theme";

export const DEFAULT_THEME = {
  appearance: "system",
  selectedTheme: "warm_earth",
};

const THEME_VARS = {
  warm_earth:       { "--ly-bg": "#faf8f5", "--ly-ink": "#1c1410", "--ly-accent": "#8a2010", "--ly-accent2": "#1e3c20" },
  terracotta_sage:  { "--ly-bg": "#faf7f5", "--ly-ink": "#1c1410", "--ly-accent": "#7a3020", "--ly-accent2": "#2a4828" },
  plum_teal:        { "--ly-bg": "#f8f5f8", "--ly-ink": "#1a1020", "--ly-accent": "#4a1050", "--ly-accent2": "#0a3840" },
  blush_eucalyptus: { "--ly-bg": "#faf5f5", "--ly-ink": "#201518", "--ly-accent": "#701828", "--ly-accent2": "#1a3828" },
  forest:           { "--ly-bg": "#f4f8f5", "--ly-ink": "#0a1a10", "--ly-accent": "#143820", "--ly-accent2": "#60c870" },
  violet:           { "--ly-bg": "#f6f4fa", "--ly-ink": "#180e28", "--ly-accent": "#380870", "--ly-accent2": "#9060d0" },
  rose:             { "--ly-bg": "#faf4f5", "--ly-ink": "#220a12", "--ly-accent": "#680818", "--ly-accent2": "#c86070" },
  ocean:            { "--ly-bg": "#f4f8fc", "--ly-ink": "#081828", "--ly-accent": "#081838", "--ly-accent2": "#4090c8" },
  ink:              { "--ly-bg": "#f5f5f5", "--ly-ink": "#0a0a0a", "--ly-accent": "#0a0a0a", "--ly-accent2": "#606060" },
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
