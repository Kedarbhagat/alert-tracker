from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import psycopg2
from collections import defaultdict
import statistics

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
DATABASE_URL = os.getenv("DATABASE_URL")

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn


# ========================================
# MANAGER DASHBOARD ENDPOINTS
# ========================================

# ----------------------------
# Get Active Agents
# ----------------------------
@app.route("/manager/active-agents", methods=["GET"])
def get_active_agents():
    """Get all agents currently on shift"""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            s.id as shift_id,
            s.agent_id,
            s.login_time,
            s.triaged_count,
            EXTRACT(EPOCH FROM (NOW() - s.login_time))/3600 as hours_worked,
            COUNT(DISTINCT t.id) as ticket_count,
            COUNT(DISTINCT a.id) as alert_count,
            COUNT(DISTINCT i.id) as incident_count,
            COUNT(DISTINCT ad.id) as adhoc_count
        FROM shifts s
        LEFT JOIN tickets t ON t.shift_id = s.id
        LEFT JOIN alerts a ON a.shift_id = s.id
        LEFT JOIN incident_status i ON i.shift_id = s.id
        LEFT JOIN adhoc_tasks ad ON ad.shift_id = s.id
        WHERE s.logout_time IS NULL
        GROUP BY s.id, s.agent_id, s.login_time, s.triaged_count
        ORDER BY s.login_time DESC;
    """)

    active_agents = cur.fetchall()
    
    result = []
    for agent in active_agents:
        # Calculate productivity rate (triaged per hour)
        hours = agent[4] if agent[4] > 0 else 1
        productivity = round(agent[3] / hours, 2)
        
        result.append({
            "shift_id": str(agent[0]),
            "agent_id": str(agent[1]),
            "login_time": str(agent[2]),
            "triaged_count": agent[3],
            "hours_worked": round(agent[4], 2),
            "ticket_count": agent[5],
            "alert_count": agent[6],
            "incident_count": agent[7],
            "adhoc_count": agent[8],
            "productivity_rate": productivity
        })

    cur.close()
    conn.close()

    return jsonify({"active_agents": result, "count": len(result)})


# ----------------------------
# Get All Shifts (with filters)
# ----------------------------
@app.route("/manager/shifts", methods=["GET"])
def get_all_shifts():
    """Get all shifts with optional filters"""
    # Get query parameters
    agent_id = request.args.get('agent_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    conn = get_db_connection()
    cur = conn.cursor()

    # Build query with filters
    query = """
        SELECT 
            s.id,
            s.agent_id,
            s.login_time,
            s.logout_time,
            s.triaged_count,
            EXTRACT(EPOCH FROM (COALESCE(s.logout_time, NOW()) - s.login_time))/3600 as hours_worked,
            COUNT(DISTINCT t.id) as ticket_count,
            COUNT(DISTINCT a.id) as alert_count,
            COUNT(DISTINCT i.id) as incident_count,
            COUNT(DISTINCT ad.id) as adhoc_count
        FROM shifts s
        LEFT JOIN tickets t ON t.shift_id = s.id
        LEFT JOIN alerts a ON a.shift_id = s.id
        LEFT JOIN incident_status i ON i.shift_id = s.id
        LEFT JOIN adhoc_tasks ad ON ad.shift_id = s.id
        WHERE 1=1
    """
    
    params = []
    
    if agent_id:
        query += " AND s.agent_id = %s"
        params.append(agent_id)
    
    if start_date:
        query += " AND s.login_time >= %s"
        params.append(start_date)
    
    if end_date:
        query += " AND s.login_time <= %s"
        params.append(end_date)
    
    query += """
        GROUP BY s.id, s.agent_id, s.login_time, s.logout_time, s.triaged_count
        ORDER BY s.login_time DESC
        LIMIT 100;
    """
    
    cur.execute(query, params)
    shifts = cur.fetchall()
    
    result = []
    for shift in shifts:
        result.append({
            "shift_id": str(shift[0]),
            "agent_id": str(shift[1]),
            "login_time": str(shift[2]),
            "logout_time": str(shift[3]) if shift[3] else None,
            "triaged_count": shift[4],
            "hours_worked": round(shift[5], 2),
            "ticket_count": shift[6],
            "alert_count": shift[7],
            "incident_count": shift[8],
            "adhoc_count": shift[9],
            "status": "active" if shift[3] is None else "completed"
        })

    cur.close()
    conn.close()

    return jsonify({"shifts": result, "count": len(result)})


# ----------------------------
# Get Agent Performance Stats
# ----------------------------
@app.route("/manager/agent-stats/<agent_id>", methods=["GET"])
def get_agent_stats(agent_id):
    """Get detailed performance stats for a specific agent"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Overall stats
    cur.execute("""
        SELECT 
            COUNT(*) as total_shifts,
            SUM(triaged_count) as total_triaged,
            AVG(triaged_count) as avg_triaged_per_shift,
            SUM(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600) as total_hours
        FROM shifts
        WHERE agent_id = %s;
    """, (agent_id,))
    
    overall = cur.fetchone()
    
    # Recent activity (last 7 days)
    cur.execute("""
        SELECT 
            DATE(login_time) as shift_date,
            COUNT(*) as shift_count,
            SUM(triaged_count) as triaged,
            SUM(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600) as hours
        FROM shifts
        WHERE agent_id = %s 
        AND login_time >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(login_time)
        ORDER BY shift_date DESC;
    """, (agent_id,))
    
    recent_activity = cur.fetchall()
    
    # Ticket stats
    cur.execute("""
        SELECT COUNT(*) 
        FROM tickets t
        JOIN shifts s ON t.shift_id = s.id
        WHERE s.agent_id = %s;
    """, (agent_id,))
    total_tickets = cur.fetchone()[0]
    
    # Alert stats
    cur.execute("""
        SELECT COUNT(*) 
        FROM alerts a
        JOIN shifts s ON a.shift_id = s.id
        WHERE s.agent_id = %s;
    """, (agent_id,))
    total_alerts = cur.fetchone()[0]

    cur.close()
    conn.close()

    return jsonify({
        "agent_id": agent_id,
        "overall": {
            "total_shifts": overall[0],
            "total_triaged": overall[1] or 0,
            "avg_triaged_per_shift": round(float(overall[2] or 0), 2),
            "total_hours": round(float(overall[3] or 0), 2),
            "total_tickets": total_tickets,
            "total_alerts": total_alerts
        },
        "recent_activity": [
            {
                "date": str(r[0]),
                "shift_count": r[1],
                "triaged": r[2] or 0,
                "hours": round(float(r[3] or 0), 2)
            }
            for r in recent_activity
        ]
    })


