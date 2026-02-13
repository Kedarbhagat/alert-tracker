import { useState } from "react";

function App() {
  const agents = [
    "Kedar",
    "Agent 2",
    "Agent 3",
    "Agent 4",
    "Agent 5",
    "Agent 6",
    "Agent 7",
    "Agent 8",
  ];

  const alertOptions = [
    "Server Down",
    "Network Delay",
    "API Failure",
    "Database Issue",
  ];

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [shiftStarted, setShiftStarted] = useState(false);
  const [ticketInput, setTicketInput] = useState("");
  const [tickets, setTickets] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState("");
  const [alertComment, setAlertComment] = useState("");
  const [onBreak, setOnBreak] = useState(false);

  const handleAddTickets = () => {
    if (!ticketInput.trim()) return;
    const newTickets = ticketInput.split("\n").filter(t => t.trim() !== "");
    setTickets([...tickets, ...newTickets]);
    setTicketInput("");
  };

  const handleEndShift = () => {
    setShiftStarted(false);
    setSelectedAgent(null);
    setTickets([]);
    setOnBreak(false);
  };

  return (
    <div style={styles.container}>
      {!selectedAgent ? (
        <>
          <h1 style={styles.title}>Select Your Name</h1>
          <div style={styles.grid}>
            {agents.map((agent, index) => (
              <button
                key={index}
                style={styles.button}
                onClick={() => setSelectedAgent(agent)}
              >
                {agent}
              </button>
            ))}
          </div>
        </>
      ) : !shiftStarted ? (
        <div>
          <h1 style={styles.title}>Welcome, {selectedAgent}</h1>
          <button
            style={styles.startButton}
            onClick={() => setShiftStarted(true)}
          >
            Start Shift
          </button>
        </div>
      ) : (
        <div style={styles.dashboard}>
          <h2>Shift Dashboard - {selectedAgent}</h2>

          {/* Ticket Section */}
          <div style={styles.section}>
            <h3>Tickets Triaged: {tickets.length}</h3>
            <textarea
              rows="4"
              placeholder="Paste ticket numbers (one per line)"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              style={styles.textarea}
            />
            <button style={styles.smallButton} onClick={handleAddTickets}>
              Add Tickets
            </button>
          </div>

          {/* Alerts Section */}
          <div style={styles.section}>
            <h3>Alerts</h3>
            <select
              value={selectedAlert}
              onChange={(e) => setSelectedAlert(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Alert</option>
              {alertOptions.map((alert, index) => (
                <option key={index} value={alert}>
                  {alert}
                </option>
              ))}
            </select>

            {selectedAlert && (
              <textarea
                rows="3"
                placeholder="Add alert details..."
                value={alertComment}
                onChange={(e) => setAlertComment(e.target.value)}
                style={styles.textarea}
              />
            )}
          </div>

          {/* Monitor Section */}
          <div style={styles.section}>
            <h3>Monitors</h3>
            <input type="text" placeholder="Monitor details..." style={styles.input} />
          </div>

          {/* Incident Section */}
          <div style={styles.section}>
            <h3>Incident / Status</h3>
            <input type="text" placeholder="Incident update..." style={styles.input} />
          </div>

          {/* Adhoc Section */}
          <div style={styles.section}>
            <h3>Adhoc Tasks</h3>
            <input type="text" placeholder="Adhoc task..." style={styles.input} />
          </div>

          {/* Break & End Shift */}
          <div style={styles.bottomSection}>
            <button
              style={onBreak ? styles.breakActive : styles.breakButton}
              onClick={() => setOnBreak(!onBreak)}
            >
              {onBreak ? "End Break" : "Take Break"}
            </button>

            <button style={styles.endButton} onClick={handleEndShift}>
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
    backgroundColor: "#f4f6f9",
  },
  title: {
    fontSize: "28px",
    marginBottom: "20px",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 200px)",
    gap: "15px",
    justifyContent: "center",
  },
  button: {
    padding: "12px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  startButton: {
    padding: "12px 20px",
    backgroundColor: "green",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  dashboard: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  section: {
    marginBottom: "25px",
    padding: "15px",
    backgroundColor: "white",
    borderRadius: "8px",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    marginTop: "10px",
  },
  input: {
    width: "100%",
    padding: "8px",
    marginTop: "10px",
  },
  smallButton: {
    marginTop: "10px",
    padding: "8px 15px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  bottomSection: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "30px",
  },
  breakButton: {
    padding: "10px 20px",
    backgroundColor: "orange",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  breakActive: {
    padding: "10px 20px",
    backgroundColor: "red",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  endButton: {
    padding: "10px 20px",
    backgroundColor: "black",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default App;
