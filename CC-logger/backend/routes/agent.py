"""Agent endpoints — shift lifecycle + activity logging."""
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify
from db import db, to_ist, IST

agent_bp = Blueprint("agent", __name__)


# ── helpers ───────────────────────────────────────────────────────────────────

def _fix_uuid(agent_id):
    """Return a proper UUID, generating a new one if the value is invalid."""
    try:
        uuid.UUID(agent_id)
        if "REAL_UUID" in agent_id or "placeholder" in agent_id.lower():
            raise ValueError
        return agent_id
    except (ValueError, AttributeError):
        return str(uuid.uuid4())


def _shift_rows(cur, shift_id):
    """Fetch every activity list for one shift."""
    def q(sql):
        cur.execute(sql, (shift_id,))
        return cur.fetchall()

    return {
        "tickets":     [{"number": r[0], "description": r[1], "created_at": to_ist(r[2])}
                        for r in q("SELECT ticket_number, description, created_at FROM tickets WHERE shift_id=%s ORDER BY created_at")],
        "alerts":      [{"monitor": r[0], "type": r[1], "comment": r[2], "created_at": to_ist(r[3])}
                        for r in q("SELECT monitor, alert_type, comment, created_at FROM alerts WHERE shift_id=%s ORDER BY created_at")],
        "incidents":   [{"description": r[0], "created_at": to_ist(r[1])}
                        for r in q("SELECT description, created_at FROM incident_status WHERE shift_id=%s ORDER BY created_at")],
        "adhoc_tasks": [{"task": r[0], "created_at": to_ist(r[1])}
                        for r in q("SELECT task, created_at FROM adhoc_tasks WHERE shift_id=%s ORDER BY created_at")],
        "handovers":   [{"description": r[0], "handover_to": r[1], "created_at": to_ist(r[2])}
                        for r in q("SELECT description, handover_to, created_at FROM handovers WHERE shift_id=%s ORDER BY created_at")],
        "maintenance": [{"description": r[0], "created_at": to_ist(r[1])}
                        for r in q("SELECT description, created_at FROM maintenance_logs WHERE shift_id=%s ORDER BY created_at")],
        "dialpad_tickets": [{"ticket_number": r[0], "description": r[1], "created_at": to_ist(r[2])}
                            for r in q("SELECT ticket_number, description, created_at FROM dialpad_tickets WHERE shift_id=%s ORDER BY created_at")],
    }


