export const managerStyles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },

  header: {
    backgroundColor: "white",
    padding: "24px 32px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },

  headerTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },

  headerSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  refreshIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#dcfce7",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#15803d",
  },

  refreshDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#22c55e",
    borderRadius: "50%",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },

  navTabs: {
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    gap: "0",
    padding: "0 32px",
  },

  navTab: {
    padding: "16px 24px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    borderBottom: "2px solid transparent",
    transition: "all 0.2s",
  },

  navTabActive: {
    color: "#7c3aed",
    borderBottom: "2px solid #7c3aed",
  },

  content: {
    padding: "32px",
    maxWidth: "1600px",
    margin: "0 auto",
  },

  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "16px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },

  statCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },

  statIcon: {
    fontSize: "32px",
    marginBottom: "12px",
  },

  statValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#7c3aed",
    marginBottom: "8px",
  },

  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: "600",
  },

  tableContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    padding: "16px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },

  tr: {
    borderBottom: "1px solid #f1f5f9",
  },

  td: {
    padding: "16px",
    fontSize: "14px",
    color: "#0f172a",
  },

  actionButton: {
    padding: "6px 12px",
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  activeStatus: {
    padding: "4px 12px",
    backgroundColor: "#dcfce7",
    color: "#15803d",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "600",
  },

  completedStatus: {
    padding: "4px 12px",
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "600",
  },

  agentCardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "24px",
  },

  agentCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },

  agentCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
  },

  agentAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#ede9fe",
    color: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "700",
  },

  agentCardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },

  agentCardSubtitle: {
    fontSize: "13px",
    color: "#64748b",
  },

  activeIndicator: {
    marginLeft: "auto",
    fontSize: "20px",
  },

  agentCardStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginBottom: "16px",
  },

  agentCardStat: {
    textAlign: "center",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  agentCardStatValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#7c3aed",
  },

  agentCardStatLabel: {
    fontSize: "11px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  viewDetailsButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  filtersBar: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
    display: "flex",
    gap: "12px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },

  filterInput: {
    flex: "1",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
  },

  clearFiltersButton: {
    padding: "10px 24px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },

  emptyState: {
    textAlign: "center",
    padding: "48px",
    color: "#94a3b8",
    fontSize: "16px",
    gridColumn: "1 / -1",
  },

  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "1000",
  },

  modal: {
    backgroundColor: "white",
    borderRadius: "16px",
    maxWidth: "800px",
    width: "90%",
    maxHeight: "80vh",
    overflow: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },

  modalHeader: {
    padding: "24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: "0",
    backgroundColor: "white",
    zIndex: "10",
  },

  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0",
  },

  modalClose: {
    fontSize: "32px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    color: "#64748b",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
  },

  modalBody: {
    padding: "24px",
  },

  modalSection: {
    marginBottom: "20px",
    fontSize: "14px",
    color: "#475569",
  },

  modalSectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "12px",
  },

  modalItem: {
    backgroundColor: "#f8fafc",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "8px",
    borderLeft: "3px solid #7c3aed",
  },

  modalItemDesc: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#64748b",
  },
};