# ----------------------------
# Get Overall Analytics
# ----------------------------
@app.route("/manager/analytics", methods=["GET"])
def get_analytics():
    """Get overall system analytics"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Today's stats
    cur.execute("""
        SELECT 
            COUNT(DISTINCT s.id) as shifts_today,
            COUNT(DISTINCT s.agent_id) as agents_active,
            SUM(s.triaged_count) as total_triaged,
            COUNT(DISTINCT t.id) as total_tickets,
            COUNT(DISTINCT a.id) as total_alerts
        FROM shifts s
        LEFT JOIN tickets t ON t.shift_id = s.id
        LEFT JOIN alerts a ON a.shift_id = s.id
        WHERE DATE(s.login_time) = CURRENT_DATE;
    """)
    
    today = cur.fetchone()
    
    # This week's stats
    cur.execute("""
        SELECT 
            COUNT(DISTINCT s.id) as shifts_this_week,
            SUM(s.triaged_count) as total_triaged,
            AVG(EXTRACT(EPOCH FROM (COALESCE(s.logout_time, NOW()) - s.login_time))/3600) as avg_shift_hours
        FROM shifts s
        WHERE s.login_time >= DATE_TRUNC('week', CURRENT_DATE);
    """)
    
    week = cur.fetchone()
    
    # Active now
    cur.execute("""
        SELECT COUNT(*) FROM shifts WHERE logout_time IS NULL;
    """)
    
    active_now = cur.fetchone()[0]

    cur.close()
    conn.close()

    return jsonify({
        "today": {
            "shifts": today[0] or 0,
            "agents_active": today[1] or 0,
            "triaged": today[2] or 0,
            "tickets": today[3] or 0,
            "alerts": today[4] or 0
        },
        "this_week": {
            "shifts": week[0] or 0,
            "triaged": week[1] or 0,
            "avg_shift_hours": round(float(week[2] or 0), 2)
        },
        "active_now": active_now
    })


# ----------------------------
# 🆕 ADVANCED ANALYTICS ENDPOINT
# ----------------------------
@app.route("/manager/advanced-analytics", methods=["GET"])
def get_advanced_analytics():
    """Get comprehensive advanced analytics with insights"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Performance Trends (Last 30 days)
    cur.execute("""
        SELECT 
            DATE(login_time) as date,
            COUNT(DISTINCT id) as shifts,
            COUNT(DISTINCT agent_id) as unique_agents,
            SUM(triaged_count) as total_triaged,
            AVG(triaged_count) as avg_triaged,
            AVG(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600) as avg_hours
        FROM shifts
        WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(login_time)
        ORDER BY date;
    """)
    trends = cur.fetchall()
    performance_trends = [
        {
            "date": str(t[0]),
            "shifts": t[1],
            "unique_agents": t[2],
            "total_triaged": t[3] or 0,
            "avg_triaged": round(float(t[4] or 0), 2),
            "avg_hours": round(float(t[5] or 0), 2)
        }
        for t in trends
    ]
    
    # 2. Agent Performance Ranking
    cur.execute("""
        SELECT 
            agent_id,
            COUNT(*) as total_shifts,
            SUM(triaged_count) as total_triaged,
            AVG(triaged_count) as avg_triaged,
            SUM(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600) as total_hours,
            CASE 
                WHEN SUM(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600) > 0 
                THEN SUM(triaged_count) / SUM(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600)
                ELSE 0 
            END as productivity_rate
        FROM shifts
        WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY agent_id
        ORDER BY productivity_rate DESC
        LIMIT 20;
    """)
    rankings = cur.fetchall()
    agent_rankings = [
        {
            "agent_id": str(r[0]),
            "total_shifts": r[1],
            "total_triaged": r[2] or 0,
            "avg_triaged": round(float(r[3] or 0), 2),
            "total_hours": round(float(r[4] or 0), 2),
            "productivity_rate": round(float(r[5] or 0), 2),
            "rank": idx + 1
        }
        for idx, r in enumerate(rankings)
    ]
    
    # 3. Workload Distribution by Hour of Day
    cur.execute("""
        SELECT 
            EXTRACT(HOUR FROM login_time) as hour,
            COUNT(*) as shift_count,
            SUM(triaged_count) as total_triaged,
            AVG(triaged_count) as avg_triaged
        FROM shifts
        WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM login_time)
        ORDER BY hour;
    """)
    hourly = cur.fetchall()
    hourly_distribution = [
        {
            "hour": int(h[0]),
            "shift_count": h[1],
            "total_triaged": h[2] or 0,
            "avg_triaged": round(float(h[3] or 0), 2)
        }
        for h in hourly
    ]
    
    # 4. Workload Distribution by Day of Week
    cur.execute("""
        SELECT 
            EXTRACT(DOW FROM login_time) as day_of_week,
            COUNT(*) as shift_count,
            SUM(triaged_count) as total_triaged,
            AVG(triaged_count) as avg_triaged,
            COUNT(DISTINCT agent_id) as unique_agents
        FROM shifts
        WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(DOW FROM login_time)
        ORDER BY day_of_week;
    """)
    daily = cur.fetchall()
    daily_distribution = [
        {
            "day_of_week": int(d[0]),  # 0=Sunday, 1=Monday, etc.
            "day_name": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][int(d[0])],
            "shift_count": d[1],
            "total_triaged": d[2] or 0,
            "avg_triaged": round(float(d[3] or 0), 2),
            "unique_agents": d[4]
        }
        for d in daily
    ]
    
    # 5. Alert Analysis
    cur.execute("""
        SELECT 
            alert_type,
            COUNT(*) as count,
            COUNT(DISTINCT shift_id) as shifts_affected
        FROM alerts
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY alert_type
        ORDER BY count DESC;
    """)
    alert_types = cur.fetchall()
    alert_analysis = [
        {
            "alert_type": a[0],
            "count": a[1],
            "shifts_affected": a[2]
        }
        for a in alert_types
    ]
    
    # 6. Top Monitors with Alerts
    cur.execute("""
        SELECT 
            monitor,
            COUNT(*) as alert_count,
            COUNT(DISTINCT shift_id) as shifts_affected,
            COUNT(DISTINCT alert_type) as unique_alert_types
        FROM alerts
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY monitor
        ORDER BY alert_count DESC
        LIMIT 10;
    """)
    top_monitors = cur.fetchall()
    monitor_analysis = [
        {
            "monitor": m[0],
            "alert_count": m[1],
            "shifts_affected": m[2],
            "unique_alert_types": m[3]
        }
        for m in top_monitors
    ]
    
    # 7. Shift Duration Analysis
    cur.execute("""
        SELECT 
            EXTRACT(EPOCH FROM (logout_time - login_time))/3600 as duration_hours
        FROM shifts
        WHERE logout_time IS NOT NULL
        AND login_time >= CURRENT_DATE - INTERVAL '30 days';
    """)
    durations = [float(d[0]) for d in cur.fetchall() if d[0]]
    
    shift_duration_stats = {}
    if durations:
        shift_duration_stats = {
            "min": round(min(durations), 2),
            "max": round(max(durations), 2),
            "avg": round(statistics.mean(durations), 2),
            "median": round(statistics.median(durations), 2),
            "std_dev": round(statistics.stdev(durations), 2) if len(durations) > 1 else 0
        }
    
    # 8. Productivity Distribution
    cur.execute("""
        SELECT 
            triaged_count,
            EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600 as hours
        FROM shifts
        WHERE login_time >= CURRENT_DATE - INTERVAL '30 days';
    """)
    productivity_data = cur.fetchall()
    productivity_rates = [
        round(p[0] / p[1], 2) if p[1] > 0 else 0 
        for p in productivity_data if p[0] is not None and p[1] is not None
    ]
    
    productivity_stats = {}
    if productivity_rates:
        productivity_stats = {
            "min": round(min(productivity_rates), 2),
            "max": round(max(productivity_rates), 2),
            "avg": round(statistics.mean(productivity_rates), 2),
            "median": round(statistics.median(productivity_rates), 2),
            "std_dev": round(statistics.stdev(productivity_rates), 2) if len(productivity_rates) > 1 else 0
        }
    
    # 9. Incident Patterns
    cur.execute("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as incident_count
        FROM incident_status
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date;
    """)
    incident_trends = cur.fetchall()
    incident_pattern = [
        {
            "date": str(i[0]),
            "count": i[1]
        }
        for i in incident_trends
    ]
    
    # 10. Ticket Volume Analysis
    cur.execute("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as ticket_count
        FROM tickets
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date;
    """)
    ticket_trends = cur.fetchall()
    ticket_volume = [
        {
            "date": str(t[0]),
            "count": t[1]
        }
        for t in ticket_trends
    ]
    
    # 11. Agent Consistency Score (variance in productivity)
    cur.execute("""
        SELECT 
            agent_id,
            STDDEV(triaged_count) as triaged_variance,
            AVG(triaged_count) as avg_triaged
        FROM shifts
        WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
        AND logout_time IS NOT NULL
        GROUP BY agent_id
        HAVING COUNT(*) >= 3
        ORDER BY triaged_variance;
    """)
    consistency_data = cur.fetchall()
    agent_consistency = [
        {
            "agent_id": str(c[0]),
            "variance": round(float(c[1] or 0), 2),
            "avg_triaged": round(float(c[2] or 0), 2),
            "consistency_score": round(100 - min(float(c[1] or 0) * 10, 100), 2) if c[1] else 100
        }
        for c in consistency_data
    ]
    
    # 12. Peak Hours Analysis
    if hourly_distribution:
        peak_hour = max(hourly_distribution, key=lambda x: x['total_triaged'])
    else:
        peak_hour = None
    
    # 13. Coverage Analysis (agents per hour)
    cur.execute("""
        SELECT 
            EXTRACT(HOUR FROM login_time) as hour,
            AVG(agent_count) as avg_agents
        FROM (
            SELECT 
                login_time,
                COUNT(DISTINCT agent_id) OVER (
                    PARTITION BY DATE_TRUNC('hour', login_time)
                ) as agent_count
            FROM shifts
            WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
        ) subq
        GROUP BY EXTRACT(HOUR FROM login_time)
        ORDER BY hour;
    """)
    coverage = cur.fetchall()
    coverage_analysis = [
        {
            "hour": int(c[0]),
            "avg_agents": round(float(c[1] or 0), 2)
        }
        for c in coverage
    ]
    
    # 14. Calculate Insights
    insights = []
    
    # Productivity insight
    if productivity_stats and agent_rankings:
        top_performer = agent_rankings[0] if agent_rankings else None
        if top_performer:
            insights.append({
                "type": "productivity",
                "severity": "info",
                "title": "Top Performer",
                "message": f"Agent {top_performer['agent_id'][:8]} leads with {top_performer['productivity_rate']} cases/hour",
                "value": top_performer['productivity_rate']
            })
    
    # Alert insight
    if alert_analysis:
        total_alerts = sum(a['count'] for a in alert_analysis)
        if total_alerts > 0:
            top_alert = alert_analysis[0]
            insights.append({
                "type": "alert",
                "severity": "warning" if total_alerts > 50 else "info",
                "title": "Alert Pattern",
                "message": f"{top_alert['alert_type']} is the most common alert ({top_alert['count']} occurrences)",
                "value": total_alerts
            })
    
    # Coverage insight
    if coverage_analysis:
        low_coverage = [c for c in coverage_analysis if c['avg_agents'] < 2]
        if low_coverage:
            insights.append({
                "type": "coverage",
                "severity": "warning",
                "title": "Low Coverage Hours",
                "message": f"{len(low_coverage)} hours have insufficient agent coverage",
                "value": len(low_coverage)
            })
    
    # Trend insight
    if len(performance_trends) >= 7:
        recent_week = performance_trends[-7:]
        prev_week = performance_trends[-14:-7] if len(performance_trends) >= 14 else []
        
        if prev_week:
            recent_avg = statistics.mean([t['total_triaged'] for t in recent_week])
            prev_avg = statistics.mean([t['total_triaged'] for t in prev_week])
            
            if prev_avg > 0:
                change = ((recent_avg - prev_avg) / prev_avg) * 100
                insights.append({
                    "type": "trend",
                    "severity": "success" if change > 0 else "warning",
                    "title": "Weekly Trend",
                    "message": f"Productivity {'increased' if change > 0 else 'decreased'} by {abs(round(change, 1))}% this week",
                    "value": round(change, 1)
                })
    
    cur.close()
    conn.close()
    
    return jsonify({
        "performance_trends": performance_trends,
        "agent_rankings": agent_rankings,
        "hourly_distribution": hourly_distribution,
        "daily_distribution": daily_distribution,
        "alert_analysis": alert_analysis,
        "monitor_analysis": monitor_analysis,
        "shift_duration_stats": shift_duration_stats,
        "productivity_stats": productivity_stats,
        "incident_pattern": incident_pattern,
        "ticket_volume": ticket_volume,
        "agent_consistency": agent_consistency[:10],  # Top 10 most consistent
        "peak_hour": peak_hour,
        "coverage_analysis": coverage_analysis,
        "insights": insights
    })


