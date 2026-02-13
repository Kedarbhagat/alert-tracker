from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)

# ✅ Proper CORS handling for ALL routes
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

DATABASE_URL = os.getenv("DATABASE_URL")


def get_db_connection():
    return psycopg2.connect(
        DATABASE_URL,
        sslmode="require"
    )


# ----------------------------
# 1️⃣ Start Shift
# ----------------------------
@app.route("/start-shift", methods=["POST", "OPTIONS"])
def start_shift():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    agent_id = data.get("agent_id")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO shifts (agent_id)
        VALUES (%s)
        RETURNING id;
    """, (agent_id,))

    shift_id = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"shift_id": shift_id})


# ----------------------------
# 2️⃣ Update Triaged Counter
# ----------------------------
@app.route("/update-triage", methods=["POST", "OPTIONS"])
def update_triage():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    shift_id = data.get("shift_id")
    change = data.get("change")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE shifts
        SET triaged_count = GREATEST(triaged_count + %s, 0)
        WHERE id = %s
        RETURNING triaged_count;
    """, (change, shift_id))

    new_count = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"triaged_count": new_count})


# ----------------------------
# 3️⃣ Add Tickets
# ----------------------------
@app.route("/add-tickets", methods=["POST", "OPTIONS"])
def add_tickets():
    if request.method == "OPTIONS":
        return "", 200

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
    conn.close()

    return jsonify({"message": "Tickets added successfully"})

    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    shift_id = data.get("shift_id")
    tickets = data.get("tickets", [])

    conn = get_db_connection()
    cur = conn.cursor()

    for ticket in tickets:
        cur.execute("""
            INSERT INTO tickets (shift_id, ticket_number)
            VALUES (%s, %s);
        """, (shift_id, ticket))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Tickets added successfully"})


# ----------------------------
# 4️⃣ Add Alert
# ----------------------------
@app.route("/add-alert", methods=["POST", "OPTIONS"])
def add_alert():
    if request.method == "OPTIONS":
        return "", 200

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
    conn.close()

    return jsonify({"message": "Alert added successfully"})


# ----------------------------
# 5️⃣ Toggle Break
# ----------------------------
@app.route("/toggle-break", methods=["POST", "OPTIONS"])
def toggle_break():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    shift_id = data.get("shift_id")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT break_start, total_break_seconds
        FROM shifts
        WHERE id = %s;
    """, (shift_id,))

    result = cur.fetchone()

    if not result:
        return jsonify({"error": "Shift not found"}), 404

    break_start, total_break_seconds = result

    if break_start is None:
        cur.execute("""
            UPDATE shifts
            SET break_start = NOW()
            WHERE id = %s;
        """, (shift_id,))
        message = "Break started"
    else:
        now = datetime.utcnow()
        break_duration = (now - break_start).total_seconds()
        new_total = (total_break_seconds or 0) + int(break_duration)

        cur.execute("""
            UPDATE shifts
            SET break_start = NULL,
                total_break_seconds = %s
            WHERE id = %s;
        """, (new_total, shift_id))
        message = "Break ended"

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": message})


# ----------------------------
# 6️⃣ End Shift
# ----------------------------
@app.route("/end-shift", methods=["POST", "OPTIONS"])
def end_shift():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    shift_id = data.get("shift_id")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE shifts
        SET logout_time = NOW()
        WHERE id = %s;
    """, (shift_id,))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Shift ended"})


# ----------------------------
# 7️⃣ Shift Summary
# ----------------------------
@app.route("/shift-summary/<shift_id>", methods=["GET"])
def shift_summary(shift_id):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT agent_id, start_time, end_time, triaged_count, total_break_seconds
        FROM shifts
        WHERE id = %s;
    """, (shift_id,))

    shift = cur.fetchone()

    if not shift:
        return jsonify({"error": "Shift not found"}), 404

    cur.execute("""
        SELECT COUNT(*) FROM tickets WHERE shift_id = %s;
    """, (shift_id,))
    ticket_count = cur.fetchone()[0]

    cur.execute("""
        SELECT COUNT(*) FROM alerts WHERE shift_id = %s;
    """, (shift_id,))
    alert_count = cur.fetchone()[0]

    cur.close()
    conn.close()

    return jsonify({
        "agent_id": shift[0],
        "start_time": shift[1],
        "end_time": shift[2],
        "triaged_count": shift[3],
        "total_break_seconds": shift[4],
        "ticket_count": ticket_count,
        "alert_count": alert_count
    })
@app.route("/add-incident", methods=["POST", "OPTIONS"])
def add_incident():
    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    shift_id = data.get("shift_id")
    description = data.get("description")

    if not description:
        return jsonify({"error": "Description required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO incident_status (shift_id, description)
        VALUES (%s, %s);
    """, (shift_id, description))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Incident saved successfully"})



if __name__ == "__main__":
    app.run(debug=True, port=5000)
