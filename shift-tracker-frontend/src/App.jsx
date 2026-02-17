import { useState, useEffect } from "react";
import { styles } from "./styles";
import ManagerDashboard from "./mngr_dash";                    // added import

function App() {
  const [agents, setAgents]           = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState(null);
  // Agent the user clicked on — waiting for "Start Shift" confirmation
  const [pendingAgent, setPendingAgent] = useState(null);

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

  const API = "http://192.168.74.152:5000";  // Unified backend on port 5000

  // Fetch agents from DB on mount
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
  const [shiftId, setShiftId] = useState(null);
  const [triagedCount, setTriagedCount] = useState(0);

  // manager toggle state
  const [showManager, setShowManager] = useState(false);     // added state

  const [ticketInput, setTicketInput] = useState("");
  const [tickets, setTickets] = useState([]);

  const [selectedMonitor, setSelectedMonitor] = useState("");
  const [selectedAlert, setSelectedAlert] = useState("");
  const [alertComment, setAlertComment] = useState("");

  const [incidentStatus, setIncidentStatus] = useState("");
  const [adhocTask, setAdhocTask] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  // ---------------------------
  // LOAD SESSION FROM LOCALSTORAGE ON MOUNT
  // ---------------------------
  useState(() => {
    const savedSession = localStorage.getItem("activeShift");
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setSelectedAgent(session.agentName);
      setShiftId(session.shiftId);
      setTriagedCount(session.triagedCount || 0);
    }
  }, []);

  // ---------------------------
  // SAVE SESSION TO LOCALSTORAGE WHENEVER IT CHANGES
  // ---------------------------
  useState(() => {
    if (selectedAgent && shiftId) {
      const session = {
        agentName: selectedAgent,
        shiftId: shiftId,
        triagedCount: triagedCount,
      };
      localStorage.setItem("activeShift", JSON.stringify(session));
    }
  }, [selectedAgent, shiftId, triagedCount]);

  // ---------------------------
  // SELECT AGENT (shows confirmation screen)
  // ---------------------------
  const handleSelectAgent = (agent) => {
    setPendingAgent(agent);
  };

  // ---------------------------
  // START SHIFT (called after confirmation)
  // ---------------------------
  const handleStartShift = async () => {
    if (!pendingAgent) return;
    const agent = pendingAgent;

    const checkResponse = await fetch(`${API}/check-active-shift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agent.id, agent_name: agent.name }),
    });
    const checkData = await checkResponse.json();
    const agentUUID = checkData.agent_id || agent.id;

    let shiftData;
    if (checkData.has_active_shift) {
      shiftData = { shift_id: checkData.shift_id, triaged_count: checkData.triaged_count };
    } else {
      const response = await fetch(`${API}/start-shift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentUUID }),
      });
      shiftData = await response.json();
    }

    setPendingAgent(null);
    setSelectedAgent(agent.name);
    setShiftId(shiftData.shift_id);
    setTriagedCount(shiftData.triaged_count || 0);
  };

  // ---------------------------
  // UPDATE TRIAGE
  // ---------------------------
  const updateTriage = async (change) => {
    if (triagedCount <= 0 && change < 0) return;

    const response = await fetch(`${API}/update-triage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shiftId,
        change: change,
      }),
    });

    const data = await response.json();
    setTriagedCount(data.triaged_count);
  };

  // ---------------------------
  // ADD TICKETS
  // ---------------------------
  const handleAddTickets = () => {
    if (!ticketInput.trim()) return;

    const newTickets = ticketInput
      .split("\n")
      .filter((t) => t.trim() !== "")
      .map((t) => ({
        number: t,
        description: "",
      }));

    setTickets([...tickets, ...newTickets]);
    setTicketInput("");
  };

  const saveTicketsToBackend = async () => {
    if (tickets.length === 0) return;

    await fetch(`${API}/add-tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shiftId,
        tickets: tickets,
      }),
    });

    alert("Tickets saved successfully");
    setTickets([]);
  };

  // ---------------------------
  // ADD ALERT (Monitor + Type + Comment)
  // ---------------------------
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

  // ---------------------------
  // SAVE INCIDENT/STATUS
  // ---------------------------
  const handleSaveIncidentStatus = async () => {
    if (!incidentStatus.trim()) {
      alert("Please enter incident/status information");
      return;
    }

    const response = await fetch(`${API}/add-incident`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shiftId,
        description: incidentStatus,
      }),
    });

    const data = await response.json();
    console.log(data);

    alert("Incident/Status saved successfully");
    setIncidentStatus("");
  };

  // ---------------------------
  // SAVE AD-HOC TASK
  // ---------------------------
  const handleSaveAdhocTask = async () => {
    if (!adhocTask.trim()) {
      alert("Please enter ad-hoc task information");
      return;
    }

    const response = await fetch(`${API}/add-adhoc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shift_id: shiftId,
        task: adhocTask,
      }),
    });

    const data = await response.json();
    console.log(data);

    alert("Ad-hoc task saved successfully");
    setAdhocTask("");
  };

  // ---------------------------
  // END SHIFT
  // ---------------------------
  const handleEndShift = async () => {
    await fetch(`${API}/end-shift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id: shiftId }),
    });

    const response = await fetch(`${API}/shift-summary/${shiftId}`);
    const summary = await response.json();

    // Show summary screen instead of alert
    setSummaryData(summary);
    setShowSummary(true);
  };

  // ---------------------------
  // CLOSE SUMMARY AND LOGOUT
  // ---------------------------
  const handleCloseSummary = () => {
    // Clear localStorage
    localStorage.removeItem("activeShift");

    // Reset all state
    setShowSummary(false);
    setSummaryData(null);
    setSelectedAgent(null);
    setShiftId(null);
    setTriagedCount(0);
    setTickets([]);
    setIncidentStatus("");
    setAdhocTask("");
  };

  return (
    <div style={styles.container}>
      {/* quick toggle to open manager dashboard */}
      <button
        onClick={() => setShowManager((s) => !s)}
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 9999,
          padding: "8px 12px",
          background: "#0ea5e9",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {showManager ? "Close Manager" : "Open Manager"}
      </button>

      {showManager ? (
        <ManagerDashboard />
      ) : !selectedAgent ? (
        // Login screen — agents fetched from DB
        <div style={styles.loginWrapper}>
          <div style={styles.loginCard}>
            <div style={styles.logoSection}>
              <div style={styles.logoIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 style={styles.loginTitle}>Shift Management System</h1>
              <p style={styles.loginSubtitle}>Select your profile to begin shift</p>
            </div>

            {agentsLoading && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                Loading agents…
              </div>
            )}
            {agentsError && (
              <div style={{ textAlign: "center", padding: "16px", color: "#dc2626", background: "#fee2e2", borderRadius: 8, marginBottom: 16 }}>
                ⚠️ Could not load agents: {agentsError}
              </div>
            )}
            {!agentsLoading && !agentsError && agents.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                No agents registered yet. Ask your manager to add agents.
              </div>
            )}

            <div style={styles.agentGrid}>
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  style={{
                    ...styles.agentButton,
                    opacity: agent.is_active ? 0.55 : 1,
                    cursor: agent.is_active ? "not-allowed" : "pointer",
                    position: "relative",
                  }}
                  onClick={() => !agent.is_active && handleSelectAgent(agent)}
                  onMouseEnter={(e) => {
                    if (!agent.is_active) {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                      e.currentTarget.style.borderColor = "#1e40af";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  <div style={styles.agentAvatar}>{agent.name.charAt(0).toUpperCase()}</div>
                  <span style={styles.agentName}>{agent.name}</span>
                  {agent.is_active && (
                    <span style={{
                      display: "block",
                      fontSize: 11,
                      color: "#16a34a",
                      fontWeight: 600,
                      marginTop: 4,
                    }}>● In Shift</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Confirm Start Shift modal ── */}
          {pendingAgent && (
            <div style={{
              position: "fixed", inset: 0,
              background: "rgba(15,23,42,0.5)",
              backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000,
            }} onClick={() => setPendingAgent(null)}>
              <div style={{
                background: "#fff", borderRadius: 16,
                padding: "36px 40px", maxWidth: 400, width: "90%",
                boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
                textAlign: "center",
              }} onClick={e => e.stopPropagation()}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg,#ede9fe,#ddd6fe)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, fontWeight: 700, color: "#6d28d9",
                  margin: "0 auto 16px",
                }}>
                  {pendingAgent.name.charAt(0).toUpperCase()}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>
                  {pendingAgent.name}
                </h2>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>
                  Ready to start your shift?
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    style={{
                      flex: 1, padding: "11px 0",
                      background: "#f1f5f9", color: "#475569",
                      border: "none", borderRadius: 8,
                      cursor: "pointer", fontWeight: 600, fontSize: 14,
                    }}
                    onClick={() => setPendingAgent(null)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      flex: 1, padding: "11px 0",
                      background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                      color: "#fff", border: "none", borderRadius: 8,
                      cursor: "pointer", fontWeight: 600, fontSize: 14,
                    }}
                    onClick={handleStartShift}
                  >
                    Start Shift
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : showSummary ? (
        // Summary screen JSX
        <div style={styles.summaryWrapper}>
          <div style={styles.summaryContainer}>
            <div style={styles.summaryHeader}>
              <h1 style={styles.summaryTitle}>Shift Complete! 🎉</h1>
              <p style={styles.summarySubtitle}>
                Agent: {selectedAgent} | {new Date(summaryData.start_time).toLocaleString()} - {new Date(summaryData.end_time).toLocaleString()}
              </p>

              <div style={styles.summaryStats}>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{summaryData.triaged_count}</div>
                  <div style={styles.statLabel}>Triaged</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{summaryData.ticket_count}</div>
                  <div style={styles.statLabel}>Tickets</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{summaryData.alert_count}</div>
                  <div style={styles.statLabel}>Alerts</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{summaryData.incident_count}</div>
                  <div style={styles.statLabel}>Incidents</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{summaryData.adhoc_count}</div>
                  <div style={styles.statLabel}>Ad-hoc Tasks</div>
                </div>
              </div>
            </div>

            {/* Tickets Section */}
            {summaryData.tickets && summaryData.tickets.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Tickets Handled ({summaryData.tickets.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.tickets.map((ticket, index) => (
                    <div key={index} style={styles.summaryItem}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>#{ticket.number}</span>
                        <span style={styles.itemTime}>{new Date(ticket.created_at).toLocaleTimeString()}</span>
                      </div>
                      {ticket.description && (
                        <div style={styles.itemDescription}>{ticket.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts Section */}
            {summaryData.alerts && summaryData.alerts.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Alerts Logged ({summaryData.alerts.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.alerts.map((alert, index) => (
                    <div key={index} style={styles.summaryItem}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>{alert.monitor} - {alert.type}</span>
                        <span style={styles.itemTime}>{new Date(alert.created_at).toLocaleTimeString()}</span>
                      </div>
                      {alert.comment && (
                        <div style={styles.itemDescription}>{alert.comment}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incidents Section */}
            {summaryData.incidents && summaryData.incidents.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Incidents Reported ({summaryData.incidents.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.incidents.map((incident, index) => (
                    <div key={index} style={styles.summaryItem}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>Incident #{index + 1}</span>
                        <span style={styles.itemTime}>{new Date(incident.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={styles.itemDescription}>{incident.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ad-hoc Tasks Section */}
            {summaryData.adhoc_tasks && summaryData.adhoc_tasks.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  Ad-hoc Tasks Completed ({summaryData.adhoc_tasks.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.adhoc_tasks.map((task, index) => (
                    <div key={index} style={styles.summaryItem}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>Task #{index + 1}</span>
                        <span style={styles.itemTime}>{new Date(task.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={styles.itemDescription}>{task.task}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state if nothing was done */}
            {!summaryData.tickets?.length && 
             !summaryData.alerts?.length && 
             !summaryData.incidents?.length && 
             !summaryData.adhoc_tasks?.length && 
             summaryData.triaged_count === 0 && (
              <div style={styles.summarySection}>
                <div style={styles.emptyState}>
                  <p>No activities recorded during this shift.</p>
                </div>
              </div>
            )}

            <div style={styles.summaryActions}>
              <button
                style={styles.summaryButton}
                onClick={handleCloseSummary}
              >
                Start New Shift
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Main shift dashboard JSX
        <div style={styles.mainLayout}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.headerIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h2 style={styles.headerTitle}>Shift Dashboard</h2>
                <p style={styles.headerSubtitle}>Agent: {selectedAgent}</p>
              </div>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.statusBadge}>
                <div style={styles.statusDot}></div>
                Active Shift
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div style={styles.content}>
            {/* Metrics Row */}
            <div style={styles.metricsRow}>
              <div style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <span style={styles.metricLabel}>Triaged Cases</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div style={styles.counterWrapper}>
                  <button
                    style={styles.counterButton}
                    onClick={() => updateTriage(-1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <span style={styles.counterValue}>{triagedCount}</span>
                  <button
                    style={styles.counterButton}
                    onClick={() => updateTriage(1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid Layout */}
            <div style={styles.gridLayout}>
              {/* Tickets Section */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Ticket Management</h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Add Ticket Numbers</label>
                  <textarea
                    rows="3"
                    placeholder="Enter ticket numbers (one per line)"
                    value={ticketInput}
                    onChange={(e) => setTicketInput(e.target.value)}
                    style={styles.textarea}
                  />
                  <button
                    style={styles.primaryButton}
                    onClick={handleAddTickets}
                  >
                    Add Tickets
                  </button>

                  {tickets.length > 0 && (
                    <div style={styles.ticketList}>
                      <div style={styles.ticketListHeader}>
                        <span style={styles.ticketCount}>{tickets.length} ticket(s) pending save</span>
                      </div>
                      {tickets.map((ticket, index) => (
                        <div key={index} style={styles.ticketItem}>
                          <div style={styles.ticketNumber}>#{ticket.number}</div>
                          <textarea
                            placeholder="Add description..."
                            value={ticket.description}
                            onChange={(e) => {
                              const updated = [...tickets];
                              updated[index].description = e.target.value;
                              setTickets(updated);
                            }}
                            style={styles.ticketTextarea}
                          />
                        </div>
                      ))}
                      <button
                        style={styles.saveButton}
                        onClick={saveTicketsToBackend}
                      >
                        Save All Tickets
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Alerts Section */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Alert Logging</h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
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
                    style={styles.select}
                  >
                    <option value="">Select monitor...</option>
                    {monitorOptions.map((monitor, i) => (
                      <option key={i} value={monitor}>
                        {monitor}
                      </option>
                    ))}
                  </select>

                  <label style={styles.label}>Alert Type</label>
                  <select
                    value={selectedAlert}
                    onChange={(e) => setSelectedAlert(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Select alert type...</option>
                    {alertOptions.map((alert, i) => (
                      <option key={i} value={alert}>
                        {alert}
                      </option>
                    ))}
                  </select>

                  <label style={styles.label}>Alert Details</label>
                  <textarea
                    rows="3"
                    placeholder="Provide detailed information about the alert..."
                    value={alertComment}
                    onChange={(e) => setAlertComment(e.target.value)}
                    style={styles.textarea}
                  />

                  <button
                    style={styles.alertButton}
                    onClick={handleAddAlert}
                  >
                    Log Alert
                  </button>
                </div>
              </div>

              {/* Incident/Status Section */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Incident Reporting</h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Incident Description</label>
                  <textarea
                    rows="5"
                    placeholder="Document incident details, status updates, or relevant information..."
                    value={incidentStatus}
                    onChange={(e) => setIncidentStatus(e.target.value)}
                    style={styles.textarea}
                  />
                  <button
                    style={styles.primaryButton}
                    onClick={handleSaveIncidentStatus}
                  >
                    Save Incident Report
                  </button>
                </div>
              </div>

              {/* Ad-hoc Tasks Section */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>Ad-hoc Tasks</h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Task Description</label>
                  <textarea
                    rows="5"
                    placeholder="Document any ad-hoc tasks or special assignments..."
                    value={adhocTask}
                    onChange={(e) => setAdhocTask(e.target.value)}
                    style={styles.textarea}
                  />
                  <button
                    style={styles.primaryButton}
                    onClick={handleSaveAdhocTask}
                  >
                    Save Ad-hoc Task
                  </button>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div style={styles.actionsFooter}>
              <button
                style={styles.endButton}
                onClick={handleEndShift}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: "8px"}}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                End Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;