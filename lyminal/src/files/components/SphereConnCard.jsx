import { useState } from "react";

function SphereConnCard({ sphere, isChecked, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-2 rounded-xl overflow-hidden transition-all"
      style={{ borderColor: isChecked ? sphere.color : sphere.color + "30" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-6 h-6 rounded-md border-2 transition-all flex-shrink-0"
          style={isChecked
            ? { background: sphere.color, borderColor: sphere.color }
            : { background: "white", borderColor: sphere.color + "60" }
          }
        >
          {isChecked && <span className="text-white text-xs font-bold">✓</span>}
        </button>
        <span className="font-semibold flex-1 text-gray-800">{sphere.name}</span>
        {sphere.goals.length > 0 && (
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all"
            style={{
              border: `1.5px solid ${open ? sphere.color + "60" : sphere.color}`,
              color: open ? sphere.color + "90" : "white",
              background: open ? "transparent" : sphere.color,
              borderRadius: "999px",
              letterSpacing: "0.02em"
            }}
          >
            {sphere.goals.length} goal{sphere.goals.length !== 1 ? "s" : ""}
            <span style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
          </button>
        )}
      </div>
      {open && sphere.goals.length > 0 && (
        <div className="px-4 pb-3 border-t" style={{ borderColor: sphere.color + "20", background: sphere.color + "06" }}>
          <div className="pt-2 space-y-1">
            {sphere.goals.map(g => (
              <div key={g.id} className="flex items-center gap-2 text-xs text-gray-600 py-1">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sphere.color }} />
                {g.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export { SphereConnCard };
