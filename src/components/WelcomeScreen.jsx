import { FONTS } from "../constants.js";
import { TriangleLogo } from "./TriangleLogo.jsx";
import constellationUrl from "../assets/sphere-constellation.svg";

const PILLS = [
  { label: "Finances",  bg: "rgba(181,71,42,0.10)",  color: "#7a3520", border: "rgba(181,71,42,0.20)"  },
  { label: "Work",      bg: "rgba(74,104,140,0.09)",  color: "#3a4e80", border: "rgba(74,104,140,0.20)" },
  { label: "Family",    bg: "rgba(155,107,138,0.10)", color: "#6e3a60", border: "rgba(155,107,138,0.20)"},
  { label: "Health",    bg: "rgba(74,122,114,0.10)",  color: "#2e6058", border: "rgba(74,122,114,0.20)" },
  { label: "Community", bg: "rgba(130,90,70,0.09)",   color: "#6a4030", border: "rgba(130,90,70,0.20)"  },
  { label: "Fun",       bg: "rgba(181,146,42,0.10)",  color: "#6e5810", border: "rgba(181,146,42,0.22)" },
];

export function WelcomeScreen({ setStep, DevReset, setAuthPrompt }) {
  return (
    <>
      <DevReset />
      <div style={{
        minHeight: "100vh",
        background: "#faf8f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}>
        <style>{FONTS}</style>

        {/* Constellation background */}
        <img
          src={constellationUrl}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {/* Content card */}
        <div style={{
          position: "relative",
          zIndex: 1,
          background: "rgba(250,248,245,0.93)",
          boxShadow: "0 4px 40px rgba(28,20,16,0.10)",
          padding: "52px 88px 60px",
          width: "min(960px, calc(100vw - 48px))",
          textAlign: "center",
        }}>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <TriangleLogo size={64} />
          </div>

          <p style={{
            fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#b5472a", fontWeight: 500, marginBottom: "16px",
            fontFamily: "'Inter', sans-serif",
          }}>
            Lyminal
          </p>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.75rem", fontWeight: 700,
            color: "#1c1410", lineHeight: 1.0,
            marginBottom: "24px", letterSpacing: "-0.02em",
          }}>
            Find Your <em style={{ color: "#b5472a", fontStyle: "italic" }}>Focus</em>
          </h1>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginBottom: "28px" }}>
            {PILLS.map(p => (
              <span key={p.label} style={{
                padding: "6px 16px", borderRadius: "999px",
                fontSize: "11px", fontWeight: 500,
                background: p.bg, color: p.color,
                border: `1px solid ${p.border}`,
                fontFamily: "'Inter', sans-serif",
              }}>
                {p.label}
              </span>
            ))}
          </div>

          <p style={{
            fontSize: "14px", color: "#5c4e40",
            lineHeight: 1.6, fontWeight: 300,
            marginBottom: "40px", fontFamily: "'Inter', sans-serif",
          }}>
            Map the areas of your life, see how they support each other,
            and find where to focus first.
          </p>

          <button
            onClick={() => setStep("intro-spheres")}
            style={{
              display: "inline-block", padding: "14px 48px",
              background: "#b5472a", color: "white",
              fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase",
              border: "none", cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              marginBottom: "16px",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.target.style.opacity = "0.88"}
            onMouseLeave={e => e.target.style.opacity = "1"}
          >
            Get Started →
          </button>

          {setAuthPrompt && (
            <p style={{ fontSize: "11.5px", color: "#8a7455", fontFamily: "'Inter', sans-serif" }}>
              Already have an account?{" "}
              <button
                onClick={() => setAuthPrompt("signin")}
                style={{
                  color: "#b5472a", background: "none", border: "none",
                  cursor: "pointer", fontWeight: 500,
                  fontSize: "11.5px", fontFamily: "'Inter', sans-serif", padding: 0,
                }}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
