import { useState } from "react";
import { supabase } from "../supabaseClient.js";
import { clearChart } from "../utils/supabase.js";
import { FONTS } from "../constants.js";

const THEMES_LIST = [
  { key: "warm_earth",        label: "Warm earth",  multi: true,  c1: "#b5472a", c2: "#4a7a72" },
  { key: "terracotta_sage",   label: "Terracotta",  multi: true,  c1: "#b5614a", c2: "#8fa882" },
  { key: "plum_teal",         label: "Plum & teal", multi: true,  c1: "#9b6b8a", c2: "#7a9e8e" },
  { key: "blush_eucalyptus",  label: "Blush",       multi: true,  c1: "#c17a6f", c2: "#8aab9e" },
  { key: "forest",            label: "Forest",      multi: false, c1: "#1a4a30" },
  { key: "violet",            label: "Violet",      multi: false, c1: "#4a1a7a" },
  { key: "rose",              label: "Rose",        multi: false, c1: "#6e1a2e" },
  { key: "ocean",             label: "Ocean",       multi: false, c1: "#0e3a5c" },
  { key: "ink",               label: "Ink",         multi: false, c1: "#0a0a0a" },
];

export function AccountScreen({ session, tier, isPaid, setAuthPrompt, selectedTheme, setSelectedTheme, appearance, setAppearance, isMobile, NavBar, AuthOverlay }) {
  const [confirmReset, setConfirmReset] = useState(false);

  const sectionLabel = { fontSize:"0.65rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"#b5472a", fontWeight:600, margin:"0 0 12px", fontFamily:"'Inter',sans-serif" };
  const card = { background:"white", border:"1px solid #e8e0d5", marginBottom:"28px", borderRadius:"8px", overflow:"hidden" };
  const row = (last) => ({ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom: last ? "none" : "1px solid #f0e8df" });
  const btn = (variant) => ({
    fontSize:"12px", fontWeight:500, padding:"6px 14px", cursor:"pointer", border:"none", borderRadius:"6px",
    ...(variant === "primary" ? { background:"#b5472a", color:"white", fontWeight:600, padding:"6px 16px" } : {}),
    ...(variant === "danger"  ? { background:"none", color:"#9b2a2a", border:"1px solid #e8aaaa" } : {}),
    ...(variant === "default" ? { background:"none", color:"#5c4e40", border:"1px solid #e8e0d5" } : {}),
    ...(variant === "ochre"   ? { background:"none", color:"#b5472a", border:"1px solid #e8e0d5" } : {}),
  });

  return (
    <div className="min-h-screen lg:flex" style={{background:"#faf8f5", fontFamily:"'Inter',sans-serif"}}>
      <style>{FONTS}</style>
      <div className="hidden lg:block flex-shrink-0" style={{width:"350px", background:"#b5472a"}} />
      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        {!isMobile && <NavBar />}
        {isMobile && <NavBar />}
        <div style={{background:"rgba(181,71,42,0.07)", borderBottom:"1px solid rgba(181,71,42,0.12)", padding:"28px 24px 24px"}}>
          <div className="max-w-2xl mx-auto lg:px-16">
            <p style={{fontSize:"0.65rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"#8a7455", margin:"0 0 6px", fontFamily:"'Inter',sans-serif"}}>Account</p>
            <h2 style={{fontFamily:"'Playfair Display',serif", fontSize:"1.75rem", fontWeight:600, color:"#1c1410", margin:0}}>Settings</h2>
          </div>
        </div>
        <div className="px-6 py-8 max-w-2xl mx-auto w-full lg:px-16 pb-24 lg:pb-12">
          <AuthOverlay />

          {/* Account & Data */}
          <p style={sectionLabel}>Account & Data</p>
          <div style={card}>
            <div style={row(false)}>
              <div>
                <p style={{fontSize:"0.68rem", color:"#8a7455", margin:"0 0 2px", fontFamily:"'Inter',sans-serif"}}>Email address</p>
                <p style={{fontSize:"0.875rem", color:"#1c1410", margin:0, fontFamily:"'Inter',sans-serif"}}>{session?.user?.email || "Not signed in"}</p>
              </div>
              <button style={btn("ochre")} onClick={() => alert("Change email coming soon")}>Change</button>
            </div>
            <div style={row(false)}>
              <p style={{fontSize:"0.875rem", color:"#1c1410", margin:0, fontFamily:"'Inter',sans-serif"}}>Sign out</p>
              <button style={btn("default")} onClick={async () => { await supabase.auth.signOut(); location.reload(); }}>Sign out</button>
            </div>
            <div style={row(true)}>
              <div>
                <p style={{fontSize:"0.875rem", color:"#9b2a2a", margin:0, fontFamily:"'Inter',sans-serif"}}>Delete account & all data</p>
                <p style={{fontSize:"0.68rem", color:"#8a7455", margin:"2px 0 0", fontFamily:"'Inter',sans-serif"}}>This cannot be undone</p>
              </div>
              <button style={btn("danger")} onClick={() => alert("Delete account coming soon")}>Delete</button>
            </div>
          </div>

          {/* Plan & Billing */}
          <p style={sectionLabel}>Plan & Billing</p>
          <div style={card}>
            <div style={row(false)}>
              <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
                <p style={{fontSize:"0.875rem", color:"#1c1410", margin:0, fontFamily:"'Inter',sans-serif"}}>Current plan</p>
                <span style={{fontSize:"0.6rem", fontWeight:600, letterSpacing:"0.08em", background:"#f0e8df", color:"#6e5c4a", padding:"3px 8px", fontFamily:"'Inter',sans-serif"}}>
                  {tier === "paid_2" ? "PRO" : tier === "paid_1" ? "STANDARD" : "FREE"}
                </span>
              </div>
              {!isPaid && <button style={btn("primary")} onClick={() => setAuthPrompt("upgrade")}>Upgrade →</button>}
            </div>
            <div style={{padding:"14px 18px"}}>
              <p style={{fontSize:"0.8rem", color:"#8a7455", margin:0, lineHeight:1.6, fontFamily:"'Inter',sans-serif"}}>
                {isPaid ? "You have access to all premium features — multiple goals, full reports, and planning tools." : "Upgrade to track multiple goals, download your full report, and access planning tools."}
              </p>
            </div>
          </div>

          {/* Chart Settings & Appearance */}
          <p style={sectionLabel}>Chart Settings & Appearance</p>
          <div style={card}>
            {/* Reset chart */}
            <div style={row(false)}>
              <div>
                <p style={{fontSize:"0.875rem", color:"#1c1410", margin:0, fontFamily:"'Inter',sans-serif"}}>Reset your chart</p>
                <p style={{fontSize:"0.68rem", color:"#8a7455", margin:"2px 0 0", fontFamily:"'Inter',sans-serif"}}>Start over with new spheres and goals</p>
              </div>
              {confirmReset ? (
                <div style={{display:"flex", gap:"8px", alignItems:"center"}}>
                  <span style={{fontSize:"0.75rem", color:"#9b2a2a", fontFamily:"'Inter',sans-serif"}}>Are you sure?</span>
                  <button style={btn("danger")} onClick={() => { localStorage.removeItem("goalchart_state"); clearChart(session); location.reload(); }}>Yes, reset</button>
                  <button style={btn("default")} onClick={() => setConfirmReset(false)}>Cancel</button>
                </div>
              ) : (
                <button style={btn("default")} onClick={() => setConfirmReset(true)}>Reset</button>
              )}
            </div>

            {/* Appearance */}
            <div style={{padding:"14px 18px", borderBottom:"1px solid #f0e8df"}}>
              <p style={{fontSize:"0.68rem", color:"#8a7455", margin:"0 0 10px", fontFamily:"'Inter',sans-serif"}}>Appearance</p>
              <div style={{display:"flex", gap:"8px"}}>
                {["system","light","dark"].map(mode => (
                  <button key={mode} onClick={() => setAppearance(mode)} style={{
                    flex:1, padding:"7px 0", fontSize:"12px", cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight: appearance === mode ? 600 : 400,
                    background: appearance === mode ? "#1c1410" : "none",
                    color: appearance === mode ? "white" : "#8a7455",
                    border: appearance === mode ? "1px solid #1c1410" : "1px solid #e8e0d5",
                    borderRadius: "6px",
                  }}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme picker */}
            <div style={{padding:"14px 18px"}}>
              <p style={{fontSize:"0.68rem", color:"#8a7455", margin:"0 0 14px", fontFamily:"'Inter',sans-serif"}}>Theme</p>
              <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"10px", marginBottom:"10px"}}>
                {THEMES_LIST.slice(0,5).map(t => (
                  <button key={t.key} onClick={() => setSelectedTheme(t.key)} style={{display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", background:"none", border:"none", cursor:"pointer", padding:0}}>
                    <div style={{width:"40px", height:"40px", borderRadius:"50%", border: selectedTheme === t.key ? `3px solid ${t.c1}` : "2px solid #e8e0d5", overflow:"hidden", display:"flex"}}>
                      {t.multi ? (<><div style={{flex:1, background:t.c1}}/><div style={{flex:1, background:t.c2}}/></>) : <div style={{flex:1, background:t.c1}}/>}
                    </div>
                    <span style={{fontSize:"10px", color: selectedTheme === t.key ? t.c1 : "#8a7455", fontWeight: selectedTheme === t.key ? 600 : 400, textAlign:"center", lineHeight:1.3, fontFamily:"'Inter',sans-serif"}}>{t.label}</span>
                  </button>
                ))}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px"}}>
                {THEMES_LIST.slice(5).map(t => (
                  <button key={t.key} onClick={() => setSelectedTheme(t.key)} style={{display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", background:"none", border:"none", cursor:"pointer", padding:0}}>
                    <div style={{width:"40px", height:"40px", borderRadius:"50%", border: selectedTheme === t.key ? `3px solid ${t.c1}` : "2px solid #e8e0d5", background:t.c1}}/>
                    <span style={{fontSize:"10px", color: selectedTheme === t.key ? t.c1 : "#8a7455", fontWeight: selectedTheme === t.key ? 600 : 400, textAlign:"center", lineHeight:1.3, fontFamily:"'Inter',sans-serif"}}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
