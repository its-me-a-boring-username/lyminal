import { jsPDF } from "jspdf";
import { MAP_BG } from "../constants.js";

const hexRgb = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const mixC = (hex, a, bg='#faf8f5') => {
  const [r,g,b]=hexRgb(hex), [br,bg2,bb]=hexRgb(bg);
  return [Math.round(r*a+br*(1-a)), Math.round(g*a+bg2*(1-a)), Math.round(b*a+bb*(1-a))];
};

const PC = { bg:'#faf8f5', accent:'#b5472a', dark:'#1c1410', body:'#4a3828', muted:'#6e5c4a', faint:'#8a7455', sage:'#4a7a72', border:'#e8e0d5', lightBg:'#f5f0e8' };
const W = 612, H = 792; // letter in points

function pdfLogo(doc, x, y, size) {
  const s = size, r = s*0.10, sw = s*0.025;
  const top = [x, y - s*0.32], bl = [x - s*0.32, y + s*0.32], br = [x + s*0.32, y + s*0.32];
  doc.setDrawColor(...hexRgb(PC.accent)); doc.setLineWidth(sw);
  doc.line(top[0],top[1],bl[0],bl[1]); doc.line(top[0],top[1],br[0],br[1]); doc.line(bl[0],bl[1],br[0],br[1]);
  doc.setFillColor(...hexRgb('#ffffff')); doc.setDrawColor(...hexRgb(PC.accent)); doc.setLineWidth(s*0.028);
  doc.circle(top[0],top[1],r,'FD'); doc.circle(bl[0],bl[1],r,'FD');
  doc.setDrawColor(...mixC(PC.accent,0.25)); doc.setLineWidth(s*0.018);
  doc.circle(br[0],br[1],r*1.9,'S');
  doc.setFillColor(...hexRgb(PC.accent)); doc.circle(br[0],br[1],r*1.25,'F');
}

function pdfHeader(doc) {
  pdfLogo(doc, 55, 45, 24);
  doc.setFontSize(8); doc.setTextColor(...hexRgb(PC.muted)); doc.setFont('helvetica','normal');
  doc.text('LYMINAL', 72, 47);
  const headerDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  doc.setFontSize(7); doc.text(headerDate, W-40, 47, {align:'right'});
  doc.setDrawColor(...hexRgb(PC.border)); doc.setLineWidth(0.5);
  doc.line(40, 58, W-40, 58);
}

function pdfFooter(doc, n) {
  doc.setFontSize(7); doc.setTextColor(...hexRgb(PC.faint)); doc.setFont('helvetica','normal');
  doc.text(`— ${n} —`, W/2, H-30, {align:'center'});
}

function pdfSectionTitle(doc, x, y, title, color=PC.accent, lineW=100) {
  doc.setFontSize(18); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text(title, x, y);
  doc.setDrawColor(...hexRgb(color)); doc.setLineWidth(1.5);
  doc.line(x, y+8, x+lineW, y+8);
  return y + 28;
}

function pdfWrap(doc, x, y, text, size=10, color=PC.body, maxW=440, lh=16, font='helvetica', style='normal') {
  doc.setFontSize(size); doc.setFont(font, style); doc.setTextColor(...hexRgb(color));
  const lines = doc.splitTextToSize(text, maxW);
  for (const line of lines) { doc.text(line, x, y); y += lh; }
  return y;
}

function pdfBg(doc) {
  doc.setFillColor(...hexRgb(PC.bg)); doc.rect(0, 0, W, H, 'F');
}

