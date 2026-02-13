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

  const [onBreak, setOnBreak] = useState(false);

  // ---------------------------
  // START SHIFT
  // ---------------------------
  const handleSelectAgent = async (agent) => {
    const response = await fetch(`${API}/start-shift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agent.id }),
    });

    const data = await response.json();
    setSelectedAgent(agent.name);
    setShiftId(data.shift_id);
    setTriagedCount(0);
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

    alert("Tickets saved successfully ✅");

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

    alert("Alert logged successfully ✅");

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
      description: incidentStatus,   // ✅ FIXED HERE
    }),
  });

  const data = await response.json();
  console.log(data);

  alert("Incident/Status saved successfully ✅");
  setIncidentStatus("");
};


  // ---------------------------
  // TOGGLE BREAK
  // ---------------------------
  const handleToggleBreak = async () => {
    const response = await fetch(`${API}/toggle-break`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shift_id: shiftId }),
    });

    const data = await response.json();
    alert(data.message);
    setOnBreak(!onBreak);
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
Break Seconds: ${summary.total_break_seconds}
    `);

    setSelectedAgent(null);
    setShiftId(null);
    setTriagedCount(0);
    setTickets([]);
    setIncidentStatus("");
    setOnBreak(false);
  };

  return (
    <div style={styles.container}>
      {!selectedAgent ? (
        <>
          <h1 style={styles.title}>🚀 Select Your Name</h1>
          <div style={styles.grid}>
            {agents.map((agent) => (
              <button
                key={agent.id}
                style={styles.button}
                onClick={() => handleSelectAgent(agent)}
              >
                {agent.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={styles.dashboard}>
          <h2>Shift Dashboard - {selectedAgent}</h2>

          {/* TRIAGED COUNTER */}
          <div style={styles.section}>
            <h3>Triaged Counter</h3>
            <div style={styles.counterWrapper}>
              <button
                style={styles.counterButton}
                onClick={() => updateTriage(-1)}
              >
                -
              </button>

              <span style={styles.counterValue}>
                {triagedCount}
              </span>

              <button
                style={styles.counterButton}
                onClick={() => updateTriage(1)}
              >
                +
              </button>
            </div>
          </div>

          {/* TICKETS */}
          <div style={styles.section}>
            <h3>Tickets</h3>

            <textarea
              rows="4"
              placeholder="One ticket per line"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              style={styles.textarea}
            />

            <button
              style={styles.smallButton}
              onClick={handleAddTickets}
            >
              Add Tickets
            </button>

            {tickets.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h4>Added Tickets</h4>

                {tickets.map((ticket, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "15px",
                      padding: "12px",
                      background: "#f9fafb",
                      borderRadius: "10px",
                    }}
                  >
                    <strong>Ticket: {ticket.number}</strong>

                    <textarea
                      placeholder="Describe this ticket..."
                      value={ticket.description}
                      onChange={(e) => {
                        const updated = [...tickets];
                        updated[index].description =
                          e.target.value;
                        setTickets(updated);
                      }}
                      style={{
                        width: "100%",
                        marginTop: "8px",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                ))}

                <button
                  style={styles.smallButton}
                  onClick={saveTicketsToBackend}
                >
                  Save All Tickets
                </button>
              </div>
            )}
          </div>

          {/* ALERTS (Monitor Coupled) */}
          <div style={styles.section}>
            <h3>Alerts</h3>

            <select
              value={selectedMonitor}
              onChange={(e) => setSelectedMonitor(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Monitor</option>
              {monitorOptions.map((monitor, i) => (
                <option key={i} value={monitor}>
                  {monitor}
                </option>
              ))}
            </select>

            <select
              value={selectedAlert}
              onChange={(e) => setSelectedAlert(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Alert Type</option>
              {alertOptions.map((alert, i) => (
                <option key={i} value={alert}>
                  {alert}
                </option>
              ))}
            </select>

            <textarea
              rows="3"
              placeholder="Add alert details..."
              value={alertComment}
              onChange={(e) => setAlertComment(e.target.value)}
              style={styles.textarea}
            />

            <button
              style={styles.smallButton}
              onClick={handleAddAlert}
            >
              Log Alert
            </button>
          </div>

          {/* INCIDENT/STATUS */}
          <div style={styles.section}>
            <h3>Incident/Status</h3>

            <textarea
              rows="4"
              placeholder="Enter incident or status information..."
              value={incidentStatus}
              onChange={(e) => setIncidentStatus(e.target.value)}
              style={styles.textarea}
            />

            <button
              style={styles.smallButton}
              onClick={handleSaveIncidentStatus}
            >
              Save Incident/Status
            </button>
          </div>

          {/* BREAK & END */}
          <div style={styles.bottomSection}>
            <button
              style={
                onBreak ? styles.breakActive : styles.breakButton
              }
              onClick={handleToggleBreak}
            >
              {onBreak ? "End Break" : "Take Break"}
            </button>

            <button
              style={styles.endButton}
              onClick={handleEndShift}
            >
              End Shift
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    background: "linear-gradient(120deg, #1e3c72, #2a5298)",
    fontFamily: "Inter, sans-serif",
    color: "#1f2937",
  },

  title: {
    fontSize: "34px",
    textAlign: "center",
    color: "white",
    marginBottom: "40px",
    fontWeight: "700",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    maxWidth: "600px",
    margin: "0 auto",
  },

  button: {
    padding: "16px",
    backgroundColor: "white",
    color: "#1e3c72",
    border: "none",
    borderRadius: "14px",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    transition: "0.3s",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  },

  dashboard: {
    maxWidth: "900px",
    margin: "0 auto",
    background: "white",
    borderRadius: "20px",
    padding: "35px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },

  section: {
    marginBottom: "30px",
    padding: "20px",
    borderRadius: "16px",
    backgroundColor: "#f3f4f6",
  },

  header: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "15px",
    color: "#111827",
  },

  textarea: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    marginTop: "10px",
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    marginTop: "10px",
  },

  smallButton: {
    marginTop: "12px",
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "500",
  },

  counterWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
  },

  counterButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "white",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  counterValue: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#2563eb",
    minWidth: "60px",
    textAlign: "center",
  },

  ticketList: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#374151",
  },

  bottomSection: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "40px",
  },

  breakButton: {
    padding: "12px 25px",
    backgroundColor: "#f59e0b",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    cursor: "pointer",
    color: "white",
  },

  breakActive: {
    padding: "12px 25px",
    backgroundColor: "#dc2626",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    cursor: "pointer",
    color: "white",
  },

  endButton: {
    padding: "12px 25px",
    backgroundColor: "#111827",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    cursor: "pointer",
    color: "white",
  },
};


export default App;