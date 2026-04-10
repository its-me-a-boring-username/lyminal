import React, { useEffect, useMemo, useRef, useState } from "react";
import { Nav } from "./Nav.jsx";
import { saveChart } from "../utils/supabase.js";
import { ACTION_TYPES, buildForwardBody, normalizeActionItems } from "../utils/actionItems.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;

const SLOT = 160;
const TYPE_META = {
  forward: { color: "#8a5a44", example: "Send to EA or teammate" },
  schedule: { color: "#4a7a72", example: "Set a reminder or calendar block" },
  find: { color: "#5c6f9b", example: "Research or source options" },
};

function ArcCircle({ cx, cy, r, pct, color, sw }) {
  if (pct >= 100) return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} />;
  if (pct <= 0) return null;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeDasharray={circ.toFixed(1)}
      strokeDashoffset={offset.toFixed(1)}
      strokeLinecap="round"
      transform={`rotate(-90 ${cx} ${cy})`}
    />
  );
}

function GoalSlot({ goal, pct, isActive, dist, onClick }) {
  const size = isActive ? 110 : dist === 1 ? 84 : 64;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 7;
  const sw = isActive ? 8 : 5;
  const opacity = isActive ? 1 : dist === 1 ? 0.56 : 0.3;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "9px",
        cursor: "pointer",
        flexShrink: 0,
        width: `${SLOT}px`,
        opacity,
        transition: "opacity 0.25s",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8e0d5" strokeWidth={sw} />
        <ArcCircle cx={cx} cy={cy} r={r} pct={pct} color={goal.sphereColor} sw={sw} />
        <text x={cx} y={cy + 5} textAnchor="middle" fontFamily="Playfair Display, serif" fontSize={isActive ? 16 : 12} fontWeight="600" fill={goal.sphereColor}>
          {pct}%
        </text>
      </svg>
      <span
        style={{
          fontSize: "10px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: isActive ? goal.sphereColor : "#8a7455",
          maxWidth: "120px",
          textAlign: "center",
          lineHeight: 1.3,
          fontWeight: isActive ? 600 : 400,
        }}
      >
        {goal.sphereName}
      </span>
    </div>
  );
}

