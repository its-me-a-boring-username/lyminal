import { useState } from "react";
import { supabase } from "../supabaseClient.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');`;

/**
 * MagicLinkAuth — reusable auth prompt component
 *
 * Props:
 *   context: "save_chart" | "save_plan" | "upgrade"
 *   onSkip: () => void  — called when user dismisses (null = no skip allowed)
 *   onSuccess: (session) => void — called after magic link sent
 */
export function MagicLinkAuth({ context, onSkip, onSuccess, leftOffset = 0 }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const copy = {
    save_chart: {
      eyebrow: "Save your progress",
      heading: "Your chart is ready to save",
      body: "Create a free account to save your goal chart and pick up where you left off on any device.",
      skip: "Continue without saving",
    },
    save_plan: {
      eyebrow: "Don't lose your plan",
      heading: "Save the plan Lyme built for you",
      body: "Create a free account to save your action items and come back to them anytime.",
      skip: "I'll risk losing it",
    },
    upgrade: {
      eyebrow: "Account required",
      heading: "Create a free account first",
      body: "You need an account before upgrading. It only takes your email — no password needed.",
      skip: null,
    },
  }[context];

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const redirectTo = window.location.origin;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, left: leftOffset, zIndex: 1000,
      background: "rgba(28,20,16,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem",
      animation: "fadeIn 0.2s ease-out",
    }}>
      <style>{FONTS}</style>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{
        background: "#faf8f5", width: "100%", maxWidth: "420px",
        padding: "2.5rem", position: "relative",
        animation: "slideUp 0.25s ease-out",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
      }}>
        {/* Eyebrow */}
        <p style={{
          fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase",
          color: "#b5472a", fontWeight: 600, marginBottom: "0.75rem",
          fontFamily: "'Inter', sans-serif",
        }}>
          {copy.eyebrow}
        </p>

        {/* Heading */}
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: "1.6rem",
          fontWeight: 600, color: "#1c1410", lineHeight: 1.25, marginBottom: "0.75rem",
        }}>
          {copy.heading}
        </h2>

        {/* Body */}
        <p style={{
          fontSize: "0.875rem", color: "#5c4e40", lineHeight: 1.6,
          marginBottom: "1.75rem", fontFamily: "'Inter', sans-serif", fontWeight: 300,
        }}>
          {copy.body}
        </p>

        {!sent ? (
          <>
            {/* No password callout */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              marginBottom: "1rem",
            }}>
              <div style={{ width: "1.5rem", height: "1px", background: "#d4c9bb" }} />
              <p style={{ fontSize: "0.7rem", color: "#8a7455", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>
                No password needed — ever
              </p>
              <div style={{ flex: 1, height: "1px", background: "#d4c9bb" }} />
            </div>

            {/* Email input */}
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              style={{
                width: "100%", padding: "0.875rem 1rem",
                border: "1.5px solid #d4c9bb",
                fontSize: "0.9rem", outline: "none",
                background: "white", marginBottom: "0.75rem",
                fontFamily: "'Inter', sans-serif", color: "#1c1410",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "#b5472a"}
              onBlur={e => e.target.style.borderColor = "#d4c9bb"}
            />

            {error && (
              <p style={{ fontSize: "0.78rem", color: "#b5472a", marginBottom: "0.75rem", fontFamily: "'Inter', sans-serif" }}>
                {error}
              </p>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={loading || !email.trim()}
              style={{
                width: "100%", padding: "0.875rem",
                background: email.trim() ? "#b5472a" : "#d4c9bb",
                color: "white", border: "none",
                fontSize: "0.78rem", fontWeight: 600,
                letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: email.trim() ? "pointer" : "default",
                fontFamily: "'Inter', sans-serif",
                transition: "background 0.15s, opacity 0.15s",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Sending..." : "Send me a link →"}
            </button>

            {/* Skip */}
            {copy.skip && onSkip && (
              <button
                onClick={onSkip}
                style={{
                  width: "100%", marginTop: "0.875rem", padding: "0.5rem",
                  background: "transparent", border: "none",
                  fontSize: "0.78rem", color: "#8a7455",
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  textDecoration: "underline", textUnderlineOffset: "3px",
                }}
              >
                {copy.skip}
              </button>
            )}
          </>
        ) : (
          /* Sent state */
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "50%",
              background: "#4a7a72", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 1.25rem",
            }}>
              <span style={{ color: "white", fontSize: "1.25rem" }}>✓</span>
            </div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif", fontSize: "1.2rem",
              color: "#1c1410", marginBottom: "0.5rem",
            }}>
              Check your email
            </h3>
            <p style={{
              fontSize: "0.85rem", color: "#5c4e40", lineHeight: 1.6,
              fontFamily: "'Inter', sans-serif", fontWeight: 300,
            }}>
              We sent a link to <strong style={{ fontWeight: 500 }}>{email}</strong>.
              Click it to sign in — no password needed.
            </p>
            {copy.skip && onSkip && (
              <button
                onClick={onSkip}
                style={{
                  marginTop: "1.5rem", background: "transparent", border: "none",
                  fontSize: "0.78rem", color: "#8a7455", cursor: "pointer",
                  fontFamily: "'Inter', sans-serif", textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Continue without an account for now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
