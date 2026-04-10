import React, { useState, useEffect, useRef } from "react";
import { Nav } from "./Nav.jsx";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');`;
const SLOT = 96;

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
  const r = 13, cx = 15, cy = 15, sw = 4;
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e0d5" strokeWidth={sw} />
      <ArcCircle cx={cx} cy={cy} r={r} pct={pct} color={color} sw={sw} />
      <text
        x={cx} y={cy + 3.5}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="8" fontWeight="600"
        fill={color}
      >
        {done}
      </text>
    </svg>
  );
}

function RingSlot({ sphere, pct, isActive, dist, onClick }) {
  const size = isActive ? 80 : dist === 1 ? 62 : 50;
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 6;
  const sw = isActive ? 7 : 5;
  const opacity = isActive ? 1 : dist === 1 ? 0.55 : 0.3;
  const labelColor = isActive ? sphere.color : "#8a7455";
  const labelWeight = isActive ? 600 : 400;
  const hasPct = pct !== null && pct !== undefined;
  const pctLabel = !hasPct ? "—" : pct >= 100 ? "done" : `${pct}%`;
  const pctSize = isActive ? 14 : 11;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "8px", cursor: "pointer", flexShrink: 0,
        width: `${SLOT}px`, opacity, transition: "opacity 0.25s",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e0d5" strokeWidth={sw} />
        {hasPct && <ArcCircle cx={cx} cy={cy} r={r} pct={pct} color={sphere.color} sw={sw} />}
        <text
          x={cx} y={cy + pctSize * 0.38}
          textAnchor="middle"
          fontFamily="Playfair Display, serif"
          fontSize={pctSize} fontWeight="600"
          fill={isActive ? (hasPct ? sphere.color : "#8a7455") : "#5c4e40"}
        >
          {pctLabel}
        </text>
      </svg>
      <span style={{
        fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase",
        fontFamily: "'Inter', sans-serif", textAlign: "center",
        lineHeight: 1.3, maxWidth: "80px",
        color: labelColor, fontWeight: labelWeight,
      }}>
        {sphere.name}
      </span>
    </div>
  );
}

