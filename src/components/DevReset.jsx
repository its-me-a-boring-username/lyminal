import { clearChart } from "../utils/supabase.js";

export function DevReset({ session, devPaidOverride, setDevPaidOverride }) {
  const togglePaid = () => {
    const next = !devPaidOverride;
    localStorage.setItem("dev_paid_override", next ? "1" : "0");
    setDevPaidOverride(next);
  };
  return (
    <>
      <button
        onClick={togglePaid}
        className="fixed right-4 text-xs px-3 py-2 hover:opacity-100 transition-opacity z-50"
        style={{ bottom: "150px", background: devPaidOverride ? "#4a7a72" : "#6e5c4a", color: "#faf8f5", opacity: 0.6, borderRadius: "4px" }}
      >
        {devPaidOverride ? "💎 Paid" : "🔒 Free"}
      </button>
      <button
        onClick={() => { localStorage.removeItem("goalchart_state"); clearChart(session); location.reload(); }}
        className="fixed right-4 text-xs px-3 py-2 hover:opacity-100 transition-opacity z-50"
        style={{ bottom: "112px", background: "#2c1f14", color: "#faf8f5", opacity: 0.5, borderRadius: "4px" }}
      >
        🛠 Reset
      </button>
    </>
  );
}