# ----------------------------
# Get Shift Details
# ----------------------------
@app.route("/manager/shift-details/<shift_id>", methods=["GET"])
def get_shift_details(shift_id):
    """Get complete details for a specific shift"""
    conn = get_db_connection()
    cur = conn.cursor()

    # Get shift info
    cur.execute("""
        SELECT agent_id, login_time, logout_time, triaged_count
        FROM shifts WHERE id = %s;
    """, (shift_id,))
    
    shift = cur.fetchone()
    
    if not shift:
        return jsonify({"error": "Shift not found"}), 404

    # Get all tickets
    cur.execute("""
        SELECT ticket_number, description, created_at
        FROM tickets WHERE shift_id = %s ORDER BY created_at;
    """, (shift_id,))
    tickets = [{"number": t[0], "description": t[1], "time": str(t[2])} for t in cur.fetchall()]

    # Get all alerts
    cur.execute("""
        SELECT monitor, alert_type, comment, created_at
        FROM alerts WHERE shift_id = %s ORDER BY created_at;
    """, (shift_id,))
    alerts = [{"monitor": a[0], "type": a[1], "comment": a[2], "time": str(a[3])} for a in cur.fetchall()]

    # Get incidents
    cur.execute("""
        SELECT description, created_at
        FROM incident_status WHERE shift_id = %s ORDER BY created_at;
    """, (shift_id,))
    incidents = [{"description": i[0], "time": str(i[1])} for i in cur.fetchall()]

    # Get adhoc tasks
    cur.execute("""
        SELECT task, created_at
        FROM adhoc_tasks WHERE shift_id = %s ORDER BY created_at;
    """, (shift_id,))
    adhoc = [{"task": a[0], "time": str(a[1])} for a in cur.fetchall()]

    cur.close()
    conn.close()

    return jsonify({
        "shift_id": shift_id,
        "agent_id": str(shift[0]),
        "login_time": str(shift[1]),
        "logout_time": str(shift[2]) if shift[2] else None,
        "triaged_count": shift[3],
        "tickets": tickets,
        "alerts": alerts,
        "incidents": incidents,
        "adhoc_tasks": adhoc
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)