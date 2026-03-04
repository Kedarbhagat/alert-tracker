"""
Manager routes  —  /manager/active-agents, /manager/shifts, /manager/analytics,
                   /manager/agent-stats, /manager/shift-details,
                   /manager/advanced-analytics, /manager/agent-detail,
                   /manager/handovers
"""
import statistics
from datetime import datetime, timedelta, date as _date

from flask import Blueprint, request, jsonify
from config import get_conn, release_conn, fmt_ist

manager_bp = Blueprint("manager", __name__, url_prefix="/manager")


# ── shared date-range helper ───────────────────────────────────────────────

def _resolve_date_range():
    """
    Priority: start_date + end_date  >  days param  >  default 30 days.
    Returns (date_from, date_to_inclusive_str) or raises ValueError.
    """
    start = request.args.get("start_date")
    end   = request.args.get("end_date")
    days  = request.args.get("days")
    today = _date.today()

    if start and end:
        date_from = datetime.strptime(start, "%Y-%m-%d").date()
        date_to   = datetime.strptime(end,   "%Y-%m-%d").date()
    else:
        n         = int(days) if days and days.isdigit() else 30
        date_from = today - timedelta(days=n)
        date_to   = today

    return date_from, f"{date_to} 23:59:59"


def _db():
    conn = get_conn()
    if not conn:
        return None, (jsonify({"error": "Database connection failed"}), 500)
    return conn, None


# ── active agents ──────────────────────────────────────────────────────────

