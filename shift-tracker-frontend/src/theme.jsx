// ── Unified Theme System ─────────────────────────────────────────────────────
// Single source of truth for all colour tokens across all components.
// Import { useTheme, ThemeProvider, DARK, LIGHT } from './theme'

import { createContext, useContext, useState, useEffect } from "react";

export const DARK = {
  bg:           "#0a0f1e",
  bgAlt:        "#0f1629",
  surface:      "#111827",
  raised:       "#1a2035",
  border:       "#1e2d45",
  borderLight:  "#162035",
  ink:          "#e2e8f5",
  inkMid:       "#7b8fab",
  inkLight:     "#4a5568",

  // Brand accent — electric blue
  accent:       "#2563eb",
  accentLight:  "#60a5fa",
  accentGlow:   "rgba(96,165,250,0.15)",
  accentBorder: "rgba(37,99,235,0.35)",

  // Semantic
  greenText:    "#34d399",
  greenFaint:   "rgba(52,211,153,0.1)",
  greenBorder:  "rgba(52,211,153,0.25)",

  redText:      "#f87171",
  redFaint:     "rgba(248,113,113,0.1)",
  redBorder:    "rgba(248,113,113,0.25)",

  amberText:    "#fbbf24",
  amberFaint:   "rgba(251,191,36,0.1)",
  amberBorder:  "rgba(251,191,36,0.25)",

  indigo:       "#818cf8",
  indigoFaint:  "rgba(129,140,248,0.1)",
  indigoBorder: "rgba(129,140,248,0.25)",

  purple:       "#c084fc",
  purpleFaint:  "rgba(192,132,252,0.1)",
  purpleBorder: "rgba(192,132,252,0.25)",

  cyan:         "#22d3ee",
  cyanFaint:    "rgba(34,211,238,0.1)",
  cyanBorder:   "rgba(34,211,238,0.25)",

  // Chart colours (vibrant for dark bg)
  chart: ["#60a5fa","#34d399","#fbbf24","#f87171","#c084fc","#22d3ee","#fb923c"],
};

export const LIGHT = {
  bg:           "#f0f4ff",
  bgAlt:        "#e8eeff",
  surface:      "#ffffff",
  raised:       "#f8faff",
  border:       "#d1daf5",
  borderLight:  "#e4ecff",
  ink:          "#0f172a",
  inkMid:       "#475569",
  inkLight:     "#94a3b8",

  // Brand accent — deep blue
  accent:       "#2563eb",
  accentLight:  "#3b82f6",
  accentGlow:   "rgba(59,130,246,0.1)",
  accentBorder: "rgba(37,99,235,0.2)",

  // Semantic
  greenText:    "#059669",
  greenFaint:   "rgba(5,150,105,0.08)",
  greenBorder:  "rgba(5,150,105,0.2)",

  redText:      "#dc2626",
  redFaint:     "rgba(220,38,38,0.07)",
  redBorder:    "rgba(220,38,38,0.2)",

  amberText:    "#d97706",
  amberFaint:   "rgba(217,119,6,0.08)",
  amberBorder:  "rgba(217,119,6,0.2)",

  indigo:       "#4f46e5",
  indigoFaint:  "rgba(79,70,229,0.08)",
  indigoBorder: "rgba(79,70,229,0.2)",

  purple:       "#7c3aed",
  purpleFaint:  "rgba(124,58,237,0.08)",
  purpleBorder: "rgba(124,58,237,0.2)",

  cyan:         "#0891b2",
  cyanFaint:    "rgba(8,145,178,0.08)",
  cyanBorder:   "rgba(8,145,178,0.2)",

  // Chart colours (deeper for light bg)
  chart: ["#2563eb","#059669","#d97706","#dc2626","#7c3aed","#0891b2","#ea580c"],
};

