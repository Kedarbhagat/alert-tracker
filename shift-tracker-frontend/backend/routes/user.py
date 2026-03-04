"""
User management routes  —  GET/POST /manager/users, DELETE /manager/users/<id>
"""
import uuid
from flask import Blueprint, request, jsonify
from config import get_conn, release_conn, fmt_ist

users_bp = Blueprint("users", __name__, url_prefix="/manager/users")


def _db():
    conn = get_conn()
    if not conn:
        return None, (jsonify({"error": "Database connection failed"}), 500)
    return conn, None


@users_bp.route("", methods=["GET", "OPTIONS"])
def list_users():
    if request.method == "OPTIONS":
        return "", 200

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT a.id::text, a.name, a.email, a.role, a.created_at,
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

        return jsonify({
            "users": [
                {
                    "id":           r[0],
                    "name":         r[1],
                    "email":        r[2],
                    "role":         r[3],
                    "created_at":   fmt_ist(r[4]),
                    "total_shifts": int(r[5]),
                    "is_active":    bool(r[6]),
                }
                for r in rows
            ]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


@users_bp.route("", methods=["POST", "OPTIONS"])
def create_user():
    if request.method == "OPTIONS":
        return "", 200

    data  = request.json or {}
    name  = (data.get("name")  or "").strip()
    email = (data.get("email") or "").strip()
    role  = (data.get("role")  or "agent").strip()

    if not name:
        return jsonify({"error": "name is required"}), 400
    if not email:
        return jsonify({"error": "email is required"}), 400
    if len(name) > 120:
        return jsonify({"error": "name must be 120 characters or fewer"}), 400

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO agents (name, email, role) VALUES (%s, %s, %s) "
            "RETURNING id::text, name, email, role, created_at;",
            (name, email, role),
        )
        r = cur.fetchone()
        conn.commit()
        cur.close()

        user = {"id": r[0], "name": r[1], "email": r[2], "role": r[3], "created_at": fmt_ist(r[4])}
        print(f"✅ Agent created: {user['name']} ({user['email']})  UUID={user['id']}")
        return jsonify({"message": "Agent created successfully", "user": user}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)


@users_bp.route("/<agent_id>", methods=["DELETE", "OPTIONS"])
def delete_user(agent_id):
    if request.method == "OPTIONS":
        return "", 200

    try:
        uuid.UUID(agent_id)
    except (ValueError, AttributeError):
        return jsonify({"error": "Invalid agent_id format"}), 400

    conn, err = _db()
    if err:
        return err

    try:
        cur = conn.cursor()

        cur.execute(
            "SELECT COUNT(*) FROM shifts WHERE agent_id = %s AND logout_time IS NULL;",
            (agent_id,),
        )
        if cur.fetchone()[0] > 0:
            return jsonify({"error": "Cannot delete an agent with an active shift"}), 409

        cur.execute("SELECT name FROM agents WHERE id::text = %s;", (agent_id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Agent not found"}), 404

        agent_name = row[0]
        cur.execute("DELETE FROM agents WHERE id::text = %s;", (agent_id,))
        conn.commit()
        cur.close()

        print(f"🗑️  Agent deleted: {agent_name}  UUID={agent_id}")
        return jsonify({"message": f"Agent '{agent_name}' deleted successfully"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        release_conn(conn)