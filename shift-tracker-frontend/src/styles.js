// ── Colour tokens — identical to ManagerDashboard / AdvancedAnalytics ────────
export const C = {
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
  accentBorder: "rgba(37,99,235,0.3)",
  greenText:    "#3fb950",
  greenFaint:   "rgba(35,134,54,0.15)",
  greenBorder:  "rgba(35,134,54,0.3)",
  redText:      "#f85149",
  redFaint:     "rgba(218,54,51,0.12)",
  redBorder:    "rgba(218,54,51,0.3)",
  amberText:    "#d29922",
  amberFaint:   "rgba(158,106,3,0.15)",
  amberBorder:  "rgba(158,106,3,0.3)",
  purple:       "#a78bfa",
  purpleFaint:  "rgba(167,139,250,0.15)",
  purpleBorder: "rgba(167,139,250,0.3)",
};

// ── Global CSS injected once into <head> ─────────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes agent-spin  { to { transform: rotate(360deg); } }
  @keyframes agent-rise  { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes agent-pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.35; } }

  *, *::before, *::after { box-sizing: border-box; }

  /* ── Card ── */
  .ag-card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 10px;
    transition: border-color .18s;
    overflow: hidden;
  }
  .ag-card:hover { border-color: ${C.accentBorder}; }

  /* ── Buttons ── */
  .ag-btn-primary {
    background: ${C.accent};
    border: none; color: #fff; border-radius: 7px;
    padding: 10px 20px; width: 100%; margin-top: 14px;
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  .ag-btn-primary:hover { background: #1d4ed8; }

  .ag-btn-alert {
    background: ${C.redFaint};
    border: 1px solid ${C.redBorder}; color: ${C.redText}; border-radius: 7px;
    padding: 10px 20px; width: 100%; margin-top: 14px;
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .ag-btn-alert:hover { background: rgba(218,54,51,0.22); }

  .ag-btn-save {
    background: ${C.greenFaint};
    border: 1px solid ${C.greenBorder}; color: ${C.greenText}; border-radius: 7px;
    padding: 10px 20px; width: 100%; margin-top: 14px;
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .ag-btn-save:hover { background: rgba(35,134,54,0.25); }

  .ag-btn-ghost {
    background: transparent;
    border: 1px solid ${C.border}; color: ${C.inkMid}; border-radius: 7px;
    padding: 10px 24px;
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .ag-btn-ghost:hover { border-color: ${C.accentLight}; color: ${C.accentLight}; }

  .ag-btn-end {
    background: ${C.raised};
    border: 1px solid ${C.border}; color: ${C.ink}; border-radius: 7px;
    padding: 10px 28px;
    font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
    display: flex; align-items: center; gap: 8px;
  }
  .ag-btn-end:hover { border-color: ${C.redBorder}; color: ${C.redText}; }

  .ag-btn-confirm {
    flex: 1; padding: 11px 0;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border: none; color: #fff; border-radius: 8px;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: opacity .15s;
  }
  .ag-btn-confirm:hover { opacity: 0.88; }

  .ag-btn-cancel {
    flex: 1; padding: 11px 0;
    background: ${C.raised};
    border: 1px solid ${C.border}; color: ${C.inkMid}; border-radius: 8px;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .ag-btn-cancel:hover { border-color: ${C.inkMid}; color: ${C.ink}; }

  .ag-btn-summary {
    padding: 11px 32px;
    background: ${C.accent};
    border: none; color: #fff; border-radius: 8px;
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  .ag-btn-summary:hover { background: #1d4ed8; }

  /* ── Agent login card button ── */
  .ag-agent-btn {
    padding: 20px;
    background: ${C.surface};
    border: 1px solid ${C.border}; border-radius: 10px;
    cursor: pointer; transition: all .18s;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    font-family: 'Inter', sans-serif;
  }
  .ag-agent-btn:hover { border-color: ${C.accentBorder}; background: ${C.raised}; }

  /* ── Inputs / textareas / selects ── */
  .ag-input {
    background: ${C.bgAlt};
    border: 1px solid ${C.border}; border-radius: 7px;
    padding: 10px 14px; width: 100%;
    font-size: 13px; font-family: 'Inter', sans-serif; color: ${C.ink};
    outline: none; transition: border-color .15s; resize: vertical;
    box-sizing: border-box;
  }
  .ag-input:focus { border-color: ${C.accentLight}; }
  .ag-input::placeholder { color: ${C.inkLight}; }

  /* ── Card header ── */
  .ag-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid ${C.border};
    display: flex; justify-content: space-between; align-items: center;
    background: ${C.borderLight};
  }

  /* ── Badges ── */
  .ag-badge-active {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px;
    background: ${C.greenFaint}; border: 1px solid ${C.greenBorder};
    border-radius: 999px;
    font-size: 12px; font-weight: 600; color: ${C.greenText};
    font-family: 'Inter', sans-serif;
  }
  .ag-badge-resume {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px;
    background: ${C.purpleFaint}; border: 1px solid ${C.purpleBorder};
    border-radius: 999px;
    font-size: 12px; font-weight: 600; color: ${C.purple};
    font-family: 'Inter', sans-serif;
  }

  /* ── Ticket items ── */
  .ag-ticket-item {
    background: ${C.raised};
    border: 1px solid ${C.border}; border-left: 3px solid ${C.accentLight};
    border-radius: 8px; padding: 14px 16px; margin-bottom: 10px;
  }

  /* ── Summary items ── */
  .ag-summary-item {
    background: ${C.raised};
    border: 1px solid ${C.border}; border-left: 3px solid ${C.accentLight};
    border-radius: 8px; padding: 14px 16px;
  }

  /* ── Counter ── */
  .ag-counter-btn {
    width: 56px; height: 40px;
    background: ${C.raised}; border: 1px solid ${C.border};
    border-radius: 8px; color: ${C.inkMid}; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .15s;
  }
  .ag-counter-btn:hover { border-color: ${C.accentLight}; color: ${C.accentLight}; }

  /* ── Manager toggle button ── */
  .ag-mgr-toggle {
    position: fixed; top: 10px; right: 120px; z-index: 9999;
    padding: 8px 12px;
    background: ${C.raised}; border: 1px solid ${C.border};
    border-radius: 6px; color: ${C.accentLight};
    font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600;
    cursor: pointer; transition: all .15s;
    display: flex; align-items: center; justify-content: center;
  }
  .ag-mgr-toggle:hover { border-color: ${C.accentLight}; background: ${C.bgAlt}; }
`;

// ── Inline JS style objects ───────────────────────────────────────────────────
export const styles = {
  // ── Shared shell ──
  container: {
    minHeight: "100vh",
    backgroundColor: C.bg,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  // ── Login / agent-select ──
  loginWrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: C.bg,
  },

  loginCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "16px",
    padding: "48px",
    maxWidth: "560px",
    width: "100%",
    boxShadow: "0 24px 56px rgba(0,0,0,0.5)",
    animation: "agent-rise .3s ease",
  },

  logoSection: {
    textAlign: "center",
    marginBottom: "40px",
  },

  logoIcon: {
    width: "64px",
    height: "64px",
    background: "rgba(37,99,235,0.15)",
    border: `1px solid ${C.accentBorder}`,
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    color: C.accentLight,
  },

  loginTitle: {
    fontSize: "26px",
    fontWeight: "700",
    color: C.ink,
    marginBottom: "8px",
    letterSpacing: "-0.025em",
  },

  loginSubtitle: {
    fontSize: "14px",
    color: C.inkMid,
    fontWeight: "400",
  },

  agentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "14px",
  },

  agentAvatar: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "rgba(37,99,235,0.15)",
    border: `1px solid ${C.accentBorder}`,
    color: C.accentLight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "700",
  },

  agentName: {
    fontSize: "14px",
    fontWeight: "600",
    color: C.ink,
  },

  // ── Dashboard shell ──
  mainLayout: {
    minHeight: "100vh",
    backgroundColor: C.bg,
  },

  header: {
    backgroundColor: C.surface,
    borderBottom: `1px solid ${C.border}`,
    padding: "16px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  headerIcon: {
    width: "44px",
    height: "44px",
    background: "rgba(37,99,235,0.15)",
    border: `1px solid ${C.accentBorder}`,
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: C.accentLight,
  },

  headerTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: C.ink,
    margin: "0 0 2px 0",
    letterSpacing: "-0.02em",
  },

  headerSubtitle: {
    fontSize: "13px",
    color: C.inkMid,
    margin: "0",
  },

  headerRight: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },

  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 14px",
    background: C.greenFaint,
    border: `1px solid ${C.greenBorder}`,
    color: C.greenText,
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    backgroundColor: C.greenText,
    borderRadius: "50%",
    animation: "agent-pulse 2s ease infinite",
  },

  content: {
    padding: "28px 32px",
    maxWidth: "1400px",
    margin: "0 auto",
  },

  // ── Triage metric card ──
  metricsRow: {
    marginBottom: "24px",
  },

  metricCard: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "10px",
    padding: "22px 24px",
  },

  metricHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  metricLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: C.inkLight,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },

  counterWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
  },

  counterValue: {
    fontSize: "52px",
    fontWeight: "700",
    color: C.ink,
    minWidth: "80px",
    textAlign: "center",
    letterSpacing: "-0.03em",
    fontFamily: "'JetBrains Mono', monospace",
  },

  // ── Grid + cards ──
  gridLayout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },

  card: {}, // handled by .ag-card className

  cardHeader: {}, // handled by .ag-card-header className

  cardTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: C.ink,
    margin: "0",
    letterSpacing: "-0.01em",
  },

  cardBody: {
    padding: "20px",
  },

  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: C.inkLight,
    marginBottom: "8px",
    marginTop: "16px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },

  // ── Ticket items ──
  ticketList: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: `1px solid ${C.border}`,
  },

  ticketListHeader: {
    marginBottom: "12px",
  },

  ticketCount: {
    fontSize: "12px",
    fontWeight: "600",
    color: C.inkMid,
  },

  ticketNumber: {
    fontSize: "13px",
    fontWeight: "700",
    color: C.accentLight,
    marginBottom: "8px",
    fontFamily: "'JetBrains Mono', monospace",
  },

  // ── Footer ──
  actionsFooter: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    padding: "20px 24px",
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "10px",
  },

  // ── Summary screen ──
  summaryWrapper: {
    minHeight: "100vh",
    backgroundColor: C.bg,
    padding: "32px",
  },

  summaryContainer: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  summaryHeader: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "20px",
    textAlign: "center",
    animation: "agent-rise .3s ease",
  },

  summaryTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: C.ink,
    marginBottom: "8px",
    letterSpacing: "-0.025em",
  },

  summarySubtitle: {
    fontSize: "14px",
    color: C.inkMid,
    marginBottom: "28px",
  },

  summaryStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "14px",
    marginTop: "24px",
  },

  statCard: {
    background: C.raised,
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "18px",
    textAlign: "center",
  },

  statValue: {
    fontSize: "34px",
    fontWeight: "700",
    color: C.accentLight,
    marginBottom: "6px",
    fontFamily: "'JetBrains Mono', monospace",
  },

  statLabel: {
    fontSize: "11px",
    color: C.inkLight,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: "600",
  },

  summarySection: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "10px",
    padding: "22px 24px",
    marginBottom: "16px",
    animation: "agent-rise .3s ease",
  },

  sectionTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: C.ink,
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },

  itemList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  summaryItem: {}, // handled by .ag-summary-item

  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },

  itemTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: C.ink,
  },

  itemTime: {
    fontSize: "11px",
    color: C.inkLight,
    fontFamily: "'JetBrains Mono', monospace",
  },

  itemDescription: {
    fontSize: "13px",
    color: C.inkMid,
    lineHeight: "1.6",
  },

  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: C.inkLight,
    fontSize: "14px",
  },

  summaryActions: {
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    marginTop: "28px",
  },
};