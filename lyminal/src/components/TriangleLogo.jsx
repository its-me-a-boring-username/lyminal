import { useState } from "react";

function TriangleLogo({ size = 80 }) {
  const s = size;
  const cx = s / 2;
  const top  = { x: cx,       y: s * 0.18 };
  const botL = { x: s * 0.18, y: s * 0.82 };
  const botR = { x: s * 0.82, y: s * 0.82 };
  const r = s * 0.10;
  const accent = "#b5472a";
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <line x1={top.x}  y1={top.y}  x2={botL.x} y2={botL.y} stroke={accent} strokeWidth={s*0.025}/>
      <line x1={top.x}  y1={top.y}  x2={botR.x} y2={botR.y} stroke={accent} strokeWidth={s*0.025}/>
      <line x1={botL.x} y1={botL.y} x2={botR.x} y2={botR.y} stroke={accent} strokeWidth={s*0.025}/>
      <circle cx={top.x}  cy={top.y}  r={r} fill="white" stroke={accent} strokeWidth={s*0.028}/>
      <circle cx={botL.x} cy={botL.y} r={r} fill="white" stroke={accent} strokeWidth={s*0.028}/>
      <circle cx={botR.x} cy={botR.y} r={r * 1.9} fill="none" stroke={accent} strokeWidth={s*0.018} strokeOpacity="0.25"/>
      <circle cx={botR.x} cy={botR.y} r={r * 1.25} fill={accent}/>
    </svg>
  );
}

export { TriangleLogo };
