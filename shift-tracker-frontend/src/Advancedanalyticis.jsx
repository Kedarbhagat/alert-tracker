import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   ADVANCED ANALYTICS — Enterprise Dark Dashboard
   Exact token match with manager dashboard:
   #0d1117 canvas · #161b22 surface · #30363d borders · Sapphire accent
   All charts pure SVG, zero external deps.
   Props: { data, loading, error, onRefresh }
───────────────────────────────────────────────────────────────────────────── */

const C = {
  bg:            "#0d1117",
  bgAlt:         "#161b22",
  surface:       "#161b22",
  surfaceRaised: "#1c2230",
  surfaceBorder: "#21262d",
  border:        "#30363d",
  borderLight:   "#21262d",
  ink:           "#e6edf3",
  inkMid:        "#8b949e",
  inkLight:      "#6e7681",
  inkFaint:      "#30363d",
  accent:        "#2563eb",
  accentLight:   "#3b82f6",
  accentFaint:   "rgba(37,99,235,0.12)",
  accentBorder:  "rgba(37,99,235,0.35)",
  green:         "#238636",
  greenFaint:    "rgba(35,134,54,0.15)",
  greenText:     "#3fb950",
  red:           "#da3633",
  redFaint:      "rgba(218,54,51,0.12)",
  redText:       "#f85149",
  redBorder:     "rgba(218,54,51,0.3)",
  amber:         "#9e6a03",
  amberFaint:    "rgba(158,106,3,0.15)",
  amberText:     "#d29922",
  amberBorder:   "rgba(158,106,3,0.3)",
  indigo:        "#6366f1",
  indigoFaint:   "rgba(99,102,241,0.12)",
  indigoBorder:  "rgba(99,102,241,0.3)",
};

