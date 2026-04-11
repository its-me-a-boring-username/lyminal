import React from "react";
import { saveChart } from "../utils/supabase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeScaleIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }`;

export function ResultsFlow({
  step,
  spheres, connections, ranked,
  selectedFocusSphereId, setSelectedFocusSphereId,
  selectedGoalId, setSelectedGoalId,
  focusRound,
  completedGoals,
  setActiveGoals,
  setStep,
  session,
  DevReset,
}) {

  // ── RESULTS ──
  if (step === "results") {
    const top = ranked[0];
    const others = ranked.slice(1, 4);

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
        style={{ background: "#4a7a72", fontFamily: "'Inter', sans-serif", animation: "fadeScaleIn 0.5s ease-out" }}>
        <style>{FONTS}</style>
        <DevReset />
        <div className="max-w-lg w-full mx-auto">
          <p className="text-xs uppercase tracking-widest mb-6 text-center" style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.15em" }}>
            Your Lines of Influence
          </p>
          <div className="mb-6" style={{ background: "white", border: "1px solid #e8e0d5", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
            <div className="px-8 py-12 text-center" style={{ borderBottom: "1px solid #e8e0d5" }}>
              <p className="mb-4 leading-relaxed" style={{ color: "#4a3828", fontWeight: 300, fontSize: "1.05rem" }}>
                Based on how your spheres influence each other, your greatest leverage is in{" "}
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "1.25rem", color: top?.color || "#b5472a" }}>
                  {top?.name}
                </span>
              </p>
              <p className="text-xs" style={{ color: "#b5472a" }}>
                {top?.out} outgoing · {top?.in} incoming · score {top?.score > 0 ? "+" : ""}{top?.score}
              </p>
            </div>
            {others.length > 0 && (
              <div className="px-8 py-8">
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#6e5c4a", letterSpacing: "0.12em" }}>
                  Also worth your attention
                </p>
                <div className="space-y-3">
                  {others.map(s => (
                    <div key={s.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span style={{ color: "#1c1410", fontWeight: 500, fontFamily: "'Playfair Display', serif", fontSize: "1.05rem" }}>{s.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: "#6e5c4a" }}>score {s.score > 0 ? "+" : ""}{s.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => { setStep("chart"); saveChart(session, { spheres, connections }); }}
            className="w-full py-4 text-sm font-semibold tracking-widest hover:opacity-90 transition-opacity"
            style={{ background: "#2c1f14", color: "white", letterSpacing: "0.08em" }}>
            VIEW MY FULL CHART →
          </button>
          <button onClick={() => setStep("connections")}
            className="w-full text-center mt-4 text-xs hover:opacity-75 transition-opacity"
            style={{ color: "rgba(255,255,255,0.5)", background: "transparent" }}>
            ← Back to connections
          </button>
        </div>
      </div>
    );
  }

  // ── FOCUS ──
  if (step === "focus") {
    const recommended = ranked[0];
    const focusSphere = spheres.find(b => b.id === selectedFocusSphereId) || recommended;
    const availableSpheres = ranked.filter(b => b.goals.some(g => !completedGoals.has(g.id)));
    const roundLabels = ["first", "second", "third"];

    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.3s ease-out" }}>
        <style>{FONTS}</style>
        <DevReset />
        <div className="hidden lg:block flex-shrink-0 transition-colors duration-300" style={{ width: "350px", background: focusSphere?.color || "#b5472a" }} />
        <div className="px-6 py-12 max-w-2xl mx-auto w-full lg:px-16 lg:flex lg:flex-col lg:justify-center">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#6e5c4a" }}>Focus {roundLabels[focusRound]} sphere</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 600, color: "#1c1410" }} className="mb-1">
            {focusRound === 0 ? "Choose a sphere to focus on" : "Pick a new focus sphere"}
          </h2>
          <p className="text-sm mb-8" style={{ color: "#5c4e40", fontWeight: 300 }}>
            {focusRound === 0
              ? "Based on your connections, we recommend starting here — but you can choose any sphere below."
              : "Choose another sphere to focus on next."}
          </p>
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "#6e5c4a" }}>Choose a sphere</p>
          <div className="space-y-2 mb-8">
            {availableSpheres.map((b, i) => {
              const isSelected = selectedFocusSphereId === b.id || (!selectedFocusSphereId && b.id === recommended?.id);
              const isRecommended = b.id === recommended?.id && focusRound === 0;
              return (
                <button key={b.id} onClick={() => setSelectedFocusSphereId(b.id)}
                  className="w-full text-left border-2 transition-all"
                  style={{
                    borderColor: isSelected ? b.color : "#e8e0d5",
                    background: isSelected ? b.color + "08" : "white",
                    padding: isRecommended ? "1.25rem 1.25rem" : "0.875rem 1.25rem",
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.color }} />
                    <span className="font-semibold flex-1"
                      style={{ color: "#1c1410", fontFamily: isRecommended ? "'Playfair Display', serif" : "inherit", fontSize: isRecommended ? "1.1rem" : "0.9rem" }}>
                      {b.name}
                    </span>
                    {isRecommended && (
                      <span className="text-xs px-2 py-0.5 text-white flex-shrink-0" style={{ background: "#b5472a", letterSpacing: "0.04em" }}>WE RECOMMEND THIS</span>
                    )}
                  </div>
                  {isRecommended && b.goals.length > 0 && (
                    <div className="mt-3 ml-6 space-y-1">
                      {b.goals.map(g => (
                        <div key={g.id} className="flex items-center gap-2 text-sm" style={{ color: "#4a3828" }}>
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: b.color }} />
                          {g.text}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(focusRound === 0 ? "chart" : "active")}
              className="px-6 py-3 text-sm font-medium"
              style={{ color: "#5c4e40", border: "1px solid #d4c9bb" }}>
              {focusRound === 0 ? "← Back" : "Skip"}
            </button>
            <button
              onClick={() => { setSelectedGoalId(null); setStep("action"); }}
              className="flex-1 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: "#b5472a", color: "white" }}>
              Focus on {focusSphere?.name} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ACTION ──
  if (step === "action") {
    const focusSphere = spheres.find(b => b.id === selectedFocusSphereId) || ranked[0];

    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.3s ease-out" }}>
        <style>{FONTS}</style>
        <DevReset />
        <div className="hidden lg:block flex-shrink-0 transition-colors duration-300" style={{ width: "350px", background: focusSphere?.color || "#b5472a" }} />
        <div className="px-6 py-12 max-w-2xl mx-auto w-full lg:px-16 lg:flex lg:flex-col lg:justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ background: focusSphere?.color }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: "#6e5c4a" }}>{focusSphere?.name}</p>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 600, color: "#1c1410" }} className="mb-1">Choose a goal to work on</h2>
          <p className="text-sm mb-8" style={{ color: "#5c4e40", fontWeight: 300 }}>Pick one goal to make active. We'll build a plan together in your next step.</p>
          <div className="space-y-2 mb-8">
            {(() => {
              const availableGoals = focusSphere?.goals.filter(g => !completedGoals.has(g.id)) || [];
              return availableGoals.length > 0 ? availableGoals.map(g => (
                <button key={g.id} onClick={() => setSelectedGoalId(g.id)}
                  className="w-full flex items-center gap-3 p-4 border-2 transition-all text-left"
                  style={{
                    borderColor: selectedGoalId === g.id ? focusSphere.color : "#e8e0d5",
                    background: selectedGoalId === g.id ? focusSphere.color + "08" : "white"
                  }}>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ borderColor: focusSphere.color, background: selectedGoalId === g.id ? focusSphere.color : "white" }}>
                    {selectedGoalId === g.id && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm font-medium" style={{ color: "#1c1410" }}>{g.text}</span>
                </button>
              )) : (
                <p className="text-sm" style={{ color: "#6e5c4a" }}>All goals in this sphere are complete. Pick a different sphere.</p>
              );
            })()}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep("focus")} className="px-6 py-3 text-sm font-medium" style={{ color: "#5c4e40", border: "1px solid #d4c9bb" }}>← Back</button>
            <button
              disabled={!selectedGoalId}
              onClick={() => {
                const goal = focusSphere?.goals.find(g => g.id === selectedGoalId);
                const newActiveGoals = [{
                  sphereId: focusSphere?.id,
                  sphereName: focusSphere?.name,
                  sphereColor: focusSphere?.color,
                  goalId: selectedGoalId,
                  goalText: goal?.text,
                  actionItems: []
                }];
                setActiveGoals(newActiveGoals);
                setStep("intro-active");
                saveChart(session, { spheres, connections, activeGoals: newActiveGoals });
              }}
              className="flex-1 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-30"
              style={{ background: "#b5472a", color: "white" }}>
              Confirm & see my plan →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
