import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { clearChart } from "../utils/supabase.js";
import { postJson } from "../utils/api.js";
import { FONTS } from "../constants.js";

const THEMES_LIST = [
  { key: "warm_earth",       label: "Warm earth",        desc: "Richer ochre-red, darker sage.",      c1: "#8a2010", c2: "#1e3c20", swatches: ["#8a2010","#1e3c20","#f0e8e0","#c8a882","#faf8f5"] },
  { key: "terracotta_sage",  label: "Terracotta & sage",  desc: "Deep burnt clay, forest sage.",       c1: "#7a3020", c2: "#2a4828", swatches: ["#7a3020","#2a4828","#f0e8d8","#a0b088","#faf7f5"] },
  { key: "plum_teal",        label: "Plum & teal",        desc: "Deep plum, dark teal. Rich and moody.", c1: "#4a1050", c2: "#0a3840", swatches: ["#4a1050","#0a3840","#ddd0e8","#6890a0","#f8f5f8"] },
  { key: "blush_eucalyptus", label: "Blush & eucalyptus", desc: "Deep rose, dark eucalyptus.",         c1: "#701828", c2: "#1a3828", swatches: ["#701828","#1a3828","#ead8d0","#8aa098","#faf5f5"] },
  { key: "forest",           label: "Forest",             desc: "Deep pine to mint.",                  c1: "#143820", c2: "#60c870", swatches: ["#143820","#2a6838","#60c870","#b0d8b8","#f4f8f5"] },
  { key: "violet",           label: "Violet",             desc: "Deep violet to lavender.",             c1: "#380870", c2: "#9060d0", swatches: ["#380870","#6030b0","#9060d0","#c8b8e8","#f6f4fa"] },
  { key: "rose",             label: "Rose",               desc: "Deep crimson to blush.",               c1: "#680818", c2: "#c86070", swatches: ["#680818","#a83050","#c86070","#e8a8b0","#faf4f5"] },
  { key: "ocean",            label: "Ocean",              desc: "Deep navy to sky.",                    c1: "#081838", c2: "#4090c8", swatches: ["#081838","#1048a0","#4090c8","#90c4e0","#f4f8fc"] },
  { key: "ink",              label: "Ink",                desc: "Pure contrast.",                       c1: "#0a0a0a", c2: "#606060", swatches: ["#0a0a0a","#303030","#686868","#b0b0b0","#f5f5f5"] },
];

