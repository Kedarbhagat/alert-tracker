import { useState, useEffect } from "react";
import { managerStyles as styles } from "./mngr_styles";

function ManagerDashboard() {
  const API = "http://172.16.8.50:5000";  // Unified backend on port 5000

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

  // Fetch active agents
  const fetchActiveAgents = async () => {
    try {
      const response = await fetch(`${API}/manager/active-agents`);
      const data = await response.json();
      setActiveAgents(data.active_agents || []);
    } catch (error) {
      console.error("Error fetching active agents:", error);
    }
  };

  // Fetch all shifts
  const fetchShifts = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.agentId) params.append('agent_id', filters.agentId);

      const response = await fetch(`${API}/manager/shifts?${params}`);
      const data = await response.json();
      setAllShifts(data.shifts || []);
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API}/manager/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  // Fetch advanced analytics
  const fetchAdvancedAnalytics = async () => {
    try {
      const response = await fetch(`${API}/manager/advanced-analytics`);
      const data = await response.json();
      setAdvancedAnalytics(data);
    } catch (error) {
      console.error("Error fetching advanced analytics:", error);
    }
  };

  // Fetch agent stats
  const fetchAgentStats = async (agentId) => {
    try {
      const response = await fetch(`${API}/manager/agent-stats/${agentId}`);
      const data = await response.json();
      setAgentStats(data);
      setSelectedAgent(agentId);
    } catch (error) {
      console.error("Error fetching agent stats:", error);
    }
  };

  // Fetch shift details
  const fetchShiftDetails = async (shiftId) => {
    try {
      const response = await fetch(`${API}/manager/shift-details/${shiftId}`);
      const data = await response.json();
      setShiftDetails(data);
      setSelectedShift(shiftId);
    } catch (error) {
      console.error("Error fetching shift details:", error);
    }
  };

  // Auto-refresh
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
  }, []);

  // Fetch shifts when filters change
  useEffect(() => {
    if (activeView === "shifts") {
      fetchShifts();
    }
  }, [filters, activeView]);

  // Fetch advanced analytics when switching to analytics view
  useEffect(() => {
    if (activeView === "analytics") {
      fetchAdvancedAnalytics();
    }
  }, [activeView]);

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getSeverityStyle = (severity) => {
    const styles = {
      success: { backgroundColor: "#dcfce7", color: "#15803d" },
      info: { backgroundColor: "#e0e7ff", color: "#4338ca" },
      warning: { backgroundColor: "#fef3c7", color: "#d97706" },
      error: { backgroundColor: "#fee2e2", color: "#dc2626" }
    };
    return styles[severity] || styles.info;
  };

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
        {activeView === "overview" && analytics && (
          <div>
            <h2 style={styles.sectionTitle}>Today's Overview</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>🟢</div>
                <div style={styles.statValue}>{analytics.active_now}</div>
                <div style={styles.statLabel}>Active Now</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>👥</div>
                <div style={styles.statValue}>{analytics.today.agents_active}</div>
                <div style={styles.statLabel}>Agents Today</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>📊</div>
                <div style={styles.statValue}>{analytics.today.triaged}</div>
                <div style={styles.statLabel}>Cases Triaged</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>🎫</div>
                <div style={styles.statValue}>{analytics.today.tickets}</div>
                <div style={styles.statLabel}>Tickets</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>🚨</div>
                <div style={styles.statValue}>{analytics.today.alerts}</div>
                <div style={styles.statLabel}>Alerts</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}>📅</div>
                <div style={styles.statValue}>{analytics.this_week.shifts}</div>
                <div style={styles.statLabel}>Shifts This Week</div>
              </div>
            </div>

            <h2 style={{...styles.sectionTitle, marginTop: "32px"}}>Active Agents</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Agent ID</th>
                    <th style={styles.th}>Login Time</th>
                    <th style={styles.th}>Duration</th>
                    <th style={styles.th}>Triaged</th>
                    <th style={styles.th}>Productivity</th>
                    <th style={styles.th}>Tickets</th>
                    <th style={styles.th}>Alerts</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAgents.map((agent) => (
                    <tr key={agent.shift_id} style={styles.tr}>
                      <td style={styles.td}>{agent.agent_id.substring(0, 8)}...</td>
                      <td style={styles.td}>{new Date(agent.login_time).toLocaleTimeString()}</td>
                      <td style={styles.td}>{formatDuration(agent.hours_worked)}</td>
                      <td style={styles.td}>{agent.triaged_count}</td>
                      <td style={styles.td}>
                        <strong style={{color: agent.productivity_rate > 5 ? "#15803d" : "#d97706"}}>
                          {agent.productivity_rate} /hr
                        </strong>
                      </td>
                      <td style={styles.td}>{agent.ticket_count}</td>
                      <td style={styles.td}>{agent.alert_count}</td>
                      <td style={styles.td}>
                        <button
                          style={styles.actionButton}
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
          </div>
        )}

        {/* ACTIVE AGENTS VIEW */}
        {activeView === "active" && (
          <div>
            <h2 style={styles.sectionTitle}>Currently Active Agents</h2>
            <div style={styles.agentCardsGrid}>
              {activeAgents.map((agent) => (
                <div key={agent.shift_id} style={styles.agentCard}>
                  <div style={styles.agentCardHeader}>
                    <div style={styles.agentAvatar}>
                      {agent.agent_id.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={styles.agentCardTitle}>{agent.agent_id.substring(0, 12)}...</div>
                      <div style={styles.agentCardSubtitle}>
                        Active for {formatDuration(agent.hours_worked)}
                      </div>
                    </div>
                    <div style={styles.activeIndicator}>🟢</div>
                  </div>
                  <div style={styles.agentCardStats}>
                    <div style={styles.agentCardStat}>
                      <span style={styles.agentCardStatValue}>{agent.triaged_count}</span>
                      <span style={styles.agentCardStatLabel}>Triaged</span>
                    </div>
                    <div style={styles.agentCardStat}>
                      <span style={styles.agentCardStatValue}>{agent.productivity_rate}</span>
                      <span style={styles.agentCardStatLabel}>Per Hour</span>
                    </div>
                    <div style={styles.agentCardStat}>
                      <span style={styles.agentCardStatValue}>{agent.ticket_count}</span>
                      <span style={styles.agentCardStatLabel}>Tickets</span>
                    </div>
                  </div>
                  <button
                    style={styles.viewDetailsButton}
                    onClick={() => fetchShiftDetails(agent.shift_id)}
                  >
                    View Full Details
                  </button>
                </div>
              ))}
              {activeAgents.length === 0 && (
                <div style={styles.emptyState}>
                  <p>No agents currently active</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ALL SHIFTS VIEW */}
        {activeView === "shifts" && (
          <div>
            <div style={styles.filtersBar}>
              <input
                type="date"
                style={styles.filterInput}
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                placeholder="Start Date"
              />
              <input
                type="date"
                style={styles.filterInput}
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                placeholder="End Date"
              />
              <input
                type="text"
                style={styles.filterInput}
                value={filters.agentId}
                onChange={(e) => setFilters({...filters, agentId: e.target.value})}
                placeholder="Agent ID"
              />
              <button
                style={styles.clearFiltersButton}
                onClick={() => setFilters({startDate: "", endDate: "", agentId: ""})}
              >
                Clear Filters
              </button>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Agent ID</th>
                    <th style={styles.th}>Start</th>
                    <th style={styles.th}>End</th>
                    <th style={styles.th}>Duration</th>
                    <th style={styles.th}>Triaged</th>
                    <th style={styles.th}>Tickets</th>
                    <th style={styles.th}>Alerts</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allShifts.map((shift) => (
                    <tr key={shift.shift_id} style={styles.tr}>
                      <td style={styles.td}>{shift.agent_id.substring(0, 8)}...</td>
                      <td style={styles.td}>{new Date(shift.login_time).toLocaleString()}</td>
                      <td style={styles.td}>
                        {shift.logout_time ? new Date(shift.logout_time).toLocaleString() : "Active"}
                      </td>
                      <td style={styles.td}>{formatDuration(shift.hours_worked)}</td>
                      <td style={styles.td}>{shift.triaged_count}</td>
                      <td style={styles.td}>{shift.ticket_count}</td>
                      <td style={styles.td}>{shift.alert_count}</td>
                      <td style={styles.td}>
                        <span style={shift.status === "active" ? styles.activeStatus : styles.completedStatus}>
                          {shift.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.actionButton}
                          onClick={() => fetchShiftDetails(shift.shift_id)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADVANCED ANALYTICS VIEW */}
        {activeView === "analytics" && advancedAnalytics && (
          <div>
            {/* Insights Section */}
            {advancedAnalytics.insights && advancedAnalytics.insights.length > 0 && (
              <div style={{marginBottom: "32px"}}>
                <h2 style={styles.sectionTitle}>🔍 Key Insights</h2>
                <div style={styles.statsGrid}>
                  {advancedAnalytics.insights.map((insight, idx) => (
                    <div key={idx} style={{
                      ...styles.statCard,
                      ...getSeverityStyle(insight.severity),
                      textAlign: "left"
                    }}>
                      <div style={{fontSize: "14px", fontWeight: "700", marginBottom: "8px"}}>
                        {insight.title}
                      </div>
                      <div style={{fontSize: "13px"}}>
                        {insight.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Stats */}
            {advancedAnalytics.productivity_stats && Object.keys(advancedAnalytics.productivity_stats).length > 0 && (
              <div style={{marginBottom: "32px"}}>
                <h2 style={styles.sectionTitle}>📊 Productivity Statistics (Last 30 Days)</h2>
                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>⚡</div>
                    <div style={styles.statValue}>{advancedAnalytics.productivity_stats.avg}</div>
                    <div style={styles.statLabel}>Avg Cases/Hour</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>📈</div>
                    <div style={styles.statValue}>{advancedAnalytics.productivity_stats.max}</div>
                    <div style={styles.statLabel}>Peak Cases/Hour</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>📉</div>
                    <div style={styles.statValue}>{advancedAnalytics.productivity_stats.min}</div>
                    <div style={styles.statLabel}>Min Cases/Hour</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIcon}>📊</div>
                    <div style={styles.statValue}>{advancedAnalytics.productivity_stats.median}</div>
                    <div style={styles.statLabel}>Median Cases/Hour</div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Performers */}
            {advancedAnalytics.agent_rankings && advancedAnalytics.agent_rankings.length > 0 && (
              <div style={{marginBottom: "32px"}}>
                <h2 style={styles.sectionTitle}>🏆 Top Performers (Last 30 Days)</h2>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Rank</th>
                        <th style={styles.th}>Agent ID</th>
                        <th style={styles.th}>Total Shifts</th>
                        <th style={styles.th}>Total Triaged</th>
                        <th style={styles.th}>Avg per Shift</th>
                        <th style={styles.th}>Productivity Rate</th>
                        <th style={styles.th}>Total Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advancedAnalytics.agent_rankings.slice(0, 10).map((agent, idx) => (
                        <tr key={agent.agent_id} style={styles.tr}>
                          <td style={styles.td}>
                            <strong style={{
                              color: idx === 0 ? "#d97706" : idx === 1 ? "#64748b" : idx === 2 ? "#f59e0b" : "#0f172a"
                            }}>
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                            </strong>
                          </td>
                          <td style={styles.td}>{agent.agent_id.substring(0, 10)}...</td>
                          <td style={styles.td}>{agent.total_shifts}</td>
                          <td style={styles.td}>{agent.total_triaged}</td>
                          <td style={styles.td}>{agent.avg_triaged}</td>
                          <td style={styles.td}>
                            <strong style={{color: "#15803d"}}>{agent.productivity_rate} /hr</strong>
                          </td>
                          <td style={styles.td}>{agent.total_hours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Hourly Distribution */}
            {advancedAnalytics.hourly_distribution && advancedAnalytics.hourly_distribution.length > 0 && (
              <div style={{marginBottom: "32px"}}>
                <h2 style={styles.sectionTitle}>⏰ Workload by Hour of Day</h2>
                <div style={styles.tableContainer}>
                  <div style={{padding: "24px"}}>
                    <div style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "4px",
                      height: "200px",
                      justifyContent: "space-between"
                    }}>
                      {advancedAnalytics.hourly_distribution.map((item) => {
                        const maxTriaged = Math.max(...advancedAnalytics.hourly_distribution.map(i => i.total_triaged));
                        const height = maxTriaged > 0 ? (item.total_triaged / maxTriaged) * 100 : 0;
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
                              backgroundColor: "#7c3aed",
                              borderRadius: "4px 4px 0 0",
                              minHeight: item.total_triaged > 0 ? "4px" : "0",
                              position: "relative",
                              cursor: "pointer"
                            }} title={`${item.total_triaged} cases, ${item.shift_count} shifts`}>
                            </div>
                            <div style={{fontSize: "11px", color: "#64748b", fontWeight: "600"}}>
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

            {/* Daily Distribution */}
            {advancedAnalytics.daily_distribution && advancedAnalytics.daily_distribution.length > 0 && (
              <div style={{marginBottom: "32px"}}>
                <h2 style={styles.sectionTitle}>📅 Workload by Day of Week</h2>
                <div style={styles.statsGrid}>
                  {advancedAnalytics.daily_distribution.map((day) => (
                    <div key={day.day_of_week} style={styles.statCard}>
                      <div style={{fontSize: "14px", fontWeight: "700", marginBottom: "8px"}}>
                        {day.day_name}
                      </div>
                      <div style={styles.statValue}>{day.total_triaged}</div>
                      <div style={styles.statLabel}>Cases Triaged</div>
                      <div style={{fontSize: "12px", color: "#64748b", marginTop: "8px"}}>
                        {day.shift_count} shifts • {day.unique_agents} agents
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alert Analysis */}
            {advancedAnalytics.alert_analysis && advancedAnalytics.alert_analysis.length > 0 && (
              <div style={{marginBottom: "32px"}}>
                <h2 style={styles.sectionTitle}>🚨 Alert Type Distribution</h2>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Alert Type</th>
                        <th style={styles.th}>Total Count</th>
                        <th style={styles.th}>Shifts Affected</th>
                        <th style={styles.th}>% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const totalAlerts = advancedAnalytics.alert_analysis.reduce((sum, a) => sum + a.count, 0);
                        return advancedAnalytics.alert_analysis.map((alert) => (
                          <tr key={alert.alert_type} style={styles.tr}>
                            <td style={styles.td}><strong>{alert.alert_type}</strong></td>
                            <td style={styles.td}>{alert.count}</td>
                            <td style={styles.td}>{alert.shifts_affected}</td>
                            <td style={styles.td}>
                              {totalAlerts > 0 ? ((alert.count / totalAlerts) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Monitor Analysis */}
            {advancedAnalytics.monitor_analysis && advancedAnalytics.monitor_analysis.length > 0 && (
              <div style={{marginBottom: "32px"}}>
                <h2 style={styles.sectionTitle}>🖥️ Top Monitors with Alerts</h2>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Monitor</th>
                        <th style={styles.th}>Alert Count</th>
                        <th style={styles.th}>Shifts Affected</th>
                        <th style={styles.th}>Unique Alert Types</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advancedAnalytics.monitor_analysis.map((monitor) => (
                        <tr key={monitor.monitor} style={styles.tr}>
                          <td style={styles.td}><strong>{monitor.monitor}</strong></td>
                          <td style={styles.td}>{monitor.alert_count}</td>
                          <td style={styles.td}>{monitor.shifts_affected}</td>
                          <td style={styles.td}>{monitor.unique_alert_types}</td>
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
                          <td style={styles.td}>{agent.agent_id.substring(0, 10)}...</td>
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
              <div style={styles.modalSection}>
                <strong>Agent:</strong> {shiftDetails.agent_id}
              </div>
              <div style={styles.modalSection}>
                <strong>Start:</strong> {new Date(shiftDetails.login_time).toLocaleString()}
              </div>
              {shiftDetails.logout_time && (
                <div style={styles.modalSection}>
                  <strong>End:</strong> {new Date(shiftDetails.logout_time).toLocaleString()}
                </div>
              )}
              <div style={styles.modalSection}>
                <strong>Triaged Cases:</strong> {shiftDetails.triaged_count}
              </div>

              {shiftDetails.tickets?.length > 0 && (
                <div style={styles.modalSection}>
                  <h3 style={styles.modalSectionTitle}>Tickets ({shiftDetails.tickets.length})</h3>
                  {shiftDetails.tickets.map((ticket, i) => (
                    <div key={i} style={styles.modalItem}>
                      <strong>#{ticket.number}</strong> - {ticket.description || "No description"}
                    </div>
                  ))}
                </div>
              )}

              {shiftDetails.alerts?.length > 0 && (
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

              {shiftDetails.incidents?.length > 0 && (
                <div style={styles.modalSection}>
                  <h3 style={styles.modalSectionTitle}>Incidents ({shiftDetails.incidents.length})</h3>
                  {shiftDetails.incidents.map((incident, i) => (
                    <div key={i} style={styles.modalItem}>
                      {incident.description}
                    </div>
                  ))}
                </div>
              )}

              {shiftDetails.adhoc_tasks?.length > 0 && (
                <div style={styles.modalSection}>
                  <h3 style={styles.modalSectionTitle}>Ad-hoc Tasks ({shiftDetails.adhoc_tasks.length})</h3>
                  {shiftDetails.adhoc_tasks.map((task, i) => (
                    <div key={i} style={styles.modalItem}>
                      {task.task}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;