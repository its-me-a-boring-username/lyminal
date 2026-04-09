import React from "react";
import { SphereConnCard } from "./SphereConnCard.jsx";
import { SUGGESTED_SPHERES, GOAL_SUGGESTIONS, PALETTE } from "../constants.js";
import { saveChart } from "../utils/supabase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeSlideLeft { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }`;

const Pill = ({ b, onRemove }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
    style={{ background: b.color + "18", border: `1px solid ${b.color}40`, color: b.color }}>
    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
    <span>{b.name}</span>
    {onRemove && (
      <button onClick={onRemove} className="ml-1 opacity-50 hover:opacity-100 text-xs leading-none">✕</button>
    )}
  </div>
);

export function FlowScreens({
  step,
  spheres, setSpheres,
  newSphere, setNewSphere,
  newGoal, setNewGoal,
  goalStep, setGoalStep,
  connections, setConnections,
  setSelectedId,
  setStep,
  session,
  DevReset,
}) {
  const addSphere = (name) => {
    const n = name.trim();
    if (!n || spheres.some(b => b.name.toLowerCase() === n.toLowerCase())) return;
    setSpheres(prev => [...prev, { id: `b${Date.now()}`, name: n, color: PALETTE[prev.length % PALETTE.length], goals: [] }]);
    setNewSphere("");
  };

  const removeSphere = (id) => {
    setSpheres(prev => prev.filter(b => b.id !== id));
    setConnections(prev => {
      const n = { ...prev };
      delete n[id];
      Object.keys(n).forEach(k => { n[k] = (n[k] || []).filter(t => t !== id); });
      return n;
    });
  };

  const addGoal = (sphereId, text) => {
    const t = text.trim();
    if (!t) return;
    setSpheres(p => p.map(b =>
      b.id === sphereId ? { ...b, goals: [...b.goals, { id: `g${Date.now()}`, text: t }] } : b
    ));
    setNewGoal("");
  };

  const removeGoal = (sphereId, goalId) => {
    setSpheres(p => p.map(b =>
      b.id === sphereId ? { ...b, goals: b.goals.filter(g => g.id !== goalId) } : b
    ));
  };

  const toggleConn = (fromId, toId) => {
    setConnections(p => {
      const curr = p[fromId] || [];
      return { ...p, [fromId]: curr.includes(toId) ? curr.filter(t => t !== toId) : [...curr, toId] };
    });
  };

  // ── SPHERES ──
  if (step === "spheres") return (
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeSlideUp 0.4s ease-out" }}>
      <style>{FONTS}</style>
      <DevReset />
      <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "#b5472a" }} />
      <div className="px-6 py-16 max-w-2xl mx-auto w-full lg:px-16 lg:flex lg:flex-col lg:justify-center">
        <div className="mb-2 text-xs uppercase tracking-widest font-medium" style={{ color: "#6e5c4a" }}>Step 1 of 3</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 600, color: "#1c1410" }} className="mb-2">Define your spheres</h2>
        <p className="text-gray-500 mb-8">What are the major areas of your life right now? Add what's relevant to you.</p>
        <div className="relative flex items-center mb-4">
          <input
            className="w-full border-2 border-gray-200 focus:border-amber-600 rounded-xl px-4 py-3 pr-20 text-base outline-none transition-colors"
            placeholder="Type a sphere name..."
            value={newSphere}
            onChange={e => setNewSphere(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSphere(newSphere)}
            style={{ background: "#faf8f5" }}
          />
          <button
            onClick={() => addSphere(newSphere)}
            disabled={!newSphere.trim()}
            className="absolute right-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={{
              background: newSphere.trim() ? "#b5472a" : "transparent",
              color: newSphere.trim() ? "white" : "#8a7455",
              border: newSphere.trim() ? "none" : "1px solid #d4c9bb",
              letterSpacing: "0.04em"
            }}
          >ADD</button>
        </div>
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SPHERES.filter(s => !spheres.some(b => b.name.toLowerCase() === s.toLowerCase())).map(s => (
              <button key={s} onClick={() => addSphere(s)} className="px-3 py-1.5 text-xs border transition-colors"
                style={{ borderRadius: "2px", borderColor: "#d4c9bb", color: "#4a3828", background: "#f0ebe3" }}>
                + {s}
              </button>
            ))}
          </div>
        </div>
        {spheres.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-medium">Your spheres ({spheres.length})</p>
            <div className="flex flex-wrap gap-2">
              {spheres.map(b => <Pill key={b.id} b={b} onRemove={() => removeSphere(b.id)} />)}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={() => setStep("welcome")} className="px-6 py-3 text-sm font-medium transition-colors" style={{ color: "#5c4e40", border: "1px solid #d4c9bb" }}>
            ← Back
          </button>
          <button
            onClick={() => { setGoalStep(0); setStep("intro-goals"); saveChart(session, { spheres, connections }); }}
            disabled={spheres.length < 3}
            style={{ background: "#b5472a", color: "white", fontWeight: 500 }}
            className="flex-1 hover:opacity-90 disabled:opacity-30 py-3 rounded-sm transition-opacity"
          >
            {spheres.length < 3 ? `Add at least ${3 - spheres.length} more sphere${3 - spheres.length === 1 ? "" : "s"} to continue` : `Continue with ${spheres.length} spheres →`}
          </button>
        </div>
      </div>
    </div>
  );

  // ── GOALS ──
  if (step === "goals") {
    const currentSphere = spheres[goalStep];
    const isLast = goalStep === spheres.length - 1;

    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeSlideUp 0.4s ease-out" }}>
        <style>{FONTS}</style>
        <DevReset />
        <div className="hidden lg:block flex-shrink-0 transition-colors duration-300" style={{ width: "350px", background: currentSphere?.color || "#b5472a" }} />
        <div className="px-6 py-16 max-w-2xl mx-auto w-full lg:px-16 lg:flex lg:flex-col lg:justify-center">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "#6e5c4a" }}>Step 2 of 3 — Goals</span>
              <span className="text-xs" style={{ color: "#6e5c4a" }}>{goalStep + 1} of {spheres.length}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((goalStep + 1) / spheres.length) * 100}%`, background: currentSphere?.color || "#6366f1" }} />
            </div>
            <div className="flex gap-1 mt-2">
              {spheres.map((b, i) => (
                <div key={b.id} className="h-1 rounded-full flex-1 transition-all duration-300" style={{ background: i <= goalStep ? b.color : b.color + "25" }} />
              ))}
            </div>
          </div>
          {currentSphere && (
            <div key={`goal-${goalStep}`} style={{ animation: "fadeSlideLeft 0.35s ease-out" }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 rounded-full" style={{ background: currentSphere.color }} />
                <h2 style={{ color: currentSphere.color, fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 600 }}>{currentSphere.name}</h2>
              </div>
              <p className="text-gray-500 mb-8">What do you want to achieve in this area? Add as many goals as you like, or skip ahead.</p>
              <div className="border-2 rounded-2xl p-6 mb-6" style={{ borderColor: currentSphere.color + "40", background: currentSphere.color + "06" }}>
                {currentSphere.goals.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {currentSphere.goals.map(g => (
                      <div key={g.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-gray-100 shadow-sm">
                        <span className="text-gray-700 text-sm">{g.text}</span>
                        <button onClick={() => removeGoal(currentSphere.id, g.id)} className="text-gray-300 hover:text-gray-500 ml-3 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    className="flex-1 border-2 border-gray-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors bg-white"
                    placeholder={`Add a goal for ${currentSphere.name}...`}
                    value={newGoal}
                    onChange={e => setNewGoal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addGoal(currentSphere.id, newGoal); }}
                  />
                  <button onClick={() => addGoal(currentSphere.id, newGoal)}
                    className="text-white font-bold px-4 rounded-xl transition-colors text-sm"
                    style={{ background: currentSphere.color }}>
                    Add
                  </button>
                </div>
                {GOAL_SUGGESTIONS[currentSphere.name] && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Suggestions</p>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_SUGGESTIONS[currentSphere.name]
                        .filter(s => !currentSphere.goals.some(g => g.text.toLowerCase() === s.toLowerCase()))
                        .map(s => (
                          <button key={s} onClick={() => addGoal(currentSphere.id, s)}
                            className="px-3 py-1 text-xs border transition-colors"
                            style={{ borderRadius: "2px", borderColor: "#d4c9bb", color: "#4a3828", background: "white" }}>
                            + {s}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => goalStep === 0 ? setStep("spheres") : setGoalStep(g => g - 1)}
              className="px-6 py-3 text-sm font-medium transition-colors"
              style={{ color: "#faf8f5", background: "#2c1f14", border: "1px solid #2c1f14" }}>
              ← Back
            </button>
            <button
              onClick={() => isLast ? (setGoalStep(0), setStep("intro-connections")) : setGoalStep(g => g + 1)}
              className="flex-1 text-white font-bold py-3 rounded-xl transition-colors"
              style={{ background: currentSphere?.color || "#6366f1" }}>
              {isLast ? "Map relationships →" : `Next: ${spheres[goalStep + 1]?.name} →`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CONNECTIONS ──
  if (step === "connections") {
    const connStep = goalStep;
    const fromSphere = spheres[connStep];
    const isLast = connStep === spheres.length - 1;

    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeSlideUp 0.4s ease-out" }}>
        <style>{FONTS}</style>
        <DevReset />
        <div className="hidden lg:block flex-shrink-0 transition-colors duration-300" style={{ width: "350px", background: fromSphere?.color || "#4a7a72" }} />
        <div className="px-6 py-16 max-w-2xl mx-auto w-full lg:px-16 lg:flex lg:flex-col lg:justify-center">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "#6e5c4a" }}>Step 3 of 3 — Relationships</span>
              <span className="text-xs" style={{ color: "#6e5c4a" }}>{connStep + 1} of {spheres.length}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((connStep + 1) / spheres.length) * 100}%`, background: fromSphere?.color || "#6366f1" }} />
            </div>
            <div className="flex gap-1 mt-2">
              {spheres.map((b, i) => (
                <div key={b.id} className="h-1 rounded-full flex-1 transition-all duration-300" style={{ background: i <= connStep ? b.color : b.color + "25" }} />
              ))}
            </div>
          </div>
          {fromSphere && (
            <div key={`conn-${connStep}`} style={{ animation: "fadeSlideLeft 0.35s ease-out" }}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-4 h-4 rounded-full" style={{ background: fromSphere.color }} />
                <h2 style={{ color: fromSphere.color, fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 600 }}>{fromSphere.name}</h2>
              </div>
              <p className="text-gray-500 mb-5">Which other areas does improving <strong>{fromSphere.name}</strong> directly support?</p>
              {fromSphere.goals.length > 0 && (
                <div className="mb-6 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Your {fromSphere.name} goals</p>
                  <div className="flex flex-wrap gap-2">
                    {fromSphere.goals.map(g => (
                      <span key={g.id} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: fromSphere.color + "15", color: fromSphere.color }}>
                        {g.text}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs mb-3" style={{ color: "#6e5c4a" }}>Tap the goal pill on any sphere to preview its goals before connecting.</p>
              <div className="space-y-2 mb-8">
                {spheres.filter(b => b.id !== fromSphere.id).map(to => {
                  const isChecked = (connections[fromSphere.id] || []).includes(to.id);
                  return (
                    <SphereConnCard key={to.id} sphere={to} isChecked={isChecked} onToggle={() => toggleConn(fromSphere.id, to.id)} />
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => connStep === 0 ? (setGoalStep(spheres.length - 1), setStep("goals")) : setGoalStep(s => s - 1)}
              className="px-6 py-3 text-sm font-medium transition-colors hover:text-gray-900"
              style={{ color: "#5c4e40", background: "transparent", border: "1px solid #d4c9bb" }}>
              ← Back
            </button>
            <button
              onClick={() => isLast ? (setSelectedId(null), setStep("intro-results"), saveChart(session, { spheres, connections })) : setGoalStep(s => s + 1)}
              className="flex-1 text-white font-bold py-3 rounded-xl transition-colors"
              style={{ background: fromSphere?.color || "#6366f1" }}>
              {isLast ? "See my chart →" : `Next: ${spheres[connStep + 1]?.name} →`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
