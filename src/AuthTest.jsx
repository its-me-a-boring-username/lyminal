import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');`;

export default function AuthTest() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = (msg, type = "info") => {
    setLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        addLog(`✓ Existing session found for ${session.user.email}`, "success");
        fetchProfile(session.user.id);
      } else {
        addLog("No existing session", "info");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    addLog(`Fetching profile for user ${userId}...`, "info");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      addLog(`✗ Profile fetch failed: ${error.message}`, "error");
    } else {
      setProfile(data);
      addLog(`✓ Profile found: tier=${data.tier}, email=${data.email}`, "success");
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    addLog(`Attempting sign up for ${email}...`, "info");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      addLog(`✗ Sign up failed: ${error.message}`, "error");
    } else {
      setMessage("Check your email to confirm your account.");
      addLog(`✓ Sign up successful for ${data.user?.email}`, "success");
      addLog("Confirmation email sent — profile will be created on confirm", "info");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    addLog(`Attempting login for ${email}...`, "info");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      addLog(`✗ Login failed: ${error.message}`, "error");
    } else {
      addLog(`✓ Login successful for ${data.user?.email}`, "success");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    addLog("Signing out...", "info");
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    addLog("✓ Signed out", "success");
  };

  const testChartWrite = async () => {
    if (!session) return;
    addLog("Testing chart write...", "info");
    const { error } = await supabase.from("charts").upsert({
      user_id: session.user.id,
      spheres: [{ id: "test-1", name: "Test Sphere", color: "#b5472a", goals: [] }],
      connections: {},
      drag_offsets: {},
    }, { onConflict: "user_id" });

    if (error) {
      addLog(`✗ Chart write failed: ${error.message}`, "error");
    } else {
      addLog("✓ Chart write successful", "success");
    }
  };

  const testChartRead = async () => {
    if (!session) return;
    addLog("Testing chart read...", "info");
    const { data, error } = await supabase
      .from("charts")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      addLog(`✗ Chart read failed: ${error.message}`, "error");
    } else {
      addLog(`✓ Chart read successful — ${data.spheres.length} sphere(s)`, "success");
    }
  };

  const testContentRead = async () => {
    addLog("Testing content table read...", "info");
    const { data, error } = await supabase.from("content").select("*");
    if (error) {
      addLog(`✗ Content read failed: ${error.message}`, "error");
    } else {
      addLog(`✓ Content read successful — ${data.length} rows`, "success");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f5", fontFamily: "'Inter', sans-serif", padding: "2rem" }}>
      <style>{FONTS}</style>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", marginBottom: "0.5rem" }}>
            Supabase Integration Test
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#1c1410", fontWeight: 600, marginBottom: "0.25rem" }}>
            Auth & Database
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#6e5c4a" }}>
            Test signup, login, and database read/write before integrating into the main app.
          </p>
        </div>

        {/* Status */}
        <div style={{ padding: "1rem", border: "1px solid #e8e0d5", background: "white", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: session ? "#4a7a72" : "#b5472a" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#1c1410" }}>
              {session ? `Logged in as ${session.user.email}` : "Not logged in"}
            </span>
          </div>
          {profile && (
            <p style={{ fontSize: "0.75rem", color: "#6e5c4a", marginTop: "0.25rem", marginLeft: "1.25rem" }}>
              Tier: {profile.tier} · Profile ID: {profile.id.slice(0, 8)}...
            </p>
          )}
        </div>

        {/* Auth Form */}
        {!session ? (
          <div style={{ padding: "1.5rem", border: "1px solid #e8e0d5", background: "white", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {["login", "signup"].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{ padding: "0.4rem 1rem", fontSize: "0.75rem", fontWeight: 500, letterSpacing: "0.04em",
                    background: mode === m ? "#b5472a" : "transparent", color: mode === m ? "white" : "#6e5c4a",
                    border: `1px solid ${mode === m ? "#b5472a" : "#d4c9bb"}`, cursor: "pointer", textTransform: "uppercase" }}>
                  {m}
                </button>
              ))}
            </div>

            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d4c9bb", marginBottom: "0.75rem",
                fontSize: "0.9rem", outline: "none", background: "#faf8f5", boxSizing: "border-box" }} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", border: "1px solid #d4c9bb", marginBottom: "1rem",
                fontSize: "0.9rem", outline: "none", background: "#faf8f5", boxSizing: "border-box" }} />

            {error && <p style={{ fontSize: "0.8rem", color: "#b5472a", marginBottom: "0.75rem" }}>{error}</p>}
            {message && <p style={{ fontSize: "0.8rem", color: "#4a7a72", marginBottom: "0.75rem" }}>{message}</p>}

            <button onClick={mode === "login" ? handleLogin : handleSignUp} disabled={loading || !email || !password}
              style={{ width: "100%", padding: "0.75rem", background: "#b5472a", color: "white", border: "none",
                fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.06em", cursor: "pointer", opacity: loading ? 0.6 : 1,
                textTransform: "uppercase" }}>
              {loading ? "..." : mode === "login" ? "LOG IN" : "SIGN UP"}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: "1.5rem" }}>
            {/* DB Tests */}
            <div style={{ padding: "1.5rem", border: "1px solid #e8e0d5", background: "white", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7455", marginBottom: "1rem" }}>
                Database Tests
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {[
                  { label: "Write Chart", fn: testChartWrite },
                  { label: "Read Chart", fn: testChartRead },
                  { label: "Read Content", fn: testContentRead },
                ].map(({ label, fn }) => (
                  <button key={label} onClick={fn}
                    style={{ padding: "0.5rem 1rem", fontSize: "0.75rem", fontWeight: 500, background: "#f0ebe3",
                      border: "1px solid #d4c9bb", color: "#4a3828", cursor: "pointer", letterSpacing: "0.03em" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleLogout}
              style={{ width: "100%", padding: "0.75rem", background: "transparent", color: "#6e5c4a",
                border: "1px solid #d4c9bb", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", letterSpacing: "0.04em",
                textTransform: "uppercase" }}>
              SIGN OUT
            </button>
          </div>
        )}

        {/* Log */}
        <div style={{ padding: "1rem", border: "1px solid #e8e0d5", background: "#1c1410" }}>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7455", marginBottom: "0.75rem" }}>
            Log
          </p>
          {log.length === 0 && (
            <p style={{ fontSize: "0.75rem", color: "#6e5c4a" }}>Waiting...</p>
          )}
          {log.map((entry, i) => (
            <div key={i} style={{ fontSize: "0.75rem", marginBottom: "0.25rem", fontFamily: "monospace",
              color: entry.type === "success" ? "#4a7a72" : entry.type === "error" ? "#b5472a" : "#8a7455" }}>
              <span style={{ color: "#5c4e40", marginRight: "0.5rem" }}>{entry.time}</span>
              {entry.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
