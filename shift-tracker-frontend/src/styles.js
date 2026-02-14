export const styles = {
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
    width: "60px",
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
    color: "#0f172a",
    backgroundColor: "#ffffff",
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
    color: "#0f172a",
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
    color: "#0f172a",
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

  // Shift Summary Screen Styles
  summaryWrapper: {
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    padding: "32px",
  },

  summaryContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  summaryHeader: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    textAlign: "center",
  },

  summaryTitle: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "8px",
  },

  summarySubtitle: {
    fontSize: "16px",
    color: "#64748b",
    marginBottom: "24px",
  },

  summaryStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "24px",
  },

  statCard: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
  },

  statValue: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#7c3aed",
    marginBottom: "8px",
  },

  statLabel: {
    fontSize: "14px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: "600",
  },

  summarySection: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  },

  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  itemList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  summaryItem: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "16px",
    borderLeft: "4px solid #7c3aed",
  },

  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },

  itemTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },

  itemTime: {
    fontSize: "12px",
    color: "#64748b",
  },

  itemDescription: {
    fontSize: "14px",
    color: "#475569",
    lineHeight: "1.5",
  },

  emptyState: {
    textAlign: "center",
    padding: "32px",
    color: "#94a3b8",
    fontSize: "14px",
  },

  summaryActions: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    marginTop: "32px",
  },

  summaryButton: {
    padding: "12px 32px",
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  summarySecondaryButton: {
    padding: "12px 32px",
    backgroundColor: "white",
    color: "#0f172a",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};