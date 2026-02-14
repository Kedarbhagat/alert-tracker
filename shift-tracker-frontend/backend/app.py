from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2 import pool
import os
from dotenv import load_dotenv
from datetime import datetime
import statistics

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

DATABASE_URL = os.getenv("DATABASE_URL")

# ✅ Connection pooling
connection_pool = None

def initialize_pool():
    global connection_pool
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1, 20, DATABASE_URL, sslmode="require"
        )
        if connection_pool:
            print("✅ Connection pool created successfully")
    except Exception as e:
        print(f"❌ Error creating connection pool: {e}")

def get_db_connection():
    return connection_pool.getconn()

def return_connection(conn):
    connection_pool.putconn(conn)


# ========================================
# AGENT ENDPOINTS (Port 5000 functionality)
# ========================================

@app.route("/check-active-shift", methods=["POST", "OPTIONS"])
def check_active_shift():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        data = request.json
        agent_id = data.get("agent_id")
        agent_name = data.get("agent_name")  # Get agent name from request
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # If agent_id is not a valid UUID or is a placeholder, create a new one
        import uuid
        is_valid_uuid = True
        try:
            uuid.UUID(agent_id)
            # Check if it's a placeholder like "REAL_UUID_X"
            if "REAL_UUID" in agent_id or "placeholder" in agent_id.lower():
                is_valid_uuid = False
        except (ValueError, AttributeError):
            is_valid_uuid = False
        
        # Generate new UUID if needed
        if not is_valid_uuid:
            new_uuid = str(uuid.uuid4())
            print(f"🆕 Generated new UUID for {agent_name}: {new_uuid}")
            print(f"📋 Copy this to your App.jsx:")
            print(f'   {{ id: "{new_uuid}", name: "{agent_name}" }}')
            agent_id = new_uuid
        
        # Check for active shift
        cur.execute("""
            SELECT id, triaged_count FROM shifts
            WHERE agent_id = %s AND logout_time IS NULL
            ORDER BY login_time DESC LIMIT 1;
        """, (agent_id,))
        result = cur.fetchone()
        cur.close()
        
        if result:
            return jsonify({
                "has_active_shift": True, 
                "shift_id": result[0], 
                "triaged_count": result[1],
                "agent_id": agent_id  # Return the UUID (new or existing)
            })
        return jsonify({
            "has_active_shift": False,
            "agent_id": agent_id  # Return the UUID for frontend to use
        })
    except Exception as e:
        print(f"❌ Error in check_active_shift: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/start-shift", methods=["POST", "OPTIONS"])
def start_shift():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        data = request.json
        agent_id = data.get("agent_id")
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO shifts (agent_id) VALUES (%s) RETURNING id;", (agent_id,))
        shift_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return jsonify({"shift_id": shift_id, "triaged_count": 0})
    except Exception as e:
        print(f"❌ Error in start_shift: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/update-triage", methods=["POST", "OPTIONS"])
def update_triage():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        data = request.json
        shift_id = data.get("shift_id")
        change = data.get("change")
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE shifts SET triaged_count = GREATEST(triaged_count + %s, 0)
            WHERE id = %s RETURNING triaged_count;
        """, (change, shift_id))
        new_count = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return jsonify({"triaged_count": new_count})
    except Exception as e:
        print(f"❌ Error in update_triage: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/add-tickets", methods=["POST", "OPTIONS"])
def add_tickets():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        data = request.json
        shift_id = data.get("shift_id")
        tickets = data.get("tickets", [])
        conn = get_db_connection()
        cur = conn.cursor()
        for ticket in tickets:
            cur.execute("""
                INSERT INTO tickets (shift_id, ticket_number, description)
                VALUES (%s, %s, %s);
            """, (shift_id, ticket["number"], ticket["description"]))
        conn.commit()
        cur.close()
        return jsonify({"message": "Tickets added successfully"})
    except Exception as e:
        print(f"❌ Error in add_tickets: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/add-alert", methods=["POST", "OPTIONS"])
def add_alert():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        data = request.json
        shift_id = data.get("shift_id")
        monitor = data.get("monitor")
        alert_type = data.get("alert_type")
        comment = data.get("comment")
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO alerts (shift_id, monitor, alert_type, comment)
            VALUES (%s, %s, %s, %s);
        """, (shift_id, monitor, alert_type, comment))
        conn.commit()
        cur.close()
        return jsonify({"message": "Alert added successfully"})
    except Exception as e:
        print(f"❌ Error in add_alert: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/add-incident", methods=["POST", "OPTIONS"])
