import React, { useState, useEffect } from "react";
import { Nav } from "./Nav.jsx";
import { saveChart } from "../utils/supabase.js";
import { ACTION_TYPES, normalizeActionItems, buildForwardBody } from "../utils/actionItems.js";
import { trackUserEvent } from "../utils/events.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(181,71,42,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const TC     = { forward: "#8a5a44", schedule: "#4a7a72", find: "#5c6f9b", none: "#6e5c4a" };
const TBG    = { forward: "#f7f0ec", schedule: "#edf4f1", find: "#eef0f6", none: "#f5f2ee" };
const TBORDER = { forward: "#d4a890", schedule: "#9fd4c4", find: "#b0bcd8", none: "#d4c9bb" };

// ── Ring sidebar button ──────────────────────────────────────────────────────
function RingButton({ color, isActive, onClick }) {
  const size = isActive ? 44 : 32;
  const sw   = isActive ? 5  : 3;
  const cx = size / 2, cy = size / 2, r = size / 2 - sw / 2 - 1;
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", padding: 0, cursor: "pointer",
      opacity: isActive ? 1 : 0.38, transition: "opacity 0.2s",
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "52px", height: "52px", flexShrink: 0,
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r}
          style={{ fill: color, fillOpacity: isActive ? 0.16 : 0.09, stroke: color, strokeWidth: sw }} />
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
      <div style={{ background: "var(--ly-bg)", maxWidth: "480px", width: "100%" }}>
        <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #e8e0d5" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7455", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>Forward {items.length} item{items.length > 1 ? "s" : ""}</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#1c1410", margin: 0 }}>Who should handle these?</p>
        </div>
        {sent ? (
          <div style={{ padding: "32px 28px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--ly-accent)", fontWeight: 500, margin: "0 0 6px", fontFamily: "'Inter', sans-serif" }}>Forwarded ✓</p>
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
                  style={{ border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", width: "100%", boxSizing: "border-box", background: "var(--ly-bg)" }} />
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
                  style={{ border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", width: "100%", boxSizing: "border-box", background: "var(--ly-bg)" }} />
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" rows={3}
                  style={{ border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", resize: "none", width: "100%", boxSizing: "border-box", background: "var(--ly-bg)" }} />
              </div>
            </div>
            <div style={{ padding: "16px 28px", borderTop: "1px solid #e8e0d5", display: "flex", gap: "10px" }}>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", fontSize: "13px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
              <button onClick={handleSend} style={{ flex: 2, padding: "11px", fontSize: "13px", fontWeight: 600, color: "white", background: "var(--ly-accent)", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Send →</button>
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
      <div style={{ background: "var(--ly-bg)", maxWidth: "480px", width: "100%" }}>
        <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #e8e0d5" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7455", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>Schedule {items.length} item{items.length > 1 ? "s" : ""}</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#1c1410", margin: 0 }}>When should these happen?</p>
        </div>
        {saved ? (
          <div style={{ padding: "32px 28px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--ly-accent)", fontWeight: 500, margin: "0 0 6px", fontFamily: "'Inter', sans-serif" }}>Reminder set ✓</p>
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
                    style={{ flex: 1, border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", background: "var(--ly-bg)" }} />
                  <input type="time" value={time} onChange={e => setTime(e.target.value)}
                    style={{ width: "100px", border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", background: "var(--ly-bg)" }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["once", "daily", "weekly"].map(r => (
                    <button key={r} onClick={() => setRepeat(r)} style={{
                      flex: 1, padding: "8px", fontSize: "12px", cursor: "pointer",
                      fontFamily: "'Inter', sans-serif", fontWeight: repeat === r ? 600 : 400,
                      background: repeat === r ? color : "var(--ly-bg)",
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
    <div style={{ borderTop: "1px solid #e8e0d5", background: "var(--ly-bg)" }}>
      <div style={{ display: "flex", gap: "8px", padding: "10px 18px" }}>
        <input autoFocus value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && ask()}
          disabled={loading}
          placeholder={loading ? "Lyme is searching…" : "Ask Lyme to find something…"}
          style={{ flex: 1, border: "1px solid #d4c9bb", padding: "7px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", background: "var(--ly-bg)", outline: "none", opacity: loading ? 0.6 : 1 }}
        />
        <button onClick={ask} disabled={loading || !input.trim()}
          style={{ padding: "7px 14px", fontSize: "11px", fontWeight: 600, background: "var(--ly-accent)", color: "white", border: "none", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "'Inter', sans-serif" }}>
          Ask →
        </button>
      </div>
      {response && (
        <div style={{ padding: "14px 18px", background: "var(--ly-bg)", borderTop: "1px solid #f0ebe3" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ly-accent)", margin: "0 0 8px", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Lyme</p>
          <p style={{ fontSize: "13px", color: "#1c1410", margin: "0 0 12px", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "'Inter', sans-serif" }}>{response}</p>
          <button onClick={onClose} style={{ fontSize: "11px", fontWeight: 600, color: "var(--ly-accent)", background: "none", border: "1px solid var(--ly-accent)", padding: "6px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
            Done →
          </button>
        </div>
      )}
    </div>
  );
}

function NewForwardModal({ items, color, onClose, onCommit }) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("Action items from Lyminal");
  const [note, setNote] = useState("");
  const [channel, setChannel] = useState("email");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!recipient.trim()) return;
    const body = buildForwardBody(items) + (note.trim() ? `\n\nNote: ${note.trim()}` : "");
    if (channel === "sms") {
      window.open(`sms:${recipient}?&body=${encodeURIComponent(body)}`);
    } else {
      window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }
    onCommit?.({ channel, recipient: recipient.trim(), subject: subject.trim(), note: note.trim() });
    setSent(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,20,16,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--ly-bg)", maxWidth: "480px", width: "100%" }}>
        <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #e8e0d5" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7455", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>Forward {items.length} item{items.length > 1 ? "s" : ""}</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#1c1410", margin: 0 }}>Who should handle these?</p>
        </div>
        {sent ? (
          <div style={{ padding: "32px 28px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "#4a7a72", fontWeight: 500, margin: "0 0 6px", fontFamily: "'Inter', sans-serif" }}>Forward initiated</p>
            <p style={{ fontSize: "12px", color: "#8a7455", margin: "0 0 20px", fontFamily: "'Inter', sans-serif" }}>Your {channel === "sms" ? "text" : "email"} app should have opened.</p>
            <button onClick={() => onClose?.({ completed: true })} style={{ fontSize: "12px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", padding: "9px 24px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 28px" }}>
              <div style={{ marginBottom: "16px" }}>
                {items.map((i) => (
                  <div key={i.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "7px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, marginTop: "6px", flexShrink: 0 }} />
                    <p style={{ fontSize: "13px", color: "#1c1410", margin: 0, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{i.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                {["email", "sms"].map((mode) => (
                  <button key={mode} onClick={() => setChannel(mode)} style={{ flex: 1, padding: "8px", fontSize: "12px", border: `1px solid ${channel === mode ? "var(--ly-accent)" : "#d4c9bb"}`, background: channel === mode ? "var(--ly-accent)" : "var(--ly-bg)", color: channel === mode ? "white" : "#6e5c4a", cursor: "pointer" }}>{mode === "email" ? "Email" : "Text"}</button>
                ))}
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={channel === "sms" ? "Phone number" : "Recipient email"}
                  style={{ border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", width: "100%", boxSizing: "border-box", background: "var(--ly-bg)" }} />
                {channel === "email" && <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" style={{ border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", width: "100%", boxSizing: "border-box", background: "var(--ly-bg)" }} />}
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (optional)" rows={3}
                  style={{ border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", resize: "none", width: "100%", boxSizing: "border-box", background: "var(--ly-bg)" }} />
              </div>
            </div>
            <div style={{ padding: "16px 28px", borderTop: "1px solid #e8e0d5", display: "flex", gap: "10px" }}>
              <button onClick={() => onClose?.({ completed: false })} style={{ flex: 1, padding: "11px", fontSize: "13px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
              <button onClick={handleSend} style={{ flex: 2, padding: "11px", fontSize: "13px", fontWeight: 600, color: "white", background: "var(--ly-accent)", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NewScheduleModal({ items, color, onClose, onCommit, session }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [repeat, setRepeat] = useState("once");
  const [saved, setSaved] = useState(false);
  const [busyWindows, setBusyWindows] = useState([]);
  const [conflictError, setConflictError] = useState(null);

  const startIso = date && time ? new Date(`${date}T${time}`).toISOString() : null;
  const endIso = startIso ? new Date(Date.parse(startIso) + 30 * 60000).toISOString() : null;

  const detectConflicts = async () => {
    setConflictError(null);
    const accessToken = localStorage.getItem("google_calendar_access_token");
    if (!accessToken || !startIso || !endIso) {
      setConflictError("Connect Google Calendar and pick a date/time to check conflicts.");
      return;
    }
    try {
      const res = await fetch("/api/google/freebusy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({ accessToken, startIso, endIso }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not check calendar conflicts.");
      setBusyWindows(data.busy || []);
      if ((data.busy || []).length === 0) setConflictError("No conflicts found.");
    } catch (e) {
      setConflictError(e.message || "Could not check calendar conflicts.");
    }
  };

  const connectGoogle = async () => {
    if (!session) return;
    const res = await fetch("/api/google/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (res.ok && data?.url) window.open(data.url, "_blank");
  };

  const openGCal = () => {
    const text = items.map((i) => i.text).join(", ");
    const details = items.map((i, n) => `${n + 1}. ${i.text}`).join("\n");
    const dt = date && time ? `${date.replace(/-/g, "")}T${time.replace(":", "")}00` : "";
    const url = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(text)}&details=${encodeURIComponent(details)}${dt ? `&dates=${dt}/${dt}` : ""}`;
    window.open(url, "_blank");
  };

  const saveSchedule = () => {
    if (!date) return;
    onCommit?.({ scheduledFor: startIso, repeat, status: "scheduled", busyWindows });
    setSaved(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,20,16,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ background: "var(--ly-bg)", maxWidth: "480px", width: "100%" }}>
        <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid #e8e0d5" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7455", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>Schedule {items.length} item{items.length > 1 ? "s" : ""}</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "18px", color: "#1c1410", margin: 0 }}>When should these happen?</p>
        </div>
        {saved ? (
          <div style={{ padding: "32px 28px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--ly-accent)", fontWeight: 500, margin: "0 0 6px", fontFamily: "'Inter', sans-serif" }}>Reminder set</p>
            <p style={{ fontSize: "12px", color: "#8a7455", margin: "0 0 20px", fontFamily: "'Inter', sans-serif" }}>{date} at {time} - {repeat}</p>
            <button onClick={() => onClose?.({ completed: true })} style={{ fontSize: "12px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", padding: "9px 24px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 28px" }}>
              <div style={{ marginBottom: "16px" }}>{items.map((i) => <div key={i.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "7px" }}><div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, marginTop: "6px", flexShrink: 0 }} /><p style={{ fontSize: "13px", color: "#1c1410", margin: 0, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>{i.text}</p></div>)}</div>
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: 1, border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", background: "var(--ly-bg)" }} />
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: "100px", border: "1px solid #d4c9bb", padding: "10px 12px", fontSize: "13px", fontFamily: "'Inter', sans-serif", color: "#1c1410", outline: "none", background: "var(--ly-bg)" }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>{["once", "daily", "weekly"].map((r) => <button key={r} onClick={() => setRepeat(r)} style={{ flex: 1, padding: "8px", fontSize: "12px", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: repeat === r ? 600 : 400, background: repeat === r ? color : "var(--ly-bg)", color: repeat === r ? "white" : "#6e5c4a", border: `1px solid ${repeat === r ? color : "#d4c9bb"}` }}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>)}</div>
                {conflictError && <p style={{ fontSize: "11px", color: "#8a7455", margin: 0 }}>{conflictError}</p>}
                {busyWindows.length > 0 && <p style={{ fontSize: "11px", color: "#9b2a2a", margin: 0 }}>{busyWindows.length} conflict(s) found for this time.</p>}
              </div>
            </div>
            <div style={{ padding: "16px 28px", borderTop: "1px solid #e8e0d5", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => onClose?.({ completed: false })} style={{ flex: 1, padding: "11px", fontSize: "13px", color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Cancel</button>
                <button onClick={saveSchedule} disabled={!date} style={{ flex: 2, padding: "11px", fontSize: "13px", fontWeight: 600, color: "white", background: date ? color : "#c4b8a8", border: "none", cursor: date ? "pointer" : "default", fontFamily: "'Inter', sans-serif" }}>Set reminder</button>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={connectGoogle} style={{ flex: 1, width: "100%", padding: "11px", fontSize: "12px", fontWeight: 500, color: color, background: "none", border: `1px solid ${color}`, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Connect Google</button>
                <button onClick={detectConflicts} style={{ flex: 1, width: "100%", padding: "11px", fontSize: "12px", fontWeight: 500, color: color, background: "none", border: `1px solid ${color}`, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Check conflicts</button>
              </div>
              <button onClick={openGCal} style={{ width: "100%", padding: "11px", fontSize: "13px", fontWeight: 500, color: color, background: "none", border: `1px solid ${color}`, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Open in Google Calendar instead</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NewFindPanel({ item, goal, onClose, onSaveFact }) {
  const [input, setInput] = useState(item.text);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(item.findFacts?.[0]?.response || null);

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
          system: `You are Lyme in search mode inside the Lyminal app. The user needs a direct, practical answer to a research or sourcing question related to their goal.\n\nSphere: ${goal.sphereName}\nGoal: ${goal.goalText}\nAction item: ${item.text}\n\nSearch the web if needed and give one clear, useful response. Include specific names, links, prices or hours where relevant. Be concise and practical.`,
          messages: [{ role: "user", content: input.trim() }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find((b) => b.type === "text")?.text || "I had trouble with that. Try rephrasing.";
      setResponse(text);
      onSaveFact?.({ prompt: input.trim(), response: text, savedAt: new Date().toISOString() });
    } catch {
      setResponse("Something went wrong. Try again in a moment.");
    }
    setLoading(false);
  };

  return (
    <div style={{ borderTop: "1px solid #e8e0d5", background: "var(--ly-bg)" }}>
      <div style={{ display: "flex", gap: "8px", padding: "10px 18px" }}>
        <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && ask()} disabled={loading}
          placeholder={loading ? "Lyme is searching..." : "Ask Lyme to find something..."}
          style={{ flex: 1, border: "1px solid #d4c9bb", padding: "7px 10px", fontSize: "12px", fontFamily: "'Inter', sans-serif", color: "#1c1410", background: "var(--ly-bg)", outline: "none", opacity: loading ? 0.6 : 1 }}
        />
        <button onClick={ask} disabled={loading || !input.trim()} style={{ padding: "7px 14px", fontSize: "11px", fontWeight: 600, background: "var(--ly-accent)", color: "white", border: "none", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "'Inter', sans-serif" }}>Ask</button>
      </div>
      {response && (
        <div style={{ padding: "14px 18px", background: "var(--ly-bg)", borderTop: "1px solid #f0ebe3" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ly-accent)", margin: "0 0 8px", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>Lyme</p>
          <p style={{ fontSize: "13px", color: "#1c1410", margin: "0 0 12px", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "'Inter', sans-serif" }}>{response}</p>
          <button onClick={() => onClose?.({ completed: true })} style={{ fontSize: "11px", fontWeight: 600, color: "var(--ly-accent)", background: "none", border: "1px solid var(--ly-accent)", padding: "6px 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>Done</button>
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
    <div style={{
      marginTop: "20px",
      background: "rgba(74,122,114,0.09)",
      borderLeft: "3px solid #4a7a72",
      borderRadius: "0 6px 6px 0",
      padding: "11px 14px",
    }}>
      <p style={{ fontSize: "13px", color: "#1e3a36", lineHeight: 1.55, fontWeight: 400, margin: 0, fontFamily: "'Inter', sans-serif" }}>{text}</p>
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
            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "9px 12px", borderBottom: "1px solid #f0ebe3", background: "var(--ly-bg)", transition: "all 0.3s" }}>
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
        <div style={{ border: "1px solid #e8e0d5", marginTop: "8px", background: "var(--ly-bg)", padding: "12px 14px", animation: "fadeIn 0.3s ease-out" }}>
          <p style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8a7455", margin: "0 0 2px", fontFamily: "'Inter', sans-serif" }}>Forward 2 items</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "13px", color: "#1c1410", margin: "0 0 8px" }}>Who should handle these?</p>
          <div style={{ border: "1px solid #d4c9bb", padding: "6px 10px", fontSize: "11px", color: "#8a7455", marginBottom: "6px", fontFamily: "'Inter', sans-serif" }}>Recipient email or phone</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ flex: 1, padding: "6px", fontSize: "11px", color: "#5c4e40", border: "1px solid #d4c9bb", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>Cancel</div>
            <div style={{ flex: 2, padding: "6px", fontSize: "11px", fontWeight: 600, color: "white", background: "var(--ly-accent)", textAlign: "center", fontFamily: "'Inter', sans-serif" }}>Send →</div>
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
      <div style={{ background: "var(--ly-bg)", maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ background: "rgba(181,71,42,0.13)", borderBottom: "1px solid rgba(181,71,42,0.20)", padding: "24px 28px 18px" }}>
          <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8a7455", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>Welcome to</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: 600, color: "#1c1410", margin: 0 }}>The Plan</p>
        </div>
        <div style={{ padding: "28px 28px 24px" }} key={step}>
          <StepComponent />
        </div>
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e8e0d5", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", gap: "6px", flex: 1 }}>
            {Array.from({ length: INTRO_TOTAL }).map((_, i) => (
              <div key={i} onClick={() => onDot(i)} style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === step ? "var(--ly-accent)" : "#d4c9bb", cursor: "pointer", transition: "background 0.2s" }} />
            ))}
          </div>
          {step > 0 && (
            <button onClick={onBack} style={{ fontSize: "12px", color: "#8a7455", background: "none", border: "1px solid #d4c9bb", padding: "8px 16px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>← Back</button>
          )}
          <button onClick={onNext} style={{ fontSize: "12px", fontWeight: 600, color: "white", background: "var(--ly-accent)", border: "none", padding: "9px 20px", cursor: "pointer", fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}>
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
  setChatContext, setChatMessages, setChatLoading,
  selectedTheme,
}) {
  const isDefault = selectedTheme === "warm_earth" || !selectedTheme;
  const initialIndex = Math.max(0, activeGoals.findIndex(g => !completedGoals.has(g.goalId)));
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);
  const [selIndex,    setSelIndex]    = useState(initialIndex);
  const [activeType,  setActiveType]  = useState(null);
  const [bulkSel,     setBulkSel]     = useState(new Set());
  const [modal,       setModal]       = useState(null);
  const [findItem,    setFindItem]    = useState(null);
  const [findAttempt, setFindAttempt] = useState(null);
  const [introStep, setIntroStep] = useState(() => localStorage.getItem("lyminal_plan_intro_seen") ? null : 0);

  const handleTalkToLyme = async (ag) => {
    setChatContext(ag);
    const introMsg = { role: "assistant", content: "Hi — I'm Lyme, your AI coach. I am here to help you identify steps you can take to achieve your goals. I'll ask a few questions, then we'll put together a checklist of action items that gets saved to your home screen so you can track your progress." };
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
          system: `You are Lyme, a warm and focused life coach inside the Lyminal app. Your job is to help someone build a concrete action plan for a specific goal.\n\nContext:\n- Sphere: ${ag.sphereName}\n- Goal: ${ag.goalText}\n\nOpen the conversation with a single, specific, thoughtful question that gets right to the heart of where this person stands with this goal. Do NOT use a generic opener — ask something directly relevant to the goal itself. Do NOT introduce yourself. Just ask your question directly. Keep it concise and warm.`,
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

  useEffect(() => {
    if (selIndex > activeGoals.length - 1) setSelIndex(Math.max(0, activeGoals.length - 1));
  }, [activeGoals.length]);

  const goal          = activeGoals[selIndex] || null;
  const hc            = (isDefault && goal?.sphereColor) ? goal.sphereColor : "var(--ly-accent)";
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

  const updateGoalItems = (updater) => {
    const updated = activeGoals.map((ag) => {
      if (ag.goalId !== goal.goalId) return ag;
      return {
        ...ag,
        actionItems: updater(normalizeActionItems(ag.actionItems || [])),
      };
    });
    setActiveGoals(updated);
    saveChart(session, { spheres, connections, activeGoals: updated, checkedItems, completedGoals });
  };

  const applyForward = (payload) => {
    const actionItemIds = bulkItems.map((i) => i.id);
    trackUserEvent(session, "forward_completed", {
      screen_name: "plan",
      goal_id: goal?.goalId || null,
      action_item_ids: actionItemIds,
      action_count: actionItemIds.length,
      channel: payload?.channel || "email",
    });
    const selectedIds = new Set(bulkItems.map((i) => i.id));
    updateGoalItems((items) => items.map((item) => {
      if (!selectedIds.has(item.id)) return item;
      const logs = Array.isArray(item.forwardLogs) ? item.forwardLogs : [];
      return {
        ...item,
        forwardLogs: [...logs, { ...payload, initiatedAt: new Date().toISOString(), status: "initiated" }],
      };
    }));
  };

  const applySchedule = (payload) => {
    const actionItemIds = bulkItems.map((i) => i.id);
    trackUserEvent(session, "schedule_completed", {
      screen_name: "plan",
      goal_id: goal?.goalId || null,
      action_item_ids: actionItemIds,
      action_count: actionItemIds.length,
      scheduled_for: payload?.scheduledFor || null,
      repeat: payload?.repeat || "once",
    });
    const selectedIds = new Set(bulkItems.map((i) => i.id));
    updateGoalItems((items) => items.map((item) => {
      if (!selectedIds.has(item.id)) return item;
      return { ...item, schedule: payload };
    }));
  };

  const saveFindFact = (itemId, fact) => {
    trackUserEvent(session, "find_completed", {
      screen_name: "plan",
      goal_id: goal?.goalId || null,
      action_item_id: itemId,
    });
    trackUserEvent(session, "find_fact_saved", {
      screen_name: "plan",
      goal_id: goal?.goalId || null,
      action_item_id: itemId,
    });
    setFindAttempt((prev) => (prev && prev.itemId === itemId ? { ...prev, completed: true } : prev));
    updateGoalItems((items) => items.map((item) => {
      if (item.id !== itemId) return item;
      const facts = Array.isArray(item.findFacts) ? item.findFacts : [];
      return { ...item, findFacts: [fact, ...facts].slice(0, 20) };
    }));
  };

  const openBulkModal = (type) => {
    if (!type || bulkSel.size === 0) return;
    const actionItemIds = bulkItems.map((i) => i.id);
    if (type === "forward") {
      trackUserEvent(session, "forward_started", {
        screen_name: "plan",
        goal_id: goal?.goalId || null,
        action_item_ids: actionItemIds,
        action_count: actionItemIds.length,
      });
    }
    if (type === "schedule") {
      trackUserEvent(session, "schedule_started", {
        screen_name: "plan",
        goal_id: goal?.goalId || null,
        action_item_ids: actionItemIds,
        action_count: actionItemIds.length,
      });
    }
    setModal(type);
  };

  const closeForwardModal = (result = {}) => {
    if (!result.completed) {
      trackUserEvent(session, "forward_canceled", {
        screen_name: "plan",
        goal_id: goal?.goalId || null,
        action_count: bulkItems.length,
      });
    }
    setModal(null);
    setBulkSel(new Set());
  };

  const closeScheduleModal = (result = {}) => {
    if (!result.completed) {
      trackUserEvent(session, "schedule_canceled", {
        screen_name: "plan",
        goal_id: goal?.goalId || null,
        action_count: bulkItems.length,
      });
    }
    setModal(null);
    setBulkSel(new Set());
  };

  const openFindPanel = (item) => {
    trackUserEvent(session, "find_started", {
      screen_name: "plan",
      goal_id: goal?.goalId || null,
      action_item_id: item.id,
    });
    setFindAttempt({ itemId: item.id, completed: false });
    setFindItem(item);
  };

  const closeFindPanel = (result = {}) => {
    if (!result.completed && findAttempt && !findAttempt.completed) {
      trackUserEvent(session, "find_canceled", {
        screen_name: "plan",
        goal_id: goal?.goalId || null,
        action_item_id: findAttempt.itemId,
      });
    }
    setFindItem(null);
    setFindAttempt(null);
  };

  const retagItem = (itemId, newType) => {
    updateGoalItems((items) => items.map((i) => i.id === itemId ? { ...i, type: newType } : i));
  };

  // (free users see the full Plan UI in preview mode — action buttons are locked)

  // ── Empty ──
  if (activeGoals.length === 0) {
    return (
      <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
        <style>{FONTS}</style>
        <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "var(--ly-accent)" }} />
        <div className="w-full lg:flex-1 lg:flex lg:flex-col">
          <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} session={session} />
          <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease-out" }}>
          <div className="px-6 py-10 max-w-4xl mx-auto w-full lg:px-16" style={{ textAlign: "center", paddingTop: "60px" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c1410", margin: "0 0 8px" }}>No active goals yet</p>
            <p style={{ fontSize: "13px", color: "#8a7455", fontWeight: 300, margin: "0 0 20px", lineHeight: 1.5 }}>Add a goal first to start planning.</p>
            <button onClick={() => setStep("goal-picker")} style={{ background: "var(--ly-accent)", color: "white", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", padding: "10px 24px", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
              ADD A GOAL →
            </button>
          </div>
          </div>{/* end fade wrapper */}
        </div>
      </div>
    );
  }

  return (
    <>
      {modal === "forward"  && <NewForwardModal  items={bulkItems} color={hc} onCommit={applyForward} onClose={closeForwardModal} />}
      {modal === "schedule" && <NewScheduleModal items={bulkItems} color={hc} session={session} onCommit={applySchedule} onClose={closeScheduleModal} />}
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

    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif" }}>
      <style>{FONTS}</style>

      {/* Left design strip — full height, desktop only */}
      <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "var(--ly-accent)" }} />

      {/* Right column — nav + header + body */}
      <div className="w-full lg:flex-1 lg:flex lg:flex-col">

        <Nav step="plan" setStep={setStep} isMobile={isMobile} isPaid={isPaid} activeGoals={activeGoals} session={session} />
        <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease-out" }}>

        {/* Plan header */}
        <div className="lg:px-16" style={{ background: "rgba(var(--ly-accent-rgb), 0.07)", borderBottom: "1px solid rgba(var(--ly-accent-rgb), 0.12)", padding: "28px 24px 24px" }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--ly-accent)", opacity: 0.8, margin: "0 0 4px" }}>Your Plan</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 4px" }}>Progress, one step at a time.</h2>
          <p style={{ fontSize: "0.8rem", color: "#5c4e40", fontWeight: 300, margin: 0, lineHeight: 1.5, fontFamily: "'Inter', sans-serif" }}>Forward tasks, schedule reminders, send messages, or search for resources.</p>
        </div>

        {/* Mobile horizontal carousel — CSS-gated, always shown on small screens */}
        <div className="flex lg:hidden" style={{ overflowX: "auto", gap: "4px", padding: "8px 16px", justifyContent: "center", borderBottom: "1px solid #e8e0d5", background: "#faf8f5", WebkitOverflowScrolling: "touch" }}>
          {activeGoals.map((ag, i) => (
            <RingButton key={ag.goalId} color={isDefault ? ag.sphereColor : "var(--ly-accent)"} isActive={i === selIndex}
              onClick={() => { setSelIndex(i); setActiveType(null); setBulkSel(new Set()); setFindItem(null); }} />
          ))}
        </div>

        {/* Body — desktop vertical sidebar + content */}
        <div style={{ flex: 1, paddingBottom: isMobile ? "60px" : 0 }}>
        <div className="max-w-4xl mx-auto lg:px-8" style={{ display: "flex", height: "100%" }}>

        {/* Desktop vertical sidebar — CSS-gated */}
        <div className="hidden lg:flex flex-col" style={{ width: "60px", flexShrink: 0, alignItems: "center", paddingTop: "16px", gap: "4px", borderRight: "1px solid #e8e0d5", background: "#faf8f5" }}>
          {activeGoals.map((ag, i) => (
            <RingButton key={ag.goalId} color={isDefault ? ag.sphereColor : "var(--ly-accent)"} isActive={i === selIndex}
              onClick={() => { setSelIndex(i); setActiveType(null); setBulkSel(new Set()); setFindItem(null); }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: "12px 14px" }}>

          {/* Free preview banner */}
          {!isPaid && (
            <button onClick={() => setAuthPrompt("upgrade")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "10px", padding: "9px 14px", background: "rgba(var(--ly-accent-rgb), 0.06)", border: "1px solid rgba(var(--ly-accent-rgb), 0.18)", borderRadius: "8px", width: "100%", cursor: "pointer", textAlign: "left" }}>
              <p style={{ fontSize: "11px", color: "#5c4e40", margin: 0, lineHeight: 1.4, fontFamily: "'Inter', sans-serif" }}>
                <span style={{ fontWeight: 600, color: "var(--ly-accent)" }}>Preview mode.</span> Upgrade to use Forward, Schedule, and Find.
              </p>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ly-accent)", flexShrink: 0, fontFamily: "'Inter', sans-serif" }}>Upgrade →</span>
            </button>
          )}

          {/* Type pills — floating above the card */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "2px", flexShrink: 0 }}>
            <button onClick={() => { setActiveType(null); setBulkSel(new Set()); setFindItem(null); }} style={{
              padding: "7px 14px", cursor: "pointer", flexShrink: 0,
              fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: activeType === null ? 600 : 500,
              letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: "999px",
              border: `1.5px solid ${activeType === null ? "#8a7455" : "#e8e0d5"}`,
              background: activeType === null ? "#8a7455" : "white",
              color: activeType === null ? "white" : "#8a7455",
              transition: "all 0.15s",
            }}>All</button>
            {ACTION_TYPES.map(t => {
              const isAct  = activeType === t;
              const locked = (!isPaid && t !== "none") || (t === "find" && !isPro);
              return (
                <button key={t} onClick={() => {
                  if (locked) { setAuthPrompt("upgrade"); return; }
                  setActiveType(activeType === t ? null : t);
                  setBulkSel(new Set()); setFindItem(null);
                }} style={{
                  padding: "7px 14px", cursor: "pointer", flexShrink: 0,
                  fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 600,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  borderRadius: "999px",
                  border: `1.5px solid ${isAct ? TC[t] : TBORDER[t]}`,
                  background: isAct ? TC[t] : "var(--ly-bg)",
                  color: isAct ? "white" : TC[t],
                  transition: "all 0.15s",
                }}>
                  {t === "forward" ? "Forward" : t === "schedule" ? "Schedule" : t === "find" ? "Find" : "Unassigned"}{locked ? " 🔒" : ""}
                </button>
              );
            })}
          </div>

          <div style={{ background: "var(--ly-bg)", border: "1px solid #e8e0d5", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* Goal strip — solid sphere color card header */}
          {goal && (
            <div style={{ background: hc, padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", transition: "background 0.3s ease", flexShrink: 0 }}>
              <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.75)", fontFamily: "'Inter', sans-serif", flexShrink: 0, fontWeight: 600 }}>{goal.sphereName}</span>
              <span style={{ fontSize: "14px", color: "white", fontFamily: "'Playfair Display', serif", fontWeight: 600, lineHeight: 1.3 }}>{goal.goalText}</span>
            </div>
          )}

          {/* Item list */}
          <div style={{ flex: 1 }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center" }}>
                {allItems.length === 0 ? (
                  <>
                    <p style={{ fontSize: "13px", color: "#8a7455", margin: "0 0 16px", fontStyle: "italic" }}>No action items yet for this goal.</p>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                      <button onClick={() => goal && handleTalkToLyme(goal)}
                        style={{ fontSize: "11px", fontWeight: 600, color: "white", background: hc, border: "none", padding: "9px 20px", cursor: "pointer", fontFamily: "'Inter', sans-serif", borderRadius: "6px", letterSpacing: "0.04em" }}>
                        Talk to Lyme →
                      </button>
                      <button onClick={() => setStep("active")}
                        style={{ fontSize: "11px", color: "#6e5c4a", background: "none", border: "1px solid #d4c9bb", padding: "9px 18px", cursor: "pointer", fontFamily: "'Inter', sans-serif", borderRadius: "6px" }}>
                        Add on Home
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "13px", color: "#8a7455", margin: "0 0 14px", fontStyle: "italic" }}>No {activeType === "none" ? "unassigned" : activeType} items for this goal.</p>
                    <button onClick={() => { setActiveType(null); setBulkSel(new Set()); }}
                      style={{ fontSize: "11px", color: "var(--ly-accent)", background: "none", border: "1px solid #e8e0d5", padding: "7px 16px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                      Show all items
                    </button>
                  </>
                )}
              </div>
            ) : filteredItems.map(item => {
              const isDone   = checkedItems[goal.goalId]?.has(item.id) || false;
              const isBulked = bulkSel.has(item.id);
              const isFind   = item.type === "find";
              const findOpen = findItem?.id === item.id;

              return (
                <div key={item.id}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: isMobile ? "12px 14px" : "14px 20px", borderBottom: "1px solid #f0ebe3", background: isBulked ? TBG[item.type] : "var(--ly-bg)", transition: "background 0.15s" }}>
                    {showBulk && (
                      <input type="checkbox" checked={isBulked} onChange={() => toggleBulk(item.id)}
                        style={{ marginTop: "2px", flexShrink: 0, accentColor: hc }} />
                    )}
                    <button onClick={() => toggleCheck(item.id)} style={{
                      width: "16px", height: "16px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                      border: `1.5px solid ${isDone ? hc : "rgba(var(--ly-accent-rgb), 0.25)"}`, background: isDone ? hc : "var(--ly-bg)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", padding: 0, transition: "all 0.15s",
                    }}>
                      {isDone && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: "13px", lineHeight: 1.5, color: isDone ? "#8a7455" : "#1c1410", textDecoration: isDone ? "line-through" : "none" }}>
                        {item.text}
                      </span>
                      {(item.schedule || item.forwardLogs?.length || item.findFacts?.length) && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                          {item.schedule && (
                            <span style={{ fontSize: "10px", color: "#4a7a72", border: "1px solid #cde3dc", padding: "2px 6px", borderRadius: "999px" }}>
                              {item.schedule.status || "scheduled"} {item.schedule.scheduledFor ? new Date(item.schedule.scheduledFor).toLocaleString() : ""}
                            </span>
                          )}
                          {item.forwardLogs?.length > 0 && (
                            <span style={{ fontSize: "10px", color: "#8a5a44", border: "1px solid #e8d4ca", padding: "2px 6px", borderRadius: "999px" }}>
                              forwarded {item.forwardLogs.length}x
                            </span>
                          )}
                          {item.findFacts?.length > 0 && (
                            <span style={{ fontSize: "10px", color: "#5c6f9b", border: "1px solid #d5dcee", padding: "2px 6px", borderRadius: "999px" }}>
                              saved facts: {item.findFacts.length}
                            </span>
                          )}
                        </div>
                      )}
                      {isFind && activeType === "find" && (
                        <div style={{ marginTop: "5px" }}>
                          {isPro ? (
                            <button onClick={() => (findOpen ? closeFindPanel({ completed: false }) : openFindPanel(item))}
                              style={{ fontSize: "10px", fontWeight: 600, color: TC.find, background: "none", border: `1px solid ${TBORDER.find}`, padding: "3px 10px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                              {findOpen ? "Close" : "Ask Lyme"}
                            </button>
                          ) : (
                            <button onClick={() => setAuthPrompt("upgrade")}
                              style={{ fontSize: "11px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                              title="Available on the $15/mo plan">
                              🔒
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <select value={item.type} onChange={e => retagItem(item.id, e.target.value)}
                      style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", padding: "5px 10px", border: "none", borderRadius: "4px", background: TBG[item.type], color: TC[item.type], cursor: "pointer", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>
                      {ACTION_TYPES.map(t => <option key={t} value={t}>{t === "none" ? "—" : t}</option>)}
                    </select>
                  </div>
                  {findOpen && <NewFindPanel item={item} goal={goal} onSaveFact={(fact) => saveFindFact(item.id, fact)} onClose={closeFindPanel} />}
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
              <button onClick={() => openBulkModal(activeType)} disabled={bulkSel.size === 0}
                style={{ fontSize: "11px", fontWeight: 600, color: "white", background: bulkSel.size > 0 ? hc : "#c4b8a8", border: "none", padding: "7px 16px", cursor: bulkSel.size > 0 ? "pointer" : "default", fontFamily: "'Inter', sans-serif", letterSpacing: "0.04em" }}>
                {activeType === "forward" ? "Forward selected →" : "Schedule selected →"}
              </button>
            </div>
          )}
          </div> {/* closes white card */}
        </div> {/* closes content */}
        </div> {/* closes centering wrapper */}
        </div> {/* closes body flex */}
        </div>{/* end fade wrapper */}
      </div> {/* closes right column */}
    </div>
    </>
  );
}
