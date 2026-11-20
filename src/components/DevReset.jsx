import { clearChart } from "../utils/supabase.js";

const TIERS = ["free", "paid_1", "paid_2"];

export function DevReset({ session, devPaidOverride, setDevPaidOverride }) {
  const cycleTier = () => {
    const idx = TIERS.indexOf(devPaidOverride);
    const next = TIERS[(idx + 1) % TIERS.length];
    localStorage.setItem("dev_paid_override", next);
    setDevPaidOverride(next);
  };
  const label = devPaidOverride === "paid_2" ? "💎 Pro" : devPaidOverride === "paid_1" ? "💎 Paid" : "🔒 Free";
  const bg = devPaidOverride === "paid_2" ? "#2c5e8a" : devPaidOverride === "paid_1" ? "#4a7a72" : "#6e5c4a";
  const resetDevelopmentData = async () => {
    const confirmed = window.confirm("Delete the current chart and reset development data? This cannot be undone.");
    if (!confirmed) return;
    const cloudCleared = session?.user?.id ? await clearChart(session) : true;
    if (!cloudCleared) {
      window.alert("The cloud chart could not be cleared, so the reset was cancelled.");
      return;
    }
    localStorage.removeItem("goalchart_state");
    location.reload();
  };
  return (
    <>
      <button
        onClick={cycleTier}
        className="fixed right-4 text-xs px-3 py-2 hover:opacity-100 transition-opacity z-50"
        style={{ bottom: "150px", background: bg, color: "#faf8f5", opacity: 0.6, borderRadius: "4px" }}
      >
        {label}
      </button>
      <button
        onClick={resetDevelopmentData}
        className="fixed right-4 text-xs px-3 py-2 hover:opacity-100 transition-opacity z-50"
        style={{ bottom: "112px", background: "#2c1f14", color: "#faf8f5", opacity: 0.5, borderRadius: "4px" }}
      >
        🛠 Reset
      </button>
    </>
  );
}
