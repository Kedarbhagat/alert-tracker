import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   ADVANCED ANALYTICS — Enterprise Dark Dashboard
   #0d1117 canvas · #161b22 surface · #30363d borders · Sapphire accent
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
  .aa-btn { background:#2563eb; border:none; color:#fff; border-radius:6px; padding:7px 18px; font-family:'Inter',sans-serif; font-size:12px; font-weight:500; cursor:pointer; transition:background .15s; }
  .aa-btn:hover { background:#1d4ed8; }
  .aa-btn-ghost { background:transparent; border:1px solid #30363d; color:#8b949e; border-radius:6px; padding:7px 18px; font-family:'Inter',sans-serif; font-size:12px; font-weight:500; cursor:pointer; transition:all .15s; }
  .aa-btn-ghost:hover { border-color:#3b82f6; color:#3b82f6; }
  .aa-thead th { padding:10px 14px; font-size:10px; font-family:'Inter',sans-serif; text-transform:uppercase; letter-spacing:.1em; color:#6e7681; background:#21262d; border-bottom:1px solid #30363d; text-align:left; font-weight:600; }
  .aa-tbody tr { border-bottom:1px solid #21262d; transition:background .1s; cursor:pointer; }
  .aa-tbody tr:hover { background:#1c2230; }
  .aa-tbody td { padding:10px 14px; font-size:13px; font-family:'Inter',sans-serif; color:#e6edf3; }
`;

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

function LineAreaChart({ datasets, height = 200, showGrid = true, labels }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef();
  const W = 600, H = height;
  const PAD = { t:14, r:16, b:30, l:48 };
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;
  const allVals = datasets.flatMap(d => d.values).filter(v => Number.isFinite(v));
  if (!allVals.length) return <EmptyViz height={height} />;
  const maxV = Math.max(...allVals, 1);
  const minV = Math.min(...allVals, 0);
  const range = maxV - minV || 1;
  const toX = (i, n) => PAD.l + (i / Math.max(n - 1, 1)) * iW;
  const toY = (v) => PAD.t + iH - ((v - minV) / range) * iH;
  const makePath = (vals) => vals.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i, vals.length).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const makeArea = (vals, path) => `${path} L${toX(vals.length-1,vals.length).toFixed(1)},${(PAD.t+iH).toFixed(1)} L${PAD.l},${(PAD.t+iH).toFixed(1)} Z`;
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(minV + range * t));

  return (
    <div style={{ position:"relative" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height }} onMouseLeave={() => setHovered(null)}>
        <defs>
          {datasets.map((d, di) => (
            <linearGradient key={di} id={`lg-${di}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={d.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={d.color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>
        {showGrid && gridVals.map((gv, i) => {
          const gy = toY(gv);
          return (
            <g key={i}>
              <line x1={PAD.l} y1={gy} x2={W-PAD.r} y2={gy} stroke={C.borderLight} strokeWidth="1" />
              <text x={PAD.l-6} y={gy+4} textAnchor="end" fill={C.inkLight} fontSize="9" fontFamily="JetBrains Mono">{gv}</text>
            </g>
          );
        })}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t+iH} stroke={C.border} strokeWidth="1" />
        <line x1={PAD.l} y1={PAD.t+iH} x2={W-PAD.r} y2={PAD.t+iH} stroke={C.border} strokeWidth="1" />
        {labels?.map((l, i) => {
          if (i % Math.ceil(labels.length / 8) !== 0 && i !== labels.length - 1) return null;
          return <text key={i} x={toX(i, labels.length)} y={H-6} textAnchor="middle" fill={C.inkLight} fontSize="9" fontFamily="JetBrains Mono">{l}</text>;
        })}
        {datasets.map((d, di) => {
          const path = makePath(d.values);
          const area = makeArea(d.values, path);
          const pathLen = d.values.reduce((acc, v, i) => i === 0 ? 0 : acc + Math.hypot(toX(i,d.values.length)-toX(i-1,d.values.length), toY(v)-toY(d.values[i-1])), 0);
          return (
            <g key={di}>
              <path d={area} fill={`url(#lg-${di})`} />
              <path d={path} fill="none" stroke={d.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray:pathLen, "--len":pathLen, strokeDashoffset:0, animation:`aa-draw 1s ${di*.15}s ease both` }} />
              {d.values.map((v, i) => (
                <circle key={i} cx={toX(i,d.values.length)} cy={toY(v)}
                  r={hovered?.di===di && hovered?.i===i ? 4.5 : 2.5}
                  fill={hovered?.di===di && hovered?.i===i ? d.color : C.surface}
                  stroke={d.color} strokeWidth="1.5"
                  style={{ cursor:"crosshair", transition:"r .1s" }}
                  onMouseEnter={(e) => {
                    const rect = svgRef.current?.getBoundingClientRect();
                    setHovered({ di, i, v, label:labels?.[i]||i, color:d.color, name:d.name, x:rect ? e.clientX-rect.left : 0 });
                  }}
                />
              ))}
            </g>
          );
        })}
        {hovered && datasets[0]?.values?.length && (
          <line x1={toX(hovered.i,datasets[0].values.length)} y1={PAD.t} x2={toX(hovered.i,datasets[0].values.length)} y2={PAD.t+iH} stroke={C.border} strokeWidth="1" strokeDasharray="3,3" />
        )}
      </svg>
      {hovered && (
        <div style={{ position:"absolute", left:`${Math.min(Math.max((hovered.x/W)*100,5),80)}%`, top:0, transform:"translateX(-50%)", background:C.surfaceRaised, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 11px", fontSize:11, fontFamily:"'JetBrains Mono',monospace", color:C.ink, whiteSpace:"nowrap", zIndex:10, pointerEvents:"none", boxShadow:"0 4px 16px rgba(0,0,0,0.5)" }}>
          {hovered.label && <span style={{ color:C.inkMid }}>{hovered.label} · </span>}
          {hovered.name}: <strong style={{ color:hovered.color }}>{typeof hovered.v==="number"?hovered.v.toLocaleString():hovered.v}</strong>
        </div>
      )}
    </div>
  );
}

function BarChart({ data, xKey, yKey, color = C.accentLight, height = 150, yKey2, color2 = C.indigo }) {
  const [hovered, setHovered] = useState(null);
  if (!data?.length) return <EmptyViz height={height} />;
  const maxV = Math.max(...data.map(d => Math.max(Number(d[yKey])||0, yKey2?Number(d[yKey2])||0:0)), 1);
  const W = 600, H = height;
  const PAD = { t:10, r:8, b:28, l:8 };
  const bCount = yKey2 ? 2 : 1;
  const barGroupW = (W-PAD.l-PAD.r) / data.length;
  const barPad = bCount > 1 ? 4 : 8;
  const barW = Math.max(2, (barGroupW - barPad*2) / bCount - (bCount>1?2:0));
  return (
    <div style={{ position:"relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height }} onMouseLeave={() => setHovered(null)}>
        <line x1={PAD.l} y1={H-PAD.b} x2={W-PAD.r} y2={H-PAD.b} stroke={C.border} strokeWidth="1" />
        {data.map((d, i) => {
          const gX = PAD.l + i*barGroupW + barPad;
          const h1 = ((Number(d[yKey])||0)/maxV)*(H-PAD.t-PAD.b);
          const h2 = yKey2 ? ((Number(d[yKey2])||0)/maxV)*(H-PAD.t-PAD.b) : 0;
          const isHov = hovered===i;
          const labelStr = String(d[xKey]);
          const showLabel = i%Math.ceil(data.length/8)===0;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <rect x={gX} y={H-PAD.b-Math.max(2,h1)} width={barW} height={Math.max(2,h1)} fill={color} rx="2" opacity={isHov?1:0.75} />
              {yKey2 && <rect x={gX+barW+2} y={H-PAD.b-Math.max(2,h2)} width={barW} height={Math.max(2,h2)} fill={color2} rx="2" opacity={isHov?1:0.75} />}
              {showLabel && <text x={gX+(bCount>1?barW:barW/2)} y={H-PAD.b+14} textAnchor="middle" fill={C.inkLight} fontSize="9" fontFamily="JetBrains Mono">{labelStr.length>6?labelStr.slice(0,6):labelStr}</text>}
              {isHov && <text x={gX+barW/2} y={H-PAD.b-Math.max(2,h1)-5} textAnchor="middle" fill={C.ink} fontSize="10" fontFamily="JetBrains Mono">{d[yKey]}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HBarChart({ data, xKey, yKey, color = C.accentLight, height = 200 }) {
  const [hovered, setHovered] = useState(null);
  if (!data?.length) return <EmptyViz height={height} />;
  const maxV = Math.max(...data.map(d => Number(d[yKey])||0), 1);
  const W = 560, itemH = 22, gap = 6;
  const H = data.length*(itemH+gap)+10;
  const PAD = { l:120, r:50 };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:Math.max(height,H) }}>
      {data.map((d, i) => {
        const y = i*(itemH+gap)+4;
        const bw = ((Number(d[yKey])||0)/maxV)*(W-PAD.l-PAD.r);
        const isHov = hovered===i;
        return (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <text x={PAD.l-8} y={y+itemH/2+4} textAnchor="end" fill={isHov?C.ink:C.inkMid} fontSize="11" fontFamily="Inter">
              {String(d[xKey]).length>16?String(d[xKey]).slice(0,16)+"…":String(d[xKey])}
            </text>
            <rect x={PAD.l} y={y} width={W-PAD.l-PAD.r} height={itemH} fill={C.surfaceBorder} rx="3" />
            <rect x={PAD.l} y={y} width={Math.max(3,bw)} height={itemH} fill={color} rx="3" opacity={isHov?1:0.8} />
            <text x={PAD.l+Math.max(3,bw)+6} y={y+itemH/2+4} fill={C.inkMid} fontSize="10" fontFamily="JetBrains Mono">{d[yKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ data, size = 170, thickness = 22 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const total = data.reduce((s,d)=>s+(Number(d.value)||0),0);
  if (total===0) return <EmptyViz height={size} />;
  const colors = data.map((d,i)=>d.color||PALETTE[i%PALETTE.length]);
  const cx=size/2, cy=size/2, r=size/2-thickness/2-4;
  let angle=-Math.PI/2;
  const slices = data.map((d,i)=>{
    const v=Number(d.value)||0;
    const sweep=(v/total)*2*Math.PI;
    const x1=cx+r*Math.cos(angle), y1=cy+r*Math.sin(angle);
    const x2=cx+r*Math.cos(angle+sweep), y2=cy+r*Math.sin(angle+sweep);
    const large=sweep>Math.PI?1:0;
    angle+=sweep;
    return {...d,value:v,x1,y1,x2,y2,large,color:colors[i],sweep};
  }).filter(s=>s.sweep>0.01);
  const hov=hoveredIdx!==null?slices[hoveredIdx]:null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.surfaceBorder} strokeWidth={thickness} />
        {slices.map((s,i)=>(
          <path key={i} d={`M ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2}`}
            fill="none" stroke={s.color} strokeWidth={hoveredIdx===i?thickness+4:thickness} strokeLinecap="round"
            style={{ cursor:"pointer", transition:"stroke-width .15s, opacity .15s", opacity:hoveredIdx!==null&&hoveredIdx!==i?0.3:1 }}
            onMouseEnter={()=>setHoveredIdx(i)} onMouseLeave={()=>setHoveredIdx(null)}
          />
        ))}
        <text x={cx} y={cy-5} textAnchor="middle" fill={C.ink} fontSize={size*0.15} fontFamily="Inter" fontWeight="700" letterSpacing="-1">
          {hov?hov.value.toLocaleString():total.toLocaleString()}
        </text>
        <text x={cx} y={cy+14} textAnchor="middle" fill={C.inkMid} fontSize={size*0.08} fontFamily="Inter" fontWeight="600" letterSpacing="1">
          {hov?(hov.label||"").slice(0,12):"TOTAL"}
        </text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:8, minWidth:120 }}>
        {slices.map((s,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", opacity:hoveredIdx!==null&&hoveredIdx!==i?0.35:1, transition:"opacity .15s" }}
            onMouseEnter={()=>setHoveredIdx(i)} onMouseLeave={()=>setHoveredIdx(null)}>
            <div style={{ width:7,height:7,borderRadius:2,backgroundColor:s.color,flexShrink:0 }} />
            <span style={{ fontSize:12,color:C.inkMid,fontFamily:"'Inter',sans-serif",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.label}</span>
            <span style={{ fontSize:12,fontWeight:600,color:C.ink,fontFamily:"'JetBrains Mono',monospace",flexShrink:0 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RefinedBar({ value, max, color = C.accentLight, height = 4, label, sublabel }) {
  const pct = max>0?Math.min((value/max)*100,100):0;
  return (
    <div style={{ marginBottom:12 }}>
      {(label||sublabel) && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
          <span style={{ fontSize:12,color:C.inkMid,fontFamily:"'Inter',sans-serif" }}>{label}</span>
          <span style={{ fontSize:11,fontWeight:600,color:C.ink,fontFamily:"'JetBrains Mono',monospace" }}>{sublabel||value}</span>
        </div>
      )}
      <div style={{ height,backgroundColor:C.surfaceBorder,borderRadius:height,overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${pct}%`,background:color,borderRadius:height,transition:"width 1s cubic-bezier(.4,0,.2,1)",opacity:0.85 }} />
      </div>
    </div>
  );
}

function EmptyViz({ height = 100 }) {
  return (
    <div style={{ height,display:"flex",alignItems:"center",justifyContent:"center",border:`1px dashed ${C.borderLight}`,borderRadius:8,color:C.inkLight,fontSize:12,fontFamily:"'Inter',sans-serif",letterSpacing:".04em" }}>
      No data available
    </div>
  );
}

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
  return <div style={{ display:"grid", gridTemplateColumns:`repeat(${cols},1fr)`, gap }}>{children}</div>;
}

function Panel({ children, style = {} }) {
  return <div className="aa-card" style={{ padding:"18px 20px", ...style }}>{children}</div>;
}

function PanelTitle({ children }) {
  return (
    <div style={{ fontSize:10,color:C.inkMid,textTransform:"uppercase",letterSpacing:".1em",fontFamily:"'Inter',sans-serif",fontWeight:700,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${C.borderLight}` }}>
      {children}
    </div>
  );
}

function StatRow({ label, value, color = C.ink }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.borderLight}` }}>
      <span style={{ fontSize:12,color:C.inkMid,fontFamily:"'Inter',sans-serif" }}>{label}</span>
      <span style={{ fontSize:12,fontWeight:600,color,fontFamily:"'JetBrains Mono',monospace" }}>{value}</span>
    </div>
  );
}

/* ══════════════════ AGENT DETAIL SLIDE-IN PANEL ══ */
function AgentDetailPanel({ agent, onClose }) {
  if (!agent) return null;
  const name  = agent.agent_name || (agent.agent_id?.slice(0,10)+"…");
  const color = PALETTE[Math.abs((name.charCodeAt(0)||65)-65) % PALETTE.length];

  const ticketTrend   = agent.ticket_trend   || [];
  const alertTrend    = agent.alert_trend    || [];
  const incidentTrend = agent.incident_trend || [];
  const adhocTrend    = agent.adhoc_trend    || [];

  const allDates = [...new Set([...ticketTrend,...alertTrend,...incidentTrend,...adhocTrend].map(d=>d.date).filter(Boolean))].sort();
  const makeVals = (arr) => allDates.map(d => { const f=arr.find(x=>x.date===d); return f?Number(f.count)||0:0; });
  const tVals=makeVals(ticketTrend), aVals=makeVals(alertTrend), iVals=makeVals(incidentTrend), hVals=makeVals(adhocTrend);
  const shortDates = allDates.map(d=>d?.slice(5)||"");

  const topAlerts   = (agent.alert_breakdown  ||[]).slice(0,6);
  const topMonitors = (agent.monitor_breakdown||[]).slice(0,6);
  const recentShifts= (agent.recent_shifts    ||[]).slice(0,10);

  const kpis = [
    { label:"Shifts",        value:agent.shift_count      || 0, color:C.accentLight },
    { label:"Triaged",       value:agent.total_triaged    || 0, color:C.greenText   },
    { label:"Tickets",       value:agent.total_tickets    || 0, color:C.amberText   },
    { label:"Alerts",        value:agent.total_alerts     || 0, color:C.redText     },
    { label:"Incidents",     value:agent.total_incidents  || 0, color:"#a78bfa"     },
    { label:"Ad-hoc",        value:agent.total_adhoc      || 0, color:C.inkMid      },
    { label:"Avg Triaged/Shift", value:agent.avg_triaged_per_shift || "—", color:C.ink },
    { label:"Avg Shift hrs",     value:agent.avg_shift_hours       || "—", color:C.ink },
  ];

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",backdropFilter:"blur(3px)" }}
      onClick={onClose}>
      <div style={{ width:"min(800px,96vw)",height:"100vh",background:C.surface,borderLeft:`1px solid ${C.border}`,overflowY:"auto",padding:"28px 28px 60px",display:"flex",flexDirection:"column",gap:26,animation:"aa-rise .2s ease" }}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:48,height:48,borderRadius:"50%",background:color+"22",border:`2px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color,fontFamily:"'Inter',sans-serif" }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily:"'Inter',sans-serif",fontSize:17,fontWeight:700,color:C.ink }}>{name}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.inkMid,marginTop:2 }}>{agent.agent_id}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"transparent",border:`1px solid ${C.border}`,color:C.inkMid,borderRadius:6,padding:"6px 14px",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12 }}>✕ Close</button>
        </div>

        {/* KPI grid */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10 }}>
          {kpis.map(k=>(
            <div key={k.label} style={{ background:C.bgAlt,border:`1px solid ${C.borderLight}`,borderRadius:8,padding:"12px 14px" }}>
              <div style={{ fontSize:22,fontWeight:700,color:k.color,fontFamily:"'Inter',sans-serif",letterSpacing:"-0.03em" }}>
                {typeof k.value==="number"?k.value.toLocaleString():k.value}
              </div>
              <div style={{ fontSize:10,color:C.inkMid,textTransform:"uppercase",letterSpacing:".08em",fontFamily:"'Inter',sans-serif",fontWeight:600,marginTop:3 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Activity over time */}
        {allDates.length>1 && (
          <div>
            <div style={{ fontSize:10,color:C.inkMid,textTransform:"uppercase",letterSpacing:".1em",fontFamily:"'Inter',sans-serif",fontWeight:700,marginBottom:10 }}>Activity Over Time</div>
            <div style={{ display:"flex",gap:16,marginBottom:10,flexWrap:"wrap" }}>
              {[{label:"Tickets",color:C.amberText},{label:"Alerts",color:C.redText},{label:"Incidents",color:"#a78bfa"},{label:"Ad-hoc",color:C.inkMid}].map(l=>(
                <div key={l.label} style={{ display:"flex",alignItems:"center",gap:5 }}>
                  <div style={{ width:16,height:2,background:l.color,borderRadius:2 }} />
                  <span style={{ fontSize:11,color:C.inkMid,fontFamily:"'Inter',sans-serif" }}>{l.label}</span>
                </div>
              ))}
            </div>
            <LineAreaChart
              datasets={[
                {name:"Tickets",  values:tVals,color:C.amberText},
                {name:"Alerts",   values:aVals,color:C.redText},
                {name:"Incidents",values:iVals,color:"#a78bfa"},
                {name:"Ad-hoc",   values:hVals,color:C.inkMid},
              ]}
              labels={shortDates}
              height={155}
            />
          </div>
        )}

        {/* Alert types + Monitors side by side */}
        <Grid cols={2} gap={14}>
          <div>
            <div style={{ fontSize:10,color:C.inkMid,textTransform:"uppercase",letterSpacing:".1em",fontFamily:"'Inter',sans-serif",fontWeight:700,marginBottom:10 }}>Alert Types Handled</div>
            {topAlerts.length>0
              ? topAlerts.map((a,i)=><RefinedBar key={i} label={a.alert_type||"Unknown"} sublabel={String(a.count)} value={a.count} max={Math.max(...topAlerts.map(x=>x.count),1)} color={PALETTE[i%PALETTE.length]} height={5} />)
              : <EmptyViz height={80} />}
          </div>
          <div>
            <div style={{ fontSize:10,color:C.inkMid,textTransform:"uppercase",letterSpacing:".1em",fontFamily:"'Inter',sans-serif",fontWeight:700,marginBottom:10 }}>Top Monitors</div>
            {topMonitors.length>0
              ? topMonitors.map((m,i)=><RefinedBar key={i} label={m.monitor||"Unknown"} sublabel={String(m.count)} value={m.count} max={Math.max(...topMonitors.map(x=>x.count),1)} color={PALETTE[(i+3)%PALETTE.length]} height={5} />)
              : <EmptyViz height={80} />}
          </div>
        </Grid>

        {/* Recent shifts table */}
        {recentShifts.length>0 && (
          <div>
            <div style={{ fontSize:10,color:C.inkMid,textTransform:"uppercase",letterSpacing:".1em",fontFamily:"'Inter',sans-serif",fontWeight:700,marginBottom:10 }}>Recent Shifts</div>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead className="aa-thead">
                <tr><th>Date</th><th>Duration</th><th>Triaged</th><th>Tickets</th><th>Alerts</th><th>Incidents</th><th>Ad-hoc</th></tr>
              </thead>
              <tbody className="aa-tbody">
                {recentShifts.map((s,i)=>(
                  <tr key={i} style={{ cursor:"default" }}>
                    <td style={{ color:C.inkMid,fontSize:11 }}>{s.date||"—"}</td>
                    <td style={{ fontFamily:"'JetBrains Mono',monospace",fontSize:11 }}>{s.duration_hours?`${s.duration_hours}h`:"—"}</td>
                    <td style={{ color:C.accentLight }}>{s.triaged_count??0}</td>
                    <td style={{ color:C.amberText }}>{s.ticket_count??0}</td>
                    <td style={{ color:C.redText }}>{s.alert_count??0}</td>
                    <td style={{ color:"#a78bfa" }}>{s.incident_count??0}</td>
                    <td style={{ color:C.inkMid }}>{s.adhoc_count??0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ MAIN ══ */
export default function AdvancedAnalytics({ data, loading, error, onRefresh }) {
  const [selectedAgent, setSelectedAgent] = useState(null);

  if (loading && !data) {
    return (
      <div style={{ background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:32,height:32,border:`2px solid ${C.borderLight}`,borderTop:`2px solid ${C.accentLight}`,borderRadius:"50%",animation:"aa-spin 0.8s linear infinite",margin:"0 auto 20px" }} />
          <div style={{ fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:600,color:C.ink,marginBottom:5 }}>Compiling Analytics</div>
          <div style={{ fontFamily:"'Inter',sans-serif",fontSize:12,color:C.inkMid }}>Processing operational data…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <style>{GLOBAL_CSS}</style>
        <div style={{ textAlign:"center",maxWidth:340 }}>
          <div style={{ width:40,height:40,borderRadius:"50%",background:C.redFaint,border:`1px solid ${C.redBorder}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:18,color:C.redText }}>!</div>
          <div style={{ fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:600,color:C.ink,marginBottom:8 }}>Analytics unavailable</div>
          <div style={{ fontFamily:"'Inter',sans-serif",fontSize:12,color:C.inkMid,marginBottom:20,lineHeight:1.6 }}>{error}</div>
          <button className="aa-btn" onClick={onRefresh}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    performance_trends   = [],
    agent_rankings       = [],
    hourly_distribution  = [],
    daily_distribution   = [],
    alert_analysis       = [],
    monitor_analysis     = [],
    shift_duration_stats = {},
    incident_pattern     = [],
    ticket_volume        = [],
    agent_consistency    = [],
    peak_hour            = null,
    insights             = [],
    agent_detail         = [],
  } = data;

  /* ── Totals ── */
  const totalShifts    = performance_trends.reduce((s,d)=>s+(Number(d.shifts)||0),0);
  const totalTriaged   = performance_trends.reduce((s,d)=>s+(Number(d.total_triaged)||0),0);
  const peakAgents     = Math.max(...performance_trends.map(d=>Number(d.agents)||0),0);
  const totalAlerts    = alert_analysis.reduce((s,a)=>s+(Number(a.count)||0),0);
  const totalTickets   = ticket_volume.reduce((s,t)=>s+(Number(t.count)||0),0);
  const totalIncidents = incident_pattern.reduce((s,i)=>s+(Number(i.count)||0),0);

  /* ── Performance trend ── */
  const trendLabels = performance_trends.map(d=>d.date?.slice(5)||"");
  const triagedVals = performance_trends.map(d=>Number(d.total_triaged)||0);
  const shiftsVals  = performance_trends.map(d=>Number(d.shifts)||0);
  const agentsVals  = performance_trends.map(d=>Number(d.agents)||0);

  /* ── Volume trend (tickets + incidents merged) ── */
  const volDates = [...new Set([...ticket_volume,...incident_pattern].map(d=>d.date).filter(Boolean))].sort();
  const tickVals = volDates.map(d=>{const f=ticket_volume.find(x=>x.date===d);return f?Number(f.count)||0:0;});
  const incVals  = volDates.map(d=>{const f=incident_pattern.find(x=>x.date===d);return f?Number(f.count)||0:0;});

  /* ── Donuts ── */
  const alertDonut = alert_analysis.slice(0,8).map(a=>({label:a.alert_type||"Unknown",value:Number(a.count)||0}));
  const volDonut   = [{label:"Tickets",value:totalTickets,color:C.amberText},{label:"Incidents",value:totalIncidents,color:"#a78bfa"},{label:"Alerts",value:totalAlerts,color:C.redText}].filter(d=>d.value>0);

  /* ── Agent table ── */
  // agent_rankings now includes all counts directly from the backend.
  // agent_consistency is merged in for the consistency_score only.
  const agentTable = agent_rankings.map(a => {
    const cons = agent_consistency.find(c => c.agent_id === a.agent_id) || {};
    return { ...a, ...cons };
  });

  return (
    <div style={{ background:C.bg,minHeight:"100vh",fontFamily:"'Inter',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>
      {selectedAgent && <AgentDetailPanel agent={selectedAgent} onClose={()=>setSelectedAgent(null)} />}

      {/* Topbar */}
      <div style={{ background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 32px",height:"52px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:5,height:5,borderRadius:"50%",background:C.greenText,animation:"aa-pulse 3s ease-in-out infinite" }} />
          <span style={{ fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600,color:C.ink,letterSpacing:"-0.01em" }}>Advanced Analytics</span>
          <span style={{ fontSize:11,color:C.inkMid,marginLeft:2 }}>· 30-day operational view</span>
        </div>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          {loading && <div style={{ width:14,height:14,border:`1.5px solid ${C.borderLight}`,borderTop:`1.5px solid ${C.accentLight}`,borderRadius:"50%",animation:"aa-spin .8s linear infinite" }} />}
          <button className="aa-btn-ghost" onClick={onRefresh}>Refresh</button>
        </div>
      </div>

      <div style={{ padding:"28px 32px",display:"flex",flexDirection:"column",gap:40,maxWidth:1560,margin:"0 auto" }}>

        {/* 1 · INSIGHTS */}
        {insights.length>0 && (
          <Section title="Operational Insights" sub="Pattern recognition from the last 30 days" accentColor={C.indigo} delay={0}>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12 }}>
              {insights.map((ins,i)=><InsightCard key={i} insight={ins} delay={i*0.04} />)}
            </div>
          </Section>
        )}

        {/* 2 · KPIs */}
        <Section title="Key Metrics" sub="30-day cumulative totals" accentColor={C.accentLight} delay={0.05}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14 }}>
            <KpiCard value={totalShifts}    label="Total Shifts"    color={C.accentLight} delay={0}    />
            <KpiCard value={totalTriaged}   label="Cases Triaged"   color={C.greenText}   delay={0.05} />
            <KpiCard value={peakAgents}     label="Peak Agents/Day" color={C.indigo}      delay={0.1}  />
            <KpiCard value={totalAlerts}    label="Total Alerts"    color={C.redText}     delay={0.15} />
            <KpiCard value={totalTickets}   label="Tickets"         color={C.amberText}   delay={0.2}  />
            <KpiCard value={totalIncidents} label="Incidents"       color="#a78bfa"       delay={0.25} />
          </div>
        </Section>

        {/* 3 · PERFORMANCE TREND */}
        <Section title="Performance Trend" sub="Daily triaged cases, shifts and active agents over 30 days" accentColor={C.accentLight} delay={0.1}>
          <Panel>
            <div style={{ display:"flex",gap:20,marginBottom:16,flexWrap:"wrap" }}>
              {[{label:"Cases Triaged",color:C.accentLight},{label:"Shifts",color:C.indigo},{label:"Agents",color:C.greenText}].map(l=>(
                <div key={l.label} style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <div style={{ width:16,height:2,background:l.color,borderRadius:2 }} />
                  <span style={{ fontSize:11,color:C.inkMid,fontFamily:"'Inter',sans-serif" }}>{l.label}</span>
                </div>
              ))}
            </div>
            {performance_trends.length>1
              ? <LineAreaChart
                  datasets={[
                    {name:"Triaged",values:triagedVals,color:C.accentLight},
                    {name:"Shifts", values:shiftsVals, color:C.indigo},
                    {name:"Agents", values:agentsVals, color:C.greenText},
                  ]}
                  labels={trendLabels}
                  height={220}
                />
              : <EmptyViz height={220} />}
          </Panel>
        </Section>

        {/* 4 · VOLUME TRENDS */}
        <Section title="Volume Trends" sub="Daily ticket and incident counts" accentColor={C.amberText} delay={0.15}>
          <Grid cols={2} gap={16}>
            <Panel>
              <PanelTitle>Tickets vs Incidents — Daily</PanelTitle>
              <div style={{ display:"flex",gap:16,marginBottom:10 }}>
                {[{label:"Tickets",color:C.amberText},{label:"Incidents",color:"#a78bfa"}].map(l=>(
                  <div key={l.label} style={{ display:"flex",alignItems:"center",gap:5 }}>
                    <div style={{ width:14,height:2,background:l.color,borderRadius:2 }} />
                    <span style={{ fontSize:11,color:C.inkMid,fontFamily:"'Inter',sans-serif" }}>{l.label}</span>
                  </div>
                ))}
              </div>
              {volDates.length>1
                ? <LineAreaChart
                    datasets={[
                      {name:"Tickets",  values:tickVals,color:C.amberText},
                      {name:"Incidents",values:incVals, color:"#a78bfa"},
                    ]}
                    labels={volDates.map(d=>d?.slice(5)||"")}
                    height={180}
                  />
                : <EmptyViz height={180} />}
            </Panel>
            <Panel>
              <PanelTitle>Volume Distribution</PanelTitle>
              {volDonut.length>0?<DonutChart data={volDonut} size={170} thickness={22} />:<EmptyViz height={170} />}
            </Panel>
          </Grid>
        </Section>

        {/* 5 · ACTIVITY DISTRIBUTION */}
        <Section title="Activity Distribution" sub="When shifts happen and triage volume by hour and day" accentColor={C.indigo} delay={0.2}>
          <Grid cols={2} gap={16}>
            <Panel>
              <PanelTitle>Hourly Distribution — Shifts & Cases</PanelTitle>
              {hourly_distribution.length>0
                ? <>
                    <BarChart data={hourly_distribution} xKey="hour" yKey="total_triaged" yKey2="shift_count" color={C.accentLight} color2={C.indigo} height={160} />
                    <div style={{ display:"flex",gap:16,marginTop:10 }}>
                      {[{label:"Cases Triaged",color:C.accentLight},{label:"Shifts",color:C.indigo}].map(l=>(
                        <div key={l.label} style={{ display:"flex",alignItems:"center",gap:5 }}>
                          <div style={{ width:7,height:7,borderRadius:1,background:l.color }} />
                          <span style={{ fontSize:11,color:C.inkMid,fontFamily:"'Inter',sans-serif" }}>{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                : <EmptyViz height={160} />}
            </Panel>
            <Panel>
              <PanelTitle>Day-of-Week Breakdown</PanelTitle>
              {daily_distribution.length>0
                ? daily_distribution.map((d,i)=>(
                    <RefinedBar key={i} label={d.day_name} sublabel={`${d.total_triaged} cases · ${d.unique_agents||0} agents`} value={d.total_triaged} max={Math.max(...daily_distribution.map(x=>x.total_triaged),1)} color={PALETTE[i%PALETTE.length]} height={5} />
                  ))
                : <EmptyViz height={160} />}
            </Panel>
          </Grid>
        </Section>

        {/* 6 · ALERT INTELLIGENCE */}
        <Section title="Alert Intelligence" sub="Alert type distribution and monitor health" accentColor={C.redText} delay={0.25}>
          <Grid cols={2} gap={16}>
            <Panel>
              <PanelTitle>Alert Type Breakdown</PanelTitle>
              {alertDonut.length>0?<DonutChart data={alertDonut} size={170} thickness={22} />:<EmptyViz height={170} />}
            </Panel>
            <Panel>
              <PanelTitle>Top Monitors by Alert Count</PanelTitle>
              {monitor_analysis.length>0
                ? <HBarChart
                    data={monitor_analysis.slice(0,8).map(m=>({label:m.monitor,count:m.alert_count}))}
                    xKey="label" yKey="count"
                    color={C.redText}
                    height={200}
                  />
                : <EmptyViz height={160} />}
            </Panel>
          </Grid>
          {alert_analysis.length>0 && (
            <Panel style={{ marginTop:16 }}>
              <PanelTitle>Alert Type vs Shifts Affected</PanelTitle>
              <BarChart data={alert_analysis} xKey="alert_type" yKey="count" yKey2="shifts_affected" color={C.redText} color2={C.amberText} height={160} />
              <div style={{ display:"flex",gap:20,marginTop:10 }}>
                {[{label:"Alert Count",color:C.redText},{label:"Shifts Affected",color:C.amberText}].map(l=>(
                  <div key={l.label} style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <div style={{ width:7,height:7,borderRadius:1,background:l.color }} />
                    <span style={{ fontSize:11,color:C.inkMid,fontFamily:"'Inter',sans-serif" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </Section>

        {/* 7 · SHIFT STATS */}
        <Section title="Shift Statistics" sub="Duration distribution and peak activity" accentColor={C.accentLight} delay={0.3}>
          <Grid cols={2} gap={16}>
            <Panel>
              <PanelTitle>Shift Duration</PanelTitle>
              {Object.keys(shift_duration_stats).length>0
                ? <>
                    <StatRow label="Average"  value={`${shift_duration_stats.avg??   "—"}h`} color={C.accentLight} />
                    <StatRow label="Median"   value={`${shift_duration_stats.median??"—"}h`} color={C.indigo} />
                    <StatRow label="Minimum"  value={`${shift_duration_stats.min??   "—"}h`} color={C.greenText} />
                    <StatRow label="Maximum"  value={`${shift_duration_stats.max??   "—"}h`} color={C.redText} />
                    <StatRow label="Std Dev"  value={`±${shift_duration_stats.std_dev??"—"}h`} color={C.inkMid} />
                  </>
                : <EmptyViz height={140} />}
            </Panel>
            <Panel style={{ display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",background:C.accentFaint,border:`1px solid ${C.accentBorder}` }}>
              {peak_hour
                ? <>
                    <div style={{ fontSize:10,color:C.accentLight,textTransform:"uppercase",letterSpacing:".1em",fontFamily:"'Inter',sans-serif",fontWeight:700,marginBottom:14 }}>Peak Activity Hour</div>
                    <div style={{ fontFamily:"'Inter',sans-serif",fontSize:64,fontWeight:700,color:C.ink,lineHeight:1,letterSpacing:"-0.04em" }}>
                      {peak_hour.hour}<span style={{ fontSize:26,color:C.inkMid,fontWeight:400 }}>:00</span>
                    </div>
                    <div style={{ width:32,height:1,background:C.accentLight,margin:"14px auto",opacity:0.4 }} />
                    <div style={{ fontSize:12,color:C.inkMid,fontFamily:"'Inter',sans-serif" }}>{peak_hour.total_triaged} cases triaged</div>
                    <div style={{ fontSize:11,color:C.inkLight,marginTop:4,fontFamily:"'Inter',sans-serif" }}>{peak_hour.shift_count} shifts in this window</div>
                  </>
                : <EmptyViz height={150} />}
            </Panel>
          </Grid>
        </Section>

        {/* 8 · AGENT BREAKDOWN — click for detail */}
        <Section title="Agent Breakdown" sub="All agents — click any row for full activity detail, trends and shift history" accentColor={C.greenText} delay={0.35}>
          <Panel>
            {agentTable.length>0
              ? <>
                  <div style={{ fontSize:11,color:C.inkMid,fontFamily:"'Inter',sans-serif",marginBottom:14,display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontSize:13 }}>👆</span> Click a row to open the agent's full detail panel
                  </div>
                  <table style={{ width:"100%",borderCollapse:"collapse" }}>
                    <thead className="aa-thead">
                      <tr>
                        <th>Agent</th><th>Shifts</th><th>Triaged</th><th>Tickets</th>
                        <th>Alerts</th><th>Incidents</th><th>Ad-hoc</th><th>Consistency</th>
                      </tr>
                    </thead>
                    <tbody className="aa-tbody">
                      {agentTable.map((a,i)=>{
                        const name  = a.agent_name||(a.agent_id?.slice(0,10)+"…");
                        const color = PALETTE[i%PALETTE.length];
                        const score = a.consistency_score||0;
                        const sColor= score>80?C.greenText:score>60?C.amberText:score>0?C.redText:C.inkMid;
                        return (
                          <tr key={a.agent_id} style={{ animation:`aa-rise .3s ${i*0.04}s both` }} onClick={()=>setSelectedAgent(a)}>
                            <td>
                              <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                                <div style={{ width:28,height:28,borderRadius:"50%",background:color+"22",border:`1.5px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color,flexShrink:0 }}>
                                  {name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontFamily:"'Inter',sans-serif",fontWeight:500 }}>{name}</span>
                              </div>
                            </td>
                            <td style={{ fontFamily:"'JetBrains Mono',monospace",color:C.inkMid,fontSize:12 }}>{a.shift_count??  "—"}</td>
                            <td style={{ fontWeight:600,color:C.accentLight }}>{a.total_triaged?? "—"}</td>
                            <td style={{ color:C.amberText }}>{a.total_tickets??  "—"}</td>
                            <td style={{ color:C.redText }}>{a.total_alerts??   "—"}</td>
                            <td style={{ color:"#a78bfa" }}>{a.total_incidents??"—"}</td>
                            <td style={{ color:C.inkMid }}>{a.total_adhoc??     "—"}</td>
                            <td>
                              {score>0
                                ? <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                                    <div style={{ flex:1,height:3,background:C.surfaceBorder,borderRadius:3,overflow:"hidden",minWidth:40 }}>
                                      <div style={{ height:"100%",width:`${score}%`,background:sColor,borderRadius:3,transition:"width 1s" }} />
                                    </div>
                                    <span style={{ fontSize:11,fontWeight:600,color:sColor,fontFamily:"'JetBrains Mono',monospace",flexShrink:0 }}>{score}%</span>
                                  </div>
                                : <span style={{ color:C.inkLight,fontSize:11 }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              : <EmptyViz height={200} />}
          </Panel>
        </Section>

        <div style={{ height:32 }} />
      </div>
    </div>
  );
}