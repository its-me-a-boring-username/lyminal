import React from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes spinRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

// ── Pill ──
const Pill = ({ b }) => (
  <div
    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
    style={{ background: b.color + "18", border: `1px solid ${b.color}40`, color: b.color }}
  >
    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
    <span>{b.name}</span>
  </div>
);

// ── Arrow ──
const Arrow = ({ fromId, toId, posOverride, spheres }) => {
  const pos = posOverride;
  const f = pos[fromId], t = pos[toId];
  if (!f || !t) return null;
  const fromSphere = spheres.find(b => b.id === fromId);
  const color = fromSphere?.color || "#6366f1";
  const R = 48;
  const dx = t.x - f.x, dy = t.y - f.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return null;
  const ux = dx / dist, uy = dy / dist;
  const x1 = f.x + ux * R, y1 = f.y + uy * R;
  const x2 = t.x - ux * (R + 6), y2 = t.y - uy * (R + 6);
  const mx = (x1 + x2) / 2 - uy * 25, my = (y1 + y2) / 2 + ux * 25;
  const markerId = `arr-${fromId}-${toId}`;
  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill={color} opacity="0.7" />
        </marker>
      </defs>
      <path
        d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeOpacity="0.55"
        markerEnd={`url(#${markerId})`}
      />
    </g>
  );
};

