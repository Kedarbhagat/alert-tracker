import { useState } from "react";

function App() {
  const agents = [
    { id: "7b6fc435-1587-4405-980a-b738991e7961", name: "Kedar" },
    { id: "REAL_UUID_2", name: "Agent 2" },
    { id: "REAL_UUID_3", name: "Agent 3" },
    { id: "REAL_UUID_4", name: "Agent 4" },
  ];

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

  const API = "http://127.0.0.1:5000";

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [shiftId, setShiftId] = useState(null);
  const [triagedCount, setTriagedCount] = useState(0);

  const [ticketInput, setTicketInput] = useState("");
  const [tickets, setTickets] = useState([]);

  const [selectedMonitor, setSelectedMonitor] = useState("");
  const [selectedAlert, setSelectedAlert] = useState("");
  const [alertComment, setAlertComment] = useState("");

  const [incidentStatus, setIncidentStatus] = useState("");

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
  // START SHIFT
  // ---------------------------
  const handleSelectAgent = async (agent) => {
    // Check if agent already has an active shift
    const checkResponse = await fetch(`${API}/check-active-shift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agent.id }),
    });

    const checkData = await checkResponse.json();

    let shiftData;
    if (checkData.has_active_shift) {
      // Resume existing shift
      shiftData = {
        shift_id: checkData.shift_id,
        triaged_count: checkData.triaged_count,
      };
      alert("Resuming your active shift");
    } else {
      // Create new shift
      const response = await fetch(`${API}/start-shift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agent.id }),
      });
      shiftData = await response.json();
    }

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

    alert(`
Shift Summary:

Triaged: ${summary.triaged_count}
Tickets: ${summary.ticket_count}
Alerts: ${summary.alert_count}
    `);

    // Clear localStorage
    localStorage.removeItem("activeShift");

    setSelectedAgent(null);
    setShiftId(null);
    setTriagedCount(0);
    setTickets([]);
    setIncidentStatus("");
  };

  return (
    <div style={styles.container}>
      {!selectedAgent ? (
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
            
            <div style={styles.agentGrid}>
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  style={styles.agentButton}
                  onClick={() => handleSelectAgent(agent)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#1e40af";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  <div style={styles.agentAvatar}>{agent.name.charAt(0)}</div>
                  <span style={styles.agentName}>{agent.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
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

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },

  // Login Screen Styles
  loginWrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },

  loginCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "48px",
    maxWidth: "560px",
    width: "100%",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },

  logoSection: {
    textAlign: "center",
    marginBottom: "40px",
  },

  logoIcon: {
    width: "64px",
    height: "64px",
    backgroundColor: "#ede9fe",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    color: "#7c3aed",
  },

  loginTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "8px",
    letterSpacing: "-0.025em",
  },

  loginSubtitle: {
    fontSize: "15px",
    color: "#64748b",
    fontWeight: "400",
  },

  agentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },

  agentButton: {
    padding: "20px",
    backgroundColor: "white",
    border: "2px solid #e2e8f0",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },

  agentAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: "#ede9fe",
    color: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "600",
  },

  agentName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },

  // Dashboard Styles
  mainLayout: {
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
  },

  header: {
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    padding: "20px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  headerIcon: {
    width: "48px",
    height: "48px",
    backgroundColor: "#ede9fe",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#7c3aed",
  },

  headerTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
    letterSpacing: "-0.025em",
  },

  headerSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
  },

  headerRight: {
    display: "flex",
    gap: "12px",
  },

  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#dcfce7",
    color: "#15803d",
    borderRadius: "9999px",
    fontSize: "14px",
    fontWeight: "600",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#22c55e",
    borderRadius: "50%",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },

  content: {
    padding: "32px",
    maxWidth: "1400px",
    margin: "0 auto",
  },

  metricsRow: {
    marginBottom: "24px",
  },

  metricCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },

  metricHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  metricLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  counterWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
  },

  counterButton: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    backgroundColor: "white",
    color: "#475569",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "#f8fafc",
      borderColor: "#cbd5e1",
    },
  },

  counterValue: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#0f172a",
    minWidth: "80px",
    textAlign: "center",
    letterSpacing: "-0.025em",
  },

  gridLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },

  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },

  cardHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },

  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0",
    letterSpacing: "-0.025em",
  },

  cardBody: {
    padding: "24px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "8px",
    marginTop: "16px",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
  },

  textarea: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    transition: "all 0.2s",
    outline: "none",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    fontFamily: "inherit",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.2s",
    outline: "none",
    boxSizing: "border-box",
  },

  primaryButton: {
    width: "100%",
    marginTop: "16px",
    padding: "12px 20px",
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "#6d28d9",
    },
  },

  alertButton: {
    width: "100%",
    marginTop: "16px",
    padding: "12px 20px",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  saveButton: {
    width: "100%",
    marginTop: "16px",
    padding: "12px 20px",
    backgroundColor: "#059669",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  ticketList: {
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #e2e8f0",
  },

  ticketListHeader: {
    marginBottom: "16px",
  },

  ticketCount: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748b",
  },

  ticketItem: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
    border: "1px solid #e2e8f0",
  },

  ticketNumber: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "8px",
  },

  ticketTextarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    fontFamily: "inherit",
    resize: "vertical",
    backgroundColor: "white",
    boxSizing: "border-box",
  },

  actionsFooter: {
    display: "flex",
    gap: "16px",
    justifyContent: "flex-end",
    padding: "24px",
    backgroundColor: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },

  endButton: {
    padding: "12px 24px",
    backgroundColor: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s",
  },
};

export default App;