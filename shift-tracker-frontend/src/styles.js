// styles.js — theme-aware style factory
// Components call buildStyles(C) to get their style objects.
// C is always obtained from useTheme().

export { useTheme, ThemeProvider, buildGlobalCSS, DARK, LIGHT } from "./theme";

/* ─────────────────────────────────────────
   STYLE FACTORY
───────────────────────────────────────── */

export function buildStyles(C) {
  return {

    /* ── Shell ── */
    container: {
      minHeight: "100vh",
      backgroundColor: C.bg,
      fontFamily:
        "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      transition: "background 0.3s",
    },

    /* ── Login ── */
    loginWrapper: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: `radial-gradient(ellipse at 30% 20%, ${C.accentGlow} 0%, transparent 60%),
                   radial-gradient(ellipse at 80% 80%, ${C.purpleFaint} 0%, transparent 60%),
                   ${C.bg}`,
      position: "relative",
    },

    brandHeader: {
      position: "absolute",
      top: "32px",
      left: "32px",
      zIndex: 10,
    },

    brandContent: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },

    brandIconSmall: {
      width: "48px",
      height: "48px",
      background: C.accentGlow,
      border: `1px solid ${C.accentBorder}`,
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: C.accentLight,
    },

    brandNameSmall: {
      fontSize: "18px",
      fontWeight: "800",
      background: `linear-gradient(135deg, ${C.accentLight}, ${C.cyan})`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      letterSpacing: "-0.02em",
    },

    loginCard: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: "20px",
      padding: "48px",
      maxWidth: "560px",
      width: "100%",
      boxShadow: `0 24px 64px rgba(0,0,0,0.2), 0 0 0 1px ${C.border}`,
      animation: "rise .35s ease",
      transition: "background 0.3s, border-color 0.3s",
    },

    loginLogoSection: {
      marginBottom: "32px",
      textAlign: "center",
    },

    loginCardTitle: {
      fontSize: "24px",
      fontWeight: "800",
      color: C.ink,
      margin: "0 0 8px 0",
      letterSpacing: "-0.025em",
    },

    loginSubtitle: {
      fontSize: "14px",
      color: C.inkMid,
      fontWeight: "400",
      marginBottom: "28px",
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
      background: C.accentGlow,
      border: `1px solid ${C.accentBorder}`,
      color: C.accentLight,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "22px",
      fontWeight: "800",
    },

    agentName: {
      fontSize: "14px",
      fontWeight: "600",
      color: C.ink,
    },

    /* ── Dashboard shell ── */

    mainLayout: {
      minHeight: "100vh",
      backgroundColor: C.bg,
      transition: "background 0.3s",
    },

    header: {
      backgroundColor: C.surface,
      borderBottom: `1px solid ${C.border}`,
      padding: "16px 32px",
      paddingRight: "120px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "background 0.3s, border-color 0.3s",
    },

    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },

    headerIcon: {
      width: "44px",
      height: "44px",
      background: C.accentGlow,
      border: `1px solid ${C.accentBorder}`,
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: C.accentLight,
    },

    headerTitle: {
      fontSize: "18px",
      fontWeight: "800",
      color: C.ink,
      margin: "0 0 2px 0",
      letterSpacing: "-0.025em",
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

    /* ── Content ── */

    content: {
      padding: "28px 32px",
      maxWidth: "1400px",
      margin: "0 auto",
    },

    gridLayout: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
      gap: "20px",
      marginBottom: "24px",
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

    /* ── Summary ── */

    summaryWrapper: {
      minHeight: "100vh",
      backgroundColor: C.bg,
      padding: "32px",
      transition: "background 0.3s",
    },

    summaryContainer: {
      maxWidth: "1100px",
      margin: "0 auto",
    },

    summaryHeader: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: "16px",
      padding: "32px",
      marginBottom: "20px",
      textAlign: "center",
      animation: "rise .3s ease",
      transition: "background 0.3s",
    },

    summaryTitle: {
      fontSize: "28px",
      fontWeight: "800",
      color: C.ink,
      marginBottom: "8px",
      letterSpacing: "-0.03em",
    },

    summarySubtitle: {
      fontSize: "14px",
      color: C.inkMid,
      marginBottom: "28px",
    },

    summaryActions: {
      display: "flex",
      justifyContent: "center",
      gap: "14px",
      marginTop: "28px",
    },
  };
}

/* ─────────────────────────────────────────
   LEGACY EXPORTS (compatibility)
───────────────────────────────────────── */

import { DARK, buildGlobalCSS } from "./theme";

export const C = DARK;
export const styles = buildStyles(DARK);
export const GLOBAL_CSS = buildGlobalCSS(DARK);