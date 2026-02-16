import { useState, useEffect, useCallback } from "react";
import { managerStyles as styles } from "./mngr_styles";

function ManagerDashboard() {
  const API = "http://192.168.74.152:5000";  // Unified backend on port 5000

  const [activeView, setActiveView] = useState("overview");
  const [activeAgents, setActiveAgents] = useState([]);
  const [allShifts, setAllShifts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentStats, setAgentStats] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftDetails, setShiftDetails] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    agentId: ""
  });
  const [loading, setLoading] = useState({
    activeAgents: false,
    shifts: false,
    analytics: false,
    advancedAnalytics: false,
    agentStats: false,
    shiftDetails: false
  });
  const [errors, setErrors] = useState({});

  // Fetch active agents with error handling
  const fetchActiveAgents = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, activeAgents: true }));
      setErrors(prev => ({ ...prev, activeAgents: null }));
      
      const response = await fetch(`${API}/manager/active-agents`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setActiveAgents(data.active_agents || []);
    } catch (error) {
      console.error("Error fetching active agents:", error);
      setErrors(prev => ({ ...prev, activeAgents: error.message }));
      setActiveAgents([]);
    } finally {
      setLoading(prev => ({ ...prev, activeAgents: false }));
    }
  }, [API]);

  // Fetch all shifts with error handling
  const fetchShifts = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, shifts: true }));
      setErrors(prev => ({ ...prev, shifts: null }));
      
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.agentId) params.append('agent_id', filters.agentId);

      const response = await fetch(`${API}/manager/shifts?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAllShifts(data.shifts || []);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      setErrors(prev => ({ ...prev, shifts: error.message }));
      setAllShifts([]);
    } finally {
      setLoading(prev => ({ ...prev, shifts: false }));
    }
  }, [API, filters]);

  // Fetch analytics with error handling
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, analytics: true }));
      setErrors(prev => ({ ...prev, analytics: null }));
      
      const response = await fetch(`${API}/manager/analytics`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setErrors(prev => ({ ...prev, analytics: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, analytics: false }));
    }
  }, [API]);

  // Fetch advanced analytics with error handling
  const fetchAdvancedAnalytics = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, advancedAnalytics: true }));
      setErrors(prev => ({ ...prev, advancedAnalytics: null }));
      
      const response = await fetch(`${API}/manager/advanced-analytics`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAdvancedAnalytics(data);
    } catch (error) {
      console.error("Error fetching advanced analytics:", error);
      setErrors(prev => ({ ...prev, advancedAnalytics: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, advancedAnalytics: false }));
    }
  }, [API]);

  // Fetch agent stats with error handling
  const fetchAgentStats = useCallback(async (agentId) => {
    try {
      setLoading(prev => ({ ...prev, agentStats: true }));
      setErrors(prev => ({ ...prev, agentStats: null }));
      
      const response = await fetch(`${API}/manager/agent-stats/${agentId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAgentStats(data);
      setSelectedAgent(agentId);
    } catch (error) {
      console.error("Error fetching agent stats:", error);
      setErrors(prev => ({ ...prev, agentStats: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, agentStats: false }));
    }
  }, [API]);

  // Fetch shift details with error handling
  const fetchShiftDetails = useCallback(async (shiftId) => {
    try {
      setLoading(prev => ({ ...prev, shiftDetails: true }));
      setErrors(prev => ({ ...prev, shiftDetails: null }));
      
      const response = await fetch(`${API}/manager/shift-details/${shiftId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setShiftDetails(data);
      setSelectedShift(shiftId);
    } catch (error) {
      console.error("Error fetching shift details:", error);
      setErrors(prev => ({ ...prev, shiftDetails: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, shiftDetails: false }));
    }
  }, [API]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchActiveAgents();
    fetchAnalytics();
    fetchAdvancedAnalytics();
    
    const interval = setInterval(() => {
      fetchActiveAgents();
      fetchAnalytics();
      if (activeView === "analytics") {
        fetchAdvancedAnalytics();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchActiveAgents, fetchAnalytics, fetchAdvancedAnalytics, activeView]);

  // Fetch shifts when filters change
  useEffect(() => {
    if (activeView === "shifts") {
      fetchShifts();
    }
  }, [filters, activeView, fetchShifts]);

  // Fetch advanced analytics when switching to analytics view
  useEffect(() => {
    if (activeView === "analytics" && !advancedAnalytics) {
      fetchAdvancedAnalytics();
    }
  }, [activeView, advancedAnalytics, fetchAdvancedAnalytics]);

  const formatDuration = (hours) => {
    if (!hours || hours < 0) return "0h 0m";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return "Invalid date";
    }
  };

  const getSeverityStyle = (severity) => {
    const severityStyles = {
      success: { backgroundColor: "#dcfce7", color: "#15803d" },
      info: { backgroundColor: "#e0e7ff", color: "#4338ca" },
      warning: { backgroundColor: "#fef3c7", color: "#d97706" },
      error: { backgroundColor: "#fee2e2", color: "#dc2626" }
    };
    return severityStyles[severity] || severityStyles.info;
  };

  const ErrorMessage = ({ message }) => (
    <div style={{
      padding: "16px",
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      borderRadius: "8px",
      marginBottom: "16px"
    }}>
      ⚠️ Error: {message}
    </div>
  );

  const LoadingSpinner = () => (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "32px"
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        border: "4px solid #e5e7eb",
        borderTop: "4px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

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
            <div style={styles.refreshDot}></div>
            Auto-refresh: ON
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.navTabs}>
        <button
          style={{...styles.navTab, ...(activeView === "overview" ? styles.navTabActive : {})}}
          onClick={() => setActiveView("overview")}
        >
          📊 Overview
        </button>
        <button
          style={{...styles.navTab, ...(activeView === "active" ? styles.navTabActive : {})}}
          onClick={() => setActiveView("active")}
        >
          🟢 Active Agents ({activeAgents.length})
        </button>
        <button
          style={{...styles.navTab, ...(activeView === "shifts" ? styles.navTabActive : {})}}
          onClick={() => setActiveView("shifts")}
        >
          📋 All Shifts
        </button>
        <button
          style={{...styles.navTab, ...(activeView === "analytics" ? styles.navTabActive : {})}}
          onClick={() => setActiveView("analytics")}
        >
          📈 Advanced Analytics
        </button>
      </div>

      <div style={styles.content}>
        {/* OVERVIEW VIEW */}
        {activeView === "overview" && (
          <div>
            {errors.analytics && <ErrorMessage message={errors.analytics} />}
            {loading.analytics && !analytics ? (
              <LoadingSpinner />
            ) : analytics ? (
              <>
                <h2 style={styles.sectionTitle}>Today's Overview</h2>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>🟢</div>
                    <div style={styles.statValue}>{analytics.active_now || 0}</div>
                    <div style={styles.statLabel}>Active Now</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>👥</div>
                    <div style={styles.statValue}>{analytics.today?.agents_active || 0}</div>
                    <div style={styles.statLabel}>Agents Today</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>📊</div>
                    <div style={styles.statValue}>{analytics.today?.cases_triaged || 0}</div>
                    <div style={styles.statLabel}>Cases Triaged</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>⚡</div>
                    <div style={styles.statValue}>{analytics.avg_productivity || 0}</div>
                    <div style={styles.statLabel}>Avg Cases/Hour</div>
                  </div>
                </div>

                <h2 style={styles.sectionTitle}>This Week</h2>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>👥</div>
                    <div style={styles.statValue}>{analytics.week?.agents_active || 0}</div>
                    <div style={styles.statLabel}>Active Agents</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>📋</div>
                    <div style={styles.statValue}>{analytics.week?.total_shifts || 0}</div>
                    <div style={styles.statLabel}>Total Shifts</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>✅</div>
                    <div style={styles.statValue}>{analytics.week?.cases_triaged || 0}</div>
                    <div style={styles.statLabel}>Cases Triaged</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>🚨</div>
                    <div style={styles.statValue}>{analytics.alerts_today || 0}</div>
                    <div style={styles.statLabel}>Alerts Today</div>
                  </div>
                </div>

                <h2 style={styles.sectionTitle}>This Month</h2>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>👥</div>
                    <div style={styles.statValue}>{analytics.month?.agents_active || 0}</div>
                    <div style={styles.statLabel}>Active Agents</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>📋</div>
                    <div style={styles.statValue}>{analytics.month?.total_shifts || 0}</div>
                    <div style={styles.statLabel}>Total Shifts</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>✅</div>
                    <div style={styles.statValue}>{analytics.month?.cases_triaged || 0}</div>
                    <div style={styles.statLabel}>Cases Triaged</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>🎫</div>
                    <div style={styles.statValue}>{analytics.tickets_today || 0}</div>
                    <div style={styles.statLabel}>Tickets Today</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                No analytics data available
              </div>
            )}
          </div>
        )}

        {/* ACTIVE AGENTS VIEW */}
        {activeView === "active" && (
          <div>
            <h2 style={styles.sectionTitle}>Currently Active Agents</h2>
            {errors.activeAgents && <ErrorMessage message={errors.activeAgents} />}
            {loading.activeAgents && activeAgents.length === 0 ? (
              <LoadingSpinner />
            ) : activeAgents.length > 0 ? (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Agent ID</th>
                      <th style={styles.th}>Login Time</th>
                      <th style={styles.th}>Hours Active</th>
                      <th style={styles.th}>Cases Triaged</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAgents.map((agent) => (
                      <tr key={agent.shift_id} style={styles.tr}>
                        <td style={styles.td}>{agent.agent_id?.substring(0, 10) || "Unknown"}...</td>
                        <td style={styles.td}>{formatDate(agent.login_time)}</td>
                        <td style={styles.td}>{formatDuration(agent.hours_active)}</td>
                        <td style={styles.td}>{agent.triaged_count || 0}</td>
                        <td style={styles.td}>
                          <button
                            style={styles.actionButton}
                            onClick={() => fetchAgentStats(agent.agent_id)}
                          >
                            View Stats
                          </button>
                          <button
                            style={{...styles.actionButton, marginLeft: "8px"}}
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
            ) : (
              <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                No active agents at the moment
              </div>
            )}
          </div>
        )}

        {/* ALL SHIFTS VIEW */}
        {activeView === "shifts" && (
          <div>
            <h2 style={styles.sectionTitle}>All Shifts</h2>
            
            {/* Filters */}
            <div style={styles.filterContainer}>
              <input
                type="date"
                style={styles.filterInput}
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                placeholder="Start Date"
              />
              <input
                type="date"
                style={styles.filterInput}
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                placeholder="End Date"
              />
              <input
                type="text"
                style={styles.filterInput}
                value={filters.agentId}
                onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
                placeholder="Agent ID"
              />
              <button
                style={styles.filterButton}
                onClick={() => setFilters({ startDate: "", endDate: "", agentId: "" })}
              >
                Clear Filters
              </button>
            </div>

            {errors.shifts && <ErrorMessage message={errors.shifts} />}
            {loading.shifts && allShifts.length === 0 ? (
              <LoadingSpinner />
            ) : allShifts.length > 0 ? (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Agent ID</th>
                      <th style={styles.th}>Login Time</th>
                      <th style={styles.th}>Logout Time</th>
                      <th style={styles.th}>Duration</th>
                      <th style={styles.th}>Cases Triaged</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allShifts.map((shift) => (
                      <tr key={shift.id} style={styles.tr}>
                        <td style={styles.td}>{shift.agent_id?.substring(0, 10) || "Unknown"}...</td>
                        <td style={styles.td}>{formatDate(shift.login_time)}</td>
                        <td style={styles.td}>
                          {shift.logout_time ? formatDate(shift.logout_time) : "Active"}
                        </td>
                        <td style={styles.td}>{formatDuration(shift.duration_hours)}</td>
                        <td style={styles.td}>{shift.triaged_count || 0}</td>
                        <td style={styles.td}>
                          <button
                            style={styles.actionButton}
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
              <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                No shifts found. Try adjusting the filters.
              </div>
            )}
          </div>
        )}

        {/* ADVANCED ANALYTICS VIEW */}
        {activeView === "analytics" && (
          <div>
            {errors.advancedAnalytics && <ErrorMessage message={errors.advancedAnalytics} />}
            {loading.advancedAnalytics && !advancedAnalytics ? (
              <LoadingSpinner />
            ) : advancedAnalytics ? (
              <>
                {/* Insights */}
                {advancedAnalytics.insights && advancedAnalytics.insights.length > 0 && (
                  <div style={{marginBottom: "32px"}}>
                    <h2 style={styles.sectionTitle}>💡 Key Insights</h2>
                    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px"}}>
                      {advancedAnalytics.insights.map((insight, idx) => (
                        <div key={idx} style={{
                          ...styles.statCard,
                          ...getSeverityStyle(insight.severity),
                          textAlign: "left"
                        }}>
                          <div style={{fontWeight: "600", marginBottom: "8px"}}>{insight.title}</div>
                          <div style={{fontSize: "14px"}}>{insight.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agent Rankings */}
                {advancedAnalytics.agent_rankings && advancedAnalytics.agent_rankings.length > 0 && (
                  <div style={{marginBottom: "32px"}}>
                    <h2 style={styles.sectionTitle}>🏆 Top Performing Agents</h2>
                    <div style={styles.tableContainer}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Rank</th>
                            <th style={styles.th}>Agent ID</th>
                            <th style={styles.th}>Shifts</th>
                            <th style={styles.th}>Total Triaged</th>
                            <th style={styles.th}>Avg/Shift</th>
                            <th style={styles.th}>Cases/Hour</th>
                          </tr>
                        </thead>
                        <tbody>
                          {advancedAnalytics.agent_rankings.map((agent) => (
                            <tr key={agent.agent_id} style={styles.tr}>
                              <td style={styles.td}>
                                <div style={{
                                  display: "inline-block",
                                  width: "24px",
                                  height: "24px",
                                  borderRadius: "50%",
                                  backgroundColor: agent.rank === 1 ? "#fbbf24" : agent.rank === 2 ? "#94a3b8" : agent.rank === 3 ? "#fb923c" : "#e5e7eb",
                                  textAlign: "center",
                                  lineHeight: "24px",
                                  fontWeight: "600"
                                }}>
                                  {agent.rank}
                                </div>
                              </td>
                              <td style={styles.td}>{agent.agent_id?.substring(0, 10) || "Unknown"}...</td>
                              <td style={styles.td}>{agent.shift_count || 0}</td>
                              <td style={styles.td}>{agent.total_triaged || 0}</td>
                              <td style={styles.td}>{agent.avg_triaged || 0}</td>
                              <td style={styles.td}>
                                <strong style={{color: "#059669"}}>{agent.productivity_rate || 0}</strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Shift Duration Stats */}
                {advancedAnalytics.shift_duration_stats && Object.keys(advancedAnalytics.shift_duration_stats).length > 0 && (
                  <div style={{marginBottom: "32px"}}>
                    <h2 style={styles.sectionTitle}>⏱️ Shift Duration Analysis</h2>
                    <div style={styles.statsGrid}>
                      <div style={styles.statCard}>
                        <div style={styles.statIcon}>⬇️</div>
                        <div style={styles.statValue}>{advancedAnalytics.shift_duration_stats.min}h</div>
                        <div style={styles.statLabel}>Shortest Shift</div>
                      </div>
                      <div style={styles.statCard}>
                        <div style={styles.statIcon}>⬆️</div>
                        <div style={styles.statValue}>{advancedAnalytics.shift_duration_stats.max}h</div>
                        <div style={styles.statLabel}>Longest Shift</div>
                      </div>
                      <div style={styles.statCard}>
                        <div style={styles.statIcon}>➡️</div>
                        <div style={styles.statValue}>{advancedAnalytics.shift_duration_stats.avg}h</div>
                        <div style={styles.statLabel}>Average Duration</div>
                      </div>
                      <div style={styles.statCard}>
                        <div style={styles.statIcon}>📊</div>
                        <div style={styles.statValue}>{advancedAnalytics.shift_duration_stats.median}h</div>
                        <div style={styles.statLabel}>Median Duration</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Productivity Stats */}
                {advancedAnalytics.productivity_stats && Object.keys(advancedAnalytics.productivity_stats).length > 0 && (
                  <div style={{marginBottom: "32px"}}>
                    <h2 style={styles.sectionTitle}>⚡ Productivity Statistics</h2>
                    <div style={styles.statsGrid}>
                      <div style={styles.statCard}>
                        <div style={styles.statIcon}>⬇️</div>
                        <div style={styles.statValue}>{advancedAnalytics.productivity_stats.min}</div>
                        <div style={styles.statLabel}>Min Cases/Hour</div>
                      </div>
                      <div style={styles.statCard}>
                        <div style={styles.statIcon}>⬆️</div>
                        <div style={styles.statValue}>{advancedAnalytics.productivity_stats.max}</div>
                        <div style={styles.statLabel}>Max Cases/Hour</div>
                      </div>
                      <div style={styles.statCard}>
                        <div style={styles.statIcon}>➡️</div>
                        <div style={styles.statValue}>{advancedAnalytics.productivity_stats.avg}</div>
                        <div style={styles.statLabel}>Average Cases/Hour</div>
                      </div>
                      <div style={styles.statCard}>
                        <div style={styles.statIcon}>📊</div>
                        <div style={styles.statValue}>{advancedAnalytics.productivity_stats.median}</div>
                        <div style={styles.statLabel}>Median Cases/Hour</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Agent Consistency */}
                {advancedAnalytics.agent_consistency && advancedAnalytics.agent_consistency.length > 0 && (
                  <div style={{marginBottom: "32px"}}>
                    <h2 style={styles.sectionTitle}>🎯 Most Consistent Agents</h2>
                    <div style={styles.tableContainer}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Agent ID</th>
                            <th style={styles.th}>Avg Triaged</th>
                            <th style={styles.th}>Variance</th>
                            <th style={styles.th}>Consistency Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {advancedAnalytics.agent_consistency.map((agent) => (
                            <tr key={agent.agent_id} style={styles.tr}>
                              <td style={styles.td}>{agent.agent_id?.substring(0, 10) || "Unknown"}...</td>
                              <td style={styles.td}>{agent.avg_triaged}</td>
                              <td style={styles.td}>{agent.variance}</td>
                              <td style={styles.td}>
                                <div style={{
                                  display: "inline-block",
                                  padding: "4px 12px",
                                  borderRadius: "9999px",
                                  backgroundColor: agent.consistency_score > 80 ? "#dcfce7" : agent.consistency_score > 60 ? "#fef3c7" : "#fee2e2",
                                  color: agent.consistency_score > 80 ? "#15803d" : agent.consistency_score > 60 ? "#d97706" : "#dc2626",
                                  fontWeight: "600",
                                  fontSize: "12px"
                                }}>
                                  {agent.consistency_score}%
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Coverage Analysis */}
                {advancedAnalytics.coverage_analysis && advancedAnalytics.coverage_analysis.length > 0 && (
                  <div style={{marginBottom: "32px"}}>
                    <h2 style={styles.sectionTitle}>👥 Agent Coverage by Hour</h2>
                    <div style={styles.tableContainer}>
                      <div style={{padding: "24px"}}>
                        <div style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: "4px",
                          height: "200px",
                          justifyContent: "space-between"
                        }}>
                          {advancedAnalytics.coverage_analysis.map((item) => {
                            const maxAgents = Math.max(...advancedAnalytics.coverage_analysis.map(i => i.avg_agents));
                            const height = maxAgents > 0 ? (item.avg_agents / maxAgents) * 100 : 0;
                            const isLowCoverage = item.avg_agents < 2;
                            return (
                              <div key={item.hour} style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "8px"
                              }}>
                                <div style={{
                                  width: "100%",
                                  height: `${height}%`,
                                  backgroundColor: isLowCoverage ? "#dc2626" : "#059669",
                                  borderRadius: "4px 4px 0 0",
                                  minHeight: item.avg_agents > 0 ? "4px" : "0",
                                  position: "relative",
                                  cursor: "pointer"
                                }} title={`${item.avg_agents.toFixed(1)} avg agents`}>
                                </div>
                                <div style={{
                                  fontSize: "11px",
                                  color: isLowCoverage ? "#dc2626" : "#64748b",
                                  fontWeight: "600"
                                }}>
                                  {item.hour}:00
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alert Analysis */}
                {advancedAnalytics.alert_analysis && advancedAnalytics.alert_analysis.length > 0 && (
                  <div style={{marginBottom: "32px"}}>
                    <h2 style={styles.sectionTitle}>🚨 Alert Analysis</h2>
                    <div style={styles.tableContainer}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Alert Type</th>
                            <th style={styles.th}>Count</th>
                            <th style={styles.th}>Shifts Affected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {advancedAnalytics.alert_analysis.map((alert, idx) => (
                            <tr key={idx} style={styles.tr}>
                              <td style={styles.td}>{alert.alert_type}</td>
                              <td style={styles.td}>{alert.count}</td>
                              <td style={styles.td}>{alert.shifts_affected}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                No analytics data available
              </div>
            )}
          </div>
        )}
      </div>

      {/* SHIFT DETAILS MODAL */}
      {shiftDetails && (
        <div style={styles.modalOverlay} onClick={() => setShiftDetails(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Shift Details</h2>
              <button style={styles.modalClose} onClick={() => setShiftDetails(null)}>×</button>
            </div>
            <div style={styles.modalBody}>
              {loading.shiftDetails ? (
                <LoadingSpinner />
              ) : errors.shiftDetails ? (
                <ErrorMessage message={errors.shiftDetails} />
              ) : (
                <>
                  <div style={styles.modalSection}>
                    <strong>Agent:</strong> {shiftDetails.agent_id}
                  </div>
                  <div style={styles.modalSection}>
                    <strong>Start:</strong> {formatDate(shiftDetails.login_time)}
                  </div>
                  {shiftDetails.logout_time && (
                    <div style={styles.modalSection}>
                      <strong>End:</strong> {formatDate(shiftDetails.logout_time)}
                    </div>
                  )}
                  <div style={styles.modalSection}>
                    <strong>Triaged Cases:</strong> {shiftDetails.triaged_count || 0}
                  </div>

                  {shiftDetails.tickets && shiftDetails.tickets.length > 0 && (
                    <div style={styles.modalSection}>
                      <h3 style={styles.modalSectionTitle}>Tickets ({shiftDetails.tickets.length})</h3>
                      {shiftDetails.tickets.map((ticket, i) => (
                        <div key={i} style={styles.modalItem}>
                          <strong>#{ticket.number}</strong> - {ticket.description || "No description"}
                        </div>
                      ))}
                    </div>
                  )}

                  {shiftDetails.alerts && shiftDetails.alerts.length > 0 && (
                    <div style={styles.modalSection}>
                      <h3 style={styles.modalSectionTitle}>Alerts ({shiftDetails.alerts.length})</h3>
                      {shiftDetails.alerts.map((alert, i) => (
                        <div key={i} style={styles.modalItem}>
                          <strong>{alert.monitor}</strong> - {alert.type}
                          {alert.comment && <div style={styles.modalItemDesc}>{alert.comment}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {shiftDetails.incidents && shiftDetails.incidents.length > 0 && (
                    <div style={styles.modalSection}>
                      <h3 style={styles.modalSectionTitle}>Incidents ({shiftDetails.incidents.length})</h3>
                      {shiftDetails.incidents.map((incident, i) => (
                        <div key={i} style={styles.modalItem}>
                          {incident.description}
                        </div>
                      ))}
                    </div>
                  )}

                  {shiftDetails.adhoc_tasks && shiftDetails.adhoc_tasks.length > 0 && (
                    <div style={styles.modalSection}>
                      <h3 style={styles.modalSectionTitle}>Ad-hoc Tasks ({shiftDetails.adhoc_tasks.length})</h3>
                      {shiftDetails.adhoc_tasks.map((task, i) => (
                        <div key={i} style={styles.modalItem}>
                          {task.task}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AGENT STATS MODAL */}
      {agentStats && selectedAgent && (
        <div style={styles.modalOverlay} onClick={() => { setAgentStats(null); setSelectedAgent(null); }}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Agent Statistics</h2>
              <button style={styles.modalClose} onClick={() => { setAgentStats(null); setSelectedAgent(null); }}>×</button>
            </div>
            <div style={styles.modalBody}>
              {loading.agentStats ? (
                <LoadingSpinner />
              ) : errors.agentStats ? (
                <ErrorMessage message={errors.agentStats} />
              ) : (
                <>
                  <div style={styles.modalSection}>
                    <strong>Agent ID:</strong> {agentStats.agent_id}
                  </div>
                  <div style={styles.modalSection}>
                    <strong>Total Shifts:</strong> {agentStats.total_shifts || 0}
                  </div>
                  <div style={styles.modalSection}>
                    <strong>Total Cases Triaged:</strong> {agentStats.total_triaged || 0}
                  </div>
                  <div style={styles.modalSection}>
                    <strong>Average Per Shift:</strong> {agentStats.avg_per_shift || 0}
                  </div>

                  {agentStats.recent_shifts && agentStats.recent_shifts.length > 0 && (
                    <div style={styles.modalSection}>
                      <h3 style={styles.modalSectionTitle}>Recent Shifts</h3>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Login</th>
                            <th style={styles.th}>Duration</th>
                            <th style={styles.th}>Triaged</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agentStats.recent_shifts.map((shift) => (
                            <tr key={shift.id} style={styles.tr}>
                              <td style={styles.td}>{formatDate(shift.login_time)}</td>
                              <td style={styles.td}>{formatDuration(shift.duration_hours)}</td>
                              <td style={styles.td}>{shift.triaged_count || 0}</td>
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