// ── ChartSVG — shared between chart and chart-view ──
const ChartSVG = ({
  spheres, connections, counts, ranked, positions,
  dragOffsets, setDragOffsets, dragging, setDragging, didDrag, setDidDrag,
  selectedId, setSelectedId, isMobile, pdfLoading, setPdfLoading,
  generateChartReport,
}) => {
  // Compute drag-adjusted positions
  const chartPos = {};
  Object.entries(positions).forEach(([id, p]) => {
    const offset = dragOffsets[id] || { dx: 0, dy: 0 };
    chartPos[id] = { x: p.x + offset.dx, y: p.y + offset.dy };
  });

  const getSvgPoint = (e, svg) => {
    const pt = svg.createSVGPoint();
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    pt.x = touch.clientX;
    pt.y = touch.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const onDragStart = (e, sphereId) => {
    e.stopPropagation();
    const svg = e.currentTarget.closest("svg");
    if (!svg) return;
    const pt = getSvgPoint(e, svg);
    const pos = chartPos[sphereId];
    if (!pos) return;
    setDragging(sphereId);
    setDidDrag(false);
    svg._dragStart = { ox: pt.x - pos.x, oy: pt.y - pos.y };
    svg._dragSphere = sphereId;
  };

  const onDragMove = (e) => {
    const svg = e.currentTarget;
    if (!svg._dragSphere || !svg._dragStart) return;
    e.preventDefault();
    setDidDrag(true);
    const pt = getSvgPoint(e, svg);
    const basePos = positions[svg._dragSphere];
    if (!basePos) return;
    setDragOffsets(prev => ({
      ...prev,
      [svg._dragSphere]: {
        dx: pt.x - svg._dragStart.ox - basePos.x,
        dy: pt.y - svg._dragStart.oy - basePos.y,
      },
    }));
  };

  const onDragEnd = (e) => {
    const svg = e.currentTarget;
    svg._dragSphere = null;
    svg._dragStart = null;
    setDragging(null);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4" style={{ background: "#faf8f5" }}>
      <svg
        viewBox="0 0 700 620"
        className="w-full max-w-xl"
        style={{ cursor: dragging ? "grabbing" : "default", touchAction: "none" }}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onTouchEnd={onDragEnd}
        ref={el => {
          if (!el) return;
          el.removeEventListener("touchmove", el._onTouchMove);
          el._onTouchMove = (e) => onDragMove(e);
          el.addEventListener("touchmove", el._onTouchMove, { passive: false });
        }}
      >
        {/* Arrows */}
        {Object.entries(connections).map(([fromId, targets]) =>
          (targets || []).map(toId => (
            <Arrow key={`${fromId}-${toId}`} fromId={fromId} toId={toId} posOverride={chartPos} spheres={spheres} />
          ))
        )}
        {/* Nodes */}
        {spheres.map(b => {
          const pos = chartPos[b.id];
          if (!pos) return null;
          const c = counts[b.id] || { out: 0, in: 0 };
          const isSelected = selectedId === b.id;
          const isTop = ranked[0]?.id === b.id;
          return (
            <g
              key={b.id}
              onClick={() => { if (!didDrag) setSelectedId(selectedId === b.id ? null : b.id); }}
              onMouseDown={(e) => onDragStart(e, b.id)}
              onTouchStart={(e) => onDragStart(e, b.id)}
              style={{ cursor: dragging === b.id ? "grabbing" : "grab" }}
            >
              {isTop && (
                <circle cx={pos.x} cy={pos.y} r={isMobile ? 72 : 58} fill="none" stroke={b.color} strokeWidth="2.5" strokeOpacity="0.25" strokeDasharray="4 3"
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px`, animation: "spinRing 20s linear infinite" }}
                />
              )}
              <circle
                cx={pos.x} cy={pos.y} r={isMobile ? 60 : 48}
                fill={isSelected ? b.color : "white"}
                stroke={b.color}
                strokeWidth={isSelected ? 0 : 2.5}
                filter={isSelected ? "drop-shadow(0 0 8px " + b.color + "80)" : "drop-shadow(0 2px 4px rgba(0,0,0,0.08))"}
              />
              {(() => {
                const name = b.name;
                const spaceIdx = name.indexOf(" ");
                if (spaceIdx > 0 && name.length > 8) {
                  const line1 = name.slice(0, spaceIdx);
                  const line2 = name.slice(spaceIdx + 1);
                  return (<>
                    <text x={pos.x} y={pos.y - 10} textAnchor="middle" dominantBaseline="middle" fontSize={isMobile ? "17" : "12"} fontWeight="700" fill={isSelected ? "white" : b.color}>{line1}</text>
                    <text x={pos.x} y={pos.y + 8} textAnchor="middle" dominantBaseline="middle" fontSize={isMobile ? "17" : "12"} fontWeight="700" fill={isSelected ? "white" : b.color}>{line2}</text>
                  </>);
                }
                return (
                  <text x={pos.x} y={pos.y - 2} textAnchor="middle" dominantBaseline="middle" fontSize={isMobile ? (name.length > 12 ? "15" : "18") : (name.length > 12 ? "11" : "13")} fontWeight="700" fill={isSelected ? "white" : b.color}>{name}</text>
                );
              })()}
              <text
                x={pos.x} y={pos.y + (b.name.indexOf(" ") > 0 && b.name.length > 8 ? (isMobile ? 26 : 20) : (isMobile ? 20 : 14))}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={isMobile ? "14" : "10"} fontWeight="500"
                fill={isSelected ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.35)"}
              >
                ↑{c.in} ↓{c.out}
              </text>
              {isTop && (
                <g>
                  <circle cx={pos.x + (isMobile ? 48 : 38)} cy={pos.y - (isMobile ? 48 : 38)} r={isMobile ? 14 : 11} fill={b.color} />
                  <text x={pos.x + (isMobile ? 48 : 38)} y={pos.y - (isMobile ? 48 : 38)} textAnchor="middle" dominantBaseline="middle" fontSize={isMobile ? "12" : "10"} fill="white" fontWeight="bold">★</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <button
        onClick={async () => {
          setPdfLoading("chart");
          try { await generateChartReport(spheres, connections, counts, ranked); }
          catch (e) { console.error(e); alert("Chart report generation failed: " + e.message); }
          setPdfLoading(null);
        }}
        disabled={pdfLoading === "chart"}
        className="mt-4 px-5 py-2.5 text-xs font-semibold hover:opacity-90 transition-opacity"
        style={{ background: "#4a7a72", color: "white", letterSpacing: "0.04em" }}
      >
        {pdfLoading === "chart" ? "Generating..." : "↓ DOWNLOAD SIMPLE CHART"}
      </button>
    </div>
  );
};

// ── SidePanel — shared between chart and chart-view ──
const SidePanel = ({ spheres, connections, counts, ranked, selectedId, setSelectedId }) => {
  const selected = spheres.find(b => b.id === selectedId);
  const selectedCounts = selectedId ? counts[selectedId] : null;

  if (selected) {
    return (
      <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l overflow-y-auto" style={{ background: "#faf8f5", borderColor: "#e8e0d5" }}>
        <div className="p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-4 h-4 rounded-full" style={{ background: selected.color }} />
            <h3 className="text-xl font-bold" style={{ color: selected.color }}>{selected.name}</h3>
            <button onClick={() => setSelectedId(null)} className="ml-auto text-gray-300 hover:text-gray-500 text-sm">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{selectedCounts?.out || 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Outgoing</div>
              <div className="text-xs text-gray-400">supports others</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">{selectedCounts?.in || 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Incoming</div>
              <div className="text-xs text-gray-400">needs support</div>
            </div>
          </div>
          {(connections[selected.id] || []).length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Supports</p>
              <div className="flex flex-wrap gap-1.5">
                {(connections[selected.id] || []).map(toId => {
                  const b = spheres.find(b => b.id === toId);
                  return b ? <Pill key={toId} b={b} /> : null;
                })}
              </div>
            </div>
          )}
          {selected.goals.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Goals ({selected.goals.length})</p>
              <div className="space-y-1.5">
                {selected.goals.map(g => (
                  <div key={g.id} className="flex items-start gap-2 text-sm text-gray-700 py-1.5 border-b border-gray-50">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selected.color }} />
                    {g.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l overflow-y-auto" style={{ background: "#faf8f5", borderColor: "#e8e0d5" }}>
      <div className="p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#1c1410" }} className="font-semibold mb-1">Priority Ranking</h3>
        <p className="text-xs mb-5" style={{ color: "#6e5c4a" }}>Ranked by how many areas each sphere supports</p>
        <div className="space-y-2">
          {ranked.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setSelectedId(b.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left border border-transparent hover:border-gray-100"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: i === 0 ? b.color : b.color + "60" }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{b.name}</div>
                <div className="text-xs text-gray-400">↓{b.out} out · ↑{b.in} in</div>
              </div>
              {i === 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: b.color }}>
                  Focus
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-6 p-4 rounded-sm" style={{ background: "#f0ebe3", border: "1px solid #ddd3c5" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#6b4a2a" }}>How to read this</p>
          <p className="text-xs leading-relaxed" style={{ color: "#8a6040" }}>
            The top-ranked sphere has the most outgoing connections — improving it creates the most downstream benefits. Start there.
          </p>
        </div>
      </div>
    </div>
  );
};

// ── ChartView — main export ──
export function ChartView({
  mode, // "chart" | "chart-view"
  spheres, connections, counts, ranked, positions,
  dragOffsets, setDragOffsets, dragging, setDragging, didDrag, setDidDrag,
  selectedId, setSelectedId,
  isMobile, pdfLoading, setPdfLoading,
  activeGoals,
  setStep, setFocusRound, setOverrideSphere, setSelectedFocusSphereId, setSelectedGoalId,
  setSpheres, setConnections, setGoalStep, setActiveGoals,
  generateChartReport,
}) {
  const handleRedoChart = () => {
    setDragOffsets({});
    setSpheres([]);
    setConnections({});
    setGoalStep(0);
    setActiveGoals([]);
    setSelectedId(null);
    setStep("spheres");
  };

  const handleChooseFocus = () => {
    setDragOffsets({});
    setFocusRound(0);
    setOverrideSphere(false);
    setSelectedFocusSphereId(ranked[0]?.id || null);
    setSelectedGoalId(null);
    setStep("focus");
  };

  return (
    <div className="min-h-screen" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", animation: "fadeIn 0.4s ease-out" }}>
      <style>{FONTS}</style>

      {/* Header */}
      <div style={{ background: "#faf8f5", borderBottom: "1px solid #e8e0d5" }} className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "#1c1410" }} className="font-semibold">Your Goal Chart</h2>
          <p className="text-xs" style={{ color: "#6e5c4a" }}>{spheres.length} spheres · {Object.values(connections).flat().length} connections</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setDragOffsets({}); setStep("connections"); }} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: "#b5693a" }}>← Edit connections</button>
          <button onClick={handleRedoChart} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: "#6e5c4a" }}>↺ Redo chart</button>
          {Object.keys(dragOffsets).length > 0 && (
            <button onClick={() => setDragOffsets({})} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: "#4a7a72" }}>↺ Reset layout</button>
          )}
          {mode === "chart-view" ? (
            <button onClick={() => setStep("active")} className="text-xs px-4 py-2 font-medium hover:opacity-80 transition-opacity" style={{ border: "1px solid #d4c9bb", color: "#5c4e40" }}>
              Exit chart
            </button>
          ) : activeGoals.length > 0 ? (
            <button onClick={() => setStep("active")} className="text-xs px-4 py-2 font-medium hover:opacity-80 transition-opacity" style={{ border: "1px solid #d4c9bb", color: "#5c4e40" }}>
              Exit chart
            </button>
          ) : (
            <button onClick={handleChooseFocus} className="px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "#b5472a", color: "white", letterSpacing: "0.04em" }}>
              Choose My Focus →
            </button>
          )}
        </div>
      </div>

      {/* Chart + Side panel */}
      <div className="flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 65px)" }}>
        <ChartSVG
          spheres={spheres} connections={connections} counts={counts} ranked={ranked} positions={positions}
          dragOffsets={dragOffsets} setDragOffsets={setDragOffsets}
          dragging={dragging} setDragging={setDragging}
          didDrag={didDrag} setDidDrag={setDidDrag}
          selectedId={selectedId} setSelectedId={setSelectedId}
          isMobile={isMobile} pdfLoading={pdfLoading} setPdfLoading={setPdfLoading}
          generateChartReport={generateChartReport}
        />
        <SidePanel
          spheres={spheres} connections={connections} counts={counts} ranked={ranked}
          selectedId={selectedId} setSelectedId={setSelectedId}
        />
      </div>
    </div>
  );
}
