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
      <div style={{ background: "white", maxWidth: "480px", width: "100%" }}>
        <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #e8e0d5" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7455", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>Forward {items.length} item{items.length > 1 ? "s" : ""}</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#1c1410", margin: 0 }}>Who should handle these?</p>
        </div>
        {sent ? (
          <div style={{ padding: "32px 28px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#4a7a72", fontWeight: 500, margin: "0 0 6px", fontFamily: "'Inter', sans-serif" }}>Forwarded ✓</p>
            <p style={{ fontSize: "12px", color: "#8a7455", margin: "0 0 20px", fontFamily: "'Inter', sans-serif" }}>Your email client should have opened.</p>
            <button onClick={onClose} style={{ fontSize: "12px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", padding: "9px 24px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 28px" }}>
              <div style={{ marginBottom: "16px" }}>
                {items.map(i => (
                  <div key={i.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "7px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, marginTop: "6px", flexShrink: 0 }} />
                    <p style={{ fontSize: "13px", color: "#1c1410", margin: 0, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{i.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Recipient email or phone"
                  style={{ border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", width: "100%", boxSizing: "border-box" }} />
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
                  style={{ border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", width: "100%", boxSizing: "border-box" }} />
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" rows={3}
                  style={{ border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", resize: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ padding: "16px 28px", borderTop: "1px solid #e8e0d5", display: "flex", gap: "10px" }}>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", fontSize: "13px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
              <button onClick={handleSend} style={{ flex: 2, padding: "11px", fontSize: "13px", fontWeight: 600, color: "white", background: "#b5472a", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Send →</button>
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
      <div style={{ background: "white", maxWidth: "480px", width: "100%" }}>
        <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #e8e0d5" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7455", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>Schedule {items.length} item{items.length > 1 ? "s" : ""}</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#1c1410", margin: 0 }}>When should these happen?</p>
        </div>
        {saved ? (
          <div style={{ padding: "32px 28px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#4a7a72", fontWeight: 500, margin: "0 0 6px", fontFamily: "'Inter', sans-serif" }}>Reminder set ✓</p>
            <p style={{ fontSize: "12px", color: "#8a7455", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>{date} at {time} · {repeat === "once" ? "One time" : repeat === "daily" ? "Every day" : "Every week"}</p>
            <p style={{ fontSize: "11px", color: "#8a7455", margin: "0 0 20px", fontStyle: "italic", fontFamily: "'Inter', sans-serif" }}>Push notifications coming soon.</p>
            <button onClick={onClose} style={{ fontSize: "12px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", padding: "9px 24px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 28px" }}>
              <div style={{ marginBottom: "16px" }}>
                {items.map(i => (
                  <div key={i.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "7px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, marginTop: "6px", flexShrink: 0 }} />
                    <p style={{ fontSize: "13px", color: "#1c1410", margin: 0, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{i.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    style={{ flex: 1, border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none" }} />
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    style={{ width: "100px", border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none" }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["once", "daily", "weekly"].map(r => (
                    <button key={r} onClick={() => setRepeat(r)} style={{
                      flex: 1, padding: "8px", fontSize: "12px", cursor: "pointer",
                      fontFamily: "'Inter', sans-serif", fontWeight: repeat === r ? 600 : 400,
                      background: repeat === r ? color : "white",
                      color: repeat === r ? "white" : "#6e5c4a",
                      border: `1px solid ${repeat === r ? color : "#d4c9bb"}`,
                    }}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 28px", borderTop: "1px solid #e8e0d5", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={onClose} style={{ flex: 1, padding: "11px", fontSize: "13px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
                <button onClick={() => date && setSaved(true)} disabled={!date}
                  style={{ flex: 2, padding: "11px", fontSize: "13px", fontWeight: 600, color: "white", background: date ? color : "#c4b8a8", border: "none", cursor: date ? "pointer" : "default", fontFamily: "'Inter', sans-serif" }}>
                  Set reminder →
                </button>
              </div>
              <button onClick={openGCal}
                style={{ width: "100%", padding: "11px", fontSize: "13px", fontWeight: 500, color: color, background: "none", border: `1px solid ${color}`, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
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

// ── Intro walkthrough modal ──────────────────────────────────────────────────
const DEMO_ITEMS = [
  { id: "d1", text: "Email James about getting the group together", type: "forward" },
  { id: "d2", text: "Text Sarah about coffee this weekend",         type: "forward" },
  { id: "d3", text: "Block Sunday afternoon for a call with mum",  type: "schedule" },
];

function MiniTypeButtons({ active }) {
  return (
    <div style={{ display: "flex", borderBottom: "1px solid #e8e0d5" }}>
      {ACTION_TYPES.map(t => (
        <div key={t} style={{
          flex: 1, padding: "8px 4px", fontSize: "9px", fontWeight: 600,
          letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "center",
          fontFamily: "'Inter', sans-serif",
          borderBottom: `2px solid ${active === t ? TC[t] : "transparent"}`,
          borderRight: "1px solid #f0ebe3",
          background: active === t ? TBG[t] : "white",
          color: active === t ? TC[t] : "#8a7455",
          outline: active === t ? "none" : `1px solid ${TBORDER[t]}`,
          outlineOffset: "-1px",
        }}>
          {t}
        </div>
      ))}
    </div>
  );
}

function Caption({ text }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginTop: "12px" }}>
      <div style={{ width: "3px", flexShrink: 0, background: "#b5472a", borderRadius: "2px", alignSelf: "stretch", minHeight: "36px" }} />
      <p style={{ fontSize: "13px", fontWeight: 500, color: "#1c1410", margin: 0, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{text}</p>
    </div>
  );
}

function IntroStep0() {
  return (
    <div>
      <p style={{ fontSize: "13px", color: "#5c4e40", margin: "0 0 16px", lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
        This is where you actually get things done. Use the three action types to handle your items:
      </p>
      {[
        { type: "forward",  label: "Forward",  desc: "Delegate or communicate — send items to an EA, teammate, or anyone who should handle them." },
        { type: "schedule", label: "Schedule", desc: "Block time or set reminders — for anything that needs a calendar event or a nudge." },
        { type: "find",     label: "Find",     desc: "Ask Lyme to research, source or buy — powered by web search." },
      ].map(({ type, label, desc }) => (
        <div key={type} style={{ display: "flex", gap: "12px", marginBottom: "14px", alignItems: "flex-start" }}>
          <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em", padding: "3px 8px", background: TBG[type], color: TC[type], fontFamily: "'Inter', sans-serif", flexShrink: 0, marginTop: "2px" }}>
            {label.toUpperCase()}
          </span>
          <p style={{ fontSize: "12px", color: "#5c4e40", margin: 0, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{desc}</p>
        </div>
      ))}
    </div>
  );
}

function IntroStep1() {
  const [active, setActive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setActive(true), 600); return () => clearTimeout(t); }, []);
  const fwdItems = DEMO_ITEMS.filter(i => i.type === "forward");
  return (
    <div>
      <div style={{ border: "1px solid #e8e0d5", overflow: "hidden" }}>
        <MiniTypeButtons active={active ? "forward" : null} />
        <div>
          {(active ? fwdItems : DEMO_ITEMS).map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "9px 12px", borderBottom: "1px solid #f0ebe3", background: "white", transition: "all 0.3s" }}>
              {active && <input type="checkbox" readOnly style={{ marginTop: "2px", flexShrink: 0, accentColor: TC.forward }} />}
              <span style={{ fontSize: "12px", color: "#1c1410", lineHeight: 1.4, fontFamily: "'Inter', sans-serif" }}>{item.text}</span>
            </div>
          ))}
        </div>
        {active && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#faf8f5", borderTop: "1px solid #e8e0d5" }}>
            <span style={{ fontSize: "10px", color: "#8a7455", flex: 1, fontFamily: "'Inter', sans-serif" }}>0 selected</span>
            <span style={{ fontSize: "10px", fontWeight: 600, color: "white", background: "#c4b8a8", padding: "5px 12px", fontFamily: "'Inter', sans-serif" }}>Forward selected →</span>
          </div>
        )}
      </div>
      <Caption text="Tap a type to filter your items and reveal bulk actions." />
    </div>
  );
}

function IntroStep2() {
  const [count, setCount] = useState(0);
  const fwdItems = DEMO_ITEMS.filter(i => i.type === "forward");
  useEffect(() => {
    const t1 = setTimeout(() => setCount(1), 700);
    const t2 = setTimeout(() => setCount(2), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div>
      <div style={{ border: "1px solid #e8e0d5", overflow: "hidden" }}>
        <MiniTypeButtons active="forward" />
        {fwdItems.map((item, i) => {
          const checked = i < count;
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "9px 12px", borderBottom: "1px solid #f0ebe3", background: checked ? TBG.forward : "white", transition: "background 0.3s" }}>
              <input type="checkbox" readOnly checked={checked} style={{ marginTop: "2px", flexShrink: 0, accentColor: TC.forward }} />
              <span style={{ fontSize: "12px", color: "#1c1410", lineHeight: 1.4, fontFamily: "'Inter', sans-serif" }}>{item.text}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#faf8f5", borderTop: "1px solid #e8e0d5" }}>
          <span style={{ fontSize: "10px", color: "#8a7455", flex: 1, fontFamily: "'Inter', sans-serif" }}>{count} selected</span>
          <span style={{ fontSize: "10px", fontWeight: 600, color: "white", background: count > 0 ? TC.forward : "#c4b8a8", padding: "5px 12px", fontFamily: "'Inter', sans-serif", transition: "background 0.3s" }}>Forward selected →</span>
        </div>
      </div>
      <Caption text="Select one or more items to handle together in a single action." />
    </div>
  );
}

function IntroStep3() {
  const [pulse, setPulse] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fwdItems = DEMO_ITEMS.filter(i => i.type === "forward");
  useEffect(() => {
    const t1 = setTimeout(() => setPulse(true),   500);
    const t2 = setTimeout(() => setPulse(false),  1100);
    const t3 = setTimeout(() => setShowPreview(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div>
      <div style={{ border: "1px solid #e8e0d5", overflow: "hidden" }}>
        <MiniTypeButtons active="forward" />
        {fwdItems.map(item => (
          <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "9px 12px", borderBottom: "1px solid #f0ebe3", background: TBG.forward }}>
            <input type="checkbox" readOnly checked style={{ marginTop: "2px", flexShrink: 0, accentColor: TC.forward }} />
            <span style={{ fontSize: "12px", color: "#1c1410", lineHeight: 1.4, fontFamily: "'Inter', sans-serif" }}>{item.text}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", background: "#faf8f5", borderTop: "1px solid #e8e0d5" }}>
          <span style={{ fontSize: "10px", color: "#8a7455", flex: 1, fontFamily: "'Inter', sans-serif" }}>2 selected</span>
          <span style={{
            fontSize: "10px", fontWeight: 600, color: "white", background: TC.forward,
            padding: "5px 12px", fontFamily: "'Inter', sans-serif",
            transform: pulse ? "scale(1.05)" : "scale(1)", transition: "transform 0.3s",
            display: "inline-block",
          }}>Forward selected →</span>
        </div>
      </div>
      {showPreview && (
        <div style={{ border: "1px solid #e8e0d5", marginTop: "8px", background: "white", padding: "12px 14px", animation: "fadeIn 0.3s ease-out" }}>
          <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8a7455", margin: "0 0 2px", fontFamily: "'Inter', sans-serif" }}>Forward 2 items</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", color: "#1c1410", margin: "0 0 8px" }}>Who should handle these?</p>
          <div style={{ border: "1px solid #d4c9bb", padding: "6px 10px", fontSize: "11px", color: "#8a7455", marginBottom: "6px", fontFamily: "'Inter', sans-serif" }}>Recipient email or phone</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ flex: 1, padding: "6px", fontSize: "11px", color: "#5c4e40", border: "1px solid #d4c9bb", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>Cancel</div>
            <div style={{ flex: 2, padding: "6px", fontSize: "11px", fontWeight: 600, color: "white", background: "#b5472a", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>Send →</div>
          </div>
        </div>
      )}
      <Caption text="Hit the action button and a focused modal walks you through the rest." />
    </div>
  );
}

const INTRO_STEPS = [IntroStep0, IntroStep1, IntroStep2, IntroStep3];
const INTRO_TOTAL = INTRO_STEPS.length;

function IntroModal({ step, onNext, onBack, onDot }) {
  const StepComponent = INTRO_STEPS[step];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,20,16,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "white", maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #e8e0d5" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7455", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>Welcome to</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 600, color: "#1c1410", margin: 0 }}>The Plan tab</p>
        </div>
        <div style={{ padding: "22px 28px" }} key={step}>
          <StepComponent />
        </div>
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e8e0d5", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", gap: "6px", flex: 1 }}>
            {Array.from({ length: INTRO_TOTAL }).map((_, i) => (
              <div key={i} onClick={() => onDot(i)} style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === step ? "#b5472a" : "#d4c9bb", cursor: "pointer", transition: "background 0.2s" }} />
            ))}
          </div>
          {step > 0 && (
            <button onClick={onBack} style={{ fontSize: "12px", color: "#8a7455", background: "none", border: "1px solid #d4c9bb", padding: "8px 16px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>← Back</button>
          )}
          <button onClick={onNext} style={{ fontSize: "12px", fontWeight: 600, color: "white", background: "#b5472a", border: "none", padding: "9px 20px", cursor: "pointer", fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}>
            {step === INTRO_TOTAL - 1 ? "GOT IT →" : "NEXT →"}
          </button>
        </div>
      </div>
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
  const [selIndex,    setSelIndex]    = useState(initialIndex);
  const [activeType,  setActiveType]  = useState(null);
  const [bulkSel,     setBulkSel]     = useState(new Set());
  const [modal,       setModal]       = useState(null);
  const [findItem,    setFindItem]    = useState(null);
  const [introStep, setIntroStep] = useState(() => localStorage.getItem("lyminal_plan_intro_seen") ? null : 0);

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
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.2s ease-out" }}>
      <style>{FONTS}</style>

      {modal === "forward"  && <ForwardModal  items={bulkItems} color={hc} onClose={() => { setModal(null); setBulkSel(new Set()); }} />}
      {modal === "schedule" && <ScheduleModal items={bulkItems} color={hc} onClose={() => { setModal(null); setBulkSel(new Set()); }} />}

      {/* First-visit intro walkthrough */}
      {introStep !== null && (
        <IntroModal
          step={introStep}
          onNext={() => {
            if (introStep < 3) { setIntroStep(introStep + 1); }
            else { setIntroStep(null); localStorage.setItem("lyminal_plan_intro_seen", "1"); }
          }}
          onBack={() => introStep > 0 && setIntroStep(introStep - 1)}
          onDot={(i) => setIntroStep(i)}
        />
      )}

      {/* Left design strip — full height, desktop only */}
      <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "#2c1f14" }} />

      {/* Right column — nav + header + body */}
      <div className="w-full lg:flex-1 lg:flex lg:flex-col">

        {!isMobile && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}
        {isMobile  && <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} />}

        {/* Plan header */}
        <div style={{ background: `${hc}1e`, borderBottom: `2px solid ${hc}55`, padding: "24px 24px 20px", transition: "background 0.3s ease, border-color 0.3s ease" }}>
          <div className="max-w-2xl mx-auto lg:px-16">
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 4px" }}>Plan</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: 0 }}>Get things done</h2>
          </div>
        </div>

        {/* Body — ring sidebar + content */}
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
        </div> {/* closes content */}
        </div> {/* closes body flex */}
      </div> {/* closes right column */}
    </div>
  );
}
