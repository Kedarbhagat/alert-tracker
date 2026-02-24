import { useState, useEffect, useCallback } from "react";
import AdvancedAnalytics from "./Advancedanalyticis";
import UserManagement from "./Usermanagement";

/* ─────────────────────────────────────────────────────────────────────────────
   MANAGER DASHBOARD
   Dark enterprise theme — identical palette to AdvancedAnalytics so every
   tab feels like one cohesive product.  No external style file needed.
───────────────────────────────────────────────────────────────────────────── */

// ── Colour tokens (mirrors AdvancedAnalytics exactly) ──────────────────────
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

// ── Global CSS injected once ───────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes mgr-spin  { to { transform: rotate(360deg); } }
  @keyframes mgr-rise  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes mgr-pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.35; } }

  *, *::before, *::after { box-sizing: border-box; }

  /* ── Card ── */
  .mgr-card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 10px;
    transition: border-color .18s;
  }
  .mgr-card:hover { border-color: ${C.accentBorder}; }

  /* ── Buttons ── */
  .mgr-btn {
    background: ${C.accent};
    border: none; color: #fff; border-radius: 6px;
    padding: 7px 16px;
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: background .15s; white-space: nowrap;
  }
  .mgr-btn:hover { background: #1d4ed8; }

  .mgr-btn-ghost {
    background: transparent;
    border: 1px solid ${C.border}; color: ${C.inkMid};
    border-radius: 6px; padding: 7px 16px;
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all .15s; white-space: nowrap;
  }
  .mgr-btn-ghost:hover { border-color: ${C.accentLight}; color: ${C.accentLight}; }

  .mgr-btn-indigo {
    background: #4f46e5;
    border: none; color: #fff; border-radius: 6px;
    padding: 7px 16px;
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: background .15s; white-space: nowrap;
  }
  .mgr-btn-indigo:hover { background: #4338ca; }

  /* ── Nav tabs ── */
  .mgr-tab {
    padding: 14px 20px;
    border: none; background: transparent;
    cursor: pointer;
    font-size: 13px; font-family: 'Inter', sans-serif; font-weight: 500;
    color: ${C.inkMid};
    border-bottom: 2px solid transparent;
    transition: color .15s, border-color .15s;
    white-space: nowrap;
  }
  .mgr-tab:hover { color: ${C.ink}; }
  .mgr-tab-active {
    color: ${C.accentLight} !important;
    border-bottom-color: ${C.accentLight} !important;
  }

  /* ── Inputs ── */
  .mgr-input {
    background: ${C.bgAlt};
    border: 1px solid ${C.border}; border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px; font-family: 'Inter', sans-serif; color: ${C.ink};
    outline: none; transition: border-color .15s;
  }
  .mgr-input:focus { border-color: ${C.accentLight}; }
  .mgr-input::placeholder { color: ${C.inkLight}; }

  /* ── Table ── */
  .mgr-thead th {
    padding: 10px 16px;
    font-size: 10px; font-family: 'Inter', sans-serif;
    text-transform: uppercase; letter-spacing: .1em;
    color: ${C.inkLight}; background: ${C.borderLight};
    border-bottom: 1px solid ${C.border};
    text-align: left; font-weight: 600; white-space: nowrap;
  }
  .mgr-tbody tr {
    border-bottom: 1px solid ${C.borderLight};
    transition: background .1s;
  }
  .mgr-tbody tr:hover { background: ${C.raised}; }
  .mgr-tbody td {
    padding: 12px 16px;
    font-size: 13px; font-family: 'Inter', sans-serif; color: ${C.ink};
  }

  /* ── Modal ── */
  .mgr-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.72);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    padding: 24px;
  }
  .mgr-modal {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 14px;
    width: 100%; max-width: 740px; max-height: 84vh;
    overflow-y: auto;
    box-shadow: 0 24px 56px rgba(0,0,0,0.7);
    animation: mgr-rise .2s ease;
  }
  .mgr-modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid ${C.border};
    display: flex; justify-content: space-between; align-items: center;
    position: sticky; top: 0;
    background: ${C.surface}; z-index: 10;
  }
  .mgr-modal-body { padding: 24px; }

  /* ── Badges ── */
  .mgr-badge-active {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px;
    background: ${C.greenFaint}; border: 1px solid ${C.greenBorder};
    border-radius: 999px;
    font-size: 11px; font-weight: 600; color: ${C.greenText};
    font-family: 'Inter', sans-serif;
  }
  .mgr-badge-done {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px;
    background: ${C.indigoFaint}; border: 1px solid ${C.indigoBorder};
    border-radius: 999px;
    font-size: 11px; font-weight: 600; color: #818cf8;
    font-family: 'Inter', sans-serif;
  }
