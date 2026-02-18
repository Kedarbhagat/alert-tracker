import { useState, useEffect } from "react";
import { styles, C, GLOBAL_CSS } from "./styles";
import ManagerDashboard from "./mngr_dash";

function App() {
  const [agents, setAgents]               = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError]     = useState(null);
  const [pendingAgent, setPendingAgent]   = useState(null);
  const [activeAgentId, setActiveAgentId] = useState(null);

  const monitorOptions = [
    "Payments Monitor",
    "API Monitor",
    "Infra Monitor",
    "Database Monitor",
    "Security Monitor",
  ];

  const alertOptions = [
    "Server Down",
    "Network Delay",
    "API Failure",
    "Database Issue",
  ];

  const API = "http://172.16.8.50:5000";

  // ── Inject global CSS once ──────────────────────────────────────────────────
  useEffect(() => {
    const id = "ag-global-styles";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = GLOBAL_CSS;
      document.head.appendChild(el);
    }
  }, []);

  // ── Fetch agents from DB on mount ───────────────────────────────────────────
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setAgentsLoading(true);
        const res = await fetch(`${API}/manager/users`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        setAgents(d.users || []);
      } catch (e) {
        setAgentsError(e.message);
      } finally {
        setAgentsLoading(false);
      }
    };
    loadAgents();
  }, []);

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [shiftId, setShiftId]             = useState(null);
  const [triagedCount, setTriagedCount]   = useState(0);
  const [showManager, setShowManager]     = useState(false);

  const [ticketInput, setTicketInput]     = useState("");
  const [tickets, setTickets]             = useState([]);

  const [selectedMonitor, setSelectedMonitor] = useState("");
  const [selectedAlert, setSelectedAlert]     = useState("");
  const [alertComment, setAlertComment]       = useState("");

  const [incidentStatus, setIncidentStatus] = useState("");
  const [adhocTask, setAdhocTask]           = useState("");
  const [showSummary, setShowSummary]       = useState(false);
  const [summaryData, setSummaryData]       = useState(null);

  // ── Restore session from localStorage ──────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("activeShift");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.agentName && s.shiftId) {
          setSelectedAgent(s.agentName);
          setActiveAgentId(s.agentId || null);
          setShiftId(s.shiftId);
          setTriagedCount(s.triagedCount || 0);
        }
      } catch {
        localStorage.removeItem("activeShift");
      }
    }
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelectAgent = (agent) => setPendingAgent(agent);

  const handleStartShift = async () => {
    if (!pendingAgent) return;
    const agent = pendingAgent;

    const checkRes  = await fetch(`${API}/check-active-shift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agent.id, agent_name: agent.name }),
    });
    const checkData = await checkRes.json();
    const agentUUID = checkData.agent_id || agent.id;

    let shiftData;
    if (checkData.has_active_shift) {
      shiftData = { shift_id: checkData.shift_id, triaged_count: checkData.triaged_count };
    } else {
      const r  = await fetch(`${API}/start-shift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentUUID }),
      });
      shiftData = await r.json();
    }

    setPendingAgent(null);
    setSelectedAgent(agent.name);
    setActiveAgentId(agent.id);
    setShiftId(shiftData.shift_id);
    setTriagedCount(shiftData.triaged_count || 0);
    localStorage.setItem("activeShift", JSON.stringify({
      agentName: agent.name,
      agentId: agent.id,
      shiftId: shiftData.shift_id,
      triagedCount: shiftData.triaged_count || 0,
    }));
  };

  const updateTriage = async (change) => {
    if (triagedCount <= 0 && change < 0) return;
    const res  = await fetch(`${API}/update-triage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id: shiftId, change }),
    });
    const data = await res.json();
    setTriagedCount(data.triaged_count);
  };

  const handleAddTickets = () => {
    if (!ticketInput.trim()) return;
    const newTickets = ticketInput
      .split("\n")
      .filter((t) => t.trim() !== "")
      .map((t) => ({ number: t, description: "" }));
    setTickets([...tickets, ...newTickets]);
    setTicketInput("");
  };

  const saveTicketsToBackend = async () => {
    if (tickets.length === 0) return;
    await fetch(`${API}/add-tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id: shiftId, tickets }),
    });
    alert("Tickets saved successfully");
    setTickets([]);
  };

  const handleAddAlert = async () => {
    if (!selectedMonitor || !selectedAlert) {
      alert("Please select monitor and alert type");
      return;
    }
    await fetch(`${API}/add-alert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shiftId,
        monitor: selectedMonitor,
        alert_type: selectedAlert,
        comment: alertComment,
      }),
    });
    alert("Alert logged successfully");
    setSelectedMonitor("");
    setSelectedAlert("");
    setAlertComment("");
  };

  const handleSaveIncidentStatus = async () => {
    if (!incidentStatus.trim()) {
      alert("Please enter incident/status information");
      return;
    }
    await fetch(`${API}/add-incident`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id: shiftId, description: incidentStatus }),
    });
    alert("Incident/Status saved successfully");
    setIncidentStatus("");
  };

  const handleSaveAdhocTask = async () => {
    if (!adhocTask.trim()) {
      alert("Please enter ad-hoc task information");
      return;
    }
    await fetch(`${API}/add-adhoc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id: shiftId, task: adhocTask }),
    });
    alert("Ad-hoc task saved successfully");
    setAdhocTask("");
  };

  const handleEndShift = async () => {
    await fetch(`${API}/end-shift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id: shiftId }),
    });
    const res     = await fetch(`${API}/shift-summary/${shiftId}`);
    const summary = await res.json();
    setSummaryData(summary);
    setShowSummary(true);
  };

  const handleCloseSummary = () => {
    localStorage.removeItem("activeShift");
    setShowSummary(false);
    setSummaryData(null);
    setSelectedAgent(null);
    setActiveAgentId(null);
    setShiftId(null);
    setTriagedCount(0);
    setTickets([]);
    setIncidentStatus("");
    setAdhocTask("");
  };

  // ── Shared icon colours ─────────────────────────────────────────────────────
  const iconStroke = C.inkMid;

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={styles.container}>

      {/* ── Manager toggle ── */}
      <button
        className="ag-mgr-toggle"
        onClick={() => setShowManager((s) => !s)}
        title={showManager ? "Agent View" : "Manager View"}
      >
        {showManager ? "👤" : "⚙️"}
      </button>

      {/* ══════════════════════════════════════════════════════════════════════
          MANAGER VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {showManager ? (
        <ManagerDashboard />

      /* ════════════════════════════════════════════════════════════════════
          LOGIN / AGENT SELECT
      ════════════════════════════════════════════════════════════════════ */
      ) : !selectedAgent ? (
        <div style={styles.loginWrapper}>
          <div style={styles.loginCard}>

            {/* Logo + title */}
            <div style={styles.logoSection}>
              <div style={styles.logoIcon}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              {/* <h1 style={styles.loginTitle}>Shift Management</h1> */}
              <p style={styles.loginSubtitle}>Select your profile to begin your shift</p>
            </div>

            {/* Loading / error states */}
            {agentsLoading && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{
                  width: 26, height: 26, margin: "0 auto",
                  border: `2px solid ${C.borderLight}`,
                  borderTop: `2px solid ${C.accentLight}`,
                  borderRadius: "50%",
                  animation: "agent-spin .8s linear infinite",
                }} />
              </div>
            )}
            {agentsError && (
              <div style={{
                padding: "12px 16px", marginBottom: "16px",
                background: C.redFaint, border: `1px solid ${C.redBorder}`,
                borderRadius: "8px", color: C.redText,
                fontSize: "13px", display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span>⚠</span> Could not load agents: {agentsError}
              </div>
            )}
            {!agentsLoading && !agentsError && agents.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: C.inkLight, fontSize: "14px" }}>
                No agents registered yet. Ask your manager to add agents.
              </div>
            )}

            {/* Agent grid */}
            <div style={styles.agentGrid}>
              {agents.map((agent) => {
                const blocked  = agent.is_active && agent.id !== activeAgentId;
                const isMyself = agent.is_active && agent.id === activeAgentId;
                return (
                  <button
                    key={agent.id}
                    className="ag-agent-btn"
                    style={{ opacity: blocked ? 0.4 : 1, cursor: blocked ? "not-allowed" : "pointer" }}
                    onClick={() => { if (!blocked) handleSelectAgent(agent); }}
                  >
                    <div style={styles.agentAvatar}>
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={styles.agentName}>{agent.name}</span>
                    {agent.is_active && (
                      <span className={isMyself ? "ag-badge-resume" : "ag-badge-active"}>
                        {isMyself ? "↩ Resume Shift" : "● In Shift"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Confirm-Start modal ── */}
          {pendingAgent && (
            <div
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1000,
              }}
              onClick={() => setPendingAgent(null)}
            >
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: "14px",
                  padding: "40px",
                  maxWidth: "380px", width: "90%",
                  boxShadow: "0 24px 56px rgba(0,0,0,0.7)",
                  textAlign: "center",
                  animation: "agent-rise .2s ease",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: "rgba(37,99,235,0.15)",
                  border: `1px solid ${C.accentBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 700, color: C.accentLight,
                  margin: "0 auto 18px",
                }}>
                  {pendingAgent.name.charAt(0).toUpperCase()}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 6, marginTop: 0 }}>
                  {pendingAgent.name}
                </h2>
                <p style={{ fontSize: 13, color: C.inkMid, marginBottom: 28, marginTop: 0 }}>
                  {pendingAgent?.is_active && pendingAgent?.id === activeAgentId
                    ? "Resume your active shift?"
                    : "Ready to start your shift?"}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="ag-btn-cancel" onClick={() => setPendingAgent(null)}>
                    Cancel
                  </button>
                  <button className="ag-btn-confirm" onClick={handleStartShift}>
                    {pendingAgent?.is_active && pendingAgent?.id === activeAgentId
                      ? "Resume Shift"
                      : "Start Shift"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      /* ════════════════════════════════════════════════════════════════════
          SHIFT SUMMARY
      ════════════════════════════════════════════════════════════════════ */
      ) : showSummary ? (
        <div style={styles.summaryWrapper}>
          <div style={styles.summaryContainer}>

            {/* Summary header */}
            <div style={styles.summaryHeader}>
              <h1 style={styles.summaryTitle}>Shift Complete ✓</h1>
              <p style={styles.summarySubtitle}>
                {selectedAgent} &nbsp;·&nbsp;{" "}
                {new Date(summaryData.start_time).toLocaleString()} — {new Date(summaryData.end_time).toLocaleString()}
              </p>

              <div style={styles.summaryStats}>
                {[
                  { label: "Triaged",    value: summaryData.triaged_count  },
                  { label: "Tickets",    value: summaryData.ticket_count   },
                  { label: "Alerts",     value: summaryData.alert_count    },
                  { label: "Incidents",  value: summaryData.incident_count },
                  { label: "Ad-hoc",     value: summaryData.adhoc_count    },
                ].map(({ label, value }) => (
                  <div key={label} style={styles.statCard}>
                    <div style={styles.statValue}>{value}</div>
                    <div style={styles.statLabel}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tickets */}
            {summaryData.tickets?.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accentLight} strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Tickets Handled ({summaryData.tickets.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.tickets.map((ticket, i) => (
                    <div key={i} className="ag-summary-item">
                      <div style={styles.itemHeader}>
                        <span style={{ ...styles.itemTitle, fontFamily: "'JetBrains Mono',monospace", color: C.accentLight }}>
                          #{ticket.number}
                        </span>
                        <span style={styles.itemTime}>{new Date(ticket.created_at).toLocaleTimeString()}</span>
                      </div>
                      {ticket.description && <div style={styles.itemDescription}>{ticket.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {summaryData.alerts?.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.amberText} strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Alerts Logged ({summaryData.alerts.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.alerts.map((alert, i) => (
                    <div key={i} className="ag-summary-item" style={{ borderLeftColor: C.amberText }}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>{alert.monitor} — {alert.type}</span>
                        <span style={styles.itemTime}>{new Date(alert.created_at).toLocaleTimeString()}</span>
                      </div>
                      {alert.comment && <div style={styles.itemDescription}>{alert.comment}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incidents */}
            {summaryData.incidents?.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.redText} strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Incidents Reported ({summaryData.incidents.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.incidents.map((incident, i) => (
                    <div key={i} className="ag-summary-item" style={{ borderLeftColor: C.redText }}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>Incident #{i + 1}</span>
                        <span style={styles.itemTime}>{new Date(incident.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={styles.itemDescription}>{incident.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ad-hoc tasks */}
            {summaryData.adhoc_tasks?.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.greenText} strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  Ad-hoc Tasks ({summaryData.adhoc_tasks.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.adhoc_tasks.map((task, i) => (
                    <div key={i} className="ag-summary-item" style={{ borderLeftColor: C.greenText }}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>Task #{i + 1}</span>
                        <span style={styles.itemTime}>{new Date(task.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={styles.itemDescription}>{task.task}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!summaryData.tickets?.length &&
             !summaryData.alerts?.length &&
             !summaryData.incidents?.length &&
             !summaryData.adhoc_tasks?.length &&
             summaryData.triaged_count === 0 && (
              <div style={styles.summarySection}>
                <div style={styles.emptyState}>No activities recorded during this shift.</div>
              </div>
            )}

            <div style={styles.summaryActions}>
              <button className="ag-btn-summary" onClick={handleCloseSummary}>
                Start New Shift
              </button>
            </div>
          </div>
        </div>

      /* ════════════════════════════════════════════════════════════════════
          MAIN SHIFT DASHBOARD
      ════════════════════════════════════════════════════════════════════ */
      ) : (
        <div style={styles.mainLayout}>

          {/* ── Header ── */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.headerIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h2 style={styles.headerTitle}>Shift Dashboard</h2>
                <p style={styles.headerSubtitle}>
                  Agent: <span style={{ color: C.accentLight, fontWeight: 600 }}>{selectedAgent}</span>
                </p>
              </div>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.statusBadge}>
                <div style={styles.statusDot} />
                Active Shift
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div style={styles.content}>

            {/* Triage counter */}
            <div style={styles.metricsRow}>
              <div style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <span style={styles.metricLabel}>Triaged Cases</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div style={styles.counterWrapper}>
                  <button className="ag-counter-btn" onClick={() => updateTriage(-1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <span style={styles.counterValue}>{triagedCount}</span>
                  <button className="ag-counter-btn" onClick={() => updateTriage(1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* ── 2×2 card grid ── */}
            <div style={styles.gridLayout}>

              {/* Ticket Management */}
              <div className="ag-card">
                <div className="ag-card-header">
                  <h3 style={styles.cardTitle}>Ticket Management</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Ticket Numbers</label>
                  <textarea
                    rows="3"
                    placeholder="Enter ticket numbers (one per line)"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    className="ag-input"
                  />
                  <button className="ag-btn-primary" onClick={handleAddTickets}>
                    Add Tickets
                  </button>

                  {tickets.length > 0 && (
                    <div style={styles.ticketList}>
                      <div style={styles.ticketListHeader}>
                        <span style={styles.ticketCount}>{tickets.length} ticket(s) pending save</span>
                      </div>
                      {tickets.map((ticket, index) => (
                        <div key={index} className="ag-ticket-item">
                          <div style={styles.ticketNumber}>#{ticket.number}</div>
                          <textarea
                            placeholder="Add description..."
                            value={ticket.description}
                            onChange={(e) => {
                              const updated = [...tickets];
                              updated[index].description = e.target.value;
                              setTickets(updated);
                            }}
                            className="ag-input"
                            rows="2"
                          />
                        </div>
                      ))}
                      <button className="ag-btn-save" onClick={saveTicketsToBackend}>
                        Save All Tickets
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Alert Logging */}
              <div className="ag-card">
                <div className="ag-card-header">
                  <h3 style={styles.cardTitle}>Alert Logging</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.amberText} strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Monitor Type</label>
                  <select
                    value={selectedMonitor}
                    onChange={(e) => setSelectedMonitor(e.target.value)}
                    className="ag-input"
                  >
                    <option value="">Select monitor…</option>
                    {monitorOptions.map((m, i) => (
                      <option key={i} value={m}>{m}</option>
                    ))}
                  </select>

                  <label style={styles.label}>Alert Type</label>
                  <select
                    value={selectedAlert}
                    onChange={(e) => setSelectedAlert(e.target.value)}
                    className="ag-input"
                  >
                    <option value="">Select alert type…</option>
                    {alertOptions.map((a, i) => (
                      <option key={i} value={a}>{a}</option>
                    ))}
                  </select>

                  <label style={styles.label}>Alert Details</label>
                  <textarea
                    rows="3"
                    placeholder="Provide detailed information about the alert…"
                    value={alertComment}
                    onChange={(e) => setAlertComment(e.target.value)}
                    className="ag-input"
                  />

                  <button className="ag-btn-alert" onClick={handleAddAlert}>
                    Log Alert
                  </button>
                </div>
              </div>

              {/* Incident Reporting */}
              <div className="ag-card">
                <div className="ag-card-header">
                  <h3 style={styles.cardTitle}>Incident Reporting</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.redText} strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Incident Description</label>
                  <textarea
                    rows="6"
                    placeholder="Document incident details, status updates, or relevant information…"
                    value={incidentStatus}
                    onChange={(e) => setIncidentStatus(e.target.value)}
                    className="ag-input"
                  />
                  <button className="ag-btn-primary" onClick={handleSaveIncidentStatus}>
                    Save Incident Report
                  </button>
                </div>
              </div>

              {/* Ad-hoc Tasks */}
              <div className="ag-card">
                <div className="ag-card-header">
                  <h3 style={styles.cardTitle}>Ad-hoc Tasks</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.greenText} strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Task Description</label>
                  <textarea
                    rows="6"
                    placeholder="Document any ad-hoc tasks or special assignments…"
                    value={adhocTask}
                    onChange={(e) => setAdhocTask(e.target.value)}
                    className="ag-input"
                  />
                  <button className="ag-btn-save" onClick={handleSaveAdhocTask}>
                    Save Ad-hoc Task
                  </button>
                </div>
              </div>

            </div>{/* /gridLayout */}

            {/* ── Footer ── */}
            <div style={styles.actionsFooter}>
              <button className="ag-btn-end" onClick={handleEndShift}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                End Shift
              </button>
            </div>

          </div>{/* /content */}
        </div>
      )}
    </div>
  );
}

export default App;