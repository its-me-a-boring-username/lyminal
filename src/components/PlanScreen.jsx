import React, { useState, useEffect } from "react";
import { Nav } from "./Nav.jsx";
import { saveChart } from "../utils/supabase.js";
import { ACTION_TYPES, normalizeActionItems, buildForwardBody } from "../utils/actionItems.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;

const TC     = { forward: "#8a5a44", schedule: "#4a7a72", find: "#5c6f9b" };
const TBG    = { forward: "#f7f0ec", schedule: "#edf4f1", find: "#eef0f6" };
const TBORDER = { forward: "#d4a890", schedule: "#9fd4c4", find: "#b0bcd8" };

// ── Ring sidebar button ──────────────────────────────────────────────────────
function RingButton({ color, isActive, onClick }) {
  const size = isActive ? 38 : 28;
  const sw   = isActive ? 5  : 3;
  const cx = size / 2, cy = size / 2, r = size / 2 - sw / 2 - 1;
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", padding: 0, cursor: "pointer",
      opacity: isActive ? 1 : 0.38, transition: "opacity 0.2s",
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "44px", height: "44px", flexShrink: 0,
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill={color + (isActive ? "28" : "18")} stroke={color} strokeWidth={sw} />
      </svg>
    </button>
  );
}

// ── Forward modal ────────────────────────────────────────────────────────────
function ForwardModal({ items, color, onClose }) {
  const [recipient, setRecipient] = useState("");
  const [subject,   setSubject]   = useState("Action items from Lyminal");
  const [note,      setNote]      = useState("");
  const [sent,      setSent]      = useState(false);

  const handleSend = () => {
    const body = buildForwardBody(items) + (note.trim() ? `\n\nNote: ${note.trim()}` : "");
    window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setSent(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,20,16,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "white", maxWidth: "400px", width: "100%" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #e8e0d5" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7455", margin: "0 0 3px", fontFamily: "'Inter', sans-serif" }}>Forward {items.length} item{items.length > 1 ? "s" : ""}</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", color: "#1c1410", margin: 0 }}>Who should handle these?</p>
        </div>
        {sent ? (
          <div style={{ padding: "24px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#4a7a72", fontWeight: 500, margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>Forwarded ✓</p>
            <p style={{ fontSize: "11px", color: "#8a7455", margin: "0 0 16px", fontFamily: "'Inter', sans-serif" }}>Your email client should have opened.</p>
            <button onClick={onClose} style={{ fontSize: "12px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", padding: "8px 20px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ marginBottom: "12px" }}>
                {items.map(i => (
                  <div key={i.id} style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginBottom: "5px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, marginTop: "5px", flexShrink: 0 }} />
                    <p style={{ fontSize: "12px", color: "#1c1410", margin: 0, lineHeight: 1.4, fontFamily: "'Inter', sans-serif" }}>{i.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Recipient email or phone"
                  style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", width: "100%", boxSizing: "border-box" }} />
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
                  style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", width: "100%", boxSizing: "border-box" }} />
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" rows={2}
                  style={{ border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", resize: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #e8e0d5", display: "flex", gap: "8px" }}>
              <button onClick={onClose} style={{ flex: 1, padding: "9px", fontSize: "12px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
              <button onClick={handleSend} style={{ flex: 2, padding: "9px", fontSize: "12px", fontWeight: 600, color: "white", background: "#b5472a", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Send →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Schedule modal ───────────────────────────────────────────────────────────
function ScheduleModal({ items, color, onClose }) {
  const [date,   setDate]   = useState("");
  const [time,   setTime]   = useState("09:00");
  const [repeat, setRepeat] = useState("once");
  const [saved,  setSaved]  = useState(false);

  const openGCal = () => {
    const text    = items.map(i => i.text).join(", ");
    const details = items.map((i, n) => `${n + 1}. ${i.text}`).join("\n");
    const dt      = date && time ? `${date.replace(/-/g, "")}T${time.replace(":", "")}00` : "";
    const url     = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(text)}&details=${encodeURIComponent(details)}${dt ? `&dates=${dt}/${dt}` : ""}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,20,16,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "white", maxWidth: "400px", width: "100%" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #e8e0d5" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7455", margin: "0 0 3px", fontFamily: "'Inter', sans-serif" }}>Schedule {items.length} item{items.length > 1 ? "s" : ""}</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", color: "#1c1410", margin: 0 }}>When should these happen?</p>
        </div>
        {saved ? (
          <div style={{ padding: "24px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#4a7a72", fontWeight: 500, margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>Reminder set ✓</p>
            <p style={{ fontSize: "11px", color: "#8a7455", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>{date} at {time} · {repeat === "once" ? "One time" : repeat === "daily" ? "Every day" : "Every week"}</p>
            <p style={{ fontSize: "10px", color: "#8a7455", margin: "0 0 16px", fontStyle: "italic", fontFamily: "'Inter', sans-serif" }}>Push notifications coming soon.</p>
            <button onClick={onClose} style={{ fontSize: "12px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", padding: "8px 20px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ marginBottom: "12px" }}>
                {items.map(i => (
                  <div key={i.id} style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginBottom: "5px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, marginTop: "5px", flexShrink: 0 }} />
                    <p style={{ fontSize: "12px", color: "#1c1410", margin: 0, lineHeight: 1.4, fontFamily: "'Inter', sans-serif" }}>{i.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    style={{ flex: 1, border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none" }} />
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    style={{ width: "90px", border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none" }} />
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["once", "daily", "weekly"].map(r => (
                    <button key={r} onClick={() => setRepeat(r)} style={{
                      flex: 1, padding: "6px", fontSize: "11px", cursor: "pointer",
                      fontFamily: "'Inter', sans-serif", fontWeight: repeat === r ? 600 : 400,
                      background: repeat === r ? color : "white",
                      color: repeat === r ? "white" : "#6e5c4a",
                      border: `1px solid ${repeat === r ? color : "#d4c9bb"}`,
                    }}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #e8e0d5", display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={onClose} style={{ flex: 1, padding: "9px", fontSize: "12px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
                <button onClick={() => date && setSaved(true)} disabled={!date}
                  style={{ flex: 2, padding: "9px", fontSize: "12px", fontWeight: 600, color: "white", background: date ? color : "#c4b8a8", border: "none", cursor: date ? "pointer" : "default", fontFamily: "'Inter', sans-serif" }}>
                  Set reminder →
                </button>
              </div>
              <button onClick={openGCal}
                style={{ width: "100%", padding: "9px", fontSize: "12px", fontWeight: 500, color: color, background: "none", border: `1px solid ${color}`, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                Open in Google Calendar instead →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Find / Lyme panel ────────────────────────────────────────────────────────
function FindPanel({ item, goal, onClose }) {
  const [input,    setInput]    = useState(item.text);
  const [loading,  setLoading]  = useState(false);
  const [response, setResponse] = useState(null);

  const ask = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `You are Lyme in search mode inside the Lyminal app. The user needs a direct, practical answer to a research or sourcing question related to their goal.

Sphere: ${goal.sphereName}
Goal: ${goal.goalText}
Action item: ${item.text}

Search the web if needed and give one clear, useful response. Include specific names, links, prices or hours where relevant. Be concise — this is an action app, not a research report. Do not introduce yourself.`,
          messages: [{ role: "user", content: input.trim() }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "I had trouble with that — try rephrasing.";
      setResponse(text);
    } catch {
      setResponse("Something went wrong. Try again in a moment.");
    }
    setLoading(false);
  };

  return (
    <div style={{ borderTop: "1px solid #e8e0d5", background: "#faf8f5" }}>
      <div style={{ display: "flex", gap: "8px", padding: "10px 18px" }}>
        <input autoFocus value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && ask()}
          disabled={loading}
          placeholder={loading ? "Lyme is searching…" : "Ask Lyme to find something…"}
          style={{ flex: 1, border: "1px solid #d4c9bb", padding: "7px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", background: "white", outline: "none", opacity: loading ? 0.6 : 1 }}
        />
        <button onClick={ask} disabled={loading || !input.trim()}
          style={{ padding: "7px 14px", fontSize: "11px", fontWeight: 600, background: "#b5472a", color: "white", border: "none", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "'Inter', sans-serif" }}>
          Ask →
        </button>
      </div>
      {response && (
        <div style={{ padding: "14px 18px", background: "white", borderTop: "1px solid #f0ebe3" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#b5472a", margin: "0 0 8px", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Lyme</p>
          <p style={{ fontSize: "13px", color: "#1c1410", margin: "0 0 12px", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "'Inter', sans-serif" }}>{response}</p>
          <button onClick={onClose} style={{ fontSize: "11px", fontWeight: 600, color: "#b5472a", background: "none", border: "1px solid #b5472a", padding: "6px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            Done →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function PlanScreen({
  activeGoals, setActiveGoals,
  checkedItems, setCheckedItems,
  completedGoals, setCompletedGoals,
  spheres, connections,
  session,
  isMobile, isPaid, isPro,
  setStep, setAuthPrompt,
}) {
  const initialIndex = Math.max(0, activeGoals.findIndex(g => !completedGoals.has(g.goalId)));
  const [selIndex,   setSelIndex]   = useState(initialIndex);
  const [activeType, setActiveType] = useState(null);
  const [bulkSel,    setBulkSel]    = useState(new Set());
  const [modal,      setModal]      = useState(null);
  const [findItem,   setFindItem]   = useState(null);

  useEffect(() => {
    if (selIndex > activeGoals.length - 1) setSelIndex(Math.max(0, activeGoals.length - 1));
  }, [activeGoals.length]);

  const goal          = activeGoals[selIndex] || null;
  const hc            = goal?.sphereColor || "#b5472a";
  const allItems      = goal ? normalizeActionItems(goal.actionItems || []) : [];
  const filteredItems = activeType ? allItems.filter(i => i.type === activeType) : allItems;
  const showBulk      = activeType === "forward" || activeType === "schedule";
  const bulkItems     = filteredItems.filter(i => bulkSel.has(i.id));

  const toggleCheck = (itemId) => {
    const next = new Set(checkedItems[goal.goalId] || []);
    next.has(itemId) ? next.delete(itemId) : next.add(itemId);
    const updated = { ...checkedItems, [goal.goalId]: next };
    setCheckedItems(updated);
    saveChart(session, { spheres, connections, activeGoals, checkedItems: updated, completedGoals });
  };

  const toggleBulk = (id) => setBulkSel(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const retagItem = (itemId, newType) => {
    const updated = activeGoals.map(ag => {
      if (ag.goalId !== goal.goalId) return ag;
      return { ...ag, actionItems: normalizeActionItems(ag.actionItems || []).map(i => i.id === itemId ? { ...i, type: newType } : i) };
    });
    setActiveGoals(updated);
    saveChart(session, { spheres, connections, activeGoals: updated, checkedItems, completedGoals });
  };

  // ── Paywall ──
  if (!isPaid) {
    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.2s ease-out" }}>
        <style>{FONTS}</style>
        <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "#2c1f14" }} />
        <div className="w-full lg:flex-1 lg:flex lg:flex-col">
          {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
          {isMobile  && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
          <div className="px-6 py-10 max-w-2xl mx-auto w-full lg:px-16 pb-24 lg:pb-12">
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 6px" }}>Plan</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 28px" }}>Get things done</h2>
            <button onClick={() => setAuthPrompt("upgrade")} className="w-full text-left border-2" style={{ borderColor: "#e8e0d5", borderStyle: "dashed", background: "#faf8f5" }}>
              <div className="px-5 py-6 flex items-center gap-3">
                <span style={{ fontSize: "1rem" }}>🔒</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "#6e5c4a", margin: "0 0 4px" }}>The Plan tab is a premium feature</p>
                  <p className="text-xs" style={{ color: "#8a7455", margin: 0, lineHeight: 1.5 }}>Upgrade to forward, schedule and find help completing your action items.</p>
                </div>
                <span className="text-xs font-semibold" style={{ color: "#b5472a", flexShrink: 0 }}>Upgrade →</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty ──
  if (activeGoals.length === 0) {
    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.2s ease-out" }}>
        <style>{FONTS}</style>
        <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "#2c1f14" }} />
        <div className="w-full lg:flex-1 lg:flex lg:flex-col">
          {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
          {isMobile  && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
          <div className="px-6 py-10 max-w-2xl mx-auto w-full lg:px-16" style={{ textAlign: "center", paddingTop: "60px" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c1410", margin: "0 0 8px" }}>No active goals yet</p>
            <p style={{ fontSize: "13px", color: "#8a7455", fontWeight: 300, margin: "0 0 20px", lineHeight: 1.5 }}>Add a goal first to start planning.</p>
            <button onClick={() => setStep("goal-picker")} style={{ background: "#b5472a", color: "white", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", padding: "10px 24px", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              ADD A GOAL →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.2s ease-out" }}>
      <style>{FONTS}</style>

      {modal === "forward"  && <ForwardModal  items={bulkItems} color={hc} onClose={() => { setModal(null); setBulkSel(new Set()); }} />}
      {modal === "schedule" && <ScheduleModal items={bulkItems} color={hc} onClose={() => { setModal(null); setBulkSel(new Set()); }} />}

      {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
      {isMobile  && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

      {/* Plan header */}
      <div style={{ background: `${hc}1e`, borderBottom: `2px solid ${hc}55`, padding: "16px 24px 14px", transition: "background 0.3s ease, border-color 0.3s ease" }}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 3px" }}>Plan</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: 0 }}>Get things done</p>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, paddingBottom: isMobile ? "60px" : 0 }}>

        {/* Ring sidebar */}
        <div style={{ width: "56px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "16px", gap: "4px", borderRight: "1px solid #e8e0d5", background: "#faf8f5" }}>
          {activeGoals.map((ag, i) => (
            <RingButton key={ag.goalId} color={ag.sphereColor} isActive={i === selIndex}
              onClick={() => { setSelIndex(i); setActiveType(null); setBulkSel(new Set()); setFindItem(null); }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Goal strip — solid sphere color */}
          {goal && (
            <div style={{ background: hc, padding: "10px 18px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", transition: "background 0.3s ease" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>{goal.sphereName}</span>
              <span style={{ fontSize: "14px", color: "white", fontFamily: "'Playfair Display', serif", fontWeight: 600, lineHeight: 1.3 }}>{goal.goalText}</span>
            </div>
          )}

          {/* Type buttons */}
          <div style={{ display: "flex", borderBottom: "1px solid #e8e0d5" }}>
            {ACTION_TYPES.map(t => {
              const isAct  = activeType === t;
              const locked = t === "find" && !isPro;
              return (
                <button key={t} onClick={() => {
                  if (locked) { setAuthPrompt("upgrade"); return; }
                  setActiveType(activeType === t ? null : t);
                  setBulkSel(new Set()); setFindItem(null);
                }} style={{
                  flex: 1, padding: "10px 6px", border: "none", cursor: "pointer",
                  fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 600,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  borderBottom: `2px solid ${isAct ? TC[t] : "transparent"}`,
                  borderRight: "1px solid #f0ebe3",
                  background: isAct ? TBG[t] : "white",
                  color: isAct ? TC[t] : "#8a7455",
                  outline: isAct ? "none" : `1px solid ${TBORDER[t]}`,
                  outlineOffset: "-1px",
                  transition: "all 0.15s",
                }}>
                  {t}{locked ? " 🔒" : ""}
                  <br />
                  <span style={{ fontSize: "8px", fontWeight: 400, letterSpacing: "0.03em", opacity: 0.75 }}>
                    {t === "forward" ? "send/delegate" : t === "schedule" ? "remind/cal" : "lyme search"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Item list */}
          <div style={{ flex: 1 }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#8a7455", margin: "0 0 14px", fontStyle: "italic" }}>No {activeType} items for this goal yet.</p>
                <button onClick={() => { setActiveType(null); setBulkSel(new Set()); }}
                  style={{ fontSize: "11px", color: "#b5472a", background: "none", border: "1px solid #e8e0d5", padding: "7px 16px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                  Show all items
                </button>
              </div>
            ) : filteredItems.map(item => {
              const isDone   = checkedItems[goal.goalId]?.has(item.id) || false;
              const isBulked = bulkSel.has(item.id);
              const isFind   = item.type === "find";
              const findOpen = findItem?.id === item.id;

              return (
                <div key={item.id}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 18px", borderBottom: "1px solid #f0ebe3", background: isBulked ? TBG[item.type] : "white", transition: "background 0.15s" }}>
                    {showBulk && (
                      <input type="checkbox" checked={isBulked} onChange={() => toggleBulk(item.id)}
                        style={{ marginTop: "2px", flexShrink: 0, accentColor: hc }} />
                    )}
                    <button onClick={() => toggleCheck(item.id)} style={{
                      width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                      border: `1.5px solid ${isDone ? hc : "#d4c9bb"}`, background: isDone ? hc : "white",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", padding: 0, transition: "all 0.15s",
                    }}>
                      {isDone && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                    </button>
                    <span style={{ flex: 1, fontSize: "13px", lineHeight: 1.5, color: isDone ? "#8a7455" : "#1c1410", textDecoration: isDone ? "line-through" : "none" }}>
                      {item.text}
                    </span>
                    {isFind && activeType === "find" && (
                      isPro ? (
                        <button onClick={() => setFindItem(findOpen ? null : item)}
                          style={{ fontSize: "10px", fontWeight: 600, color: TC.find, background: "none", border: `1px solid ${TBORDER.find}`, padding: "3px 9px", cursor: "pointer", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                          {findOpen ? "Close" : "Ask Lyme"}
                        </button>
                      ) : (
                        <button onClick={() => setAuthPrompt("upgrade")}
                          style={{ fontSize: "13px", background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 0 }}
                          title="Available on the $15/mo plan">
                          🔒
                        </button>
                      )
                    )}
                    <select value={item.type} onChange={e => retagItem(item.id, e.target.value)}
                      style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.04em", padding: "2px 6px", border: "none", background: TBG[item.type], color: TC[item.type], cursor: "pointer", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                      {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {findOpen && <FindPanel item={item} goal={goal} onClose={() => setFindItem(null)} />}
                </div>
              );
            })}
          </div>

          {/* Bulk bar */}
          {showBulk && filteredItems.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "#faf8f5", borderTop: "1px solid #e8e0d5" }}>
              <button onClick={bulkSel.size === filteredItems.length ? () => setBulkSel(new Set()) : () => setBulkSel(new Set(filteredItems.map(i => i.id)))}
                style={{ fontSize: "11px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", padding: "5px 10px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                {bulkSel.size === filteredItems.length ? "Clear" : "Select all"}
              </button>
              <span style={{ fontSize: "11px", color: "#8a7455", flex: 1 }}>{bulkSel.size} selected</span>
              <button onClick={() => bulkSel.size > 0 && setModal(activeType)} disabled={bulkSel.size === 0}
                style={{ fontSize: "11px", fontWeight: 600, color: "white", background: bulkSel.size > 0 ? hc : "#c4b8a8", border: "none", padding: "7px 16px", cursor: bulkSel.size > 0 ? "pointer" : "default", fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}>
                {activeType === "forward" ? "Forward selected →" : "Schedule selected →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
