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
  const API = api || "http://192.168.74.152:5000";

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
    if (!name) return;
    try {
      setAdding(true);
      setError(null);
      const res = await fetch(`${API}/manager/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: newEmail.trim() }),
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
  const s = {
    root: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
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
      fontSize: 22,
      fontWeight: 700,
      color: "#1e293b",
      margin: 0,
    },
    refreshBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "8px 16px",
      background: "none",
      border: "1.5px solid #e2e8f0",
      borderRadius: 8,
      cursor: "pointer",
      color: "#475569",
      fontSize: 13,
      fontWeight: 500,
      transition: "all .15s",
    },

    /* add-user card */
    addCard: {
      background: "#f8fafc",
      border: "1.5px solid #e2e8f0",
      borderRadius: 12,
      padding: "20px 24px",
      marginBottom: 24,
    },
    addTitle: {
      fontSize: 14,
      fontWeight: 600,
      color: "#374151",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    addRow: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    },
    input: {
      flex: 1,
      minWidth: 200,
      padding: "10px 14px",
      border: "1.5px solid #cbd5e1",
      borderRadius: 8,
      fontSize: 14,
      color: "#1e293b",
      background: "#fff",
      outline: "none",
      transition: "border-color .15s",
    },
    addBtn: {
      padding: "10px 22px",
      background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap",
      opacity: 1,
      transition: "opacity .15s",
    },
    addBtnDisabled: {
      opacity: 0.55,
      cursor: "not-allowed",
    },
    hint: {
      fontSize: 12,
      color: "#94a3b8",
      marginTop: 8,
    },

    /* feedback banners */
    errorBanner: {
      padding: "12px 16px",
      background: "#fee2e2",
      color: "#dc2626",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    successBanner: {
      padding: "12px 16px",
      background: "#dcfce7",
      color: "#16a34a",
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 16,
      display: "flex",
      alignItems: "center",
      gap: 8,
    },

    /* table */
    tableWrap: {
      overflowX: "auto",
      borderRadius: 12,
      border: "1.5px solid #e2e8f0",
      background: "#fff",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 13.5,
    },
    th: {
      padding: "12px 16px",
      textAlign: "left",
      fontWeight: 600,
      color: "#64748b",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      background: "#f8fafc",
      borderBottom: "1.5px solid #e2e8f0",
    },
    td: {
      padding: "13px 16px",
      borderBottom: "1px solid #f1f5f9",
      color: "#334155",
      verticalAlign: "middle",
    },
    mono: {
      fontFamily: "monospace",
      fontSize: 12,
      background: "#f1f5f9",
      padding: "3px 6px",
      borderRadius: 4,
      color: "#475569",
      letterSpacing: "0.02em",
    },
    activePill: {
      display: "inline-block",
      padding: "3px 10px",
      background: "#dcfce7",
      color: "#15803d",
      borderRadius: 20,
      fontWeight: 600,
      fontSize: 12,
    },
    offlinePill: {
      display: "inline-block",
      padding: "3px 10px",
      background: "#f1f5f9",
      color: "#64748b",
      borderRadius: 20,
      fontWeight: 600,
      fontSize: 12,
    },
    deleteBtn: {
      padding: "6px 14px",
      background: "#fff",
      color: "#dc2626",
      border: "1.5px solid #fca5a5",
      borderRadius: 7,
      cursor: "pointer",
      fontSize: 13,
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      gap: 5,
      transition: "all .15s",
    },

    /* empty / spinner */
    empty: {
      textAlign: "center",
      padding: "48px 24px",
      color: "#94a3b8",
      fontSize: 14,
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
      background: "rgba(15,23,42,.45)",
      backdropFilter: "blur(3px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    dialog: {
      background: "#fff",
      borderRadius: 14,
      padding: "32px 36px",
      maxWidth: 420,
      width: "90%",
      boxShadow: "0 25px 60px rgba(0,0,0,.2)",
      textAlign: "center",
    },
    dialogIcon: {
      fontSize: 40,
      marginBottom: 12,
    },
    dialogTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: "#1e293b",
      marginBottom: 8,
    },
    dialogBody: {
      fontSize: 14,
      color: "#64748b",
      marginBottom: 24,
      lineHeight: 1.6,
    },
    dialogActions: {
      display: "flex",
      gap: 10,
      justifyContent: "center",
    },
    cancelBtn: {
      padding: "10px 24px",
      background: "#f1f5f9",
      color: "#475569",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 14,
    },
    confirmDeleteBtn: {
      padding: "10px 24px",
      background: "#dc2626",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 14,
      opacity: 1,
    },
  };

  const Spinner = () => (
    <div style={s.spinnerWrap}>
      <div style={{
        width: 32, height: 32,
        border: "3px solid #e5e7eb",
        borderTop: "3px solid #7c3aed",
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
            placeholder="Agent name (e.g. Priya)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
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
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                >
                  <td style={s.td}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{u.name}</span>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{u.email}</div>
                  </td>
                  <td style={s.td}>
                    <span style={s.mono} title={u.id}>{u.id.substring(0, 8)}…</span>
                  </td>
                  <td style={s.td}>
                    {u.is_active
                      ? <span style={s.activePill}>● Active</span>
                      : <span style={s.offlinePill}>○ Offline</span>}
                  </td>
                  <td style={s.td}>{u.total_shifts ?? "—"}</td>
                  <td style={{ ...s.td, color: "#64748b", fontSize: 12 }}>
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
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