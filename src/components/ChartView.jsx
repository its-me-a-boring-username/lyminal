import React, { useState, useEffect } from "react";
import { clearChart } from "../utils/supabase.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
@keyframes spinRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeScaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
@keyframes spotlightPulse { 0% { opacity: 0.3; } 60% { opacity: 0.15; } 100% { opacity: 0; } }`;

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(181,71,42,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
  generateChartReport, revealPhase, setRevealPhase,
}) => {
  const top = ranked[0];
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
              {isTop && revealPhase === "spotlight" && (
                <circle cx={pos.x} cy={pos.y} r={isMobile ? 100 : 84} fill={b.color}
                  style={{ animation: "spotlightPulse 4s ease-out forwards" }}
                />
              )}
              {isTop && (
                <circle cx={pos.x} cy={pos.y} r={isMobile ? 72 : 58} fill="none" stroke={b.color} strokeWidth="2.5"
                  strokeOpacity={revealPhase === "spotlight" ? 0.6 : 0.25} strokeDasharray="4 3"
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px`, animation: revealPhase === "spotlight" ? "spinRing 6s linear infinite" : "spinRing 20s linear infinite" }}
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
      {revealPhase === "spotlight" && top && (
        <div onClick={() => setRevealPhase(null)} style={{ textAlign: "center", marginTop: "6px", padding: "8px 20px 4px", cursor: "pointer", animation: "fadeIn 0.6s ease-out" }}>
          <span style={{ fontSize: "12px", color: top.color, fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>
            ★ {top.name} has the most influence — start here
          </span>
        </div>
      )}
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
        <div style={{ padding: "24px", fontFamily: "'Inter', sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: selected.color, background: hexToRgba(selected.color, 0.10), border: `1px solid ${hexToRgba(selected.color, 0.22)}`, borderRadius: "999px", padding: "3px 10px" }}>{selected.name}</span>
            <button onClick={() => setSelectedId(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#8a7455", fontSize: "14px", padding: "2px 6px" }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
            <div style={{ background: hexToRgba(selected.color, 0.07), border: `1px solid ${hexToRgba(selected.color, 0.12)}`, borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1c1410", fontFamily: "'Playfair Display', serif" }}>{selectedCounts?.out || 0}</div>
              <div style={{ fontSize: "11px", color: "#6e5c4a", marginTop: "2px" }}>Outgoing</div>
              <div style={{ fontSize: "10px", color: "#8a7455" }}>supports others</div>
            </div>
            <div style={{ background: hexToRgba(selected.color, 0.07), border: `1px solid ${hexToRgba(selected.color, 0.12)}`, borderRadius: "8px", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1c1410", fontFamily: "'Playfair Display', serif" }}>{selectedCounts?.in || 0}</div>
              <div style={{ fontSize: "11px", color: "#6e5c4a", marginTop: "2px" }}>Incoming</div>
              <div style={{ fontSize: "10px", color: "#8a7455" }}>needs support</div>
            </div>
          </div>
          {(connections[selected.id] || []).length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "10px", color: "#8a7455", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: "0 0 8px" }}>Supports</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {(connections[selected.id] || []).map(toId => {
                  const b = spheres.find(b => b.id === toId);
                  return b ? <Pill key={toId} b={b} /> : null;
                })}
              </div>
            </div>
          )}
          {selected.goals.length > 0 && (
            <div>
              <p style={{ fontSize: "10px", color: "#8a7455", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, margin: "0 0 8px" }}>Goals ({selected.goals.length})</p>
              {selected.goals.map(g => (
                <div key={g.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: "#4a3828", paddingBottom: "8px", marginBottom: "8px", borderBottom: "1px solid #f0ebe3" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: selected.color, flexShrink: 0, marginTop: "5px" }} />
                  {g.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l overflow-y-auto" style={{ background: "#faf8f5", borderColor: "#e8e0d5" }}>
      <div style={{ padding: "24px", fontFamily: "'Inter', sans-serif" }}>
        <p style={{ fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7455", fontWeight: 600, margin: "0 0 4px" }}>Priority Ranking</p>
        <p style={{ fontSize: "11px", color: "#8a7455", margin: "0 0 16px" }}>Ranked by how many areas each sphere supports</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {ranked.map((b, i) => (
            <button key={b.id} onClick={() => setSelectedId(b.id)} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px",
              background: "none", border: "1px solid transparent", borderRadius: "8px",
              cursor: "pointer", textAlign: "left", width: "100%",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = hexToRgba(b.color, 0.05); e.currentTarget.style.borderColor = hexToRgba(b.color, 0.15); }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}
            >
              <div style={{ width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "white", flexShrink: 0, background: i === 0 ? b.color : b.color + "60" }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1c1410", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                <div style={{ fontSize: "10px", color: "#8a7455" }}>↓{b.out} out · ↑{b.in} in</div>
              </div>
              {i === 0 && (
                <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em", color: "white", background: b.color, padding: "3px 9px", borderRadius: "999px", flexShrink: 0 }}>Focus</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "20px", background: "rgba(74,122,114,0.09)", borderLeft: "3px solid #4a7a72", borderRadius: "0 6px 6px 0", padding: "10px 14px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#1e3a36", margin: "0 0 4px" }}>How to read this</p>
          <p style={{ fontSize: "11px", color: "#2e5a52", lineHeight: 1.55, margin: 0 }}>
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
  activeGoals, session,
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
    clearChart(session);
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

  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  const top = ranked[0];
  // "modal" → "spotlight" → null; only fires on first-time chart view (mode === "chart")
  const [revealPhase, setRevealPhase] = useState(mode === "chart" ? "modal" : null);
  useEffect(() => {
    if (revealPhase !== "modal") return;
    const t = setTimeout(() => setRevealPhase("spotlight"), 2500);
    return () => clearTimeout(t);
  }, [revealPhase]);
  useEffect(() => {
    if (revealPhase !== "spotlight") return;
    const t = setTimeout(() => setRevealPhase(null), 4000);
    return () => clearTimeout(t);
  }, [revealPhase]);

  return (
    <>
    <style>{FONTS}</style>

    {/* Reveal modal — outside opacity wrapper so it's always fully visible */}
    {revealPhase === "modal" && top && (
      <div onClick={() => setRevealPhase("spotlight")} style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(20,14,10,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", cursor: "pointer",
        animation: "fadeIn 0.4s ease-out",
      }}>
        <div style={{
          background: "white", maxWidth: "400px", width: "100%",
          padding: "40px 36px", textAlign: "center",
          borderTop: `5px solid ${top.color}`,
          animation: "fadeScaleIn 0.4s ease-out",
        }} onClick={e => e.stopPropagation()}>
          <p style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 16px", fontFamily: "'Inter',sans-serif" }}>
            Your Lines of Influence
          </p>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", color: "#4a3828", fontWeight: 300, margin: "0 0 8px", lineHeight: 1.6 }}>
            Based on how your spheres connect, your greatest leverage is in
          </p>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", fontWeight: 700, color: top.color, margin: "0 0 10px", lineHeight: 1.1 }}>
            {top.name}
          </p>
          <p style={{ fontSize: "11px", color: "#8a7455", margin: "0 0 32px", fontFamily: "'Inter',sans-serif" }}>
            {top.out} outgoing · {top.in} incoming · score {top.score > 0 ? "+" : ""}{top.score}
          </p>
          <button onClick={() => setRevealPhase("spotlight")} style={{
            background: top.color, color: "white", border: "none",
            padding: "12px 32px", fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase",
            cursor: "pointer", fontFamily: "'Inter',sans-serif",
          }}>
            See My Chart →
          </button>
          <p style={{ fontSize: "10px", color: "#c4b8a8", margin: "14px 0 0", fontFamily: "'Inter',sans-serif" }}>
            tap anywhere to continue
          </p>
        </div>
      </div>
    )}

    <div className="min-h-screen" style={{ background: "#faf8f5", fontFamily: "'Inter', sans-serif", opacity: visible ? 1 : 0, transition: "opacity 0.3s ease-out" }}>

      {/* Header */}
      <div style={{ background: hexToRgba(ranked[0]?.color, 0.07), borderBottom: `1px solid ${hexToRgba(ranked[0]?.color, 0.12)}`, padding: "28px 24px 24px", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-start", justifyContent: "space-between", gap: isMobile ? "10px" : "16px" }}>
          <div>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7455", margin: "0 0 6px" }}>My Chart</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: 600, color: "#1c1410", margin: "0 0 4px" }}>Your Goal Chart</h2>
            <p style={{ fontSize: "0.7rem", color: "#8a7455", margin: 0 }}>{spheres.length} spheres · {Object.values(connections).flat().length} connections</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
            <button onClick={() => { setDragOffsets({}); setStep("connections"); }} style={{ fontSize: "11px", fontWeight: 500, color: "#b5472a", background: "none", border: "1px solid rgba(181,71,42,0.25)", padding: "6px 12px", cursor: "pointer", borderRadius: "6px" }}>← Edit</button>
            <button onClick={handleRedoChart} style={{ fontSize: "11px", fontWeight: 500, color: "#6e5c4a", background: "none", border: "1px solid #e8e0d5", padding: "6px 12px", cursor: "pointer", borderRadius: "6px" }}>↺ Redo</button>
            {Object.keys(dragOffsets).length > 0 && (
              <button onClick={() => setDragOffsets({})} style={{ fontSize: "11px", fontWeight: 500, color: "#4a7a72", background: "none", border: "1px solid rgba(74,122,114,0.3)", padding: "6px 12px", cursor: "pointer", borderRadius: "6px" }}>↺ Reset layout</button>
            )}
            {mode === "chart-view" || activeGoals.length > 0 ? (
              <button onClick={() => setStep("active")} style={{ fontSize: "11px", fontWeight: 500, color: "#5c4e40", background: "none", border: "1px solid #d4c9bb", padding: "6px 12px", cursor: "pointer", borderRadius: "6px" }}>Exit chart</button>
            ) : (
              <button onClick={handleChooseFocus} style={{ fontSize: "11px", fontWeight: 600, background: ranked[0]?.color || "#b5472a", color: "white", border: "none", padding: "8px 16px", cursor: "pointer", borderRadius: "6px", letterSpacing: "0.04em" }}>Choose My Focus →</button>
            )}
          </div>
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
          revealPhase={revealPhase} setRevealPhase={setRevealPhase}
          generateChartReport={generateChartReport}
        />
        <SidePanel
          spheres={spheres} connections={connections} counts={counts} ranked={ranked}
          selectedId={selectedId} setSelectedId={setSelectedId}
        />
      </div>
    </div>
    </>
  );
}