def add_incident():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        data = request.json
        shift_id = data.get("shift_id")
        description = data.get("description")
        if not description:
            return jsonify({"error": "Description required"}), 400
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO incident_status (shift_id, description) VALUES (%s, %s);", (shift_id, description))
        conn.commit()
        cur.close()
        return jsonify({"message": "Incident saved successfully"})
    except Exception as e:
        print(f"❌ Error in add_incident: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/add-adhoc", methods=["POST", "OPTIONS"])
def add_adhoc():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        data = request.get_json(silent=True) or {}
        shift_id = data.get("shift_id")
        task_text = data.get("task")
        if not task_text:
            return jsonify({"error": "Task required"}), 400
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO adhoc_tasks (shift_id, task) VALUES (%s, %s);", (shift_id, task_text))
        conn.commit()
        cur.close()
        return jsonify({"message": "Ad-hoc task saved successfully"})
    except Exception as e:
        print(f"❌ Error in add_adhoc: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/end-shift", methods=["POST", "OPTIONS"])
def end_shift():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        data = request.json
        shift_id = data.get("shift_id")
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE shifts SET logout_time = NOW() WHERE id = %s;", (shift_id,))
        conn.commit()
        cur.close()
        return jsonify({"message": "Shift ended"})
    except Exception as e:
        print(f"❌ Error in end_shift: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/shift-summary/<shift_id>", methods=["GET"])