export function AccountScreen({ session, tier, isPaid, setAuthPrompt, selectedTheme, setSelectedTheme, appearance, setAppearance, isMobile, NavBar, AuthOverlay }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [visible, setVisible] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [nextEmail, setNextEmail] = useState("");
  const [changeBusy, setChangeBusy] = useState(false);
  const [changeMsg, setChangeMsg] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const sectionLabel = { fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#b5472a", fontWeight: 600, margin: "0 0 12px", fontFamily: "'Inter',sans-serif" };
  const card = { background: "white", border: "1px solid #e8e0d5", marginBottom: "32px", borderRadius: "8px", overflow: "hidden" };
  const row = (last) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: last ? "none" : "1px solid #f0e8df" });
  const btn = (variant) => ({
    fontSize: "12px",
    fontWeight: 500,
    padding: "6px 14px",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    ...(variant === "primary" ? { background: "#b5472a", color: "white", fontWeight: 600, padding: "6px 16px" } : {}),
    ...(variant === "danger" ? { background: "none", color: "#9b2a2a", border: "1px solid #e8aaaa" } : {}),
    ...(variant === "default" ? { background: "none", color: "#5c4e40", border: "1px solid #e8e0d5" } : {}),
    ...(variant === "ochre" ? { background: "none", color: "#b5472a", border: "1px solid #e8e0d5" } : {}),
  });

  const handleEmailChange = async () => {
    if (!nextEmail.trim()) return;
    setChangeBusy(true);
    setChangeMsg("");
    try {
      const { error } = await supabase.auth.updateUser({ email: nextEmail.trim() });
      if (error) throw error;
      setChangeMsg("Confirmation sent. Check both your old and new inboxes to finish the change.");
      setChangeOpen(false);
      setNextEmail("");
    } catch (error) {
      setChangeMsg(error?.message || "Could not start email change.");
    } finally {
      setChangeBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;
    const confirmed = window.confirm("Delete your account and all data now? This cannot be undone.");
    if (!confirmed) return;

    setDeleteBusy(true);
    try {
      await postJson("/api/account/delete", {}, session);
      localStorage.removeItem("goalchart_state");
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      alert(error?.message || "Failed to delete account.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    if (!session?.user?.id) return;
    setBillingBusy(true);
    try {
      const data = await postJson("/api/billing/create-portal-session", {}, session);
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      alert(error?.message || "Could not open billing portal.");
    } finally {
      setBillingBusy(false);
    }
  };

  return (
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter',sans-serif" }}>
      <style>{FONTS}</style>
      <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "#b5472a" }} />
      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        {!isMobile && <NavBar />}
        {isMobile && <NavBar />}
        <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease-out" }}>
        <div className="lg:px-16" style={{ background: "rgba(181,71,42,0.07)", borderBottom: "1px solid rgba(181,71,42,0.12)", padding: "28px 24px 24px" }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: "#b5472a", opacity: 0.8, margin: "0 0 6px" }}>Your Account</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 4px" }}>Settings</h2>
          <p style={{ fontSize: "0.8rem", color: "#5c4e40", fontWeight: 300, margin: 0, lineHeight: 1.5, fontFamily: "'Inter',sans-serif" }}>Manage your profile, billing, and how the app looks and feels.</p>
        </div>
        <div className="px-6 py-8 max-w-4xl mx-auto w-full lg:px-16 pb-24 lg:pb-12">
          <AuthOverlay />

          <p style={sectionLabel}>Account & Data</p>
          <div style={card}>
            <div style={row(false)}>
              <div>
                <p style={{ fontSize: "0.68rem", color: "#8a7455", margin: "0 0 2px", fontFamily: "'Inter',sans-serif" }}>Email address</p>
                <p style={{ fontSize: "0.875rem", color: "#1c1410", margin: 0, fontFamily: "'Inter',sans-serif" }}>{session?.user?.email || "Not signed in"}</p>
              </div>
              <button style={btn("ochre")} onClick={() => setChangeOpen((v) => !v)}>Change</button>
            </div>

            {changeOpen && (
              <div style={{ padding: "0 22px 18px", borderBottom: "1px solid #f0e8df" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="email"
                    placeholder="new@email.com"
                    value={nextEmail}
                    onChange={(e) => setNextEmail(e.target.value)}
                    style={{ flex: 1, border: "1px solid #d4c9bb", padding: "8px 10px", fontSize: "12px", fontFamily: "'Inter',sans-serif" }}
                  />
                  <button style={btn("primary")} disabled={changeBusy || !nextEmail.trim()} onClick={handleEmailChange}>
                    {changeBusy ? "Sending..." : "Send"}
                  </button>
                </div>
                <p style={{ fontSize: "11px", color: "#8a7455", margin: "8px 0 0", fontFamily: "'Inter',sans-serif" }}>
                  Supabase will send secure confirmation links to complete the email change.
                </p>
              </div>
            )}

            {changeMsg && (
              <div style={{ padding: "0 22px 14px", borderBottom: "1px solid #f0e8df" }}>
                <p style={{ fontSize: "11px", color: "#5c4e40", margin: 0, fontFamily: "'Inter',sans-serif" }}>{changeMsg}</p>
              </div>
            )}

            <div style={row(false)}>
              <p style={{ fontSize: "0.875rem", color: "#1c1410", margin: 0, fontFamily: "'Inter',sans-serif" }}>Sign out</p>
              <button style={btn("default")} onClick={async () => { await supabase.auth.signOut(); location.reload(); }}>Sign out</button>
            </div>

            <div style={row(true)}>
              <div>
                <p style={{ fontSize: "0.875rem", color: "#9b2a2a", margin: 0, fontFamily: "'Inter',sans-serif" }}>Delete account & all data</p>
                <p style={{ fontSize: "0.68rem", color: "#8a7455", margin: "2px 0 0", fontFamily: "'Inter',sans-serif" }}>This cannot be undone</p>
              </div>
              <button style={btn("danger")} disabled={deleteBusy} onClick={handleDeleteAccount}>{deleteBusy ? "Deleting..." : "Delete"}</button>
            </div>
          </div>

          <p style={sectionLabel}>Plan & Billing</p>
          <div style={card}>
            <div style={row(false)}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <p style={{ fontSize: "0.875rem", color: "#1c1410", margin: 0, fontFamily: "'Inter',sans-serif" }}>Current plan</p>
                <span style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", background: "#f0e8df", color: "#6e5c4a", padding: "3px 8px", fontFamily: "'Inter',sans-serif" }}>
                  {tier === "paid_2" ? "PRO" : tier === "paid_1" ? "STANDARD" : "FREE"}
                </span>
              </div>
              {isPaid ? (
                <button style={btn("default")} onClick={handleOpenBillingPortal} disabled={billingBusy}>{billingBusy ? "Opening..." : "Manage billing"}</button>
              ) : (
                <button style={btn("primary")} onClick={() => setAuthPrompt("upgrade")}>Upgrade -&gt;</button>
              )}
            </div>
            <div style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: "0.8rem", color: "#8a7455", margin: 0, lineHeight: 1.6, fontFamily: "'Inter',sans-serif" }}>
                {isPaid ? "You have access to all premium features: multiple goals, full reports, and planning tools." : "Upgrade to track multiple goals, download your full report, and access planning tools."}
              </p>
            </div>
          </div>

          <p style={sectionLabel}>Chart Settings & Appearance</p>
          <div style={card}>
            <div style={row(false)}>
              <div>
                <p style={{ fontSize: "0.875rem", color: "#1c1410", margin: 0, fontFamily: "'Inter',sans-serif" }}>Reset your chart</p>
                <p style={{ fontSize: "0.68rem", color: "#8a7455", margin: "2px 0 0", fontFamily: "'Inter',sans-serif" }}>Start over with new spheres and goals</p>
              </div>
              {confirmReset ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#9b2a2a", fontFamily: "'Inter',sans-serif" }}>Are you sure?</span>
                  <button style={btn("danger")} onClick={() => { localStorage.removeItem("goalchart_state"); clearChart(session); location.reload(); }}>Yes, reset</button>
                  <button style={btn("default")} onClick={() => setConfirmReset(false)}>Cancel</button>
                </div>
              ) : (
                <button style={btn("default")} onClick={() => setConfirmReset(true)}>Reset</button>
              )}
            </div>

            <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0e8df" }}>
              <p style={{ fontSize: "0.68rem", color: "#8a7455", margin: "0 0 10px", fontFamily: "'Inter',sans-serif" }}>Appearance</p>
              <div style={{ display: "flex", gap: "8px" }}>
                {["system", "light", "dark"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAppearance(mode)}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontFamily: "'Inter',sans-serif",
                      fontWeight: appearance === mode ? 600 : 400,
                      background: appearance === mode ? "#1c1410" : "none",
                      color: appearance === mode ? "white" : "#8a7455",
                      border: appearance === mode ? "1px solid #1c1410" : "1px solid #e8e0d5",
                      borderRadius: "6px",
                    }}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: "0.68rem", color: "#8a7455", margin: "0 0 14px", fontFamily: "'Inter',sans-serif" }}>Theme</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px" }}>
                {THEMES_LIST.map((t) => {
                  const active = selectedTheme === t.key;
                  return (
                    <button key={t.key} onClick={() => setSelectedTheme(t.key)} style={{
                      background: "white",
                      border: active ? `2px solid ${t.c1}` : "1.5px solid #e8e0d5",
                      borderRadius: "10px",
                      overflow: "hidden",
                      cursor: "pointer",
                      padding: 0,
                      textAlign: "left",
                      transition: "border-color 0.15s",
                      outline: "none",
                    }}>
                      {/* Color swatch strip */}
                      <div style={{ display: "flex", height: "36px" }}>
                        {t.swatches.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
                      </div>
                      {/* Mini preview */}
                      <div style={{ padding: "8px 10px", background: t.swatches[4] }}>
                        <div style={{ background: t.c1, color: "white", fontSize: "8px", fontWeight: 700, letterSpacing: "0.07em", padding: "3px 7px", borderRadius: "3px", marginBottom: "5px", display: "inline-block" }}>
                          GET STARTED →
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "8px", padding: "2px 6px", borderRadius: "999px", background: t.c1 + "20", color: t.c1, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>Work</span>
                        </div>
                        <div style={{ height: "2px", background: t.c2, borderRadius: "1px", width: "36px" }} />
                      </div>
                      {/* Label */}
                      <div style={{ padding: "7px 10px 8px" }}>
                        <p style={{ fontSize: "10px", fontWeight: 600, color: "#1c1410", margin: "0 0 2px", fontFamily: "'Inter',sans-serif" }}>{t.label}</p>
                        <p style={{ fontSize: "9px", color: "#8a7455", margin: 0, lineHeight: 1.3, fontFamily: "'Inter',sans-serif" }}>{t.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </div>{/* end fade wrapper */}
      </div>
    </div>
  );
}