@agent_bp.route("/add-dialpad", methods=["POST", "OPTIONS"])
def add_dialpad():
    if request.method == "OPTIONS":
        return "", 200
    data = request.json or {}
    shift_id = data.get("shift_id")
    ticket_number = (data.get("ticket_number") or "").strip()
    description = (data.get("description") or "").strip()
    if not shift_id or not ticket_number:
        return jsonify({"error": "shift_id and ticket_number are required"}), 400
    try:
        with db() as cur:
            cur.execute(
                "INSERT INTO dialpad_tickets (shift_id, ticket_number, description) VALUES (%s,%s,%s)",
                (shift_id, ticket_number, description),
            )
        return jsonify({"message": "Dialpad ticket added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── shift lifecycle ───────────────────────────────────────────────────────────

@agent_bp.route("/check-active-shift", methods=["POST", "OPTIONS"])
def check_active_shift():
    if request.method == "OPTIONS": return "", 200
    data = request.json or {}
    agent_id = _fix_uuid(data.get("agent_id", ""))
    try:
        with db() as cur:
            cur.execute(
                "SELECT id, triaged_count, COALESCE(zd_ticket_count,0) FROM shifts WHERE agent_id=%s AND logout_time IS NULL ORDER BY login_time DESC LIMIT 1",
                (agent_id,)
            )
            row = cur.fetchone()
        if row:
            return jsonify({
                "has_active_shift": True,
                "shift_id": row[0],
                "triaged_count": row[1],
                "zd_ticket_count": int(row[2] or 0),
                "agent_id": agent_id,
            })
        return jsonify({"has_active_shift": False, "agent_id": agent_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/start-shift", methods=["POST", "OPTIONS"])
def start_shift():
    if request.method == "OPTIONS": return "", 200
    agent_id = (request.json or {}).get("agent_id")
    if not agent_id: return jsonify({"error": "agent_id is required"}), 400
    try:
        with db() as cur:
            # Return existing active shift if one already exists
            cur.execute("SELECT id, triaged_count FROM shifts WHERE agent_id=%s AND logout_time IS NULL ORDER BY login_time DESC LIMIT 1", (agent_id,))
            existing = cur.fetchone()
            if existing:
                return jsonify({"shift_id": existing[0], "triaged_count": existing[1] or 0, "resumed": True})
            cur.execute("INSERT INTO shifts (agent_id) VALUES (%s) RETURNING id", (agent_id,))
            shift_id = cur.fetchone()[0]
        return jsonify({"shift_id": shift_id, "triaged_count": 0})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/update-triage", methods=["POST", "OPTIONS"])
def update_triage():
    if request.method == "OPTIONS": return "", 200
    data = request.json or {}
    shift_id, change = data.get("shift_id"), data.get("change")
    if shift_id is None or change is None: return jsonify({"error": "shift_id and change are required"}), 400
    try:
        with db() as cur:
            cur.execute(
                "UPDATE shifts SET triaged_count=GREATEST(triaged_count+%s,0) WHERE id=%s RETURNING triaged_count",
                (change, shift_id)
            )
            row = cur.fetchone()
        if not row: return jsonify({"error": "Shift not found"}), 404
        return jsonify({"triaged_count": row[0]})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/end-shift", methods=["POST", "OPTIONS"])
def end_shift():
    if request.method == "OPTIONS": return "", 200
    shift_id = (request.json or {}).get("shift_id")
    if not shift_id: return jsonify({"error": "shift_id is required"}), 400
    try:
        with db() as cur:
            cur.execute(
                "UPDATE shifts SET logout_time=NOW() WHERE id=%s AND logout_time IS NULL RETURNING id",
                (shift_id,)
            )
            if not cur.fetchone(): return jsonify({"error": "Shift not found or already ended"}), 404
        return jsonify({"message": "Shift ended successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── activity logging ──────────────────────────────────────────────────────────

@agent_bp.route("/add-tickets", methods=["POST", "OPTIONS"])
def add_tickets():
    if request.method == "OPTIONS": return "", 200
    data = request.json or {}
    shift_id, tickets = data.get("shift_id"), data.get("tickets", [])
    if not shift_id: return jsonify({"error": "shift_id is required"}), 400
    if not tickets:  return jsonify({"error": "tickets array is required"}), 400
    try:
        with db() as cur:
            for t in tickets:
                if t.get("number"):
                    cur.execute(
                        "INSERT INTO tickets (shift_id, ticket_number, description) VALUES (%s,%s,%s)",
                        (shift_id, t["number"], t.get("description", ""))
                    )
        return jsonify({"message": "Tickets added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/add-alert", methods=["POST", "OPTIONS"])
def add_alert():
    if request.method == "OPTIONS": return "", 200
    data = request.json or {}
    shift_id, monitor, alert_type = data.get("shift_id"), data.get("monitor"), data.get("alert_type")
    if not all([shift_id, monitor, alert_type]):
        return jsonify({"error": "shift_id, monitor, and alert_type are required"}), 400
    raw = data.get("alert_datetime")
    try:
        created_at = IST.localize(datetime.strptime(raw, "%Y-%m-%dT%H:%M:%S")) if raw else datetime.now(IST)
    except (ValueError, TypeError):
        created_at = datetime.now(IST)
    try:
        with db() as cur:
            cur.execute(
                "INSERT INTO alerts (shift_id, monitor, alert_type, comment, created_at) VALUES (%s,%s,%s,%s,%s)",
                (shift_id, monitor, alert_type, data.get("comment", ""), created_at)
            )
        return jsonify({"message": "Alert added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/add-incident", methods=["POST", "OPTIONS"])
def add_incident():
    if request.method == "OPTIONS": return "", 200
    data = request.json or {}
    shift_id, desc = data.get("shift_id"), data.get("description")
    if not all([shift_id, desc]): return jsonify({"error": "shift_id and description are required"}), 400
    try:
        with db() as cur:
            cur.execute("INSERT INTO incident_status (shift_id, description) VALUES (%s,%s)", (shift_id, desc))
        return jsonify({"message": "Incident added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/add-adhoc", methods=["POST", "OPTIONS"])
def add_adhoc():
    if request.method == "OPTIONS": return "", 200
    data = request.json or {}
    shift_id, task = data.get("shift_id"), data.get("task")
    if not all([shift_id, task]): return jsonify({"error": "shift_id and task are required"}), 400
    try:
        with db() as cur:
            cur.execute("INSERT INTO adhoc_tasks (shift_id, task) VALUES (%s,%s)", (shift_id, task))
        return jsonify({"message": "Ad-hoc task added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/add-handover", methods=["POST", "OPTIONS"])
def add_handover():
    if request.method == "OPTIONS": return "", 200
    data = request.json or {}
    shift_id, desc, to = data.get("shift_id"), data.get("description"), data.get("handover_to")
    if not all([shift_id, desc, to]): return jsonify({"error": "shift_id, description, and handover_to are required"}), 400
    try:
        with db() as cur:
            cur.execute("INSERT INTO handovers (shift_id, description, handover_to) VALUES (%s,%s,%s)", (shift_id, desc, to))
        return jsonify({"message": "Shift handover added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@agent_bp.route("/add-maintenance", methods=["POST", "OPTIONS"])
def add_maintenance():
    if request.method == "OPTIONS": return "", 200
    data = request.json or {}
    shift_id, desc = data.get("shift_id"), data.get("description")
    if not all([shift_id, desc]): return jsonify({"error": "shift_id and description are required"}), 400
    try:
        with db() as cur:
            cur.execute("INSERT INTO maintenance_logs (shift_id, description) VALUES (%s,%s)", (shift_id, desc))
        return jsonify({"message": "Maintenance log added successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── shift summary ─────────────────────────────────────────────────────────────

@agent_bp.route("/shift-summary/<shift_id>", methods=["GET", "OPTIONS"])
def get_shift_summary(shift_id):
    if request.method == "OPTIONS": return "", 200
    try:
        with db() as cur:
            cur.execute("SELECT agent_id, login_time, logout_time, triaged_count, COALESCE(zd_ticket_count,0) FROM shifts WHERE id=%s", (shift_id,))
            s = cur.fetchone()
            if not s: return jsonify({"error": "Shift not found"}), 404
            data = _shift_rows(cur, shift_id)
        return jsonify({
            "agent_id": str(s[0]), "start_time": to_ist(s[1]), "end_time": to_ist(s[2]),
            "triaged_count": s[3] or 0,
            "zd_ticket_count": int(s[4] or 0),
            "ticket_count": len(data["tickets"]), "alert_count": len(data["alerts"]),
            "incident_count": len(data["incidents"]), "adhoc_count": len(data["adhoc_tasks"]),
            "handover_count": len(data["handovers"]), "maintenance_count": len(data["maintenance"]),
            **data,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@agent_bp.route("/update-zd-count", methods=["POST", "OPTIONS"])
def update_zd_count():
    """Store the Zendesk solved/closed count for this shift."""
    if request.method == "OPTIONS": return "", 200
    data = request.json or {}
    shift_id, count = data.get("shift_id"), data.get("count")
    if shift_id is None or count is None:
        return jsonify({"error": "shift_id and count are required"}), 400
    try:
        with db() as cur:
            # Update the aggregate solved count for this shift and fetch shift start time
            cur.execute(
                "UPDATE shifts SET zd_ticket_count=%s WHERE id=%s RETURNING zd_ticket_count, login_time",
                (max(0, int(count)), shift_id)
            )
            row = cur.fetchone()
            if not row:
                return jsonify({"error": "Shift not found"}), 404

            zd_count, login_time = row[0], row[1]

            from datetime import datetime, timezone

            # Normalise shift start to UTC for comparison
            if login_time is not None:
                if login_time.tzinfo is None:
                    login_utc = login_time.replace(tzinfo=timezone.utc)
                else:
                    login_utc = login_time.astimezone(timezone.utc)
            else:
                login_utc = None

            # Log Zendesk tickets against this shift (deduped per shift_id + ticket_number),
            # but only if their updated_at is on/after the shift start time. This ensures
            # we only store tickets solved during THIS shift, not lifetime.
            tickets = data.get("tickets") or []
            for t in tickets:
                number = str(t.get("id") or t.get("number") or "").strip()
                raw_updated = t.get("updated_at")
                if not number or not raw_updated or not login_utc:
                    continue

                try:
                    ts = raw_updated.replace("Z", "+00:00") if isinstance(raw_updated, str) else None
                    updated_at = datetime.fromisoformat(ts) if ts else None
                except Exception:
                    updated_at = None

                if not updated_at:
                    continue

                updated_utc = updated_at.astimezone(timezone.utc)
                if updated_utc < login_utc:
                    continue

                cur.execute(
                    "SELECT 1 FROM tickets WHERE shift_id=%s AND ticket_number=%s",
                    (shift_id, number),
                )
                if cur.fetchone():
                    continue

                cur.execute(
                    "INSERT INTO tickets (shift_id, ticket_number, description) VALUES (%s,%s,%s)",
                    (shift_id, number, t.get("subject") or t.get("description") or ""),
                )

        return jsonify({"zd_ticket_count": zd_count})
    except Exception as e:
        return jsonify({"error": str(e)}), 500