const PALETTE = ["#3b82f6","#6366f1","#3fb950","#f85149","#d29922","#a78bfa","#22d3ee","#fb923c"];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  @keyframes aa-rise  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes aa-spin  { to { transform: rotate(360deg); } }
  @keyframes aa-pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }
  @keyframes aa-draw  { from { stroke-dashoffset: var(--len,1000); } to { stroke-dashoffset: 0; } }
  *, *::before, *::after { box-sizing: border-box; }
  .aa-card { background:#161b22; border:1px solid #30363d; border-radius:10px; transition:border-color .18s; }
  .aa-card:hover { border-color:rgba(59,130,246,0.35); }
  .aa-btn { background:#2563eb; border:none; color:#fff; border-radius:6px; padding:7px 18px; font-family:'Inter',sans-serif; font-size:12px; font-weight:500; cursor:pointer; transition:background .15s; letter-spacing:.02em; }
  .aa-btn:hover { background:#1d4ed8; }
  .aa-btn-ghost { background:transparent; border:1px solid #30363d; color:#8b949e; border-radius:6px; padding:7px 18px; font-family:'Inter',sans-serif; font-size:12px; font-weight:500; cursor:pointer; transition:all .15s; }
  .aa-btn-ghost:hover { border-color:#3b82f6; color:#3b82f6; }
  .aa-thead th { padding:10px 14px; font-size:10px; font-family:'Inter',sans-serif; text-transform:uppercase; letter-spacing:.1em; color:#6e7681; background:#21262d; border-bottom:1px solid #30363d; text-align:left; font-weight:600; }
  .aa-tbody tr { border-bottom:1px solid #21262d; transition:background .1s; }
  .aa-tbody tr:hover { background:#1c2230; }
  .aa-tbody td { padding:10px 14px; font-size:13px; font-family:'Inter',sans-serif; color:#e6edf3; }
`;

/* ── Animated counter ── */
function useAnimated(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return val;
}

/* ── KPI Card ── */
function KpiCard({ value, label, color = C.accentLight, delay = 0 }) {
  const animated = useAnimated(Number(value) || 0, 1100);
  return (
    <div className="aa-card" style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:4, animation:`aa-rise .4s ${delay}s both`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color, borderRadius:"10px 10px 0 0" }} />
      <div style={{ fontSize:34, fontWeight:700, color:C.ink, lineHeight:1, letterSpacing:"-0.04em", fontFamily:"'Inter',sans-serif", marginTop:6 }}>
        {animated.toLocaleString()}
      </div>
      <div style={{ fontSize:10, color:C.inkMid, textTransform:"uppercase", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", fontWeight:600, marginTop:4 }}>
        {label}
      </div>
    </div>
  );
}

/* ── Insight Card ── */
function InsightCard({ insight, delay }) {
  const map = {
    success: { bg:C.greenFaint,  border:"rgba(35,134,54,0.3)",  text:C.greenText,   label:"Positive" },
    warning: { bg:C.amberFaint,  border:C.amberBorder,          text:C.amberText,   label:"Attention" },
    info:    { bg:C.accentFaint, border:C.accentBorder,         text:C.accentLight, label:"Insight" },
    error:   { bg:C.redFaint,    border:C.redBorder,            text:C.redText,     label:"Alert" },
  };
  const c = map[insight.severity] || map.info;
  return (
    <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:8, padding:"14px 16px", animation:`aa-rise .4s ${delay}s both` }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:7 }}>
        <div style={{ width:5, height:5, borderRadius:"50%", background:c.text, flexShrink:0 }} />
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700, color:c.text, textTransform:"uppercase", letterSpacing:".1em" }}>
          {c.label} · {insight.title}
        </span>
      </div>
      <p style={{ margin:0, fontSize:12, color:C.inkMid, lineHeight:1.6, fontFamily:"'Inter',sans-serif" }}>{insight.message}</p>
    </div>
  );
}

/* ── Line / Area Chart ── */
function LineAreaChart({ datasets, height = 200, showGrid = true, labels }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef();
  const W = 600, H = height;
  const PAD = { t:14, r:16, b:30, l:42 };
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;
  const allVals = datasets.flatMap(d => d.values);
  const maxV = Math.max(...allVals, 1);
  const toX = (i, n) => PAD.l + (i / Math.max(n - 1, 1)) * iW;
  const toY = (v) => PAD.t + iH - (v / maxV) * iH;
  const makePath = (vals) => vals.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i, vals.length).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const makeArea = (vals, path) => `${path} L${toX(vals.length-1, vals.length).toFixed(1)},${(PAD.t+iH).toFixed(1)} L${PAD.l},${(PAD.t+iH).toFixed(1)} Z`;
  const gridVals = [0.25, 0.5, 0.75, 1].map(t => Math.round(maxV * t));

  return (
    <div style={{ position:"relative" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height }} onMouseLeave={() => setHovered(null)}>
        <defs>
          {datasets.map((d, di) => (
            <linearGradient key={di} id={`lg-aa-${di}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={d.color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={d.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>
        {showGrid && gridVals.map((gv, i) => {
          const gy = toY(gv);
          return (
            <g key={i}>
              <line x1={PAD.l} y1={gy} x2={W-PAD.r} y2={gy} stroke={C.borderLight} strokeWidth="1" />
              <text x={PAD.l-8} y={gy+4} textAnchor="end" fill={C.inkFaint} fontSize="9" fontFamily="JetBrains Mono">{gv}</text>
            </g>
          );
        })}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t+iH} stroke={C.border} strokeWidth="1" />
        {labels?.map((l, i) => {
          if (i % Math.ceil(labels.length / 7) !== 0 && i !== labels.length - 1) return null;
          return <text key={i} x={toX(i, labels.length)} y={H-8} textAnchor="middle" fill={C.inkLight} fontSize="9" fontFamily="JetBrains Mono">{l}</text>;
        })}
        {datasets.map((d, di) => {
          const path = makePath(d.values);
          const area = makeArea(d.values, path);
          const pathLen = d.values.reduce((acc, v, i) => i === 0 ? 0 : acc + Math.hypot(toX(i,d.values.length)-toX(i-1,d.values.length), toY(v)-toY(d.values[i-1])), 0);
          return (
            <g key={di}>
              <path d={area} fill={`url(#lg-aa-${di})`} />
              <path d={path} fill="none" stroke={d.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray:pathLen, "--len":pathLen, strokeDashoffset:0, animation:`aa-draw .9s ${di*.12}s ease both` }}
              />
              {d.values.map((v, i) => (
                <circle key={i} cx={toX(i,d.values.length)} cy={toY(v)}
                  r={hovered?.di===di && hovered?.i===i ? 4 : 2}
                  fill={hovered?.di===di && hovered?.i===i ? d.color : C.surface}
                  stroke={d.color} strokeWidth="1.5"
                  style={{ cursor:"crosshair", transition:"r .1s" }}
                  onMouseEnter={(e) => {
                    const rect = svgRef.current.getBoundingClientRect();
                    setHovered({ di, i, v, label:labels?.[i]||i, color:d.color, name:d.name, x:e.clientX-rect.left });
                  }}
                />
              ))}
            </g>
          );
        })}
        {hovered && <line x1={toX(hovered.i,datasets[0].values.length)} y1={PAD.t} x2={toX(hovered.i,datasets[0].values.length)} y2={PAD.t+iH} stroke={C.border} strokeWidth="1" strokeDasharray="3,3" />}
      </svg>
      {hovered && (
        <div style={{ position:"absolute", left:`${(hovered.x/600)*100}%`, top:0, transform:"translateX(-50%)", background:C.surfaceRaised, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 11px", fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:C.ink, whiteSpace:"nowrap", zIndex:10, pointerEvents:"none", boxShadow:"0 4px 16px rgba(0,0,0,0.5)" }}>
          {hovered.label && <span style={{ color:C.inkMid }}>{hovered.label} · </span>}
          {hovered.name}: <strong style={{ color:hovered.color }}>{hovered.v?.toLocaleString()}</strong>
        </div>
      )}
    </div>
  );
}

/* ── Bar Chart ── */
function BarChart({ data, xKey, yKey, color = C.accentLight, height = 150, yKey2, color2 = C.indigo, horizontal = false }) {
  const [hovered, setHovered] = useState(null);
  if (!data?.length) return <EmptyViz height={height} />;
  const maxV = Math.max(...data.map(d => Math.max(d[yKey]||0, yKey2?d[yKey2]||0:0)), 1);
  const W = 600, H = height;
  const PAD = { t:8, r:8, b:horizontal?8:26, l:horizontal?90:8 };
  const bCount = yKey2 ? 2 : 1;

  if (horizontal) {
    const itemH = Math.max(14, Math.floor((H-PAD.t-PAD.b)/data.length)-3);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height }}>
        {data.map((d, i) => {
          const y = PAD.t + i*(itemH+3);
          const barW = ((d[yKey]||0)/maxV)*(W-PAD.l-PAD.r);
          const isHov = hovered===i;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <text x={PAD.l-10} y={y+itemH/2+4} textAnchor="end" fill={isHov?C.ink:C.inkMid} fontSize="11" fontFamily="Inter">
                {String(d[xKey]).length>13?String(d[xKey]).slice(0,13)+"…":d[xKey]}
              </text>
              <rect x={PAD.l} y={y} width={W-PAD.l-PAD.r} height={itemH} fill={C.surfaceBorder} rx="3" />
              <rect x={PAD.l} y={y} width={Math.max(2,barW)} height={itemH} fill={color} rx="3" opacity={isHov?1:0.8} />
              <text x={PAD.l+Math.max(2,barW)+6} y={y+itemH/2+4} fill={C.inkMid} fontSize="10" fontFamily="JetBrains Mono">{d[yKey]}</text>
            </g>
          );
        })}
      </svg>
    );
  }

  const barGroupW = (W-PAD.l-PAD.r)/data.length;
  const barPad = bCount>1?3:6;
  const barW = (barGroupW-barPad*2)/bCount-(bCount>1?2:0);

  return (
    <div style={{ position:"relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height }} onMouseLeave={() => setHovered(null)}>
        {data.map((d, i) => {
          const gX = PAD.l+i*barGroupW+barPad;
          const h1 = ((d[yKey]||0)/maxV)*(H-PAD.t-PAD.b);
          const h2 = yKey2?((d[yKey2]||0)/maxV)*(H-PAD.t-PAD.b):0;
          const isHov = hovered===i;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <rect x={gX} y={H-PAD.b-h1} width={barW} height={Math.max(2,h1)} fill={color} rx="2" opacity={isHov?1:0.8} />
              {yKey2 && <rect x={gX+barW+2} y={H-PAD.b-h2} width={barW} height={Math.max(2,h2)} fill={color2} rx="2" opacity={isHov?1:0.8} />}
              {i%Math.ceil(data.length/8)===0 && <text x={gX+barW/2} y={H-PAD.b+14} textAnchor="middle" fill={C.inkLight} fontSize="9" fontFamily="JetBrains Mono">{String(d[xKey]).slice(0,6)}</text>}
              {isHov && <text x={gX+barW/2} y={H-PAD.b-h1-5} textAnchor="middle" fill={C.inkMid} fontSize="10" fontFamily="JetBrains Mono">{d[yKey]}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Donut Chart ── */
function DonutChart({ data, size = 170, thickness = 22 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const total = data.reduce((s, d) => s+(d.value||0), 0);
  if (total === 0) return <EmptyViz height={size} />;
  const colors = data.map((d, i) => d.color||PALETTE[i%PALETTE.length]);
  const cx = size/2, cy = size/2, r = size/2-thickness/2-4;
  let angle = -Math.PI/2;
  const slices = data.map((d, i) => {
    const sweep = (d.value/total)*2*Math.PI;
    const x1 = cx+r*Math.cos(angle), y1 = cy+r*Math.sin(angle);
    const x2 = cx+r*Math.cos(angle+sweep), y2 = cy+r*Math.sin(angle+sweep);
    const large = sweep>Math.PI?1:0;
    angle += sweep;
    return { ...d, x1, y1, x2, y2, large, color:colors[i], sweep };
  });
  const hov = hoveredIdx!==null?slices[hoveredIdx]:null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.surfaceBorder} strokeWidth={thickness} />
        {slices.map((s, i) => (
          <path key={i} d={`M ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2}`}
            fill="none" stroke={s.color} strokeWidth={hoveredIdx===i?thickness+3:thickness} strokeLinecap="round"
            style={{ cursor:"pointer", transition:"stroke-width .15s, opacity .15s", opacity:hoveredIdx!==null&&hoveredIdx!==i?0.35:1 }}
            onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}
        <text x={cx} y={cy-5} textAnchor="middle" fill={C.ink} fontSize={size*0.15} fontFamily="Inter" fontWeight="700" letterSpacing="-1">
          {hov?hov.value.toLocaleString():total.toLocaleString()}
        </text>
        <text x={cx} y={cy+14} textAnchor="middle" fill={C.inkMid} fontSize={size*0.08} fontFamily="Inter" fontWeight="600" letterSpacing="1">
          {hov?hov.label?.slice(0,12):"TOTAL"}
        </text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:8, minWidth:130 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", opacity:hoveredIdx!==null&&hoveredIdx!==i?0.35:1, transition:"opacity .15s" }}
            onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
            <div style={{ width:7, height:7, borderRadius:2, backgroundColor:s.color, flexShrink:0 }} />
            <span style={{ fontSize:12, color:C.inkMid, fontFamily:"'Inter',sans-serif", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.label}</span>
            <span style={{ fontSize:12, fontWeight:600, color:C.ink, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Gauge Chart ── */
function GaugeChart({ value, max, label, color = C.accentLight, size = 140 }) {
  const pct = Math.min(value/(max||1), 1);
  const r = size*0.36, cx = size/2, cy = size*0.58;
  const arc = (sd, ed) => {
    const s=sd*Math.PI/180, e=ed*Math.PI/180;
    const x1=cx+r*Math.cos(s), y1=cy+r*Math.sin(s), x2=cx+r*Math.cos(e), y2=cy+r*Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${ed-sd>180?1:0} 1 ${x2} ${y2}`;
  };
  return (
    <svg width={size} height={size*0.75} viewBox={`0 0 ${size} ${size*0.75}`}>
      <path d={arc(-120,120)} fill="none" stroke={C.surfaceBorder} strokeWidth="9" strokeLinecap="round" />
      <path d={arc(-120,-120+pct*240)} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" style={{ animation:"aa-draw .9s ease both" }} />
      <text x={cx} y={cy-2} textAnchor="middle" fill={C.ink} fontSize={size*0.17} fontFamily="Inter" fontWeight="700">{value}</text>
      <text x={cx} y={cy+size*0.14} textAnchor="middle" fill={C.inkMid} fontSize={size*0.08} fontFamily="Inter" fontWeight="600" letterSpacing="1">{label}</text>
    </svg>
  );
}

/* ── Radar Chart ── */
function RadarChart({ axes, datasets, size = 200 }) {
  if (!axes?.length) return <EmptyViz height={size} />;
  const n = axes.length, cx = size/2, cy = size/2, R = size*0.38;
  const af = (i) => (i/n)*2*Math.PI-Math.PI/2;
  const pf = (i, r) => [cx+r*Math.cos(af(i)), cy+r*Math.sin(af(i))];
  const gridPaths = Array.from({ length:4 }, (_, l) => {
    const rr = R*((l+1)/4);
    return axes.map((_,i)=>pf(i,rr)).map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")+" Z";
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridPaths.map((d, i) => <path key={i} d={d} fill="none" stroke={C.borderLight} strokeWidth="1" />)}
      {axes.map((_, i) => { const [ex,ey]=pf(i,R); return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke={C.borderLight} strokeWidth="1" />; })}
      {datasets.map((ds, di) => {
        const maxV = Math.max(...ds.values,1);
        const pts = axes.map((_,i)=>pf(i,R*(ds.values[i]||0)/maxV));
        const path = pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")+" Z";
        return <g key={di}><path d={path} fill={ds.color} fillOpacity=".15" stroke={ds.color} strokeWidth="1.5" style={{ animation:"aa-rise .6s both" }} /></g>;
      })}
      {axes.map((label, i) => { const [lx,ly]=pf(i,R+18); return <text key={i} x={lx} y={ly+4} textAnchor="middle" fill={C.inkMid} fontSize="9" fontFamily="Inter" fontWeight="600">{label}</text>; })}
    </svg>
  );
}

/* ── Heatmap ── */
function HeatmapGrid({ rows, cols, data, rowLabels, colLabels, color = "#3b82f6" }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...data.flat(), 1);
  const cellW = Math.floor(360/cols), cellH = Math.max(18, Math.floor(120/rows));
  const ha = (c, a) => { const r=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),b=parseInt(c.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
  return (
    <div style={{ overflowX:"auto" }}>
      <svg viewBox={`0 0 ${cols*cellW+60} ${rows*cellH+28}`} style={{ width:"100%", minWidth:320 }}>
        {colLabels?.map((l,c) => <text key={c} x={60+c*cellW+cellW/2} y={12} textAnchor="middle" fill={C.inkLight} fontSize="9" fontFamily="JetBrains Mono">{l}</text>)}
        {rowLabels?.map((l,r) => <text key={r} x={54} y={28+r*cellH+cellH/2+4} textAnchor="end" fill={C.inkMid} fontSize="10" fontFamily="Inter" fontWeight="500">{l}</text>)}
        {data.map((row, ri) => row.map((val, ci) => {
          const intensity = val/max;
          const isHov = hovered?.r===ri&&hovered?.c===ci;
          return (
            <g key={`${ri}-${ci}`} onMouseEnter={() => setHovered({r:ri,c:ci,val})} onMouseLeave={() => setHovered(null)}>
              <rect x={60+ci*cellW+1} y={24+ri*cellH+1} width={cellW-2} height={cellH-2} rx="2"
                fill={intensity===0?C.surfaceBorder:ha(color,0.07+intensity*0.82)}
                stroke={isHov?color:"transparent"} strokeWidth="1" style={{ cursor:"default", transition:"all .12s" }}
              />
              {intensity>0.45 && <text x={60+ci*cellW+cellW/2} y={24+ri*cellH+cellH/2+4} textAnchor="middle" fill={intensity>0.7?C.bg:C.inkMid} fontSize="8" fontFamily="JetBrains Mono">{val}</text>}
            </g>
          );
        }))}
      </svg>
      {hovered && <div style={{ fontSize:11, color:C.inkMid, fontFamily:"'JetBrains Mono',monospace", marginTop:6, textAlign:"center" }}>{rowLabels?.[hovered.r]}, {colLabels?.[hovered.c]||`${hovered.c}h`} · {hovered.val} cases</div>}
    </div>
  );
}

/* ── Progress Bar ── */
function RefinedBar({ value, max, color = C.accentLight, height = 4, label, sublabel }) {
  const pct = max>0?Math.min((value/max)*100,100):0;
  return (
    <div style={{ marginBottom:12 }}>
      {(label||sublabel) && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
          <span style={{ fontSize:12, color:C.inkMid, fontFamily:"'Inter',sans-serif" }}>{label}</span>
          <span style={{ fontSize:11, fontWeight:600, color:C.ink, fontFamily:"'JetBrains Mono',monospace" }}>{sublabel||value}</span>
        </div>
      )}
      <div style={{ height, backgroundColor:C.surfaceBorder, borderRadius:height, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:height, transition:"width 1s cubic-bezier(.4,0,.2,1)", opacity:0.85 }} />
      </div>
    </div>
  );
}

/* ── Sparkline ── */
function Sparkline({ values, color = C.accentLight, height = 40, filled = true }) {
  if (!values?.length||values.length<2) return null;
  const W=160,H=height, mn=Math.min(...values), mx=Math.max(...values), rng=mx-mn||1;
  const pts = values.map((v,i)=>[(i/(values.length-1))*W, H-4-((v-mn)/rng)*(H-8)]);
  const line = pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = pts[pts.length-1];
  const gid = `spark-aa-${color.replace(/[^a-z0-9]/gi,"")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {filled && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"aa-draw .7s ease both" }} />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

/* ── Empty placeholder ── */
function EmptyViz({ height = 100 }) {
  return (
    <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", border:`1px dashed ${C.borderLight}`, borderRadius:8, color:C.inkLight, fontSize:12, fontFamily:"'Inter',sans-serif", letterSpacing:".04em" }}>
      No data available
    </div>
  );
}

/* ── Layout primitives ── */
function Section({ title, sub, accentColor = C.accentLight, delay = 0, children }) {
  return (
    <div style={{ animation:`aa-rise .4s ${delay}s both` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
        <div>
          <h3 style={{ margin:0, fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:C.ink, letterSpacing:"-0.01em" }}>{title}</h3>
          {sub && <p style={{ margin:"3px 0 0", fontSize:12, color:C.inkMid, fontFamily:"'Inter',sans-serif" }}>{sub}</p>}
        </div>
        <div style={{ width:20, height:2, background:accentColor, borderRadius:2, flexShrink:0, opacity:0.7 }} />
      </div>
      {children}
    </div>
  );
}

function Grid({ cols = 2, gap = 16, children }) {
  return <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols}, 1fr)`, gap }}>{children}</div>;
}

function Panel({ children, style = {} }) {
  return <div className="aa-card" style={{ padding:"18px 20px", ...style }}>{children}</div>;
}

function PanelTitle({ children }) {
  return (
    <div style={{ fontSize:10, color:C.inkMid, textTransform:"uppercase", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", fontWeight:700, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${C.borderLight}` }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════ MAIN ══ */
export default function AdvancedAnalytics({ data, loading, error, onRefresh }) {

  if (loading && !data) {
    return (
      <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:32, height:32, border:`2px solid ${C.borderLight}`, borderTop:`2px solid ${C.accentLight}`, borderRadius:"50%", animation:"aa-spin 0.8s linear infinite", margin:"0 auto 20px" }} />
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:15, fontWeight:600, color:C.ink, marginBottom:5 }}>Compiling Analytics</div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:C.inkMid }}>Processing 30 days of operational data…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ textAlign:"center", maxWidth:340 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:C.redFaint, border:`1px solid ${C.redBorder}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:18, color:C.redText }}>!</div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:15, fontWeight:600, color:C.ink, marginBottom:8 }}>Analytics unavailable</div>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:C.inkMid, marginBottom:20, lineHeight:1.6 }}>{error}</div>
          <button className="aa-btn" onClick={onRefresh}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    performance_trends   = [], agent_rankings      = [], hourly_distribution = [],
    daily_distribution   = [], alert_analysis      = [], monitor_analysis    = [],
    shift_duration_stats = {}, productivity_stats  = {}, incident_pattern    = [],
    ticket_volume        = [], agent_consistency   = [], peak_hour           = null,
    coverage_analysis    = [], insights            = [],
  } = data;

  const totalShifts    = performance_trends.reduce((s,d)=>s+(d.shifts||0),0);
  const totalTriaged   = performance_trends.reduce((s,d)=>s+(d.total_triaged||0),0);
  const peakAgents     = Math.max(...performance_trends.map(d=>d.agents||0),0);
  const totalAlerts    = alert_analysis.reduce((s,a)=>s+(a.count||0),0);
  const totalTickets   = ticket_volume.reduce((s,t)=>s+(t.count||0),0);
  const totalIncidents = incident_pattern.reduce((s,i)=>s+(i.count||0),0);

  const trendLabels = performance_trends.map(d=>d.date?.slice(5));
  const triagedVals = performance_trends.map(d=>d.total_triaged||0);
  const shiftsVals  = performance_trends.map(d=>d.shifts||0);
  const agentsVals  = performance_trends.map(d=>d.agents||0);

  const alertDonutData      = alert_analysis.slice(0,8).map(a=>({label:a.alert_type||"Unknown",value:a.count||0}));
  const ticketIncidentDonut = [{label:"Tickets",value:totalTickets},{label:"Incidents",value:totalIncidents},{label:"Alerts",value:totalAlerts}].filter(d=>d.value>0);

  const hmData = Array.from({length:7},()=>Array(24).fill(0));
  hourly_distribution.forEach(h=>daily_distribution.forEach((d,di)=>{ if(hmData[di]&&hmData[di][h.hour]!==undefined) hmData[di][h.hour]=Math.round(h.avg_triaged*(d.unique_agents||1)); }));
  const hmRowLabels = daily_distribution.map(d=>d.day_name?.slice(0,3)||"");
  const hmColLabels = Array.from({length:24},(_,i)=>i%6===0?`${i}h`:"");

  const topHours            = [6,9,12,15,18,21];
  const coverageRadarValues = topHours.map(h=>{const c=coverage_analysis.find(x=>x.hour===h);return c?c.avg_agents:0;});
  const lowCoverageHours    = coverage_analysis.filter(c=>c.avg_agents<2&&c.avg_agents>0);

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:"'Inter',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Top bar */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"0 32px", height:"52px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:C.greenText, animation:"aa-pulse 3s ease-in-out infinite" }} />
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:600, color:C.ink, letterSpacing:"-0.01em" }}>Advanced Analytics</span>
          <span style={{ fontSize:11, color:C.inkMid, marginLeft:2 }}>· 30-day operational analysis</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {loading && <div style={{ width:14, height:14, border:`1.5px solid ${C.borderLight}`, borderTop:`1.5px solid ${C.accentLight}`, borderRadius:"50%", animation:"aa-spin .8s linear infinite" }} />}
          <button className="aa-btn-ghost" onClick={onRefresh}>Refresh</button>
        </div>
      </div>

      <div style={{ padding:"28px 32px", display:"flex", flexDirection:"column", gap:40, maxWidth:1560, margin:"0 auto" }}>

        {/* 1 · INSIGHTS */}
        {insights.length > 0 && (
          <Section title="Operational Insights" sub="Pattern recognition from the last 30 days" accentColor={C.indigo} delay={0}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:12 }}>
              {insights.map((ins,i) => <InsightCard key={i} insight={ins} delay={i*0.04} />)}
            </div>
          </Section>
        )}

        {/* 2 · KPIs */}
        <Section title="Key Performance Indicators" sub="30-day cumulative totals" accentColor={C.accentLight} delay={0.05}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(155px, 1fr))", gap:14 }}>
            <KpiCard value={totalShifts}    label="Total Shifts"    color={C.accentLight} delay={0}    />
            <KpiCard value={totalTriaged}   label="Cases Triaged"   color={C.greenText}   delay={0.05} />
            <KpiCard value={peakAgents}     label="Peak Agents/Day" color={C.indigo}      delay={0.1}  />
            <KpiCard value={totalAlerts}    label="Total Alerts"    color={C.redText}     delay={0.15} />
            <KpiCard value={totalTickets}   label="Tickets"         color={C.amberText}   delay={0.2}  />
            <KpiCard value={totalIncidents} label="Incidents"       color="#a78bfa"       delay={0.25} />
          </div>
        </Section>

        {/* 3 · PERFORMANCE TREND */}
        <Section title="Performance Trend" sub="Daily triaged cases, shift count and active agents — last 30 days" accentColor={C.accentLight} delay={0.1}>
          <Panel>
            <div style={{ display:"flex", gap:20, marginBottom:16 }}>
              {[{label:"Cases Triaged",color:C.accentLight},{label:"Shifts",color:C.indigo},{label:"Agents",color:C.greenText}].map(l=>(
                <div key={l.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:16, height:2, background:l.color, borderRadius:2 }} />
                  <span style={{ fontSize:11, color:C.inkMid, fontFamily:"'Inter',sans-serif" }}>{l.label}</span>
                </div>
              ))}
            </div>
            {performance_trends.length>1
              ? <LineAreaChart datasets={[{name:"Triaged",values:triagedVals,color:C.accentLight},{name:"Shifts",values:shiftsVals,color:C.indigo},{name:"Agents",values:agentsVals,color:C.greenText}]} labels={trendLabels} height={200} />
              : <EmptyViz height={200} />}
          </Panel>
        </Section>

        {/* 4 · ACTIVITY DISTRIBUTION */}
        <Section title="Activity Distribution" sub="Shift start times and triage volume by hour and day" accentColor={C.indigo} delay={0.15}>
          <Grid cols={2} gap={16}>
            <Panel>
              <PanelTitle>Hourly Shift Start Distribution</PanelTitle>
              {hourly_distribution.length>0
                ? <BarChart data={hourly_distribution} xKey="hour" yKey="total_triaged" yKey2="shift_count" color={C.accentLight} color2={C.indigo} height={160} />
                : <EmptyViz height={160} />}
              <div style={{ display:"flex", gap:16, marginTop:10 }}>
                {[{label:"Shifts",color:C.indigo},{label:"Triaged",color:C.accentLight}].map(l=>(
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:7, height:7, borderRadius:1, background:l.color }} />
                    <span style={{ fontSize:11, color:C.inkMid, fontFamily:"'Inter',sans-serif" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel>
              <PanelTitle>Day-of-Week Performance</PanelTitle>
              {daily_distribution.length>0
                ? daily_distribution.map((d,i)=><RefinedBar key={i} label={d.day_name} sublabel={`${d.total_triaged} cases`} value={d.total_triaged} max={Math.max(...daily_distribution.map(x=>x.total_triaged),1)} color={PALETTE[i%PALETTE.length]} height={4} />)
                : <EmptyViz height={160} />}
            </Panel>
          </Grid>
        </Section>

        {/* 5 · HEATMAP */}
        {hmRowLabels.length>0 && (
          <Section title="Activity Heatmap" sub="Triage volume by day of week × hour of day" accentColor={C.accentLight} delay={0.2}>
            <Panel>
              <PanelTitle>Day × Hour Intensity</PanelTitle>
              <HeatmapGrid rows={hmRowLabels.length} cols={24} data={hmData.slice(0,hmRowLabels.length)} rowLabels={hmRowLabels} colLabels={hmColLabels} color="#3b82f6" />
            </Panel>
          </Section>
        )}

        {/* 6 · AGENT PERFORMANCE */}
        <Section title="Agent Performance" sub="Productivity rankings and consistency scores — minimum 3 shifts" accentColor={C.greenText} delay={0.25}>
          <Grid cols={2} gap={16}>
            <Panel>
              <PanelTitle>Productivity Leaderboard — Cases per Hour</PanelTitle>
              {agent_rankings.length>0 ? (
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead className="aa-thead"><tr><th>#</th><th>Agent</th><th>Shifts</th><th>Triaged</th><th>Rate</th></tr></thead>
                  <tbody className="aa-tbody">
                    {agent_rankings.slice(0,8).map((a,i) => {
                      const rc=[C.amberText,C.inkMid,"#8b6914"], rl=["I","II","III"];
                      return (
                        <tr key={a.agent_id} style={{ animation:`aa-rise .3s ${i*0.04}s both` }}>
                          <td><span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700, color:rc[i]||C.inkLight }}>{rl[i]||i+1}</span></td>
                          <td><code style={{ fontSize:11, color:C.inkMid, fontFamily:"'JetBrains Mono',monospace" }}>{a.agent_id?.slice(0,8)}…</code></td>
                          <td style={{ color:C.inkMid }}>{a.shift_count}</td>
                          <td>{a.total_triaged}</td>
                          <td><span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:600, color:C.accentLight, fontSize:12 }}>{a.productivity_rate}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : <EmptyViz height={160} />}
            </Panel>
            <Panel>
              <PanelTitle>Consistency Scores — Lower Variance = Higher Score</PanelTitle>
              {agent_consistency.length>0
                ? agent_consistency.slice(0,8).map((a,i)=>{
                    const score=a.consistency_score||0, color=score>80?C.greenText:score>60?C.amberText:C.redText;
                    return (
                      <div key={a.agent_id} style={{ marginBottom:14, animation:`aa-rise .3s ${i*0.04}s both` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, alignItems:"center" }}>
                          <code style={{ fontSize:11, color:C.inkMid, fontFamily:"'JetBrains Mono',monospace" }}>{a.agent_id?.slice(0,12)}…</code>
                          <span style={{ fontSize:11, fontWeight:600, color, fontFamily:"'JetBrains Mono',monospace" }}>{score}%</span>
                        </div>
                        <div style={{ height:4, background:C.surfaceBorder, borderRadius:4, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${score}%`, background:color, borderRadius:4, transition:"width 1s cubic-bezier(.4,0,.2,1)", opacity:0.85 }} />
                        </div>
                        <div style={{ fontSize:10, color:C.inkLight, marginTop:3, fontFamily:"'Inter',sans-serif" }}>avg {a.avg_triaged} triaged · variance {a.variance}</div>
                      </div>
                    );
                  })
                : <EmptyViz height={160} />}
            </Panel>
          </Grid>
        </Section>

        {/* 7 · ALERTS & MONITORS */}
        <Section title="Alert Intelligence" sub="Alert type distribution, monitor health and volume breakdown" accentColor={C.redText} delay={0.3}>
          <Grid cols={3} gap={16}>
            <Panel>
              <PanelTitle>Alert Type Breakdown</PanelTitle>
              {alertDonutData.length>0?<DonutChart data={alertDonutData} size={170} thickness={22} />:<EmptyViz height={170} />}
            </Panel>
            <Panel>
              <PanelTitle>Volume Distribution</PanelTitle>
              {ticketIncidentDonut.length>0?<DonutChart data={ticketIncidentDonut} size={170} thickness={22} />:<EmptyViz height={170} />}
            </Panel>
            <Panel>
              <PanelTitle>Top Monitors by Alert Count</PanelTitle>
              {monitor_analysis.length>0
                ? monitor_analysis.slice(0,8).map((m,i)=><RefinedBar key={i} label={String(m.monitor).slice(0,18)} sublabel={String(m.alert_count)} value={m.alert_count} max={Math.max(...monitor_analysis.map(x=>x.alert_count),1)} color={PALETTE[i%PALETTE.length]} height={4} />)
                : <EmptyViz height={160} />}
            </Panel>
          </Grid>
        </Section>

        {/* 8 · COVERAGE */}
        <Section title="Coverage Analysis" sub="Average concurrent agents online per hour of day" accentColor={C.indigo} delay={0.35}>
          <Grid cols={2} gap={16}>
            <Panel>
              <PanelTitle>Hourly Agent Coverage (Average)</PanelTitle>
              {coverage_analysis.length>0 ? (
                <>
                  <BarChart data={coverage_analysis} xKey="hour" yKey="avg_agents" color={C.indigo} height={160} />
                  {lowCoverageHours.length>0 && (
                    <div style={{ marginTop:12, padding:"9px 13px", background:C.redFaint, border:`1px solid ${C.redBorder}`, borderRadius:6 }}>
                      <span style={{ fontSize:11, color:C.redText, fontFamily:"'Inter',sans-serif" }}>
                        {lowCoverageHours.length} hour{lowCoverageHours.length>1?"s":""} below 2 agents: {lowCoverageHours.map(c=>`${c.hour}:00`).join(", ")}
                      </span>
                    </div>
                  )}
                </>
              ) : <EmptyViz height={160} />}
            </Panel>
            <Panel>
              <PanelTitle>Coverage Radar — Key Hours</PanelTitle>
              {coverage_analysis.length>0
                ? <div style={{ display:"flex", justifyContent:"center" }}><RadarChart axes={topHours.map(h=>`${h}:00`)} datasets={[{name:"Avg Agents",values:coverageRadarValues,color:C.indigo}]} size={230} /></div>
                : <EmptyViz height={230} />}
            </Panel>
          </Grid>
        </Section>

        {/* 9 · OPERATIONAL STATISTICS */}
        <Section title="Operational Statistics" sub="Shift duration distribution and productivity benchmarks" accentColor={C.accentLight} delay={0.4}>
          <Grid cols={3} gap={16}>
            <Panel>
              <PanelTitle>Shift Duration Distribution</PanelTitle>
              {Object.keys(shift_duration_stats).length>0 ? (
                <>
                  <div style={{ display:"flex", justifyContent:"space-around", marginBottom:14 }}>
                    <GaugeChart value={shift_duration_stats.avg||0} max={shift_duration_stats.max||12} label="AVG HRS" color={C.accentLight} size={110} />
                    <GaugeChart value={shift_duration_stats.median||0} max={shift_duration_stats.max||12} label="MED HRS" color={C.indigo} size={110} />
                  </div>
                  {[{label:"Minimum",value:`${shift_duration_stats.min}h`,color:C.greenText},{label:"Maximum",value:`${shift_duration_stats.max}h`,color:C.redText},{label:"Std Dev",value:`±${shift_duration_stats.std_dev}h`,color:C.inkMid}].map(s=>(
                    <div key={s.label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.borderLight}` }}>
                      <span style={{ fontSize:12, color:C.inkMid, fontFamily:"'Inter',sans-serif" }}>{s.label}</span>
                      <span style={{ fontSize:11, fontWeight:600, color:s.color, fontFamily:"'JetBrains Mono',monospace" }}>{s.value}</span>
                    </div>
                  ))}
                </>
              ) : <EmptyViz height={200} />}
            </Panel>
            <Panel>
              <PanelTitle>Productivity — Cases per Hour</PanelTitle>
              {Object.keys(productivity_stats).length>0 ? (
                <>
                  <div style={{ display:"flex", justifyContent:"space-around", marginBottom:14 }}>
                    <GaugeChart value={productivity_stats.avg||0} max={productivity_stats.max||10} label="AVG" color={C.greenText} size={110} />
                    <GaugeChart value={productivity_stats.median||0} max={productivity_stats.max||10} label="MEDIAN" color={C.amberText} size={110} />
                  </div>
                  {[{label:"Min Rate",value:productivity_stats.min,color:C.redText},{label:"Max Rate",value:productivity_stats.max,color:C.greenText},{label:"Std Dev",value:`±${productivity_stats.std_dev}`,color:C.inkMid}].map(s=>(
                    <div key={s.label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.borderLight}` }}>
                      <span style={{ fontSize:12, color:C.inkMid, fontFamily:"'Inter',sans-serif" }}>{s.label}</span>
                      <span style={{ fontSize:11, fontWeight:600, color:s.color, fontFamily:"'JetBrains Mono',monospace" }}>{s.value}</span>
                    </div>
                  ))}
                </>
              ) : <EmptyViz height={200} />}
            </Panel>
            <Panel style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", background:C.accentFaint, border:`1px solid ${C.accentBorder}` }}>
              {peak_hour ? (
                <>
                  <div style={{ fontSize:10, color:C.accentLight, textTransform:"uppercase", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", fontWeight:700, marginBottom:14 }}>Peak Activity Hour</div>
                  <div style={{ fontFamily:"'Inter',sans-serif", fontSize:64, fontWeight:700, color:C.ink, lineHeight:1, letterSpacing:"-0.04em" }}>
                    {peak_hour.hour}<span style={{ fontSize:26, color:C.inkMid, fontWeight:400 }}>:00</span>
                  </div>
                  <div style={{ width:32, height:1, background:C.accentLight, margin:"14px auto", opacity:0.4 }} />
                  <div style={{ fontSize:12, color:C.inkMid, fontFamily:"'Inter',sans-serif" }}>{peak_hour.total_triaged} cases triaged</div>
                  <div style={{ fontSize:11, color:C.inkLight, marginTop:4, fontFamily:"'Inter',sans-serif" }}>{peak_hour.shift_count} shifts in this window</div>
                </>
              ) : <EmptyViz height={150} />}
            </Panel>
          </Grid>
        </Section>

        {/* 10 · VOLUME TRENDS */}
        <Section title="Volume Trends" sub="Daily ticket submissions and incident reports" accentColor={C.amberText} delay={0.45}>
          <Grid cols={2} gap={16}>
            <Panel>
              <PanelTitle>Daily Ticket Volume</PanelTitle>
              {ticket_volume.length>0 ? (
                <><BarChart data={ticket_volume} xKey="date" yKey="count" color={C.accentLight} height={130} /><Sparkline values={ticket_volume.map(t=>t.count)} color={C.accentLight} height={30} filled={false} /></>
              ) : <EmptyViz height={160} />}
            </Panel>
            <Panel>
              <PanelTitle>Daily Incident Volume</PanelTitle>
              {incident_pattern.length>0 ? (
                <><BarChart data={incident_pattern} xKey="date" yKey="count" color={C.redText} height={130} /><Sparkline values={incident_pattern.map(i=>i.count)} color={C.redText} height={30} filled={false} /></>
              ) : <EmptyViz height={160} />}
            </Panel>
          </Grid>
        </Section>

        {/* 11 · ALERT TYPE ANALYSIS */}
        {alert_analysis.length>0 && (
          <Section title="Alert Type Analysis" sub="Full breakdown of alert categories and shift impact" accentColor={C.redText} delay={0.5}>
            <Panel>
              <PanelTitle>Alert Type vs Shifts Affected</PanelTitle>
              <BarChart data={alert_analysis} xKey="alert_type" yKey="count" yKey2="shifts_affected" color={C.redText} color2={C.amberText} height={160} />
              <div style={{ display:"flex", gap:20, marginTop:12 }}>
                {[{label:"Alert Count",color:C.redText},{label:"Shifts Affected",color:C.amberText}].map(l=>(
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:1, background:l.color }} />
                    <span style={{ fontSize:11, color:C.inkMid, fontFamily:"'Inter',sans-serif" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </Section>
        )}

        <div style={{ height:32 }} />
      </div>
    </div>
  );
}