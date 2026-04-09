import React from "react";

const OCHRE = "#b5472a";
const MUTED = "#8a7455";
const MUTED_LIGHT = "#c4b8a8";
const BORDER = "#e8e0d5";
const BG = "#faf8f5";

const Icons = {
  home: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M7 18v-6h6v6" />
    </svg>
  ),
  plan: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="13" rx="1.5" />
      <path d="M7 2v4M13 2v4M3 8h14" />
      <path d="M7 12h2M7 15h4" />
    </svg>
  ),
  progress: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15l4-5 3 3 3-4 4 4" />
      <path d="M3 17h14" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="10" r="2.5" />
      <circle cx="15" cy="5" r="2.5" />
      <circle cx="15" cy="15" r="2.5" />
      <path d="M7.5 10h4" />
      <path d="M7 8.5l5.5-2" />
      <path d="M7 11.5l5.5 2" />
    </svg>
  ),
  account: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" />
    </svg>
  ),
};

const TABS = [
  { id: "active",     label: "Home",     icon: "home" },
  { id: "plan",       label: "Plan",     icon: "plan",    locked: true },
  { id: "progress",   label: "Progress", icon: "progress" },
  { id: "chart-view", label: "My Chart", icon: "chart" },
  { id: "account",    label: "Account",  icon: "account" },
];

export function Nav({ step, setStep, isMobile, isPaid, activeGoals = [] }) {
  const navSteps = ["active", "plan", "progress", "chart-view", "account", "chat"];
  if (!navSteps.includes(step)) return null;

  const handleTab = (tab) => setStep(tab.id);

  const isActive = (tab) => {
    if (tab.id === "active" && (step === "active" || step === "chat")) return true;
    return step === tab.id;
  };

  // ── DESKTOP: compact top bar ──
  if (!isMobile) {
    return (
      <div style={{
        display: "flex", alignItems: "stretch",
        borderBottom: `1px solid ${BORDER}`,
        background: BG,
        paddingLeft: "0.5rem",
      }}>
        {TABS.map(tab => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab)}
              style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                padding: "0 1rem",
                height: "44px",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: active ? `3px solid ${OCHRE}` : "3px solid transparent",
                color: active ? OCHRE : MUTED,
                fontSize: "0.72rem",
                fontWeight: active ? 600 : 400,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: active ? "0.03em" : "0.01em",
                transition: "color 0.15s, border-color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {React.cloneElement(Icons[tab.icon], { stroke: active ? OCHRE : MUTED_LIGHT })}
              {tab.label}
              {tab.locked && !isPaid && (
                <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>🔒</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ── MOBILE: fixed bottom bar ──
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      display: "flex",
      background: BG,
      borderTop: `1px solid ${BORDER}`,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      boxShadow: "0 -4px 16px rgba(0,0,0,0.07)",
    }}>
      {TABS.map(tab => {
        const active = isActive(tab);
        return (
          <button
            key={tab.id}
            onClick={() => handleTab(tab)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "3px",
              padding: "8px 4px 6px",
              background: "none", border: "none", cursor: "pointer",
              borderTop: active ? `3px solid ${OCHRE}` : "3px solid transparent",
              color: active ? OCHRE : MUTED,
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {React.cloneElement(Icons[tab.icon], { stroke: active ? OCHRE : MUTED_LIGHT })}
            <span style={{
              fontSize: "0.58rem",
              fontWeight: active ? 600 : 400,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.02em",
              lineHeight: 1,
              color: active ? OCHRE : MUTED,
            }}>
              {tab.label}{tab.locked && !isPaid ? " 🔒" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
