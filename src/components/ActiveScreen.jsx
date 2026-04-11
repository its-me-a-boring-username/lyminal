import React from "react";
import { Nav } from "./Nav.jsx";
import { saveChart } from "../utils/supabase.js";
import { ACTION_TYPES } from "../utils/actionItems.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(181,71,42,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ActiveScreen({
  focusRound,
  activeGoals, setActiveGoals,
  checkedItems, setCheckedItems,
  completedGoals, setCompletedGoals,
  editingAction, setEditingAction,
  newActionItem, setNewActionItem,
  newActionType, setNewActionType,
  isPaid, session,
  pdfLoading, setPdfLoading,
  spheres, connections, counts, ranked,
  generateFullReport,
  setStep,
  setSelectedFocusSphereId, setSelectedGoalId,
  setAuthPrompt,
  setChatContext, setChatMessages, setChatLoading,
  isMobile,
}) {
  const allActive = focusRound >= 1 ? activeGoals : activeGoals.slice(0, 1);
  const [celebrating, setCelebrating] = React.useState(null);
  const [confirmRemove, setConfirmRemove] = React.useState(null);

  const priorityColor = allActive[0]?.sphereColor || "#b5472a";

  const handleTalkToLyme = async (ag) => {
    setChatContext(ag);
    const introMsg = {
      role: "assistant",
      content: "Hi — I'm Lyme, your AI coach. I am here to help you identify steps you can take to achieve your goals. I'll ask a few questions, then we'll put together a checklist of action items that gets saved to your home screen so you can track your progress.",
    };
    setChatMessages([introMsg]);
    setStep("chat");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are Lyme, a warm and focused life coach inside the Lyminal app. Your job is to help someone build a concrete action plan for a specific goal.

Context:
- Sphere: ${ag.sphereName}
- Goal: ${ag.goalText}

Open the conversation with a single, specific, thoughtful question that gets right to the heart of where this person stands with this goal. Do NOT use a generic opener like "where are you starting from?" — instead, ask something directly relevant to the goal itself. For example, if the goal is "Get a promotion", ask about promotion criteria or manager feedback. If the goal is "Pay down debt", ask which debt they want to tackle first. Make it feel like you already understand the goal and want to understand their situation.

Do NOT introduce yourself or explain what you do — that has already been handled. Just ask your question directly. Keep it concise and warm.`,
          messages: [{ role: "user", content: "Start the conversation." }],
        }),
      });
      const data = await res.json();
      const opener = data.content?.find(b => b.type === "text")?.text || `Let's talk about your goal: ${ag.goalText}. What does your current situation look like?`;
      setChatMessages(prev => [...prev, { role: "assistant", content: opener }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: `Let's talk about your goal: ${ag.goalText}. What does your current situation look like?` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!session) { setAuthPrompt("upgrade"); return; }
    if (!isPaid) { setAuthPrompt("upgrade"); return; }
    setPdfLoading("full");
    try { await generateFullReport(spheres, connections, counts, ranked, activeGoals, checkedItems, completedGoals); }
    catch (e) { console.error(e); alert("Report generation failed. Please try again."); }
    setPdfLoading(null);
  };

  const addActionItem = (goalId, text, type) => {
    const itemType = ACTION_TYPES.includes(type) ? type : "find";
    const item = { id: `m${Date.now()}`, text: text.trim(), type: itemType };
    const updated = activeGoals.map(g =>
      g.goalId === goalId ? { ...g, actionItems: [...g.actionItems, item] } : g
    );
    setActiveGoals(updated);
    saveChart(session, { spheres, connections, activeGoals: updated, checkedItems, completedGoals });
  };

  const removeActionItem = (goalId, itemId) => {
    const updated = activeGoals.map(g =>
      g.goalId === goalId ? { ...g, actionItems: g.actionItems.filter(ai => ai.id !== itemId) } : g
    );
    setActiveGoals(updated);
    const newChecked = { ...checkedItems };
    if (newChecked[goalId]) {
      const set = new Set(newChecked[goalId]);
      set.delete(itemId);
      newChecked[goalId] = set;
    }
    setCheckedItems(newChecked);
    saveChart(session, { spheres, connections, activeGoals: updated, checkedItems: newChecked, completedGoals });
  };

  const saveEditedItem = (goalId, itemId, text) => {
    if (!text.trim()) return;
    const updated = activeGoals.map(g =>
      g.goalId === goalId
        ? { ...g, actionItems: g.actionItems.map(ai => ai.id === itemId ? { ...ai, text: text.trim() } : ai) }
        : g
    );
    setActiveGoals(updated);
    setEditingAction(null);
    saveChart(session, { spheres, connections, activeGoals: updated, checkedItems, completedGoals });
  };

  return (
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.2s ease-out" }}>
      <style>{FONTS}</style>

      {/* Remove goal modal */}
      {confirmRemove && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(28,20,16,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ background: "white", borderRadius: "12px", maxWidth: "400px", width: "100%", padding: "28px 24px" }}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 8px", fontFamily: "'Inter', sans-serif" }}>Remove goal</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c1410", margin: "0 0 10px", lineHeight: 1.4 }}>
              {confirmRemove.goalText}
            </p>
            <p style={{ fontSize: "13px", color: "#6e5c4a", fontWeight: 300, margin: "0 0 24px", lineHeight: 1.5 }}>
              This will remove the goal and all its action items. You can add it again any time from the goal picker.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setConfirmRemove(null)}
                style={{ flex: 1, padding: "10px", fontSize: "13px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", cursor: "pointer", fontFamily: "'Inter', sans-serif", borderRadius: "6px" }}
              >
                Keep it
              </button>
              <button
                onClick={() => {
                  const updated = activeGoals.filter(g => g.goalId !== confirmRemove.goalId);
                  setActiveGoals(updated);
                  saveChart(session, { spheres, connections, activeGoals: updated, checkedItems, completedGoals });
                  setConfirmRemove(null);
                  if (updated.length === 0) setStep("goal-picker");
                }}
                style={{ flex: 1, padding: "10px", fontSize: "13px", fontWeight: 600, color: "white", background: "#9b2a2a", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", borderRadius: "6px" }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Design strip */}
      <div className="hidden lg:block flex-shrink-0 transition-colors duration-300" style={{ width: "350px", background: priorityColor }} />

      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        {!isMobile && <Nav step="active" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

        {/* Page header with sphere tint */}
        <div style={{ background: hexToRgba(priorityColor, 0.07), borderBottom: `1px solid ${hexToRgba(priorityColor, 0.12)}`, padding: "28px 24px 24px", marginBottom: "0" }}
          className="lg:px-16">
          {isMobile && <Nav step="active" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: priorityColor, opacity: 0.8 }}>Your Active Goals</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", marginBottom: "6px" }}>Here's what you're working on</h2>
          <p className="text-sm" style={{ color: "#5c4e40", fontWeight: 300 }}>
            Select a goal to talk through your plan with Lyme, or add action items yourself.
          </p>
        </div>

        <div className="px-6 py-8 max-w-2xl mx-auto w-full lg:px-16 pb-24 lg:pb-12">

          <div className="space-y-4 mb-8">
            {allActive.map((ag) => (
              <div key={ag.sphereId} style={{ borderRadius: "8px", border: `1px solid ${hexToRgba(ag.sphereColor, 0.2)}`, background: "white", overflow: "hidden" }}>

                {/* Card header — pale tint with pill sphere label */}
                <div style={{ background: hexToRgba(ag.sphereColor, 0.07), padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${hexToRgba(ag.sphereColor, 0.12)}` }}>
                  <span style={{
                    fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em",
                    color: ag.sphereColor, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                    background: hexToRgba(ag.sphereColor, 0.12),
                    border: `1px solid ${hexToRgba(ag.sphereColor, 0.22)}`,
                    borderRadius: "999px", padding: "3px 10px",
                  }}>
                    {ag.sphereName}
                  </span>
                  <button
                    onClick={() => setConfirmRemove(ag)}
                    style={{ background: "none", border: "none", color: "#8a7455", cursor: "pointer", fontSize: "13px", padding: 0, lineHeight: 1 }}
                    title="Remove this goal"
                  >
                    ✕
                  </button>
                </div>

                {/* Goal */}
                <div className="px-5 py-4 border-b" style={{ borderColor: "#f0ebe3" }}>
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setCompletedGoals(prev => {
                        const next = new Set(prev);
                        prev.has(ag.goalId) ? next.delete(ag.goalId) : next.add(ag.goalId);
                        return next;
                      })}
                      className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-1 transition-all"
                      style={{ borderRadius: "4px", border: `2px solid ${ag.sphereColor}`, background: completedGoals.has(ag.goalId) ? ag.sphereColor : "white" }}
                    >
                      {completedGoals.has(ag.goalId) && <span className="text-white" style={{ fontSize: "10px", fontWeight: "bold" }}>✓</span>}
                    </button>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: completedGoals.has(ag.goalId) ? "#6e5c4a" : "#1c1410", textDecoration: completedGoals.has(ag.goalId) ? "line-through" : "none" }}>{ag.goalText}</p>
                  </div>
                  {celebrating === ag.goalId ? (
                    <p className="mt-3 ml-8 text-xs font-medium" style={{ color: "#4a7a72" }}>
                      🎉 Well done! Choosing your next goal...
                    </p>
                  ) : completedGoals.has(ag.goalId) && (
                    <button
                      onClick={() => {
                        setCelebrating(ag.goalId);
                        setTimeout(() => {
                          setActiveGoals(prev => prev.filter(g => g.goalId !== ag.goalId));
                          setCelebrating(null);
                          setStep("goal-picker");
                        }, 1500);
                      }}
                      className="mt-3 ml-8 text-xs font-semibold hover:opacity-80 transition-opacity"
                      style={{ color: ag.sphereColor }}
                    >
                      Pick a new goal →
                    </button>
                  )}
                </div>

                {/* Action items */}
                <div className="px-5 py-3 border-b" style={{ borderColor: "#f0ebe3" }}>
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
                              <div className="w-4 h-4 flex items-center justify-center transition-all"
                                style={{ borderRadius: "3px", border: `2px solid ${ag.sphereColor}`, background: checked ? ag.sphereColor : "white" }}>
                                {checked && <span className="text-white" style={{ fontSize: "9px", fontWeight: "bold" }}>✓</span>}
                              </div>
                            </button>
                            {isEditing ? (
                              <input
                                autoFocus
                                className="flex-1 text-xs px-2 py-0.5 outline-none"
                                style={{ border: `1px solid ${ag.sphereColor}`, borderRadius: "4px", color: "#4a3828" }}
                                value={editingAction.text}
                                onChange={e => setEditingAction(prev => ({ ...prev, text: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === "Enter") saveEditedItem(ag.goalId, a.id, editingAction.text);
                                  if (e.key === "Escape") setEditingAction(null);
                                }}
                                onBlur={() => saveEditedItem(ag.goalId, a.id, editingAction.text)}
                              />
                            ) : (
                              <span
                                className="flex-1 text-xs cursor-pointer hover:opacity-70 transition-opacity"
                                style={{ color: checked ? "#6e5c4a" : "#4a3828", textDecoration: checked ? "line-through" : "none" }}
                                onClick={() => setEditingAction({ goalId: ag.goalId, itemId: a.id, text: a.text })}
                                title="Click to edit"
                              >
                                {a.text}
                              </span>
                            )}
                            <button
                              onClick={() => removeActionItem(ag.goalId, a.id)}
                              className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: "#8a7455", fontSize: "11px" }}
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs mb-2" style={{ color: "#6e5c4a" }}>No action items yet. Add your own or talk to Lyme.</p>
                  )}

                  {/* Manual action item input */}
                  <div className="flex items-center gap-2 mt-3">
                    <select
                      value={newActionType}
                      onChange={e => setNewActionType(e.target.value)}
                      className="text-xs outline-none"
                      style={{ border: "1px solid #d4c9bb", borderRadius: "6px", padding: "6px 8px", background: "#faf8f5", color: "#5c4e40", textTransform: "capitalize" }}
                    >
                      <option value="forward">forward</option>
                      <option value="schedule">schedule</option>
                      <option value="find">find</option>
                    </select>
                    <input
                      className="flex-1 text-xs outline-none transition-colors"
                      style={{ border: "1px solid #d4c9bb", borderRadius: "6px", padding: "6px 12px", background: "#faf8f5" }}
                      placeholder="Add an action item..."
                      value={newActionItem}
                      onChange={e => setNewActionItem(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && newActionItem.trim()) {
                          addActionItem(ag.goalId, newActionItem, newActionType);
                          setNewActionItem("");
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (!newActionItem.trim()) return;
                        addActionItem(ag.goalId, newActionItem, newActionType);
                        setNewActionItem("");
                      }}
                      disabled={!newActionItem.trim()}
                      className="text-xs font-semibold transition-all"
                      style={{
                        borderRadius: "6px", padding: "6px 14px",
                        background: newActionItem.trim() ? ag.sphereColor : "transparent",
                        color: newActionItem.trim() ? "white" : "#8a7455",
                        border: newActionItem.trim() ? "none" : "1px solid #d4c9bb",
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* CTAs */}
                <div className="px-5 py-3 flex gap-2">
                  <button
                    onClick={() => handleTalkToLyme(ag)}
                    className="flex-1 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
                    style={{ background: ag.sphereColor, color: "white", letterSpacing: "0.04em", borderRadius: "6px" }}
                  >
                    Talk to Lyme
                  </button>
                  <button
                    className="py-2 px-3 text-xs font-semibold border hover:opacity-80 transition-opacity"
                    style={{ borderColor: "#d4c9bb", color: "#6e5c4a", borderRadius: "6px" }}
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

            {/* Add another goal — paid users under limit */}
            {isPaid && allActive.length < 5 && (
              <button
                onClick={() => setStep("goal-picker")}
                className="w-full text-left transition-all hover:opacity-90"
                style={{ borderRadius: "8px", border: "1px solid #e8e0d5", background: "#faf8f5" }}
              >
                <div className="px-5 py-4 flex items-center gap-3">
                  <span style={{ fontSize: "1rem", color: "#b5472a" }}>+</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "#6e5c4a" }}>Add another goal</p>
                    <p className="text-xs" style={{ color: "#8a7455" }}>Track a goal from a different sphere</p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#b5472a" }}>→</span>
                </div>
              </button>
            )}

            {isPaid && allActive.length >= 5 && (
              <p className="text-xs text-center" style={{ color: "#8a7455", padding: "12px 0" }}>
                You're tracking 5 goals — the maximum. Complete one before adding another.
              </p>
            )}

            {!isPaid && allActive.length >= 1 && (
              <button
                onClick={() => setAuthPrompt("upgrade")}
                className="w-full text-left transition-all hover:opacity-90"
                style={{ borderRadius: "8px", border: "2px dashed #e8e0d5", background: "#faf8f5" }}
              >
                <div className="px-5 py-4 flex items-center gap-3">
                  <span style={{ fontSize: "1rem" }}>🔒</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "#6e5c4a" }}>Track a second goal</p>
                    <p className="text-xs" style={{ color: "#8a7455" }}>Upgrade to track multiple goals at once</p>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "#b5472a" }}>Upgrade →</span>
                </div>
              </button>
            )}
          </div>

          {/* Bottom actions */}
          <div className="flex gap-3 flex-col">
            <button
              onClick={handleDownloadReport}
              disabled={!!pdfLoading}
              className="w-full py-3 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{
                borderRadius: "6px",
                background: isPaid ? "#4a7a72" : "#f0ebe3",
                color: isPaid ? "white" : "#6e5c4a",
                border: isPaid ? "none" : "1px dashed #d4c9bb",
                letterSpacing: "0.04em",
                opacity: pdfLoading ? 0.7 : 1,
              }}
            >
              {!isPaid && <span style={{ fontSize: "0.85rem" }}>🔒</span>}
              {pdfLoading === "full" ? "Generating your report..." : "↓ DOWNLOAD FULL REPORT"}
            </button>
            <button
              onClick={() => setStep("chart-view")}
              className="w-full py-3 text-sm font-medium text-center"
              style={{ color: "#5c4e40", border: "1px solid #d4c9bb", borderRadius: "6px" }}
            >
              View your chart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
