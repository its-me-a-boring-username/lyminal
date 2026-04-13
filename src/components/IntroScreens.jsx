import React, { useState, useEffect } from "react";
import { saveChart } from "../utils/supabase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes fadeScaleIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`;

export function IntroScreens({ screen, setStep, spheres, connections, session, setGoalStep, setFocusRound, setOverrideSphere, setSelectedFocusSphereId, setSelectedGoalId, DevReset }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);
  const base = {
    className: "min-h-screen flex flex-col items-center justify-center px-6 text-center",
    style: { background: "#faf8f5", fontFamily: "'Inter', sans-serif", opacity: visible ? 1 : 0, transition: "opacity 0.3s ease-out" }
  };

  const primaryBtn = (onClick, label, color = "#b5472a") => (
    <button onClick={onClick}
      style={{ background: color, color: "#faf8f5", fontWeight: 500, letterSpacing: "0.06em", fontSize: "0.8rem" }}
      className="w-full py-3.5 transition-opacity hover:opacity-85 mb-3">
      {label}
    </button>
  );

  const backBtn = (onClick, label = "← Back") => (
    <button onClick={onClick} className="text-xs transition-opacity hover:opacity-70" style={{ color: "#8a7455" }}>
      {label}
    </button>
  );

  if (screen === "intro-spheres") return (
    <div {...base}>
      <style>{FONTS}</style>
      <DevReset />
      <div style={{ maxWidth: "480px" }} className="w-full">
        <div className="flex justify-center mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="25" cy="40" r="16" fill="#b5693a" opacity="0.25"/>
            <circle cx="45" cy="28" r="16" fill="#4a7c8e" opacity="0.25"/>
            <circle cx="50" cy="50" r="16" fill="#6b8f71" opacity="0.25"/>
            <circle cx="35" cy="55" r="12" fill="#c4973a" opacity="0.2"/>
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "#b5472a", letterSpacing: "0.12em" }}>Step 1 of 3</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 600, color: "#1c1410", lineHeight: 1.3 }} className="mb-4">
          Start with your <em style={{ color: "#b5472a" }}>spheres</em>
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#4a3828", fontWeight: 300 }}>
          Your life is made up of different areas — we call them <strong style={{ fontWeight: 500 }}>spheres</strong>. Career, health, relationships, creativity, finances...
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#5c4e40", fontWeight: 300 }}>
          Name the ones that matter most to you right now. You'll need at least three to build a meaningful chart.
        </p>
        {primaryBtn(() => setStep("spheres"), "DEFINE MY SPHERES →")}
        {backBtn(() => setStep("welcome"))}
      </div>
    </div>
  );

  if (screen === "intro-goals") return (
    <div {...base}>
      <style>{FONTS}</style>
      <DevReset />
      <div style={{ maxWidth: "480px" }} className="w-full">
        <div className="flex justify-center mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="28" stroke="#b5472a" strokeWidth="1.5" opacity="0.2"/>
            <circle cx="40" cy="40" r="18" stroke="#b5472a" strokeWidth="1.5" opacity="0.35"/>
            <circle cx="40" cy="40" r="8" fill="#b5472a" opacity="0.5"/>
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "#b5472a", letterSpacing: "0.12em" }}>Step 2 of 3</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 600, color: "#1c1410", lineHeight: 1.3 }} className="mb-4">
          Now set your <em style={{ color: "#b5472a" }}>goals</em>
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#4a3828", fontWeight: 300 }}>
          For each sphere, you'll add goals — concrete things you want to achieve. These don't have to be perfect.
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#5c4e40", fontWeight: 300 }}>
          Think about what progress looks like in each area. We'll suggest some ideas to get you started.
        </p>
        {primaryBtn(() => setStep("goals"), "ADD MY GOALS →")}
        {backBtn(() => setStep("spheres"),"← Back to spheres")}
      </div>
    </div>
  );

  if (screen === "intro-connections") return (
    <div {...base}>
      <style>{FONTS}</style>
      <DevReset />
      <div style={{ maxWidth: "480px" }} className="w-full">
        <div className="flex justify-center mb-6">
          <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
            <line x1="25" y1="30" x2="50" y2="50" stroke="#4a7a72" strokeWidth="1.5" opacity="0.4"/>
            <line x1="50" y1="50" x2="75" y2="25" stroke="#4a7a72" strokeWidth="1.5" opacity="0.4"/>
            <line x1="25" y1="30" x2="75" y2="25" stroke="#4a7a72" strokeWidth="1.5" opacity="0.25"/>
            <line x1="50" y1="50" x2="60" y2="65" stroke="#4a7a72" strokeWidth="1.5" opacity="0.3"/>
            <circle cx="25" cy="30" r="8" fill="#b5693a" opacity="0.7"/>
            <circle cx="75" cy="25" r="8" fill="#4a7c8e" opacity="0.7"/>
            <circle cx="50" cy="50" r="8" fill="#6b8f71" opacity="0.7"/>
            <circle cx="60" cy="65" r="6" fill="#c4973a" opacity="0.6"/>
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "#4a7a72", letterSpacing: "0.12em" }}>Step 3 of 3</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 600, color: "#1c1410", lineHeight: 1.3 }} className="mb-4">
          Map the <em style={{ color: "#4a7a72" }}>influence</em>
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#4a3828", fontWeight: 300 }}>
          Think about your specific goals in each sphere and how they might support other areas of your life. A goal like "get a promotion" will influence your finances differently than learning a new hard skill.
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#5c4e40", fontWeight: 300 }}>
          For each sphere, select which other areas it directly impacts based on what you're actually working toward. We'll use these connections to find where focusing first creates the biggest ripple effect.
        </p>
        {primaryBtn(() => setStep("connections"), "MAP CONNECTIONS →", "#4a7a72")}
        {backBtn(() => { setGoalStep(spheres.length - 1); setStep("goals"); }, "← Back to goals")}
      </div>
    </div>
  );

  if (screen === "intro-results") return (
    <div {...base}>
      <style>{FONTS}</style>
      <DevReset />
      <div style={{ maxWidth: "480px" }} className="w-full">
        <div className="flex justify-center mb-6">
          <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
            <rect x="15" y="40" width="12" height="30" rx="2" fill="#4a7a72" opacity="0.3"/>
            <rect x="33" y="25" width="12" height="45" rx="2" fill="#4a7a72" opacity="0.45"/>
            <rect x="51" y="10" width="12" height="60" rx="2" fill="#4a7a72" opacity="0.6"/>
            <rect x="69" y="30" width="12" height="40" rx="2" fill="#4a7a72" opacity="0.4"/>
            <circle cx="57" cy="10" r="5" fill="#b5472a" opacity="0.7"/>
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "#4a7a72", letterSpacing: "0.12em" }}>You're done!</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 600, color: "#1c1410", lineHeight: 1.3 }} className="mb-4">
          Your <em style={{ color: "#4a7a72" }}>goal chart</em> is ready
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#4a3828", fontWeight: 300 }}>
          Based on how your spheres connect, we've ranked where focusing first will create the biggest ripple effect across your life.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#5c4e40", fontWeight: 300 }}>
          Next, you'll choose a sphere to focus on, select a goal, and identify the steps you need to take to move forward.
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#8a7455", fontWeight: 300, fontStyle: "italic" }}>
          This is where things start to get exciting.
        </p>
        {primaryBtn(() => { saveChart(session, { spheres, connections }); setStep("chart"); }, "SEE MY CHART →", "#4a7a72")}
        {backBtn(() => { setGoalStep(spheres.length - 1); setStep("connections"); }, "← Back to connections")}
      </div>
    </div>
  );

  if (screen === "intro-active") return (
    <div {...base}>
      <style>{FONTS}</style>
      <DevReset />
      <div style={{ maxWidth: "480px" }} className="w-full">
        <div className="flex justify-center mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="20" y="12" width="40" height="56" rx="4" stroke="#b5472a" strokeWidth="1.5" opacity="0.3"/>
            <line x1="28" y1="28" x2="52" y2="28" stroke="#b5472a" strokeWidth="1.5" opacity="0.2"/>
            <line x1="28" y1="38" x2="52" y2="38" stroke="#b5472a" strokeWidth="1.5" opacity="0.2"/>
            <line x1="28" y1="48" x2="45" y2="48" stroke="#b5472a" strokeWidth="1.5" opacity="0.2"/>
            <polyline points="26,27 29,30 34,24" stroke="#b5472a" strokeWidth="2" fill="none" opacity="0.6"/>
            <polyline points="26,37 29,40 34,34" stroke="#b5472a" strokeWidth="2" fill="none" opacity="0.6"/>
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "#b5472a", letterSpacing: "0.12em" }}>Your plan</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 600, color: "#1c1410", lineHeight: 1.3 }} className="mb-4">
          Build it with <em style={{ color: "#b5472a" }}>action items</em>
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#4a3828", fontWeight: 300 }}>
          Now that you've chosen a goal, it's time to break it into concrete steps. You can add action items yourself or talk to <strong style={{ fontWeight: 500 }}>Lyme</strong> — your AI coach — to build a plan together.
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#5c4e40", fontWeight: 300 }}>
          Check items off as you complete them. This is your space to track progress and stay accountable.
        </p>
        {primaryBtn(() => setStep("active"), "LET'S GO →")}
        {backBtn(() => setStep("action"), "← Back to goal selection")}
      </div>
    </div>
  );

  return null;
}
