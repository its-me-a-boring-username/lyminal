import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import {
  archiveAndClearChart,
  clearChart,
  deleteArchivedChart,
  loadArchivedCharts,
  readLocalState,
  restoreArchivedChart,
  writeLocalState,
} from "../utils/supabase.js";
import { postJson } from "../utils/api.js";
import { trackUserEvent } from "../utils/events.js";
import { FONTS } from "../constants.js";

const THEMES_LIST = [
  // display c1/c2 are circle preview colors; --ly-accent values in theme.js are the deepened UI colors
  { key: "warm_earth",       label: "Warm earth",       multi: true,  c1: "#b5472a", c2: "#4a7a72" },
  { key: "terracotta_sage",  label: "Terracotta",       multi: true,  c1: "#b5614a", c2: "#6a9870" },
  { key: "plum_teal",        label: "Plum & teal",      multi: true,  c1: "#9050a0", c2: "#207878" },
  { key: "blush_eucalyptus", label: "Blush",            multi: true,  c1: "#b84060", c2: "#4a8870" },
  { key: "forest",           label: "Forest",           multi: false, c1: "#256035" },
  { key: "violet",           label: "Violet",           multi: false, c1: "#5010a0" },
  { key: "rose",             label: "Rose",             multi: false, c1: "#a0102a" },
  { key: "ocean",            label: "Ocean",            multi: false, c1: "#0848a0" },
  { key: "ink",              label: "Ink",              multi: false, c1: "#0a0a0a" },
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
  const [archives, setArchives] = useState([]);
  const [archivesLoading, setArchivesLoading] = useState(false);
  const [archiveBusy, setArchiveBusy] = useState(null);
  const [archiveAction, setArchiveAction] = useState(null);
  const [archiveError, setArchiveError] = useState("");

  useEffect(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setArchives([]);
      return;
    }

    let cancelled = false;
    setArchivesLoading(true);
    setArchiveError("");
    loadArchivedCharts(session)
      .then((items) => { if (!cancelled) setArchives(items); })
      .catch((error) => {
        console.error("[Archives] Failed to load:", error);
        if (!cancelled) setArchiveError("Archived charts are temporarily unavailable.");
      })
      .finally(() => { if (!cancelled) setArchivesLoading(false); });

    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const sectionLabel = { fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ly-accent)", fontWeight: 600, margin: "0 0 12px", fontFamily: "'Inter',sans-serif" };
  const card = { background: "white", border: "1px solid #e8e0d5", marginBottom: "32px", borderRadius: "8px", overflow: "hidden" };
  const row = (last) => ({ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: last ? "none" : "1px solid #f0e8df" });
  const btn = (variant) => ({
    fontSize: "12px",
    fontWeight: 500,
    padding: "6px 14px",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    ...(variant === "primary" ? { background: "var(--ly-accent)", color: "white", fontWeight: 600, padding: "6px 16px" } : {}),
    ...(variant === "danger" ? { background: "none", color: "#9b2a2a", border: "1px solid #e8aaaa" } : {}),
    ...(variant === "default" ? { background: "none", color: "#5c4e40", border: "1px solid #e8e0d5" } : {}),
    ...(variant === "ochre" ? { background: "none", color: "var(--ly-accent)", border: "1px solid #e8e0d5" } : {}),
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
      if (data?.url) {
        trackUserEvent(session, "billing_portal_opened", { source: "account_screen" });
        window.location.href = data.url;
      }
    } catch (error) {
      alert(error?.message || "Could not open billing portal.");
    } finally {
      setBillingBusy(false);
    }
  };

  const handleArchiveReset = async () => {
    if (!session?.user?.id) return;
    setArchiveBusy("reset");
    setArchiveError("");
    const ok = await archiveAndClearChart(session, readLocalState());
    if (ok) {
      localStorage.removeItem("goalchart_state");
      window.location.reload();
      return;
    }
    setArchiveError("Your chart could not be archived, so nothing was reset.");
    setArchiveBusy(null);
  };

  const handleDeleteReset = async () => {
    setArchiveBusy("reset");
    setArchiveError("");
    const ok = session?.user?.id ? await clearChart(session) : true;
    if (ok) {
      localStorage.removeItem("goalchart_state");
      window.location.reload();
      return;
    }
    setArchiveError("Your chart could not be reset, so it is still available.");
    setArchiveBusy(null);
  };

  const handleRestoreArchive = async (archive) => {
    setArchiveBusy(archive.id);
    setArchiveError("");
    const result = await restoreArchivedChart(session, archive);
    if (result.ok) {
      writeLocalState({
        ...result.chart,
        step: result.chart.activeGoals?.length ? "active" : "chart-view",
        updatedAt: new Date().toISOString(),
      });
      window.location.reload();
      return;
    }
    setArchiveError("The archived chart could not be reopened. Your preserved versions are still available here.");
    setArchiveBusy(null);
  };

  const handleDeleteArchive = async (archiveId) => {
    setArchiveBusy(archiveId);
    setArchiveError("");
    try {
      await deleteArchivedChart(session, archiveId);
      setArchives((items) => items.filter((item) => item.id !== archiveId));
      setArchiveAction(null);
    } catch (error) {
      console.error("[Archives] Failed to delete:", error);
      setArchiveError("The archived chart could not be deleted.");
    } finally {
      setArchiveBusy(null);
    }
  };

  return (
    <div className="min-h-screen lg:flex" style={{ background: "#faf8f5", fontFamily: "'Inter',sans-serif" }}>
      <style>{FONTS}</style>
      <div className="hidden lg:block flex-shrink-0" style={{ width: "350px", background: "var(--ly-accent)" }} />
      <div className="w-full lg:flex-1 lg:flex lg:flex-col">
        {!isMobile && <NavBar />}
        {isMobile && <NavBar />}
        <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease-out" }}>
        <div className="lg:px-16" style={{ background: "rgba(var(--ly-accent-rgb), 0.07)", borderBottom: "1px solid rgba(var(--ly-accent-rgb), 0.12)", padding: "28px 24px 24px" }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--ly-accent)", opacity: 0.8, margin: "0 0 6px" }}>Your Account</p>
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

          <p style={sectionLabel}>Archived Charts</p>
          <div style={card}>
            {!session?.user?.id ? (
              <div style={{ padding: "20px 22px" }}>
                <p style={{ fontSize: "0.8rem", color: "#5c4e40", margin: 0, lineHeight: 1.6 }}>Sign in to keep and reopen archived chart versions.</p>
              </div>
            ) : archivesLoading ? (
              <div style={{ padding: "20px 22px", fontSize: "0.8rem", color: "#8a7455" }}>Loading archived charts...</div>
            ) : archives.length === 0 ? (
              <div style={{ padding: "20px 22px" }}>
                <p style={{ fontSize: "0.8rem", color: "#5c4e40", margin: "0 0 4px", lineHeight: 1.6 }}>No archived charts yet.</p>
                <p style={{ fontSize: "0.68rem", color: "#8a7455", margin: 0, lineHeight: 1.5 }}>When you archive a chart or reopen an older version, preserved versions will appear here.</p>
              </div>
            ) : archives.map((archive, index) => {
              const sphereCount = archive.snapshot?.spheres?.length || 0;
              const goalCount = archive.snapshot?.activeGoals?.length || 0;
              const action = archiveAction?.id === archive.id ? archiveAction.type : null;
              return (
                <div key={archive.id} style={{ ...row(index === archives.length - 1), alignItems: action ? "flex-start" : "center" }}>
                  <div style={{ minWidth: 0, paddingRight: "16px" }}>
                    <p style={{ fontSize: "0.875rem", color: "#1c1410", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{archive.title}</p>
                    <p style={{ fontSize: "0.68rem", color: "#8a7455", margin: 0 }}>
                      {new Date(archive.archived_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} · {sphereCount} {sphereCount === 1 ? "sphere" : "spheres"} · {goalCount} {goalCount === 1 ? "goal" : "goals"}
                    </p>
                  </div>
                  {action ? (
                    <div style={{ textAlign: "right", maxWidth: "310px" }}>
                      <p style={{ fontSize: "0.72rem", color: action === "delete" ? "#9b2a2a" : "#5c4e40", margin: "0 0 8px", lineHeight: 1.45 }}>
                        {action === "delete" ? "Delete this archived chart permanently?" : "Reopen this chart? Your current active chart will be archived first."}
                      </p>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          style={btn(action === "delete" ? "danger" : "primary")}
                          disabled={archiveBusy === archive.id}
                          onClick={() => action === "delete" ? handleDeleteArchive(archive.id) : handleRestoreArchive(archive)}
                        >
                          {archiveBusy === archive.id ? "Working..." : action === "delete" ? "Delete permanently" : "Reopen"}
                        </button>
                        <button style={btn("default")} disabled={archiveBusy === archive.id} onClick={() => setArchiveAction(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <button style={btn("primary")} disabled={archiveBusy !== null} onClick={() => setArchiveAction({ id: archive.id, type: "restore" })}>Reopen</button>
                      <button style={btn("danger")} disabled={archiveBusy !== null} onClick={() => setArchiveAction({ id: archive.id, type: "delete" })}>Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {archiveError && (
            <p style={{ fontSize: "0.72rem", color: "#9b2a2a", margin: "-20px 0 28px", lineHeight: 1.5 }}>{archiveError}</p>
          )}

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
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {session?.user?.id && (
                    <button style={btn("primary")} disabled={archiveBusy === "reset"} onClick={handleArchiveReset}>
                      {archiveBusy === "reset" ? "Working..." : "Archive & start over"}
                    </button>
                  )}
                  <button style={btn("danger")} disabled={archiveBusy === "reset"} onClick={handleDeleteReset}>
                    {archiveBusy === "reset" ? "Working..." : session?.user?.id ? "Delete & start over" : "Delete local chart"}
                  </button>
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
              <p style={{ fontSize: "0.68rem", color: "#8a7455", margin: "0 0 14px", fontFamily: "’Inter’,sans-serif" }}>Theme</p>
              {/* Multi-tone themes — 5 columns */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "10px", marginBottom: "10px" }}>
                {THEMES_LIST.slice(0, 5).map(t => (
                  <button key={t.key} onClick={() => setSelectedTheme(t.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: selectedTheme === t.key ? `3px solid ${t.c1}` : "2px solid #e8e0d5", overflow: "hidden", display: "flex", flexShrink: 0 }}>
                      {t.multi
                        ? (<><div style={{ flex: 1, background: t.c1 }} /><div style={{ flex: 1, background: t.c2 }} /></>)
                        : <div style={{ flex: 1, background: t.c1 }} />
                      }
                    </div>
                    <span style={{ fontSize: "9px", color: selectedTheme === t.key ? t.c1 : "#8a7455", fontWeight: selectedTheme === t.key ? 600 : 400, textAlign: "center", lineHeight: 1.3, fontFamily: "’Inter’,sans-serif" }}>{t.label}</span>
                  </button>
                ))}
              </div>
              {/* Single-tone themes — 4 columns */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", justifyItems: "center" }}>
                {THEMES_LIST.slice(5).map(t => (
                  <button key={t.key} onClick={() => setSelectedTheme(t.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: selectedTheme === t.key ? `3px solid ${t.c1}` : "2px solid #e8e0d5", background: t.c1, flexShrink: 0 }} />
                    <span style={{ fontSize: "9px", color: selectedTheme === t.key ? t.c1 : "#8a7455", fontWeight: selectedTheme === t.key ? 600 : 400, textAlign: "center", lineHeight: 1.3, fontFamily: "’Inter’,sans-serif" }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>{/* end fade wrapper */}
      </div>
    </div>
  );
}