@manager_bp.route("/active-agents", methods=["GET", "OPTIONS"])
def get_active_agents():
    if request.method == "OPTIONS":
        return "", 200

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT s.id, s.agent_id, s.login_time, s.triaged_count,
                   EXTRACT(EPOCH FROM (NOW() - s.login_time))/3600 AS hours_active,
                   COALESCE(ag.name, 'Unknown Agent') AS agent_name
            FROM shifts s
            LEFT JOIN agents ag ON s.agent_id = ag.id
            WHERE s.logout_time IS NULL
            ORDER BY s.login_time DESC;
        """)
        rows = cur.fetchall()
        cur.close()

        return jsonify({
            "active_agents": [
                {
                    "shift_id":    str(r[0]),
                    "agent_id":    str(r[1]),
                    "agent_name":  r[5],
                    "login_time":  fmt_ist(r[2]),
                    "triaged_count": r[3] or 0,
                    "hours_active":  round(float(r[4] or 0), 2),
                }
                for r in rows
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


# ── shifts list ────────────────────────────────────────────────────────────

@manager_bp.route("/shifts", methods=["GET", "OPTIONS"])
def get_shifts():
    if request.method == "OPTIONS":
        return "", 200

    start_date = request.args.get("start_date")
    end_date   = request.args.get("end_date")
    agent_id   = request.args.get("agent_id")

    conn, err = _db()
    if err:
        return err

    try:
        cur    = conn.cursor()
        query  = """
            SELECT s.id, s.agent_id, s.login_time, s.logout_time, s.triaged_count,
                   EXTRACT(EPOCH FROM (COALESCE(s.logout_time, NOW()) - s.login_time))/3600 AS duration_hours,
                   COALESCE(ag.name, 'Unknown Agent') AS agent_name
            FROM shifts s
            LEFT JOIN agents ag ON s.agent_id = ag.id
            WHERE 1=1
        """
        params = []

        if start_date:
            query += " AND s.login_time >= %s"
            params.append(start_date)
        if end_date:
            query += " AND s.login_time <= %s"
            params.append(end_date + " 23:59:59")
        if agent_id:
            query += " AND ag.name ILIKE %s"
            params.append(f"%{agent_id}%")

        query += " ORDER BY s.login_time DESC LIMIT 1000;"
        cur.execute(query, params)
        rows = cur.fetchall()
        cur.close()

        return jsonify({
            "shifts": [
                {
                    "id":             str(r[0]),
                    "agent_id":       str(r[1]),
                    "agent_name":     r[6],
                    "login_time":     fmt_ist(r[2]),
                    "logout_time":    fmt_ist(r[3]),
                    "triaged_count":  r[4] or 0,
                    "duration_hours": round(float(r[5] or 0), 2),
                }
                for r in rows
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


# ── overview analytics ─────────────────────────────────────────────────────

@manager_bp.route("/analytics", methods=["GET", "OPTIONS"])
def get_analytics():
    if request.method == "OPTIONS":
        return "", 200

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()

        def scalar(sql, params=()):
            cur.execute(sql, params)
            return cur.fetchone()[0]

        def row(sql, params=()):
            cur.execute(sql, params)
            return cur.fetchone()

        active_now    = scalar("SELECT COUNT(*) FROM shifts WHERE logout_time IS NULL;")
        today         = row("SELECT COUNT(DISTINCT agent_id), COUNT(*), COALESCE(SUM(triaged_count),0) FROM shifts WHERE DATE(login_time) = CURRENT_DATE;")
        week          = row("SELECT COUNT(DISTINCT agent_id), COUNT(*), COALESCE(SUM(triaged_count),0) FROM shifts WHERE login_time >= DATE_TRUNC('week', CURRENT_DATE);")
        month         = row("SELECT COUNT(DISTINCT agent_id), COUNT(*), COALESCE(SUM(triaged_count),0) FROM shifts WHERE login_time >= DATE_TRUNC('month', CURRENT_DATE);")
        avg_prod      = scalar("""
            SELECT AVG(triaged_count / NULLIF(EXTRACT(EPOCH FROM (COALESCE(logout_time,NOW()) - login_time))/3600, 0))
            FROM shifts WHERE logout_time IS NOT NULL
            AND EXTRACT(EPOCH FROM (logout_time - login_time))/3600 > 0.5
            AND login_time >= CURRENT_DATE - INTERVAL '30 days';
        """)
        alerts_today  = scalar("SELECT COUNT(*) FROM alerts WHERE DATE(created_at) = CURRENT_DATE;")
        tickets_today = scalar("SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURRENT_DATE;")
        dialpad_today = scalar("SELECT COUNT(*) FROM dialpad_tickets WHERE DATE(created_at) = CURRENT_DATE;")

        cur.close()
        return jsonify({
            "active_now":      active_now,
            "today":           {"agents_active": today[0] or 0,  "total_shifts": today[1] or 0,  "cases_triaged": today[2] or 0},
            "week":            {"agents_active": week[0] or 0,   "total_shifts": week[1] or 0,   "cases_triaged": week[2] or 0},
            "month":           {"agents_active": month[0] or 0,  "total_shifts": month[1] or 0,  "cases_triaged": month[2] or 0},
            "avg_productivity": round(float(avg_prod or 0), 2),
            "alerts_today":    alerts_today  or 0,
            "tickets_today":   tickets_today or 0,
            "dialpad_today":   dialpad_today or 0,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


# ── agent stats ────────────────────────────────────────────────────────────

@manager_bp.route("/agent-stats/<agent_id>", methods=["GET", "OPTIONS"])
def get_agent_stats(agent_id):
    if request.method == "OPTIONS":
        return "", 200

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()

        cur.execute("SELECT COALESCE(name, 'Unknown Agent') FROM agents WHERE id = %s;", (agent_id,))
        result     = cur.fetchone()
        agent_name = result[0] if result else "Unknown Agent"

        cur.execute("SELECT COUNT(*) FROM shifts WHERE agent_id = %s;", (agent_id,))
        total_shifts = cur.fetchone()[0]

        cur.execute("SELECT COALESCE(SUM(triaged_count), 0) FROM shifts WHERE agent_id = %s;", (agent_id,))
        total_triaged = cur.fetchone()[0]

        cur.execute("""
            SELECT id, login_time, logout_time, triaged_count,
                   EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600 AS duration_hours
            FROM shifts WHERE agent_id = %s
            ORDER BY login_time DESC LIMIT 10;
        """, (agent_id,))
        recent_shifts = [
            {
                "id":             str(r[0]),
                "login_time":     fmt_ist(r[1]),
                "logout_time":    fmt_ist(r[2]),
                "triaged_count":  r[3] or 0,
                "duration_hours": round(float(r[4] or 0), 2),
            }
            for r in cur.fetchall()
        ]
        cur.close()

        return jsonify({
            "agent_id":     agent_id,
            "agent_name":   agent_name,
            "total_shifts": total_shifts,
            "total_triaged": total_triaged,
            "avg_per_shift": round(total_triaged / total_shifts, 2) if total_shifts else 0,
            "recent_shifts": recent_shifts,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


# ── shift details ──────────────────────────────────────────────────────────

@manager_bp.route("/shift-details/<shift_id>", methods=["GET", "OPTIONS"])
def get_shift_details(shift_id):
    if request.method == "OPTIONS":
        return "", 200

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()

        cur.execute("""
            SELECT s.agent_id, s.login_time, s.logout_time, s.triaged_count,
                   COALESCE(ag.name, 'Unknown Agent') AS agent_name
            FROM shifts s LEFT JOIN agents ag ON s.agent_id = ag.id
            WHERE s.id = %s;
        """, (shift_id,))
        shift = cur.fetchone()
        if not shift:
            return jsonify({"error": "Shift not found"}), 404

        def fetch(sql):
            cur.execute(sql, (shift_id,))
            return cur.fetchall()

        tickets = [
            {"number": r[0], "description": r[1], "created_at": fmt_ist(r[2])}
            for r in fetch("SELECT ticket_number, description, created_at FROM tickets WHERE shift_id = %s ORDER BY created_at;")
        ]
        alerts = [
            {"monitor": r[0], "type": r[1], "comment": r[2], "created_at": fmt_ist(r[3])}
            for r in fetch("SELECT monitor, alert_type, comment, created_at FROM alerts WHERE shift_id = %s ORDER BY created_at;")
        ]
        incidents = [
            {"description": r[0], "created_at": fmt_ist(r[1])}
            for r in fetch("SELECT description, created_at FROM incident_status WHERE shift_id = %s ORDER BY created_at;")
        ]
        adhoc_tasks = [
            {"task": r[0], "created_at": fmt_ist(r[1])}
            for r in fetch("SELECT task, created_at FROM adhoc_tasks WHERE shift_id = %s ORDER BY created_at;")
        ]
        handovers = [
            {"description": r[0], "handover_to": r[1], "created_at": fmt_ist(r[2])}
            for r in fetch("SELECT description, handover_to, created_at FROM handovers WHERE shift_id = %s ORDER BY created_at;")
        ]
        maintenance = [
            {"description": r[0], "created_at": fmt_ist(r[1])}
            for r in fetch("SELECT description, created_at FROM maintenance_logs WHERE shift_id = %s ORDER BY created_at;")
        ]
        dialpad_tickets = [
            {"ticket_number": r[0], "description": r[1], "created_at": fmt_ist(r[2])}
            for r in fetch("SELECT ticket_number, description, created_at FROM dialpad_tickets WHERE shift_id = %s ORDER BY created_at;")
        ]
        cur.close()

        return jsonify({
            "agent_id":       str(shift[0]),
            "agent_name":     shift[4],
            "login_time":     fmt_ist(shift[1]),
            "logout_time":    fmt_ist(shift[2]),
            "triaged_count":  shift[3] or 0,
            "tickets":        tickets,
            "alerts":         alerts,
            "incidents":      incidents,
            "adhoc_tasks":    adhoc_tasks,
            "handovers":      handovers,
            "maintenance":    maintenance,
            "dialpad_tickets": dialpad_tickets,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


# ── advanced analytics ─────────────────────────────────────────────────────

@manager_bp.route("/advanced-analytics", methods=["GET", "OPTIONS"])
def get_advanced_analytics():
    if request.method == "OPTIONS":
        return "", 200

    try:
        date_from, date_to_inclusive = _resolve_date_range()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        p   = (date_from, date_to_inclusive)  # shorthand params

        # Performance trends
        cur.execute("""
            SELECT DATE(login_time), COUNT(DISTINCT agent_id), COUNT(*),
                   COALESCE(SUM(triaged_count), 0), COALESCE(AVG(triaged_count), 0)
            FROM shifts WHERE login_time >= %s AND login_time <= %s
            GROUP BY DATE(login_time) ORDER BY 1;
        """, p)
        performance_trends = [
            {"date": str(r[0]), "agents": r[1], "shifts": r[2],
             "total_triaged": r[3] or 0, "avg_triaged": round(float(r[4] or 0), 2)}
            for r in cur.fetchall()
        ]

        # Agent rankings
        cur.execute("""
            SELECT s.agent_id, COALESCE(ag.name,'Unknown Agent'),
                   COUNT(DISTINCT s.id), COALESCE(SUM(s.triaged_count),0),
                   COALESCE(AVG(s.triaged_count),0),
                   COALESCE(AVG(s.triaged_count / NULLIF(EXTRACT(EPOCH FROM (COALESCE(s.logout_time,NOW()) - s.login_time))/3600,0)),0),
                   COUNT(DISTINCT t.id), COUNT(DISTINCT a.id), COUNT(DISTINCT i.id),
                   COUNT(DISTINCT ad.id),
                   COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(s.logout_time,NOW()) - s.login_time))/3600),0),
                   COUNT(DISTINCT dp.id)
            FROM shifts s
            LEFT JOIN tickets          t  ON t.shift_id  = s.id
            LEFT JOIN alerts           a  ON a.shift_id  = s.id
            LEFT JOIN incident_status  i  ON i.shift_id  = s.id
            LEFT JOIN adhoc_tasks      ad ON ad.shift_id = s.id
            LEFT JOIN dialpad_tickets  dp ON dp.shift_id = s.id
            LEFT JOIN agents           ag ON ag.id       = s.agent_id
            WHERE s.login_time >= %s AND s.login_time <= %s
            GROUP BY s.agent_id, ag.name
            HAVING COUNT(DISTINCT s.id) >= 1
            ORDER BY 6 DESC;
        """, p)
        agent_rankings = [
            {
                "rank": idx + 1, "agent_id": str(r[0]), "agent_name": r[1],
                "shift_count": r[2], "total_triaged": int(r[3] or 0),
                "avg_triaged": round(float(r[4] or 0), 2),
                "productivity_rate": round(float(r[5] or 0), 2),
                "total_tickets": int(r[6] or 0), "total_alerts": int(r[7] or 0),
                "total_incidents": int(r[8] or 0), "total_adhoc": int(r[9] or 0),
                "avg_shift_hours": round(float(r[10] or 0), 2),
                "total_dialpad": int(r[11] or 0),
            }
            for idx, r in enumerate(cur.fetchall())
        ]

        # Hourly distribution
        cur.execute("""
            SELECT EXTRACT(HOUR FROM login_time), COUNT(*),
                   COALESCE(SUM(triaged_count),0), COALESCE(AVG(triaged_count),0)
            FROM shifts WHERE login_time >= %s AND login_time <= %s
            GROUP BY 1 ORDER BY 1;
        """, p)
        hourly_distribution = [
            {"hour": int(r[0]), "shift_count": r[1],
             "total_triaged": r[2] or 0, "avg_triaged": round(float(r[3] or 0), 2)}
            for r in cur.fetchall()
        ]

        # Daily distribution
        DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
        cur.execute("""
            SELECT EXTRACT(DOW FROM login_time), COUNT(*),
                   COALESCE(SUM(triaged_count),0), COALESCE(AVG(triaged_count),0),
                   COUNT(DISTINCT agent_id)
            FROM shifts WHERE login_time >= %s AND login_time <= %s
            GROUP BY 1 ORDER BY 1;
        """, p)
        daily_distribution = [
            {"day_of_week": int(r[0]), "day_name": DAY_NAMES[int(r[0])],
             "shift_count": r[1], "total_triaged": r[2] or 0,
             "avg_triaged": round(float(r[3] or 0), 2), "unique_agents": r[4]}
            for r in cur.fetchall()
        ]

        # Alert analysis
        cur.execute("""
            SELECT alert_type, COUNT(*), COUNT(DISTINCT shift_id)
            FROM alerts WHERE created_at >= %s AND created_at <= %s
            GROUP BY 1 ORDER BY 2 DESC;
        """, p)
        alert_analysis = [
            {"alert_type": r[0], "count": r[1], "shifts_affected": r[2]}
            for r in cur.fetchall()
        ]

        # Monitor analysis
        cur.execute("""
            SELECT monitor, COUNT(*), COUNT(DISTINCT shift_id), COUNT(DISTINCT alert_type)
            FROM alerts WHERE created_at >= %s AND created_at <= %s
            GROUP BY 1 ORDER BY 2 DESC LIMIT 10;
        """, p)
        monitor_analysis = [
            {"monitor": r[0], "alert_count": r[1],
             "shifts_affected": r[2], "unique_alert_types": r[3]}
            for r in cur.fetchall()
        ]

        # Shift duration stats
        cur.execute("""
            SELECT EXTRACT(EPOCH FROM (logout_time - login_time))/3600
            FROM shifts WHERE logout_time IS NOT NULL
            AND login_time >= %s AND login_time <= %s
            AND EXTRACT(EPOCH FROM (logout_time - login_time))/3600 > 0;
        """, p)
        durations = [float(r[0]) for r in cur.fetchall() if r[0] and r[0] > 0]
        shift_duration_stats = _describe(durations)

        # Productivity stats
        cur.execute("""
            SELECT triaged_count,
                   EXTRACT(EPOCH FROM (COALESCE(logout_time,NOW()) - login_time))/3600
            FROM shifts WHERE login_time >= %s AND login_time <= %s
            AND EXTRACT(EPOCH FROM (COALESCE(logout_time,NOW()) - login_time))/3600 > 0.5;
        """, p)
        rates = [
            round(r[0] / r[1], 2)
            for r in cur.fetchall()
            if r[0] is not None and r[1] and r[1] > 0
        ]
        productivity_stats = _describe(rates)

        # Volume trends (incidents, tickets, dialpad)
        def _volume(table, col):
            cur.execute(f"""
                SELECT DATE(created_at), COUNT(*) FROM {table}
                WHERE created_at >= %s AND created_at <= %s
                GROUP BY 1 ORDER BY 1;
            """, p)
            return [{"date": str(r[0]), "count": r[1]} for r in cur.fetchall()]

        incident_pattern = _volume("incident_status", "incident_count")
        ticket_volume    = _volume("tickets",          "ticket_count")
        dialpad_volume   = _volume("dialpad_tickets",  "dialpad_count")

        # Agent consistency
        cur.execute("""
            SELECT agent_id, STDDEV(triaged_count), AVG(triaged_count)
            FROM shifts WHERE login_time >= %s AND login_time <= %s
            AND logout_time IS NOT NULL
            GROUP BY agent_id HAVING COUNT(*) >= 1
            ORDER BY 2;
        """, p)
        agent_consistency = [
            {
                "agent_id":          str(r[0]),
                "variance":          round(float(r[1] or 0), 2),
                "avg_triaged":       round(float(r[2] or 0), 2),
                "consistency_score": round(100 - min(float(r[1] or 0) * 10, 100), 2) if r[1] else 100,
            }
            for r in cur.fetchall()
        ][:10]

        # Coverage analysis
        cur.execute("""
            SELECT hour, AVG(agents_in_slot) FROM (
                SELECT DATE_TRUNC('hour', login_time) AS hour_slot,
                       EXTRACT(HOUR FROM login_time)::int AS hour,
                       COUNT(DISTINCT agent_id) AS agents_in_slot
                FROM shifts WHERE login_time >= %s AND login_time <= %s
                GROUP BY 1, 2
            ) h GROUP BY hour ORDER BY hour;
        """, p)
        coverage_analysis = [
            {"hour": int(r[0]), "avg_agents": round(float(r[1] or 0), 2)}
            for r in cur.fetchall()
        ]

        peak_hour = max(hourly_distribution, key=lambda x: x["total_triaged"], default=None)
        insights  = _build_insights(agent_rankings, alert_analysis, coverage_analysis, performance_trends, productivity_stats)

        cur.close()
        return jsonify({
            "performance_trends":  performance_trends,
            "agent_rankings":      agent_rankings,
            "hourly_distribution": hourly_distribution,
            "daily_distribution":  daily_distribution,
            "alert_analysis":      alert_analysis,
            "monitor_analysis":    monitor_analysis,
            "shift_duration_stats": shift_duration_stats,
            "productivity_stats":  productivity_stats,
            "incident_pattern":    incident_pattern,
            "ticket_volume":       ticket_volume,
            "dialpad_volume":      dialpad_volume,
            "agent_consistency":   agent_consistency,
            "peak_hour":           peak_hour,
            "coverage_analysis":   coverage_analysis,
            "insights":            insights,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


def _describe(values):
    """Return min/max/avg/median/std_dev dict, or {} if empty."""
    if not values:
        return {}
    return {
        "min":     round(min(values), 2),
        "max":     round(max(values), 2),
        "avg":     round(statistics.mean(values), 2),
        "median":  round(statistics.median(values), 2),
        "std_dev": round(statistics.stdev(values), 2) if len(values) > 1 else 0,
    }


def _build_insights(agent_rankings, alert_analysis, coverage_analysis, performance_trends, productivity_stats):
    insights = []

    if agent_rankings:
        top = agent_rankings[0]
        insights.append({
            "type": "productivity", "severity": "info",
            "title": "Top Performer",
            "message": f"Agent {top['agent_id'][:8]} leads with {top['productivity_rate']} cases/hour",
            "value": top["productivity_rate"],
        })

    if alert_analysis:
        total = sum(a["count"] for a in alert_analysis)
        if total > 0:
            top = alert_analysis[0]
            insights.append({
                "type": "alert", "severity": "warning" if total > 50 else "info",
                "title": "Alert Pattern",
                "message": f"{top['alert_type']} is the most common alert ({top['count']} occurrences)",
                "value": total,
            })

    low_cov = [c for c in coverage_analysis if c["avg_agents"] < 2]
    if low_cov:
        insights.append({
            "type": "coverage", "severity": "warning",
            "title": "Low Coverage Hours",
            "message": f"{len(low_cov)} hours have insufficient agent coverage",
            "value": len(low_cov),
        })

    if len(performance_trends) >= 14:
        recent = statistics.mean([t["total_triaged"] for t in performance_trends[-7:]])
        prev   = statistics.mean([t["total_triaged"] for t in performance_trends[-14:-7]])
        if prev > 0:
            change = ((recent - prev) / prev) * 100
            insights.append({
                "type": "trend",
                "severity": "success" if change > 0 else "warning",
                "title": "Weekly Trend",
                "message": f"Productivity {'increased' if change > 0 else 'decreased'} by {abs(round(change, 1))}% this week",
                "value": round(change, 1),
            })

    return insights


# ── agent detail ───────────────────────────────────────────────────────────

@manager_bp.route("/agent-detail/<agent_id>", methods=["GET", "OPTIONS"])
def get_agent_detail(agent_id):
    if request.method == "OPTIONS":
        return "", 200

    try:
        date_from, date_to_inclusive = _resolve_date_range()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        p   = (agent_id, date_from, date_to_inclusive)

        def trend(table, join_col="shift_id"):
            cur.execute(f"""
                SELECT DATE(t.created_at), COUNT(*) FROM {table} t
                JOIN shifts s ON s.id = t.{join_col}
                WHERE s.agent_id = %s AND t.created_at >= %s AND t.created_at <= %s
                GROUP BY 1 ORDER BY 1;
            """, p)
            return [{"date": str(r[0]), "count": r[1]} for r in cur.fetchall()]

        # Breakdowns
        cur.execute("""
            SELECT a.alert_type, COUNT(*) FROM alerts a
            JOIN shifts s ON s.id = a.shift_id
            WHERE s.agent_id = %s AND s.login_time >= %s AND s.login_time <= %s
            GROUP BY 1 ORDER BY 2 DESC LIMIT 10;
        """, p)
        alert_breakdown = [{"alert_type": r[0], "count": r[1]} for r in cur.fetchall()]

        cur.execute("""
            SELECT a.monitor, COUNT(*) FROM alerts a
            JOIN shifts s ON s.id = a.shift_id
            WHERE s.agent_id = %s AND s.login_time >= %s AND s.login_time <= %s
            GROUP BY 1 ORDER BY 2 DESC LIMIT 10;
        """, p)
        monitor_breakdown = [{"monitor": r[0], "count": r[1]} for r in cur.fetchall()]

        # Daily trends
        ticket_trend   = trend("tickets")
        alert_trend    = trend("alerts")
        incident_trend = trend("incident_status")
        adhoc_trend    = trend("adhoc_tasks")
        dialpad_trend  = trend("dialpad_tickets")

        # Recent shifts
        cur.execute("""
            SELECT s.id, DATE(s.login_time),
                   EXTRACT(EPOCH FROM (COALESCE(s.logout_time,NOW()) - s.login_time))/3600,
                   s.triaged_count,
                   COUNT(DISTINCT t.id), COUNT(DISTINCT a.id),
                   COUNT(DISTINCT i.id), COUNT(DISTINCT ad.id), COUNT(DISTINCT dp.id)
            FROM shifts s
            LEFT JOIN tickets          t  ON t.shift_id  = s.id
            LEFT JOIN alerts           a  ON a.shift_id  = s.id
            LEFT JOIN incident_status  i  ON i.shift_id  = s.id
            LEFT JOIN adhoc_tasks      ad ON ad.shift_id = s.id
            LEFT JOIN dialpad_tickets  dp ON dp.shift_id = s.id
            WHERE s.agent_id = %s AND s.login_time >= %s AND s.login_time <= %s
            GROUP BY s.id, s.login_time, s.logout_time, s.triaged_count
            ORDER BY s.login_time DESC LIMIT 10;
        """, p)
        recent_shifts = [
            {
                "id": str(r[0]), "date": str(r[1]),
                "duration_hours": round(float(r[2] or 0), 2),
                "triaged_count":  r[3] or 0,
                "ticket_count":   int(r[4] or 0), "alert_count":    int(r[5] or 0),
                "incident_count": int(r[6] or 0), "adhoc_count":    int(r[7] or 0),
                "dialpad_count":  int(r[8] or 0),
            }
            for r in cur.fetchall()
        ]

        # KPI aggregates
        cur.execute("""
            SELECT COUNT(DISTINCT s.id), COALESCE(SUM(s.triaged_count),0),
                   COUNT(DISTINCT t.id), COUNT(DISTINCT a.id),
                   COUNT(DISTINCT i.id), COUNT(DISTINCT ad.id),
                   COALESCE(AVG(s.triaged_count),0),
                   COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(s.logout_time,NOW()) - s.login_time))/3600),0),
                   COUNT(DISTINCT dp.id)
            FROM shifts s
            LEFT JOIN tickets          t  ON t.shift_id  = s.id
            LEFT JOIN alerts           a  ON a.shift_id  = s.id
            LEFT JOIN incident_status  i  ON i.shift_id  = s.id
            LEFT JOIN adhoc_tasks      ad ON ad.shift_id = s.id
            LEFT JOIN dialpad_tickets  dp ON dp.shift_id = s.id
            WHERE s.agent_id = %s AND s.login_time >= %s AND s.login_time <= %s;
        """, p)
        k = cur.fetchone()
        cur.close()

        return jsonify({
            "agent_id":            agent_id,
            "shift_count":         int(k[0] or 0),
            "total_triaged":       int(k[1] or 0),
            "total_tickets":       int(k[2] or 0),
            "total_alerts":        int(k[3] or 0),
            "total_incidents":     int(k[4] or 0),
            "total_adhoc":         int(k[5] or 0),
            "avg_triaged_per_shift": round(float(k[6] or 0), 2),
            "avg_shift_hours":     round(float(k[7] or 0), 2),
            "total_dialpad":       int(k[8] or 0),
            "alert_breakdown":     alert_breakdown,
            "monitor_breakdown":   monitor_breakdown,
            "ticket_trend":        ticket_trend,
            "alert_trend":         alert_trend,
            "incident_trend":      incident_trend,
            "adhoc_trend":         adhoc_trend,
            "dialpad_trend":       dialpad_trend,
            "recent_shifts":       recent_shifts,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


# ── handovers ──────────────────────────────────────────────────────────────

@manager_bp.route("/handovers", methods=["GET", "OPTIONS"])
def get_all_handovers():
    if request.method == "OPTIONS":
        return "", 200

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT h.id, h.description, h.handover_to, h.created_at,
                   COALESCE(ag.name,'Unknown Agent'), s.agent_id::text
            FROM handovers h
            JOIN shifts s  ON s.id  = h.shift_id
            JOIN agents ag ON ag.id = s.agent_id
            ORDER BY h.created_at DESC LIMIT 100;
        """)
        rows = cur.fetchall()
        cur.close()

        return jsonify({
            "handovers": [
                {
                    "id":          str(r[0]),
                    "description": r[1],
                    "handover_to": r[2],
                    "created_at":  fmt_ist(r[3]),
                    "from_name":   r[4],
                    "agent_id":    r[5],
                }
                for r in rows
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)