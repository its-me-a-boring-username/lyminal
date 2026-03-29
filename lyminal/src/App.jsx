import { useState, useMemo, useEffect } from "react";
import { TriangleLogo } from "./components/TriangleLogo.jsx";
import { SphereConnCard } from "./components/SphereConnCard.jsx";
import { MAP_BG, FONTS, SUGGESTED_SPHERES, GOAL_SUGGESTIONS, PALETTE } from "./constants.js";
import { generateChartReport, generateFullReport } from "./utils/pdf.js";

export default function GoalChart() {
  const [step, setStep] = useState("welcome");
  const [spheres, setSpheres] = useState([]);
  const [newSphere, setNewSphere] = useState("");
  const [connections, setConnections] = useState({});
  const [goalStep, setGoalStep] = useState(0);
  const [newGoal, setNewGoal] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [dragOffsets, setDragOffsets] = useState({}); // {sphereId: {dx, dy}}
  const [dragging, setDragging] = useState(null); // sphereId being dragged
  const [didDrag, setDidDrag] = useState(false);

  // Post-chart flow state
  const [activeGoals, setActiveGoals] = useState([]); // [{sphereId, sphereName, sphereColor, goalId, goalText, actionItems}]
  const [focusRound, setFocusRound] = useState(0);    // 0, 1, 2
  const [overrideSphere, setOverrideSphere] = useState(false);
  const [selectedFocusSphereId, setSelectedFocusSphereId] = useState(null);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [newActionItem, setNewActionItem] = useState("");
  const [editingAction, setEditingAction] = useState(null); // {goalId, itemId, text}
  const [pdfLoading, setPdfLoading] = useState(null); // 'chart' | 'full' | null
  const [chatLoading, setChatLoading] = useState(false);
  const [chatContext, setChatContext] = useState(null); // the active goal being discussed
  const [checkedItems, setCheckedItems] = useState({}); // { goalId: Set of checked action item ids }
  const [completedGoals, setCompletedGoals] = useState(new Set()); // set of completed goalIds

  // LocalStorage save/restore
  useEffect(() => {
    const saved = localStorage.getItem("goalchart_state");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.spheres) setSpheres(s.spheres);
        if (s.connections) setConnections(s.connections);
        if (s.activeGoals) setActiveGoals(s.activeGoals);
        if (s.step) setStep(s.step);
        if (s.completedGoals) setCompletedGoals(new Set(s.completedGoals));
        if (s.checkedItems) {
          const restored = {};
          Object.entries(s.checkedItems).forEach(([k, v]) => { restored[k] = new Set(v); });
          setCheckedItems(restored);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (spheres.length > 0) {
      const serializedChecked = {};
      Object.entries(checkedItems).forEach(([k, v]) => { serializedChecked[k] = [...v]; });
      localStorage.setItem("goalchart_state", JSON.stringify({
        spheres, connections, activeGoals, step,
        completedGoals: [...completedGoals],
        checkedItems: serializedChecked
      }));
    }
  }, [spheres, connections, activeGoals, step, completedGoals, checkedItems]);

  // --- Sphere ops ---
  const addSphere = (name) => {
    const n = name.trim();
    if (!n || spheres.some(b => b.name.toLowerCase() === n.toLowerCase())) return;
    setSpheres(p => [...p, {
      id: `b${Date.now()}`,
      name: n,
      goals: [],
      color: PALETTE[p.length % PALETTE.length]
    }]);
    setNewSphere("");
  };

  const removeSphere = (id) => {
    setSpheres(p => p.filter(b => b.id !== id));
    setConnections(p => {
      const n = { ...p };
      delete n[id];
      Object.keys(n).forEach(k => { n[k] = (n[k] || []).filter(t => t !== id); });
      return n;
    });
  };

  // --- Goal ops ---
  const addGoal = (sphereId, text) => {
    const t = text.trim();
    if (!t) return;
    setSpheres(p => p.map(b =>
      b.id === sphereId
        ? { ...b, goals: [...b.goals, { id: `g${Date.now()}`, text: t }] }
        : b
    ));
    setNewGoal("");
  };

  const removeGoal = (sphereId, goalId) => {
    setSpheres(p => p.map(b =>
      b.id === sphereId ? { ...b, goals: b.goals.filter(g => g.id !== goalId) } : b
    ));
  };

  // --- Connection ops ---
  const toggleConn = (fromId, toId) => {
    setConnections(p => {
      const curr = p[fromId] || [];
      return {
        ...p,
        [fromId]: curr.includes(toId) ? curr.filter(t => t !== toId) : [...curr, toId]
      };
    });
  };

  // --- Computed ---
  const counts = useMemo(() => {
    const r = {};
    spheres.forEach(b => { r[b.id] = { out: 0, in: 0 }; });
    Object.entries(connections).forEach(([from, targets]) => {
      if (r[from]) r[from].out = (targets || []).length;
      (targets || []).forEach(to => { if (r[to]) r[to].in++; });
    });
    return r;
  }, [spheres, connections]);

  const ranked = useMemo(() =>
    [...spheres].map(b => ({
      ...b,
      out: counts[b.id]?.out || 0,
      in: counts[b.id]?.in || 0,
      score: (counts[b.id]?.out || 0) - (counts[b.id]?.in || 0)
    })).sort((a, b) => b.out - a.out || b.score - a.score),
    [spheres, counts]
  );

  // SVG positions
  const positions = useMemo(() => {
    const pos = {};
    const n = spheres.length;
    if (n === 0) return pos;
    const cx = 350, cy = 310;
    const r = n <= 3 ? 160 : n <= 6 ? 200 : 240;
    spheres.forEach((b, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      pos[b.id] = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });
    return pos;
  }, [spheres]);

  const currentSphere = spheres[goalStep];

  // --- Sub-components ---
  const Pill = ({ b, onRemove }) => (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
      style={{ background: b.color + "18", border: `1px solid ${b.color}40`, color: b.color }}
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
      <span>{b.name}</span>
      {onRemove && (
        <button onClick={onRemove} className="ml-1 opacity-50 hover:opacity-100 text-xs leading-none">✕</button>
      )}
    </div>
  );

  // SVG curved arrow
  const Arrow = ({ fromId, toId, posOverride }) => {
    const pos = posOverride || positions;
    const f = pos[fromId], t = pos[toId];
    if (!f || !t) return null;
    const fromSphere = spheres.find(b => b.id === fromId);
    const color = fromSphere?.color || "#6366f1";
    const R = 48;
    const dx = t.x - f.x, dy = t.y - f.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return null;
    const ux = dx / dist, uy = dy / dist;
    const x1 = f.x + ux * R, y1 = f.y + uy * R;
    const x2 = t.x - ux * (R + 6), y2 = t.y - uy * (R + 6);
    const mx = (x1 + x2) / 2 - uy * 25, my = (y1 + y2) / 2 + ux * 25;
    const markerId = `arr-${fromId}-${toId}`;
    return (
      <g>
        <defs>
          <marker id={markerId} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 z" fill={color} opacity="0.7" />
          </marker>
        </defs>
        <path
          d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeOpacity="0.55"
          markerEnd={`url(#${markerId})`}
        />
      </g>
    );
  };

  // --- Steps ---

  // ── PASSWORD GATE ──
  const DevReset = () => (
    <button
      onClick={() => { localStorage.removeItem("goalchart_state"); location.reload(); }}
      className="fixed right-4 text-xs px-3 py-2 hover:opacity-100 transition-opacity z-50"
      style={{bottom:"76px", background:"#2c1f14", color:"#faf8f5", opacity:0.5, borderRadius:"4px"}}
    >
      🛠 Reset
    </button>
  );

  if (step === "welcome") return (
    <>
    <DevReset />
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden" style={{fontFamily:"'Inter', sans-serif", animation:"fadeSlideUp 0.45s ease-out"}}>
      <style>{FONTS}</style>
      <DevReset />
      <div className="absolute inset-0" style={{backgroundImage:`url(${MAP_BG})`, backgroundSize:"cover", backgroundPosition:"center"}}/>

      {/* Content card */}
      <div className="relative z-10 w-full mx-auto text-left" style={{maxWidth:"530px"}}>
        <div className="px-12 py-10" style={{background:"rgba(250,248,245,0.95)", border:"1px solid #ddd3c5", boxShadow:"0 8px 40px rgba(0,0,0,0.18)"}}>

          {/* Logo */}
          <div className="flex justify-center mb-5">
            <TriangleLogo size={80} />
          </div>

          <h1 style={{fontFamily:"'Playfair Display', serif", fontSize:"2.4rem", fontWeight:600, color:"#1c1410", lineHeight:1.2, textAlign:"center"}} className="mb-3">
            Build Your <em style={{color:"#b5472a"}}>Goal Chart</em>
          </h1>
          <p className="text-sm mb-7 leading-relaxed" style={{color:"#4a3828", fontWeight:300}}>
            Map the areas of your life, discover which ones support others, and find where to focus first.
          </p>
          <div className="space-y-2.5 mb-8">
            {[
              ["Define your spheres","The major areas of your life"],
              ["Add goals to each","What you want to achieve"],
              ["Map the relationships","How each area influences others"],
              ["See your priorities","Where to focus first"],
            ].map(([title, desc], i) => (
              <div key={title} className="flex gap-3 items-start">
                <span className="text-xs font-semibold mt-0.5 w-4 flex-shrink-0" style={{color:"#b5472a"}}>{i+1}.</span>
                <div className="text-sm" style={{color:"#1c1410"}}>
                  <span className="font-medium">{title}</span>
                  <span style={{color:"#5c4e40"}}> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep("intro-spheres")}
            style={{background:"#b5472a", color:"#faf8f5", fontFamily:"'Inter', sans-serif", fontWeight:500, letterSpacing:"0.06em", fontSize:"0.8rem"}}
            className="w-full py-3.5 transition-opacity hover:opacity-85"
          >
            GET STARTED →
          </button>
        </div>
      </div>
    </div>
    </>
  );

  // ── INTERSTITIAL: INTRO TO SPHERES ──
  if (step === "intro-spheres") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{background:"#faf8f5", fontFamily:"'Inter', sans-serif", animation:"fadeScaleIn 0.5s ease-out"}}>
      <style>{FONTS}</style>
      <DevReset />
      <div style={{maxWidth:"480px"}} className="w-full">
        {/* Decorative element */}
        <div className="flex justify-center mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="25" cy="40" r="16" fill="#b5693a" opacity="0.25"/>
            <circle cx="45" cy="28" r="16" fill="#4a7c8e" opacity="0.25"/>
            <circle cx="50" cy="50" r="16" fill="#6b8f71" opacity="0.25"/>
            <circle cx="35" cy="55" r="12" fill="#c4973a" opacity="0.2"/>
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{color:"#b5472a", letterSpacing:"0.12em"}}>Step 1 of 3</p>
        <h2 style={{fontFamily:"'Playfair Display', serif", fontSize:"1.8rem", fontWeight:600, color:"#1c1410", lineHeight:1.3}} className="mb-4">
          Start with your <em style={{color:"#b5472a"}}>spheres</em>
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{color:"#4a3828", fontWeight:300}}>
          Your life is made up of different areas — we call them <strong style={{fontWeight:500}}>spheres</strong>. Career, health, relationships, creativity, finances...
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{color:"#5c4e40", fontWeight:300}}>
          Name the ones that matter most to you right now. You'll need at least three to build a meaningful chart.
        </p>
        <button
          onClick={() => setStep("spheres")}
          style={{background:"#b5472a", color:"#faf8f5", fontWeight:500, letterSpacing:"0.06em", fontSize:"0.8rem"}}
          className="w-full py-3.5 transition-opacity hover:opacity-85 mb-3"
        >
          DEFINE MY SPHERES →
        </button>
        <button
          onClick={() => setStep("welcome")}
          className="text-xs transition-opacity hover:opacity-70"
          style={{color:"#8a7455"}}
        >
          ← Back
        </button>
      </div>
    </div>
  );

  // ── INTERSTITIAL: INTRO TO GOALS ──
  if (step === "intro-goals") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{background:"#faf8f5", fontFamily:"'Inter', sans-serif", animation:"fadeScaleIn 0.5s ease-out"}}>
      <style>{FONTS}</style>
      <DevReset />
      <div style={{maxWidth:"480px"}} className="w-full">
        {/* Decorative element — target/bullseye */}
        <div className="flex justify-center mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="28" stroke="#b5472a" strokeWidth="1.5" opacity="0.2"/>
            <circle cx="40" cy="40" r="18" stroke="#b5472a" strokeWidth="1.5" opacity="0.35"/>
            <circle cx="40" cy="40" r="8" fill="#b5472a" opacity="0.5"/>
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{color:"#b5472a", letterSpacing:"0.12em"}}>Step 2 of 3</p>
        <h2 style={{fontFamily:"'Playfair Display', serif", fontSize:"1.8rem", fontWeight:600, color:"#1c1410", lineHeight:1.3}} className="mb-4">
          Now set your <em style={{color:"#b5472a"}}>goals</em>
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{color:"#4a3828", fontWeight:300}}>
          For each sphere, you'll add goals — concrete things you want to achieve. These don't have to be perfect.
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{color:"#5c4e40", fontWeight:300}}>
          Think about what progress looks like in each area. We'll suggest some ideas to get you started.
        </p>
        <button
          onClick={() => setStep("goals")}
          style={{background:"#b5472a", color:"#faf8f5", fontWeight:500, letterSpacing:"0.06em", fontSize:"0.8rem"}}
          className="w-full py-3.5 transition-opacity hover:opacity-85 mb-3"
        >
          ADD MY GOALS →
        </button>
        <button
          onClick={() => setStep("spheres")}
          className="text-xs transition-opacity hover:opacity-70"
          style={{color:"#8a7455"}}
        >
          ← Back to spheres
        </button>
      </div>
    </div>
  );

  // ── INTERSTITIAL: INTRO TO CONNECTIONS ──
  if (step === "intro-connections") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{background:"#faf8f5", fontFamily:"'Inter', sans-serif", animation:"fadeScaleIn 0.5s ease-out"}}>
      <style>{FONTS}</style>
      <DevReset />
      <div style={{maxWidth:"480px"}} className="w-full">
        {/* Decorative element — connected nodes */}
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
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{color:"#4a7a72", letterSpacing:"0.12em"}}>Step 3 of 3</p>
        <h2 style={{fontFamily:"'Playfair Display', serif", fontSize:"1.8rem", fontWeight:600, color:"#1c1410", lineHeight:1.3}} className="mb-4">
          Map the <em style={{color:"#4a7a72"}}>influence</em>
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{color:"#4a3828", fontWeight:300}}>
          Some areas of your life naturally support others. Progress in your <strong style={{fontWeight:500}}>career</strong> can improve your <strong style={{fontWeight:500}}>finances</strong>. Stronger <strong style={{fontWeight:500}}>finances</strong> might mean more freedom to spend on <strong style={{fontWeight:500}}>fun</strong>.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{color:"#5c4e40", fontWeight:300}}>
          Think about your specific goals in each sphere — a goal like "get a promotion" supports your finances differently than "learn a hard skill" might.
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{color:"#5c4e40", fontWeight:300}}>
          For each sphere, select which other areas it directly supports based on what you're actually working toward. We'll use these connections to find where focusing first creates the biggest ripple effect.
        </p>
        <button
          onClick={() => setStep("connections")}
          style={{background:"#4a7a72", color:"#faf8f5", fontWeight:500, letterSpacing:"0.06em", fontSize:"0.8rem"}}
          className="w-full py-3.5 transition-opacity hover:opacity-85 mb-3"
        >
          MAP CONNECTIONS →
        </button>
        <button
          onClick={() => { setGoalStep(spheres.length - 1); setStep("goals"); }}
          className="text-xs transition-opacity hover:opacity-70"
          style={{color:"#8a7455"}}
        >
          ← Back to goals
        </button>
      </div>
    </div>
  );

  if (step === "spheres") return (
    <div className="min-h-screen px-6 py-16 max-w-2xl mx-auto" style={{background:"#faf8f5",fontFamily:"'Inter', sans-serif", animation:"fadeSlideUp 0.4s ease-out"}}>
      <style>{FONTS}</style>
      <DevReset />
      <div className="mb-2 text-xs uppercase tracking-widest font-medium" style={{color:"#6e5c4a"}}>Step 1 of 3</div>
      <h2 style={{fontFamily:"'Playfair Display', serif", fontSize:"2rem", fontWeight:600, color:"#1c1410"}} className="mb-2">Define your spheres</h2>
      <p className="text-gray-500 mb-8">What are the major areas of your life right now? Add what's relevant to you.</p>

      {/* Input with inline add button */}
      <div className="relative flex items-center mb-4">
        <input
          className="w-full border-2 border-gray-200 focus:border-amber-600 rounded-xl px-4 py-3 pr-20 text-base outline-none transition-colors"
          placeholder="Type a sphere name..."
          value={newSphere}
          onChange={e => setNewSphere(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addSphere(newSphere)}
          style={{background:"#faf8f5"}}
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
        >
          ADD
        </button>
      </div>

      {/* Suggestions */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Suggestions</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_SPHERES.filter(s => !spheres.some(b => b.name.toLowerCase() === s.toLowerCase())).map(s => (
            <button
              key={s}
              onClick={() => addSphere(s)}
              className="px-3 py-1.5 text-xs border transition-colors" style={{borderRadius:"2px", borderColor:"#d4c9bb", color:"#4a3828", background:"#f0ebe3"}}
            >
              + {s}
            </button>
          ))}
        </div>
      </div>

      {/* Current spheres */}
      {spheres.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-medium">Your spheres ({spheres.length})</p>
          <div className="flex flex-wrap gap-2">
            {spheres.map(b => <Pill key={b.id} b={b} onRemove={() => removeSphere(b.id)} />)}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setStep("welcome")} className="px-6 py-3 text-sm font-medium transition-colors hover:text-gray-900" style={{color:"#5c4e40", background:"transparent", border:"1px solid #d4c9bb"}}>
          ← Back
        </button>
        <button
          onClick={() => { setGoalStep(0); setStep("intro-goals"); }}
          disabled={spheres.length < 3}
          style={{background:"#b5472a", color:"white", fontWeight:500}} className="flex-1 hover:opacity-90 disabled:opacity-30 py-3 rounded-sm transition-opacity"
        >
          {spheres.length < 3 ? `Add at least ${3 - spheres.length} more sphere${3 - spheres.length === 1 ? "" : "s"} to continue` : `Continue with ${spheres.length} spheres →`}
        </button>
      </div>
    </div>
  );

  if (step === "goals") {
    const isLast = goalStep === spheres.length - 1;
    const goNext = () => setGoalStep(g => g + 1);
    const goPrev = () => goalStep === 0 ? setStep("spheres") : setGoalStep(g => g - 1);

    return (
      <div className="min-h-screen px-6 py-16 max-w-2xl mx-auto" style={{background:"#faf8f5",fontFamily:"'Inter', sans-serif", animation:"fadeSlideUp 0.4s ease-out"}}>
      <style>{FONTS}</style>
      <DevReset />
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest font-medium" style={{color:"#6e5c4a"}}>Step 2 of 3 — Goals</span>
            <span className="text-xs" style={{color:"#6e5c4a"}}>{goalStep + 1} of {spheres.length}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((goalStep + 1) / spheres.length) * 100}%`, background: currentSphere?.color || "#6366f1" }}
            />
          </div>
          <div className="flex gap-1 mt-2">
            {spheres.map((b, i) => (
              <div
                key={b.id}
                className="h-1 rounded-full flex-1 transition-all duration-300"
                style={{ background: i <= goalStep ? b.color : b.color + "25" }}
              />
            ))}
          </div>
        </div>

        {currentSphere && (
          <div key={`goal-${goalStep}`} style={{animation:"fadeSlideLeft 0.35s ease-out"}}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-4 h-4 rounded-full" style={{ background: currentSphere.color }} />
              <h2 className="text-3xl font-bold" style={{ color: currentSphere.color, fontFamily:"'Playfair Display', serif", fontSize:"2rem" }}>{currentSphere.color && currentSphere.name}</h2>
            </div>
            <p className="text-gray-500 mb-8">What do you want to achieve in this area? Add as many goals as you like, or skip ahead.</p>

            <div className="border-2 rounded-2xl p-6 mb-6" style={{ borderColor: currentSphere.color + "40", background: currentSphere.color + "06" }}>
              {/* Current goals */}
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

              {/* Add goal */}
              <div className="flex gap-2">
                <input
                  className="flex-1 border-2 border-gray-200 focus:border-amber-600 rounded-xl px-4 py-2.5 text-sm outline-none transition-colors bg-white"
                  placeholder={`Add a goal for ${currentSphere.name}...`}
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { addGoal(currentSphere.id, newGoal); }}}
                />
                <button
                  onClick={() => addGoal(currentSphere.id, newGoal)}
                  className="text-white font-bold px-4 rounded-xl transition-colors text-sm"
                  style={{ background: currentSphere.color }}
                >
                  Add
                </button>
              </div>

              {/* Suggestions */}
              {GOAL_SUGGESTIONS[currentSphere.name] && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Suggestions</p>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_SUGGESTIONS[currentSphere.name]
                      .filter(s => !currentSphere.goals.some(g => g.text.toLowerCase() === s.toLowerCase()))
                      .map(s => (
                        <button
                          key={s}
                          onClick={() => addGoal(currentSphere.id, s)}
                          className="px-3 py-1 text-xs border transition-colors" style={{borderRadius:"2px", borderColor:"#d4c9bb", color:"#4a3828", background:"white"}}
                        >
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
          <button onClick={goPrev} className="px-6 py-3 text-sm font-medium transition-colors" style={{color:"#faf8f5", background:"#2c1f14", border:"1px solid #2c1f14"}}>
            ← Back
          </button>
          <button
            onClick={() => isLast ? (setGoalStep(0), setStep("intro-connections")) : goNext()}
            className="flex-1 text-white font-bold py-3 rounded-xl transition-colors"
            style={{ background: currentSphere?.color || "#6366f1" }}
          >
            {isLast ? "Map relationships →" : `Next: ${spheres[goalStep + 1]?.name} →`}
          </button>
        </div>
      </div>
    );
  }

  if (step === "connections") {
    const [connStep, setConnStep] = [goalStep, setGoalStep];
    const fromSphere = spheres[connStep];
    const isLast = connStep === spheres.length - 1;
    const goNext = () => isLast ? (setSelectedId(null), setStep("intro-results")) : setConnStep(s => s + 1);
    const goPrev = () => connStep === 0 ? (setGoalStep(spheres.length - 1), setStep("goals")) : setConnStep(s => s - 1);

    return (
      <div className="min-h-screen px-6 py-16 max-w-2xl mx-auto" style={{background:"#faf8f5",fontFamily:"'Inter', sans-serif", animation:"fadeSlideUp 0.4s ease-out"}}>
      <style>{FONTS}</style>
      <DevReset />
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-widest font-medium" style={{color:"#6e5c4a"}}>Step 3 of 3 — Relationships</span>
            <span className="text-xs" style={{color:"#6e5c4a"}}>{connStep + 1} of {spheres.length}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((connStep + 1) / spheres.length) * 100}%`, background: fromSphere?.color || "#6366f1" }}
            />
          </div>
          <div className="flex gap-1 mt-2">
            {spheres.map((b, i) => (
              <div
                key={b.id}
                className="h-1 rounded-full flex-1 transition-all duration-300"
                style={{ background: i <= connStep ? b.color : b.color + "25" }}
              />
            ))}
          </div>
        </div>

        {fromSphere && (
          <div key={`conn-${connStep}`} style={{animation:"fadeSlideLeft 0.35s ease-out"}}>
            {/* Current sphere header */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-4 h-4 rounded-full" style={{ background: fromSphere.color }} />
              <h2 className="text-3xl font-bold" style={{ color: fromSphere.color, fontFamily:"'Playfair Display', serif", fontSize:"2rem" }}>{fromSphere.name}</h2>
            </div>
            <p className="text-gray-500 mb-5">Which other areas does improving <strong>{fromSphere.name}</strong> directly support?</p>

            {/* Current sphere's goals - collapsed peek */}
            {fromSphere.goals.length > 0 && (
              <div className="mb-6 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Your {fromSphere.name} goals</p>
                <div className="flex flex-wrap gap-2">
                  {fromSphere.goals.map(g => (
                    <span key={g.id} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: fromSphere.color + "15", color: fromSphere.color }}>
                      {g.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Other spheres as selectable cards with peek */}
            <p className="text-xs mb-3 flex items-center gap-1.5" style={{color:"#6e5c4a"}}>
              <span>Tap the goal pill on any sphere to preview its goals before connecting.</span>
            </p>
            <div className="space-y-2 mb-8">
              {spheres.filter(b => b.id !== fromSphere.id).map(to => {
                const isChecked = (connections[fromSphere.id] || []).includes(to.id);
                return (
                  <SphereConnCard
                    key={to.id}
                    sphere={to}
                    isChecked={isChecked}
                    onToggle={() => toggleConn(fromSphere.id, to.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={goPrev} className="px-6 py-3 text-sm font-medium transition-colors hover:text-gray-900" style={{color:"#5c4e40", background:"transparent", border:"1px solid #d4c9bb"}}>
            ← Back
          </button>
          <button
            onClick={goNext}
            className="flex-1 text-white font-bold py-3 rounded-xl transition-colors"
            style={{ background: fromSphere?.color || "#6366f1" }}
          >
            {isLast ? "See my chart →" : `Next: ${spheres[connStep + 1]?.name} →`}
          </button>
        </div>
      </div>
    );
  }

  // ── INTERSTITIAL: INTRO TO RESULTS ──
  if (step === "intro-results") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{background:"#faf8f5", fontFamily:"'Inter', sans-serif", animation:"fadeScaleIn 0.5s ease-out"}}>
      <style>{FONTS}</style>
      <DevReset />
      <div style={{maxWidth:"480px"}} className="w-full">
        {/* Decorative element — chart with star */}
        <div className="flex justify-center mb-6">
          <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
            <rect x="15" y="40" width="12" height="30" rx="2" fill="#4a7a72" opacity="0.3"/>
            <rect x="33" y="25" width="12" height="45" rx="2" fill="#4a7a72" opacity="0.45"/>
            <rect x="51" y="10" width="12" height="60" rx="2" fill="#4a7a72" opacity="0.6"/>
            <rect x="69" y="30" width="12" height="40" rx="2" fill="#4a7a72" opacity="0.4"/>
            <circle cx="57" cy="10" r="5" fill="#b5472a" opacity="0.7"/>
          </svg>
        </div>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{color:"#4a7a72", letterSpacing:"0.12em"}}>You're done!</p>
        <h2 style={{fontFamily:"'Playfair Display', serif", fontSize:"1.8rem", fontWeight:600, color:"#1c1410", lineHeight:1.3}} className="mb-4">
          Your <em style={{color:"#4a7a72"}}>goal chart</em> is ready
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{color:"#4a3828", fontWeight:300}}>
          Based on how your spheres connect, we've ranked where focusing first will create the biggest ripple effect across your life.
        </p>
        <p className="text-sm leading-relaxed mb-3" style={{color:"#5c4e40", fontWeight:300}}>
          Next, you'll choose a sphere to focus on, select a goal, and identify the steps you need to take to move forward.
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{color:"#8a7455", fontWeight:300, fontStyle:"italic"}}>
          This is where things start to get exciting.
        </p>
        <button
          onClick={() => setStep("results")}
          style={{background:"#4a7a72", color:"#faf8f5", fontWeight:500, letterSpacing:"0.06em", fontSize:"0.8rem"}}
          className="w-full py-3.5 transition-opacity hover:opacity-85 mb-3"
        >
          SEE MY RESULTS →
        </button>
        <button
          onClick={() => { setGoalStep(spheres.length - 1); setStep("connections"); }}
          className="text-xs transition-opacity hover:opacity-70"
          style={{color:"#8a7455"}}
        >
          ← Back to connections
        </button>
      </div>
    </div>
  );

  if (step === "results") {
    const top = ranked[0];
    const others = ranked.slice(1, 4);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16" style={{background:"#4a7a72", fontFamily:"'Inter', sans-serif", animation:"fadeScaleIn 0.5s ease-out"}}>
        <style>{FONTS}</style>
      <DevReset />
        <div className="max-w-lg w-full mx-auto">

          {/* Eyebrow */}
          <p className="text-xs uppercase tracking-widest mb-6 text-center" style={{color:"rgba(255,255,255,0.6)", letterSpacing:"0.15em"}}>
            Your Lines of Influence
          </p>

          {/* White card */}
          <div className="mb-6" style={{background:"white", border:"1px solid #e8e0d5", boxShadow:"0 4px 24px rgba(0,0,0,0.07)"}}>

            {/* Primary recommendation */}
            <div className="px-8 py-12 text-center" style={{borderBottom:"1px solid #e8e0d5"}}>
              <p className="mb-4 leading-relaxed" style={{color:"#4a3828", fontWeight:300, fontSize:"1.05rem"}}>
                Based on how your spheres influence each other, your greatest leverage is in{" "}
                <span style={{fontFamily:"'Playfair Display', serif", fontWeight:600, fontSize:"1.25rem", color: top?.color || "#b5472a"}}>
                  {top?.name}
                </span>
              </p>
              <p className="text-xs" style={{color:"#b5472a"}}>
                {top?.out} outgoing · {top?.in} incoming · score {top?.score > 0 ? "+" : ""}{top?.score}
              </p>
            </div>

            {/* Supporting spheres */}
            {others.length > 0 && (
              <div className="px-8 py-8">
                <p className="text-xs uppercase tracking-widest mb-4" style={{color:"#6e5c4a", letterSpacing:"0.12em"}}>
                  Also worth your attention
                </p>
                <div className="space-y-3">
                  {others.map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: s.color}}/>
                        <span style={{color:"#1c1410", fontWeight:500, fontFamily:"'Playfair Display', serif", fontSize:"1.05rem"}}>
                          {s.name}
                        </span>
                      </div>
                      <span className="text-xs" style={{color:"#6e5c4a"}}>
                        score {s.score > 0 ? "+" : ""}{s.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={() => setStep("chart")}
            className="w-full py-4 text-sm font-semibold tracking-widest hover:opacity-90 transition-opacity"
            style={{background:"#2c1f14", color:"white", letterSpacing:"0.08em"}}
          >
            VIEW MY FULL CHART →
          </button>

          {/* Back link */}
          <button
            onClick={() => setStep("connections")}
            className="w-full text-center mt-4 text-xs hover:opacity-75 transition-opacity"
            style={{color:"rgba(255,255,255,0.5)", background:"transparent"}}
          >
            ← Back to connections
          </button>

        </div>
      </div>
    );
  }

  if (step === "chart") {
    const selected = spheres.find(b => b.id === selectedId);
    const selectedCounts = selectedId ? counts[selectedId] : null;

    // Compute drag-adjusted positions
    const chartPos = {};
    Object.entries(positions).forEach(([id, p]) => {
      const offset = dragOffsets[id] || { dx: 0, dy: 0 };
      chartPos[id] = { x: p.x + offset.dx, y: p.y + offset.dy };
    });

    // SVG drag handlers
    const getSvgPoint = (e, svg) => {
      const pt = svg.createSVGPoint();
      const touch = e.touches ? e.touches[0] : e;
      pt.x = touch.clientX;
      pt.y = touch.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };

    const onDragStart = (e, sphereId) => {
      e.stopPropagation();
      const svg = e.currentTarget.closest('svg');
      const pt = getSvgPoint(e, svg);
      const pos = chartPos[sphereId];
      setDragging(sphereId);
      setDidDrag(false);
      // Store the offset between cursor and center
      svg._dragStart = { ox: pt.x - pos.x, oy: pt.y - pos.y };
      svg._dragSphere = sphereId;
    };

    const onDragMove = (e) => {
      const svg = e.currentTarget;
      if (!svg._dragSphere) return;
      e.preventDefault();
      setDidDrag(true);
      const pt = getSvgPoint(e, svg);
      const basePos = positions[svg._dragSphere];
      setDragOffsets(prev => ({
        ...prev,
        [svg._dragSphere]: {
          dx: pt.x - svg._dragStart.ox - basePos.x,
          dy: pt.y - svg._dragStart.oy - basePos.y,
        }
      }));
    };

    const onDragEnd = (e) => {
      const svg = e.currentTarget;
      svg._dragSphere = null;
      svg._dragStart = null;
      setDragging(null);
    };

    return (
      <div className="min-h-screen" style={{background:"#faf8f5",fontFamily:"'Inter', sans-serif", animation:"fadeIn 0.4s ease-out"}}>
        <style>{FONTS}</style>
      <DevReset />
        {/* Header */}
        <div style={{background:"#faf8f5", borderBottom:"1px solid #e8e0d5"}} className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 style={{fontFamily:"'Playfair Display', serif", fontSize:"1.25rem", color:"#1c1410"}} className="font-semibold">Your Goal Chart</h2>
            <p className="text-xs" style={{color:"#6e5c4a"}}>{spheres.length} spheres · {Object.values(connections).flat().length} connections</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setDragOffsets({}); setStep("connections"); }} className="text-sm font-medium transition-colors hover:opacity-70" style={{color:"#b5693a"}}>← Edit connections</button>
            <button
              onClick={() => { setDragOffsets({}); setSpheres([]); setConnections({}); setGoalStep(0); setActiveGoals([]); setSelectedId(null); setStep("spheres"); }}
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{color:"#6e5c4a"}}
            >
              ↺ Redo chart
            </button>
            {Object.keys(dragOffsets).length > 0 && (
              <button
                onClick={() => setDragOffsets({})}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{color:"#4a7a72"}}
              >
                ↺ Reset layout
              </button>
            )}
            <button
              onClick={() => { setDragOffsets({}); setFocusRound(0); setOverrideSphere(false); setSelectedFocusSphereId(ranked[0]?.id || null); setActiveGoals([]); setSelectedGoalId(null); setStep("focus"); }}
              className="px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{background:"#b5472a", color:"white", letterSpacing:"0.04em"}}
            >
              Choose My Focus →
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 65px)" }}>
          {/* SVG Chart */}
          <div className="flex-1 flex flex-col items-center justify-center p-4" style={{background:"#faf8f5"}}>
            <svg viewBox="0 0 700 620" className="w-full max-w-xl"
              style={{cursor: dragging ? 'grabbing' : 'default', touchAction: 'none'}}
              onMouseMove={onDragMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}
            >
              {/* Arrows */}
              {Object.entries(connections).map(([fromId, targets]) =>
                (targets || []).map(toId => (
                  <Arrow key={`${fromId}-${toId}`} fromId={fromId} toId={toId} posOverride={chartPos} />
                ))
              )}
              {/* Nodes */}
              {spheres.map(b => {
                const pos = chartPos[b.id];
                if (!pos) return null;
                const c = counts[b.id] || { out: 0, in: 0 };
                const isSelected = selectedId === b.id;
                const isTop = ranked[0]?.id === b.id;
                return (
                  <g key={b.id} 
                    onClick={() => { if (!didDrag) setSelectedId(selectedId === b.id ? null : b.id); }}
                    onMouseDown={(e) => onDragStart(e, b.id)}
                    onTouchStart={(e) => onDragStart(e, b.id)}
                    style={{ cursor: dragging === b.id ? 'grabbing' : 'grab' }}
                  >
                    {/* Glow ring for top priority */}
                    {isTop && (
                      <circle cx={pos.x} cy={pos.y} r={58} fill="none" stroke={b.color} strokeWidth="2.5" strokeOpacity="0.25" strokeDasharray="4 3"
                        style={{transformOrigin: `${pos.x}px ${pos.y}px`, animation: 'spinRing 20s linear infinite'}}
                      />
                    )}
                    {/* Node circle */}
                    <circle
                      cx={pos.x} cy={pos.y} r={48}
                      fill={isSelected ? b.color : "white"}
                      stroke={b.color}
                      strokeWidth={isSelected ? 0 : 2.5}
                      filter={isSelected ? "drop-shadow(0 0 8px " + b.color + "80)" : "drop-shadow(0 2px 4px rgba(0,0,0,0.08))"}
                    />
                    {/* Name — wraps on space if needed */}
                    {(() => {
                      const name = b.name;
                      const spaceIdx = name.indexOf(' ');
                      if (spaceIdx > 0 && name.length > 8) {
                        const line1 = name.slice(0, spaceIdx);
                        const line2 = name.slice(spaceIdx + 1);
                        return (<>
                          <text x={pos.x} y={pos.y - 10} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="700" fill={isSelected ? "white" : b.color}>{line1}</text>
                          <text x={pos.x} y={pos.y + 6} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="700" fill={isSelected ? "white" : b.color}>{line2}</text>
                        </>);
                      }
                      return (
                        <text x={pos.x} y={pos.y - 2} textAnchor="middle" dominantBaseline="middle" fontSize={name.length > 12 ? "11" : "13"} fontWeight="700" fill={isSelected ? "white" : b.color}>{name}</text>
                      );
                    })()}
                    {/* Counts */}
                    <text
                      x={pos.x} y={pos.y + (b.name.indexOf(' ') > 0 && b.name.length > 8 ? 20 : 14)}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize="10" fontWeight="500"
                      fill={isSelected ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.35)"}
                    >
                      ↑{c.in} ↓{c.out}
                    </text>
                    {/* Top badge */}
                    {isTop && (
                      <g>
                        <circle cx={pos.x + 38} cy={pos.y - 38} r={11} fill={b.color} />
                        <text x={pos.x + 38} y={pos.y - 38} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="white" fontWeight="bold">★</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
            <button
              onClick={async () => {
                setPdfLoading('chart');
                try { await generateChartReport(spheres, connections, counts, ranked); }
                catch(e) { console.error(e); alert('Chart report generation failed: ' + e.message); }
                setPdfLoading(null);
              }}
              disabled={pdfLoading === 'chart'}
              className="mt-4 px-5 py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity"
              style={{background:"#4a7a72", color:"white", letterSpacing:"0.04em"}}
            >
              {pdfLoading === 'chart' ? 'Generating...' : '↓ DOWNLOAD CHART REPORT'}
            </button>
          </div>

          {/* Side panel */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l overflow-y-auto" style={{background:"#faf8f5", borderColor:"#e8e0d5"}}>
            {selected ? (
              <div className="p-6" style={{fontFamily:"'Inter', sans-serif"}}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-4 h-4 rounded-full" style={{ background: selected.color }} />
                  <h3 className="text-xl font-bold" style={{ color: selected.color }}>{selected.name}</h3>
                  <button onClick={() => setSelectedId(null)} className="ml-auto text-gray-300 hover:text-gray-500 text-sm">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedCounts?.out || 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Outgoing</div>
                    <div className="text-xs text-gray-400">supports others</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedCounts?.in || 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Incoming</div>
                    <div className="text-xs text-gray-400">needs support</div>
                  </div>
                </div>

                {/* Supports */}
                {(connections[selected.id] || []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Supports</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(connections[selected.id] || []).map(toId => {
                        const b = spheres.find(b => b.id === toId);
                        return b ? <Pill key={toId} b={b} /> : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Goals */}
                {selected.goals.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Goals ({selected.goals.length})</p>
                    <div className="space-y-1.5">
                      {selected.goals.map(g => (
                        <div key={g.id} className="flex items-start gap-2 text-sm text-gray-700 py-1.5 border-b border-gray-50">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selected.color }} />
                          {g.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6" style={{fontFamily:"'Inter', sans-serif"}}>
                <h3 style={{fontFamily:"'Playfair Display', serif", color:"#1c1410"}} className="font-semibold mb-1">Priority Ranking</h3>
                <p className="text-xs mb-5" style={{color:"#6e5c4a"}}>Ranked by how many areas each sphere supports</p>
                <div className="space-y-2">
                  {ranked.map((b, i) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedId(b.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left border border-transparent hover:border-gray-100"
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: i === 0 ? b.color : b.color + "60" }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 truncate">{b.name}</div>
                        <div className="text-xs text-gray-400">↓{b.out} out · ↑{b.in} in</div>
                      </div>
                      {i === 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: b.color }}>
                          Focus
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-sm" style={{background:"#f0ebe3", border:"1px solid #ddd3c5"}}>
                  <p className="text-xs font-semibold mb-1" style={{color:"#6b4a2a"}}>How to read this</p>
                  <p className="text-xs leading-relaxed" style={{color:"#8a6040"}}>
                    The top-ranked sphere has the most outgoing connections — improving it creates the most downstream benefits. Start there.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── FOCUS SPHERE STEP ──
  if (step === "focus") {
    const recommended = ranked[0];
    const focusSphere = spheres.find(b => b.id === selectedFocusSphereId) || recommended;
    const availableSpheres = ranked.filter(b => 
      b.goals.some(g => !completedGoals.has(g.id))
    );
    const roundLabels = ["first", "second", "third"];

    return (
      <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto" style={{background:"#faf8f5", fontFamily:"'Inter', sans-serif", animation:"fadeSlideUp 0.4s ease-out"}}>
        <style>{FONTS}</style>
      <DevReset />
        <p className="text-xs uppercase tracking-widest mb-2" style={{color:"#6e5c4a"}}>Focus {roundLabels[focusRound]} sphere</p>
        <h2 style={{fontFamily:"'Playfair Display', serif", fontSize:"2rem", fontWeight:600, color:"#1c1410"}} className="mb-1">
          {focusRound === 0 ? "Choose a sphere to focus on" : "Pick a new focus sphere"}
        </h2>
        <p className="text-sm mb-8" style={{color:"#5c4e40", fontWeight:300}}>
          {focusRound === 0
            ? "You'll pick one sphere and one goal within it to work on first. Based on your connections, we recommend starting here — but you can choose a different one."
            : "Choose another sphere to focus on next."}
        </p>

        {/* Recommendation card */}
        {!overrideSphere && (
          <div className="mb-4 p-6 border-2" style={{borderColor: focusSphere?.color, background: focusSphere?.color + "08"}}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full" style={{background: focusSphere?.color}}/>
              <span style={{fontFamily:"'Playfair Display', serif", fontSize:"1.4rem", color:"#1c1410", fontWeight:600}}>{focusSphere?.name}</span>
              {focusRound === 0 && <span className="text-xs px-2 py-0.5 text-white ml-auto" style={{background:"#b5472a"}}>Recommended</span>}
            </div>
            <p className="text-xs mb-4" style={{color:"#6e5c4a"}}>
              {counts[focusSphere?.id]?.out || 0} outgoing · {counts[focusSphere?.id]?.in || 0} incoming
            </p>
            {focusSphere?.goals.length > 0 && (
              <div className="space-y-1">
                {focusSphere.goals.map(g => (
                  <div key={g.id} className="flex items-center gap-2 text-sm" style={{color:"#4a3828"}}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background: focusSphere.color}}/>
                    {g.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Override toggle */}
        {!overrideSphere ? (
          <button onClick={() => setOverrideSphere(true)} className="text-sm mb-8 hover:opacity-70 transition-opacity" style={{color:"#b5472a"}}>
            Choose a different sphere instead →
          </button>
        ) : (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider mb-3" style={{color:"#6e5c4a"}}>Choose a sphere</p>
            <div className="space-y-2">
              {availableSpheres.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedFocusSphereId(b.id)}
                  className="w-full flex items-center gap-3 p-4 border-2 transition-all text-left"
                  style={{
                    borderColor: selectedFocusSphereId === b.id ? b.color : "#e8e0d5",
                    background: selectedFocusSphereId === b.id ? b.color + "08" : "white"
                  }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background: b.color}}/>
                  <span className="font-medium flex-1" style={{color:"#1c1410"}}>{b.name}</span>
                  <span className="text-xs" style={{color:"#6e5c4a"}}>score {b.score > 0 ? "+" : ""}{b.score}</span>
                </button>
              ))}
            </div>
            <button onClick={() => { setOverrideSphere(false); setSelectedFocusSphereId(recommended?.id); }} className="text-xs mt-3 hover:opacity-70" style={{color:"#6e5c4a"}}>
              ← Back to recommendation
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => setStep(focusRound === 0 ? "chart" : "active")} className="px-6 py-3 text-sm font-medium" style={{color:"#5c4e40", border:"1px solid #d4c9bb"}}>
            {focusRound === 0 ? "← Back" : "Skip"}
          </button>
          <button
            onClick={() => { setSelectedGoalId(null); setStep("action"); }}
            className="flex-1 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{background:"#b5472a", color:"white"}}
          >
            Focus on {focusSphere?.name} →
          </button>
        </div>
      </div>
    );
  }

  // ── GOAL SELECTION STEP ──
  if (step === "action") {
    const focusSphere = spheres.find(b => b.id === selectedFocusSphereId) || ranked[0];

    return (
      <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto" style={{background:"#faf8f5", fontFamily:"'Inter', sans-serif", animation:"fadeSlideUp 0.4s ease-out"}}>
        <style>{FONTS}</style>
      <DevReset />
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full" style={{background: focusSphere?.color}}/>
          <p className="text-xs uppercase tracking-widest" style={{color:"#6e5c4a"}}>{focusSphere?.name}</p>
        </div>
        <h2 style={{fontFamily:"'Playfair Display', serif", fontSize:"2rem", fontWeight:600, color:"#1c1410"}} className="mb-1">Choose a goal to work on</h2>
        <p className="text-sm mb-8" style={{color:"#5c4e40", fontWeight:300}}>Pick one goal to make active. We'll build a plan together in your next step.</p>

        {/* Goal selection */}
        <div className="space-y-2 mb-8">
          {(() => {
            const availableGoals = focusSphere?.goals.filter(g => !completedGoals.has(g.id)) || [];
            return availableGoals.length > 0 ? availableGoals.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGoalId(g.id)}
              className="w-full flex items-center gap-3 p-4 border-2 transition-all text-left"
              style={{
                borderColor: selectedGoalId === g.id ? focusSphere.color : "#e8e0d5",
                background: selectedGoalId === g.id ? focusSphere.color + "08" : "white"
              }}
            >
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{borderColor: focusSphere.color, background: selectedGoalId === g.id ? focusSphere.color : "white"}}>
                {selectedGoalId === g.id && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <span className="text-sm font-medium" style={{color:"#1c1410"}}>{g.text}</span>
            </button>
            )) : (
              <p className="text-sm" style={{color:"#6e5c4a"}}>All goals in this sphere are complete. Pick a different sphere.</p>
            );
          })()}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep("focus")} className="px-6 py-3 text-sm font-medium" style={{color:"#5c4e40", border:"1px solid #d4c9bb"}}>← Back</button>
          <button
            disabled={!selectedGoalId}
            onClick={() => {
              const focusSph = spheres.find(b => b.id === selectedFocusSphereId) || ranked[0];
              const goal = focusSph?.goals.find(g => g.id === selectedGoalId);
              setActiveGoals([{
                sphereId: focusSph?.id,
                sphereName: focusSph?.name,
                sphereColor: focusSph?.color,
                goalId: selectedGoalId,
                goalText: goal?.text,
                actionItems: []
              }]);
              setStep("intro-active");
            }}
            className="flex-1 py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-30"
            style={{background:"#b5472a", color:"white"}}
          >
            Confirm & see my plan →
          </button>
        </div>
      </div>
    );
  }

  // ── INTERSTITIAL: INTRO TO ACTION ITEMS ──
  if (step === "intro-active") return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{background:"#faf8f5", fontFamily:"'Inter', sans-serif", animation:"fadeScaleIn 0.5s ease-out"}}>
      <style>{FONTS}</style>
      <DevReset />
      <div style={{maxWidth:"480px"}} className="w-full">
        {/* Decorative element — checklist */}
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
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{color:"#b5472a", letterSpacing:"0.12em"}}>Your plan</p>
        <h2 style={{fontFamily:"'Playfair Display', serif", fontSize:"1.8rem", fontWeight:600, color:"#1c1410", lineHeight:1.3}} className="mb-4">
          Build it with <em style={{color:"#b5472a"}}>action items</em>
        </h2>
        <p className="text-sm leading-relaxed mb-3" style={{color:"#4a3828", fontWeight:300}}>
          Now that you've chosen a goal, it's time to break it into concrete steps. You can add action items yourself or talk to <strong style={{fontWeight:500}}>Lyme</strong> — your AI coach — to build a plan together.
        </p>
        <p className="text-sm leading-relaxed mb-8" style={{color:"#5c4e40", fontWeight:300}}>
          Check items off as you complete them. This is your space to track progress and stay accountable.
        </p>
        <button
          onClick={() => setStep("active")}
          style={{background:"#b5472a", color:"#faf8f5", fontWeight:500, letterSpacing:"0.06em", fontSize:"0.8rem"}}
          className="w-full py-3.5 transition-opacity hover:opacity-85 mb-3"
        >
          LET'S GO →
        </button>
        <button
          onClick={() => setStep("action")}
          className="text-xs transition-opacity hover:opacity-70"
          style={{color:"#8a7455"}}
        >
          ← Back to goal selection
        </button>
      </div>
    </div>
  );

  // ── ACTIVE GOALS SUMMARY ──
  if (step === "active") {
    const allActive = focusRound >= 1
      ? activeGoals
      : activeGoals.slice(0, 1);

    return (
      <div className="min-h-screen px-6 py-12 max-w-2xl mx-auto" style={{background:"#faf8f5", fontFamily:"'Inter', sans-serif", animation:"fadeScaleIn 0.5s ease-out"}}>
        <style>{FONTS}</style>
      <DevReset />
        <p className="text-xs uppercase tracking-widest mb-2" style={{color:"#6e5c4a"}}>Your Active Goals</p>
        <h2 style={{fontFamily:"'Playfair Display', serif", fontSize:"2rem", fontWeight:600, color:"#1c1410"}} className="mb-1">Here's what you're working on</h2>
        <p className="text-sm mb-8" style={{color:"#5c4e40", fontWeight:300}}>
          Select a goal to talk through your plan with Lyme, connect with a live coach, or add action items yourself.
        </p>

        <div className="space-y-4 mb-8">
          {allActive.map((ag, i) => (
            <div key={ag.sphereId} className="border" style={{borderColor:"#e8e0d5", background:"white"}}>
              {/* Header */}
              <div className="px-5 py-4 flex items-center gap-3 border-b" style={{borderColor:"#e8e0d5"}}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background: ag.sphereColor}}/>
                <span className="text-xs uppercase tracking-wider font-medium" style={{color: ag.sphereColor}}>{ag.sphereName}</span>
              </div>
              {/* Goal */}
              <div className="px-5 py-4 border-b" style={{borderColor:"#f0ebe3"}}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setCompletedGoals(prev => {
                      const next = new Set(prev);
                      prev.has(ag.goalId) ? next.delete(ag.goalId) : next.add(ag.goalId);
                      return next;
                    })}
                    className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all"
                    style={{borderColor: ag.sphereColor, background: completedGoals.has(ag.goalId) ? ag.sphereColor : "white"}}
                  >
                    {completedGoals.has(ag.goalId) && <span className="text-white" style={{fontSize:"10px", fontWeight:"bold"}}>✓</span>}
                  </button>
                  <p style={{fontFamily:"'Playfair Display', serif", fontSize:"1.1rem", color: completedGoals.has(ag.goalId) ? "#6e5c4a" : "#1c1410", textDecoration: completedGoals.has(ag.goalId) ? "line-through" : "none"}}>{ag.goalText}</p>
                </div>
                {completedGoals.has(ag.goalId) && (
                  <button
                    onClick={() => {
                      setSelectedFocusSphereId(ranked[0]?.id || null);
                      setSelectedGoalId(null);
                      setActiveGoals(prev => prev.filter(g => g.goalId !== ag.goalId));
                      setStep("focus");
                    }}
                    className="mt-3 ml-8 text-xs font-semibold hover:opacity-80 transition-opacity"
                    style={{color:"#b5472a"}}
                  >
                    Pick a new goal →
                  </button>
                )}
              </div>
              {/* Action items */}
              <div className="px-5 py-3 border-b" style={{borderColor:"#f0ebe3"}}>
                {ag.actionItems.length > 0 ? (
                  <div className="space-y-2">
                    {ag.actionItems.map(a => {
                      const checked = checkedItems[ag.goalId]?.has(a.id) || false;
                      const isEditing = editingAction?.goalId === ag.goalId && editingAction?.itemId === a.id;
                      return (
                        <div key={a.id} className="flex items-start gap-3 group">
                          <button
                            onClick={() => setCheckedItems(prev => {
                              const set = new Set(prev[ag.goalId] || []);
                              checked ? set.delete(a.id) : set.add(a.id);
                              return { ...prev, [ag.goalId]: set };
                            })}
                            className="flex-shrink-0 mt-0.5"
                          >
                            <div
                              className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                              style={{borderColor: ag.sphereColor, background: checked ? ag.sphereColor : "white"}}
                            >
                              {checked && <span className="text-white" style={{fontSize:"9px", fontWeight:"bold"}}>✓</span>}
                            </div>
                          </button>
                          {isEditing ? (
                            <input
                              autoFocus
                              className="flex-1 text-xs border rounded px-2 py-0.5 outline-none"
                              style={{borderColor: ag.sphereColor, color:"#4a3828"}}
                              value={editingAction.text}
                              onChange={e => setEditingAction(prev => ({...prev, text: e.target.value}))}
                              onKeyDown={e => {
                                if (e.key === "Enter" && editingAction.text.trim()) {
                                  setActiveGoals(prev => prev.map(g =>
                                    g.goalId === ag.goalId
                                      ? { ...g, actionItems: g.actionItems.map(ai => ai.id === a.id ? {...ai, text: editingAction.text.trim()} : ai) }
                                      : g
                                  ));
                                  setEditingAction(null);
                                }
                                if (e.key === "Escape") setEditingAction(null);
                              }}
                              onBlur={() => {
                                if (editingAction.text.trim()) {
                                  setActiveGoals(prev => prev.map(g =>
                                    g.goalId === ag.goalId
                                      ? { ...g, actionItems: g.actionItems.map(ai => ai.id === a.id ? {...ai, text: editingAction.text.trim()} : ai) }
                                      : g
                                  ));
                                }
                                setEditingAction(null);
                              }}
                            />
                          ) : (
                            <span
                              className="flex-1 text-xs cursor-pointer hover:opacity-70 transition-opacity"
                              style={{color: checked ? "#6e5c4a" : "#4a3828", textDecoration: checked ? "line-through" : "none"}}
                              onClick={() => setEditingAction({goalId: ag.goalId, itemId: a.id, text: a.text})}
                              title="Click to edit"
                            >
                              {a.text}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setActiveGoals(prev => prev.map(g =>
                                g.goalId === ag.goalId
                                  ? { ...g, actionItems: g.actionItems.filter(ai => ai.id !== a.id) }
                                  : g
                              ));
                              setCheckedItems(prev => {
                                const set = new Set(prev[ag.goalId] || []);
                                set.delete(a.id);
                                return { ...prev, [ag.goalId]: set };
                              });
                            }}
                            className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{color:"#8a7455", fontSize:"11px"}}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs mb-2" style={{color:"#6e5c4a"}}>No action items yet. Add your own or talk to Lyme.</p>
                )}
                {/* Manual action item input */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    className="flex-1 border rounded px-3 py-1.5 text-xs outline-none transition-colors"
                    style={{borderColor:"#d4c9bb", background:"#faf8f5"}}
                    placeholder="Add an action item..."
                    value={newActionItem}
                    onChange={e => setNewActionItem(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newActionItem.trim()) {
                        const item = { id: `m${Date.now()}`, text: newActionItem.trim() };
                        setActiveGoals(prev => prev.map(g =>
                          g.goalId === ag.goalId
                            ? { ...g, actionItems: [...g.actionItems, item] }
                            : g
                        ));
                        setNewActionItem("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!newActionItem.trim()) return;
                      const item = { id: `m${Date.now()}`, text: newActionItem.trim() };
                      setActiveGoals(prev => prev.map(g =>
                        g.goalId === ag.goalId
                          ? { ...g, actionItems: [...g.actionItems, item] }
                          : g
                      ));
                      setNewActionItem("");
                    }}
                    disabled={!newActionItem.trim()}
                    className="px-3 py-1.5 text-xs font-semibold rounded transition-all"
                    style={{
                      background: newActionItem.trim() ? ag.sphereColor : "transparent",
                      color: newActionItem.trim() ? "white" : "#8a7455",
                      border: newActionItem.trim() ? "none" : "1px solid #d4c9bb"
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
              {/* CTAs */}
              <div className="px-5 py-3 flex gap-2">
                <button
                  onClick={async () => {
                    setChatContext(ag);
                    const introMsg = { role: "assistant", content: "Hi — I'm Lyme, your AI coach. I am here to help you identify steps you can take to achieve your goals. I'll ask a few questions, then we'll put together a checklist of action items that gets saved to your home screen so you can track your progress." };
                    setChatMessages([introMsg]);
                    setStep("chat");
                    setChatLoading(true);
                    try {
                      const res = await fetch("/api/chat", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                          model: "claude-sonnet-4-20250514",
                          max_tokens: 1000,
                          system: `You are Lyme, a warm and focused life coach inside the Lyminal app. Your job is to help someone build a concrete action plan for a specific goal.

Context:
- Sphere: ${ag.sphereName}
- Goal: ${ag.goalText}

Open the conversation with a single, specific, thoughtful question that gets right to the heart of where this person stands with this goal. Do NOT use a generic opener like "where are you starting from?" — instead, ask something directly relevant to the goal itself. For example, if the goal is "Get a promotion", ask about promotion criteria or manager feedback. If the goal is "Pay down debt", ask which debt they want to tackle first. Make it feel like you already understand the goal and want to understand their situation.

Do NOT introduce yourself or explain what you do — that has already been handled. Just ask your question directly. Keep it concise and warm.`,
                          messages: [{ role: "user", content: "Start the conversation." }]
                        })
                      });
                      const data = await res.json();
                      const opener = data.content?.find(b => b.type === "text")?.text || `Let's talk about your goal: ${ag.goalText}. What does your current situation look like?`;
                      setChatMessages(prev => [...prev, { role: "assistant", content: opener }]);
                    } catch {
                      setChatMessages(prev => [...prev, { role: "assistant", content: `Let's talk about your goal: ${ag.goalText}. What does your current situation look like?` }]);
                    } finally {
                      setChatLoading(false);
                    }
                  }}
                  className="flex-1 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
                  style={{background:"#b5472a", color:"white", letterSpacing:"0.04em"}}
                >
                  Talk to Lyme
                </button>
                <button
                  className="flex-1 py-2 text-xs font-semibold border"
                  style={{borderColor:"#d4c9bb", color:"#6e5c4a"}}
                  onClick={() => alert("Live coaching coming soon!")}
                >
                  Talk to a Coach ✦
                </button>
                <button
                  className="py-2 px-3 text-xs font-semibold border hover:opacity-80 transition-opacity"
                  style={{borderColor:"#d4c9bb", color:"#6e5c4a"}}
                  onClick={() => {
                    setActiveGoals(prev => prev.filter(g => g.goalId !== ag.goalId));
                    setSelectedFocusSphereId(ag.sphereId);
                    setSelectedGoalId(null);
                    setStep("action");
                  }}
                >
                  ↩ Change
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add more / done */}
        <div className="flex gap-3 flex-col">
          {/* Upgrade prompt — free tier locked */}
          <div className="p-4 border flex items-center gap-4" style={{borderColor:"#e8e0d5", background:"white"}}>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-0.5" style={{color:"#1c1410"}}>Track more goals</p>
              <p className="text-xs" style={{color:"#6e5c4a"}}>Upgrade to track up to 3 goals and unlock your goal report.</p>
            </div>
            <button
              onClick={() => alert("Upgrade coming soon!")}
              className="px-4 py-2 text-xs font-semibold flex-shrink-0 hover:opacity-90 transition-opacity"
              style={{background:"#b5472a", color:"white", letterSpacing:"0.04em"}}
            >
              UPGRADE ✦
            </button>
          </div>
          <button
            onClick={async () => {
              setPdfLoading('full');
              try { await generateFullReport(spheres, connections, counts, ranked, activeGoals, checkedItems, completedGoals); }
              catch(e) { console.error(e); alert('Report generation failed. Please try again.'); }
              setPdfLoading(null);
            }}
            disabled={!!pdfLoading}
            className="w-full py-3 text-xs font-semibold hover:opacity-90 transition-opacity"
            style={{background:"#4a7a72", color:"white", letterSpacing:"0.04em"}}
          >
            {pdfLoading === 'full' ? 'Generating your report...' : '↓ DOWNLOAD FULL REPORT'}
          </button>
          <button
            onClick={() => setStep("chart")}
            className="w-full py-3 text-sm font-medium text-center"
            style={{color:"#5c4e40", border:"1px solid #d4c9bb"}}
          >
            View chart
          </button>
        </div>
      </div>
    );
  }

  // ── CHAT STEP ──
  if (step === "chat") {
    const pendingItems = chatMessages
      .filter(m => m.role === "assistant" && m.actionItems)
      .slice(-1)[0]?.actionItems || null;

    const sendMessage = async () => {
      if (!chatInput.trim()) return;
      const userMsg = { role: "user", content: chatInput.trim() };
      const updatedMessages = [...chatMessages, userMsg];
      setChatMessages(updatedMessages);
      setChatInput("");
      setChatLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: `You are Lyme, a warm and focused life coach inside the Lyminal app. You are helping someone build a concrete action plan for a specific goal.

Context:
- Sphere: ${chatContext?.sphereName}
- Goal: ${chatContext?.goalText}

Your job is to gather just enough information to propose 3-5 specific, personalized action items. Ask one focused question at a time. Once you have enough context (usually 2-4 exchanges), propose your action items and ask if they feel right.

When the user confirms the action items are good (they say yes, looks good, sounds right, etc.), end the conversation by outputting EXACTLY this format and nothing else after it:

ACTION_ITEMS_CONFIRMED
\`\`\`json
["action item 1", "action item 2", "action item 3"]
\`\`\`
CLOSING: [one warm sentence acknowledging their commitment]

Do not ask follow-up questions after proposing action items unless the user wants to change something. Keep the whole conversation under 6 exchanges.`,
            messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
          })
        });
        const data = await res.json();
        const reply = data.content?.find(b => b.type === "text")?.text || "I'm here — tell me more.";

        if (reply.includes("ACTION_ITEMS_CONFIRMED")) {
          try {
            const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/);
            const closingMatch = reply.match(/CLOSING: (.+)/);
            const items = jsonMatch ? JSON.parse(jsonMatch[1]) : [];
            const closing = closingMatch ? closingMatch[1] : "Your action items are saved.";
            setChatMessages(prev => [...prev, { role: "assistant", content: closing, actionItems: items.map((t, i) => ({ id: `c${i}`, text: t })) }]);
          } catch {
            setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
          }
        } else {
          setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
        }
      } catch {
        setChatMessages(prev => [...prev, { role: "assistant", content: "Something went wrong on my end. Try again in a moment." }]);
      }
      setChatLoading(false);
    };

    const saveAndFinish = () => {
      if (!pendingItems) return;
      setActiveGoals(prev => prev.map(ag =>
        ag.goalId === chatContext?.goalId
          ? { ...ag, actionItems: pendingItems }
          : ag
      ));
      setStep("active");
    };

    return (
      <div className="min-h-screen flex flex-col" style={{background:"#faf8f5", fontFamily:"'Inter', sans-serif", animation:"fadeIn 0.35s ease-out"}}>
        <style>{FONTS}</style>
        <DevReset />
        {/* Header */}
        <div className="px-6 py-4 flex items-center gap-4 border-b" style={{background:"white", borderColor:"#e8e0d5"}}>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{background: chatContext?.sphereColor}}/>
            <div>
              <p className="text-xs" style={{color:"#6e5c4a"}}>{chatContext?.sphereName}</p>
              <p className="text-sm font-medium" style={{color:"#1c1410"}}>{chatContext?.goalText}</p>
            </div>
          </div>
          <button
            onClick={() => setStep("active")}
            className="text-xs px-4 py-2 font-medium hover:opacity-80 transition-opacity"
            style={{border:"1px solid #d4c9bb", color:"#5c4e40"}}
          >
            Exit conversation
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4" style={{maxHeight:"calc(100vh - 140px)"}}>
          {chatMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div style={{display:"flex", flexDirection:"column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap:"8px", maxWidth:"340px"}}>
                <div
                  className="px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background: m.role === "user" ? "#b5472a" : "white",
                    color: m.role === "user" ? "white" : "#1c1410",
                    border: m.role === "assistant" ? "1px solid #e8e0d5" : "none",
                    borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px"
                  }}
                >
                  {m.content}
                </div>
                {m.actionItems && (
                  <div className="w-full border p-4" style={{borderColor:"#e8e0d5", background:"white", borderRadius:"8px"}}>
                    <p className="text-xs uppercase tracking-wider mb-3" style={{color:"#6e5c4a"}}>Your action items</p>
                    <div className="space-y-2 mb-4">
                      {m.actionItems.map(a => (
                        <div key={a.id} className="flex items-start gap-2 text-sm" style={{color:"#1c1410"}}>
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{background: chatContext?.sphereColor}}/>
                          {a.text}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={saveAndFinish}
                      className="w-full py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
                      style={{background:"#b5472a", color:"white"}}
                    >
                      Save & finish →
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 text-sm" style={{background:"white", border:"1px solid #e8e0d5", borderRadius:"12px 12px 12px 2px", color:"#6e5c4a"}}>
                <span className="animate-pulse">Thinking…</span>
              </div>
            </div>
          )}
        </div>

        {!pendingItems && !chatLoading && chatMessages.length > 0 && (
          <div className="px-6 py-4 border-t flex gap-3" style={{background:"white", borderColor:"#e8e0d5"}}>
            <input
              className="flex-1 px-4 py-3 text-sm outline-none border"
              style={{borderColor:"#e8e0d5", background:"#faf8f5", color:"#1c1410"}}
              placeholder="Type a message…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!chatInput.trim() || chatLoading}
              className="px-5 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-30 transition-opacity"
              style={{background:"#b5472a", color:"white"}}
            >
              Send
            </button>
          </div>
        )}
      </div>
    );
  }

  return <DevReset />;
}