`;

/* ══════════════════════════════════════════════════════════════════════════
   PURE SHARED COMPONENTS  (defined outside ManagerDashboard — no re-mount)
══════════════════════════════════════════════════════════════════════════ */

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:52 }}>
      <div style={{
        width: 26, height: 26,
        border: `2px solid ${C.borderLight}`,
        borderTop: `2px solid ${C.accentLight}`,
        borderRadius: "50%",
        animation: "mgr-spin .8s linear infinite",
      }} />
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px",
      background: C.redFaint, border: `1px solid ${C.redBorder}`,
      borderRadius: 8, marginBottom: 16,
      fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.redText,
    }}>
      <span>⚠</span> {message}
    </div>
  );
}

function EmptyState({ message = "No data available" }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "60px 24px",
      color: C.inkLight, fontFamily: "'Inter',sans-serif",
    }}>
      <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.3 }}>◌</div>
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  );
}

function SectionHeading({ title, sub }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
      <div style={{
        fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600,
        color: C.ink, letterSpacing: "-0.01em",
      }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: C.inkMid, marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function SubLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: C.inkMid,
      textTransform: "uppercase", letterSpacing: ".1em",
      fontFamily: "'Inter',sans-serif",
      marginBottom: 10, paddingBottom: 8,
      borderBottom: `1px solid ${C.borderLight}`,
    }}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, color = C.accentLight, delay = 0 }) {
  return (
    <div
      className="mgr-card"
      style={{ padding: "20px 22px", position: "relative", overflow: "hidden", animation: `mgr-rise .4s ${delay}s both` }}
    >
      {/* colour accent bar at top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: color, borderRadius: "10px 10px 0 0",
      }} />
      <div style={{
        fontSize: 34, fontWeight: 700, color: C.ink, lineHeight: 1,
        letterSpacing: "-0.04em", fontFamily: "'Inter',sans-serif", marginTop: 6,
      }}>
        {typeof value === "number" ? value.toLocaleString() : (value ?? "—")}
      </div>
      <div style={{
        fontSize: 10, color: C.inkMid, textTransform: "uppercase",
        letterSpacing: ".1em", fontFamily: "'Inter',sans-serif",
        fontWeight: 600, marginTop: 7,
      }}>
        {label}
      </div>
    </div>
  );
}

function ModalDetailCard({ label, value, color = C.ink }) {
  return (
    <div className="mgr-card" style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "'Inter',sans-serif", wordBreak: "break-all" }}>
        {value}
      </div>
      <div style={{
        fontSize: 10, color: C.inkMid, textTransform: "uppercase",
        letterSpacing: ".08em", fontFamily: "'Inter',sans-serif",
        fontWeight: 600, marginTop: 5,
      }}>
        {label}
      </div>
    </div>
  );
}

function ModalItem({ children, accentColor = C.accentLight }) {
  return (
    <div style={{
      background: C.raised,
      border: `1px solid ${C.borderLight}`,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: 8, padding: "10px 14px", marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

/* ── Dot used inside active badges ── */
function ActiveDot() {
  return (
    <span style={{
      display: "inline-block",
      width: 5, height: 5, borderRadius: "50%",
      background: C.greenText,
    }} />
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SHIFT DETAILS MODAL
══════════════════════════════════════════════════════════════════════════ */

function ShiftDetailsModal({ shiftDetails, isLoading, error, onClose, formatDate, formatDuration }) {
  return (
    <div className="mgr-overlay" onClick={onClose}>
      <div className="mgr-modal" onClick={e => e.stopPropagation()}>

        <div className="mgr-modal-header">
          <div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 700, color: C.ink }}>
              Shift Details
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: C.inkMid, marginTop: 2 }}>
              Full activity breakdown for this shift
            </div>
          </div>
          <button className="mgr-btn-ghost" onClick={onClose}>✕ Close</button>
        </div>

        <div className="mgr-modal-body">
          {isLoading ? (
            <Spinner />
          ) : error ? (
            <ErrorBanner message={error} />
          ) : shiftDetails ? (
            <>
              {/* Meta cards */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))",
                gap: 12, marginBottom: 24,
              }}>
                <ModalDetailCard
                  label="Agent Name"
                  value={shiftDetails.agent_name ?? "Unknown Agent"}
                  color={C.accentLight}
                />
                <ModalDetailCard
                  label="Start"
                  value={formatDate(shiftDetails.login_time)}
                  color={C.ink}
                />
                <ModalDetailCard
                  label="End"
                  value={shiftDetails.logout_time ? formatDate(shiftDetails.logout_time) : "Active"}
                  color={shiftDetails.logout_time ? C.ink : C.greenText}
                />
                <ModalDetailCard
                  label="Cases Triaged"
                  value={shiftDetails.triaged_count ?? 0}
                  color={C.greenText}
                />
              </div>

              {/* Tickets */}
              {shiftDetails.tickets?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SubLabel>Tickets ({shiftDetails.tickets.length})</SubLabel>
                  {shiftDetails.tickets.map((ticket, i) => (
                    <ModalItem key={i} accentColor={C.amberText}>
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 12, color: C.amberText, fontWeight: 600,
                      }}>
                        #{ticket.number}
                      </span>
                      {ticket.description && (
                        <span style={{
                          fontFamily: "'Inter',sans-serif", fontSize: 13,
                          color: C.inkMid, marginLeft: 10,
                        }}>
                          {ticket.description}
                        </span>
                      )}
                    </ModalItem>
                  ))}
                </div>
              )}

              {/* Alerts */}
              {shiftDetails.alerts?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SubLabel>Alerts ({shiftDetails.alerts.length})</SubLabel>
                  {shiftDetails.alerts.map((alert, i) => (
                    <ModalItem key={i} accentColor={C.redText}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{
                          fontFamily: "'Inter',sans-serif", fontSize: 13,
                          fontWeight: 600, color: C.redText,
                        }}>
                          {alert.monitor}
                        </span>
                        <span style={{ color: C.borderLight }}>·</span>
                        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: C.inkMid }}>
                          {alert.type}
                        </span>
                      </div>
                      {alert.comment && (
                        <div style={{
                          fontFamily: "'Inter',sans-serif", fontSize: 12,
                          color: C.inkLight, marginTop: 5,
                        }}>
                          {alert.comment}
                        </div>
                      )}
                    </ModalItem>
                  ))}
                </div>
              )}

              {/* Incidents */}
              {shiftDetails.incidents?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <SubLabel>Incidents ({shiftDetails.incidents.length})</SubLabel>
                  {shiftDetails.incidents.map((incident, i) => (
                    <ModalItem key={i} accentColor={C.purple}>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.ink }}>
                        {incident.description}
                      </span>
                    </ModalItem>
                  ))}
                </div>
              )}

              {/* Ad-hoc tasks */}
              {shiftDetails.adhoc_tasks?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <SubLabel>Ad-hoc Tasks ({shiftDetails.adhoc_tasks.length})</SubLabel>
                  {shiftDetails.adhoc_tasks.map((task, i) => (
                    <ModalItem key={i} accentColor={C.indigo}>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.ink }}>
                        {task.task}
                      </span>
                    </ModalItem>
                  ))}
                </div>
              )}

              {/* Maintenance Logs */}
              {shiftDetails.maintenance?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <SubLabel>Maintenance Logs ({shiftDetails.maintenance.length})</SubLabel>
                  {shiftDetails.maintenance.map((log, i) => (
                    <ModalItem key={i} accentColor={C.inkMid}>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.ink }}>
                        {log.description}
                      </span>
                    </ModalItem>
                  ))}
                </div>
              )}

              {/* Shift Handovers */}
              {shiftDetails.handovers?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <SubLabel>Shift Handovers ({shiftDetails.handovers.length})</SubLabel>
                  {shiftDetails.handovers.map((handover, i) => (
                    <ModalItem key={i} accentColor="#6366f1">
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: C.ink }}>
                        <div style={{ marginBottom: 4 }}>
                          <strong style={{ color: C.accentLight }}>To:</strong> {handover.handover_to}
                        </div>
                        <div>{handover.description}</div>
                      </div>
                    </ModalItem>
                  ))}
                </div>
              )}

              {/* Nothing logged */}
              {!shiftDetails.tickets?.length &&
               !shiftDetails.alerts?.length &&
               !shiftDetails.incidents?.length &&
               !shiftDetails.adhoc_tasks?.length &&
               !shiftDetails.handovers?.length &&
               !shiftDetails.maintenance?.length && (
                <EmptyState message="No activity recorded for this shift" />
              )}
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AGENT STATS MODAL
══════════════════════════════════════════════════════════════════════════ */

function AgentStatsModal({ agentStats, isLoading, error, onClose, formatDate, formatDuration }) {
  return (
    <div className="mgr-overlay" onClick={onClose}>
      <div className="mgr-modal" onClick={e => e.stopPropagation()}>

        <div className="mgr-modal-header">
          <div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 700, color: C.ink }}>
              Agent Statistics
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: C.inkMid, marginTop: 2 }}>
              Historical performance overview
            </div>
          </div>
          <button className="mgr-btn-ghost" onClick={onClose}>✕ Close</button>
        </div>

        <div className="mgr-modal-body">
          {isLoading ? (
            <Spinner />
          ) : error ? (
            <ErrorBanner message={error} />
          ) : agentStats ? (
            <>
              {/* KPI row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12, marginBottom: 24,
              }}>
                <ModalDetailCard
                  label="Agent Name"
                  value={agentStats.agent_name ?? "Unknown Agent"}
                  color={C.accentLight}
                />
                <ModalDetailCard label="Total Shifts"  value={agentStats.total_shifts  ?? 0} color={C.accentLight} />
                <ModalDetailCard label="Cases Triaged" value={agentStats.total_triaged ?? 0} color={C.greenText}   />
                <ModalDetailCard label="Avg / Shift"   value={agentStats.avg_per_shift ?? 0} color={C.amberText}   />
              </div>

              {/* Recent shifts table */}
              {agentStats.recent_shifts?.length > 0 && (
                <div>
                  <SubLabel>Recent Shifts</SubLabel>
                  <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead className="mgr-thead">
                        <tr>
                          {["Login Time", "Duration", "Cases Triaged"].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="mgr-tbody">
                        {agentStats.recent_shifts.map(shift => (
                          <tr key={shift.id}>
                            <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: C.inkMid }}>
                              {formatDate(shift.login_time)}
                            </td>
                            <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                              {formatDuration(shift.duration_hours)}
                            </td>
                            <td style={{ fontWeight: 600, color: C.greenText }}>
                              {shift.triaged_count ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */

function ManagerDashboard() {
  const API = "http://192.168.74.152:5000";

  /* ── State ── */
  const [activeView,        setActiveView]        = useState("overview");
  const [activeAgents,      setActiveAgents]      = useState([]);
  const [allShifts,         setAllShifts]         = useState([]);
  const [analytics,         setAnalytics]         = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [selectedAgentId,   setSelectedAgentId]   = useState(null);   // was "selectedAgent" — renamed for clarity
  const [agentStats,        setAgentStats]        = useState(null);
  const [shiftDetails,      setShiftDetails]      = useState(null);
  const [shiftDetailOpen,   setShiftDetailOpen]   = useState(false);  // separate open flag prevents null-flash
  const [filters,           setFilters]           = useState({ startDate: "", endDate: "", agentId: "" });

  const [loading, setLoading] = useState({
    activeAgents:      false,
    shifts:            false,
    analytics:         false,
    advancedAnalytics: false,
    agentStats:        false,
    shiftDetails:      false,
  });

  const [errors, setErrors] = useState({
    activeAgents:      null,
    shifts:            null,
    analytics:         null,
    advancedAnalytics: null,
    agentStats:        null,
    shiftDetails:      null,
  });

  /* ── Fetch helpers ── */

  const fetchActiveAgents = useCallback(async () => {
    setLoading(p => ({ ...p, activeAgents: true }));
    setErrors(p => ({ ...p, activeAgents: null }));
    try {
      const res = await fetch(`${API}/manager/active-agents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setActiveAgents(data.active_agents ?? []);
    } catch (err) {
      setErrors(p => ({ ...p, activeAgents: err.message }));
      setActiveAgents([]);
    } finally {
      setLoading(p => ({ ...p, activeAgents: false }));
    }
  }, [API]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(p => ({ ...p, analytics: true }));
    setErrors(p => ({ ...p, analytics: null }));
    try {
      const res = await fetch(`${API}/manager/analytics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAnalytics(await res.json());
    } catch (err) {
      setErrors(p => ({ ...p, analytics: err.message }));
    } finally {
      setLoading(p => ({ ...p, analytics: false }));
    }
  }, [API]);

  const fetchShifts = useCallback(async () => {
    setLoading(p => ({ ...p, shifts: true }));
    setErrors(p => ({ ...p, shifts: null }));
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate)   params.append("end_date",   filters.endDate);
      if (filters.agentId)   params.append("agent_id",   filters.agentId);
      const res = await fetch(`${API}/manager/shifts?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAllShifts(data.shifts ?? []);
    } catch (err) {
      setErrors(p => ({ ...p, shifts: err.message }));
      setAllShifts([]);
    } finally {
      setLoading(p => ({ ...p, shifts: false }));
    }
  }, [API, filters]);

  const fetchAdvancedAnalytics = useCallback(async (queryParams) => {
    // Guard: if called with no arg, an event object, or anything non-string, use default
    const qs = typeof queryParams === "string" && queryParams ? queryParams : "days=30";
    setLoading(p => ({ ...p, advancedAnalytics: true }));
    setErrors(p => ({ ...p, advancedAnalytics: null }));
    try {
      const res = await fetch(`${API}/manager/advanced-analytics?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAdvancedAnalytics(await res.json());
    } catch (err) {
      setErrors(p => ({ ...p, advancedAnalytics: err.message }));
    } finally {
      setLoading(p => ({ ...p, advancedAnalytics: false }));
    }
  }, [API]);

  const fetchAgentStats = useCallback(async (agentId) => {
    setLoading(p => ({ ...p, agentStats: true }));
    setErrors(p => ({ ...p, agentStats: null }));
    setSelectedAgentId(agentId);
    setAgentStats(null);
    try {
      const res = await fetch(`${API}/manager/agent-stats/${agentId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAgentStats(await res.json());
    } catch (err) {
      setErrors(p => ({ ...p, agentStats: err.message }));
    } finally {
      setLoading(p => ({ ...p, agentStats: false }));
    }
  }, [API]);

  const fetchShiftDetails = useCallback(async (shiftId) => {
    setLoading(p => ({ ...p, shiftDetails: true }));
    setErrors(p => ({ ...p, shiftDetails: null }));
    setShiftDetails(null);
    setShiftDetailOpen(true);
    try {
      const res = await fetch(`${API}/manager/shift-details/${shiftId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setShiftDetails(await res.json());
    } catch (err) {
      setErrors(p => ({ ...p, shiftDetails: err.message }));
    } finally {
      setLoading(p => ({ ...p, shiftDetails: false }));
    }
  }, [API]);

  const closeShiftDetails = useCallback(() => {
    setShiftDetailOpen(false);
    setShiftDetails(null);
    setErrors(p => ({ ...p, shiftDetails: null }));
  }, []);

  const closeAgentStats = useCallback(() => {
    setSelectedAgentId(null);
    setAgentStats(null);
    setErrors(p => ({ ...p, agentStats: null }));
  }, []);

  /* ── Effects ── */

  // Boot + 30 s auto-refresh
  useEffect(() => {
    fetchActiveAgents();
    fetchAnalytics();
    const interval = setInterval(() => {
      fetchActiveAgents();
      fetchAnalytics();
      if (activeView === "analytics") fetchAdvancedAnalytics();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveAgents, fetchAnalytics, fetchAdvancedAnalytics, activeView]);

  // Load shifts on tab open or filter change
  useEffect(() => {
    if (activeView === "shifts") fetchShifts();
  }, [filters, activeView, fetchShifts]);

  // Lazy-load advanced analytics on first visit
  useEffect(() => {
    if (activeView === "analytics" && !advancedAnalytics) fetchAdvancedAnalytics();
  }, [activeView, advancedAnalytics, fetchAdvancedAnalytics]);

  /* ── Formatters ── */

  const formatDuration = (hours) => {
    if (hours == null || hours < 0) return "—";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      const date = new Date(value);
      return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  /* ── Tab config ── */
  const TABS = [
    { id: "overview",  label: "Overview"            },
    { id: "active",    label: `Active Agents${activeAgents.length > 0 ? ` (${activeAgents.length})` : ""}` },
    { id: "shifts",    label: "All Shifts"           },
    { id: "analytics", label: "Advanced Analytics"  },
    { id: "users",     label: "Manage Users"         },
  ];

  /* ── Render ── */
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, fontFamily: "'Inter',sans-serif" }}>
      <style>{GLOBAL_CSS}</style>

      {/* ════════════════════════════════ TOPBAR ════ */}
      <div style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: "0 32px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Left: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%", background: C.greenText,
            animation: "mgr-pulse 2.5s ease-in-out infinite",
          }} />
          <span style={{
            fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600,
            color: C.ink, letterSpacing: "-0.01em",
          }}>
            Manager Dashboard
          </span>
          <span style={{ fontSize: 11, color: C.inkMid }}>· Operations Centre</span>
        </div>

        {/* Right: spinner + refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {(loading.activeAgents || loading.analytics) && (
            <div style={{
              width: 14, height: 14,
              border: `1.5px solid ${C.borderLight}`,
              borderTop: `1.5px solid ${C.accentLight}`,
              borderRadius: "50%",
              animation: "mgr-spin .8s linear infinite",
            }} />
          )}
          <button
            className="mgr-btn-ghost"
            onClick={() => { fetchActiveAgents(); fetchAnalytics(); }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ════════════════════════════════ NAV TABS ════ */}
      <div style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: "flex", padding: "0 32px",
        overflowX: "auto",
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`mgr-tab${activeView === tab.id ? " mgr-tab-active" : ""}`}
            onClick={() => setActiveView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════ CONTENT ════ */}
      <div style={
        activeView === "analytics"
          ? { padding: 0 }
          : { padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }
      }>

        {/* ════ OVERVIEW ════ */}
        {activeView === "overview" && (
          <div style={{ animation: "mgr-rise .4s ease" }}>
            <ErrorBanner message={errors.analytics} />

            {loading.analytics && !analytics ? (
              <Spinner />
            ) : analytics ? (
              <>
                {/* Today */}
                <SectionHeading title="Today's Overview" sub="Live data — refreshes every 30 seconds" />
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: 14, marginBottom: 32,
                }}>
                  <KpiCard label="Active Now"     value={analytics.active_now              ?? 0} color={C.greenText}   delay={0}    />
                  <KpiCard label="Agents Today"   value={analytics.today?.agents_active    ?? 0} color={C.accentLight} delay={0.05} />
                  <KpiCard label="Cases Triaged"  value={analytics.today?.cases_triaged    ?? 0} color={C.greenText}   delay={0.10} />
                  <KpiCard label="Avg Cases / hr" value={analytics.avg_productivity        ?? 0} color={C.amberText}   delay={0.15} />
                  <KpiCard label="Alerts Today"   value={analytics.alerts_today            ?? 0} color={C.redText}     delay={0.20} />
                  <KpiCard label="Tickets Today"  value={analytics.tickets_today           ?? 0} color={C.amberText}   delay={0.25} />
                </div>

                {/* This week */}
                <SectionHeading title="This Week" sub="Monday – today" />
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: 14, marginBottom: 32,
                }}>
                  <KpiCard label="Active Agents" value={analytics.week?.agents_active ?? 0} color={C.accentLight} delay={0}    />
                  <KpiCard label="Total Shifts"  value={analytics.week?.total_shifts  ?? 0} color={C.indigo}      delay={0.05} />
                  <KpiCard label="Cases Triaged" value={analytics.week?.cases_triaged ?? 0} color={C.greenText}   delay={0.10} />
                </div>

                {/* This month */}
                <SectionHeading title="This Month" sub="Month-to-date" />
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: 14,
                }}>
                  <KpiCard label="Active Agents" value={analytics.month?.agents_active ?? 0} color={C.accentLight} delay={0}    />
                  <KpiCard label="Total Shifts"  value={analytics.month?.total_shifts  ?? 0} color={C.indigo}      delay={0.05} />
                  <KpiCard label="Cases Triaged" value={analytics.month?.cases_triaged ?? 0} color={C.greenText}   delay={0.10} />
                </div>
              </>
            ) : (
              <EmptyState message="No analytics data available" />
            )}
          </div>
        )}

        {/* ════ ACTIVE AGENTS ════ */}
        {activeView === "active" && (
          <div style={{ animation: "mgr-rise .4s ease" }}>
            <SectionHeading
              title="Active Agents"
              sub="Agents currently logged in to a live shift"
            />
            <ErrorBanner message={errors.activeAgents} />

            {loading.activeAgents && !activeAgents.length ? (
              <Spinner />
            ) : activeAgents.length > 0 ? (
              <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead className="mgr-thead">
                    <tr>
                      {["Agent Name", "Login Time", "Hours Active", "Cases Triaged", "Actions"].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="mgr-tbody">
                    {activeAgents.map(agent => (
                      <tr key={agent.shift_id ?? agent.agent_id}>
                        <td>
                          <span style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12, color: C.ink,
                            fontWeight: 500,
                          }}>
                            {agent.agent_name ?? "Unknown Agent"}
                          </span>
                        </td>
                        <td style={{ color: C.inkMid, fontSize: 12 }}>
                          {formatDate(agent.login_time)}
                        </td>
                        <td>
                          <span className="mgr-badge-active">
                            <ActiveDot />
                            {formatDuration(agent.hours_active)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: C.greenText }}>
                          {agent.triaged_count ?? 0}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="mgr-btn"
                              onClick={() => fetchAgentStats(agent.agent_id)}
                            >
                              View Stats
                            </button>
                            <button
                              className="mgr-btn-indigo"
                              onClick={() => fetchShiftDetails(agent.shift_id)}
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="No agents are currently active" />
            )}
          </div>
        )}

        {/* ════ ALL SHIFTS ════ */}
        {activeView === "shifts" && (
          <div style={{ animation: "mgr-rise .4s ease" }}>
            <SectionHeading
              title="All Shifts"
              sub="Browse and filter all recorded shifts"
            />

            {/* Filter bar */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "14px 18px",
              display: "flex", gap: 10, flexWrap: "wrap",
              alignItems: "center", marginBottom: 20,
            }}>
              <input
                type="date"
                className="mgr-input"
                value={filters.startDate}
                onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                style={{ minWidth: 140 }}
              />
              <input
                type="date"
                className="mgr-input"
                value={filters.endDate}
                onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                style={{ minWidth: 140 }}
              />
              <input
                type="text"
                className="mgr-input"
                placeholder="Filter by Agent Name…"
                value={filters.agentId}
                onChange={e => setFilters(f => ({ ...f, agentId: e.target.value }))}
                style={{ flex: 1, minWidth: 180 }}
              />
              <button
                className="mgr-btn-ghost"
                onClick={() => setFilters({ startDate: "", endDate: "", agentId: "" })}
              >
                Clear
              </button>
            </div>

            <ErrorBanner message={errors.shifts} />

            {loading.shifts && !allShifts.length ? (
              <Spinner />
            ) : allShifts.length > 0 ? (
              <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead className="mgr-thead">
                    <tr>
                      {["Agent Name", "Login", "Logout", "Duration", "Triaged", "Status", "Actions"].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="mgr-tbody">
                    {allShifts.map(shift => (
                      <tr key={shift.id}>
                        <td>
                          <span style={{
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 12, color: C.ink,
                            fontWeight: 500,
                          }}>
                            {shift.agent_name ?? "Unknown Agent"}
                          </span>
                        </td>
                        <td style={{ color: C.inkMid, fontSize: 12 }}>
                          {formatDate(shift.login_time)}
                        </td>
                        <td style={{ color: C.inkMid, fontSize: 12 }}>
                          {shift.logout_time ? formatDate(shift.logout_time) : "—"}
                        </td>
                        <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                          {formatDuration(shift.duration_hours)}
                        </td>
                        <td style={{ fontWeight: 600, color: C.greenText }}>
                          {shift.triaged_count ?? 0}
                        </td>
                        <td>
                          {shift.logout_time ? (
                            <span className="mgr-badge-done">Completed</span>
                          ) : (
                            <span className="mgr-badge-active">
                              <ActiveDot /> Active
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="mgr-btn"
                            onClick={() => fetchShiftDetails(shift.id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="No shifts found — try adjusting the filters" />
            )}
          </div>
        )}

        {/* ════ ADVANCED ANALYTICS ════ */}
        {activeView === "analytics" && (
          <AdvancedAnalytics
            data={advancedAnalytics}
            loading={loading.advancedAnalytics}
            error={errors.advancedAnalytics}
            onRefresh={fetchAdvancedAnalytics}
            api={API}
          />
        )}

        {/* ════ USER MANAGEMENT ════ */}
        {activeView === "users" && (
          <UserManagement api={API} />
        )}

      </div>

      {/* ════ SHIFT DETAILS MODAL ════ */}
      {shiftDetailOpen && (
        <ShiftDetailsModal
          shiftDetails={shiftDetails}
          isLoading={loading.shiftDetails}
          error={errors.shiftDetails}
          onClose={closeShiftDetails}
          formatDate={formatDate}
          formatDuration={formatDuration}
        />
      )}

      {/* ════ AGENT STATS MODAL ════ */}
      {selectedAgentId !== null && (
        <AgentStatsModal
          agentStats={agentStats}
          isLoading={loading.agentStats}
          error={errors.agentStats}
          onClose={closeAgentStats}
          formatDate={formatDate}
          formatDuration={formatDuration}
        />
      )}

    </div>
  );
}

export default ManagerDashboard;