function pdfChart(doc, spheres, connections, counts, ranked, cx, cy, radius, nodeR, showGoals) {
  const n = spheres.length;
  const pos = {};
  spheres.forEach((s, i) => {
    const a = (i/n)*Math.PI*2 - Math.PI/2;
    pos[s.id] = { x: cx + Math.cos(a)*radius, y: cy + Math.sin(a)*radius };
  });

  // Connection arrows (straight lines)
  Object.entries(connections).forEach(([fromId, targets]) => {
    const f = pos[fromId]; if (!f) return;
    const src = spheres.find(s => s.id === fromId);
    const color = src?.color || PC.accent;
    (targets||[]).forEach(toId => {
      const t = pos[toId]; if (!t) return;
      const dx=t.x-f.x, dy=t.y-f.y, dist=Math.sqrt(dx*dx+dy*dy);
      if (dist<1) return;
      const ux=dx/dist, uy=dy/dist;
      const x1=f.x+ux*nodeR, y1=f.y+uy*nodeR;
      const x2=t.x-ux*(nodeR+6), y2=t.y-uy*(nodeR+6);
      doc.setDrawColor(...mixC(color, 0.45)); doc.setLineWidth(1.2);
      doc.line(x1,y1,x2,y2);
      // Arrowhead
      const al=5;
      const lx=x2-ux*al-uy*3, ly=y2-uy*al+ux*3;
      const rx=x2-ux*al+uy*3, ry=y2-uy*al-ux*3;
      doc.setFillColor(...mixC(color, 0.55));
      doc.triangle(x2,y2,lx,ly,rx,ry,'F');
    });
  });

  // Nodes
  ranked.forEach((s, i) => {
    const p = pos[s.id]; if (!p) return;
    const color = s.color || PC.accent;
    const cn = counts[s.id] || {out:0, in:0};
    const isTop = i === 0;

    // Glow ring for #1
    if (isTop) {
      doc.setDrawColor(...mixC(color, 0.25)); doc.setLineWidth(2);
      doc.setLineDashPattern([4,3], 0); doc.circle(p.x, p.y, nodeR+8, 'S');
      doc.setLineDashPattern([], 0);
    }

    // Node
    doc.setFillColor(255,255,255); doc.setDrawColor(...hexRgb(color)); doc.setLineWidth(2);
    doc.circle(p.x, p.y, nodeR, 'FD');

    // Name — wraps on space if needed
    const name = s.name;
    const spaceIdx = name.indexOf(' ');
    doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(color));
    if (spaceIdx > 0 && name.length > 8) {
      const line1 = name.slice(0, spaceIdx);
      const line2 = name.slice(spaceIdx + 1);
      doc.setFontSize(7.5);
      doc.text(line1, p.x, p.y-5, {align:'center'});
      doc.text(line2, p.x, p.y+5, {align:'center'});
    } else {
      doc.setFontSize(name.length > 12 ? 7 : 8);
      doc.text(name, p.x, p.y-2, {align:'center'});
    }

    // Counts
    const countsY = (spaceIdx > 0 && name.length > 8) ? p.y+14 : p.y+8;
    doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(150,150,150);
    doc.text(`↑${cn.in}  ↓${cn.out}`, p.x, countsY, {align:'center'});

    // #1 badge
    if (isTop) {
      doc.setFillColor(...hexRgb(PC.accent));
      doc.circle(p.x, p.y-nodeR-7, 8, 'F');
      doc.setFontSize(6); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
      doc.text('#1', p.x, p.y-nodeR-5, {align:'center'});
    }

    // Goals below
    if (showGoals) {
      let gy = p.y + nodeR + 14;
      s.goals.slice(0,3).forEach(g => {
        let gt = g.text || g; if (gt.length > 28) gt = gt.slice(0,26)+'…';
        doc.setFontSize(5.5); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.muted));
        doc.text(gt, p.x, gy, {align:'center'});
        gy += 9;
      });
    }
  });
}