def shift_summary(shift_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT agent_id, login_time, logout_time, triaged_count FROM shifts WHERE id = %s;", (shift_id,))
        shift = cur.fetchone()
        if not shift:
            cur.close()
            return jsonify({"error": "Shift not found"}), 404
        
        cur.execute("SELECT ticket_number, description, created_at FROM tickets WHERE shift_id = %s ORDER BY created_at;", (shift_id,))
        tickets = [{"number": t[0], "description": t[1], "created_at": str(t[2])} for t in cur.fetchall()]
        
        cur.execute("SELECT monitor, alert_type, comment, created_at FROM alerts WHERE shift_id = %s ORDER BY created_at;", (shift_id,))
        alerts = [{"monitor": a[0], "type": a[1], "comment": a[2], "created_at": str(a[3])} for a in cur.fetchall()]
        
        cur.execute("SELECT description, created_at FROM incident_status WHERE shift_id = %s ORDER BY created_at;", (shift_id,))
        incidents = [{"description": i[0], "created_at": str(i[1])} for i in cur.fetchall()]
        
        cur.execute("SELECT task, created_at FROM adhoc_tasks WHERE shift_id = %s ORDER BY created_at;", (shift_id,))
        adhoc = [{"task": a[0], "created_at": str(a[1])} for a in cur.fetchall()]
        
        cur.close()
        return jsonify({
            "agent_id": shift[0], "start_time": str(shift[1]), "end_time": str(shift[2]),
            "triaged_count": shift[3], "ticket_count": len(tickets), "alert_count": len(alerts),
            "incident_count": len(incidents), "adhoc_count": len(adhoc),
            "tickets": tickets, "alerts": alerts, "incidents": incidents, "adhoc_tasks": adhoc
        })
    except Exception as e:
        print(f"❌ Error in shift_summary: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)


# ========================================
# MANAGER ENDPOINTS
# ========================================

@app.route("/manager/active-agents", methods=["GET"])
def get_active_agents():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT s.id, s.agent_id, s.login_time, s.triaged_count,
                   EXTRACT(EPOCH FROM (NOW() - s.login_time))/3600 as hours_worked,
                   COUNT(DISTINCT t.id) as ticket_count, COUNT(DISTINCT a.id) as alert_count,
                   COUNT(DISTINCT i.id) as incident_count, COUNT(DISTINCT ad.id) as adhoc_count
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
            hours = agent[4] if agent[4] > 0 else 1
            result.append({
                "shift_id": str(agent[0]), "agent_id": str(agent[1]), "login_time": str(agent[2]),
                "triaged_count": agent[3], "hours_worked": round(agent[4], 2),
                "ticket_count": agent[5], "alert_count": agent[6],
                "incident_count": agent[7], "adhoc_count": agent[8],
                "productivity_rate": round(agent[3] / hours, 2)
            })
        cur.close()
        return jsonify({"active_agents": result, "count": len(result)})
    except Exception as e:
        print(f"❌ Error in get_active_agents: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/manager/shifts", methods=["GET"])
def get_all_shifts():
    conn = None
    try:
        agent_id = request.args.get('agent_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
            SELECT s.id, s.agent_id, s.login_time, s.logout_time, s.triaged_count,
                   EXTRACT(EPOCH FROM (COALESCE(s.logout_time, NOW()) - s.login_time))/3600 as hours_worked,
                   COUNT(DISTINCT t.id) as ticket_count, COUNT(DISTINCT a.id) as alert_count,
                   COUNT(DISTINCT i.id) as incident_count, COUNT(DISTINCT ad.id) as adhoc_count
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
        query += " GROUP BY s.id, s.agent_id, s.login_time, s.logout_time, s.triaged_count ORDER BY s.login_time DESC LIMIT 100;"
        
        cur.execute(query, params)
        shifts = cur.fetchall()
        result = []
        for shift in shifts:
            result.append({
                "shift_id": str(shift[0]), "agent_id": str(shift[1]), "login_time": str(shift[2]),
                "logout_time": str(shift[3]) if shift[3] else None, "triaged_count": shift[4],
                "hours_worked": round(shift[5], 2), "ticket_count": shift[6], "alert_count": shift[7],
                "incident_count": shift[8], "adhoc_count": shift[9],
                "status": "active" if shift[3] is None else "completed"
            })
        cur.close()
        return jsonify({"shifts": result, "count": len(result)})
    except Exception as e:
        print(f"❌ Error in get_all_shifts: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/manager/agent-stats/<agent_id>", methods=["GET"])
def get_agent_stats(agent_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT COUNT(*) as total_shifts, SUM(triaged_count) as total_triaged,
                   AVG(triaged_count) as avg_triaged_per_shift,
                   SUM(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600) as total_hours
            FROM shifts WHERE agent_id = %s;
        """, (agent_id,))
        overall = cur.fetchone()
        
        cur.execute("""
            SELECT DATE(login_time) as shift_date, COUNT(*) as shift_count, SUM(triaged_count) as triaged,
                   SUM(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600) as hours
            FROM shifts WHERE agent_id = %s AND login_time >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(login_time) ORDER BY shift_date DESC;
        """, (agent_id,))
        recent_activity = cur.fetchall()
        
        cur.execute("SELECT COUNT(*) FROM tickets t JOIN shifts s ON t.shift_id = s.id WHERE s.agent_id = %s;", (agent_id,))
        total_tickets = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM alerts a JOIN shifts s ON a.shift_id = s.id WHERE s.agent_id = %s;", (agent_id,))
        total_alerts = cur.fetchone()[0]
        
        cur.close()
        return jsonify({
            "agent_id": agent_id,
            "overall": {
                "total_shifts": overall[0], "total_triaged": overall[1] or 0,
                "avg_triaged_per_shift": round(float(overall[2] or 0), 2),
                "total_hours": round(float(overall[3] or 0), 2),
                "total_tickets": total_tickets, "total_alerts": total_alerts
            },
            "recent_activity": [
                {"date": str(r[0]), "shift_count": r[1], "triaged": r[2] or 0, "hours": round(float(r[3] or 0), 2)}
                for r in recent_activity
            ]
        })
    except Exception as e:
        print(f"❌ Error in get_agent_stats: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/manager/analytics", methods=["GET"])
def get_analytics():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT COUNT(DISTINCT s.id), COUNT(DISTINCT s.agent_id), SUM(s.triaged_count),
                   COUNT(DISTINCT t.id), COUNT(DISTINCT a.id)
            FROM shifts s
            LEFT JOIN tickets t ON t.shift_id = s.id
            LEFT JOIN alerts a ON a.shift_id = s.id
            WHERE DATE(s.login_time) = CURRENT_DATE;
        """)
        today = cur.fetchone()
        
        cur.execute("""
            SELECT COUNT(DISTINCT s.id), SUM(s.triaged_count),
                   AVG(EXTRACT(EPOCH FROM (COALESCE(s.logout_time, NOW()) - s.login_time))/3600)
            FROM shifts s WHERE s.login_time >= DATE_TRUNC('week', CURRENT_DATE);
        """)
        week = cur.fetchone()
        
        cur.execute("SELECT COUNT(*) FROM shifts WHERE logout_time IS NULL;")
        active_now = cur.fetchone()[0]
        
        cur.close()
        return jsonify({
            "today": {
                "shifts": today[0] or 0, "agents_active": today[1] or 0, "triaged": today[2] or 0,
                "tickets": today[3] or 0, "alerts": today[4] or 0
            },
            "this_week": {
                "shifts": week[0] or 0, "triaged": week[1] or 0,
                "avg_shift_hours": round(float(week[2] or 0), 2)
            },
            "active_now": active_now
        })
    except Exception as e:
        print(f"❌ Error in get_analytics: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/manager/shift-details/<shift_id>", methods=["GET"])
def get_shift_details(shift_id):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT agent_id, login_time, logout_time, triaged_count FROM shifts WHERE id = %s;", (shift_id,))
        shift = cur.fetchone()
        if not shift:
            cur.close()
            return jsonify({"error": "Shift not found"}), 404
        
        cur.execute("SELECT ticket_number, description, created_at FROM tickets WHERE shift_id = %s ORDER BY created_at;", (shift_id,))
        tickets = [{"number": t[0], "description": t[1], "time": str(t[2])} for t in cur.fetchall()]
        
        cur.execute("SELECT monitor, alert_type, comment, created_at FROM alerts WHERE shift_id = %s ORDER BY created_at;", (shift_id,))
        alerts = [{"monitor": a[0], "type": a[1], "comment": a[2], "time": str(a[3])} for a in cur.fetchall()]
        
        cur.execute("SELECT description, created_at FROM incident_status WHERE shift_id = %s ORDER BY created_at;", (shift_id,))
        incidents = [{"description": i[0], "time": str(i[1])} for i in cur.fetchall()]
        
        cur.execute("SELECT task, created_at FROM adhoc_tasks WHERE shift_id = %s ORDER BY created_at;", (shift_id,))
        adhoc = [{"task": a[0], "time": str(a[1])} for a in cur.fetchall()]
        
        cur.close()
        return jsonify({
            "shift_id": shift_id, "agent_id": str(shift[0]), "login_time": str(shift[1]),
            "logout_time": str(shift[2]) if shift[2] else None, "triaged_count": shift[3],
            "tickets": tickets, "alerts": alerts, "incidents": incidents, "adhoc_tasks": adhoc
        })
    except Exception as e:
        print(f"❌ Error in get_shift_details: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

# Advanced Analytics Endpoint
@app.route("/manager/advanced-analytics", methods=["GET"])
def get_advanced_analytics():
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Performance Trends
        cur.execute("""
            SELECT DATE(login_time) as date, COUNT(DISTINCT id) as shifts, COUNT(DISTINCT agent_id) as unique_agents,
                   SUM(triaged_count) as total_triaged, AVG(triaged_count) as avg_triaged,
                   AVG(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600) as avg_hours
            FROM shifts WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(login_time) ORDER BY date;
        """)
        performance_trends = [
            {"date": str(t[0]), "shifts": t[1], "unique_agents": t[2], "total_triaged": t[3] or 0,
             "avg_triaged": round(float(t[4] or 0), 2), "avg_hours": round(float(t[5] or 0), 2)}
            for t in cur.fetchall()
        ]
        
        # Agent Rankings
        cur.execute("""
            SELECT agent_id, COUNT(*) as total_shifts, SUM(triaged_count) as total_triaged,
                   AVG(triaged_count) as avg_triaged,
                   SUM(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600) as total_hours,
                   CASE WHEN SUM(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600) > 0
                        THEN SUM(triaged_count) / SUM(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600)
                        ELSE 0 END as productivity_rate
            FROM shifts WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY agent_id ORDER BY productivity_rate DESC LIMIT 20;
        """)
        agent_rankings = [
            {"agent_id": str(r[0]), "total_shifts": r[1], "total_triaged": r[2] or 0,
             "avg_triaged": round(float(r[3] or 0), 2), "total_hours": round(float(r[4] or 0), 2),
             "productivity_rate": round(float(r[5] or 0), 2), "rank": idx + 1}
            for idx, r in enumerate(cur.fetchall())
        ]
        
        # Hourly Distribution
        cur.execute("""
            SELECT EXTRACT(HOUR FROM login_time) as hour, COUNT(*) as shift_count,
                   SUM(triaged_count) as total_triaged, AVG(triaged_count) as avg_triaged
            FROM shifts WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY EXTRACT(HOUR FROM login_time) ORDER BY hour;
        """)
        hourly_distribution = [
            {"hour": int(h[0]), "shift_count": h[1], "total_triaged": h[2] or 0, "avg_triaged": round(float(h[3] or 0), 2)}
            for h in cur.fetchall()
        ]
        
        # Daily Distribution
        cur.execute("""
            SELECT EXTRACT(DOW FROM login_time) as day_of_week, COUNT(*) as shift_count,
                   SUM(triaged_count) as total_triaged, AVG(triaged_count) as avg_triaged,
                   COUNT(DISTINCT agent_id) as unique_agents
            FROM shifts WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY EXTRACT(DOW FROM login_time) ORDER BY day_of_week;
        """)
        daily_distribution = [
            {"day_of_week": int(d[0]),
             "day_name": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][int(d[0])],
             "shift_count": d[1], "total_triaged": d[2] or 0, "avg_triaged": round(float(d[3] or 0), 2),
             "unique_agents": d[4]}
            for d in cur.fetchall()
        ]
        
        # Alert Analysis
        cur.execute("""
            SELECT alert_type, COUNT(*) as count, COUNT(DISTINCT shift_id) as shifts_affected
            FROM alerts WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY alert_type ORDER BY count DESC;
        """)
        alert_analysis = [{"alert_type": a[0], "count": a[1], "shifts_affected": a[2]} for a in cur.fetchall()]
        
        # Monitor Analysis
        cur.execute("""
            SELECT monitor, COUNT(*) as alert_count, COUNT(DISTINCT shift_id) as shifts_affected,
                   COUNT(DISTINCT alert_type) as unique_alert_types
            FROM alerts WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY monitor ORDER BY alert_count DESC LIMIT 10;
        """)
        monitor_analysis = [
            {"monitor": m[0], "alert_count": m[1], "shifts_affected": m[2], "unique_alert_types": m[3]}
            for m in cur.fetchall()
        ]
        
        # Shift Duration Stats
        cur.execute("""
            SELECT EXTRACT(EPOCH FROM (logout_time - login_time))/3600 as duration_hours
            FROM shifts WHERE logout_time IS NOT NULL AND login_time >= CURRENT_DATE - INTERVAL '30 days';
        """)
        durations = [float(d[0]) for d in cur.fetchall() if d[0]]
        shift_duration_stats = {}
        if durations:
            shift_duration_stats = {
                "min": round(min(durations), 2), "max": round(max(durations), 2),
                "avg": round(statistics.mean(durations), 2), "median": round(statistics.median(durations), 2),
                "std_dev": round(statistics.stdev(durations), 2) if len(durations) > 1 else 0
            }
        
        # Productivity Stats
        cur.execute("""
            SELECT triaged_count, EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600 as hours
            FROM shifts WHERE login_time >= CURRENT_DATE - INTERVAL '30 days';
        """)
        productivity_rates = [round(p[0] / p[1], 2) if p[1] > 0 else 0 for p in cur.fetchall() if p[0] and p[1]]
        productivity_stats = {}
        if productivity_rates:
            productivity_stats = {
                "min": round(min(productivity_rates), 2), "max": round(max(productivity_rates), 2),
                "avg": round(statistics.mean(productivity_rates), 2), "median": round(statistics.median(productivity_rates), 2),
                "std_dev": round(statistics.stdev(productivity_rates), 2) if len(productivity_rates) > 1 else 0
            }
        
        # Incident Pattern
        cur.execute("""
            SELECT DATE(created_at) as date, COUNT(*) as incident_count
            FROM incident_status WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at) ORDER BY date;
        """)
        incident_pattern = [{"date": str(i[0]), "count": i[1]} for i in cur.fetchall()]
        
        # Ticket Volume
        cur.execute("""
            SELECT DATE(created_at) as date, COUNT(*) as ticket_count
            FROM tickets WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at) ORDER BY date;
        """)
        ticket_volume = [{"date": str(t[0]), "count": t[1]} for t in cur.fetchall()]
        
        # Agent Consistency
        cur.execute("""
            SELECT agent_id, STDDEV(triaged_count) as triaged_variance, AVG(triaged_count) as avg_triaged
            FROM shifts WHERE login_time >= CURRENT_DATE - INTERVAL '30 days' AND logout_time IS NOT NULL
            GROUP BY agent_id HAVING COUNT(*) >= 3 ORDER BY triaged_variance;
        """)
        agent_consistency = [
            {"agent_id": str(c[0]), "variance": round(float(c[1] or 0), 2),
             "avg_triaged": round(float(c[2] or 0), 2),
             "consistency_score": round(100 - min(float(c[1] or 0) * 10, 100), 2) if c[1] else 100}
            for c in cur.fetchall()
        ][:10]
        
        # Peak Hour
        peak_hour = max(hourly_distribution, key=lambda x: x['total_triaged']) if hourly_distribution else None
        
        # Coverage Analysis
        cur.execute("""
            SELECT EXTRACT(HOUR FROM login_time) as hour, AVG(agent_count) as avg_agents
            FROM (
                SELECT login_time, COUNT(DISTINCT agent_id) OVER (
                    PARTITION BY DATE_TRUNC('hour', login_time)
                ) as agent_count
                FROM shifts WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
            ) subq
            GROUP BY EXTRACT(HOUR FROM login_time) ORDER BY hour;
        """)
        coverage_analysis = [{"hour": int(c[0]), "avg_agents": round(float(c[1] or 0), 2)} for c in cur.fetchall()]
        
        # Generate Insights
        insights = []
        if productivity_stats and agent_rankings:
            top = agent_rankings[0] if agent_rankings else None
            if top:
                insights.append({
                    "type": "productivity", "severity": "info", "title": "Top Performer",
                    "message": f"Agent {top['agent_id'][:8]} leads with {top['productivity_rate']} cases/hour",
                    "value": top['productivity_rate']
                })
        if alert_analysis:
            total_alerts = sum(a['count'] for a in alert_analysis)
            if total_alerts > 0:
                top_alert = alert_analysis[0]
                insights.append({
                    "type": "alert", "severity": "warning" if total_alerts > 50 else "info",
                    "title": "Alert Pattern",
                    "message": f"{top_alert['alert_type']} is the most common alert ({top_alert['count']} occurrences)",
                    "value": total_alerts
                })
        if coverage_analysis:
            low_coverage = [c for c in coverage_analysis if c['avg_agents'] < 2]
            if low_coverage:
                insights.append({
                    "type": "coverage", "severity": "warning", "title": "Low Coverage Hours",
                    "message": f"{len(low_coverage)} hours have insufficient agent coverage",
                    "value": len(low_coverage)
                })
        if len(performance_trends) >= 7:
            recent_week = performance_trends[-7:]
            prev_week = performance_trends[-14:-7] if len(performance_trends) >= 14 else []
            if prev_week:
                recent_avg = statistics.mean([t['total_triaged'] for t in recent_week])
                prev_avg = statistics.mean([t['total_triaged'] for t in prev_week])
                if prev_avg > 0:
                    change = ((recent_avg - prev_avg) / prev_avg) * 100
                    insights.append({
                        "type": "trend", "severity": "success" if change > 0 else "warning",
                        "title": "Weekly Trend",
                        "message": f"Productivity {'increased' if change > 0 else 'decreased'} by {abs(round(change, 1))}% this week",
                        "value": round(change, 1)
                    })
        
        cur.close()
        return jsonify({
            "performance_trends": performance_trends, "agent_rankings": agent_rankings,
            "hourly_distribution": hourly_distribution, "daily_distribution": daily_distribution,
            "alert_analysis": alert_analysis, "monitor_analysis": monitor_analysis,
            "shift_duration_stats": shift_duration_stats, "productivity_stats": productivity_stats,
            "incident_pattern": incident_pattern, "ticket_volume": ticket_volume,
            "agent_consistency": agent_consistency, "peak_hour": peak_hour,
            "coverage_analysis": coverage_analysis, "insights": insights
        })
    except Exception as e:
        print(f"❌ Error in get_advanced_analytics: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)


if __name__ == "__main__":
    initialize_pool()
    if connection_pool:
        print("🚀 Unified backend starting on port 5000...")
        print("📊 Agent endpoints: /check-active-shift, /start-shift, etc.")
        print("📈 Manager endpoints: /manager/active-agents, /manager/analytics, etc.")
        app.run(debug=True, host="0.0.0.0", port=5000)
    else:
        print("❌ Failed to initialize connection pool")