import { useState, useEffect, useCallback } from "react";

/**
 * UserManagement — standalone component for the Manager Dashboard.
 * Lets the manager view all registered agents, add new ones (name only –
 * the backend generates the UUID), and delete agents who have no active shift.
 *
 * Props:
 *   api  — base URL string, e.g. "http://192.168.74.152:5000"
 */
function UserManagement({ api }) {
  const API = api || "https://alerttracker-ayfwbqbcbvbmh4g3.westeurope-01.azurewebsites.net";


  /* ─── state ─────────────────────────────────────────────────────────────── */
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(null);

  // new-user form
  const [newName, setNewName]     = useState("");
  const [newEmail, setNewEmail]   = useState("");
  const [adding, setAdding]       = useState(false);

  // confirm-delete dialog
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, name }
  const [deleting, setDeleting]   = useState(false);

  /* ─── helpers ───────────────────────────────────────────────────────────── */
  const flash = (setter, msg, ms = 3000) => {
    setter(msg);
    setTimeout(() => setter(null), ms);
  };

  /* ─── fetch user list ────────────────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/manager/users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setUsers(d.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ─── add user ───────────────────────────────────────────────────────────── */
  const handleAdd = async () => {
    const name = newName.trim();
    const email = newEmail.trim();
    if (!name) return;
    if (!email) return;
    try {
      setAdding(true);
      setError(null);
      const res = await fetch(`${API}/manager/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      setNewName("");
      setNewEmail("");
      flash(setSuccess, `✅ Agent "${d.user.name}" created (ID: ${d.user.id.substring(0, 8)}…)`);
      fetchUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  /* ─── delete user ────────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      setDeleting(true);
      setError(null);
      const res = await fetch(`${API}/manager/users/${confirmTarget.id}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      setConfirmTarget(null);
      flash(setSuccess, `🗑️ Agent "${confirmTarget.name}" removed.`);
      fetchUsers();
    } catch (e) {
      setError(e.message);
      setConfirmTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  /* ─── styles (self-contained, matches manager dashboard palette) ─────────── */
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
    greenText:    "#3fb950",
    greenFaint:   "rgba(35,134,54,0.15)",
    greenBorder:  "rgba(35,134,54,0.3)",
    redText:      "#f85149",
    redFaint:     "rgba(218,54,51,0.12)",
    redBorder:    "rgba(218,54,51,0.3)",
    indigoFaint:  "rgba(99,102,241,0.12)",
    indigoBorder: "rgba(99,102,241,0.3)",
  };

  const s = {
    root: {
      fontFamily: "'Inter', sans-serif",
      backgroundColor: C.bg,
      minHeight: "100vh",
      padding: "28px 32px",
      maxWidth: 1400,
      margin: "0 auto",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
      flexWrap: "wrap",
      gap: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: 700,
      color: C.ink,
      margin: 0,
      letterSpacing: "-0.01em",
    },
    refreshBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "7px 16px",
      background: "transparent",
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      cursor: "pointer",
      color: C.inkMid,
      fontSize: 12,
      fontWeight: 500,
      transition: "all .15s",
    },

    /* add-user card */
    addCard: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: "20px 24px",
      marginBottom: 24,
    },
    addTitle: {
      fontSize: 13,
      fontWeight: 600,
      color: C.ink,
      marginBottom: 14,
      display: "flex",
      alignItems: "center",
      gap: 8,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
    addRow: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    },
    input: {
      flex: 1,
      minWidth: 200,
      padding: "8px 12px",
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      fontSize: 13,
      color: C.ink,
      background: C.bgAlt,
      outline: "none",
      transition: "border-color .15s",
    },
    addBtn: {
      padding: "8px 16px",
      background: C.accent,
      color: "#fff",
      border: "none",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer",
      whiteSpace: "nowrap",
      opacity: 1,
      transition: "background .15s",
    },
    addBtnDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
      background: C.border,
    },
    hint: {
      fontSize: 11,
      color: C.inkLight,
      marginTop: 8,
      fontStyle: "italic",
    },

    /* feedback banners */
    errorBanner: {
      padding: "12px 16px",
      background: C.redFaint,
      color: C.redText,
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 8,
      border: `1px solid ${C.redBorder}`,
    },
    successBanner: {
      padding: "12px 16px",
      background: C.greenFaint,
      color: C.greenText,
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 8,
      border: `1px solid ${C.greenBorder}`,
    },

    /* table */
    tableWrap: {
      overflowX: "auto",
      borderRadius: 10,
      border: `1px solid ${C.border}`,
      background: C.surface,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13,
    },
    th: {
      padding: "10px 16px",
      textAlign: "left",
      fontWeight: 600,
      color: C.inkLight,
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      background: C.borderLight,
      borderBottom: `1px solid ${C.border}`,
    },
    td: {
      padding: "12px 16px",
      borderBottom: `1px solid ${C.borderLight}`,
      color: C.ink,
      verticalAlign: "middle",
    },
    mono: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
      background: C.bgAlt,
      padding: "4px 8px",
      borderRadius: 4,
      color: C.accentLight,
      letterSpacing: "0.02em",
    },
    activePill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 10px",
      background: C.greenFaint,
      color: C.greenText,
      borderRadius: 999,
      fontWeight: 600,
      fontSize: 11,
      border: `1px solid ${C.greenBorder}`,
    },
    offlinePill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 10px",
      background: C.indigoFaint,
      color: "#818cf8",
      borderRadius: 999,
      fontWeight: 600,
      fontSize: 11,
      border: `1px solid ${C.indigoBorder}`,
    },
    deleteBtn: {
      padding: "6px 14px",
      background: "transparent",
      color: C.redText,
      border: `1px solid ${C.redBorder}`,
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: 5,
      transition: "all .15s",
    },

    /* empty / spinner */
    empty: {
      textAlign: "center",
      padding: "60px 24px",
      color: C.inkLight,
      fontSize: 13,
    },
    spinnerWrap: {
      display: "flex",
      justifyContent: "center",
      padding: 40,
    },

    /* confirm dialog overlay */
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.72)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    dialog: {
      background: C.surface,
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      padding: "28px 28px",
      maxWidth: 420,
      width: "90%",
      boxShadow: "0 24px 56px rgba(0,0,0,0.7)",
      textAlign: "center",
    },
    dialogIcon: {
      fontSize: 40,
      marginBottom: 12,
    },
    dialogTitle: {
      fontSize: 16,
      fontWeight: 700,
      color: C.ink,
      marginBottom: 8,
    },
    dialogBody: {
      fontSize: 13,
      color: C.inkMid,
      marginBottom: 24,
      lineHeight: 1.6,
    },
    dialogActions: {
      display: "flex",
      gap: 10,
      justifyContent: "center",
    },
    cancelBtn: {
      padding: "8px 20px",
      background: "transparent",
      color: C.inkMid,
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      cursor: "pointer",
      fontWeight: 500,
      fontSize: 12,
      transition: "all .15s",
    },
    confirmDeleteBtn: {
      padding: "8px 20px",
      background: C.redText,
      color: "#fff",
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
      fontWeight: 500,
      fontSize: 12,
      opacity: 1,
      transition: "background .15s",
    },
  };

  const Spinner = () => (
    <div style={s.spinnerWrap}>
      <div style={{
        width: 26, height: 26,
        border: `2px solid ${C.borderLight}`,
        borderTop: `2px solid ${C.accentLight}`,
        borderRadius: "50%",
        animation: "umSpin .8s linear infinite",
      }} />
      <style>{`@keyframes umSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ─── render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={s.root}>

      {/* Header */}
      <div style={s.header}>
        <h2 style={s.title}>👥 User Management</h2>
        <button
          style={s.refreshBtn}
          onClick={fetchUsers}
          disabled={loading}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Add new user */}
      <div style={s.addCard}>
        <div style={s.addTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
          </svg>
          Add New Agent
        </div>
        <div style={s.addRow}>
          <input
            style={s.input}
            type="text"
            placeholder="Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            maxLength={80}
          />
          <input
            style={s.input}
            type="email"
            placeholder="Email address"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          <button
            style={{ ...s.addBtn, ...(adding || !newName.trim() ? s.addBtnDisabled : {}) }}
            onClick={handleAdd}
            disabled={adding || !newName.trim() || !newEmail.trim()}
          >
            {adding ? "Creating…" : "＋ Create Agent"}
          </button>
        </div>
        <p style={s.hint}>A unique UUID is auto-generated by the server — no ID entry needed.</p>
      </div>

      {/* Feedback banners */}
      {error   && <div style={s.errorBanner}>⚠️ {error}</div>}
      {success && <div style={s.successBanner}>{success}</div>}

      {/* Users table */}
      {loading && !users.length ? (
        <Spinner />
      ) : users.length === 0 ? (
        <div style={s.empty}>No agents registered yet. Add the first one above.</div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Name", "Agent ID", "Status", "Total Shifts", "Created", "Action"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#1c2230"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                >
                  <td style={s.td}>
                    <span style={{ fontWeight: 500, color: C.ink }}>{u.name}</span>
                    <div style={{ fontSize: 11, color: C.inkMid, marginTop: 2 }}>{u.email}</div>
                  </td>
                  <td style={s.td}>
                    <span style={s.mono} title={u.id}>{u.id.substring(0, 8)}…</span>
                  </td>
                  <td style={s.td}>
                    {u.is_active
                      ? <span style={s.activePill}>
                          <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: C.greenText }}></span>
                          Active
                        </span>
                      : <span style={s.offlinePill}>
                          <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#818cf8" }}></span>
                          Offline
                        </span>}
                  </td>
                  <td style={s.td}>{u.total_shifts ?? "—"}</td>
                  <td style={{ ...s.td, color: C.inkMid, fontSize: 12 }}>
                    {u.created_at
                      ? new Date(u.created_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td style={s.td}>
                    <button
                      style={s.deleteBtn}
                      onClick={() => setConfirmTarget({ id: u.id, name: u.name })}
                      disabled={u.is_active}
                      title={u.is_active ? "Cannot delete an agent with an active shift" : "Delete agent"}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                      {u.is_active ? "In Shift" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm-delete dialog */}
      {confirmTarget && (
        <div style={s.overlay} onClick={() => setConfirmTarget(null)}>
          <div style={s.dialog} onClick={e => e.stopPropagation()}>
            <div style={s.dialogIcon}>🗑️</div>
            <div style={s.dialogTitle}>Delete Agent?</div>
            <div style={s.dialogBody}>
              You're about to permanently delete <strong>{confirmTarget.name}</strong>.
              Their historical shift data will be preserved, but they will no longer be able to log in.
            </div>
            <div style={s.dialogActions}>
              <button style={s.cancelBtn} onClick={() => setConfirmTarget(null)}>
                Cancel
              </button>
              <button
                style={{ ...s.confirmDeleteBtn, ...(deleting ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default UserManagement;