import { useState, useEffect, useCallback } from "react";
import { managerStyles as styles } from "./mngr_styles";
import AdvancedAnalytics from "./Advancedanalyticis";

function ManagerDashboard() {
  const API = "http://192.168.74.152:5000";

  const [activeView, setActiveView] = useState("overview");
  const [activeAgents, setActiveAgents] = useState([]);
  const [allShifts, setAllShifts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentStats, setAgentStats] = useState(null);
  const [shiftDetails, setShiftDetails] = useState(null);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", agentId: "" });
  const [loading, setLoading] = useState({
    activeAgents: false, shifts: false, analytics: false,
    advancedAnalytics: false, agentStats: false, shiftDetails: false,
  });
  const [errors, setErrors] = useState({});

  // ─── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchActiveAgents = useCallback(async () => {
    try {
      setLoading(p => ({ ...p, activeAgents: true }));
      setErrors(p => ({ ...p, activeAgents: null }));
      const res = await fetch(`${API}/manager/active-agents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setActiveAgents(d.active_agents || []);
    } catch (e) {
      setErrors(p => ({ ...p, activeAgents: e.message }));
      setActiveAgents([]);
    } finally {
      setLoading(p => ({ ...p, activeAgents: false }));
    }
  }, [API]);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(p => ({ ...p, shifts: true }));
      setErrors(p => ({ ...p, shifts: null }));
      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.agentId) params.append("agent_id", filters.agentId);
      const res = await fetch(`${API}/manager/shifts?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setAllShifts(d.shifts || []);
    } catch (e) {
      setErrors(p => ({ ...p, shifts: e.message }));
      setAllShifts([]);
    } finally {
      setLoading(p => ({ ...p, shifts: false }));
    }
  }, [API, filters]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(p => ({ ...p, analytics: true }));
      setErrors(p => ({ ...p, analytics: null }));
      const res = await fetch(`${API}/manager/analytics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAnalytics(await res.json());
    } catch (e) {
      setErrors(p => ({ ...p, analytics: e.message }));
    } finally {
      setLoading(p => ({ ...p, analytics: false }));
    }
  }, [API]);

  const fetchAdvancedAnalytics = useCallback(async () => {
    try {
      setLoading(p => ({ ...p, advancedAnalytics: true }));
      setErrors(p => ({ ...p, advancedAnalytics: null }));
      const res = await fetch(`${API}/manager/advanced-analytics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAdvancedAnalytics(await res.json());
    } catch (e) {
      setErrors(p => ({ ...p, advancedAnalytics: e.message }));
    } finally {
      setLoading(p => ({ ...p, advancedAnalytics: false }));
    }
  }, [API]);

  const fetchAgentStats = useCallback(async (agentId) => {
    try {
      setLoading(p => ({ ...p, agentStats: true }));
      setErrors(p => ({ ...p, agentStats: null }));
      const res = await fetch(`${API}/manager/agent-stats/${agentId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setAgentStats(d);
      setSelectedAgent(agentId);
    } catch (e) {
      setErrors(p => ({ ...p, agentStats: e.message }));
    } finally {
      setLoading(p => ({ ...p, agentStats: false }));
    }
  }, [API]);

  const fetchShiftDetails = useCallback(async (shiftId) => {
    try {
      setLoading(p => ({ ...p, shiftDetails: true }));
      setErrors(p => ({ ...p, shiftDetails: null }));
      const res = await fetch(`${API}/manager/shift-details/${shiftId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setShiftDetails(await res.json());
    } catch (e) {
      setErrors(p => ({ ...p, shiftDetails: e.message }));
    } finally {
      setLoading(p => ({ ...p, shiftDetails: false }));
    }
  }, [API]);

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchActiveAgents();
    fetchAnalytics();
    const iv = setInterval(() => {
      fetchActiveAgents();
      fetchAnalytics();
      if (activeView === "analytics") fetchAdvancedAnalytics();
    }, 30000);
    return () => clearInterval(iv);
  }, [fetchActiveAgents, fetchAnalytics, fetchAdvancedAnalytics, activeView]);

  useEffect(() => {
    if (activeView === "shifts") fetchShifts();
  }, [filters, activeView, fetchShifts]);

  useEffect(() => {
    if (activeView === "analytics" && !advancedAnalytics) fetchAdvancedAnalytics();
  }, [activeView, advancedAnalytics, fetchAdvancedAnalytics]);

  // ─── Formatters ─────────────────────────────────────────────────────────────

  const formatDuration = (hours) => {
    if (!hours || hours < 0) return "0h 0m";
    return `${Math.floor(hours)}h ${Math.round((hours - Math.floor(hours)) * 60)}m`;
  };

  const formatDate = (s) => {
    if (!s) return "N/A";
    try { return new Date(s).toLocaleString(); } catch { return "Invalid date"; }
  };

  // ─── Inline utility components ───────────────────────────────────────────────

  const ErrorBanner = ({ message }) => (
    <div style={{ padding: 16, backgroundColor: "#fee2e2", color: "#dc2626", borderRadius: 8, marginBottom: 16 }}>
      ⚠️ {message}
    </div>
  );

  const Spinner = () => (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div style={{
        width: 36, height: 36, border: "3px solid #e5e7eb",
        borderTop: "3px solid #7c3aed", borderRadius: "50%",
        animation: "mgrSpin 0.9s linear infinite",
      }} />
      <style>{`@keyframes mgrSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const EmptyState = ({ msg = "No data available" }) => (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#94a3b8", fontSize: 15 }}>{msg}</div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Manager Dashboard</h1>
          <p style={styles.headerSubtitle}>Real-time monitoring & advanced analytics</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.refreshIndicator}>
            <div style={styles.refreshDot} />
            Auto-refresh: ON
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.navTabs}>
        {[
          { id: "overview",  label: "📊 Overview" },
          { id: "active",    label: `🟢 Active Agents (${activeAgents.length})` },
          { id: "shifts",    label: "📋 All Shifts" },
          { id: "analytics", label: "📈 Advanced Analytics" },
        ].map(tab => (
          <button
            key={tab.id}
            style={{ ...styles.navTab, ...(activeView === tab.id ? styles.navTabActive : {}) }}
            onClick={() => setActiveView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area — analytics tab gets full bleed, rest gets normal padding */}
      <div style={activeView === "analytics" ? { ...styles.content, padding: 0, maxWidth: "none" } : styles.content}>

        {/* ══ OVERVIEW ══ */}
        {activeView === "overview" && (
          <div>
            {errors.analytics && <ErrorBanner message={errors.analytics} />}
            {loading.analytics && !analytics ? <Spinner /> : analytics ? (
              <>
                <h2 style={styles.sectionTitle}>Today's Overview</h2>
                <div style={styles.statsGrid}>
                  {[
                    { icon: "🟢", val: analytics.active_now || 0,                   label: "Active Now" },
                    { icon: "👥", val: analytics.today?.agents_active || 0,          label: "Agents Today" },
                    { icon: "📊", val: analytics.today?.cases_triaged || 0,          label: "Cases Triaged" },
                    { icon: "⚡", val: analytics.avg_productivity || 0,              label: "Avg Cases/Hour" },
                  ].map(s => (
                    <div key={s.label} style={styles.statCard}>
                      <div style={styles.statIcon}>{s.icon}</div>
                      <div style={styles.statValue}>{s.val}</div>
                      <div style={styles.statLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <h2 style={styles.sectionTitle}>This Week</h2>
                <div style={styles.statsGrid}>
                  {[
                    { icon: "👥", val: analytics.week?.agents_active || 0,  label: "Active Agents" },
                    { icon: "📋", val: analytics.week?.total_shifts || 0,   label: "Total Shifts" },
                    { icon: "✅", val: analytics.week?.cases_triaged || 0,  label: "Cases Triaged" },
                    { icon: "🚨", val: analytics.alerts_today || 0,         label: "Alerts Today" },
                  ].map(s => (
                    <div key={s.label} style={styles.statCard}>
                      <div style={styles.statIcon}>{s.icon}</div>
                      <div style={styles.statValue}>{s.val}</div>
                      <div style={styles.statLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <h2 style={styles.sectionTitle}>This Month</h2>
                <div style={styles.statsGrid}>
                  {[
                    { icon: "👥", val: analytics.month?.agents_active || 0, label: "Active Agents" },
                    { icon: "📋", val: analytics.month?.total_shifts || 0,  label: "Total Shifts" },
                    { icon: "✅", val: analytics.month?.cases_triaged || 0, label: "Cases Triaged" },
                    { icon: "🎫", val: analytics.tickets_today || 0,        label: "Tickets Today" },
                  ].map(s => (
                    <div key={s.label} style={styles.statCard}>
                      <div style={styles.statIcon}>{s.icon}</div>
                      <div style={styles.statValue}>{s.val}</div>
                      <div style={styles.statLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : <EmptyState msg="No analytics data available" />}
          </div>
        )}

        {/* ══ ACTIVE AGENTS ══ */}
        {activeView === "active" && (
          <div>
            <h2 style={styles.sectionTitle}>Currently Active Agents</h2>
            {errors.activeAgents && <ErrorBanner message={errors.activeAgents} />}
            {loading.activeAgents && !activeAgents.length ? <Spinner /> : activeAgents.length > 0 ? (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Agent ID","Login Time","Hours Active","Cases Triaged","Actions"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeAgents.map(agent => (
                      <tr key={agent.shift_id} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                            {agent.agent_id?.substring(0, 10) || "Unknown"}…
                          </span>
                        </td>
                        <td style={styles.td}>{formatDate(agent.login_time)}</td>
                        <td style={styles.td}>
                          <span style={styles.activeStatus}>{formatDuration(agent.hours_active)}</span>
                        </td>
                        <td style={styles.td}>{agent.triaged_count || 0}</td>
                        <td style={styles.td}>
                          <button style={styles.actionButton} onClick={() => fetchAgentStats(agent.agent_id)}>
                            View Stats
                          </button>
                          <button
                            style={{ ...styles.actionButton, marginLeft: 8, backgroundColor: "#4338ca" }}
                            onClick={() => fetchShiftDetails(agent.shift_id)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState msg="No active agents at the moment" />}
          </div>
        )}

        {/* ══ ALL SHIFTS ══ */}
        {activeView === "shifts" && (
          <div>
            <h2 style={styles.sectionTitle}>All Shifts</h2>

            <div style={styles.filtersBar}>
              <input type="date" style={styles.filterInput} value={filters.startDate}
                onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
              <input type="date" style={styles.filterInput} value={filters.endDate}
                onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
              <input type="text" style={styles.filterInput} value={filters.agentId}
                onChange={e => setFilters(f => ({ ...f, agentId: e.target.value }))}
                placeholder="Filter by Agent ID" />
              <button style={styles.clearFiltersButton}
                onClick={() => setFilters({ startDate: "", endDate: "", agentId: "" })}>
                Clear Filters
              </button>
            </div>

            {errors.shifts && <ErrorBanner message={errors.shifts} />}
            {loading.shifts && !allShifts.length ? <Spinner /> : allShifts.length > 0 ? (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["Agent ID","Login Time","Logout Time","Duration","Cases Triaged","Status","Actions"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allShifts.map(shift => (
                      <tr key={shift.id} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                            {shift.agent_id?.substring(0, 10) || "Unknown"}…
                          </span>
                        </td>
                        <td style={styles.td}>{formatDate(shift.login_time)}</td>
                        <td style={styles.td}>{shift.logout_time ? formatDate(shift.logout_time) : "—"}</td>
                        <td style={styles.td}>{formatDuration(shift.duration_hours)}</td>
                        <td style={styles.td}>{shift.triaged_count || 0}</td>
                        <td style={styles.td}>
                          <span style={shift.logout_time ? styles.completedStatus : styles.activeStatus}>
                            {shift.logout_time ? "Completed" : "Active"}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <button style={styles.actionButton} onClick={() => fetchShiftDetails(shift.id)}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState msg="No shifts found. Try adjusting the filters." />}
          </div>
        )}

        {/* ══ ADVANCED ANALYTICS — delegated to AdvancedAnalytics component ══ */}
        {activeView === "analytics" && (
          <AdvancedAnalytics
            data={advancedAnalytics}
            loading={loading.advancedAnalytics}
            error={errors.advancedAnalytics}
            onRefresh={fetchAdvancedAnalytics}
          />
        )}
      </div>

      {/* ══ SHIFT DETAILS MODAL ══ */}
      {shiftDetails && (
        <div style={styles.modalOverlay} onClick={() => setShiftDetails(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Shift Details</h2>
              <button style={styles.modalClose} onClick={() => setShiftDetails(null)}>×</button>
            </div>
            <div style={styles.modalBody}>
              {loading.shiftDetails ? <Spinner /> : errors.shiftDetails ? (
                <ErrorBanner message={errors.shiftDetails} />
              ) : (
                <>
                  <div style={styles.modalSection}><strong>Agent:</strong> {shiftDetails.agent_id}</div>
                  <div style={styles.modalSection}><strong>Start:</strong> {formatDate(shiftDetails.login_time)}</div>
                  {shiftDetails.logout_time && (
                    <div style={styles.modalSection}><strong>End:</strong> {formatDate(shiftDetails.logout_time)}</div>
                  )}
                  <div style={styles.modalSection}><strong>Triaged Cases:</strong> {shiftDetails.triaged_count || 0}</div>

                  {shiftDetails.tickets?.length > 0 && (
                    <div style={styles.modalSection}>
                      <h3 style={styles.modalSectionTitle}>Tickets ({shiftDetails.tickets.length})</h3>
                      {shiftDetails.tickets.map((t, i) => (
                        <div key={i} style={styles.modalItem}>
                          <strong>#{t.number}</strong> — {t.description || "No description"}
                        </div>
                      ))}
                    </div>
                  )}
                  {shiftDetails.alerts?.length > 0 && (
                    <div style={styles.modalSection}>
                      <h3 style={styles.modalSectionTitle}>Alerts ({shiftDetails.alerts.length})</h3>
                      {shiftDetails.alerts.map((a, i) => (
                        <div key={i} style={styles.modalItem}>
                          <strong>{a.monitor}</strong> — {a.type}
                          {a.comment && <div style={styles.modalItemDesc}>{a.comment}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {shiftDetails.incidents?.length > 0 && (
                    <div style={styles.modalSection}>
                      <h3 style={styles.modalSectionTitle}>Incidents ({shiftDetails.incidents.length})</h3>
                      {shiftDetails.incidents.map((inc, i) => (
                        <div key={i} style={styles.modalItem}>{inc.description}</div>
                      ))}
                    </div>
                  )}
                  {shiftDetails.adhoc_tasks?.length > 0 && (
                    <div style={styles.modalSection}>
                      <h3 style={styles.modalSectionTitle}>Ad-hoc Tasks ({shiftDetails.adhoc_tasks.length})</h3>
                      {shiftDetails.adhoc_tasks.map((t, i) => (
                        <div key={i} style={styles.modalItem}>{t.task}</div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ AGENT STATS MODAL ══ */}
      {agentStats && selectedAgent && (
        <div style={styles.modalOverlay} onClick={() => { setAgentStats(null); setSelectedAgent(null); }}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Agent Statistics</h2>
              <button style={styles.modalClose} onClick={() => { setAgentStats(null); setSelectedAgent(null); }}>×</button>
            </div>
            <div style={styles.modalBody}>
              {loading.agentStats ? <Spinner /> : errors.agentStats ? (
                <ErrorBanner message={errors.agentStats} />
              ) : (
                <>
                  <div style={styles.modalSection}><strong>Agent ID:</strong> {agentStats.agent_id}</div>
                  <div style={styles.modalSection}><strong>Total Shifts:</strong> {agentStats.total_shifts || 0}</div>
                  <div style={styles.modalSection}><strong>Total Cases Triaged:</strong> {agentStats.total_triaged || 0}</div>
                  <div style={styles.modalSection}><strong>Average Per Shift:</strong> {agentStats.avg_per_shift || 0}</div>

                  {agentStats.recent_shifts?.length > 0 && (
                    <div style={styles.modalSection}>
                      <h3 style={styles.modalSectionTitle}>Recent Shifts</h3>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            {["Login","Duration","Triaged"].map(h => <th key={h} style={styles.th}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {agentStats.recent_shifts.map(s => (
                            <tr key={s.id} style={styles.tr}>
                              <td style={styles.td}>{formatDate(s.login_time)}</td>
                              <td style={styles.td}>{formatDuration(s.duration_hours)}</td>
                              <td style={styles.td}>{s.triaged_count || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ManagerDashboard;