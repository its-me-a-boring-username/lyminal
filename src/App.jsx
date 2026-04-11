import React, { useState, useMemo, useEffect } from "react";
import { useChatState } from "./hooks/useChatState.js";
import { supabase } from "./supabaseClient.js";
import { MagicLinkAuth } from "./components/MagicLinkAuth.jsx";
import { Nav } from "./components/Nav.jsx";
import { ChartView } from "./components/ChartView.jsx";
import { ActiveScreen } from "./components/ActiveScreen.jsx";
import { IntroScreens } from "./components/IntroScreens.jsx";
import { FlowScreens } from "./components/FlowScreens.jsx";
import { ResultsFlow } from "./components/ResultsFlow.jsx";
import { ChatScreen } from "./components/ChatScreen.jsx";
import { ProgressScreen } from "./components/ProgressScreen.jsx";
import { GoalPicker } from "./components/GoalPicker.jsx";
import { PlanScreen } from "./components/PlanScreen.jsx";
import { DevReset } from "./components/DevReset.jsx";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { AccountScreen } from "./components/AccountScreen.jsx";
import { normalizeActionItems } from "./utils/actionItems.js";
import { generateChartReport, generateFullReport } from "./utils/pdf.js";
import { saveChart, loadChart, clearChart } from "./utils/supabase.js";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("Lyminal error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:"40px", fontFamily:"sans-serif", color:"#b5472a"}}>
          <h2>Something went wrong.</h2>
          <pre style={{fontSize:"12px", color:"#555"}}>{this.state.error?.message}</pre>
          <button onClick={() => this.setState({ hasError: false, error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function GoalChart() {
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [session, setSession] = useState(null);
  const [tier, setTier] = useState("free"); // "free" | "paid_1" | "paid_2"
  const isPaid = tier !== "free";
  const isPro = tier === "paid_2";
  const [authPrompt, setAuthPrompt] = useState(null); // "save_chart" | "save_plan" | "upgrade" | null
  const [hasSeenChartPrompt, setHasSeenChartPrompt] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("warm_earth");
  const [appearance, setAppearance] = useState("system");
  const [hasSeenPlanPrompt, setHasSeenPlanPrompt] = useState(false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Auth session listener + tier fetch
  useEffect(() => {
    const fetchTier = async (session) => {
      if (!session) { setTier("free"); return; }
      setTier("paid_2"); // hardcoded until Stripe is live — all logged-in users get full access
      /* Production tier check — uncomment before launch:
      const { data } = await supabase.from('profiles').select('tier').eq('id', session.user.id).single();
      const t = data?.tier;
      setTier(t === 'paid_2' || t === 'paid_1' ? t : 'free');
      */
    };

    const applySupabaseData = async (session) => {
      const data = await loadChart(session);
      if (data) {
        setSpheres(data.spheres);
        setConnections(data.connections);
        setActiveGoals(data.activeGoals);
        setCheckedItems(data.checkedItems);
        setCompletedGoals(data.completedGoals);
        if (data.activeGoals.length > 0) setStep('active');
      }
    };

    // getSession handles the initial load — sets session, tier, and loads from Supabase if needed
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchTier(session);
      applySupabaseData(session);
    });

    // onAuthStateChange handles subsequent changes (sign in, sign out, token refresh)
    // Skip INITIAL_SESSION — already handled by getSession above
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      setSession(session);
      fetchTier(session);
      if (event === 'SIGNED_IN') applySupabaseData(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-dismiss auth overlay when session is established
  useEffect(() => {
    if (session && authPrompt) setAuthPrompt(null);
  }, [session, authPrompt]);

  // Auth overlay — position:fixed, renders on top of any step
  const AuthOverlay = () => authPrompt ? (
    <MagicLinkAuth
      context={authPrompt}
      isLoggedIn={!!session}
      onSkip={() => setAuthPrompt(null)}
      onSuccess={() => {}}
      leftOffset={!isMobile && (authPrompt === "save_plan" || authPrompt === "upgrade") ? 350 : 0}
    />
  ) : null;

  // Nav bar — shown on home screen and beyond
  const navSteps = ["active", "plan", "progress", "chart-view", "account", "chat", "goal-picker"];
  const showNav = navSteps.includes(step);
  const NavBar = () => showNav ? (
    <Nav
      step={step}
      setStep={setStep}
      isMobile={isMobile}
      isPaid={isPaid}
      activeGoals={activeGoals}
    />
  ) : null;

  // Post-chart flow state
  const [activeGoals, setActiveGoals] = useState([]); // [{sphereId, sphereName, sphereColor, goalId, goalText, actionItems}]
  const [focusRound, setFocusRound] = useState(0);    // 0, 1, 2
  const [overrideSphere, setOverrideSphere] = useState(false);
  const [selectedFocusSphereId, setSelectedFocusSphereId] = useState(null);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const { chatMessages, setChatMessages, chatInput, setChatInput, chatLoading, setChatLoading, chatContext, setChatContext, messagesEndRef } = useChatState();
  const [newActionItem, setNewActionItem] = useState("");
  const [newActionType, setNewActionType] = useState("find");
  const [editingAction, setEditingAction] = useState(null); // {goalId, itemId, text}
  const [pdfLoading, setPdfLoading] = useState(null); // 'chart' | 'full' | null
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
        if (s.activeGoals) {
          const normalizedGoals = s.activeGoals.map((goal) => ({
            ...goal,
            actionItems: normalizeActionItems(goal.actionItems || []),
          }));
          setActiveGoals(normalizedGoals);
        }
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
      const state = { spheres, connections, activeGoals, step, completedGoals: [...completedGoals], checkedItems: serializedChecked };
      localStorage.setItem("goalchart_state", JSON.stringify(state));
    }
  }, [spheres, connections, activeGoals, step, completedGoals, checkedItems]);

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

  const BoundDevReset = () => <DevReset session={session} />;

  if (step === "welcome") return <WelcomeScreen setStep={setStep} DevReset={BoundDevReset} setAuthPrompt={setAuthPrompt} />;

  // ── INTRO SCREENS ──
  if (["intro-spheres","intro-goals","intro-connections","intro-results","intro-active"].includes(step)) {
    return (
      <>
        <IntroScreens
          screen={step}
          setStep={setStep}
          spheres={spheres}
          setGoalStep={setGoalStep}
          setFocusRound={setFocusRound}
          setOverrideSphere={setOverrideSphere}
          setSelectedFocusSphereId={setSelectedFocusSphereId}
          setSelectedGoalId={setSelectedGoalId}
          DevReset={BoundDevReset}
        />
      </>
    );
  }

  // ── FLOW SCREENS (spheres / goals / connections) ──
  if (["spheres","goals","connections"].includes(step)) {
    return (
      <FlowScreens
        step={step}
        spheres={spheres} setSpheres={setSpheres}
        newSphere={newSphere} setNewSphere={setNewSphere}
        newGoal={newGoal} setNewGoal={setNewGoal}
        goalStep={goalStep} setGoalStep={setGoalStep}
        connections={connections} setConnections={setConnections}
        setSelectedId={setSelectedId}
        setStep={setStep}
        session={session}
        DevReset={BoundDevReset}
      />
    );
  }

  // ── RESULTS FLOW (results / focus / action) ──
  if (["results","focus","action"].includes(step)) {
    return (
      <>
        <ResultsFlow
          step={step}
          spheres={spheres}
          connections={connections}
          ranked={ranked}
          selectedFocusSphereId={selectedFocusSphereId}
          setSelectedFocusSphereId={setSelectedFocusSphereId}
          selectedGoalId={selectedGoalId}
          setSelectedGoalId={setSelectedGoalId}
          focusRound={focusRound}
          completedGoals={completedGoals}
          setActiveGoals={setActiveGoals}
          setStep={setStep}
          session={session}
          DevReset={BoundDevReset}
        />
      </>
    );
  }

  // ── CHART ──
  if (step === "chart" || step === "chart-view") {
    if (step === "chart" && !session && !hasSeenChartPrompt && authPrompt !== "save_chart") {
      setTimeout(() => { setAuthPrompt("save_chart"); setHasSeenChartPrompt(true); }, 6000);
    }
    return (
      <>
        <AuthOverlay />
        <BoundDevReset />
        <ChartView
          mode={step}
          spheres={spheres}
          connections={connections}
          counts={counts}
          ranked={ranked}
          positions={positions}
          dragOffsets={dragOffsets} setDragOffsets={setDragOffsets}
          dragging={dragging} setDragging={setDragging}
          didDrag={didDrag} setDidDrag={setDidDrag}
          selectedId={selectedId} setSelectedId={setSelectedId}
          isMobile={isMobile}
          pdfLoading={pdfLoading} setPdfLoading={setPdfLoading}
          activeGoals={activeGoals}
          session={session}
          setStep={setStep}
          setFocusRound={setFocusRound}
          setOverrideSphere={setOverrideSphere}
          setSelectedFocusSphereId={setSelectedFocusSphereId}
          setSelectedGoalId={setSelectedGoalId}
          setSpheres={setSpheres}
          setConnections={setConnections}
          setGoalStep={setGoalStep}
          setActiveGoals={setActiveGoals}
          generateChartReport={generateChartReport}
        />
      </>
    );
  }

  if (step === "active") {
    return (
      <>
        <AuthOverlay />
        <BoundDevReset />
        <ActiveScreen
          focusRound={focusRound}
          activeGoals={activeGoals}
          setActiveGoals={setActiveGoals}
          checkedItems={checkedItems}
          setCheckedItems={setCheckedItems}
          completedGoals={completedGoals}
          setCompletedGoals={setCompletedGoals}
          editingAction={editingAction}
          setEditingAction={setEditingAction}
          newActionItem={newActionItem}
          setNewActionItem={setNewActionItem}
          newActionType={newActionType}
          setNewActionType={setNewActionType}
          isPaid={isPaid}
          session={session}
          pdfLoading={pdfLoading}
          setPdfLoading={setPdfLoading}
          spheres={spheres}
          connections={connections}
          counts={counts}
          ranked={ranked}
          generateFullReport={generateFullReport}
          setStep={setStep}
          setSelectedFocusSphereId={setSelectedFocusSphereId}
          setSelectedGoalId={setSelectedGoalId}
          setAuthPrompt={setAuthPrompt}
          setChatContext={setChatContext}
          setChatMessages={setChatMessages}
          setChatLoading={setChatLoading}
          isMobile={isMobile}
        />
      </>
    );
  }

  // ── ACCOUNT STEP ──
  if (step === "account") return <AccountScreen session={session} tier={tier} isPaid={isPaid} setAuthPrompt={setAuthPrompt} selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme} appearance={appearance} setAppearance={setAppearance} isMobile={isMobile} NavBar={NavBar} AuthOverlay={AuthOverlay} />;

  // ── PROGRESS STEP ──
  if (step === "progress") {
    return (
      <>
        <AuthOverlay />
        <BoundDevReset />
        <ProgressScreen
          spheres={spheres}
          activeGoals={activeGoals} setActiveGoals={setActiveGoals}
          checkedItems={checkedItems} setCheckedItems={setCheckedItems}
          completedGoals={completedGoals} setCompletedGoals={setCompletedGoals}
          connections={connections}
          isMobile={isMobile}
          isPaid={isPaid}
          setStep={setStep}
          session={session}
          setSelectedFocusSphereId={setSelectedFocusSphereId}
          setSelectedGoalId={setSelectedGoalId}
          setAuthPrompt={setAuthPrompt}
          setChatContext={setChatContext}
          setChatMessages={setChatMessages}
          setChatLoading={setChatLoading}
        />
      </>
    );
  }

  // ── GOAL PICKER STEP ──
  if (step === "goal-picker") {
    return (
      <>
        <AuthOverlay />
        <BoundDevReset />
        <GoalPicker
          spheres={spheres}
          activeGoals={activeGoals} setActiveGoals={setActiveGoals}
          completedGoals={completedGoals}
          connections={connections}
          checkedItems={checkedItems}
          session={session}
          setStep={setStep}
          setFocusRound={setFocusRound}
          setAuthPrompt={setAuthPrompt}
          isMobile={isMobile}
          isPaid={isPaid}
        />
      </>
    );
  }

  // ── PLAN STEP ──
  if (step === "plan") {
    return (
      <>
        <AuthOverlay />
        <BoundDevReset />
        <PlanScreen
          activeGoals={activeGoals}
          setActiveGoals={setActiveGoals}
          checkedItems={checkedItems} setCheckedItems={setCheckedItems}
          completedGoals={completedGoals} setCompletedGoals={setCompletedGoals}
          spheres={spheres} connections={connections}
          session={session}
          isMobile={isMobile} isPaid={isPaid} isPro={isPro}
          setStep={setStep}
          setAuthPrompt={setAuthPrompt}
        />
      </>
    );
  }

  if (step === "chat") {
    return (
      <>
        <AuthOverlay />
        <ChatScreen
          chatMessages={chatMessages}
          setChatMessages={setChatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          chatLoading={chatLoading}
          setChatLoading={setChatLoading}
          chatContext={chatContext}
          session={session}
          hasSeenPlanPrompt={hasSeenPlanPrompt}
          setHasSeenPlanPrompt={setHasSeenPlanPrompt}
          setAuthPrompt={setAuthPrompt}
          setActiveGoals={setActiveGoals}
          setStep={setStep}
          isMobile={isMobile}
          isPaid={isPaid}
          activeGoals={activeGoals}
          spheres={spheres}
          connections={connections}
          messagesEndRef={messagesEndRef}
          DevReset={BoundDevReset}
        />
      </>
    );
  }

  return <><BoundDevReset /></>;
}

export default function GoalChartWrapper() {
  return <ErrorBoundary><GoalChart /></ErrorBoundary>;
}
