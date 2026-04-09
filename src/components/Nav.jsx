import React from "react";

const OCHRE = "#b5472a";
const MUTED = "#8a7455";
const BORDER = "#e8e0d5";
const BG = "#faf8f5";

// SVG icons — outlined, 20x20 viewBox
const Icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M7 18v-6h6v6" />
    </svg>
  ),
  plan: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="13" rx="1.5" />
      <path d="M7 2v4M13 2v4M3 8h14" />
      <path d="M7 12h2M7 15h4" />
    </svg>
  ),
  progress: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15l4-5 3 3 3-4 4 4" />
      <path d="M3 17h14" />
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="10" r="2.5" />
      <circle cx="15" cy="5" r="2.5" />
      <circle cx="15" cy="15" r="2.5" />
      <path d="M7.5 10h4" />
      <path d="M7 8.5l5.5-2" />
      <path d="M7 11.5l5.5 2" />
    </svg>
  ),
  account: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" />
    </svg>
  ),
};

const TABS = [
  { id: "active",   label: "Home",     icon: "home" },
  { id: "plan",     label: "Plan",     icon: "plan",     locked: true },
  { id: "progress", label: "Progress", icon: "progress" },
  { id: "chart-view", label: "My Chart", icon: "chart" },
  { id: "account",  label: "Account",  icon: "account" },
];

/**
 * Nav — persistent tab navigation
 *
 * Props:
 *   step: string — current app step
 *   setStep: fn — navigate to a step
 *   isMobile: bool
 *   isPaid: bool — used to show lock on Plan tab
 *   activeGoals: array — needed to gate chart-view
 */
export function Nav({ step, setStep, isMobile, isPaid, activeGoals = [] }) {
  const navSteps = ["active", "plan", "progress", "chart-view", "account"];
  const isNavVisible = navSteps.includes(step) ||
    ["chat"].includes(step); // keep nav visible in chat too

  if (!isNavVisible) return null;

  const handleTab = (tab) => {
    if (tab.id === "plan" && !isPaid) {
      // Will trigger upgrade prompt — for now just navigate and let the page handle it
      setStep("plan");
      return;
    }
    setStep(tab.id);
  };

  const isActive = (tab) => {
    if (tab.id === "active" && (step === "active" || step === "chat")) return true;
    if (tab.id === "chart-view" && step === "chart-view") return true;
    return step === tab.id;
  };

  // ── DESKTOP: top bar inside content panel ──
  if (!isMobile) {
    return (
      <div style={{
        display: "flex", alignItems: "center",
        borderBottom: `1px solid ${BORDER}`,
        background: BG,
        paddingLeft: "1.5rem",
      }}>
        {TABS.map(tab => {
          const active = isActive(tab);
          return (
            <button
              key={tab.id}
              onClick={() => handleTab(tab)}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "0.875rem 1.25rem",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: active ? `2px solid ${OCHRE}` : "2px solid transparent",
                marginBottom: "-1px",
                color: active ? OCHRE : MUTED,
                fontSize: "0.75rem", fontWeight: active ? 600 : 400,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: "0.02em",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              <span style={{
                color: active ? OCHRE : MUTED,
                display: "flex", alignItems: "center",
                transition: "color 0.15s",
              }}>
                {React.cloneElement(Icons[tab.icon], { stroke: active ? OCHRE : MUTED })}
              </span>
              {tab.label}
              {tab.locked && !isPaid && (
                <span style={{ fontSize: "0.65rem", marginLeft: "0.1rem" }}>🔒</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ── MOBILE: bottom bar, full width ──
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      display: "flex",
      background: BG,
      borderTop: `1px solid ${BORDER}`,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
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
              gap: "0.2rem",
              padding: "0.6rem 0.25rem 0.5rem",
              background: "none", border: "none", cursor: "pointer",
              borderTop: active ? `2px solid ${OCHRE}` : "2px solid transparent",
              color: active ? OCHRE : MUTED,
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            <span style={{ color: active ? OCHRE : MUTED, display: "flex", transition: "color 0.15s" }}>
              {React.cloneElement(Icons[tab.icon], { stroke: active ? OCHRE : MUTED })}
            </span>
            <span style={{
              fontSize: "0.6rem", fontWeight: active ? 600 : 400,
              fontFamily: "'Inter', sans-serif", letterSpacing: "0.03em",
              lineHeight: 1,
            }}>
              {tab.label}
              {tab.locked && !isPaid && " 🔒"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
