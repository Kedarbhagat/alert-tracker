"""
Agent routes  —  /check-active-shift, /start-shift, /update-triage,
                 /add-*, /end-shift, /shift-summary/<id>
"""
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from config import get_conn, release_conn, fmt_ist, IST

agent_bp = Blueprint("agent", __name__)


# ── helpers ────────────────────────────────────────────────────────────────

def _require(data, *keys):
    """Return (None, error_response) if any key is missing/falsy."""
    missing = [k for k in keys if not data.get(k)]
    if missing:
        return None, jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400
    return data, None, None


def _db():
    conn = get_conn()
    if not conn:
        return None, (jsonify({"error": "Database connection failed"}), 500)
    return conn, None


# ── shift lifecycle ────────────────────────────────────────────────────────

@agent_bp.route("/check-active-shift", methods=["POST", "OPTIONS"])
def check_active_shift():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json or {}
    agent_id   = data.get("agent_id", "")
    agent_name = data.get("agent_name", "")

    if not agent_id:
        return jsonify({"error": "agent_id is required"}), 400

    # Validate / replace bad UUIDs
    try:
        uuid.UUID(agent_id)
        if "REAL_UUID" in agent_id or "placeholder" in agent_id.lower():
            raise ValueError
    except (ValueError, AttributeError):
        agent_id = str(uuid.uuid4())
        print(f"🆕 New UUID for {agent_name}: {agent_id}")

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, triaged_count FROM shifts "
            "WHERE agent_id = %s AND logout_time IS NULL "
            "ORDER BY login_time DESC LIMIT 1;",
            (agent_id,),
        )
        row = cur.fetchone()
        cur.close()

        if row:
            return jsonify({"has_active_shift": True, "shift_id": row[0],
                            "triaged_count": row[1], "agent_id": agent_id})
        return jsonify({"has_active_shift": False, "agent_id": agent_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


@agent_bp.route("/start-shift", methods=["POST", "OPTIONS"])
def start_shift():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json or {}
    agent_id = data.get("agent_id")
    if not agent_id:
        return jsonify({"error": "agent_id is required"}), 400

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO shifts (agent_id) VALUES (%s) RETURNING id;", (agent_id,))
        shift_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        return jsonify({"shift_id": shift_id, "triaged_count": 0})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


@agent_bp.route("/update-triage", methods=["POST", "OPTIONS"])
def update_triage():
    if request.method == "OPTIONS":
        return "", 200

    data     = request.json or {}
    shift_id = data.get("shift_id")
    change   = data.get("change")

    if shift_id is None or change is None:
        return jsonify({"error": "shift_id and change are required"}), 400

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE shifts SET triaged_count = GREATEST(triaged_count + %s, 0) "
            "WHERE id = %s RETURNING triaged_count;",
            (change, shift_id),
        )
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Shift not found"}), 404
        conn.commit()
        cur.close()
        return jsonify({"triaged_count": row[0]})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


@agent_bp.route("/end-shift", methods=["POST", "OPTIONS"])
def end_shift():
    if request.method == "OPTIONS":
        return "", 200

    data     = request.json or {}
    shift_id = data.get("shift_id")
    if not shift_id:
        return jsonify({"error": "shift_id is required"}), 400

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE shifts SET logout_time = NOW() "
            "WHERE id = %s AND logout_time IS NULL RETURNING id;",
            (shift_id,),
        )
        if not cur.fetchone():
            return jsonify({"error": "Shift not found or already ended"}), 404
        conn.commit()
        cur.close()
        return jsonify({"message": "Shift ended successfully"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


# ── simple insert helpers ──────────────────────────────────────────────────

def _simple_insert(table, columns, values, success_msg):
    """Generic single-row insert used by the add-* endpoints."""
    conn, err = _db()
    if err:
        return err
    try:
        cur = conn.cursor()
        placeholders = ", ".join(["%s"] * len(values))
        col_str      = ", ".join(columns)
        cur.execute(f"INSERT INTO {table} ({col_str}) VALUES ({placeholders});", values)
        conn.commit()
        cur.close()
        return jsonify({"message": success_msg})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


@agent_bp.route("/add-tickets", methods=["POST", "OPTIONS"])
def add_tickets():
    if request.method == "OPTIONS":
        return "", 200

    data     = request.json or {}
    shift_id = data.get("shift_id")
    tickets  = data.get("tickets", [])

    if not shift_id:
        return jsonify({"error": "shift_id is required"}), 400
    if not tickets:
        return jsonify({"error": "tickets array is required"}), 400

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        for t in tickets:
            if not t.get("number"):
                continue
            cur.execute(
                "INSERT INTO tickets (shift_id, ticket_number, description) VALUES (%s, %s, %s);",
                (shift_id, t["number"], t.get("description", "")),
            )
        conn.commit()
        cur.close()
        return jsonify({"message": "Tickets added successfully"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


@agent_bp.route("/add-alert", methods=["POST", "OPTIONS"])
def add_alert():
    if request.method == "OPTIONS":
        return "", 200

    data       = request.json or {}
    shift_id   = data.get("shift_id")
    monitor    = data.get("monitor")
    alert_type = data.get("alert_type")
    comment    = data.get("comment", "")

    if not all([shift_id, monitor, alert_type]):
        return jsonify({"error": "shift_id, monitor, and alert_type are required"}), 400

    # Parse optional user-supplied datetime (treated as IST)
    dt_str = data.get("alert_datetime")
    if dt_str:
        try:
            created_at = IST.localize(datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%S"))
        except (ValueError, TypeError):
            created_at = datetime.now(IST)
    else:
        created_at = datetime.now(IST)

    return _simple_insert(
        "alerts",
        ["shift_id", "monitor", "alert_type", "comment", "created_at"],
        (shift_id, monitor, alert_type, comment, created_at),
        "Alert added successfully",
    )


@agent_bp.route("/add-incident", methods=["POST", "OPTIONS"])
def add_incident():
    if request.method == "OPTIONS":
        return "", 200

    data        = request.json or {}
    shift_id    = data.get("shift_id")
    description = data.get("description")

    if not all([shift_id, description]):
        return jsonify({"error": "shift_id and description are required"}), 400

    return _simple_insert(
        "incident_status", ["shift_id", "description"],
        (shift_id, description), "Incident added successfully",
    )


@agent_bp.route("/add-adhoc", methods=["POST", "OPTIONS"])
def add_adhoc():
    if request.method == "OPTIONS":
        return "", 200

    data     = request.json or {}
    shift_id = data.get("shift_id")
    task     = data.get("task")

    if not all([shift_id, task]):
        return jsonify({"error": "shift_id and task are required"}), 400

    return _simple_insert(
        "adhoc_tasks", ["shift_id", "task"],
        (shift_id, task), "Ad-hoc task added successfully",
    )


@agent_bp.route("/add-dialpad", methods=["POST", "OPTIONS"])
def add_dialpad():
    if request.method == "OPTIONS":
        return "", 200

    data          = request.json or {}
    shift_id      = data.get("shift_id")
    ticket_number = data.get("ticket_number")
    description   = data.get("description", "")

    if not all([shift_id, ticket_number]):
        return jsonify({"error": "shift_id and ticket_number are required"}), 400

    return _simple_insert(
        "dialpad_tickets", ["shift_id", "ticket_number", "description"],
        (shift_id, ticket_number, description), "Dialpad ticket added successfully",
    )


@agent_bp.route("/add-handover", methods=["POST", "OPTIONS"])
def add_handover():
    if request.method == "OPTIONS":
        return "", 200

    data        = request.json or {}
    shift_id    = data.get("shift_id")
    description = data.get("description")
    handover_to = data.get("handover_to")

    if not all([shift_id, description, handover_to]):
        return jsonify({"error": "shift_id, description, and handover_to are required"}), 400

    return _simple_insert(
        "handovers", ["shift_id", "description", "handover_to"],
        (shift_id, description, handover_to), "Shift handover added successfully",
    )


@agent_bp.route("/add-maintenance", methods=["POST", "OPTIONS"])
def add_maintenance():
    if request.method == "OPTIONS":
        return "", 200

    data        = request.json or {}
    shift_id    = data.get("shift_id")
    description = data.get("description")

    if not all([shift_id, description]):
        return jsonify({"error": "shift_id and description are required"}), 400

    return _simple_insert(
        "maintenance_logs", ["shift_id", "description"],
        (shift_id, description), "Maintenance log added successfully",
    )


# ── shift summary ──────────────────────────────────────────────────────────

@agent_bp.route("/shift-summary/<shift_id>", methods=["GET", "OPTIONS"])
def get_shift_summary(shift_id):
    if request.method == "OPTIONS":
        return "", 200

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()

        cur.execute(
            "SELECT agent_id, login_time, logout_time, triaged_count FROM shifts WHERE id = %s;",
            (shift_id,),
        )
        shift = cur.fetchone()
        if not shift:
            return jsonify({"error": "Shift not found"}), 404

        def fetch_rows(sql):
            cur.execute(sql, (shift_id,))
            return cur.fetchall()

        tickets = [
            {"number": r[0], "description": r[1], "created_at": fmt_ist(r[2])}
            for r in fetch_rows(
                "SELECT ticket_number, description, created_at FROM tickets WHERE shift_id = %s ORDER BY created_at;"
            )
        ]
        alerts = [
            {"monitor": r[0], "type": r[1], "comment": r[2], "created_at": fmt_ist(r[3])}
            for r in fetch_rows(
                "SELECT monitor, alert_type, comment, created_at FROM alerts WHERE shift_id = %s ORDER BY created_at;"
            )
        ]
        incidents = [
            {"description": r[0], "created_at": fmt_ist(r[1])}
            for r in fetch_rows(
                "SELECT description, created_at FROM incident_status WHERE shift_id = %s ORDER BY created_at;"
            )
        ]
        adhoc_tasks = [
            {"task": r[0], "created_at": fmt_ist(r[1])}
            for r in fetch_rows(
                "SELECT task, created_at FROM adhoc_tasks WHERE shift_id = %s ORDER BY created_at;"
            )
        ]
        handovers = [
            {"description": r[0], "handover_to": r[1], "created_at": fmt_ist(r[2])}
            for r in fetch_rows(
                "SELECT description, handover_to, created_at FROM handovers WHERE shift_id = %s ORDER BY created_at;"
            )
        ]
        maintenance = [
            {"description": r[0], "created_at": fmt_ist(r[1])}
            for r in fetch_rows(
                "SELECT description, created_at FROM maintenance_logs WHERE shift_id = %s ORDER BY created_at;"
            )
        ]
        dialpad_tickets = [
            {"ticket_number": r[0], "description": r[1], "created_at": fmt_ist(r[2])}
            for r in fetch_rows(
                "SELECT ticket_number, description, created_at FROM dialpad_tickets WHERE shift_id = %s ORDER BY created_at;"
            )
        ]

        cur.close()
        return jsonify({
            "agent_id":        str(shift[0]),
            "start_time":      fmt_ist(shift[1]),
            "end_time":        fmt_ist(shift[2]),
            "triaged_count":   shift[3] or 0,
            "ticket_count":    len(tickets),
            "alert_count":     len(alerts),
            "incident_count":  len(incidents),
            "adhoc_count":     len(adhoc_tasks),
            "handover_count":  len(handovers),
            "maintenance_count": len(maintenance),
            "dialpad_count":   len(dialpad_tickets),
            "tickets":         tickets,
            "alerts":          alerts,
            "incidents":       incidents,
            "adhoc_tasks":     adhoc_tasks,
            "handovers":       handovers,
            "maintenance":     maintenance,
            "dialpad_tickets": dialpad_tickets,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)