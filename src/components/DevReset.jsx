import { clearChart } from "../utils/supabase.js";

export function DevReset({ session }) {
  return (
    <button
      onClick={() => { localStorage.removeItem("goalchart_state"); clearChart(session); location.reload(); }}
      className="fixed right-4 text-xs px-3 py-2 hover:opacity-100 transition-opacity z-50"
      style={{bottom:"76px", background:"#2c1f14", color:"#faf8f5", opacity:0.5, borderRadius:"4px"}}
    >
      🛠 Reset
    </button>
  );
}
