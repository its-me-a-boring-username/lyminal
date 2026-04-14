import React from "react";
import { trackUserEvent, mapStepToScreenName } from "../utils/events.js";

const OCHRE = "var(--ly-accent)";
const OCHRE_TINT = "rgba(var(--ly-accent-rgb), 0.08)";
const INACTIVE = "#8a7a68";
const BORDER = "#e8e0d5";
const BG = "var(--ly-bg)";

const Icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M7 18v-6h6v6" />
    </svg>
  ),
  plan: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="13" rx="1.5" />
      <path d="M7 2v4M13 2v4M3 8h14" />
      <path d="M7 12h2M7 15h4" />
    </svg>
  ),
  progress: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15l4-5 3 3 3-4 4 4" />
      <path d="M3 17h14" />
    </svg>
  ),
  chart: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="10" r="2.5" />
      <circle cx="15" cy="5" r="2.5" />
      <circle cx="15" cy="15" r="2.5" />
      <path d="M7.5 10h4" />
      <path d="M7 8.5l5.5-2" />
      <path d="M7 11.5l5.5 2" />
    </svg>
  ),
  account: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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

const TAB_TO_SCREEN = {
  active: "home",
  plan: "plan",
  progress: "progress",
  "chart-view": "chart",
  account: "account",
};

export function Nav({ step, setStep, isMobile, isPaid, activeGoals = [], session = null }) {
  const navSteps = ["active", "plan", "progress", "chart-view", "account", "chat"];
  if (!navSteps.includes(step)) return null;

  const handleTab = (tab) => {
    trackUserEvent(session, "tab_clicked", {
      tab_name: TAB_TO_SCREEN[tab.id] || tab.id,
      from_screen: mapStepToScreenName(step),
    });
    setStep(tab.id);
  };

  const isActive = (tab) => {
    if (tab.id === "active" && (step === "active" || step === "chat")) return true;
    return step === tab.id;
  };

  const tabStyle = (active) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    padding: "14px 8px",
    background: active ? OCHRE_TINT : "none",
    border: "none",
    cursor: "pointer",
    borderBottom: active ? `3px solid ${OCHRE}` : "3px solid transparent",
    transition: "background 0.15s, border-color 0.15s, color 0.15s",
  });

  const labelStyle = (active) => ({
    fontSize: "12px",
    fontWeight: active ? 600 : 400,
    fontFamily: "'Inter', sans-serif",
    letterSpacing: "0.01em",
    color: active ? OCHRE : INACTIVE,
    lineHeight: 1,
  });

  // ── DESKTOP: full-width top bar ──
  if (!isMobile) {
    return (
      <div style={{
        display: "flex",
        borderBottom: `1px solid ${BORDER}`,
        background: BG,
      }}>
        {TABS.map(tab => {
          const active = isActive(tab);
          return (
            <button key={tab.id} onClick={() => handleTab(tab)} style={tabStyle(active)}>
              {React.cloneElement(Icons[tab.icon], { stroke: active ? OCHRE : INACTIVE })}
              <span style={labelStyle(active)}>
                {tab.label}{tab.locked && !isPaid ? " 🔒" : ""}
              </span>
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
          <button key={tab.id} onClick={() => handleTab(tab)} style={{
            ...tabStyle(active),
            borderBottom: "none",
            borderTop: active ? `3px solid ${OCHRE}` : "3px solid transparent",
          }}>
            {React.cloneElement(Icons[tab.icon], { stroke: active ? OCHRE : INACTIVE })}
            <span style={labelStyle(active)}>
              {tab.label}{tab.locked && !isPaid ? " 🔒" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
