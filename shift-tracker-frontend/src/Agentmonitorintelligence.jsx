import { useState, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────────────────
   AGENT · MONITOR · INTELLIGENCE
   Deep-dive tab: Agent → Shift → Monitor → Alert drill-down
   Alerts are grouped by monitor and show exact submission timestamps.
───────────────────────────────────────────────────────────────────────────── */

const C = {
  bg:           "#0d1117",
  bgAlt:        "#161b22",
  surface:      "#161b22",
  raised:       "#1c2230",
  border:       "#30363d",
  borderLight:  "#21262d",
  ink:          "#e6edf3",
  inkMid:       "#8b949e",
  inkLight:     "#6e7681",
  accent:       "#2563eb",
  accentLight:  "#3b82f6",
  accentBorder: "rgba(37,99,235,0.3)",
  greenText:    "#3fb950",
  greenFaint:   "rgba(35,134,54,0.15)",
  greenBorder:  "rgba(35,134,54,0.3)",
  red:          "#da3633",
  redText:      "#f85149",
  redFaint:     "rgba(218,54,51,0.12)",
  redBorder:    "rgba(218,54,51,0.3)",
  amberText:    "#d29922",
  amberFaint:   "rgba(158,106,3,0.15)",
  amberBorder:  "rgba(158,106,3,0.3)",
  indigo:       "#6366f1",
  indigoFaint:  "rgba(99,102,241,0.12)",
  indigoBorder: "rgba(99,102,241,0.3)",
  purple:       "#a78bfa",
  purpleFaint:  "rgba(167,139,250,0.15)",
  purpleBorder: "rgba(167,139,250,0.3)",
};

const PALETTE = ["#3b82f6","#6366f1","#3fb950","#f85149","#d29922","#a78bfa","#22d3ee","#fb923c","#34d399","#f472b6"];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  @keyframes ami-rise { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  @keyframes ami-spin { to { transform:rotate(360deg); } }
  *, *::before, *::after { box-sizing:border-box; }

  .ami-card { background:${C.surface}; border:1px solid ${C.border}; border-radius:10px; transition:border-color .18s; }
  .ami-card:hover { border-color:${C.accentBorder}; }
  .ami-card-click { cursor:pointer; }
  .ami-card-click:hover { border-color:${C.accentLight}; background:${C.raised}; }

  .ami-btn { background:${C.accent}; border:none; color:#fff; border-radius:6px; padding:7px 16px; font-family:'Inter',sans-serif; font-size:12px; font-weight:500; cursor:pointer; transition:background .15s; white-space:nowrap; }
  .ami-btn:hover { background:#1d4ed8; }
  .ami-btn-ghost { background:transparent; border:1px solid ${C.border}; color:${C.inkMid}; border-radius:6px; padding:7px 16px; font-family:'Inter',sans-serif; font-size:12px; font-weight:500; cursor:pointer; transition:all .15s; white-space:nowrap; }
  .ami-btn-ghost:hover { border-color:${C.accentLight}; color:${C.accentLight}; }

  .ami-input { background:${C.bgAlt}; border:1px solid ${C.border}; border-radius:6px; padding:8px 12px; font-size:13px; font-family:'Inter',sans-serif; color:${C.ink}; outline:none; transition:border-color .15s; }
  .ami-input:focus { border-color:${C.accentLight}; }
  .ami-input::placeholder { color:${C.inkLight}; }
  .ami-select { background:${C.bgAlt}; border:1px solid ${C.border}; border-radius:6px; padding:8px 12px; font-size:13px; font-family:'Inter',sans-serif; color:${C.ink}; outline:none; cursor:pointer; }
  .ami-select:focus { border-color:${C.accentLight}; }

  .ami-tab { padding:10px 18px; border:none; background:transparent; cursor:pointer; font-size:12px; font-family:'Inter',sans-serif; font-weight:500; color:${C.inkMid}; border-bottom:2px solid transparent; transition:color .15s,border-color .15s; white-space:nowrap; }
  .ami-tab:hover { color:${C.ink}; }
  .ami-tab-active { color:${C.accentLight} !important; border-bottom-color:${C.accentLight} !important; }

  .ami-thead th { padding:10px 14px; font-size:10px; font-family:'Inter',sans-serif; text-transform:uppercase; letter-spacing:.1em; color:${C.inkLight}; background:${C.borderLight}; border-bottom:1px solid ${C.border}; text-align:left; font-weight:600; white-space:nowrap; }
  .ami-tbody tr { border-bottom:1px solid ${C.borderLight}; transition:background .1s; }
  .ami-tbody tr:hover { background:${C.raised}; }
  .ami-tbody td { padding:11px 14px; font-size:13px; font-family:'Inter',sans-serif; color:${C.ink}; }

  .ami-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); display:flex; align-items:center; justify-content:center; z-index:1200; backdrop-filter:blur(4px); padding:24px; }
  .ami-modal { background:${C.surface}; border:1px solid ${C.border}; border-radius:14px; width:100%; max-width:920px; max-height:90vh; overflow-y:auto; box-shadow:0 24px 56px rgba(0,0,0,0.8); animation:ami-rise .2s ease; }
  .ami-modal-hdr { padding:20px 24px; border-bottom:1px solid ${C.border}; display:flex; justify-content:space-between; align-items:flex-start; position:sticky; top:0; background:${C.surface}; z-index:10; }
  .ami-modal-body { padding:24px; }

  .ami-badge-red    { display:inline-flex; align-items:center; padding:2px 9px; background:${C.redFaint};    border:1px solid ${C.redBorder};    border-radius:999px; font-size:11px; font-weight:600; color:${C.redText};    font-family:'Inter',sans-serif; }
  .ami-badge-amber  { display:inline-flex; align-items:center; padding:2px 9px; background:${C.amberFaint};  border:1px solid ${C.amberBorder};  border-radius:999px; font-size:11px; font-weight:600; color:${C.amberText};  font-family:'Inter',sans-serif; }
  .ami-badge-indigo { display:inline-flex; align-items:center; padding:2px 9px; background:${C.indigoFaint}; border:1px solid ${C.indigoBorder}; border-radius:999px; font-size:11px; font-weight:600; color:${C.indigo};     font-family:'Inter',sans-serif; }
  .ami-badge-purple { display:inline-flex; align-items:center; padding:2px 9px; background:${C.purpleFaint}; border:1px solid ${C.purpleBorder}; border-radius:999px; font-size:11px; font-weight:600; color:${C.purple};     font-family:'Inter',sans-serif; }

  .ami-crumb { display:inline-flex; align-items:center; gap:6px; font-family:'Inter',sans-serif; font-size:12px; color:${C.inkMid}; }
  .ami-crumb-active { color:${C.ink}; font-weight:600; }
  .ami-crumb-link { cursor:pointer; transition:color .15s; }
  .ami-crumb-link:hover { color:${C.accentLight}; }

  /* Monitor group accordion */
  .ami-mon-group   { border:1px solid ${C.border}; border-radius:10px; overflow:hidden; margin-bottom:14px; }
  .ami-mon-hdr     { padding:13px 16px; background:${C.raised}; border-bottom:1px solid ${C.border}; display:flex; align-items:center; gap:12px; flex-wrap:wrap; cursor:pointer; user-select:none; }
  .ami-mon-hdr:hover { background:#1f2937; }
  .ami-alert-col-hdr { display:grid; grid-template-columns:180px 1fr 220px; gap:12px; padding:8px 16px; background:${C.borderLight}; border-bottom:1px solid ${C.border}; }
  .ami-alert-row   { display:grid; grid-template-columns:180px 1fr 220px; gap:12px; padding:11px 16px; border-bottom:1px solid ${C.borderLight}; transition:background .1s; align-items:start; }
  .ami-alert-row:last-child { border-bottom:none; }
  .ami-alert-row:hover { background:${C.raised}; }
`;

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("en-IN", {
      timeZone:"Asia/Kolkata", year:"numeric", month:"short",
      day:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit",
    });
  } catch { return "—"; }
}

function fmtHours(h) {
  if (h == null || h < 0) return "—";
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return `${hh}h ${mm}m`;
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

/** Group array of alerts by monitor name, descending by count */
function groupByMonitor(alerts) {
  const map = new Map();
  for (const a of alerts) {
    const key = a.monitor || "Unknown Monitor";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(a);
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

/* ── Shared micro-components ────────────────────────────────────────────── */

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:52 }}>
      <div style={{ width:22, height:22, border:`2px solid ${C.borderLight}`, borderTop:`2px solid ${C.accentLight}`, borderRadius:"50%", animation:"ami-spin .8s linear infinite" }} />
    </div>
  );
}

function ErrBanner({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", background:C.redFaint, border:`1px solid ${C.redBorder}`, borderRadius:8, marginBottom:16, fontFamily:"'Inter',sans-serif", fontSize:13, color:C.redText }}>
      ⚠ {msg}
    </div>
  );
}

function Empty({ msg = "No data available", icon = "◌" }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"52px 24px", color:C.inkLight, fontFamily:"'Inter',sans-serif" }}>
      <div style={{ fontSize:28, marginBottom:10, opacity:.3 }}>{icon}</div>
      <div style={{ fontSize:13 }}>{msg}</div>
    </div>
  );
}

function SectionHdr({ title, sub, color = C.accentLight }) {
  return (
    <div style={{ marginBottom:16, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ width:3, height:14, background:color, borderRadius:2, display:"inline-block", marginRight:8, verticalAlign:"middle" }} />
      <span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700, color:C.ink, letterSpacing:"-0.01em" }}>{title}</span>
      {sub && <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:C.inkMid, marginLeft:10 }}>{sub}</span>}
    </div>
  );
}

function KpiPill({ label, value, color = C.accentLight, delay = 0 }) {
  return (
    <div className="ami-card" style={{ padding:"18px 20px", position:"relative", overflow:"hidden", animation:`ami-rise .4s ${delay}s both` }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color, borderRadius:"10px 10px 0 0" }} />
      <div style={{ fontSize:28, fontWeight:700, color:C.ink, lineHeight:1, letterSpacing:"-0.04em", fontFamily:"'Inter',sans-serif", marginTop:4 }}>
        {typeof value === "number" ? value.toLocaleString() : (value ?? "—")}
      </div>
      <div style={{ fontSize:10, color:C.inkMid, textTransform:"uppercase", letterSpacing:".1em", fontFamily:"'Inter',sans-serif", fontWeight:600, marginTop:6 }}>
        {label}
      </div>
    </div>
  );
}

/* uid must be unique per chart instance to prevent SVG gradient ID collisions */
function MiniLineChart({ data = [], dateKey = "date", countKey = "count", color = C.accentLight, height = 120, uid = "x" }) {
  if (!data.length) return <Empty msg="No trend data" />;
  const gid = `mlc-${uid}`;
  const W = 500, H = height, PAD = { t:10, r:10, b:28, l:36 };
  const iW = W - PAD.l - PAD.r, iH = H - PAD.t - PAD.b;
  const vals = data.map(d => Number(d[countKey]) || 0);
  const max = Math.max(...vals, 1), min = Math.min(...vals, 0), range = max - min || 1;
  const toX = i => PAD.l + (i / Math.max(data.length - 1, 1)) * iW;
  const toY = v => PAD.t + iH - ((v - min) / range) * iH;
  const path = data.map((d, i) => `${i===0?"M":"L"}${toX(i).toFixed(1)},${toY(Number(d[countKey])||0).toFixed(1)}`).join(" ");
  const area = `${path} L${toX(data.length-1).toFixed(1)},${(PAD.t+iH).toFixed(1)} L${PAD.l},${(PAD.t+iH).toFixed(1)} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".18" />
          <stop offset="100%" stopColor={color} stopOpacity=".01" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {data.map((d, i) => {
        if (i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1) return null;
        return <text key={i} x={toX(i)} y={H-8} textAnchor="middle" fill={C.inkLight} fontSize="9" fontFamily="JetBrains Mono">{(d[dateKey]||"").slice(5)}</text>;
      })}
      {data.map((d, i) => <circle key={i} cx={toX(i)} cy={toY(Number(d[countKey])||0)} r={2.5} fill={color} />)}
    </svg>
  );
}

function MiniDonut({ data = [], labelKey = "label", valueKey = "count", size = 160 }) {
  if (!data.length) return <Empty msg="No data" />;
  const total = data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0) || 1;
  const r = 52, cx = 80, cy = 80, thick = 18;
  let angle = -90;
  const slices = data.slice(0, 8).map((d, i) => {
    const pct = (Number(d[valueKey]) || 0) / total;
    const deg = pct * 360;
    if (deg < 0.5) { angle += deg; return null; }
    const s = angle * Math.PI / 180, e = (angle + deg) * Math.PI / 180;
    angle += deg;
    const x1=cx+r*Math.cos(s), y1=cy+r*Math.sin(s), x2=cx+r*Math.cos(e), y2=cy+r*Math.sin(e);
    const ir=r-thick, ix1=cx+ir*Math.cos(s), iy1=cy+ir*Math.sin(s), ix2=cx+ir*Math.cos(e), iy2=cy+ir*Math.sin(e);
    return { path:`M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r},0,${deg>180?1:0},1,${x2.toFixed(2)},${y2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${ir},${ir},0,${deg>180?1:0},0,${ix1.toFixed(2)},${iy1.toFixed(2)} Z`, color:PALETTE[i%PALETTE.length], label:d[labelKey], pct:Math.round(pct*100) };
  }).filter(Boolean);
  return (
    <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
      <svg viewBox="0 0 160 160" style={{ width:size, height:size, flexShrink:0 }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={.88} />)}
        <text x="80" y="76" textAnchor="middle" fill={C.ink} fontSize="18" fontWeight="700" fontFamily="Inter">{total.toLocaleString()}</text>
        <text x="80" y="92" textAnchor="middle" fill={C.inkMid} fontSize="9" fontFamily="Inter">TOTAL</text>
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:5, minWidth:120 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.color, flexShrink:0 }} />
            <span style={{ fontSize:11, color:C.inkMid, fontFamily:"'Inter',sans-serif", lineHeight:1.3 }}>
              {s.label} <span style={{ color:s.color, fontWeight:600 }}>{s.pct}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankedBar({ label, value, max, color, sublabel }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:C.ink, fontWeight:500, maxWidth:"65%", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{label}</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color, fontWeight:600 }}>{value}</div>
      </div>
      <div style={{ height:5, background:C.borderLight, borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3, transition:"width .5s ease" }} />
      </div>
      {sublabel && <div style={{ fontSize:10, color:C.inkLight, fontFamily:"'Inter',sans-serif", marginTop:3 }}>{sublabel}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ALERTS GROUPED BY MONITOR
   Used in both the ShiftMonitorModal and AgentDetailPanel "Alerts" tab.
   Each group is a collapsible accordion showing alert type + timestamp + comment.
══════════════════════════════════════════════════════════════════════════ */
function AlertsByMonitor({ alerts = [] }) {
  const groups = groupByMonitor(alerts);
  const [open, setOpen] = useState(() => {
    // Default: first group open
    const init = {};
    if (groups.length > 0) init[groups[0][0]] = true;
    return init;
  });

  if (!alerts.length) return <Empty msg="No alerts recorded" icon="🔕" />;

  const toggle = key => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      {groups.map(([monitor, monAlerts], gi) => {
        const isOpen = !!open[monitor];
        const monColor = PALETTE[gi % PALETTE.length];
        const types = [...new Set(monAlerts.map(a => a.type || a.alert_type).filter(Boolean))];

        return (
          <div key={monitor} className="ami-mon-group">

            {/* ── Group header ── */}
            <div className="ami-mon-hdr" onClick={() => toggle(monitor)}>
              {/* Colour accent */}
              <div style={{ width:4, height:36, background:monColor, borderRadius:2, flexShrink:0 }} />

              {/* Monitor name + types */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:C.amberText, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {monitor}
                </div>
                <div style={{ fontFamily:"'Inter',sans-serif", fontSize:10, color:C.inkLight, marginTop:2 }}>
                  {types.length ? types.join(" · ") : "No types recorded"}
                </div>
              </div>

              {/* Alert count badge */}
              <span className="ami-badge-red" style={{ flexShrink:0 }}>
                {monAlerts.length} alert{monAlerts.length !== 1 ? "s" : ""}
              </span>

              {/* Chevron */}
              <span style={{ color:C.inkMid, fontSize:14, marginLeft:4, transition:"transform .2s", display:"inline-block", transform:isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                ›
              </span>
            </div>

            {/* ── Alert rows ── */}
            {isOpen && (
              <div>
                {/* Column headers */}
                <div className="ami-alert-col-hdr">
                  {["Alert Type", "Comment", "Submitted At"].map(h => (
                    <div key={h} style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700, color:C.inkLight, textTransform:"uppercase", letterSpacing:".08em" }}>
                      {h}
                    </div>
                  ))}
                </div>

                {/* One row per alert */}
                {monAlerts.map((alert, ai) => (
                  <div key={ai} className="ami-alert-row">
                    {/* Type */}
                    <div>
                      <span className="ami-badge-red">
                        {alert.type || alert.alert_type || "—"}
                      </span>
                    </div>

                    {/* Comment */}
                    <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:alert.comment ? C.ink : C.inkLight, fontStyle:alert.comment ? "normal" : "italic", lineHeight:1.5 }}>
                      {alert.comment || "No comment"}
                    </div>

                    {/* Timestamp */}
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.inkMid }}>
                      {formatDate(alert.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SHIFT MONITOR DETAIL MODAL
   Full breakdown of one shift: alerts by monitor + timestamp,
   plus tickets / incidents / ad-hoc / handovers in separate sub-tabs.
══════════════════════════════════════════════════════════════════════════ */
function ShiftMonitorModal({ shiftId, api, onClose }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState(null);
  const [activeTab, setActiveTab] = useState("alerts");

  useEffect(() => {
    setLoading(true); setErr(null); setData(null);
    fetch(`${api}/manager/shift-details/${shiftId}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [shiftId, api]);

  const monitors = data ? [...new Set((data.alerts || []).map(a => a.monitor))] : [];

  const TABS = data ? [
    { id:"alerts",    label:`Alerts (${(data.alerts||[]).length})`            },
    { id:"tickets",   label:`Tickets (${(data.tickets||[]).length})`          },
    { id:"incidents", label:`Incidents (${(data.incidents||[]).length})`      },
    { id:"adhoc",     label:`Ad-hoc (${(data.adhoc_tasks||[]).length})`       },
    { id:"handovers", label:`Handovers (${(data.handovers||[]).length})`      },
  ] : [];

  return (
    <div className="ami-overlay" onClick={onClose}>
      <div className="ami-modal" onClick={e => e.stopPropagation()}>

        <div className="ami-modal-hdr">
          <div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:16, fontWeight:700, color:C.ink }}>
              Shift Activity — Monitor & Alert Detail
            </div>
            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:12, color:C.inkMid, marginTop:3 }}>
              {data ? `${data.agent_name} · ${formatDate(data.login_time)}` : "Loading…"}
            </div>
          </div>
          <button className="ami-btn-ghost" onClick={onClose}>✕ Close</button>
        </div>

        <div className="ami-modal-body">
          {loading ? <Spinner /> : err ? <ErrBanner msg={err} /> : data && (
            <>
              {/* KPI strip */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10, marginBottom:24 }}>
                {[
                  { label:"Cases Triaged", value:data.triaged_count ?? 0,            color:C.greenText  },
                  { label:"Monitors Hit",  value:monitors.length,                    color:C.amberText  },
                  { label:"Alerts",        value:(data.alerts      ||[]).length,      color:C.redText    },
                  { label:"Tickets",       value:(data.tickets     ||[]).length,      color:C.amberText  },
                  { label:"Incidents",     value:(data.incidents   ||[]).length,      color:C.purple     },
                  { label:"Ad-hoc Tasks",  value:(data.adhoc_tasks ||[]).length,      color:C.indigo     },
                ].map(k => (
                  <div key={k.label} className="ami-card" style={{ padding:"12px 14px" }}>
                    <div style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"'Inter',sans-serif", lineHeight:1 }}>
                      {k.value.toLocaleString()}
                    </div>
                    <div style={{ fontSize:10, color:C.inkMid, textTransform:"uppercase", letterSpacing:".08em", fontFamily:"'Inter',sans-serif", fontWeight:600, marginTop:5 }}>
                      {k.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sub-tabs */}
              <div style={{ borderBottom:`1px solid ${C.border}`, display:"flex", gap:0, marginBottom:20, overflowX:"auto" }}>
                {TABS.map(t => (
                  <button key={t.id} className={`ami-tab${activeTab===t.id?" ami-tab-active":""}`} onClick={() => setActiveTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Alerts — grouped by monitor, each with timestamp */}
              {activeTab === "alerts" && (
                <AlertsByMonitor alerts={data.alerts || []} />
              )}

              {/* Tickets */}
              {activeTab === "tickets" && (
                (data.tickets||[]).length > 0 ? (
                  <div style={{ borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}` }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead className="ami-thead"><tr>{["Ticket #","Description","Submitted At"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                      <tbody className="ami-tbody">
                        {data.tickets.map((t, i) => (
                          <tr key={i}>
                            <td><span className="ami-badge-amber">#{t.number}</span></td>
                            <td style={{ color:C.inkMid }}>{t.description || "—"}</td>
                            <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.inkMid }}>{formatDate(t.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <Empty msg="No tickets for this shift" />
              )}

              {/* Incidents */}
              {activeTab === "incidents" && (
                (data.incidents||[]).length > 0 ? (
                  <div style={{ borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}` }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead className="ami-thead"><tr>{["Description","Submitted At"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                      <tbody className="ami-tbody">
                        {data.incidents.map((inc, i) => (
                          <tr key={i}>
                            <td style={{ color:C.purple }}>{inc.description}</td>
                            <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.inkMid }}>{formatDate(inc.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <Empty msg="No incidents for this shift" />
              )}

              {/* Ad-hoc */}
              {activeTab === "adhoc" && (
                (data.adhoc_tasks||[]).length > 0 ? (
                  <div style={{ borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}` }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead className="ami-thead"><tr>{["Task","Submitted At"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                      <tbody className="ami-tbody">
                        {data.adhoc_tasks.map((t, i) => (
                          <tr key={i}>
                            <td>{t.task}</td>
                            <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.inkMid }}>{formatDate(t.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <Empty msg="No ad-hoc tasks for this shift" />
              )}

              {/* Handovers */}
              {activeTab === "handovers" && (
                (data.handovers||[]).length > 0 ? (
                  <div style={{ borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}` }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead className="ami-thead"><tr>{["Handed To","Description","Submitted At"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                      <tbody className="ami-tbody">
                        {data.handovers.map((h, i) => (
                          <tr key={i}>
                            <td><span className="ami-badge-indigo">{h.handover_to}</span></td>
                            <td style={{ color:C.inkMid }}>{h.description}</td>
                            <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.inkMid }}>{formatDate(h.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <Empty msg="No handovers for this shift" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AGENT DETAIL PANEL
   KPIs + Alerts by Monitor (with timestamps) + Trends + Shift History
══════════════════════════════════════════════════════════════════════════ */
function AgentDetailPanel({ agent, api, days, refreshKey = 0, onBack }) {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [err, setErr]                 = useState(null);
  const [activeTab, setActiveTab]     = useState("overview");
  const [shiftModalId, setShiftModalId] = useState(null);

  // Raw alerts with timestamps — fetched lazily when "Alerts" tab is first opened
  const [allAlerts, setAllAlerts]         = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsFetched, setAlertsFetched] = useState(false);

  const agentColor = PALETTE[(agent._idx || 0) % PALETTE.length];

  const load = useCallback(() => {
    setLoading(true); setErr(null);
    fetch(`${api}/manager/agent-detail/${agent.agent_id}?days=${days}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [agent.agent_id, api, days, refreshKey]);

  // Fetch individual alert records (with timestamps) from each recent shift
  const loadRawAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const detail = await fetch(`${api}/manager/agent-detail/${agent.agent_id}?days=${days}`).then(r => r.json());
      const shiftIds = (detail.recent_shifts || []).map(s => s.id).filter(Boolean);
      const results = await Promise.all(
        shiftIds.map(id =>
          fetch(`${api}/manager/shift-details/${id}`)
            .then(r => r.json())
            .then(sd => (sd.alerts || []).map(a => ({
              ...a,
              _shift_date: sd.login_time,
              _agent: sd.agent_name,
            })))
            .catch(() => [])
        )
      );
      setAllAlerts(results.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (_) { /* silent */ }
    setAlertsLoading(false);
    setAlertsFetched(true);
  }, [agent.agent_id, api, days]);

  useEffect(() => { load(); }, [load]);

  // Lazy-load raw alerts only once when the Alerts tab is first visited
  useEffect(() => {
    if (activeTab === "alerts" && !alertsFetched && !alertsLoading) {
      loadRawAlerts();
    }
  }, [activeTab, alertsFetched, alertsLoading, loadRawAlerts]);

  const TABS = [
    { id:"overview", label:"Overview"          },
    { id:"alerts",   label:"Alerts by Monitor" },
    { id:"trends",   label:"Trends"            },
    { id:"shifts",   label:"Shift History"     },
  ];

  return (
    <div style={{ animation:"ami-rise .35s ease" }}>

      {/* Breadcrumb */}
      <div className="ami-crumb" style={{ marginBottom:20 }}>
        <span className="ami-crumb-link" onClick={onBack}>All Agents</span>
        <span style={{ color:C.borderLight }}>›</span>
        <span className="ami-crumb-active">{agent.agent_name}</span>
      </div>

      {/* Agent header */}
      <div className="ami-card" style={{ padding:"20px 24px", marginBottom:20, display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:agentColor+"22", border:`2px solid ${agentColor}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:agentColor, flexShrink:0, fontFamily:"'Inter',sans-serif" }}>
          {initials(agent.agent_name)}
        </div>
        <div style={{ flex:1, minWidth:150 }}>
          <div style={{ fontFamily:"'Inter',sans-serif", fontSize:18, fontWeight:700, color:C.ink }}>{agent.agent_name}</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.inkMid, marginTop:3 }}>{agent.agent_id}</div>
        </div>
        <button className="ami-btn-ghost" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? <Spinner /> : err ? <ErrBanner msg={err} /> : data && (
        <>
          {/* KPI strip */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:20 }}>
            <KpiPill label="Shifts"         value={data.shift_count}           color={C.accentLight} delay={0}    />
            <KpiPill label="Cases Triaged"  value={data.total_triaged}         color={C.greenText}   delay={0.04} />
            <KpiPill label="Avg / Shift"    value={data.avg_triaged_per_shift} color={C.amberText}   delay={0.08} />
            <KpiPill label="Avg Hours"      value={`${data.avg_shift_hours}h`} color={C.indigo}      delay={0.12} />
            <KpiPill label="Alerts"         value={data.total_alerts}          color={C.redText}     delay={0.16} />
            <KpiPill label="Tickets"        value={data.total_tickets}         color={C.amberText}   delay={0.20} />
            <KpiPill label="Incidents"      value={data.total_incidents}       color={C.purple}      delay={0.24} />
            <KpiPill label="Ad-hoc Tasks"   value={data.total_adhoc}           color={C.inkMid}      delay={0.28} />
          </div>

          {/* Sub-tabs */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:20 }}>
            <div style={{ borderBottom:`1px solid ${C.border}`, display:"flex", overflowX:"auto" }}>
              {TABS.map(t => (
                <button key={t.id} className={`ami-tab${activeTab===t.id?" ami-tab-active":""}`} onClick={() => setActiveTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ padding:20 }}>

              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div>
                  {data.monitor_breakdown?.length > 0 && (
                    <div style={{ marginBottom:28 }}>
                      <SectionHdr title="Top Monitors Triggered" color={C.amberText} />
                      {data.monitor_breakdown.slice(0,10).map((m, i) => (
                        <RankedBar key={i} label={m.monitor} value={m.count} max={data.monitor_breakdown[0].count} color={PALETTE[i%PALETTE.length]} />
                      ))}
                    </div>
                  )}
                  {data.alert_breakdown?.length > 0 && (
                    <div>
                      <SectionHdr title="Alert Type Distribution" color={C.redText} />
                      <MiniDonut data={data.alert_breakdown} labelKey="alert_type" valueKey="count" size={150} />
                    </div>
                  )}
                  {!data.monitor_breakdown?.length && !data.alert_breakdown?.length && (
                    <Empty msg="No alert or monitor data for this period" icon="🔕" />
                  )}
                </div>
              )}

              {/* ALERTS BY MONITOR — with timestamps */}
              {activeTab === "alerts" && (
                <div>
                  <SectionHdr
                    title="All Alerts — Grouped by Monitor"
                    sub="Each alert shows alert type, comment, and exact submission time"
                    color={C.redText}
                  />
                  {alertsLoading
                    ? <Spinner />
                    : allAlerts.length > 0
                      ? <AlertsByMonitor alerts={allAlerts} />
                      : alertsFetched
                        ? <Empty msg="No alert records found for this period" icon="🔕" />
                        : <Spinner />
                  }
                </div>
              )}

              {/* TRENDS */}
              {activeTab === "trends" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                  {[
                    { title:"Ticket Trend",   td:data.ticket_trend,   color:C.amberText, uid:"tick"  },
                    { title:"Alert Trend",    td:data.alert_trend,    color:C.redText,   uid:"alrt"  },
                    { title:"Incident Trend", td:data.incident_trend, color:C.purple,    uid:"inc"   },
                    { title:"Ad-hoc Trend",   td:data.adhoc_trend,    color:C.indigo,    uid:"adhoc" },
                  ].map(({ title, td, color, uid }) => (
                    <div key={title}>
                      <SectionHdr title={title} color={color} />
                      {td?.length > 0
                        ? <MiniLineChart data={td} dateKey="date" countKey="count" color={color} height={120} uid={`${agent.agent_id}-${uid}`} />
                        : <Empty msg="No data for this period" />}
                    </div>
                  ))}
                </div>
              )}

              {/* SHIFT HISTORY */}
              {activeTab === "shifts" && (
                <div>
                  <SectionHdr title="Recent Shifts" sub="Click a row to drill into monitor & alert detail" color={C.accentLight} />
                  {data.recent_shifts?.length > 0 ? (
                    <div style={{ borderRadius:8, overflow:"hidden", border:`1px solid ${C.border}` }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead className="ami-thead">
                          <tr>{["Date","Duration","Triaged","Tickets","Alerts","Incidents","Ad-hoc",""].map(h=><th key={h}>{h}</th>)}</tr>
                        </thead>
                        <tbody className="ami-tbody">
                          {data.recent_shifts.map((s, i) => (
                            <tr key={i} style={{ cursor:"pointer" }} onClick={() => setShiftModalId(s.id)}>
                              <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.inkMid }}>{s.date}</td>
                              <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>{fmtHours(s.duration_hours)}</td>
                              <td style={{ fontWeight:600, color:C.greenText }}>{s.triaged_count??0}</td>
                              <td style={{ color:C.amberText }}>{s.ticket_count??0}</td>
                              <td style={{ color:C.redText }}>{s.alert_count??0}</td>
                              <td style={{ color:C.purple }}>{s.incident_count??0}</td>
                              <td style={{ color:C.indigo }}>{s.adhoc_count??0}</td>
                              <td><button className="ami-btn" style={{ padding:"4px 10px", fontSize:11 }}>Drill In</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <Empty msg="No shift history for this period" />}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {shiftModalId && (
        <ShiftMonitorModal shiftId={shiftModalId} api={api} onClose={() => setShiftModalId(null)} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MONITOR INTELLIGENCE VIEW  (cross-agent, aggregate)
══════════════════════════════════════════════════════════════════════════ */
function MonitorIntelligenceView({ api, days, refreshKey = 0 }) {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [err, setErr]               = useState(null);
  const [search, setSearch]         = useState("");
  const [selMonitor, setSelMonitor] = useState(null);

  useEffect(() => {
    setLoading(true); setErr(null);
    fetch(`${api}/manager/advanced-analytics?days=${days}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [api, days, refreshKey]);

  const monitors = (data?.monitor_analysis || []).filter(m =>
    !search || m.monitor.toLowerCase().includes(search.toLowerCase())
  );
  const maxAlerts = monitors[0]?.alert_count || 1;
  const selData = selMonitor ? (data?.monitor_analysis || []).find(m => m.monitor === selMonitor) : null;

  return (
    <div>
      {loading ? <Spinner /> : err ? <ErrBanner msg={err} /> : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:20, marginBottom:24 }}>
            <div className="ami-card" style={{ padding:20 }}>
              <SectionHdr title="Top Monitors by Alert Volume" color={C.redText} />
              <input className="ami-input" placeholder="Search monitors…" value={search} onChange={e => setSearch(e.target.value)} style={{ width:"100%", marginBottom:14 }} />
              {monitors.length > 0 ? monitors.map((m, i) => (
                <div key={m.monitor} style={{ cursor:"pointer", padding:"6px 0" }} onClick={() => setSelMonitor(selMonitor === m.monitor ? null : m.monitor)}>
                  <RankedBar
                    label={m.monitor} value={m.alert_count} max={maxAlerts}
                    color={selMonitor === m.monitor ? C.accentLight : PALETTE[i%PALETTE.length]}
                    sublabel={`${m.shifts_affected} shift${m.shifts_affected!==1?"s":""} affected · ${m.unique_alert_types} type${m.unique_alert_types!==1?"s":""}`}
                  />
                </div>
              )) : <Empty msg="No monitor data" />}
            </div>

            <div className="ami-card" style={{ padding:20 }}>
              <SectionHdr title="Alert Type Distribution" color={C.redText} />
              <MiniDonut data={(data?.alert_analysis||[]).map(a=>({ label:a.alert_type, count:a.count }))} labelKey="label" valueKey="count" size={150} uid="monview" />
              {selData && (
                <div style={{ marginTop:20, padding:14, background:C.raised, borderRadius:8, border:`1px solid ${C.border}` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.amberText, fontWeight:600, marginBottom:10 }}>Selected: {selData.monitor}</div>
                  <div style={{ display:"flex", gap:16 }}>
                    {[
                      { label:"Alerts",     value:selData.alert_count,        color:C.redText     },
                      { label:"Shifts Hit", value:selData.shifts_affected,    color:C.amberText   },
                      { label:"Types",      value:selData.unique_alert_types, color:C.accentLight },
                    ].map(k => (
                      <div key={k.label}>
                        <div style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"'Inter',sans-serif" }}>{k.value}</div>
                        <div style={{ fontSize:10, color:C.inkMid, fontFamily:"'Inter',sans-serif", textTransform:"uppercase" }}>{k.label}</div>
                      </div>
                    ))}
                  </div>
                  <button className="ami-btn-ghost" style={{ marginTop:12, width:"100%", fontSize:11 }} onClick={() => setSelMonitor(null)}>Clear Selection</button>
                </div>
              )}
            </div>
          </div>

          <div className="ami-card" style={{ overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}` }}>
              <SectionHdr title="Alert Type Analysis" color={C.redText} />
            </div>
            {(data?.alert_analysis||[]).length > 0 ? (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead className="ami-thead"><tr>{["Alert Type","Count","Shifts Affected"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody className="ami-tbody">
                  {data.alert_analysis.map((a, i) => (
                    <tr key={i}>
                      <td><span className="ami-badge-red">{a.alert_type}</span></td>
                      <td style={{ fontWeight:600, color:C.redText, fontFamily:"'JetBrains Mono',monospace" }}>{a.count}</td>
                      <td style={{ color:C.inkMid }}>{a.shifts_affected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <Empty msg="No alert data for this period" />}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   Props: { api }  e.g. "http://192.168.74.152:5000"
══════════════════════════════════════════════════════════════════════════ */
export default function AgentMonitorIntelligence({ api }) {
  const [view, setView]                   = useState("agents");
  const [agents, setAgents]               = useState([]);
  const [agLoading, setAgLoading]         = useState(true);
  const [agErr, setAgErr]                 = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [days, setDays]                   = useState(30);
  const [search, setSearch]               = useState("");
  const [sortBy, setSortBy]               = useState("total_triaged");
  const [refreshKey, setRefreshKey]       = useState(0);

  const loadAgents = useCallback(() => {
    setAgLoading(true); setAgErr(null);
    fetch(`${api}/manager/advanced-analytics?days=${days}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setAgents((d.agent_rankings||[]).map((a,i)=>({...a,_idx:i}))); setAgLoading(false); })
      .catch(e => { setAgErr(e.message); setAgLoading(false); });
  }, [api, days]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const SORT_OPTS = [
    { value:"total_triaged",     label:"Cases Triaged"    },
    { value:"total_alerts",      label:"Alerts"           },
    { value:"total_tickets",     label:"Tickets"          },
    { value:"shift_count",       label:"Shift Count"      },
  ];

  const filtered = agents
    .filter(a => !search || (a.agent_name||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b[sortBy]||0) - (a[sortBy]||0));

  const VIEWS = [
    { id:"agents",   label:"Agents"              },
    { id:"monitors", label:"Monitor Intelligence" },
  ];

  /* Agent detail panel */
  if (view === "agent-detail" && selectedAgent) {
    return (
      <div>
        <style>{CSS}</style>
        <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"0 24px", display:"flex", overflowX:"auto" }}>
          {VIEWS.map(v => (
            <button key={v.id} className={`ami-tab${v.id==="agents"?" ami-tab-active":""}`} onClick={() => { setView(v.id); setSelectedAgent(null); }}>
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ padding:"24px 28px" }}>
          <AgentDetailPanel agent={selectedAgent} api={api} days={days} refreshKey={refreshKey} onBack={() => { setView("agents"); setSelectedAgent(null); }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"0 24px", display:"flex", alignItems:"center", overflowX:"auto" }}>
        {VIEWS.map(v => (
          <button key={v.id} className={`ami-tab${view===v.id?" ami-tab-active":""}`} onClick={() => setView(v.id)}>
            {v.label}
          </button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, padding:"8px 0" }}>
          <select className="ami-select" value={days} onChange={e => setDays(Number(e.target.value))} style={{ fontSize:12 }}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button className="ami-btn-ghost" onClick={() => { loadAgents(); setRefreshKey(k => k + 1); }}>↻ Refresh</button>
        </div>
      </div>

      <div style={{ padding:"24px 28px" }}>

        {/* AGENTS */}
        {view === "agents" && (
          <div style={{ animation:"ami-rise .4s ease" }}>
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", marginBottom:20 }}>
              <input className="ami-input" placeholder="Search agents…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:180 }} />
              <select className="ami-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {search && <button className="ami-btn-ghost" onClick={() => setSearch("")}>Clear</button>}
            </div>

            <ErrBanner msg={agErr} />

            {agLoading ? <Spinner /> : filtered.length > 0 ? (
              <>
                {/* Agent cards */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16, marginBottom:28 }}>
                  {filtered.map((agent, i) => {
                    const color = PALETTE[agent._idx % PALETTE.length];
                    return (
                      <div key={agent.agent_id} className="ami-card ami-card-click" style={{ padding:"18px 20px", animation:`ami-rise .3s ${i*0.04}s both` }} onClick={() => { setSelectedAgent(agent); setView("agent-detail"); }}>
                        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                          <div style={{ width:44, height:44, borderRadius:"50%", background:color+"22", border:`2px solid ${color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:700, color, flexShrink:0, fontFamily:"'Inter',sans-serif" }}>
                            {initials(agent.agent_name)}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agent.agent_name}</div>
                            <div style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:C.inkMid, marginTop:2 }}>#{agent.rank} · {agent.shift_count} shift{agent.shift_count!==1?"s":""}</div>
                          </div>
                
                        </div>

                        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
                          {[
                            { label:"Triaged",   value:agent.total_triaged,   color:C.greenText },
                            { label:"Alerts",    value:agent.total_alerts,    color:C.redText   },
                            { label:"Tickets",   value:agent.total_tickets,   color:C.amberText },
                            { label:"Incidents", value:agent.total_incidents, color:C.purple    },
                          ].map(s => (
                            <div key={s.label} style={{ textAlign:"center", padding:"8px 4px", background:C.raised, borderRadius:6 }}>
                              <div style={{ fontSize:18, fontWeight:700, color:s.color, fontFamily:"'Inter',sans-serif", lineHeight:1 }}>{s.value??0}</div>
                              <div style={{ fontSize:9, color:C.inkMid, textTransform:"uppercase", letterSpacing:".08em", fontFamily:"'Inter',sans-serif", marginTop:3 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>

                        <button className="ami-btn" style={{ width:"100%", fontSize:12 }} onClick={e => { e.stopPropagation(); setSelectedAgent(agent); setView("agent-detail"); }}>
                          Full Intelligence →
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Comparison table */}
                <SectionHdr title="Comparative Table" sub="All agents at a glance" color={C.accentLight} />
                <div style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}` }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead className="ami-thead">
                      <tr>{["Rank","Agent","Shifts","Triaged","Alerts","Tickets","Incidents","Ad-hoc",""].map(h=><th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="ami-tbody">
                      {filtered.map((a, i) => {
                        const color = PALETTE[a._idx % PALETTE.length];
                        return (
                          <tr key={a.agent_id} style={{ animation:`ami-rise .25s ${i*0.03}s both` }}>
                            <td style={{ color:C.inkMid, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>#{a.rank}</td>
                            <td>
                              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                                <div style={{ width:26, height:26, borderRadius:"50%", background:color+"22", border:`1.5px solid ${color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color, flexShrink:0, fontFamily:"'Inter',sans-serif" }}>
                                  {initials(a.agent_name)}
                                </div>
                                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500 }}>{a.agent_name}</span>
                              </div>
                            </td>
                            <td style={{ color:C.inkMid, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>{a.shift_count}</td>
                            <td style={{ fontWeight:600, color:C.greenText }}>{a.total_triaged}</td>
                            <td style={{ color:C.redText }}>{a.total_alerts}</td>
                            <td style={{ color:C.amberText }}>{a.total_tickets}</td>
                            <td style={{ color:C.purple }}>{a.total_incidents}</td>
                            <td style={{ color:C.indigo }}>{a.total_adhoc}</td>
                            <td>
                              <button className="ami-btn" style={{ fontSize:11, padding:"5px 10px" }} onClick={() => { setSelectedAgent(a); setView("agent-detail"); }}>
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <Empty msg="No agent data for the selected period" icon="👥" />
            )}
          </div>
        )}

        {/* MONITORS */}
        {view === "monitors" && (
          <div style={{ animation:"ami-rise .4s ease" }}>
            <MonitorIntelligenceView api={api} days={days} refreshKey={refreshKey} />
          </div>
        )}
      </div>
    </div>
  );
}