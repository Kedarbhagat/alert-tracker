import { useState, useEffect, useRef } from "react";
import { styles, C, GLOBAL_CSS } from "./styles";
import ManagerDashboard from "./mngr_dash";

const API = "https://alerttracker-ayfwbqbcbvbmh4g3.westeurope-01.azurewebsites.net";

// ── Collapsible Done section for Zendesk tickets ──────────────────────────
function CollapsibleDone({ tickets, renderTicket }) {
  const [open, setOpen] = useState(false);
  const solvedCount = tickets.filter(t => t.status === "solved").length;
  const closedCount = tickets.filter(t => t.status === "closed").length;
  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "#a5b4fc",
          fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: open ? 10 : 0, transition: "all .2s",
        }}
      >
        <span>
          ✔ Done — {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          {solvedCount > 0 && <span style={{ marginLeft: 8, color: "#818cf8" }}>Solved · {solvedCount}</span>}
          {closedCount > 0 && <span style={{ marginLeft: 8, color: "#4ade80" }}>Closed · {closedCount}</span>}
        </span>
        <span style={{ fontSize: 14, transition: "transform .2s", display: "inline-block", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 8 }}>
          {tickets.map(renderTicket)}
        </div>
      )}
    </div>
  );
}

function App() {
  // ── Auth state ───────────────────────────────────────────────────────────
  const [authUser,    setAuthUser]    = useState(null);  // { id, name, email, role }
  const [authLoading, setAuthLoading] = useState(true);
  const [authError,   setAuthError]   = useState(null);
  const [showManager, setShowManager] = useState(false);

  const [agents, setAgents]               = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError]     = useState(null);
  const [pendingAgent, setPendingAgent]   = useState(null);
  const [activeAgentId, setActiveAgentId] = useState(null);

  const monitorOptions = [
    "#CC_ONE_MONITORING", //done
    "#CC-YMS-MONITORING",//done
    "#CC-CARRIER-RATING-ALERTS-KRUNAL",
    "#CC-CARRIER-DISPATCH-ALERT-KRUNAL-NEW", //done
    "#CC-WATCH-OCEAN",   //done
    "CC-GRAINGER-CARRIER-WISE-DISPATCH-ALERTS",
    "#CC-THD-MONITORING", //done
    "#CC-WWEX-CARRIER-WISE-DISPATCH-ALERTS",
    "#CC-ABERCROMBIE-MONITORING", //done
    "#GRAINGER-CREATION-VOLUME-ALERT" , //done
    "#CC_WEATHERFORD_ELITE_MONITORING"//done
,
    "#CC-WATCH-ALL-SERVICES-DOWN ",//done
    
    "#CC-WATCH-STARBUCKS-OBSERVE",
    "Gringer Metric",
    "THD Monitoring",
    "YMS & CC Farming",
    
  ];

  const alertOptionsByMonitor = {
    "#CC_ONE_MONITORING": [
  
      "CAS Internal Server Errors",  //done
      "[Portal v2 Service] - VOC/Movement may be Impacted" , //done
      "0 - Shipment Creation" ,  //done
      "Error: [NA - POV Manager] No/few logs in last 5 minutes triggered", //done
      "[No Data from Correos] - Impacts Alcon Customer" ,//done
      "LTL Tracking Service - 5xx]", //done 
      "Freighthub Errors - Impacting LTL and TL Services" , //done
      "[LTL Tracking Service - 5xx] - LTL Tracking Impacted" , //done
      "[User Service] - User login (mostly SSO) Impacted" ,//done


      "Zero Consumption for Ocean Insights",
      "p44-Camelot Push Monitoring",
     
      "VOC Movement Error",
     
    ],
    "#CC-YMS-MONITORING":[
      "Starbucks YMS Outbound Consumer Reprocessor Errors" , 
      "Starbucks YMS Outbound Consumer Errors" , 
      "Starbucks YMS Inbound Consumer Errors (Connection)" ,
      "Starbucks YMS Inbound Consumer Reprocessor Errors (Ambiguous - Needs Investigation" ,
      "Starbucks Slot Booking UI - 5xx Errors" , 
      "Starbucks YMS Inbound Consumer Errors" , 
      "IFCO YMS Outbound Consumer Reprocessor Errors"

    ] ,  
    "#CC_WEATHERFORD_ELITE_MONITORING":[
      "Weatherford OTM Shipment Creation Failures triggered" ,
    ],
    "#CC-CARRIER-RATING-ALERTS-KRUNAL":[
         

    ],
    
    "#CC-CARRIER-DISPATCH-ALERT-KRUNAL-NEW":[
      "30 min Focused Dispatch Alert" , 
      "60-Min Focused Dispatch Alert" , 

    ] ,
    "CC-GRAINGER-CARRIER-WISE-DISPATCH-ALERTS":[
        
    ] , 
    "#CC-WATCH-OCEAN":[
      "Ocean Carrier Metrics –  Update 1",
      "Ocean Carrier Metrics –  Update 2",
      "Ocean Carrier Metrics –  Update 3",
      "Ocean Carrier Metrics –  Update 4",
      "Ocean Carrier Metrics –  Update 5",
      "Ocean Carrier Metrics –  Update 6",
      "Ocean Carrier Metrics –  Update 7"
    ] ,
    "#GRAINGER-CREATION-VOLUME-ALERT" :[
      "Grainger: Yesterday's Total Shipment Count" , 
      "Grainger: Yesterday's eBOL Shipments Count" , 
      
    ] , 

    "#CC-ABERCROMBIE-MONITORING": [
    "[Sisense SQL Alert] AnF: USPS Untrackable",
    "[Sisense SQL Alert] AnF: DHL Paket Untrackable",
    "[Sisense SQL Alert] AnF: Colissimo Untrackable",
    "[Sisense SQL Alert] AnF: Royal Mail Untrackable",
    "[Sisense SQL Alert] AnF: UPS Untrackable",
    "[Sisense SQL Alert] AnF: International Bridge Creation",
    "[Sisense SQL Alert] AnF: Ontrac-LaserShip Creation" , 
    "other"
],  
     "#CC-THD-MONITORING":[
      "THD - Dashboard Screenshot Reminder {Link}" , 
      "LastMile THD Shipment - other alerts" , 
     ],

     "#CC-WATCH-ALL-SERVICES-DOWN ":[
      "[Sisense SQL Alert] Farmer's Dog - Tracking Alert"
     ] , 
     
     "#CC-WATCH-STARBUCKS-OBSERVE":[
           
     ] , 


    default: [
     
    ],
  };

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [shiftId, setShiftId]             = useState(null);
  const [triagedCount, setTriagedCount]   = useState(0);
  const [zdDoneCount,   setZdDoneCount]     = useState(0);

  // ── On mount: check if already logged in via /.auth/me ──────────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Clean up #token hash if present
        if (window.location.hash.startsWith("#token=")) {
          window.history.replaceState(null, "", window.location.pathname);
        }

        // Check if backend passed email via hash after Azure AD redirect
        // (hash is used so Azure Static Web App auth doesn't intercept the redirect)
        const hash = window.location.hash;
        if (hash.startsWith("#email=")) {
          const emailParam = decodeURIComponent(hash.slice(7));
          window.history.replaceState(null, "", window.location.pathname);
          await verifyWithBackend(emailParam);
          return;
        }

        // Check localStorage for a previously verified session
        const savedEmail = localStorage.getItem("authEmail");
        if (savedEmail) {
          await verifyWithBackend(savedEmail);
          return;
        }
      } catch (e) {
        console.warn("Session check failed:", e);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  const verifyWithBackend = async (email) => {
    setAuthError(null);
    try {
      const res = await fetch(`${API}/manager/auth/verify`, {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setAuthError(data.error || "Your account is not registered. Contact your manager.");
        return;
      }
      setAuthUser(data.user);
      // Persist email so page refresh doesn't require re-login
      localStorage.setItem("authEmail", email);
      // Don't auto-route — let user choose on the landing screen
    } catch (e) {
      setAuthError("Could not verify account: " + e.message);
    }
  };

const handleMicrosoftLogin = () => {
  window.location.href = `${API}/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(API + '/auth-done')}`;
};

  const handleSignOut = () => {
    localStorage.removeItem("authEmail");
    const returnUrl = encodeURIComponent(window.location.origin);
    window.location.href = `${API}/.auth/logout?post_logout_redirect_uri=${returnUrl}`;
  };


  const [zdTickets, setZdTickets]         = useState([]);   // live tickets from Zendesk
  const [zdLoading, setZdLoading]         = useState(false);
  const [zdError, setZdError]             = useState(null);
  const [zdLastFetch, setZdLastFetch]     = useState(null);
  const zdPollRef                         = useRef(null);
  const zdBaselineDone                    = useRef(null); // done count at shift start
  const shiftIdRef                          = useRef(null); // always-current shiftId

  const [selectedMonitor, setSelectedMonitor] = useState("");
  const [selectedAlert, setSelectedAlert]     = useState("");

  // Computed alert options — depends on selectedMonitor state above
  const alertOptions = alertOptionsByMonitor[selectedMonitor] ?? alertOptionsByMonitor["default"];
  const [alertComment, setAlertComment]       = useState("");

  // Alert date/time — default to now, user can override
  const nowIST = () => {
    const now = new Date();
    const ist  = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const pad  = (n) => String(n).padStart(2, "0");
    const date = `${ist.getFullYear()}-${pad(ist.getMonth() + 1)}-${pad(ist.getDate())}`;
    const time = `${pad(ist.getHours())}:${pad(ist.getMinutes())}`;
    return { date, time };
  };
  const [alertDate, setAlertDate] = useState(() => nowIST().date);
  const [alertTime, setAlertTime] = useState(() => nowIST().time);

  const [incidentStatus, setIncidentStatus] = useState("");
  const [adhocTask, setAdhocTask]           = useState("");
  const [dialpadTicket, setDialpadTicket]   = useState("");
  const [dialpadDesc, setDialpadDesc]       = useState("");
  const [showSummary, setShowSummary]       = useState(false);
  const [summaryData, setSummaryData]       = useState(null);

  // New fields: Shift Handover & Maintenance
  const [handoverDescription, setHandoverDescription] = useState("");
  const [handoverTo, setHandoverTo]                   = useState("");
  const [maintenanceLog, setMaintenanceLog]           = useState("");

  // ── Notification bell state ────────────────────────────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const [handovers,         setHandovers]         = useState([]);
  const [handoversLoading,  setHandoversLoading]  = useState(false);
  const [handoversSeen,     setHandoversSeen]     = useState(() => {
    try { return parseInt(localStorage.getItem("handoversSeen") || "0", 10); } catch { return 0; }
  });

  // ── Toast notifications ────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const showToast = (message, type = "success") => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 240);
    }, 3200);
  };

  // ── End shift confirmation ────────────────────────────────────────────────
  const [showEndShiftConfirm, setShowEndShiftConfirm] = useState(false);

  // ── Triage debounce ──────────────────────────────────────────────────────
  const triageUpdating = useRef(false);

  // Keep shiftIdRef in sync so closures always see the latest shiftId
  useEffect(() => {
    shiftIdRef.current = shiftId;
    if (!shiftId) { zdBaselineDone.current = null; }
  }, [shiftId]);

  const fetchHandovers = async () => {
    setHandoversLoading(true);
    try {
      const res = await fetch(`${API}/manager/handovers`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setHandovers(d.handovers || []);
    } catch (e) {
      console.error("Failed to fetch handovers:", e);
    } finally {
      setHandoversLoading(false);
    }
  };

  const openNotifications = () => {
    if (!showNotifications) fetchHandovers();
    setShowNotifications(v => !v);
  };

  const markAllSeen = () => {
    const n = handovers.length;
    setHandoversSeen(n);
    try { localStorage.setItem("handoversSeen", String(n)); } catch {}
  };

  const unseenCount = Math.max(0, handovers.length - handoversSeen);

  // ── Restore session from localStorage ──────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("activeShift");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.agentName && s.shiftId) {
          // Validate with backend that this shift is still actually active
          fetch(`${API}/check-active-shift`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agent_id: s.agentId, agent_name: s.agentName }),
          })
            .then(r => r.json())
            .then(data => {
              if (data.has_active_shift && data.shift_id === s.shiftId) {
                setSelectedAgent(s.agentName);
                setActiveAgentId(s.agentId || null);
                setShiftId(s.shiftId);
                setTriagedCount(data.triaged_count || s.triagedCount || 0);
              } else {
                // Shift is no longer active on the server — clear stale local data
                localStorage.removeItem("activeShift");
              }
            })
            .catch(() => {
              // If check fails, fall back to local data so UI isn't broken on bad network
              setSelectedAgent(s.agentName);
              setActiveAgentId(s.agentId || null);
              setShiftId(s.shiftId);
              setTriagedCount(s.triagedCount || 0);
            });
        }
      } catch {
        localStorage.removeItem("activeShift");
      }
    }
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelectAgent = (agent) => setPendingAgent(agent);

  const handleStartShift = async () => {
    if (!pendingAgent) return;
    const agent = pendingAgent;

    const checkRes  = await fetch(`${API}/check-active-shift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agent.id, agent_name: agent.name }),
    });
    const checkData = await checkRes.json();
    const agentUUID = checkData.agent_id || agent.id;

    let shiftData;
    if (checkData.has_active_shift) {
      shiftData = { shift_id: checkData.shift_id, triaged_count: checkData.triaged_count };
    } else {
      const r  = await fetch(`${API}/start-shift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentUUID }),
      });
      shiftData = await r.json();
    }

    setPendingAgent(null);
    setSelectedAgent(agent.name);
    setActiveAgentId(agent.id);
    setShiftId(shiftData.shift_id);
    setTriagedCount(shiftData.triaged_count || 0);
    localStorage.setItem("activeShift", JSON.stringify({
      agentName: agent.name,
      agentId: agent.id,
      shiftId: shiftData.shift_id,
      triagedCount: shiftData.triaged_count || 0,
    }));
  };

  const updateTriage = async (change) => {
    if (triagedCount <= 0 && change < 0) return;
    if (triageUpdating.current) return;
    triageUpdating.current = true;
    try {
      const res  = await fetch(`${API}/update-triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_id: shiftId, change }),
      });
      const data = await res.json();
      setTriagedCount(data.triaged_count);
    } catch {
      showToast("Failed to update triage count", "error");
    } finally {
      triageUpdating.current = false;
    }
  };

  // ── Zendesk helpers ──────────────────────────────────────────────────────

  const ZD_COLOR = {
    new:     { bg:"rgba(96,165,250,0.12)",  border:"rgba(96,165,250,0.35)",  text:"#60a5fa",  label:"New"     },
    open:    { bg:"rgba(52,211,153,0.12)",  border:"rgba(52,211,153,0.35)",  text:"#34d399",  label:"Open"    },
    pending: { bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.35)",  text:"#fbbf24",  label:"Pending" },
    hold:    { bg:"rgba(192,132,252,0.12)", border:"rgba(192,132,252,0.35)", text:"#c084fc",  label:"On-Hold" },
    solved:  { bg:"rgba(99,102,241,0.12)",  border:"rgba(99,102,241,0.35)",  text:"#818cf8",  label:"Solved — Awaiting Close"  },
    closed:  { bg:"rgba(34,197,94,0.12)",   border:"rgba(34,197,94,0.35)",   text:"#4ade80",  label:"Closed ✔ Done"  },
  };

  const fetchZdByAgent = async (agentName) => {
    setZdLoading(true);
    setZdError(null);
    try {
      const res = await fetch(`${API}/zendesk/tickets-by-agent?name=${encodeURIComponent(agentName)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const incoming = data.tickets || [];

      const DONE_STATUSES = ["solved", "closed"];
      const currentDoneCount = incoming.filter(t => DONE_STATUSES.includes(t.status)).length;

      // Baseline: snapshot done count at shift start so we only count THIS shift
      if (zdBaselineDone.current === null) {
        zdBaselineDone.current = currentDoneCount;
      }
      const doneDuringShift = Math.max(0, currentDoneCount - zdBaselineDone.current);
      setZdDoneCount(doneDuringShift);

      // Persist to DB
      if (shiftIdRef.current) {
        fetch(`${API}/update-zd-count`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shift_id: shiftIdRef.current, count: doneDuringShift }),
        }).catch(() => {});
      }

      setZdTickets(incoming);
      setZdLastFetch(new Date());
    } catch(e) {
      setZdError(e.message);
    } finally {
      setZdLoading(false);
    }
  };

  // Auto-fetch on shift start, then poll every 60s
  useEffect(() => {
    if (!selectedAgent || !shiftId) return;
    fetchZdByAgent(selectedAgent);
    zdPollRef.current = setInterval(() => fetchZdByAgent(selectedAgent), 60000);
    return () => clearInterval(zdPollRef.current);
  }, [selectedAgent, shiftId]);

  const handleAddAlert = async () => {
    if (!selectedMonitor || !selectedAlert) {
      showToast("Please select monitor and alert type", "warning");
      return;
    }
    if (!alertDate || !alertTime) {
      showToast("Please set the alert date and time", "warning");
      return;
    }
    try {
      const res = await fetch(`${API}/add-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id:   shiftId,
          monitor:    selectedMonitor,
          alert_type: selectedAlert,
          comment:    alertComment,
          alert_date: alertDate,
          alert_time: alertTime,
          alert_datetime: `${alertDate}T${alertTime}:00`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Alert logged successfully");
      setSelectedMonitor("");
      setSelectedAlert("");
      setAlertComment("");
      const fresh = nowIST();
      setAlertDate(fresh.date);
      setAlertTime(fresh.time);
    } catch {
      showToast("Failed to log alert", "error");
    }
  };

  const handleSaveIncidentStatus = async () => {
    if (!incidentStatus.trim()) {
      showToast("Please enter incident/status information", "warning");
      return;
    }
    try {
      const res = await fetch(`${API}/add-incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_id: shiftId, description: incidentStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Incident report saved");
      setIncidentStatus("");
    } catch {
      showToast("Failed to save incident report", "error");
    }
  };

  const handleSaveAdhocTask = async () => {
    if (!adhocTask.trim()) {
      showToast("Please enter ad-hoc task information", "warning");
      return;
    }
    try {
      const res = await fetch(`${API}/add-adhoc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_id: shiftId, task: adhocTask }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Ad-hoc task saved");
      setAdhocTask("");
    } catch {
      showToast("Failed to save ad-hoc task", "error");
    }
  };

  const handleSaveDialpad = async () => {
    if (!dialpadTicket.trim()) {
      showToast("Please enter a Dialpad ticket number", "warning");
      return;
    }
    try {
      const res = await fetch(`${API}/add-dialpad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id:      shiftId,
          ticket_number: dialpadTicket.trim(),
          description:   dialpadDesc.trim(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Dialpad ticket saved");
      setDialpadTicket("");
      setDialpadDesc("");
    } catch {
      showToast("Failed to save Dialpad ticket", "error");
    }
  };

  const handleSaveHandover = async () => {
    if (!handoverDescription.trim() || !handoverTo.trim()) {
      showToast("Please enter both handover description and recipient", "warning");
      return;
    }
    try {
      const res = await fetch(`${API}/add-handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_id: shiftId,
          description: handoverDescription,
          handover_to: handoverTo,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Shift handover saved");
      setDialpadTicket("");
    setDialpadDesc("");
    setHandoverDescription("");
      setHandoverTo("");
    } catch {
      showToast("Failed to save handover", "error");
    }
  };

  const handleSaveMaintenance = async () => {
    if (!maintenanceLog.trim()) {
      showToast("Please enter maintenance information", "warning");
      return;
    }
    try {
      const res = await fetch(`${API}/add-maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_id: shiftId, description: maintenanceLog }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast("Maintenance log saved");
      setMaintenanceLog("");
    } catch {
      showToast("Failed to save maintenance log", "error");
    }
  };

  const handleEndShift = async () => {
    try {
      const endRes = await fetch(`${API}/end-shift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_id: shiftId }),
      });
      if (!endRes.ok) throw new Error(`HTTP ${endRes.status}`);
      const res     = await fetch(`${API}/shift-summary/${shiftId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const summary = await res.json();
      setSummaryData(summary);
      setShowSummary(true);
    } catch (e) {
      showToast(`Failed to end shift: ${e.message}`, "error");
    }
  };

  const handleCloseSummary = () => {
    localStorage.removeItem("activeShift");
    setShowSummary(false);
    setSummaryData(null);
    setSelectedAgent(null);
    setActiveAgentId(null);
    setPendingAgent(null);
    setShiftId(null);
    setTriagedCount(0);
    setZdDoneCount(0);
    setZdDoneCount(0);
    setZdTickets([]);
    setIncidentStatus("");
    setAdhocTask("");
    setHandoverDescription("");
    setHandoverTo("");
    setMaintenanceLog("");
    setSelectedMonitor("");
    setSelectedAlert("");
    setAlertComment("");
  };

  const handleManagerToggle = () => setShowManager(v => !v);



  // ── Shared icon colours ─────────────────────────────────────────────────────
  const iconStroke = C.inkMid;

  // ── Auth loading screen ──────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
        <div style={{ width:28, height:28, border:`2px solid ${C.borderLight}`, borderTop:`2px solid ${C.accentLight}`, borderRadius:"50%", animation:"spin .8s linear infinite" }} />
      </div>
    );
  }

  // ── Login screen ────────────────────────────────────────────────────────
  if (!authUser) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',sans-serif" }}>
        <style>{`
          @keyframes spin { to { transform:rotate(360deg); } }
          @keyframes rise { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        `}</style>
        <div style={{
          background:C.surface, border:`1px solid ${C.border}`, borderRadius:16,
          padding:"48px 40px", maxWidth:400, width:"90%", textAlign:"center",
          boxShadow:"0 24px 56px rgba(0,0,0,0.6)", animation:"rise .3s ease",
        }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:32 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"rgba(37,99,235,0.15)", border:`1px solid rgba(37,99,235,0.3)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accentLight} strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontSize:20, fontWeight:700, color:C.ink, letterSpacing:"-0.02em" }}>Project44</span>
          </div>

          <h1 style={{ fontSize:22, fontWeight:700, color:C.ink, margin:"0 0 8px", letterSpacing:"-0.02em" }}>
            Welcome back
          </h1>
          <p style={{ fontSize:13, color:C.inkMid, margin:"0 0 32px", lineHeight:1.6 }}>
            Sign in with your project44 account to access the shift tracker
          </p>

          {authError && (
            <div style={{
              padding:"12px 14px", marginBottom:20,
              background:C.redFaint, border:`1px solid ${C.redBorder}`,
              borderRadius:8, color:C.redText, fontSize:13, textAlign:"left",
              display:"flex", gap:8, alignItems:"flex-start",
            }}>
              <span style={{ flexShrink:0 }}>⚠</span>
              <span>{authError}</span>
            </div>
          )}

          <button
            onClick={handleMicrosoftLogin}
            style={{
              width:"100%", padding:"13px 16px",
              background:"white", color:"#1a1a1a",
              border:"1px solid #d1d5db", borderRadius:8,
              fontSize:14, fontWeight:600, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              fontFamily:"'Inter',sans-serif", transition:"all .15s",
              boxShadow:"0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
              <rect x="0" y="0" width="10" height="10" fill="#f25022"/>
              <rect x="11" y="0" width="10" height="10" fill="#7fba00"/>
              <rect x="0" y="11" width="10" height="10" fill="#00a4ef"/>
              <rect x="11" y="11" width="10" height="10" fill="#ffb900"/>
            </svg>
            Sign in with Microsoft
          </button>

          <p style={{ fontSize:11, color:C.inkLight, marginTop:20 }}>
            Only @project44.com accounts with registered access can sign in
          </p>
        </div>
      </div>
    );
  }



  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={styles.container}>

      {/* ── Toast container ── */}
      <div className="ag-toast-container">
        {toasts.map(t => {
          const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
          return (
            <div key={t.id} className={`ag-toast ag-toast-${t.type}${t.exiting ? " ag-toast-exit" : ""}`}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>{icons[t.type] || "ℹ"}</span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>

      {/* ── End Shift Confirm ── */}
      {showEndShiftConfirm && (
        <div className="ag-confirm-overlay" onClick={() => setShowEndShiftConfirm(false)}>
          <div className="ag-confirm-box" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔚</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>End Shift?</h3>
            <p style={{ fontSize: 13, color: C.inkMid, margin: "0 0 24px", lineHeight: 1.6 }}>
              This will close your current shift and generate a summary. Make sure all activities are saved.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="ag-btn-cancel" onClick={() => setShowEndShiftConfirm(false)}>
                Cancel
              </button>
              <button
                className="ag-btn-confirm"
                style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}
                onClick={() => { setShowEndShiftConfirm(false); handleEndShift(); }}
              >
                End Shift
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes ag-rise { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }
        .ag-card .ag-card-body > label:first-child,
        .ag-card [class*="cardBody"] > label:first-child { margin-top: 0 !important; }
        .ag-card .ag-card-body { display: flex; flex-direction: column; gap: 2px; }
        @media (max-width: 900px) { .ag-grid-3col { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 600px) { .ag-grid-3col { grid-template-columns: 1fr !important; } }
        @keyframes ag-bell-shake {
          0%,100% { transform: rotate(0deg); }
          15%     { transform: rotate(14deg); }
          30%     { transform: rotate(-10deg); }
          45%     { transform: rotate(8deg); }
          60%     { transform: rotate(-5deg); }
          75%     { transform: rotate(3deg); }
        }
        .ag-notif-bell { animation: ag-bell-shake 1.4s ease 0.3s 2; transform-origin: top center; }
        @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Top-right action bar: Bell + Manager toggle ── */}
      <div style={{
        position: "fixed", top: 10, right: 16, zIndex: 9999,
        display: "flex", alignItems: "center", gap: "4px",
        background: "#1c2230",
        border: "1px solid #3d444d",
        borderRadius: "10px",
        padding: "4px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
      }}>

        {/* Bell */}
        <button
          onClick={openNotifications}
          title="Shift Handovers"
          className="ag-action-btn"
          style={{
            position: "relative",
            boxSizing: "border-box",
            width: "36px", height: "36px", borderRadius: "7px",
            background: showNotifications ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.07)",
            border: showNotifications ? "1px solid rgba(59,130,246,0.6)" : "1px solid rgba(255,255,255,0.12)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s, border-color 0.15s",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24"
            fill="none"
            stroke={showNotifications ? "#60a5fa" : "#c9d1d9"}
            strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ display: "block", flexShrink: 0 }}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unseenCount > 0 && (
            <span style={{
              position: "absolute", top: "5px", right: "5px",
              width: "7px", height: "7px",
              background: "#ef4444",
              borderRadius: "50%",
              border: "1.5px solid #1c2230",
              display: "block",
            }} />
          )}
        </button>

        {/* Divider */}
        <div style={{ width: "1px", height: "18px", background: "#3d444d", flexShrink: 0 }} />

        {/* Manager toggle — only visible to managers */}
        {authUser?.role === "manager" && (
        <button
          onClick={handleManagerToggle}
          title={showManager ? "Switch to Agent View" : "Switch to Manager View"}
          className="ag-action-btn"
          style={{
            boxSizing: "border-box",
            width: "36px", height: "36px", borderRadius: "7px",
            background: showManager ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.07)",
            border: showManager ? "1px solid rgba(99,102,241,0.6)" : "1px solid rgba(255,255,255,0.12)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s, border-color 0.15s",
            flexShrink: 0,
          }}
        >
          {showManager ? (
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#a5b4fc" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ display: "block", flexShrink: 0 }}
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#c9d1d9" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ display: "block", flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          )}
        </button>
        )}

      </div>

      {/* ── Notification panel ── */}
      {showNotifications && (
        <div onClick={() => setShowNotifications(false)}
          style={{ position:"fixed", inset:0, zIndex:9997 }} />
      )}
      {showNotifications && (
        <div style={{
          position:"fixed", top:58, right:16, zIndex:9998,
          width:520, maxHeight:680,
          background:"#161b22", border:"1px solid #30363d",
          borderRadius:12, boxShadow:"0 16px 48px rgba(0,0,0,0.8)",
          display:"flex", flexDirection:"column",
          fontFamily:"'Inter',sans-serif",
          animation:"ag-rise .18s ease",
        }}>
          {/* Panel header */}
          <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid #30363d",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span style={{ fontSize:13, fontWeight:700, color:"#e6edf3" }}>Shift Handovers</span>
              {handovers.length > 0 && (
                <span style={{ fontSize:10, color:"#8b949e", background:"#21262d",
                  padding:"1px 7px", borderRadius:99, border:"1px solid #30363d" }}>
                  {handovers.length}
                </span>
              )}
            </div>
            {unseenCount > 0 && (
              <button onClick={(e) => { e.stopPropagation(); markAllSeen(); }}
                style={{ fontSize:11, color:"#3b82f6", background:"none", border:"none",
                  cursor:"pointer", padding:"2px 6px", borderRadius:5,
                  fontFamily:"'Inter',sans-serif" }}>
                Mark all read
              </button>
            )}
          </div>

          {/* Panel body */}
          <div style={{ overflowY:"auto", maxHeight:560 }}>
            {handoversLoading ? (
              <div style={{ padding:32, textAlign:"center", color:"#8b949e", fontSize:12 }}>
                Loading…
              </div>
            ) : handovers.length === 0 ? (
              <div style={{ padding:32, textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
                <div style={{ fontSize:13, color:"#8b949e" }}>No handovers yet</div>
              </div>
            ) : handovers.map((h, i) => (
              <div key={h.id} style={{
                padding:"14px 20px",
                borderBottom: i < handovers.length-1 ? "1px solid #21262d" : "none",
                background: i < unseenCount ? "rgba(37,99,235,0.05)" : "transparent",
                transition:"background .15s",
              }}>
                {/* From / To row */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    {/* Avatar */}
                    <div style={{
                      width:26, height:26, borderRadius:"50%",
                      background:`hsl(${(h.from_name?.charCodeAt(0)||65)*17 % 360},55%,22%)`,
                      border:`1.5px solid hsl(${(h.from_name?.charCodeAt(0)||65)*17 % 360},55%,45%)`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:11, fontWeight:700,
                      color:`hsl(${(h.from_name?.charCodeAt(0)||65)*17 % 360},80%,70%)`,
                    }}>
                      {(h.from_name||"?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontSize:12, fontWeight:600, color:"#e6edf3" }}>{h.from_name}</span>
                      <span style={{ fontSize:11, color:"#6e7681", marginLeft:5 }}>handed over to</span>
                      <span style={{ fontSize:12, fontWeight:600, color:"#3b82f6", marginLeft:5 }}>
                        {h.handover_to}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize:10, color:"#6e7681", whiteSpace:"nowrap", marginLeft:8 }}>
                    {h.created_at
                      ? new Date(h.created_at).toLocaleString("en-IN", {
                          timeZone:"Asia/Kolkata", month:"short", day:"numeric",
                          hour:"2-digit", minute:"2-digit",
                        })
                      : "—"}
                  </span>
                </div>
                {/* Handover note */}
                <div style={{
                  fontSize:12, color:"#8b949e", lineHeight:1.6,
                  background:"#0d1117", borderRadius:6, padding:"10px 12px",
                  border:"1px solid #21262d", marginLeft:32,
                  maxHeight:"260px", overflowY:"auto",
                }}>
                  {(h.description || "").split("\n").filter(line => line.trim()).map((line, li) => (
                    <div key={li} style={{ display:"flex", gap:7, alignItems:"flex-start", marginBottom:5 }}>
                      <span style={{ color:"#3b82f6", fontSize:14, lineHeight:1.3, flexShrink:0 }}>•</span>
                      <span style={{ flex:1, wordBreak:"break-word" }}>{line.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MANAGER VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {showManager ? (
        <ManagerDashboard />

      /* ════════════════════════════════════════════════════════════════════
          LANDING: CHOOSE ACTION
      ════════════════════════════════════════════════════════════════════ */
      ) : !selectedAgent ? (
        <div style={styles.loginWrapper}>
          <div style={styles.loginCard}>
            <div style={styles.loginLogoSection}>
              <div style={{
                width:56, height:56, borderRadius:14,
                background:"rgba(37,99,235,0.12)", border:`1px solid rgba(37,99,235,0.25)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:24, fontWeight:700, color:C.accentLight,
                margin:"0 auto 16px",
              }}>
                {authUser.name.charAt(0).toUpperCase()}
              </div>
              <h1 style={styles.loginCardTitle}>
                {authUser.role === "manager" ? "What would you like to do?" : "Ready to start?"}
              </h1>
              <p style={styles.loginSubtitle}>
                Signed in as <strong style={{ color:C.ink }}>{authUser.name}</strong>
              </p>
              <p style={{ fontSize:12, color:C.inkLight, margin:"4px 0 0" }}>{authUser.email}</p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
              <button
                className="ag-btn-confirm"
                onClick={() => handleSelectAgent(authUser)}
                style={{ width:"100%", padding:"13px 0", fontSize:14 }}
              >
                Start Shift
              </button>

              {authUser.role === "manager" && (
                <button
                  onClick={() => setShowManager(true)}
                  style={{
                    width:"100%", padding:"13px 0", fontSize:14,
                    background:"rgba(99,102,241,0.15)", border:`1px solid rgba(99,102,241,0.4)`,
                    color:"#a5b4fc", borderRadius:8, cursor:"pointer",
                    fontFamily:"'Inter',sans-serif", fontWeight:600,
                  }}
                >
                  Open Manager Dashboard
                </button>
              )}

              <button
                onClick={handleSignOut}
                style={{
                  width:"100%", padding:"11px 0", fontSize:13,
                  background:"transparent", border:`1px solid ${C.border}`,
                  color:C.inkMid, borderRadius:8, cursor:"pointer",
                  fontFamily:"'Inter',sans-serif", fontWeight:500,
                }}
              >
                Sign out
              </button>
            </div>
          </div>

          {/* ── Confirm-Start modal ── */}
          {pendingAgent && (
            <div
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1000,
              }}
              onClick={() => setPendingAgent(null)}
            >
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: "14px",
                  padding: "40px",
                  maxWidth: "380px", width: "90%",
                  boxShadow: "0 24px 56px rgba(0,0,0,0.7)",
                  textAlign: "center",
                  animation: "agent-rise .2s ease",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{
                  width: 60, height: 60, borderRadius: "50%",
                  background: "rgba(37,99,235,0.15)",
                  border: `1px solid ${C.accentBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 700, color: C.accentLight,
                  margin: "0 auto 18px",
                }}>
                  {pendingAgent.name.charAt(0).toUpperCase()}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 6, marginTop: 0 }}>
                  {pendingAgent.name}
                </h2>
                <p style={{ fontSize: 13, color: C.inkMid, marginBottom: 28, marginTop: 0 }}>
                  {pendingAgent?.is_active && pendingAgent?.id === activeAgentId
                    ? "Resume your active shift?"
                    : "Ready to start your shift?"}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="ag-btn-cancel" onClick={() => setPendingAgent(null)}>
                    Cancel
                  </button>
                  <button className="ag-btn-confirm" onClick={handleStartShift}>
                    {pendingAgent?.is_active && pendingAgent?.id === activeAgentId
                      ? "Resume Shift"
                      : "Start Shift"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      /* ════════════════════════════════════════════════════════════════════
          SHIFT SUMMARY
      ════════════════════════════════════════════════════════════════════ */
      ) : showSummary ? (
        <div style={styles.summaryWrapper}>
          <div style={styles.summaryContainer}>
            {!summaryData ? (
              <div style={{ textAlign: "center", padding: "80px", color: C.inkMid }}>Loading summary…</div>
            ) : (<>

            {/* Summary header */}
            <div style={styles.summaryHeader}>
              <h1 style={styles.summaryTitle}>Shift Complete ✓</h1>
              <p style={styles.summarySubtitle}>
                {selectedAgent} &nbsp;·&nbsp;{" "}
                {new Date(summaryData.start_time).toLocaleString()} — {new Date(summaryData.end_time).toLocaleString()}
              </p>

              <div style={styles.summaryStats}>
                {[
                  { label: "Triaged",    value: summaryData.triaged_count    },
                  { label: "Tickets",    value: summaryData.ticket_count     },
                  { label: "Alerts",     value: summaryData.alert_count      },
                  { label: "Incidents",  value: summaryData.incident_count   },
                  { label: "Ad-hoc",     value: summaryData.adhoc_count      },
                  { label: "Handovers",  value: summaryData.handover_count   },
                  { label: "Maintenance",value: summaryData.maintenance_count},
                ].map(({ label, value }) => (
                  <div key={label} style={styles.statCard}>
                    <div style={styles.statValue}>{value ?? 0}</div>
                    <div style={styles.statLabel}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tickets */}
            {summaryData.tickets?.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accentLight} strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  Tickets Handled ({summaryData.tickets.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.tickets.map((ticket, i) => (
                    <div key={i} className="ag-summary-item">
                      <div style={styles.itemHeader}>
                        <span style={{ ...styles.itemTitle, fontFamily: "'JetBrains Mono',monospace", color: C.accentLight }}>
                          #{ticket.number}
                        </span>
                        <span style={styles.itemTime}>{new Date(ticket.created_at).toLocaleTimeString()}</span>
                      </div>
                      {ticket.description && <div style={styles.itemDescription}>{ticket.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            {summaryData.alerts?.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.amberText} strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  Alerts Logged ({summaryData.alerts.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.alerts.map((alert, i) => (
                    <div key={i} className="ag-summary-item" style={{ borderLeftColor: C.amberText }}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>{alert.monitor} — {alert.type}</span>
                        <span style={styles.itemTime}>{new Date(alert.created_at).toLocaleTimeString()}</span>
                      </div>
                      {alert.comment && <div style={styles.itemDescription}>{alert.comment}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incidents */}
            {summaryData.incidents?.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.redText} strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Incidents Reported ({summaryData.incidents.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.incidents.map((incident, i) => (
                    <div key={i} className="ag-summary-item" style={{ borderLeftColor: C.redText }}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>Incident #{i + 1}</span>
                        <span style={styles.itemTime}>{new Date(incident.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={styles.itemDescription}>{incident.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ad-hoc tasks */}
            {summaryData.adhoc_tasks?.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.greenText} strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  Ad-hoc Tasks ({summaryData.adhoc_tasks.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.adhoc_tasks.map((task, i) => (
                    <div key={i} className="ag-summary-item" style={{ borderLeftColor: C.greenText }}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>Task #{i + 1}</span>
                        <span style={styles.itemTime}>{new Date(task.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={styles.itemDescription}>{task.task}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shift Handovers */}
            {summaryData.handovers?.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.indigo} strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <polyline points="17 11 19 13 23 9"/>
                  </svg>
                  Shift Handovers ({summaryData.handovers.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.handovers.map((handover, i) => (
                    <div key={i} className="ag-summary-item" style={{ borderLeftColor: C.indigo }}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>Handover #{i + 1}</span>
                        <span style={styles.itemTime}>{new Date(handover.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={styles.itemDescription}>
                        <div style={{ marginBottom: 6 }}><strong>To:</strong> {handover.handover_to}</div>
                        <div>{handover.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance Logs */}
            {summaryData.maintenance?.length > 0 && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.inkMid} strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                  Maintenance Logs ({summaryData.maintenance.length})
                </h2>
                <div style={styles.itemList}>
                  {summaryData.maintenance.map((log, i) => (
                    <div key={i} className="ag-summary-item" style={{ borderLeftColor: C.inkMid }}>
                      <div style={styles.itemHeader}>
                        <span style={styles.itemTitle}>Log #{i + 1}</span>
                        <span style={styles.itemTime}>{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div style={styles.itemDescription}>{log.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!summaryData.tickets?.length &&
             !summaryData.alerts?.length &&
             !summaryData.incidents?.length &&
             !summaryData.adhoc_tasks?.length &&
             !summaryData.handovers?.length &&
             !summaryData.maintenance?.length &&
             summaryData.triaged_count === 0 && (
              <div style={styles.summarySection}>
                <div style={styles.emptyState}>No activities recorded during this shift.</div>
              </div>
            )}

            <div style={styles.summaryActions}>
              <button className="ag-btn-summary" onClick={handleCloseSummary}>
                Start New Shift
              </button>
            </div>
            </>)}
          </div>
        </div>

      /* ════════════════════════════════════════════════════════════════════
          MAIN SHIFT DASHBOARD
      ════════════════════════════════════════════════════════════════════ */
      ) : (
        <div style={styles.mainLayout}>

          {/* ── Header ── */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.headerIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <h2 style={styles.headerTitle}>Shift Dashboard</h2>
                <p style={styles.headerSubtitle}>
                  Agent: <span style={{ color: C.accentLight, fontWeight: 600 }}>{selectedAgent}</span>
                </p>
              </div>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.statusBadge}>
                <div style={styles.statusDot} />
                Active Shift
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div style={styles.content}>

            {/* Triage counter */}
            <div style={styles.metricsRow}>
              <div style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <span style={styles.metricLabel}>Closed Tickets</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div style={styles.counterWrapper}>
                  <button className="ag-counter-btn" onClick={() => updateTriage(-1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <span style={styles.counterValue}>{triagedCount}</span>
                  <button className="ag-counter-btn" onClick={() => updateTriage(1)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tickets Handled — Zendesk */}
              <div style={styles.metricCard}>
                <div style={styles.metricHeader}>
                  <span style={styles.metricLabel}>Tickets Handled</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="9" y1="13" x2="15" y2="13"/>
                  </svg>
                </div>
                <div style={{ ...styles.counterWrapper, justifyContent: "center" }}>
                  <span style={{ ...styles.counterValue, color: zdDoneCount > 0 ? "#4ade80" : undefined }}>
                    {zdDoneCount}
                  </span>
                </div>
                <div style={{ textAlign: "center", fontSize: 10, color: "#6e7681", marginTop: 4 }}>
                  solved/closed this shift
                </div>
              </div>
            </div>

            {/* ── 2×2 card grid ── */}
            <div style={styles.gridLayout} className="ag-grid-3col">

              {/* Ticket Management — Zendesk Live */}
              <div className="ag-card" style={{ gridColumn: "1 / -1" }}>
                <div className="ag-card-header">
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <h3 style={styles.cardTitle}>Zendesk Tickets</h3>
                    {zdLastFetch && (
                      <span style={{ fontSize:11, color:C.inkLight, fontFamily:"'JetBrains Mono',monospace" }}>
                        refreshed {zdLastFetch.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {/* Live pulse */}
                    {!zdLoading && (
                      <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.greenText }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:C.greenText, display:"inline-block", animation:"pulse 2s infinite" }}/>
                        Live
                      </span>
                    )}
                    {zdLoading && (
                      <div style={{ width:16, height:16, border:`2px solid ${C.border}`, borderTop:`2px solid ${C.accentLight}`, borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
                    )}
                    <button
                      onClick={() => fetchZdByAgent(selectedAgent)}
                      disabled={zdLoading}
                      style={{ all:"unset", cursor:"pointer", padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, fontSize:11, color:C.inkMid, fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                    >
                      ↻ Refresh
                    </button>
                  </div>
                </div>

                <div style={{ padding:"16px 20px" }}>
                  {/* Error */}
                  {zdError && (
                    <div style={{ padding:"10px 14px", background:C.redFaint, border:`1px solid ${C.redBorder}`, borderRadius:8, color:C.redText, fontSize:13, marginBottom:12 }}>
                      ⚠ Could not load tickets: {zdError}
                    </div>
                  )}

                  {/* Loading skeleton */}
                  {zdLoading && zdTickets.length === 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {[1,2,3].map(i => (
                        <div key={i} style={{ height:56, borderRadius:8, background:`linear-gradient(90deg, ${C.raised} 25%, ${C.border} 50%, ${C.raised} 75%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite" }}/>
                      ))}
                    </div>
                  )}

                  {/* Empty */}
                  {!zdLoading && !zdError && zdTickets.length === 0 && (
                    <div style={{ textAlign:"center", padding:"32px 0", color:C.inkLight, fontSize:13 }}>
                      No tickets assigned to <strong style={{ color:C.inkMid }}>{selectedAgent}</strong> in Zendesk
                    </div>
                  )}

                  {/* Ticket grid */}
                  {zdTickets.length > 0 && (() => {
                    const ACTIVE = ["open","new","pending","hold"];
                    const openTickets   = zdTickets.filter(t => ACTIVE.includes(t.status));
                    const doneTickets   = zdTickets.filter(t => t.status === "solved" || t.status === "closed");
                    const renderTicket = (t) => {
                      const sc = ZD_COLOR[t.status] || ZD_COLOR.open;
                      return (
                        <div key={t.id} style={{
                          background: C.raised,
                          border: `1px solid ${["solved","closed"].includes(t.status) ? sc.border : C.border}`,
                          borderLeft: `3px solid ${sc.text}`,
                          borderRadius:8, padding:"12px 16px",
                          opacity: t.status === "closed" ? 0.65 : 1,
                          transition:"all .2s",
                        }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                                <span style={{ fontSize:12, fontWeight:700, color:C.accentLight, fontFamily:"'JetBrains Mono',monospace" }}>
                                  #{t.id}
                                </span>
                                <span style={{ padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700, background:sc.bg, border:`1px solid ${sc.border}`, color:sc.text }}>
                                  {sc.label}
                                </span>
                                {t.priority && t.priority !== "normal" && (
                                  <span style={{ padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:600, background:C.amberFaint, border:`1px solid ${C.amberBorder}`, color:C.amberText }}>
                                    {t.priority}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize:13, color:C.ink, fontWeight:500, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {t.subject}
                              </div>
                              <div style={{ fontSize:11, color:C.inkLight }}>
                                {t.requester && <span>👤 {t.requester} &nbsp;·&nbsp; </span>}
                                {t.updated_at && <span>🕒 {new Date(t.updated_at).toLocaleString("en-IN", { timeZone:"Asia/Kolkata", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    };
                    return (
                      <div>
                        {/* Summary bar */}
                        <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
                          {Object.entries(
                            zdTickets.reduce((acc, t) => { acc[t.status] = (acc[t.status]||0)+1; return acc; }, {})
                          ).map(([status, count]) => {
                            const sc = ZD_COLOR[status] || ZD_COLOR.open;
                            return (
                              <span key={status} style={{ padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:700, background:sc.bg, border:`1px solid ${sc.border}`, color:sc.text }}>
                                {sc.label || status} · {count}
                              </span>
                            );
                          })}
                          <span style={{ marginLeft:"auto", fontSize:11, color:C.inkLight }}>{zdTickets.length} total</span>
                        </div>

                        {/* Active tickets */}
                        {openTickets.length > 0 && (
                          <>
                            <div style={{ fontSize:10, fontWeight:700, color:C.inkLight, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
                              In Progress ({openTickets.length})
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:8, marginBottom:16 }}>
                              {openTickets.map(renderTicket)}
                            </div>
                          </>
                        )}

                        {/* Solved + Closed — collapsible */}
                        {doneTickets.length > 0 && (
                          <CollapsibleDone tickets={doneTickets} renderTicket={renderTicket} />
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Alert Logging */}
              <div className="ag-card">
                <div className="ag-card-header">
                  <h3 style={styles.cardTitle}>Alert Logging</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.amberText} strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>

                  {/* Date + Time row */}
                  <label style={styles.label}>Alert Date &amp; Time</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={C.inkMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <input
                        type="date"
                        value={alertDate}
                        onChange={(e) => setAlertDate(e.target.value)}
                        className="ag-input"
                        style={{ paddingLeft: "32px", colorScheme: "dark" }}
                      />
                    </div>
                    <div style={{ position: "relative", flex: 1 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke={C.inkMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <input
                        type="time"
                        value={alertTime}
                        onChange={(e) => setAlertTime(e.target.value)}
                        className="ag-input"
                        style={{ paddingLeft: "32px", colorScheme: "dark" }}
                      />
                    </div>
                  </div>

                  <label style={styles.label}>Monitor Type</label>
                  <select
                    value={selectedMonitor}
                    onChange={(e) => { setSelectedMonitor(e.target.value); setSelectedAlert(""); }}
                    className="ag-input"
                  >
                    <option value="">Select monitor…</option>
                    {monitorOptions.map((m, i) => (
                      <option key={i} value={m}>{m}</option>
                    ))}
                  </select>

                  <label style={styles.label}>Alert Type</label>
                  <select
                    value={selectedAlert}
                    onChange={(e) => setSelectedAlert(e.target.value)}
                    className="ag-input"
                  >
                    <option value="">Select alert type…</option>
                    {alertOptions.map((a, i) => (
                      <option key={i} value={a}>{a}</option>
                    ))}
                  </select>

                  <label style={styles.label}>Alert Details</label>
                  <textarea
                    rows="3"
                    placeholder="Provide detailed information about the alert…"
                    value={alertComment}
                    onChange={(e) => setAlertComment(e.target.value)}
                    className="ag-input"
                  />

                  <button className="ag-btn-alert" onClick={handleAddAlert}>
                    Log Alert
                  </button>
                </div>
              </div>

              {/* Incident Reporting */}
              <div className="ag-card">
                <div className="ag-card-header">
                  <h3 style={styles.cardTitle}>Incident Reporting</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.redText} strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Incident Description</label>
                  <textarea
                    rows="6"
                    placeholder="Document incident details, status updates, or relevant information…"
                    value={incidentStatus}
                    onChange={(e) => setIncidentStatus(e.target.value)}
                    className="ag-input"
                  />
                  <button className="ag-btn-primary" onClick={handleSaveIncidentStatus}>
                    Save Incident Report
                  </button>
                </div>
              </div>

              {/* Ad-hoc Tasks */}
              <div className="ag-card">
                <div className="ag-card-header">
                  <h3 style={styles.cardTitle}>Ad-hoc Tasks</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.greenText} strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Task Description</label>
                  <textarea
                    rows="6"
                    placeholder="Document any ad-hoc tasks or special assignments…"
                    value={adhocTask}
                    onChange={(e) => setAdhocTask(e.target.value)}
                    className="ag-input"
                  />
                  <button className="ag-btn-primary" onClick={handleSaveAdhocTask}>
                    Save Ad-hoc Task
                  </button>
                </div>
              </div>

              {/* Dialpad Tickets */}
              <div className="ag-card">
                <div className="ag-card-header">
                  <h3 style={styles.cardTitle}>Dialpad</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accentLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Ticket Number</label>
                  <input
                    type="text"
                    placeholder="Enter Dialpad ticket number…"
                    value={dialpadTicket}
                    onChange={(e) => setDialpadTicket(e.target.value)}
                    className="ag-input"
                  />
                  <label style={styles.label}>Description</label>
                  <textarea
                    rows="4"
                    placeholder="Describe the Dialpad ticket or call details…"
                    value={dialpadDesc}
                    onChange={(e) => setDialpadDesc(e.target.value)}
                    className="ag-input"
                  />
                  <button className="ag-btn-primary" onClick={handleSaveDialpad}>
                    Save Dialpad Ticket
                  </button>
                </div>
              </div>

              {/* Shift Handover */}
              <div className="ag-card">
                <div className="ag-card-header">
                  <h3 style={styles.cardTitle}>Shift Handover</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.indigo} strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <polyline points="17 11 19 13 23 9"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Shift Summary</label>
                  <textarea
                    rows="4"
                    placeholder="Describe your shift activities and key points to handover…"
                    value={handoverDescription}
                    onChange={(e) => setHandoverDescription(e.target.value)}
                    className="ag-input"
                  />
                  <label style={styles.label}>Handing Over To</label>
                  <input
                    type="text"
                    placeholder="Next agent's name or ID…"
                    value={handoverTo}
                    onChange={(e) => setHandoverTo(e.target.value)}
                    className="ag-input"
                  />
                  <button className="ag-btn-primary" onClick={handleSaveHandover}>
                    Save Handover
                  </button>
                </div>
              </div>

              {/* Maintenance Log */}
              <div className="ag-card">
                <div className="ag-card-header">
                  <h3 style={styles.cardTitle}>Maintenance Log</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.inkMid} strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
                <div style={styles.cardBody}>
                  <label style={styles.label}>Maintenance Description</label>
                  <textarea
                    rows="6"
                    placeholder="Document maintenance activities, system updates, or infrastructure changes…"
                    value={maintenanceLog}
                    onChange={(e) => setMaintenanceLog(e.target.value)}
                    className="ag-input"
                  />
                  <button className="ag-btn-primary" onClick={handleSaveMaintenance}>
                    Save Maintenance Log
                  </button>
                </div>
              </div>

            </div>{/* /gridLayout */}

            {/* ── Footer ── */}
            <div style={styles.actionsFooter}>
              <button className="ag-btn-end" onClick={() => setShowEndShiftConfirm(true)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                End Shift
              </button>
            </div>

          </div>{/* /content */}
        </div>
      )}  
    </div>
  );
}

export default App;