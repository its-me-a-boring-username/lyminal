import React, { useState, useEffect, useRef } from "react";
import { Nav } from "./Nav.jsx";
import { saveChart } from "../utils/supabase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
const SLOT = 140;

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(74,122,114,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ArcCircle({ cx, cy, r, pct, color, sw }) {
  if (pct >= 100) {
    return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} />;
  }
  if (pct <= 0) return null;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <circle
      cx={cx} cy={cy} r={r}
      fill="none" stroke={color} strokeWidth={sw}
      strokeDasharray={circ.toFixed(1)}
      strokeDashoffset={offset.toFixed(1)}
      strokeLinecap="round"
      transform={`rotate(-90 ${cx} ${cy})`}
    />
  );
}

function MiniPie({ done, total, color }) {
  if (total === 0) return null;
  const pct = (done / total) * 100;
  const r = 14, cx = 16, cy = 16, sw = 4;
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e0d5" strokeWidth={sw} />
      <ArcCircle cx={cx} cy={cy} r={r} pct={pct} color={color} sw={sw} />
      <text
        x={cx} y={cy + 4}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="9" fontWeight="600"
        fill={color}
      >
        {done}
      </text>
    </svg>
  );
}

function RingSlot({ sphere, pct, isActive, dist, onClick, isDefault }) {
  const size = isActive ? 116 : dist === 1 ? 88 : 66;
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 7;
  const sw = isActive ? 8 : 5;
  const opacity = isActive ? 1 : dist === 1 ? 0.55 : 0.28;
  const ringColor = isDefault ? sphere.color : "var(--ly-accent)";
  const labelColor = isActive ? ringColor : "#8a7455";
  const labelWeight = isActive ? 600 : 400;
  const hasPct = pct !== null && pct !== undefined;
  const pctLabel = !hasPct ? "—" : pct >= 100 ? "done" : `${pct}%`;
  const pctSize = isActive ? 16 : 12;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "10px", cursor: "pointer", flexShrink: 0,
        width: `${SLOT}px`, opacity, transition: "opacity 0.25s",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e0d5" strokeWidth={sw} />
        {hasPct && <ArcCircle cx={cx} cy={cy} r={r} pct={pct} color={ringColor} sw={sw} />}
        <text
          x={cx} y={cy + pctSize * 0.4}
          textAnchor="middle"
          fontFamily="Playfair Display, serif"
          fontSize={pctSize} fontWeight="600"
          fill={isActive ? (hasPct ? ringColor : "#8a7455") : "#5c4e40"}
        >
          {pctLabel}
        </text>
      </svg>
      <span style={{
        fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase",
        fontFamily: "'Inter', sans-serif", textAlign: "center",
        lineHeight: 1.3, maxWidth: "96px",
        color: labelColor, fontWeight: labelWeight,
      }}>
        {sphere.name}
      </span>
    </div>
  );
}