function pdfConnectionsPage(doc, spheres, connections, counts, ranked, pageNum) {
  pdfBg(doc); pdfHeader(doc);
  let y = pdfSectionTitle(doc, 40, 90, 'Connections & Rankings', PC.sage, 130);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
  doc.text('How your spheres influence each other, and where to focus first.', 40, y); y+=25;

  // Influence Map
  doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text('Influence Map', 40, y); y+=20;

  Object.entries(connections).forEach(([srcId, targets]) => {
    const src = spheres.find(s => s.id === srcId);
    if (!src) return;
    doc.setFillColor(...hexRgb(src.color)); doc.circle(50, y-3, 3, 'F');
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
    doc.text(src.name, 60, y);
    const sw = doc.getTextWidth(src.name);
    doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.muted));
    const targetNames = targets.map(tid => spheres.find(s=>s.id===tid)?.name).filter(Boolean).join(', ');
    doc.text(`  supports  ${targetNames}`, 60+sw+4, y);
    y += 18;
  });

  y += 20;

  // Rankings
  doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text('Priority Ranking', 40, y); y+=12;
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.muted));
  doc.text('Sorted by outgoing influence (ties broken by net score)', 40, y); y+=18;

  // Table header
  doc.setFillColor(...hexRgb(PC.lightBg)); doc.rect(40, y-10, W-80, 18, 'F');
  doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.muted));
  doc.text('RANK', 50, y); doc.text('SPHERE', 90, y); doc.text('OUT', 260, y); doc.text('IN', 320, y); doc.text('NET', 380, y);
  y += 18;

  ranked.forEach((s, i) => {
    const cn = counts[s.id], net = cn.out - cn.in;
    if (i===0) { doc.setFillColor(...hexRgb(PC.lightBg)); doc.rect(40, y-11, W-80, 20, 'F'); }
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(i===0?PC.accent:PC.body));
    doc.text(`#${i+1}`, 55, y);
    doc.setFillColor(...hexRgb(s.color)); doc.circle(97, y-3, 3, 'F');
    doc.setFont('helvetica', i===0?'bold':'normal'); doc.setTextColor(...hexRgb(PC.dark));
    doc.text(s.name, 106, y);
    doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
    doc.text(String(cn.out), 270, y, {align:'center'}); doc.text(String(cn.in), 328, y, {align:'center'});
    doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(net>0?PC.sage:PC.muted));
    doc.text(net>0?`+${net}`:String(net), 390, y, {align:'center'});
    y += 22;
  });

  pdfFooter(doc, pageNum);
}

async function generateChartReport(spheres, connections, counts, ranked) {
  const doc = new jsPDF({ unit:'pt', format:'letter' });

  // Page 1: Cover
  pdfBg(doc); pdfLogo(doc, W/2, 180, 50);
  doc.setFontSize(10); doc.setTextColor(...hexRgb(PC.muted)); doc.setFont('helvetica','normal');
  doc.text('L Y M I N A L', W/2, 225, {align:'center'});
  doc.setFontSize(28); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text('Your Goal Chart', W/2, 285, {align:'center'});
  doc.setFontSize(12); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
  doc.text('A snapshot of your spheres, goals, and connections', W/2, 315, {align:'center'});
  doc.setDrawColor(...hexRgb(PC.accent)); doc.setLineWidth(2);
  doc.line(W/2-40, 335, W/2+40, 335);
  doc.setFontSize(10); doc.setTextColor(...hexRgb(PC.muted));
  doc.text('Prepared for you', W/2, 385, {align:'center'});
  doc.setFontSize(9); doc.text(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}), W/2, 405, {align:'center'});
  pdfFooter(doc, 1);

  // Page 2: Chart
  doc.addPage(); pdfBg(doc); pdfHeader(doc);
  let y = pdfSectionTitle(doc, 40, 90, 'Your Goal Chart', PC.accent, 100);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
  doc.text('Your spheres, connections, and goals — all in one view.', 40, y); y+=15;
  pdfChart(doc, spheres, connections, counts, ranked, W/2, y+200, 160, 36, true);
  pdfFooter(doc, 2);

  // Page 3: Connections & Rankings
  doc.addPage();
  pdfConnectionsPage(doc, spheres, connections, counts, ranked, 3);

  doc.save('lyminal-chart-report.pdf');
}