export function PlanScreen({
  activeGoals,
  setActiveGoals,
  checkedItems,
  setCheckedItems,
  completedGoals,
  spheres,
  connections,
  session,
  isMobile,
  isPaid,
  setStep,
  setAuthPrompt,
}) {
  const initialIndex = Math.max(0, activeGoals.findIndex((g) => !completedGoals.has(g.goalId)));
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [activeTypeFilter, setActiveTypeFilter] = useState(null);
  const [newActionText, setNewActionText] = useState("");
  const [newActionType, setNewActionType] = useState("find");
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [forwardRecipient, setForwardRecipient] = useState("");
  const [forwardSubject, setForwardSubject] = useState("Action items from Lyminal");
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [scheduleQueue, setScheduleQueue] = useState([]);

  const wrapRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    if (selectedIndex > activeGoals.length - 1) {
      setSelectedIndex(Math.max(0, activeGoals.length - 1));
    }
  }, [activeGoals.length, selectedIndex]);

  const selectedGoal = activeGoals[selectedIndex] || null;
  const headerColor = selectedGoal?.sphereColor || "#4a7a72";

  const getTranslate = () => {
    if (!wrapRef.current) return 0;
    const w = wrapRef.current.clientWidth;
    return w / 2 - selectedIndex * SLOT - SLOT / 2;
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
    if (!trackRef.current) return;
    trackRef.current.style.transform = `translateX(${getTranslate()}px)`;
  }, [selectedIndex, activeGoals.length]);

  useEffect(() => {
    const onResize = () => {
      if (trackRef.current) trackRef.current.style.transform = `translateX(${getTranslate()}px)`;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [selectedIndex, activeGoals.length]);

  const selectedGoalItems = useMemo(
    () => normalizeActionItems(selectedGoal?.actionItems || []),
    [selectedGoal]
  );

  const filteredItems = useMemo(() => {
    if (!activeTypeFilter) return selectedGoalItems;
    return selectedGoalItems.filter((item) => item.type === activeTypeFilter);
  }, [selectedGoalItems, activeTypeFilter]);

  useEffect(() => setBulkSelected(new Set()), [selectedIndex, activeTypeFilter]);

  const persist = (updatedGoals, nextChecked = checkedItems) => {
    setActiveGoals(updatedGoals);
    saveChart(session, {
      spheres,
      connections,
      activeGoals: updatedGoals,
      checkedItems: nextChecked,
      completedGoals,
    });
  };

  const updateSelectedGoal = (updater) => {
    if (!selectedGoal) return activeGoals;
    return activeGoals.map((goal) => {
      if (goal.goalId !== selectedGoal.goalId) return goal;
      return { ...goal, actionItems: updater(normalizeActionItems(goal.actionItems || [])) };
    });
  };

  const addActionItem = () => {
    if (!selectedGoal) return;
    const text = newActionText.trim();
    if (!text) return;
    const type = ACTION_TYPES.includes(newActionType) ? newActionType : "find";
    const updated = updateSelectedGoal((items) => [...items, { id: `ai_${Date.now()}`, text, type }]);
    persist(updated);
    setNewActionText("");
  };

  const removeActionItem = (itemId) => {
    if (!selectedGoal) return;
    const updated = updateSelectedGoal((items) => items.filter((item) => item.id !== itemId));
    const nextSet = new Set(checkedItems[selectedGoal.goalId] || []);
    nextSet.delete(itemId);
    const nextChecked = { ...checkedItems, [selectedGoal.goalId]: nextSet };
    setCheckedItems(nextChecked);
    persist(updated, nextChecked);
  };

  const retagActionItem = (itemId, type) => {
    const nextType = ACTION_TYPES.includes(type) ? type : "find";
    const updated = updateSelectedGoal((items) =>
      items.map((item) => (item.id === itemId ? { ...item, type: nextType } : item))
    );
    persist(updated);
  };

  const toggleCheck = (itemId) => {
    if (!selectedGoal) return;
    const nextSet = new Set(checkedItems[selectedGoal.goalId] || []);
    if (nextSet.has(itemId)) nextSet.delete(itemId);
    else nextSet.add(itemId);
    const nextChecked = { ...checkedItems, [selectedGoal.goalId]: nextSet };
    setCheckedItems(nextChecked);
    saveChart(session, {
      spheres,
      connections,
      activeGoals,
      checkedItems: nextChecked,
      completedGoals,
    });
  };

  const goalPct = (goal) => {
    if (!goal) return 0;
    if (completedGoals.has(goal.goalId)) return 100;
    const total = normalizeActionItems(goal.actionItems || []).length;
    if (total === 0) return 0;
    const done = checkedItems[goal.goalId]?.size || 0;
    return Math.round((done / total) * 100);
  };

  const toggleBulkPick = (itemId) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const selectedBulkItems = filteredItems.filter((item) => bulkSelected.has(item.id));
  const selectAllVisible = () => setBulkSelected(new Set(filteredItems.map((item) => item.id)));
  const clearBulk = () => setBulkSelected(new Set());

  const runBulkForward = () => {
    if (selectedBulkItems.length === 0) return;
    const recipient = forwardRecipient.trim();
    const subject = encodeURIComponent(forwardSubject.trim() || "Action items from Lyminal");
    const body = encodeURIComponent(buildForwardBody(selectedBulkItems));
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  };

  const queueSchedule = () => {
    if (selectedBulkItems.length === 0) return;
    const when = scheduleAt || "Unscheduled";
    const queued = selectedBulkItems.map((item, index) => ({
      id: `${item.id}_${Date.now()}_${index}`,
      text: item.text,
      when,
      note: scheduleNote.trim(),
    }));
    setScheduleQueue((prev) => [...prev, ...queued]);
  };

  if (!isPaid) {
    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
        <style>{FONTS}</style>
        <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "#4a7a72" }} />
        <div className="w-full lg:flex-1 lg:flex lg:flex-col">
          {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
          {isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
          <div className="px-6 py-12 max-w-2xl mx-auto w-full lg:px-16 pb-24 lg:pb-12">
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 4px" }}>Plan</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 10px" }}>
              Planning tools are locked
            </h2>
            <p style={{ fontSize: "14px", color: "#5c4e40", margin: "0 0 20px" }}>
              Upgrade to unlock forward, schedule, and find workbenches.
            </p>
            <button onClick={() => setAuthPrompt("upgrade")} style={{ background: "#b5472a", color: "white", border: "none", padding: "10px 18px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em" }}>
              UPGRADE TO UNLOCK PLAN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.2s ease-out" }}>
      <style>{FONTS}</style>
      <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: headerColor, transition: "background 0.35s ease" }} />
      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
        {isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

        <div className="w-full pb-24 lg:pb-12">
          <div
            style={{
              background: `${headerColor}28`,
              borderBottom: `2px solid ${headerColor}60`,
              padding: "24px 24px 20px",
              transition: "background 0.35s ease, border-color 0.35s ease",
            }}
          >
            <div className="max-w-2xl mx-auto lg:px-16">
              <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 4px" }}>Plan</p>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 6px" }}>Action workbench</h2>
              <p style={{ fontSize: "13px", color: "#5c4e40", margin: 0 }}>
                Filter by action type, then handle items one by one or in bulk.
              </p>
            </div>
          </div>

          {activeGoals.length === 0 ? (
            <div className="px-6 lg:px-16 max-w-2xl mx-auto" style={{ paddingTop: "22px" }}>
              <div style={{ border: "1px solid #e8e0d5", background: "white", padding: "22px" }}>
                <p style={{ fontFamily: "'Playfair Display', serif", color: "#1c1410", fontSize: "1.1rem", margin: "0 0 8px" }}>No goals yet</p>
                <p style={{ color: "#6e5c4a", fontSize: "13px", margin: "0 0 16px" }}>Add a goal and Lyme action items to use planning tools.</p>
                <button onClick={() => setStep("goal-picker")} style={{ border: "1px solid #d4c9bb", background: "none", color: "#5c4e40", padding: "9px 16px", fontSize: "12px" }}>
                  ADD GOAL
                </button>
              </div>
            </div>
          ) : (
            <>
              <div ref={wrapRef} style={{ overflow: "hidden", position: "relative", padding: "28px 0 22px" }}>
                <div ref={trackRef} style={{ display: "flex", alignItems: "center", willChange: "transform" }}>
                  {activeGoals.map((goal, index) => (
                    <GoalSlot
                      key={goal.goalId}
                      goal={goal}
                      pct={goalPct(goal)}
                      isActive={index === selectedIndex}
                      dist={Math.abs(index - selectedIndex)}
                      onClick={() => setSelectedIndex(index)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ height: "1px", background: "#e8e0d5" }} />

              {selectedGoal && (
                <div className="px-6 lg:px-16 max-w-2xl mx-auto" style={{ paddingTop: "20px" }}>
                  <div style={{ border: "1px solid #dbe4e8", background: "#edf4f7", padding: "15px 18px", marginBottom: "12px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: selectedGoal.sphereColor }}>{selectedGoal.sphereName}</p>
                    <p style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#1c1410", fontSize: "1.12rem", lineHeight: 1.4 }}>{selectedGoal.goalText}</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "8px", marginBottom: "12px" }}>
                    {ACTION_TYPES.map((type) => {
                      const active = activeTypeFilter === type;
                      const meta = TYPE_META[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setActiveTypeFilter(active ? null : type)}
                          style={{
                            border: active ? "none" : `1px solid ${meta.color}55`,
                            background: active ? meta.color : "white",
                            color: active ? "white" : meta.color,
                            textAlign: "left",
                            padding: "8px 10px",
                          }}
                        >
                          <div style={{ fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>{type}</div>
                          <div style={{ fontSize: "10px", opacity: active ? 0.9 : 0.72, marginTop: "2px" }}>{meta.example}</div>
                        </button>
                      );
                    })}
                  </div>

                  {(activeTypeFilter === "forward" || activeTypeFilter === "schedule") && (
                    <div style={{ border: "1px solid #e8e0d5", background: "white", padding: "12px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                        <button onClick={selectAllVisible} style={{ border: "1px solid #d4c9bb", background: "none", fontSize: "12px", padding: "6px 10px" }}>Select all shown</button>
                        <button onClick={clearBulk} style={{ border: "1px solid #d4c9bb", background: "none", fontSize: "12px", padding: "6px 10px" }}>Clear</button>
                        <span style={{ fontSize: "12px", color: "#6e5c4a", alignSelf: "center" }}>{selectedBulkItems.length} selected</span>
                      </div>

                      {activeTypeFilter === "forward" && (
                        <div style={{ display: "grid", gap: "8px" }}>
                          <input value={forwardRecipient} onChange={(e) => setForwardRecipient(e.target.value)} placeholder="Recipient email (optional)" style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px" }} />
                          <input value={forwardSubject} onChange={(e) => setForwardSubject(e.target.value)} placeholder="Subject" style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px" }} />
                          <button onClick={runBulkForward} disabled={selectedBulkItems.length === 0} style={{ border: "none", background: selectedBulkItems.length ? "#b5472a" : "#d4c9bb", color: "white", fontSize: "12px", fontWeight: 600, padding: "9px 12px", textAlign: "left" }}>
                            Forward selected as one message
                          </button>
                        </div>
                      )}

                      {activeTypeFilter === "schedule" && (
                        <div style={{ display: "grid", gap: "8px" }}>
                          <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px" }} />
                          <input value={scheduleNote} onChange={(e) => setScheduleNote(e.target.value)} placeholder="Schedule note (optional)" style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px" }} />
                          <button onClick={queueSchedule} disabled={selectedBulkItems.length === 0} style={{ border: "none", background: selectedBulkItems.length ? "#4a7a72" : "#d4c9bb", color: "white", fontSize: "12px", fontWeight: 600, padding: "9px 12px", textAlign: "left" }}>
                            Queue selected for scheduling
                          </button>
                          {scheduleQueue.length > 0 && (
                            <div style={{ borderTop: "1px solid #f0ebe3", marginTop: "4px", paddingTop: "8px" }}>
                              {scheduleQueue.map((q, index) => (
                                <p key={q.id} style={{ margin: "0 0 4px", color: "#5c4e40", fontSize: "12px" }}>
                                  {index + 1}. {q.text} ({q.when})
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ border: "1px solid #e8e0d5", background: "white", padding: "12px" }}>
                    {filteredItems.length === 0 ? (
                      <p style={{ margin: 0, color: "#8a7455", fontSize: "13px", fontStyle: "italic" }}>
                        No action items in this view yet.
                      </p>
                    ) : (
                      filteredItems.map((item) => {
                        const checked = checkedItems[selectedGoal.goalId]?.has(item.id) || false;
                        return (
                          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "22px 1fr auto auto auto", gap: "8px", alignItems: "center", borderBottom: "1px solid #f0ebe3", padding: "9px 0" }}>
                            <input type="checkbox" checked={checked} onChange={() => toggleCheck(item.id)} />
                            <span style={{ fontSize: "13px", color: checked ? "#8a7455" : "#2a2018", textDecoration: checked ? "line-through" : "none" }}>
                              {item.text}
                            </span>
                            <select value={item.type} onChange={(e) => retagActionItem(item.id, e.target.value)} style={{ border: "1px solid #d4c9bb", fontSize: "11px", padding: "5px 7px", textTransform: "capitalize" }}>
                              {ACTION_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                            {item.type === "find" ? (
                              <a href={`https://www.google.com/search?q=${encodeURIComponent(item.text)}`} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: TYPE_META.find.color }}>
                                Find
                              </a>
                            ) : (
                              <button onClick={() => toggleBulkPick(item.id)} style={{ border: "1px solid #d4c9bb", background: bulkSelected.has(item.id) ? "#1c1410" : "none", color: bulkSelected.has(item.id) ? "white" : "#5c4e40", fontSize: "11px", padding: "5px 8px" }}>
                                {bulkSelected.has(item.id) ? "Selected" : "Bulk"}
                              </button>
                            )}
                            <button onClick={() => removeActionItem(item.id)} style={{ border: "none", background: "none", color: "#8a7455", fontSize: "14px" }}>x</button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div style={{ border: "1px solid #e8e0d5", background: "white", marginTop: "12px", padding: "12px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a7455" }}>
                      Add action item
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 92px", gap: "8px" }}>
                      <input value={newActionText} onChange={(e) => setNewActionText(e.target.value)} placeholder="Write the next action..." style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px" }} />
                      <select value={newActionType} onChange={(e) => setNewActionType(String(e.target.value || "find"))} style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px", textTransform: "capitalize" }}>
                        {ACTION_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <button onClick={addActionItem} style={{ border: "none", background: "#b5472a", color: "white", fontWeight: 600, fontSize: "12px" }}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
