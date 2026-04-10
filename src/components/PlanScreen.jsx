import React, { useState, useRef } from "react";
import { Nav } from "./Nav.jsx";
import { saveChart } from "../utils/supabase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;

// ── Ring sidebar button ──────────────────────────────────────────────────────
function RingButton({ color, isActive, onClick }) {
  const size = isActive ? 38 : 28;
  const sw = isActive ? 5 : 3;
  const cx = size / 2, cy = size / 2, r = size / 2 - sw / 2 - 1;
  return (
    <button
      onClick={onClick}
      style={{
        background: "none", border: "none", padding: 0,
        cursor: "pointer", opacity: isActive ? 1 : 0.38,
        transition: "opacity 0.2s", display: "flex",
        alignItems: "center", justifyContent: "center",
        width: "44px", height: "44px",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill={color + (isActive ? "28" : "18")} stroke={color} strokeWidth={sw} />
      </svg>
    </button>
  );
}

// ── Inline reminder UI ───────────────────────────────────────────────────────
function ReminderPanel({ item, color, onClose }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [repeat, setRepeat] = useState("once");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!date) return;
    setSaved(true);
  };

  if (saved) {
    return (
      <div style={{ padding: "14px 18px", background: "#f0faf6", borderTop: "1px solid #e8e0d5" }}>
        <p style={{ fontSize: "12px", color: "#4a7a72", fontWeight: 500, margin: "0 0 2px" }}>Reminder set ✓</p>
        <p style={{ fontSize: "11px", color: "#6e5c4a", margin: 0 }}>{date} at {time} · {repeat === "once" ? "One time" : repeat === "daily" ? "Every day" : "Every week"}</p>
        <p style={{ fontSize: "10px", color: "#8a7455", margin: "6px 0 0", fontStyle: "italic" }}>Push notifications coming soon — we'll save this for now.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "14px 18px", background: "#faf8f5", borderTop: "1px solid #e8e0d5" }}>
      <p style={{ fontSize: "11px", fontWeight: 600, color: "#1c1410", margin: "0 0 10px", fontFamily: "'Inter', sans-serif" }}>When should we remind you?</p>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ flex: 1, minWidth: "120px", border: "1px solid #d4c9bb", padding: "6px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", background: "white", outline: "none" }}
        />
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          style={{ width: "90px", border: "1px solid #d4c9bb", padding: "6px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", background: "white", outline: "none" }}
        />
      </div>
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {["once", "daily", "weekly"].map(r => (
          <button
            key={r}
            onClick={() => setRepeat(r)}
            style={{
              flex: 1, padding: "5px 0", fontSize: "11px", cursor: "pointer",
              fontFamily: "'Inter', sans-serif", fontWeight: repeat === r ? 600 : 400,
              background: repeat === r ? color : "none",
              color: repeat === r ? "white" : "#6e5c4a",
              border: `1px solid ${repeat === r ? color : "#d4c9bb"}`,
            }}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={onClose}
          style={{ flex: 1, padding: "7px", fontSize: "11px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!date}
          style={{ flex: 2, padding: "7px", fontSize: "11px", fontWeight: 600, color: "white", background: date ? color : "#c4b8a8", border: "none", cursor: date ? "pointer" : "default", fontFamily: "'Inter', sans-serif" }}
        >
          Set reminder
        </button>
      </div>
    </div>
  );
}

// ── Inline forward UI ────────────────────────────────────────────────────────
function ForwardPanel({ item, onClose }) {
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!contact.trim()) return;
    const isEmail = contact.includes("@");
    if (isEmail) {
      window.open(`mailto:${contact}?subject=Action item&body=${encodeURIComponent(item.text)}`);
    } else {
      window.open(`sms:${contact}&body=${encodeURIComponent(item.text)}`);
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{ padding: "14px 18px", background: "#faf8f5", borderTop: "1px solid #e8e0d5" }}>
        <p style={{ fontSize: "12px", color: "#4a7a72", fontWeight: 500, margin: 0 }}>Forwarded ✓</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "14px 18px", background: "#faf8f5", borderTop: "1px solid #e8e0d5" }}>
      <p style={{ fontSize: "11px", fontWeight: 600, color: "#1c1410", margin: "0 0 8px", fontFamily: "'Inter', sans-serif" }}>Forward to someone</p>
      <p style={{ fontSize: "11px", color: "#8a7455", margin: "0 0 10px" }}>Enter an email address or phone number.</p>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input
          type="text"
          placeholder="Email or phone number"
          value={contact}
          onChange={e => setContact(e.target.value)}
          style={{ flex: 1, border: "1px solid #d4c9bb", padding: "7px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", background: "white", outline: "none" }}
        />
      </div>
      <p style={{ fontSize: "10px", color: "#8a7455", margin: "0 0 10px", fontStyle: "italic" }}>
        Message: "{item.text}"
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onClose} style={{ flex: 1, padding: "7px", fontSize: "11px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
        <button onClick={handleSend} disabled={!contact.trim()} style={{ flex: 2, padding: "7px", fontSize: "11px", fontWeight: 600, color: "white", background: contact.trim() ? "#b5472a" : "#c4b8a8", border: "none", cursor: contact.trim() ? "pointer" : "default", fontFamily: "'Inter', sans-serif" }}>Send</button>
      </div>
    </div>
  );
}

// ── Inline Lyme panel ────────────────────────────────────────────────────────
function LymePanel({ item, goal, onMarkDone, onClose }) {
  const [input, setInput] = useState(item.text);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const ask = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          system: `You are Lyme, a focused assistant inside the Lyminal app. The user needs practical help completing a specific action item toward their goal.

Sphere: ${goal.sphereName}
Goal: ${goal.goalText}
Action item: ${item.text}

Help them directly and concisely. If they need information found, provide it. If they need something drafted, draft it. If they need help with timing or planning, give specific suggestions. One clear response — no follow-up questions unless essential. Do not introduce yourself.`,
          messages: [{ role: "user", content: input.trim() }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "I had trouble with that. Try rephrasing.";
      setResponse(text);
    } catch {
      setResponse("Something went wrong. Try again in a moment.");
    }
    setLoading(false);
  };

  return (
    <div style={{ borderTop: "1px solid #e8e0d5" }}>
      <div style={{ display: "flex", gap: "8px", padding: "10px 18px", background: "#faf8f5" }}>
        <input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && ask()}
          disabled={loading}
          style={{
            flex: 1, border: "1px solid #d4c9bb", padding: "7px 10px",
            fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410",
            background: "white", outline: "none", opacity: loading ? 0.6 : 1,
          }}
          placeholder={loading ? "Lyme is thinking…" : "Ask Lyme anything about this step…"}
        />
        <button
          onClick={ask}
          disabled={loading || !input.trim()}
          style={{ padding: "7px 14px", fontSize: "11px", fontWeight: 600, background: "#b5472a", color: "white", border: "none", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "'Inter', sans-serif" }}
        >
          Ask →
        </button>
      </div>
      {response && (
        <div style={{ padding: "14px 18px", background: "white", borderTop: "1px solid #f0ebe3" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#b5472a", margin: "0 0 8px", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Lyme</p>
          <p style={{ fontSize: "13px", color: "#1c1410", margin: "0 0 12px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{response}</p>
          <button
            onClick={onMarkDone}
            style={{ fontSize: "11px", fontWeight: 600, color: "#b5472a", background: "none", border: "1px solid #b5472a", padding: "6px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            Mark step as done →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Action item row ──────────────────────────────────────────────────────────
function ActionItem({ item, goal, isChecked, isExpanded, onToggleExpand, onCheck, checkedItems, setCheckedItems, spheres, connections, activeGoals, completedGoals, session }) {
  const [mode, setMode] = useState(null); // 'remind' | 'forward' | 'lyme'
  const color = goal.sphereColor;

  const handleMarkDone = () => {
    onCheck(item.id);
    setMode(null);
    onToggleExpand();
  };

  return (
    <div style={{ borderBottom: "1px solid #f0ebe3" }}>
      {/* Main row */}
      <div
        onClick={() => { onToggleExpand(); setMode(null); }}
        style={{
          display: "flex", alignItems: "flex-start", gap: "12px",
          padding: "13px 18px", cursor: "pointer",
          background: isExpanded ? "#faf8f5" : "white",
          transition: "background 0.15s",
        }}
      >
        <button
          onClick={e => { e.stopPropagation(); onCheck(item.id); }}
          style={{
            width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, marginTop: "1px",
            border: `1.5px solid ${isChecked ? color : "#d4c9bb"}`,
            background: isChecked ? color : "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", padding: 0, transition: "all 0.15s",
          }}
        >
          {isChecked && (
            <svg width="9" height="9" viewBox="0 0 9 9">
              <path d="M1.5 4.5L3.5 6.5L7.5 2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <span style={{
          flex: 1, fontSize: "13px", lineHeight: 1.5,
          color: isChecked ? "#8a7455" : "#1c1410",
          textDecoration: isChecked ? "line-through" : "none",
          transition: "color 0.15s",
        }}>
          {item.text}
        </span>
        <span style={{ color: "#c4b8a8", fontSize: "13px", flexShrink: 0, transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>›</span>
      </div>

      {/* Expanded options */}
      {isExpanded && !mode && (
        <div style={{ background: "#faf8f5", borderTop: "1px solid #f0ebe3" }}>
          {/* Remind */}
          <button
            onClick={() => setMode("remind")}
            style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "11px 18px", background: "none", border: "none", borderBottom: "1px solid #f0ebe3", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = "white"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#e8f4f1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke="#4a7a72" strokeWidth="1.3" />
                <path d="M6.5 4V6.5L8 8" stroke="#4a7a72" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#1c1410", margin: 0, fontFamily: "'Inter', sans-serif" }}>Set a reminder</p>
              <p style={{ fontSize: "11px", color: "#8a7455", margin: 0, fontFamily: "'Inter', sans-serif" }}>Schedule when to do this</p>
            </div>
          </button>

          {/* Forward */}
          <button
            onClick={() => setMode("forward")}
            style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "11px 18px", background: "none", border: "none", borderBottom: "1px solid #f0ebe3", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = "white"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#f0ebe3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5h9M8 3l4 3.5-4 3.5" stroke="#8a7455" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#1c1410", margin: 0, fontFamily: "'Inter', sans-serif" }}>Forward to someone</p>
              <p style={{ fontSize: "11px", color: "#8a7455", margin: 0, fontFamily: "'Inter', sans-serif" }}>Delegate via email or text</p>
            </div>
          </button>

          {/* Ask Lyme */}
          <button
            onClick={() => setMode("lyme")}
            style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "11px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.background = "white"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#fdf0eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 10L3.5 7 6.5 4 10.5 3.5 9 7.5l-2.5 1.5L5 10.5 2 10z" stroke="#b5472a" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#1c1410", margin: 0, fontFamily: "'Inter', sans-serif" }}>Ask Lyme to help</p>
                <p style={{ fontSize: "11px", color: "#8a7455", margin: 0, fontFamily: "'Inter', sans-serif" }}>Search, draft, find or plan</p>
              </div>
              <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.06em", padding: "2px 7px", background: "#fdf0eb", color: "#8a4a2a", fontFamily: "'Inter', sans-serif" }}>$5+</span>
            </div>
          </button>
        </div>
      )}

      {/* Sub-panels */}
      {isExpanded && mode === "remind" && (
        <ReminderPanel item={item} color={color} onClose={() => setMode(null)} />
      )}
      {isExpanded && mode === "forward" && (
        <ForwardPanel item={item} onClose={() => setMode(null)} />
      )}
      {isExpanded && mode === "lyme" && (
        <LymePanel
          item={item}
          goal={goal}
          onMarkDone={handleMarkDone}
          onClose={() => setMode(null)}
        />
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function PlanScreen({
  activeGoals,
  checkedItems, setCheckedItems,
  completedGoals, setCompletedGoals,
  spheres, connections,
  session,
  isMobile, isPaid,
  setStep,
  setAuthPrompt,
}) {
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(null); // action item id

  const safeSelected = Math.min(selected, Math.max(0, activeGoals.length - 1));
  const currentGoal = activeGoals[safeSelected];

  const toggleCheck = (goalId, itemId) => {
    const current = new Set(checkedItems[goalId] || []);
    current.has(itemId) ? current.delete(itemId) : current.add(itemId);
    const updated = { ...checkedItems, [goalId]: current };
    setCheckedItems(updated);
    saveChart(session, { spheres, connections, activeGoals, checkedItems: updated, completedGoals });
  };

  // ── Paywall gate ──
  if (!isPaid) {
    return (
      <div className="min-h-screen" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.2s ease-out" }}>
        <style>{FONTS}</style>
        {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
        {isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
        <div className="px-6 py-10 max-w-2xl mx-auto pb-24 lg:pb-10">
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 6px" }}>Plan</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 28px" }}>Get things done</h2>
          <button
            onClick={() => setAuthPrompt("upgrade")}
            className="w-full text-left border-2"
            style={{ borderColor: "#e8e0d5", borderStyle: "dashed", background: "#faf8f5" }}
          >
            <div className="px-5 py-6 flex items-center gap-3">
              <span style={{ fontSize: "1rem" }}>🔒</span>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "#6e5c4a", margin: "0 0 4px" }}>The Plan tab is a premium feature</p>
                <p className="text-xs" style={{ color: "#8a7455", margin: 0, lineHeight: 1.5 }}>Upgrade to get help actually completing your action items — set reminders, delegate tasks, and ask Lyme to search, draft and plan on your behalf.</p>
              </div>
              <span className="text-xs font-semibold" style={{ color: "#b5472a", flexShrink: 0 }}>Upgrade →</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (activeGoals.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.2s ease-out" }}>
        <style>{FONTS}</style>
        {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
        {isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
        <div className="px-6 py-10 max-w-2xl mx-auto pb-24 lg:pb-10" style={{ textAlign: "center", paddingTop: "60px" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c1410", margin: "0 0 8px" }}>No active goals yet</p>
          <p style={{ fontSize: "13px", color: "#8a7455", fontWeight: 300, margin: "0 0 20px", lineHeight: 1.5 }}>Add a goal to start planning how to complete it.</p>
          <button onClick={() => setStep("goal-picker")} style={{ background: "#b5472a", color: "white", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", padding: "10px 24px", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            ADD A GOAL →
          </button>
        </div>
      </div>
    );
  }

  const headerColor = currentGoal?.sphereColor || "#b5472a";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.2s ease-out" }}>
      <style>{FONTS}</style>
      {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
      {isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

      <div style={{ display: "flex", flex: 1, paddingBottom: isMobile ? "60px" : 0 }}>

        {/* ── Ring sidebar ── */}
        <div style={{
          width: "56px", flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center",
          paddingTop: "16px", gap: "4px",
          borderRight: "1px solid #e8e0d5", background: "#faf8f5",
        }}>
          {activeGoals.map((ag, i) => (
            <RingButton
              key={ag.goalId}
              color={ag.sphereColor}
              isActive={i === safeSelected}
              onClick={() => { setSelected(i); setExpanded(null); }}
            />
          ))}
        </div>

        {/* ── Content area ── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Colored goal header */}
          <div style={{
            background: headerColor + "1e",
            borderBottom: `2px solid ${headerColor}55`,
            padding: "16px 18px",
            transition: "background 0.3s ease, border-color 0.3s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: headerColor, flexShrink: 0 }} />
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: headerColor, fontFamily: "'Inter', sans-serif" }}>
                {currentGoal.sphereName}
              </span>
            </div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 600, color: "#1c1410", margin: 0, lineHeight: 1.35 }}>
              {currentGoal.goalText}
            </p>
          </div>

          {/* Action items */}
          {currentGoal.actionItems.length === 0 ? (
            <div style={{ padding: "24px 18px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#8a7455", fontStyle: "italic", margin: "0 0 14px" }}>No action items yet.</p>
              <button
                onClick={() => setStep("chat")}
                style={{ background: "#b5472a", color: "white", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", padding: "9px 18px", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
              >
                TALK TO LYME TO BUILD YOUR PLAN →
              </button>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              {currentGoal.actionItems.map(item => (
                <ActionItem
                  key={item.id}
                  item={item}
                  goal={currentGoal}
                  isChecked={checkedItems[currentGoal.goalId]?.has(item.id) || false}
                  isExpanded={expanded === item.id}
                  onToggleExpand={() => setExpanded(prev => prev === item.id ? null : item.id)}
                  onCheck={(itemId) => toggleCheck(currentGoal.goalId, itemId)}
                  checkedItems={checkedItems}
                  setCheckedItems={setCheckedItems}
                  spheres={spheres}
                  connections={connections}
                  activeGoals={activeGoals}
                  completedGoals={completedGoals}
                  session={session}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