function DetailPanel({
  sphere, activeGoal, checkedItems, completedGoals,
  setStep, setSelectedFocusSphereId, setSelectedGoalId, setActiveGoals,
}) {
  if (!sphere) return null;

  if (!activeGoal) {
    return (
      <div style={{ textAlign: "center", padding: "28px 0 8px" }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          border: "2px dashed #d4c9bb", margin: "0 auto 14px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: "18px", color: "#c4b8a8", lineHeight: 1 }}>+</span>
        </div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", color: "#1c1410", margin: "0 0 6px" }}>
          No goal set for {sphere.name}
        </p>
        <p style={{ fontSize: "12px", color: "#8a7455", fontWeight: 300, margin: "0 0 18px", lineHeight: 1.5 }}>
          Add a goal for this sphere from your chart.
        </p>
        <button
          onClick={() => {
            setSelectedFocusSphereId(sphere.id);
            setSelectedGoalId(null);
            setStep("focus");
          }}
          style={{
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em",
            color: "#b5472a", background: "none", border: "1px solid #e8e0d5",
            padding: "8px 18px", cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}
        >
          ADD A GOAL →
        </button>
      </div>
    );
  }

  const done = checkedItems[activeGoal.goalId]?.size || 0;
  const total = activeGoal.actionItems.length;
  const isComplete = completedGoals.has(activeGoal.goalId);

  return (
    <>
      {/* Goal header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "18px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: activeGoal.sphereColor, flexShrink: 0 }} />
            <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: activeGoal.sphereColor, fontFamily: "'Inter', sans-serif" }}>
              {activeGoal.sphereName}
            </span>
            {isComplete && (
              <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.06em", background: "#4a7a7215", color: "#4a7a72", padding: "2px 8px", fontFamily: "'Inter', sans-serif" }}>
                COMPLETE
              </span>
            )}
          </div>
          <p style={{
            fontFamily: "'Playfair Display', serif", fontSize: "16px",
            color: isComplete ? "#8a7455" : "#1c1410", margin: 0, lineHeight: 1.4,
            textDecoration: isComplete ? "line-through" : "none",
          }}>
            {activeGoal.goalText}
          </p>
        </div>
        {total > 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", flexShrink: 0 }}>
            <MiniPie done={done} total={total} color={activeGoal.sphereColor} />
            <span style={{ fontSize: "9px", color: "#8a7455", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>
              {done}/{total} steps
            </span>
          </div>
        )}
      </div>

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
                style={{
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  padding: "10px 0", borderBottom: "1px solid #f0ebe3",
                }}
              >
                <div style={{
                  width: "16px", height: "16px", borderRadius: "50%",
                  flexShrink: 0, marginTop: "1px",
                  border: `1.5px solid ${checked ? activeGoal.sphereColor : "#d4c9bb"}`,
                  background: checked ? activeGoal.sphereColor : "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", zIndex: 1,
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
                }}>
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      {!isComplete ? (
        <button
          onClick={() => setStep("active")}
          style={{
            width: "100%", padding: "10px", fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.05em", background: "#b5472a", color: "white",
            border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}
        >
          TALK TO LYME →
        </button>
      ) : (
        <button
          onClick={() => {
            setActiveGoals(prev => prev.filter(g => g.goalId !== activeGoal.goalId));
            setSelectedFocusSphereId(activeGoal.sphereId);
            setSelectedGoalId(null);
            setStep("focus");
          }}
          style={{
            width: "100%", padding: "10px", fontSize: "11px", fontWeight: 500,
            color: "#5c4e40", border: "1px solid #d4c9bb", background: "none",
            cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}
        >
          Pick a new goal →
        </button>
      )}
    </>
  );
}

export function ProgressScreen({
  spheres,
  activeGoals,
  checkedItems,
  completedGoals,
  isMobile,
  isPaid,
  setStep,
  session,
  setSelectedFocusSphereId,
  setSelectedGoalId,
  setActiveGoals,
}) {
  const firstActive = Math.max(0, spheres.findIndex(s => activeGoals.some(ag => ag.sphereId === s.id)));
  const [selected, setSelected] = useState(firstActive);
  const trackRef = useRef(null);
  const wrapRef = useRef(null);

  const getTranslate = () => {
    if (!wrapRef.current) return 0;
    const w = wrapRef.current.clientWidth;
    return (w / 2) - (selected * SLOT) - (SLOT / 2);
  };

  // No transition on mount — just snap into position
  useEffect(() => {
    if (!trackRef.current) return;
    trackRef.current.style.transition = "none";
    trackRef.current.style.transform = `translateX(${getTranslate()}px)`;
    const t = setTimeout(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = "transform 0.38s cubic-bezier(0.4,0,0.2,1)";
      }
    }, 50);
    return () => clearTimeout(t);
  }, []);

  // Animate on selection change
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${getTranslate()}px)`;
    }
  }, [selected]);

  // Recalculate on resize
  useEffect(() => {
    const handler = () => {
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${getTranslate()}px)`;
      }
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

  if (spheres.length === 0) {
    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
        <style>{FONTS}</style>
        <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "#4a7a72" }} />
        <div className="w-full lg:flex-1 lg:flex lg:flex-col">
          {!isMobile && <Nav step="progress" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
          {isMobile && <Nav step="progress" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
          <div className="px-6 py-10 max-w-2xl mx-auto w-full lg:px-16">
            <div style={{ border: "1px solid #e8e0d5", background: "white", padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🌱</div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c1410", margin: "0 0 8px" }}>Nothing tracked yet</p>
              <p style={{ fontSize: "0.8rem", color: "#6e5c4a", fontWeight: 300, margin: "0 0 20px", lineHeight: 1.6 }}>
                Once you have an active goal and start adding steps, your progress will show up here.
              </p>
              <button
                onClick={() => setStep("active")}
                style={{ background: "#b5472a", color: "white", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", padding: "10px 24px", border: "none", cursor: "pointer" }}
              >
                GO TO MY GOALS →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>

      {/* Left strip transitions to the selected sphere color */}
      <div
        className="hidden lg:block flex-shrink-0"
        style={{ width: "350px", background: currentSphere?.color || "#4a7a72", transition: "background 0.4s ease" }}
      />

      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        {!isMobile && <Nav step="progress" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
        {isMobile && <Nav step="progress" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

        <div className="w-full pb-24 lg:pb-12">

          {/* Header */}
          <div className="px-6 lg:px-16 pt-10 pb-0 max-w-2xl mx-auto">
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 6px" }}>
              Progress
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: 0 }}>
              How far you've come
            </h2>
          </div>

          {/* Ring carousel — full width, no max-width, so rings can scroll freely */}
          <div
            ref={wrapRef}
            style={{ overflow: "hidden", position: "relative", padding: "24px 0 20px" }}
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
                />
              ))}
            </div>
          </div>

          <div style={{ height: "1px", background: "#e8e0d5" }} className="mx-6 lg:mx-16" />

          {/* Detail panel */}
          <div className="px-6 lg:px-16 max-w-2xl mx-auto" style={{ paddingTop: "20px" }}>
            <DetailPanel
              sphere={currentSphere}
              activeGoal={activeGoal}
              checkedItems={checkedItems}
              completedGoals={completedGoals}
              setStep={setStep}
              setSelectedFocusSphereId={setSelectedFocusSphereId}
              setSelectedGoalId={setSelectedGoalId}
              setActiveGoals={setActiveGoals}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