function DetailPanel({
  sphere, activeGoal, checkedItems, setCheckedItems,
  completedGoals, setCompletedGoals,
  spheres, connections, activeGoals, setActiveGoals, session,
  isPaid, setAuthPrompt,
  setStep, setSelectedFocusSphereId, setSelectedGoalId,
  setChatContext, setChatMessages, setChatLoading,
  isDefault,
}) {
  if (!sphere) return null;

  const goalColor = isDefault ? (activeGoal?.sphereColor || "#4a7a72") : "var(--ly-accent)";
  const atMax = activeGoals.length >= 5;
  const canAddGoal = !atMax && (isPaid || activeGoals.length === 0);

  // ── Empty state ──
  if (!activeGoal) {
    return (
      <div style={{ padding: "32px 0 12px" }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c1410", margin: "0 0 8px" }}>
          No goal set for {sphere.name}
        </p>
        <p style={{ fontSize: "13px", color: "#8a7455", fontWeight: 300, margin: "0 0 20px", lineHeight: 1.5 }}>
          Add a goal for this sphere to start tracking your progress here.
        </p>
        {atMax ? (
          <p style={{ fontSize: "12px", color: "#8a7455", fontStyle: "italic" }}>
            You're tracking 5 goals — the maximum. Complete one before adding another.
          </p>
        ) : canAddGoal ? (
          <button
            onClick={() => setStep("goal-picker")}
            style={{
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em",
              color: "var(--ly-accent)", background: "none", border: "1px solid #e8e0d5",
              padding: "9px 20px", cursor: "pointer", fontFamily: "'Inter', sans-serif",
              borderRadius: "6px",
            }}
          >
            ADD A GOAL →
          </button>
        ) : (
          <button
            onClick={() => setAuthPrompt("upgrade")}
            className="w-full text-left border-2 transition-all hover:opacity-90"
            style={{ borderColor: "#e8e0d5", borderStyle: "dashed", background: "#faf8f5" }}
          >
            <div className="px-5 py-4 flex items-center gap-3">
              <span style={{ fontSize: "1rem" }}>🔒</span>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "#6e5c4a" }}>Track a goal for this sphere</p>
                <p className="text-xs" style={{ color: "#8a7455" }}>Upgrade to track multiple goals at once</p>
              </div>
              <span className="text-xs font-semibold" style={{ color: "var(--ly-accent)" }}>Upgrade →</span>
            </div>
          </button>
        )}
      </div>
    );
  }

  const done = checkedItems[activeGoal.goalId]?.size || 0;
  const total = activeGoal.actionItems.length;
  const isComplete = completedGoals.has(activeGoal.goalId);

  const toggleCheck = (itemId) => {
    const current = new Set(checkedItems[activeGoal.goalId] || []);
    current.has(itemId) ? current.delete(itemId) : current.add(itemId);
    const updated = { ...checkedItems, [activeGoal.goalId]: current };
    setCheckedItems(updated);
    saveChart(session, { spheres, connections, activeGoals, checkedItems: updated, completedGoals });
  };

  const toggleGoalComplete = () => {
    const next = new Set(completedGoals);
    next.has(activeGoal.goalId) ? next.delete(activeGoal.goalId) : next.add(activeGoal.goalId);
    setCompletedGoals(next);
    saveChart(session, { spheres, connections, activeGoals, checkedItems, completedGoals: next });
  };

  const handleStuckLyme = async () => {
    setChatContext(activeGoal);
    const progressSummary = total > 0
      ? `${done} of ${total} steps complete`
      : "no steps added yet";
    setChatMessages([{
      role: "assistant",
      content: "Hi — I'm Lyme. Let's figure out what's getting in the way and get you moving again.",
    }]);
    setStep("chat");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are Lyme, a warm and focused life coach inside the Lyminal app. The user is working toward a goal and wants help getting unstuck.

Context:
- Sphere: ${activeGoal.sphereName}
- Goal: ${activeGoal.goalText}
- Progress: ${progressSummary}

${done > 0 ? `They've already completed ${done} step${done > 1 ? "s" : ""} — acknowledge that warmly, then` : "They haven't started their steps yet —"} ask one specific, practical question to understand what's blocking them. Avoid generic phrases. Make it concrete and relevant to exactly where they are with this goal. If they have no steps yet, focus on what feels most unclear about where to start.

Do NOT introduce yourself. Just ask your question directly.`,
          messages: [{ role: "user", content: "I need help getting unstuck." }],
        }),
      });
      const data = await res.json();
      const opener = data.content?.find(b => b.type === "text")?.text
        || "What's felt like the biggest obstacle since you last worked on this?";
      setChatMessages(prev => [...prev, { role: "assistant", content: opener }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "What's felt like the biggest obstacle since you last worked on this?" }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{ background: "white", border: "1px solid #e8e0d5", borderRadius: "8px", overflow: "hidden" }}>
      {/* Card header */}
      <div style={{ background: goalColor, padding: "12px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
        <button
          onClick={toggleGoalComplete}
          style={{
            width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
            border: `2px solid ${isComplete ? "white" : "rgba(255,255,255,0.5)"}`,
            background: isComplete ? "white" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0, transition: "all 0.2s",
          }}
        >
          {isComplete && (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M2 5L4 7L8 3" stroke={goalColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif" }}>
              {activeGoal.sphereName}
            </span>
            {isComplete && (
              <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.06em", background: "rgba(255,255,255,0.2)", color: "white", padding: "1px 8px", borderRadius: "999px", fontFamily: "'Inter', sans-serif" }}>
                COMPLETE
              </span>
            )}
          </div>
          <p style={{
            fontFamily: "'Playfair Display', serif", fontSize: "1rem",
            color: isComplete ? "rgba(255,255,255,0.6)" : "white", margin: "2px 0 0", lineHeight: 1.3,
            textDecoration: isComplete ? "line-through" : "none",
          }}>
            {activeGoal.goalText}
          </p>
        </div>
        {total > 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flexShrink: 0 }}>
            <MiniPie done={done} total={total} color="white" />
            <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>
              {done}/{total}
            </span>
          </div>
        )}
      </div>
      {/* Card body */}
      <div style={{ padding: "18px 18px 18px" }}>

      {/* Action items journey */}
      {total === 0 ? (
        <p style={{ fontSize: "12px", color: "#8a7455", fontStyle: "italic", margin: "0 0 18px" }}>
          No steps added yet — talk to Lyme to build your plan.
        </p>
      ) : (
        <div style={{ position: "relative", paddingLeft: "22px", marginBottom: "18px" }}>
          <div style={{
            position: "absolute", left: "8px", top: "10px", bottom: "10px",
            width: "1px", background: "#e8e0d5",
          }} />
          {activeGoal.actionItems.map(item => {
            const checked = checkedItems[activeGoal.goalId]?.has(item.id) || false;
            return (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  padding: "10px 0", borderBottom: "1px solid #f0ebe3",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: "16px", height: "16px", borderRadius: "50%",
                  flexShrink: 0, marginTop: "1px",
                  border: `1.5px solid ${checked ? goalColor : "#d4c9bb"}`,
                  background: checked ? goalColor : "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", zIndex: 1, transition: "all 0.15s",
                }}>
                  {checked && (
                    <svg width="8" height="8" viewBox="0 0 8 8">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: "12px", lineHeight: 1.5,
                  color: checked ? "#8a7455" : "#4a3828",
                  textDecoration: checked ? "line-through" : "none",
                  transition: "color 0.15s",
                }}>
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* CTAs */}
      {!isComplete ? (
        <button
          onClick={handleStuckLyme}
          style={{
            width: "100%", padding: "11px", fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.05em", background: goalColor, color: "white",
            border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
            borderRadius: "6px",
          }}
        >
          FEELING STUCK? TALK TO LYME →
        </button>
      ) : (
        <button
          onClick={() => {
            setActiveGoals(prev => prev.filter(g => g.goalId !== activeGoal.goalId));
            saveChart(session, {
              spheres, connections,
              activeGoals: activeGoals.filter(g => g.goalId !== activeGoal.goalId),
              checkedItems, completedGoals,
            });
            setStep("goal-picker");
          }}
          style={{
            width: "100%", padding: "11px", fontSize: "11px", fontWeight: 500,
            color: "#5c4e40", border: "1px solid #d4c9bb", background: "none",
            cursor: "pointer", fontFamily: "'Inter', sans-serif", borderRadius: "6px",
          }}
        >
          Pick a new goal →
        </button>
      )}
      </div>{/* closes card body */}
    </div>
  );
}

export function ProgressScreen({
  spheres,
  activeGoals, setActiveGoals,
  checkedItems, setCheckedItems,
  completedGoals, setCompletedGoals,
  connections,
  isMobile,
  isPaid,
  setStep,
  session,
  setSelectedFocusSphereId,
  setSelectedGoalId,
  setAuthPrompt,
  setChatContext,
  setChatMessages,
  setChatLoading,
  selectedTheme,
}) {
  const isDefault = selectedTheme === "warm_earth" || !selectedTheme;
  const firstActive = Math.max(0, spheres.findIndex(s => activeGoals.some(ag => ag.sphereId === s.id)));
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);
  const [selected, setSelected] = useState(firstActive);
  const trackRef = useRef(null);
  const wrapRef = useRef(null);

  const getTranslate = () => {
    if (!wrapRef.current) return 0;
    const w = wrapRef.current.clientWidth;
    return (w / 2) - (selected * SLOT) - (SLOT / 2);
  };

  useEffect(() => {
    if (!trackRef.current) return;
    trackRef.current.style.transition = "none";
    trackRef.current.style.transform = `translateX(${getTranslate()}px)`;
    const t = setTimeout(() => {
      if (trackRef.current) trackRef.current.style.transition = "transform 0.38s cubic-bezier(0.4,0,0.2,1)";
    }, 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (trackRef.current) trackRef.current.style.transform = `translateX(${getTranslate()}px)`;
  }, [selected]);

  useEffect(() => {
    const handler = () => {
      if (trackRef.current) trackRef.current.style.transform = `translateX(${getTranslate()}px)`;
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [selected]);

  const getPct = (s) => {
    const ag = activeGoals.find(g => g.sphereId === s.id);
    if (!ag) return null;
    if (completedGoals.has(ag.goalId)) return 100;
    const total = ag.actionItems.length;
    if (total === 0) return 0;
    const done = checkedItems[ag.goalId]?.size || 0;
    return Math.round((done / total) * 100);
  };

  const currentSphere = spheres[selected];
  const activeGoal = currentSphere ? activeGoals.find(ag => ag.sphereId === currentSphere.id) : null;
  const headerColor = currentSphere?.color || "#4a7a72";

  if (spheres.length === 0) {
    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
        <style>{FONTS}</style>
        <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "var(--ly-accent)" }} />
        <div className="w-full lg:flex-1 lg:flex lg:flex-col">
          <Nav step="progress" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />
          <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease-out" }}>
          <div className="px-6 py-10 max-w-4xl mx-auto w-full lg:px-16">
            <div style={{ border: "1px solid #e8e0d5", background: "white", padding: "40px 24px", textAlign: "center", borderRadius: "8px" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c1410", margin: "0 0 8px" }}>Nothing tracked yet</p>
              <p style={{ fontSize: "0.8rem", color: "#6e5c4a", fontWeight: 300, margin: "0 0 20px", lineHeight: 1.6 }}>
                Once you have an active goal and start adding steps, your progress will show up here.
              </p>
              <button
                onClick={() => setStep("active")}
                style={{ background: "var(--ly-accent)", color: "white", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", padding: "10px 24px", border: "none", cursor: "pointer", borderRadius: "6px" }}
              >
                GO TO MY GOALS →
              </button>
            </div>
          </div>
          </div>{/* end fade wrapper */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>

      {/* Left strip */}
      <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: isDefault ? headerColor : "var(--ly-accent)" }} />

      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        <Nav step="progress" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />
        <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease-out" }}>

        <div className="w-full pb-24 lg:pb-12">

          {/* Colored header band — replaces the left strip on mobile, adds color on desktop */}
          <div className="lg:px-16" style={{
            background: isDefault ? hexToRgba(headerColor, 0.07) : "rgba(var(--ly-accent-rgb), 0.07)",
            borderBottom: isDefault ? `1px solid ${hexToRgba(headerColor, 0.12)}` : "1px solid rgba(var(--ly-accent-rgb), 0.12)",
            padding: "28px 24px 24px",
          }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: isDefault ? headerColor : "var(--ly-accent)", opacity: 0.8, margin: "0 0 4px" }}>
              Your Progress
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 4px" }}>
              How far you've come
            </h2>
            <p style={{ fontSize: "0.8rem", color: "#5c4e40", fontWeight: 300, margin: 0, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>Track your progress, add new goals, and get unstuck with Lyme.</p>
          </div>

          {/* Ring carousel — full bleed so rings can slide freely */}
          <div
            ref={wrapRef}
            style={{ overflow: "hidden", position: "relative", padding: "28px 0 22px" }}
          >
            <div
              ref={trackRef}
              style={{ display: "flex", alignItems: "center", willChange: "transform" }}
            >
              {spheres.map((s, i) => (
                <RingSlot
                  key={s.id}
                  sphere={s}
                  pct={getPct(s)}
                  isActive={i === selected}
                  dist={Math.abs(i - selected)}
                  onClick={() => setSelected(i)}
                  isDefault={isDefault}
                />
              ))}
            </div>
          </div>

          <div style={{ height: "1px", background: "#e8e0d5" }} />

          {/* Detail panel */}
          <div className="px-6 lg:px-16 max-w-4xl mx-auto" style={{ paddingTop: "22px", paddingBottom: "32px" }}>
            <DetailPanel
              sphere={currentSphere}
              activeGoal={activeGoal}
              checkedItems={checkedItems}
              setCheckedItems={setCheckedItems}
              completedGoals={completedGoals}
              setCompletedGoals={setCompletedGoals}
              spheres={spheres}
              connections={connections}
              activeGoals={activeGoals}
              setActiveGoals={setActiveGoals}
              session={session}
              isPaid={isPaid}
              setStep={setStep}
              setSelectedFocusSphereId={setSelectedFocusSphereId}
              setSelectedGoalId={setSelectedGoalId}
              setAuthPrompt={setAuthPrompt}
              setChatContext={setChatContext}
              setChatMessages={setChatMessages}
              setChatLoading={setChatLoading}
              isDefault={isDefault}
            />
          </div>
        </div>
        </div>{/* end fade wrapper */}
      </div>
    </div>
  );
}
