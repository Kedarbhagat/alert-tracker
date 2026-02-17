from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2 import pool
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
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
    try:
        return connection_pool.getconn()
    except Exception as e:
        print(f"❌ Error getting connection from pool: {e}")
        return None

def return_connection(conn):
    if conn:
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
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        agent_id = data.get("agent_id")
        agent_name = data.get("agent_name")
        
        if not agent_id:
            return jsonify({"error": "agent_id is required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
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
                "agent_id": agent_id
            })
        return jsonify({
            "has_active_shift": False,
            "agent_id": agent_id
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
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        agent_id = data.get("agent_id")
        if not agent_id:
            return jsonify({"error": "agent_id is required"}), 400
            
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
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
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        shift_id = data.get("shift_id")
        change = data.get("change")
        
        if shift_id is None or change is None:
            return jsonify({"error": "shift_id and change are required"}), 400
            
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        cur.execute("""
            UPDATE shifts SET triaged_count = GREATEST(triaged_count + %s, 0)
            WHERE id = %s RETURNING triaged_count;
        """, (change, shift_id))
        result = cur.fetchone()
        if not result:
            cur.close()
            return jsonify({"error": "Shift not found"}), 404
            
        new_count = result[0]
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
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        shift_id = data.get("shift_id")
        tickets = data.get("tickets", [])
        
        if not shift_id:
            return jsonify({"error": "shift_id is required"}), 400
        if not tickets:
            return jsonify({"error": "tickets array is required"}), 400
            
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        for ticket in tickets:
            if not ticket.get("number"):
                continue
            cur.execute("""
                INSERT INTO tickets (shift_id, ticket_number, description)
                VALUES (%s, %s, %s);
            """, (shift_id, ticket["number"], ticket.get("description", "")))
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
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        shift_id = data.get("shift_id")
        monitor = data.get("monitor")
        alert_type = data.get("alert_type")
        comment = data.get("comment", "")
        
        if not all([shift_id, monitor, alert_type]):
            return jsonify({"error": "shift_id, monitor, and alert_type are required"}), 400
            
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
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
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        shift_id = data.get("shift_id")
        description = data.get("description")
        
        if not all([shift_id, description]):
            return jsonify({"error": "shift_id and description are required"}), 400
            
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO incident_status (shift_id, description)
            VALUES (%s, %s);
        """, (shift_id, description))
        conn.commit()
        cur.close()
        return jsonify({"message": "Incident added successfully"})
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
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        shift_id = data.get("shift_id")
        task = data.get("task")
        
        if not all([shift_id, task]):
            return jsonify({"error": "shift_id and task are required"}), 400
            
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO adhoc_tasks (shift_id, task)
            VALUES (%s, %s);
        """, (shift_id, task))
        conn.commit()
        cur.close()
        return jsonify({"message": "Ad-hoc task added successfully"})
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
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        shift_id = data.get("shift_id")
        if not shift_id:
            return jsonify({"error": "shift_id is required"}), 400
            
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        cur.execute("""
            UPDATE shifts SET logout_time = NOW()
            WHERE id = %s AND logout_time IS NULL
            RETURNING id;
        """, (shift_id,))
        result = cur.fetchone()
        if not result:
            cur.close()
            return jsonify({"error": "Shift not found or already ended"}), 404
            
        conn.commit()
        cur.close()
        return jsonify({"message": "Shift ended successfully"})
    except Exception as e:
        print(f"❌ Error in end_shift: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/shift-summary/<shift_id>", methods=["GET", "OPTIONS"])
def get_shift_summary(shift_id):
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        
        # Get shift details
        cur.execute("""
            SELECT agent_id, login_time, logout_time, triaged_count
            FROM shifts WHERE id = %s;
        """, (shift_id,))
        shift = cur.fetchone()
        
        if not shift:
            cur.close()
            return jsonify({"error": "Shift not found"}), 404
        
        # Get tickets
        cur.execute("""
            SELECT ticket_number, description, created_at
            FROM tickets WHERE shift_id = %s ORDER BY created_at;
        """, (shift_id,))
        tickets = [
            {
                "number": t[0],
                "description": t[1],
                "created_at": t[2].isoformat() if t[2] else None
            }
            for t in cur.fetchall()
        ]
        
        # Get alerts
        cur.execute("""
            SELECT monitor, alert_type, comment, created_at
            FROM alerts WHERE shift_id = %s ORDER BY created_at;
        """, (shift_id,))
        alerts = [
            {
                "monitor": a[0],
                "type": a[1],
                "comment": a[2],
                "created_at": a[3].isoformat() if a[3] else None
            }
            for a in cur.fetchall()
        ]
        
        # Get incidents
        cur.execute("""
            SELECT description, created_at
            FROM incident_status WHERE shift_id = %s ORDER BY created_at;
        """, (shift_id,))
        incidents = [
            {
                "description": i[0],
                "created_at": i[1].isoformat() if i[1] else None
            }
            for i in cur.fetchall()
        ]
        
        # Get ad-hoc tasks
        cur.execute("""
            SELECT task, created_at
            FROM adhoc_tasks WHERE shift_id = %s ORDER BY created_at;
        """, (shift_id,))
        adhoc_tasks = [
            {
                "task": a[0],
                "created_at": a[1].isoformat() if a[1] else None
            }
            for a in cur.fetchall()
        ]
        
        cur.close()
        
        return jsonify({
            "agent_id": str(shift[0]),
            "start_time": shift[1].isoformat() if shift[1] else None,
            "end_time": shift[2].isoformat() if shift[2] else None,
            "triaged_count": shift[3] or 0,
            "ticket_count": len(tickets),
            "alert_count": len(alerts),
            "incident_count": len(incidents),
            "adhoc_count": len(adhoc_tasks),
            "tickets": tickets,
            "alerts": alerts,
            "incidents": incidents,
            "adhoc_tasks": adhoc_tasks
        })
    except Exception as e:
        print(f"❌ Error in get_shift_summary: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)



# ========================================
# MANAGER ENDPOINTS
# ========================================

@app.route("/manager/active-agents", methods=["GET", "OPTIONS"])
def get_active_agents():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        cur.execute("""
            SELECT s.id, s.agent_id, s.login_time, s.triaged_count,
                   EXTRACT(EPOCH FROM (NOW() - s.login_time))/3600 as hours_active
            FROM shifts s
            WHERE s.logout_time IS NULL
            ORDER BY s.login_time DESC;
        """)
        active_agents = [
            {
                "shift_id": str(a[0]) if a[0] else None,
                "agent_id": str(a[1]),
                "login_time": a[2].isoformat() if a[2] else None,
                "triaged_count": a[3] or 0,
                "hours_active": round(float(a[4] or 0), 2)
            }
            for a in cur.fetchall()
        ]
        cur.close()
        return jsonify({"active_agents": active_agents})
    except Exception as e:
        print(f"❌ Error in get_active_agents: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/manager/shifts", methods=["GET", "OPTIONS"])
def get_shifts():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        agent_id = request.args.get('agent_id')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        
        query = """
            SELECT id, agent_id, login_time, logout_time, triaged_count,
                   EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600 as duration_hours
            FROM shifts WHERE 1=1
        """
        params = []
        
        if start_date:
            query += " AND login_time >= %s"
            params.append(start_date)
        if end_date:
            query += " AND login_time <= %s"
            params.append(end_date + ' 23:59:59')
        if agent_id:
            query += " AND agent_id = %s"
            params.append(agent_id)
        
        query += " ORDER BY login_time DESC LIMIT 1000;"
        
        cur.execute(query, params)
        shifts = [
            {
                "id": str(s[0]) if s[0] else None,
                "agent_id": str(s[1]),
                "login_time": s[2].isoformat() if s[2] else None,
                "logout_time": s[3].isoformat() if s[3] else None,
                "triaged_count": s[4] or 0,
                "duration_hours": round(float(s[5] or 0), 2)
            }
            for s in cur.fetchall()
        ]
        cur.close()
        return jsonify({"shifts": shifts})
    except Exception as e:
        print(f"❌ Error in get_shifts: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/manager/analytics", methods=["GET", "OPTIONS"])
def get_analytics():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        
        # Active now
        cur.execute("SELECT COUNT(*) FROM shifts WHERE logout_time IS NULL;")
        active_now = cur.fetchone()[0]
        
        # Today's stats
        cur.execute("""
            SELECT COUNT(DISTINCT agent_id), COUNT(*), COALESCE(SUM(triaged_count), 0)
            FROM shifts WHERE DATE(login_time) = CURRENT_DATE;
        """)
        today = cur.fetchone()
        
        # This week's stats
        cur.execute("""
            SELECT COUNT(DISTINCT agent_id), COUNT(*), COALESCE(SUM(triaged_count), 0)
            FROM shifts WHERE login_time >= DATE_TRUNC('week', CURRENT_DATE);
        """)
        week = cur.fetchone()
        
        # This month's stats
        cur.execute("""
            SELECT COUNT(DISTINCT agent_id), COUNT(*), COALESCE(SUM(triaged_count), 0)
            FROM shifts WHERE login_time >= DATE_TRUNC('month', CURRENT_DATE);
        """)
        month = cur.fetchone()
        
        # Average productivity (cases per hour)
        cur.execute("""
            SELECT AVG(triaged_count / NULLIF(EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600, 0))
            FROM shifts
            WHERE logout_time IS NOT NULL 
            AND EXTRACT(EPOCH FROM (logout_time - login_time))/3600 > 0.5
            AND login_time >= CURRENT_DATE - INTERVAL '30 days';
        """)
        avg_productivity = cur.fetchone()[0]
        
        # Total alerts today
        cur.execute("""
            SELECT COUNT(*) FROM alerts 
            WHERE DATE(created_at) = CURRENT_DATE;
        """)
        alerts_today = cur.fetchone()[0]
        
        # Total tickets today
        cur.execute("""
            SELECT COUNT(*) FROM tickets 
            WHERE DATE(created_at) = CURRENT_DATE;
        """)
        tickets_today = cur.fetchone()[0]
        
        cur.close()
        return jsonify({
            "active_now": active_now,
            "today": {
                "agents_active": today[0] or 0,
                "total_shifts": today[1] or 0,
                "cases_triaged": today[2] or 0
            },
            "week": {
                "agents_active": week[0] or 0,
                "total_shifts": week[1] or 0,
                "cases_triaged": week[2] or 0
            },
            "month": {
                "agents_active": month[0] or 0,
                "total_shifts": month[1] or 0,
                "cases_triaged": month[2] or 0
            },
            "avg_productivity": round(float(avg_productivity or 0), 2),
            "alerts_today": alerts_today or 0,
            "tickets_today": tickets_today or 0
        })
    except Exception as e:
        print(f"❌ Error in get_analytics: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/manager/agent-stats/<agent_id>", methods=["GET", "OPTIONS"])
def get_agent_stats(agent_id):
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        
        # Total shifts
        cur.execute("SELECT COUNT(*) FROM shifts WHERE agent_id = %s;", (agent_id,))
        total_shifts = cur.fetchone()[0]
        
        # Total cases triaged
        cur.execute("SELECT COALESCE(SUM(triaged_count), 0) FROM shifts WHERE agent_id = %s;", (agent_id,))
        total_triaged = cur.fetchone()[0]
        
        # Average per shift
        avg_per_shift = round(total_triaged / total_shifts, 2) if total_shifts > 0 else 0
        
        # Recent shifts
        cur.execute("""
            SELECT id, login_time, logout_time, triaged_count,
                   EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600 as duration_hours
            FROM shifts WHERE agent_id = %s
            ORDER BY login_time DESC LIMIT 10;
        """, (agent_id,))
        recent_shifts = [
            {
                "id": str(s[0]) if s[0] else None,
                "login_time": s[1].isoformat() if s[1] else None,
                "logout_time": s[2].isoformat() if s[2] else None,
                "triaged_count": s[3] or 0,
                "duration_hours": round(float(s[4] or 0), 2)
            }
            for s in cur.fetchall()
        ]
        
        cur.close()
        return jsonify({
            "agent_id": agent_id,
            "total_shifts": total_shifts,
            "total_triaged": total_triaged,
            "avg_per_shift": avg_per_shift,
            "recent_shifts": recent_shifts
        })
    except Exception as e:
        print(f"❌ Error in get_agent_stats: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/manager/shift-details/<shift_id>", methods=["GET", "OPTIONS"])
def get_shift_details(shift_id):
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        
        # Shift info
        cur.execute("""
            SELECT agent_id, login_time, logout_time, triaged_count
            FROM shifts WHERE id = %s;
        """, (shift_id,))
        shift = cur.fetchone()
        
        if not shift:
            cur.close()
            return jsonify({"error": "Shift not found"}), 404
        
        # Tickets
        cur.execute("""
            SELECT ticket_number, description, created_at
            FROM tickets WHERE shift_id = %s ORDER BY created_at;
        """, (shift_id,))
        tickets = [
            {
                "number": t[0],
                "description": t[1],
                "created_at": t[2].isoformat() if t[2] else None
            }
            for t in cur.fetchall()
        ]
        
        # Alerts
        cur.execute("""
            SELECT monitor, alert_type, comment, created_at
            FROM alerts WHERE shift_id = %s ORDER BY created_at;
        """, (shift_id,))
        alerts = [
            {
                "monitor": a[0],
                "type": a[1],
                "comment": a[2],
                "created_at": a[3].isoformat() if a[3] else None
            }
            for a in cur.fetchall()
        ]
        
        # Incidents
        cur.execute("""
            SELECT description, created_at
            FROM incident_status WHERE shift_id = %s ORDER BY created_at;
        """, (shift_id,))
        incidents = [
            {
                "description": i[0],
                "created_at": i[1].isoformat() if i[1] else None
            }
            for i in cur.fetchall()
        ]
        
        # Ad-hoc tasks
        cur.execute("""
            SELECT task, created_at
            FROM adhoc_tasks WHERE shift_id = %s ORDER BY created_at;
        """, (shift_id,))
        adhoc_tasks = [
            {
                "task": t[0],
                "created_at": t[1].isoformat() if t[1] else None
            }
            for t in cur.fetchall()
        ]
        
        cur.close()
        return jsonify({
            "agent_id": str(shift[0]),
            "login_time": shift[1].isoformat() if shift[1] else None,
            "logout_time": shift[2].isoformat() if shift[2] else None,
            "triaged_count": shift[3] or 0,
            "tickets": tickets,
            "alerts": alerts,
            "incidents": incidents,
            "adhoc_tasks": adhoc_tasks
        })
    except Exception as e:
        print(f"❌ Error in get_shift_details: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)

@app.route("/manager/advanced-analytics", methods=["GET", "OPTIONS"])
def get_advanced_analytics():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
            
        cur = conn.cursor()
        
        # Performance Trends (Last 30 days)
        cur.execute("""
            SELECT DATE(login_time) as date,
                   COUNT(DISTINCT agent_id) as agents,
                   COUNT(*) as shifts,
                   COALESCE(SUM(triaged_count), 0) as total_triaged,
                   COALESCE(AVG(triaged_count), 0) as avg_triaged
            FROM shifts
            WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(login_time)
            ORDER BY date;
        """)
        performance_trends = [
            {
                "date": str(p[0]),
                "agents": p[1],
                "shifts": p[2],
                "total_triaged": p[3] or 0,
                "avg_triaged": round(float(p[4] or 0), 2)
            }
            for p in cur.fetchall()
        ]
        
        # Agent Rankings
        cur.execute("""
            SELECT s.agent_id,
                   COUNT(*) as shift_count,
                   COALESCE(SUM(s.triaged_count), 0) as total_triaged,
                   COALESCE(AVG(s.triaged_count), 0) as avg_triaged,
                   COALESCE(AVG(s.triaged_count / NULLIF(EXTRACT(EPOCH FROM (COALESCE(s.logout_time, NOW()) - s.login_time))/3600, 0)), 0) as productivity_rate
            FROM shifts s
            WHERE s.login_time >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY s.agent_id
            HAVING COUNT(*) >= 3
            ORDER BY productivity_rate DESC;
        """)
        agent_rankings = [
            {
                "rank": idx + 1,
                "agent_id": str(r[0]),
                "shift_count": r[1],
                "total_triaged": r[2] or 0,
                "avg_triaged": round(float(r[3] or 0), 2),
                "productivity_rate": round(float(r[4] or 0), 2)
            }
            for idx, r in enumerate(cur.fetchall())
        ]
        
        # Hourly Distribution
        cur.execute("""
            SELECT EXTRACT(HOUR FROM login_time) as hour,
                   COUNT(*) as shift_count,
                   COALESCE(SUM(triaged_count), 0) as total_triaged,
                   COALESCE(AVG(triaged_count), 0) as avg_triaged
            FROM shifts
            WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY EXTRACT(HOUR FROM login_time)
            ORDER BY hour;
        """)
        hourly_distribution = [
            {
                "hour": int(h[0]),
                "shift_count": h[1],
                "total_triaged": h[2] or 0,
                "avg_triaged": round(float(h[3] or 0), 2)
            }
            for h in cur.fetchall()
        ]
        
        # Daily Distribution
        cur.execute("""
            SELECT EXTRACT(DOW FROM login_time) as day_of_week,
                   COUNT(*) as shift_count,
                   COALESCE(SUM(triaged_count), 0) as total_triaged,
                   COALESCE(AVG(triaged_count), 0) as avg_triaged,
                   COUNT(DISTINCT agent_id) as unique_agents
            FROM shifts
            WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY EXTRACT(DOW FROM login_time)
            ORDER BY day_of_week;
        """)
        daily_distribution = [
            {
                "day_of_week": int(d[0]),
                "day_name": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][int(d[0])],
                "shift_count": d[1],
                "total_triaged": d[2] or 0,
                "avg_triaged": round(float(d[3] or 0), 2),
                "unique_agents": d[4]
            }
            for d in cur.fetchall()
        ]
        
        # Alert Analysis
        cur.execute("""
            SELECT alert_type,
                   COUNT(*) as count,
                   COUNT(DISTINCT shift_id) as shifts_affected
            FROM alerts
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY alert_type
            ORDER BY count DESC;
        """)
        alert_analysis = [
            {
                "alert_type": a[0],
                "count": a[1],
                "shifts_affected": a[2]
            }
            for a in cur.fetchall()
        ]
        
        # Monitor Analysis
        cur.execute("""
            SELECT monitor,
                   COUNT(*) as alert_count,
                   COUNT(DISTINCT shift_id) as shifts_affected,
                   COUNT(DISTINCT alert_type) as unique_alert_types
            FROM alerts
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY monitor
            ORDER BY alert_count DESC
            LIMIT 10;
        """)
        monitor_analysis = [
            {
                "monitor": m[0],
                "alert_count": m[1],
                "shifts_affected": m[2],
                "unique_alert_types": m[3]
            }
            for m in cur.fetchall()
        ]
        
        # Shift Duration Stats
        cur.execute("""
            SELECT EXTRACT(EPOCH FROM (logout_time - login_time))/3600 as duration_hours
            FROM shifts
            WHERE logout_time IS NOT NULL
            AND login_time >= CURRENT_DATE - INTERVAL '30 days'
            AND EXTRACT(EPOCH FROM (logout_time - login_time))/3600 > 0;
        """)
        durations = [float(d[0]) for d in cur.fetchall() if d[0] and d[0] > 0]
        shift_duration_stats = {}
        if durations:
            shift_duration_stats = {
                "min": round(min(durations), 2),
                "max": round(max(durations), 2),
                "avg": round(statistics.mean(durations), 2),
                "median": round(statistics.median(durations), 2),
                "std_dev": round(statistics.stdev(durations), 2) if len(durations) > 1 else 0
            }
        
        # Productivity Stats
        cur.execute("""
            SELECT triaged_count,
                   EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600 as hours
            FROM shifts
            WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
            AND EXTRACT(EPOCH FROM (COALESCE(logout_time, NOW()) - login_time))/3600 > 0.5;
        """)
        productivity_rates = [
            round(p[0] / p[1], 2) if p[1] > 0 else 0
            for p in cur.fetchall()
            if p[0] is not None and p[1] and p[1] > 0
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
        
        # Incident Pattern
        cur.execute("""
            SELECT DATE(created_at) as date,
                   COUNT(*) as incident_count
            FROM incident_status
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date;
        """)
        incident_pattern = [
            {
                "date": str(i[0]),
                "count": i[1]
            }
            for i in cur.fetchall()
        ]
        
        # Ticket Volume
        cur.execute("""
            SELECT DATE(created_at) as date,
                   COUNT(*) as ticket_count
            FROM tickets
            WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date;
        """)
        ticket_volume = [
            {
                "date": str(t[0]),
                "count": t[1]
            }
            for t in cur.fetchall()
        ]
        
        # Agent Consistency
        cur.execute("""
            SELECT agent_id,
                   STDDEV(triaged_count) as triaged_variance,
                   AVG(triaged_count) as avg_triaged
            FROM shifts
            WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
            AND logout_time IS NOT NULL
            GROUP BY agent_id
            HAVING COUNT(*) >= 3
            ORDER BY triaged_variance;
        """)
        agent_consistency = [
            {
                "agent_id": str(c[0]),
                "variance": round(float(c[1] or 0), 2),
                "avg_triaged": round(float(c[2] or 0), 2),
                "consistency_score": round(100 - min(float(c[1] or 0) * 10, 100), 2) if c[1] else 100
            }
            for c in cur.fetchall()
        ][:10]
        
        # Peak Hour
        peak_hour = max(hourly_distribution, key=lambda x: x['total_triaged']) if hourly_distribution else None
        
        # Coverage Analysis — count distinct agents per hour-of-day slot
        # (DISTINCT inside a window function is not supported in PostgreSQL,
        #  so we aggregate in a subquery first then average across days)
        cur.execute("""
            SELECT hour, AVG(agents_in_slot) as avg_agents
            FROM (
                SELECT DATE_TRUNC('hour', login_time)          AS hour_slot,
                       EXTRACT(HOUR FROM login_time)::int       AS hour,
                       COUNT(DISTINCT agent_id)                 AS agents_in_slot
                FROM shifts
                WHERE login_time >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE_TRUNC('hour', login_time),
                         EXTRACT(HOUR FROM login_time)
            ) hourly
            GROUP BY hour
            ORDER BY hour;
        """)
        coverage_analysis = [
            {
                "hour": int(c[0]),
                "avg_agents": round(float(c[1] or 0), 2)
            }
            for c in cur.fetchall()
        ]
        
        # Generate Insights
        insights = []
        if productivity_stats and agent_rankings:
            top = agent_rankings[0] if agent_rankings else None
            if top:
                insights.append({
                    "type": "productivity",
                    "severity": "info",
                    "title": "Top Performer",
                    "message": f"Agent {top['agent_id'][:8]} leads with {top['productivity_rate']} cases/hour",
                    "value": top['productivity_rate']
                })
        
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
            "agent_consistency": agent_consistency,
            "peak_hour": peak_hour,
            "coverage_analysis": coverage_analysis,
            "insights": insights
        })
    except Exception as e:
        print(f"❌ Error in get_advanced_analytics: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)


# ========================================
# USER MANAGEMENT ENDPOINTS
# ========================================
# Run this SQL ONCE in your Supabase SQL editor before using these endpoints:
#
#   CREATE TABLE IF NOT EXISTS agents (
#       id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
#       name       VARCHAR(120) NOT NULL,
#       created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
#   );

@app.route("/manager/users", methods=["GET", "OPTIONS"])
def list_users():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        cur.execute("""
            SELECT
                a.id::text,
                a.name,
                a.email,
                a.role,
                a.created_at,
                COUNT(s.id) AS total_shifts,
                EXISTS (
                    SELECT 1 FROM shifts
                    WHERE shifts.agent_id::text = a.id::text
                    AND shifts.logout_time IS NULL
                ) AS is_active
            FROM agents a
            LEFT JOIN shifts s ON s.agent_id::text = a.id::text
            GROUP BY a.id, a.name, a.email, a.role, a.created_at
            ORDER BY a.created_at DESC;
        """)
        rows = cur.fetchall()
        cur.close()

        users = [
            {
                "id":           r[0],
                "name":         r[1],
                "email":        r[2],
                "role":         r[3],
                "created_at":   r[4].isoformat() if r[4] else None,
                "total_shifts": int(r[5]),
                "is_active":    bool(r[6]),
            }
            for r in rows
        ]
        return jsonify({"users": users})
    except Exception as e:
        print(f"❌ Error in list_users: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)


@app.route("/manager/users", methods=["POST", "OPTIONS"])
def create_user():
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        name  = (data.get("name")  or "").strip()
        email = (data.get("email") or "").strip()
        role  = (data.get("role")  or "agent").strip()

        if not name:
            return jsonify({"error": "name is required"}), 400
        if not email:
            return jsonify({"error": "email is required"}), 400
        if len(name) > 120:
            return jsonify({"error": "name must be 120 characters or fewer"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()
        cur.execute("""
            INSERT INTO agents (name, email, role)
            VALUES (%s, %s, %s)
            RETURNING id::text, name, email, role, created_at;
        """, (name, email, role))
        row = cur.fetchone()
        conn.commit()
        cur.close()

        new_user = {
            "id":         row[0],
            "name":       row[1],
            "email":      row[2],
            "role":       row[3],
            "created_at": row[4].isoformat() if row[4] else None,
        }
        print(f"✅ New agent created: {new_user['name']} ({new_user['email']})  UUID={new_user['id']}")
        return jsonify({"message": "Agent created successfully", "user": new_user}), 201
    except Exception as e:
        print(f"❌ Error in create_user: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            return_connection(conn)


@app.route("/manager/users/<agent_id>", methods=["DELETE", "OPTIONS"])
def delete_user(agent_id):
    if request.method == "OPTIONS":
        return "", 200
    conn = None
    try:
        import uuid as _uuid
        try:
            _uuid.UUID(agent_id)
        except (ValueError, AttributeError):
            return jsonify({"error": "Invalid agent_id format"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cur = conn.cursor()

        # Refuse if agent currently has an active shift
        cur.execute("""
            SELECT COUNT(*) FROM shifts
            WHERE agent_id = %s AND logout_time IS NULL;
        """, (agent_id,))
        if cur.fetchone()[0] > 0:
            cur.close()
            return jsonify({"error": "Cannot delete an agent who is currently in an active shift"}), 409

        # Hard delete — fetch name first for the response message
        cur.execute("SELECT name FROM agents WHERE id::text = %s;", (agent_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            return jsonify({"error": "Agent not found"}), 404

        agent_name = row[0]
        cur.execute("DELETE FROM agents WHERE id::text = %s;", (agent_id,))
        conn.commit()
        cur.close()

        print(f"🗑️  Agent deleted: {agent_name}  UUID={agent_id}")
        return jsonify({"message": f"Agent '{agent_name}' deleted successfully"})
    except Exception as e:
        print(f"❌ Error in delete_user: {e}")
        if conn:
            conn.rollback()
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
        print("👥 User mgmt endpoints: /manager/users (GET, POST), /manager/users/<id> (DELETE)")
        app.run(debug=True, host="0.0.0.0", port=5000)
    else:
        print("❌ Failed to initialize connection pool")