// ── Context ──────────────────────────────────────────────────────────────────
const ThemeCtx = createContext({ C: DARK, isDark: true, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("p44-theme") !== "light"; }
    catch { return true; }
  });

  const C = isDark ? DARK : LIGHT;

  const toggle = () => {
    setIsDark(d => {
      const next = !d;
      try { localStorage.setItem("p44-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  };

  // Push theme class to <html> so native inputs inherit
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <ThemeCtx.Provider value={{ C, isDark, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() { return useContext(ThemeCtx); }

// ── Global CSS factory ────────────────────────────────────────────────────────
// Call buildGlobalCSS(C) to get the full CSS string for the current theme.
export function buildGlobalCSS(C) { return `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes rise   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes pulse  { 0%,100%{ opacity:1; } 50%{ opacity:0.3; } }
  @keyframes bell   { 0%,100%{ transform:rotate(0); } 25%{ transform:rotate(-14deg); } 75%{ transform:rotate(14deg); } }
  @keyframes toast-in  { from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:none; } }
  @keyframes toast-out { from { opacity:1; transform:none; } to { opacity:0; transform:translateX(32px); } }
  @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${C.bg};
    color: ${C.ink};
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    transition: background 0.3s, color 0.3s;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: ${C.inkLight}; }

  /* ── Cards ── */
  .ag-card, .mgr-card {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 12px;
    transition: border-color .2s, box-shadow .2s;
  }
  .ag-card:hover, .mgr-card:hover {
    border-color: ${C.accentBorder};
    box-shadow: 0 0 0 1px ${C.accentBorder}, 0 4px 20px ${C.accentGlow};
  }
  .ag-card-header, .mgr-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid ${C.border};
    display: flex; justify-content: space-between; align-items: center;
    background: ${C.raised};
    border-radius: 12px 12px 0 0;
  }

  /* ── Inputs ── */
  .ag-input, .mgr-input {
    background: ${C.bgAlt};
    border: 1px solid ${C.border};
    border-radius: 8px;
    padding: 10px 14px;
    width: 100%;
    font-size: 13px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: ${C.ink};
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    resize: vertical;
    box-sizing: border-box;
  }
  .ag-input:focus, .mgr-input:focus {
    border-color: ${C.accentLight};
    box-shadow: 0 0 0 3px ${C.accentGlow};
  }
  .ag-input::placeholder, .mgr-input::placeholder { color: ${C.inkLight}; }

  input[type="date"].ag-input, input[type="time"].ag-input {
    color-scheme: ${C === DARK ? 'dark' : 'light'};
    resize: none;
  }
  input[type="date"].ag-input::-webkit-calendar-picker-indicator,
  input[type="time"].ag-input::-webkit-calendar-picker-indicator {
    filter: ${C.ink === '#e2e8f5' ? 'invert(0.7)' : 'none'};
    cursor: pointer; opacity: 0.6;
  }
  input[type="date"].ag-input::-webkit-calendar-picker-indicator:hover,
  input[type="time"].ag-input::-webkit-calendar-picker-indicator:hover { opacity: 1; }

  /* ── Primary button ── */
  .ag-btn-primary, .mgr-btn {
    background: linear-gradient(135deg, ${C.accent}, #1d4ed8);
    border: none; color: #fff; border-radius: 8px;
    padding: 10px 20px; width: 100%; margin-top: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: opacity .15s, transform .1s;
    letter-spacing: 0.01em;
  }
  .ag-btn-primary:hover, .mgr-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .ag-btn-primary:active, .mgr-btn:active { transform: translateY(0); }

  .mgr-btn { width: auto; margin-top: 0; padding: 7px 16px; font-size: 12px; }

  /* ── Alert/danger button ── */
  .ag-btn-alert {
    background: ${C.redFaint};
    border: 1px solid ${C.redBorder}; color: ${C.redText}; border-radius: 8px;
    padding: 10px 20px; width: 100%; margin-top: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .ag-btn-alert:hover { background: rgba(248,113,113,0.18); }

  /* ── Save/green button ── */
  .ag-btn-save {
    background: ${C.greenFaint};
    border: 1px solid ${C.greenBorder}; color: ${C.greenText}; border-radius: 8px;
    padding: 10px 20px; width: 100%; margin-top: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .ag-btn-save:hover { background: rgba(52,211,153,0.18); }

  /* ── Ghost button ── */
  .ag-btn-ghost, .mgr-btn-ghost {
    background: transparent;
    border: 1px solid ${C.border}; color: ${C.inkMid}; border-radius: 8px;
    padding: 10px 24px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .ag-btn-ghost:hover, .mgr-btn-ghost:hover { border-color: ${C.accentLight}; color: ${C.accentLight}; }
  .mgr-btn-ghost { padding: 7px 16px; font-size: 12px; }

  /* ── Indigo button (manager) ── */
  .mgr-btn-indigo {
    background: linear-gradient(135deg, #4f46e5, #4338ca);
    border: none; color: #fff; border-radius: 8px;
    padding: 7px 16px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: opacity .15s;
  }
  .mgr-btn-indigo:hover { opacity: 0.88; }

  /* ── End / outline ── */
  .ag-btn-end {
    background: ${C.raised};
    border: 1px solid ${C.border}; color: ${C.ink}; border-radius: 8px;
    padding: 10px 28px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .15s;
    display: flex; align-items: center; gap: 8px;
  }
  .ag-btn-end:hover { border-color: ${C.redBorder}; color: ${C.redText}; }

  /* ── Confirm / cancel ── */
  .ag-btn-confirm {
    flex: 1; padding: 11px 0;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border: none; color: #fff; border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: opacity .15s;
  }
  .ag-btn-confirm:hover { opacity: 0.88; }

  .ag-btn-cancel {
    flex: 1; padding: 11px 0;
    background: ${C.raised};
    border: 1px solid ${C.border}; color: ${C.inkMid}; border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all .15s;
  }
  .ag-btn-cancel:hover { border-color: ${C.inkMid}; color: ${C.ink}; }

  .ag-btn-summary {
    padding: 11px 32px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border: none; color: #fff; border-radius: 8px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: opacity .15s;
  }
  .ag-btn-summary:hover { opacity: 0.88; }

  /* ── Agent login card button ── */
  .ag-agent-btn {
    padding: 20px;
    background: ${C.surface};
    border: 1px solid ${C.border}; border-radius: 12px;
    cursor: pointer; transition: all .2s;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ag-agent-btn:hover {
    border-color: ${C.accentBorder};
    background: ${C.raised};
    box-shadow: 0 4px 20px ${C.accentGlow};
    transform: translateY(-2px);
  }

  /* ── Action bar button ── */
  .ag-action-btn {
    all: unset; box-sizing: border-box !important;
    position: relative;
    width: 36px !important; height: 36px !important;
    border-radius: 8px !important;
    cursor: pointer !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s;
  }
  .ag-action-btn svg { display: block !important; flex-shrink: 0; overflow: visible; }
  .ag-notif-bell { animation: bell 1.4s ease 0.3s 2; transform-origin: top center; }

  /* ── Nav tabs ── */
  .mgr-tab {
    padding: 14px 20px;
    border: none; background: transparent;
    cursor: pointer;
    font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500;
    color: ${C.inkMid};
    border-bottom: 2px solid transparent;
    transition: color .15s, border-color .15s;
    white-space: nowrap;
  }
  .mgr-tab:hover { color: ${C.ink}; }
  .mgr-tab-active {
    color: ${C.accentLight} !important;
    border-bottom-color: ${C.accentLight} !important;
    font-weight: 600 !important;
  }

  /* ── Table ── */
  .mgr-thead th {
    padding: 10px 16px;
    font-size: 10px; font-family: 'Plus Jakarta Sans', sans-serif;
    text-transform: uppercase; letter-spacing: .1em;
    color: ${C.inkLight}; background: ${C.raised};
    border-bottom: 1px solid ${C.border};
    text-align: left; font-weight: 700; white-space: nowrap;
  }
  .mgr-tbody tr { border-bottom: 1px solid ${C.borderLight}; transition: background .1s; }
  .mgr-tbody tr:hover { background: ${C.raised}; }
  .mgr-tbody td {
    padding: 12px 16px;
    font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; color: ${C.ink};
  }

  /* ── Modal ── */
  .mgr-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.65);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(6px); padding: 24px;
  }
  .mgr-modal {
    background: ${C.surface}; border: 1px solid ${C.border};
    border-radius: 16px;
    width: 100%; max-width: 740px; max-height: 84vh;
    overflow-y: auto;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    animation: rise .2s ease;
  }
  .mgr-modal-header {
    padding: 20px 24px; border-bottom: 1px solid ${C.border};
    display: flex; justify-content: space-between; align-items: center;
    position: sticky; top: 0; background: ${C.surface}; z-index: 10;
    border-radius: 16px 16px 0 0;
  }
  .mgr-modal-body { padding: 24px; }

  /* ── Badges ── */
  .ag-badge-active, .mgr-badge-active {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px;
    background: ${C.greenFaint}; border: 1px solid ${C.greenBorder};
    border-radius: 999px;
    font-size: 11px; font-weight: 600; color: ${C.greenText};
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .ag-badge-resume {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 12px;
    background: ${C.purpleFaint}; border: 1px solid ${C.purpleBorder};
    border-radius: 999px;
    font-size: 12px; font-weight: 600; color: ${C.purple};
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .mgr-badge-done {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px;
    background: ${C.indigoFaint}; border: 1px solid ${C.indigoBorder};
    border-radius: 999px;
    font-size: 11px; font-weight: 600; color: ${C.indigo};
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  /* ── Ticket / summary items ── */
  .ag-ticket-item {
    background: ${C.raised}; border: 1px solid ${C.border};
    border-left: 3px solid ${C.accentLight};
    border-radius: 8px; padding: 14px 16px; margin-bottom: 10px;
    transition: border-color .15s;
  }
  .ag-ticket-item:hover { border-left-color: ${C.cyan}; }

  .ag-summary-item {
    background: ${C.raised}; border: 1px solid ${C.border};
    border-left: 3px solid ${C.accentLight};
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
  .ag-counter-btn:hover { border-color: ${C.accentLight}; color: ${C.accentLight}; background: ${C.accentGlow}; }

  /* ── Toast ── */
  .ag-toast-container {
    position: fixed; bottom: 24px; right: 24px; z-index: 99999;
    display: flex; flex-direction: column; gap: 10px;
    pointer-events: none;
  }
  .ag-toast {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 18px; border-radius: 10px; border: 1px solid;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 500;
    min-width: 280px; max-width: 420px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: toast-in .22s ease; pointer-events: all; backdrop-filter: blur(8px);
  }
  .ag-toast-exit { animation: toast-out .22s ease forwards; }
  .ag-toast-success { background: ${C.greenFaint}; border-color: ${C.greenBorder}; color: ${C.greenText}; }
  .ag-toast-error   { background: ${C.redFaint};   border-color: ${C.redBorder};   color: ${C.redText};   }
  .ag-toast-info    { background: ${C.accentGlow};  border-color: ${C.accentBorder}; color: ${C.accentLight}; }
  .ag-toast-warning { background: ${C.amberFaint};  border-color: ${C.amberBorder}; color: ${C.amberText}; }

  /* ── Confirm dialog ── */
  .ag-confirm-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; z-index: 10000;
  }
  .ag-confirm-box {
    background: ${C.surface}; border: 1px solid ${C.border};
    border-radius: 16px; padding: 36px 32px;
    max-width: 380px; width: 90%;
    box-shadow: 0 24px 56px rgba(0,0,0,0.5);
    text-align: center; animation: rise .2s ease;
  }

  /* ── Theme toggle button ── */
  .theme-toggle {
    all: unset; box-sizing: border-box !important;
    width: 36px !important; height: 36px !important;
    border-radius: 8px !important; cursor: pointer !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    transition: background 0.15s;
    flex-shrink: 0;
  }

  /* ── Stat pill (kpi) ── */
  .kpi-pill {
    background: ${C.raised};
    border: 1px solid ${C.border};
    border-radius: 10px; padding: 14px 18px;
    transition: border-color .2s, box-shadow .2s;
  }
  .kpi-pill:hover {
    border-color: ${C.accentBorder};
    box-shadow: 0 0 0 1px ${C.accentBorder};
  }

  /* ── Gradient accent line on cards ── */
  .accent-top {
    border-top: 2px solid transparent;
    border-image: linear-gradient(90deg, ${C.accentLight}, ${C.cyan}, ${C.purple}) 1;
  }
`; }