async function generateFullReport(spheres, connections, counts, ranked, activeGoals, checkedItems, completedGoals) {
  const doc = new jsPDF({ unit:'pt', format:'letter' });

  // Generate AI insights
  let aiSummary = [], aiThemes = [];
  try {
    const sphereData = spheres.map(s => ({name:s.name, goals:s.goals.map(g=>g.text)}));
    const connData = {};
    Object.entries(connections).forEach(([id, targets]) => {
      const src = spheres.find(s=>s.id===id);
      if (src) connData[src.name] = targets.map(tid => spheres.find(s=>s.id===tid)?.name).filter(Boolean);
    });
    const rankData = ranked.map((s,i) => ({rank:i+1, name:s.name, out:counts[s.id].out, in:counts[s.id].in, net:counts[s.id].out-counts[s.id].in}));

    const res = await fetch("/api/chat", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1000,
        system: `You are Lyme, an AI life coach. Analyze this goal chart data and return ONLY valid JSON (no markdown, no backticks). The JSON must have this exact structure:
{"summary":["paragraph1","paragraph2","paragraph3"],"themes":[{"title":"Theme Name","detail":"Description of the pattern...","goals":["goal1","goal2"]}]}

Summary: 3 paragraphs analyzing the connection graph - which spheres are highest leverage and why, how they support each other, and any feedback loops.
Themes: 2-4 patterns you notice across ALL goals (not per-sphere). Each theme should identify a cross-cutting thread like "discipline and structure" or "relationship building" and reference specific goals from multiple spheres that contribute to it. Be specific and insightful.`,
        messages: [{ role:"user", content: JSON.stringify({spheres:sphereData, connections:connData, rankings:rankData}) }]
      })
    });
    const data = await res.json();
    const text = data.content?.find(b=>b.type==='text')?.text || '';
    const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
    aiSummary = parsed.summary || [];
    aiThemes = parsed.themes || [];
  } catch(e) {
    console.error('AI insights failed:', e);
    aiSummary = ['Your goal chart has been analyzed. See the connections and rankings pages for details on how your spheres influence each other.'];
    aiThemes = [];
  }

  // Theme colors
  const themeColors = ['#b5693a','#c4973a','#9e6b7a','#4a7c8e'];

  // Page 1: Cover
  pdfBg(doc);
  doc.setFillColor(...hexRgb(PC.sage)); doc.rect(0, 0, W, 8, 'F');
  pdfLogo(doc, W/2, 180, 50);
  doc.setFontSize(10); doc.setTextColor(...hexRgb(PC.muted)); doc.setFont('helvetica','normal');
  doc.text('L Y M I N A L', W/2, 225, {align:'center'});
  doc.setFontSize(28); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text('Your Full Goal Report', W/2, 285, {align:'center'});
  doc.setFontSize(12); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
  doc.text('Insights, priorities, and your action plan', W/2, 315, {align:'center'});
  doc.setDrawColor(...hexRgb(PC.accent)); doc.setLineWidth(2);
  doc.line(W/2-40, 335, W/2+40, 335);
  doc.setFontSize(10); doc.setTextColor(...hexRgb(PC.muted));
  doc.text('Prepared for you', W/2, 385, {align:'center'});
  doc.setFontSize(9); doc.text(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}), W/2, 405, {align:'center'});
  doc.setFillColor(...hexRgb(PC.accent)); doc.roundedRect(W/2-40, 430, 80, 20, 3, 3, 'F');
  doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
  doc.text('PREMIUM REPORT', W/2, 443, {align:'center'});
  pdfFooter(doc, 1);

  // Page 2: Chart
  doc.addPage(); pdfBg(doc); pdfHeader(doc);
  let y = pdfSectionTitle(doc, 40, 90, 'Your Goal Chart', PC.accent, 100);
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
  doc.text('Your spheres, connections, and goals — all in one view.', 40, y); y+=15;
  pdfChart(doc, spheres, connections, counts, ranked, W/2, y+200, 160, 36, true);
  pdfFooter(doc, 2);

  // Page 3+: Insights (may overflow to additional pages)
  let insightsPageNum = 3;
  const MARGIN_BOTTOM = 60;
  const checkPage = () => {
    if (y > H - MARGIN_BOTTOM) {
      pdfFooter(doc, insightsPageNum);
      doc.addPage(); pdfBg(doc); pdfHeader(doc);
      insightsPageNum++;
      y = 80;
    }
  };

  doc.addPage(); pdfBg(doc); pdfHeader(doc);
  y = pdfSectionTitle(doc, 40, 90, 'Your Personalized Insights', PC.accent, 140);

  // Summary section
  doc.setFillColor(...hexRgb(PC.accent)); doc.circle(55, y-4, 5, 'F');
  doc.setFillColor(...hexRgb(PC.bg)); doc.circle(55, y-4, 2.5, 'F');
  doc.setFillColor(...hexRgb(PC.accent)); doc.circle(55, y-4, 1, 'F');
  doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text('Summary', 72, y); y+=18;

  const summaryStart = y;
  aiSummary.forEach(para => {
    doc.setFontSize(9.5); doc.setFont('helvetica','normal');
    const lines = doc.splitTextToSize(para, W-120);
    lines.forEach(line => {
      checkPage();
      doc.setTextColor(...hexRgb(PC.body));
      doc.text(line, 58, y); y += 15;
    });
    y += 6;
  });
  doc.setDrawColor(...hexRgb(PC.accent)); doc.setLineWidth(2);
  doc.line(45, summaryStart-6, 45, Math.min(y-12, H - MARGIN_BOTTOM));

  // Divider
  y += 5;
  checkPage();
  doc.setDrawColor(...hexRgb(PC.border)); doc.setLineWidth(0.5);
  doc.setLineDashPattern([2,3],0); doc.line(60, y, W-60, y); doc.setLineDashPattern([],0);
  doc.setFillColor(...hexRgb(PC.accent));
  doc.triangle(W/2, y-3, W/2+3, y, W/2, y+3, 'F');
  doc.triangle(W/2, y+3, W/2-3, y, W/2, y-3, 'F');
  y += 20;

  // Themes section
  checkPage();
  doc.setFillColor(...hexRgb(PC.accent)); doc.circle(55, y-4, 6, 'F');
  doc.setFillColor(...hexRgb(PC.bg)); doc.circle(55, y-4, 3.5, 'F');
  doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text('Themes', 72, y);
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.muted));
  doc.text('Patterns we noticed across your goals', 122, y+1);
  y += 20;

  aiThemes.forEach((theme, ti) => {
    // Check if we have enough room for at least the title + a few lines (~80pt)
    if (y > H - MARGIN_BOTTOM - 80) {
      pdfFooter(doc, insightsPageNum);
      doc.addPage(); pdfBg(doc); pdfHeader(doc);
      insightsPageNum++;
      y = 80;
    }

    const tc = themeColors[ti % themeColors.length];
    // Title dot + text
    doc.setFillColor(...hexRgb(tc)); doc.circle(52, y-3, 4, 'F');
    doc.setFillColor(...mixC(tc, 0.4)); doc.circle(48, y-7, 2.5, 'F');
    doc.circle(57, y-6, 2, 'F');
    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(tc));
    doc.text(theme.title, 66, y); y+=14;

    // Detail - with page break support
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    const detailLines = doc.splitTextToSize(theme.detail, W-130);
    detailLines.forEach(line => {
      checkPage();
      doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
      doc.text(line, 66, y); y += 14;
    });
    y += 2;

    // Goal tags - with page break support
    let tx = 66;
    doc.setFontSize(7); doc.setFont('helvetica','normal');
    (theme.goals||[]).forEach(goal => {
      const tw = doc.getTextWidth(goal) + 12;
      if (tx + tw > W-50) { tx = 66; y += 16; checkPage(); }
      checkPage();
      doc.setFillColor(...mixC(tc, 0.1)); doc.roundedRect(tx, y-9, tw, 14, 3, 3, 'F');
      doc.setDrawColor(...mixC(tc, 0.3)); doc.setLineWidth(0.5); doc.roundedRect(tx, y-9, tw, 14, 3, 3, 'S');
      doc.setTextColor(...hexRgb(tc)); doc.text(goal, tx+6, y);
      tx += tw + 6;
    });
    y += 18;

    if (ti < aiThemes.length-1) {
      checkPage();
      doc.setDrawColor(...hexRgb(PC.border)); doc.setLineWidth(0.3);
      doc.line(66, y-6, W-60, y-6);
    }
  });

  y += 6;
  checkPage();
  doc.setFontSize(8); doc.setFont('helvetica','italic'); doc.setTextColor(...hexRgb(PC.faint));
  doc.text('— Generated by Lyme, your AI coach', 40, y);
  pdfFooter(doc, insightsPageNum);

  // Connections & Rankings
  doc.addPage();
  pdfConnectionsPage(doc, spheres, connections, counts, ranked, insightsPageNum + 1);

  // Focus & Action Plan
  doc.addPage(); pdfBg(doc); pdfHeader(doc);
  y = pdfSectionTitle(doc, 40, 90, 'Your Focus & Action Plan', PC.accent, 140);

  // Focus card(s)
  activeGoals.forEach(ag => {
    const color = ag.sphereColor || PC.accent;
    const cn = counts[ag.sphereId] || {out:0,in:0};
    doc.setFillColor(255,255,255); doc.setDrawColor(...hexRgb(color)); doc.setLineWidth(2);
    doc.roundedRect(40, y-5, W-80, 75, 6, 6, 'FD');
    doc.setFillColor(...hexRgb(color)); doc.circle(58, y+10, 5, 'F');
    doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
    doc.text(ag.sphereName, 70, y+14);
    // Badge
    doc.setFillColor(...hexRgb(PC.accent)); doc.roundedRect(W-125, y, 85, 18, 3, 3, 'F');
    doc.setFontSize(7); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
    doc.text('FOCUS', W-82.5, y+12, {align:'center'});
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
    doc.text(`Goal:  ${ag.goalText}`, 58, y+34);
    doc.setFontSize(8); doc.setTextColor(...hexRgb(PC.muted));
    doc.text(`${cn.out} outgoing  ·  ${cn.in} incoming  ·  Net: ${cn.out>cn.in?'+':''}${cn.out-cn.in}`, 58, y+50);
    y += 85;

    // Action items
    if (ag.actionItems?.length > 0) {
      doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
      doc.text('Action Items', 40, y);
      const done = ag.actionItems.filter(a => checkedItems[ag.goalId]?.has(a.id)).length;
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.muted));
      doc.text(`  ${done} of ${ag.actionItems.length} completed`, 115, y);
      y += 14;

      // Progress bar
      const barW = W-80, progress = done/ag.actionItems.length;
      doc.setFillColor(...hexRgb(PC.border)); doc.roundedRect(40, y, barW, 6, 3, 3, 'F');
      if (progress > 0) { doc.setFillColor(...hexRgb(color)); doc.roundedRect(40, y, barW*progress, 6, 3, 3, 'F'); }
      y += 18;

      ag.actionItems.forEach(item => {
        const checked = checkedItems[ag.goalId]?.has(item.id);
        doc.setDrawColor(...hexRgb(color)); doc.setLineWidth(1.5);
        if (checked) {
          doc.setFillColor(...hexRgb(color)); doc.roundedRect(44, y-8, 12, 12, 2, 2, 'F');
          doc.setDrawColor(255,255,255); doc.setLineWidth(1.5);
          doc.line(47, y-2, 49, y+1); doc.line(49, y+1, 53, y-5);
        } else {
          doc.setFillColor(255,255,255); doc.roundedRect(44, y-8, 12, 12, 2, 2, 'FD');
        }
        doc.setFontSize(10); doc.setFont('helvetica','normal');
        doc.setTextColor(...hexRgb(checked ? PC.muted : PC.body));
        doc.text(item.text, 64, y);
        if (checked) {
          const tw = doc.getTextWidth(item.text);
          doc.setDrawColor(...hexRgb(PC.muted)); doc.setLineWidth(0.5);
          doc.line(64, y-3, 64+tw, y-3);
        }
        y += 22;
      });
    }
    y += 10;
  });

  // What's Next
  y += 5;
  doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text("What's Next", 40, y); y+=18;
  ['Complete your remaining action items to build momentum.',
   'Return to Lyminal to pick your next focus sphere.',
   'As your life evolves, update your spheres and connections — your priorities will shift.'
  ].forEach((step, i) => {
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.accent));
    doc.text(`${i+1}.`, 50, y);
    doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
    doc.text(step, 65, y);
    y += 18;
  });

  pdfFooter(doc, insightsPageNum + 2);
  let wsPageNum = insightsPageNum + 3;

  // ── WORKSHEET: SPHERE DEEP DIVE ──
  const focusAg = activeGoals[0];
  if (focusAg) {
    const fColor = focusAg.sphereColor || PC.accent;
    doc.addPage(); pdfBg(doc); pdfHeader(doc);
    y = pdfSectionTitle(doc, 40, 90, 'Sphere Deep Dive', fColor, 110);

    // Sphere name + subtitle — move DOWN the page
    doc.setFillColor(...hexRgb(fColor)); doc.circle(48, y + 2, 5, 'F');
    doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
    doc.text(focusAg.sphereName, 60, y + 6); y += 22;
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.muted));
    doc.text('Take 15 minutes to reflect on this sphere. Be honest — this is for you.', 40, y); y += 20;

    // Goals reminder box — y is the top of the box
    const focusSphere = spheres.find(s => s.id === focusAg.sphereId);
    const goalTexts = focusSphere?.goals?.map(g => g.text).join('  ·  ') || focusAg.goalText;
    const goalLines = doc.splitTextToSize(goalTexts, W - 120);
    const goalBoxH = Math.max(48, goalLines.length * 13 + 28);
    doc.setFillColor(...mixC(fColor, 0.08)); doc.roundedRect(40, y, W - 80, goalBoxH, 6, 6, 'F');
    doc.setDrawColor(...mixC(fColor, 0.25)); doc.setLineWidth(0.5);
    doc.roundedRect(40, y, W - 80, goalBoxH, 6, 6, 'S');
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(fColor));
    doc.text('YOUR GOALS IN THIS SPHERE:', 55, y + 14);
    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
    goalLines.forEach((line, i) => { doc.text(line, 55, y + 28 + i * 13); });
    y += goalBoxH + 24;

    // Prompt boxes — each drawn top-down
    const deepDivePrompts = [
      { icon: '?', text: "What's currently working in this area?", color: fColor },
      { icon: '!', text: "What's blocking you or holding you back?", color: '#8a5c5c' },
      { icon: '→', text: 'Who in your life could help you with this?', color: PC.sage },
      { icon: '★', text: 'What would meaningful progress look like in 30 days?', color: '#c4973a' },
    ];

    deepDivePrompts.forEach(prompt => {
      const boxH = 130;
      if (y + boxH > H - 60) {
        pdfFooter(doc, wsPageNum); wsPageNum++;
        doc.addPage(); pdfBg(doc); pdfHeader(doc);
        y = 80;
      }
      const pColor = prompt.color;

      // Box — y is the top
      doc.setFillColor(255,255,255); doc.setDrawColor(...hexRgb(PC.border)); doc.setLineWidth(1);
      doc.roundedRect(40, y, W - 80, boxH, 6, 6, 'FD');

      // Icon circle at top-left of box
      doc.setFillColor(...hexRgb(pColor)); doc.circle(58, y + 18, 8, 'F');
      doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
      doc.text(prompt.icon, 58, y + 22, {align:'center'});

      // Prompt text
      doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
      doc.text(prompt.text, 76, y + 21);

      // Writing lines — start below the prompt heading
      let lineY = y + 48;
      doc.setDrawColor(...hexRgb('#e0d8cc')); doc.setLineWidth(0.3);
      const lineCount = Math.floor((boxH - 55) / 20);
      for (let i = 0; i < lineCount; i++) {
        doc.line(56, lineY, W - 56, lineY);
        lineY += 20;
      }

      y += boxH + 12;
    });

    pdfFooter(doc, wsPageNum); wsPageNum++;
  }

  // ── WORKSHEET: WEEKLY CHECK-IN ──
  doc.addPage(); pdfBg(doc); pdfHeader(doc);
  y = pdfSectionTitle(doc, 40, 90, 'Weekly Check-In', PC.sage, 100);

  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.muted));
  doc.text('Print this page and fill it out each week. Consistency beats intensity.', 40, y); y += 22;

  // Week of field
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text('Week of:', 40, y);
  doc.setDrawColor(...hexRgb(PC.border)); doc.setLineWidth(0.5);
  doc.line(100, y + 2, 250, y + 2);
  y += 32;

  // Sphere Pulse
  doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text('Sphere Pulse', 40, y); y += 16;
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.muted));
  doc.text('Rate how each area felt this week (1 = struggling, 5 = thriving)', 40, y); y += 22;

  spheres.forEach(sphere => {
    const sColor = sphere.color || PC.accent;
    doc.setFillColor(...hexRgb(sColor)); doc.circle(50, y - 3, 3.5, 'F');
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
    let sName = sphere.name; if (sName.length > 14) sName = sName.slice(0, 13) + '…';
    doc.text(sName, 60, y);
    for (let i = 0; i < 5; i++) {
      const cx = 200 + i * 36;
      doc.setDrawColor(...hexRgb(sColor)); doc.setLineWidth(1.2);
      doc.setFillColor(255,255,255); doc.circle(cx, y - 2, 9, 'FD');
      doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(sColor));
      doc.text(String(i + 1), cx, y + 1, {align:'center'});
    }
    y += 26;
  });

  y += 10;

  // Action Item Progress
  doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text('Action Item Progress', 40, y); y += 16;
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.muted));
  doc.text('Check off what you completed this week', 40, y); y += 22;

  activeGoals.forEach(ag => {
    (ag.actionItems || []).forEach(item => {
      if (y > H - 100) return; // safety guard
      const aColor = ag.sphereColor || PC.accent;
      doc.setDrawColor(...hexRgb(aColor)); doc.setLineWidth(1.2);
      doc.setFillColor(255,255,255); doc.roundedRect(44, y - 9, 12, 12, 2, 2, 'FD');
      doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.body));
      const itemText = item.text.length > 70 ? item.text.slice(0, 68) + '…' : item.text;
      doc.text(itemText, 64, y);
      y += 22;
    });
  });

  y += 8;
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...hexRgb(PC.muted));
  doc.text('Notes on progress:', 44, y); y += 16;
  doc.setDrawColor(...hexRgb(PC.border)); doc.setLineWidth(0.4);
  doc.line(44, y, W - 44, y); y += 22;
  doc.line(44, y, W - 44, y); y += 28;

  // Reflections
  doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.dark));
  doc.text('Reflections', 40, y); y += 22;

  ['What went well this week?', 'What was harder than expected?', "One thing I'll do differently next week:"].forEach(prompt => {
    if (y > H - 80) return;
    doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(...hexRgb(PC.body));
    doc.text(prompt, 44, y); y += 18;
    doc.setDrawColor(...hexRgb(PC.border)); doc.setLineWidth(0.4);
    doc.line(44, y, W - 44, y); y += 22;
    doc.line(44, y, W - 44, y); y += 28;
  });

  pdfFooter(doc, wsPageNum);
  doc.save('lyminal-full-report.pdf');
}


export { generateChartReport, generateFullReport };
