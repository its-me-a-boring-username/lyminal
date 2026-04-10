import React, { useEffect, useMemo, useState } from "react";
import { Nav } from "./Nav.jsx";
import { saveChart } from "../utils/supabase.js";
import {
  ACTION_TYPES,
  buildForwardBody,
  normalizeActionItems,
} from "../utils/actionItems.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');`;

const TYPE_COLORS = {
  forward: "#8a5a44",
  schedule: "#4a7a72",
  find: "#5c6f9b",
};

function typeLabel(value) {
  return String(value || "find").toLowerCase();
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
  const [selectedGoalId, setSelectedGoalId] = useState(activeGoals[0]?.goalId || null);
  const [activeTypeFilter, setActiveTypeFilter] = useState(null);
  const [newActionText, setNewActionText] = useState("");
  const [newActionType, setNewActionType] = useState("find");
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [forwardRecipient, setForwardRecipient] = useState("");
  const [forwardSubject, setForwardSubject] = useState("Action items from Lyminal");
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
  const [scheduleQueue, setScheduleQueue] = useState([]);

  useEffect(() => {
    if (!selectedGoalId && activeGoals.length > 0) {
      setSelectedGoalId(activeGoals[0].goalId);
      return;
    }
    if (selectedGoalId && !activeGoals.some((g) => g.goalId === selectedGoalId)) {
      setSelectedGoalId(activeGoals[0]?.goalId || null);
    }
  }, [activeGoals, selectedGoalId]);

  const selectedGoal = useMemo(
    () => activeGoals.find((g) => g.goalId === selectedGoalId) || activeGoals[0] || null,
    [activeGoals, selectedGoalId]
  );

  const selectedGoalItems = useMemo(() => normalizeActionItems(selectedGoal?.actionItems || []), [selectedGoal]);
  const filteredItems = useMemo(() => {
    if (!activeTypeFilter) return selectedGoalItems;
    return selectedGoalItems.filter((item) => item.type === activeTypeFilter);
  }, [selectedGoalItems, activeTypeFilter]);

  useEffect(() => {
    setBulkSelected(new Set());
  }, [selectedGoalId, activeTypeFilter]);

  const leftColor = selectedGoal?.sphereColor || "#4a7a72";

  const persistGoals = (updatedGoals, nextChecked = checkedItems) => {
    setActiveGoals(updatedGoals);
    saveChart(session, {
      spheres,
      connections,
      activeGoals: updatedGoals,
      checkedItems: nextChecked,
      completedGoals,
    });
  };

  const patchCurrentGoal = (updater) => {
    if (!selectedGoal) return;
    const updatedGoals = activeGoals.map((goal) => {
      if (goal.goalId !== selectedGoal.goalId) return goal;
      return { ...goal, actionItems: updater(normalizeActionItems(goal.actionItems || [])) };
    });
    persistGoals(updatedGoals);
  };

  const addActionItem = () => {
    const text = newActionText.trim();
    if (!text || !selectedGoal) return;
    patchCurrentGoal((items) => [
      ...items,
      { id: `ai_${Date.now()}`, text, type: ACTION_TYPES.includes(newActionType) ? newActionType : "find" },
    ]);
    setNewActionText("");
  };

  const removeActionItem = (itemId) => {
    if (!selectedGoal) return;
    patchCurrentGoal((items) => items.filter((item) => item.id !== itemId));
    const nextSet = new Set(checkedItems[selectedGoal.goalId] || []);
    nextSet.delete(itemId);
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

  const retagActionItem = (itemId, type) => {
    const safeType = ACTION_TYPES.includes(type) ? type : "find";
    patchCurrentGoal((items) => items.map((item) => (item.id === itemId ? { ...item, type: safeType } : item)));
  };

  const toggleCheck = (itemId) => {
    if (!selectedGoal) return;
    const current = new Set(checkedItems[selectedGoal.goalId] || []);
    if (current.has(itemId)) current.delete(itemId);
    else current.add(itemId);
    const nextChecked = { ...checkedItems, [selectedGoal.goalId]: current };
    setCheckedItems(nextChecked);
    saveChart(session, {
      spheres,
      connections,
      activeGoals,
      checkedItems: nextChecked,
      completedGoals,
    });
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
    const href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    window.location.href = href;
  };

  const queueSchedule = () => {
    if (selectedBulkItems.length === 0) return;
    const when = scheduleAt || "Unscheduled";
    const entries = selectedBulkItems.map((item, index) => ({
      id: `${item.id}_${Date.now()}_${index}`,
      text: item.text,
      when,
      note: scheduleNote.trim(),
    }));
    setScheduleQueue((prev) => [...prev, ...entries]);
  };

  if (!isPaid) {
    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
        <style>{FONTS}</style>
        <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "#4a7a72" }} />
        <div className="w-full lg:flex-1 lg:flex lg:flex-col">
          {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
          <div className="px-6 py-12 max-w-2xl mx-auto w-full lg:px-16 pb-24 lg:pb-12">
            {isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
            <p style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7455", marginBottom: "10px" }}>Plan</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", color: "#1c1410", margin: "0 0 10px" }}>Planning tools are locked</h2>
            <p style={{ fontSize: "14px", color: "#5c4e40", margin: "0 0 20px", lineHeight: 1.6 }}>
              Upgrade to access the Plan tab and use forward, schedule, and find workbenches.
            </p>
            <button
              onClick={() => setAuthPrompt("upgrade")}
              style={{ background: "#b5472a", border: "none", color: "white", fontWeight: 600, fontSize: "12px", letterSpacing: "0.05em", padding: "11px 22px", cursor: "pointer" }}
            >
              UPGRADE TO UNLOCK PLAN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>
      <div className="hidden lg:block flex-shrink-0 transition-colors duration-300" style={{ width: "350px", background: leftColor }} />

      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

        <div className="px-6 py-8 max-w-4xl mx-auto w-full lg:px-14 pb-24 lg:pb-12">
          {isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

          <p style={{ fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7455", marginBottom: "8px" }}>Plan</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#1c1410", margin: "0 0 6px" }}>Action workbench</h2>
          <p style={{ fontSize: "14px", color: "#5c4e40", margin: "0 0 18px" }}>
            Filter by action type, then handle items one by one or in bulk.
          </p>

          {activeGoals.length === 0 ? (
            <div style={{ border: "1px solid #e8e0d5", background: "white", padding: "22px" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", color: "#1c1410", fontSize: "1.15rem", margin: "0 0 8px" }}>No goals yet</p>
              <p style={{ color: "#6e5c4a", fontSize: "13px", margin: "0 0 16px" }}>Add a goal first, then come back to plan and bulk action your items.</p>
              <button onClick={() => setStep("goal-picker")} style={{ border: "1px solid #d4c9bb", background: "none", color: "#5c4e40", padding: "9px 16px", fontSize: "12px", cursor: "pointer" }}>
                ADD GOAL
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "12px" }}>
                {activeGoals.map((goal) => (
                  <button
                    key={goal.goalId}
                    onClick={() => setSelectedGoalId(goal.goalId)}
                    style={{
                      border: goal.goalId === selectedGoal?.goalId ? `1px solid ${goal.sphereColor}` : "1px solid #e8e0d5",
                      background: goal.goalId === selectedGoal?.goalId ? `${goal.sphereColor}12` : "white",
                      color: "#1c1410",
                      padding: "8px 12px",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {goal.sphereName}: {goal.goalText}
                  </button>
                ))}
              </div>

              {selectedGoal && (
                <div style={{ border: "1px solid #dbe4e8", background: "#edf4f7", padding: "16px 20px", marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: selectedGoal.sphereColor }}>{selectedGoal.sphereName}</p>
                  <p style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#1c1410", fontSize: "1.7rem", lineHeight: 1.25 }}>{selectedGoal.goalText}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                {ACTION_TYPES.map((type) => {
                  const active = activeTypeFilter === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveTypeFilter(active ? null : type)}
                      style={{
                        border: active ? "none" : `1px solid ${TYPE_COLORS[type]}55`,
                        background: active ? TYPE_COLORS[type] : "white",
                        color: active ? "white" : TYPE_COLORS[type],
                        padding: "9px 14px",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontWeight: 600,
                      }}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>

              {(activeTypeFilter === "forward" || activeTypeFilter === "schedule") && (
                <div style={{ border: "1px solid #e8e0d5", background: "white", padding: "14px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <button onClick={selectAllVisible} style={{ border: "1px solid #d4c9bb", background: "none", fontSize: "12px", padding: "7px 11px" }}>Select all shown</button>
                    <button onClick={clearBulk} style={{ border: "1px solid #d4c9bb", background: "none", fontSize: "12px", padding: "7px 11px" }}>Clear</button>
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

              <div style={{ border: "1px solid #e8e0d5", background: "white", padding: "14px" }}>
                {filteredItems.length === 0 ? (
                  <p style={{ margin: 0, color: "#8a7455", fontSize: "13px", fontStyle: "italic" }}>
                    No action items in this view yet.
                  </p>
                ) : (
                  filteredItems.map((item) => {
                    const checked = selectedGoal ? (checkedItems[selectedGoal.goalId]?.has(item.id) || false) : false;
                    return (
                      <div key={item.id} style={{ display: "grid", gridTemplateColumns: "22px 1fr auto auto auto", gap: "8px", alignItems: "center", borderBottom: "1px solid #f0ebe3", padding: "9px 0" }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCheck(item.id)} />
                        <span style={{ fontSize: "13px", color: checked ? "#8a7455" : "#2a2018", textDecoration: checked ? "line-through" : "none" }}>{item.text}</span>
                        <select value={item.type} onChange={(e) => retagActionItem(item.id, e.target.value)} style={{ border: "1px solid #d4c9bb", fontSize: "11px", padding: "5px 7px", textTransform: "capitalize" }}>
                          {ACTION_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        {item.type === "find" ? (
                          <a href={`https://www.google.com/search?q=${encodeURIComponent(item.text)}`} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#5c6f9b" }}>Find</a>
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

              <div style={{ border: "1px solid #e8e0d5", background: "white", marginTop: "14px", padding: "12px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#8a7455" }}>Add action item</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 92px", gap: "8px" }}>
                  <input value={newActionText} onChange={(e) => setNewActionText(e.target.value)} placeholder="Write the next action..." style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px" }} />
                  <select value={newActionType} onChange={(e) => setNewActionType(typeLabel(e.target.value))} style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px", textTransform: "capitalize" }}>
                    {ACTION_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <button onClick={addActionItem} style={{ border: "none", background: "#b5472a", color: "white", fontWeight: 600, fontSize: "12px" }}>Add</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
