"""
routes/zendesk.py
"""
import os
import requests
from flask import Blueprint, request, jsonify

zendesk_bp = Blueprint("zendesk", __name__, url_prefix="/zendesk")

def _zd_base():
    return f"https://{os.getenv('ZENDESK_SUBDOMAIN')}.zendesk.com/api/v2"

def _zd_auth():
    return (f"{os.getenv('ZENDESK_EMAIL')}/token", os.getenv("ZENDESK_API_TOKEN"))

def _zd_get(path, params=None):
    url = f"{_zd_base()}{path}"
    resp = requests.get(url, auth=_zd_auth(), params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()

def _format_ticket(t):
    return {
        "id":          t["id"],
        "subject":     t.get("subject") or "(no subject)",
        "status":      t.get("status", "open"),
        "priority":    t.get("priority") or "normal",
        "updated_at":  t.get("updated_at"),
        "created_at":  t.get("created_at"),
        "requester":   None,
        "url":         t.get("url"),
        "assignee_id": t.get("assignee_id"),
    }


@zendesk_bp.route("/debug-user", methods=["GET", "OPTIONS"])
def debug_user():
    """GET /zendesk/debug-user?name=<n> — shows which Zendesk users match."""
    if request.method == "OPTIONS":
        return "", 200
    name = (request.args.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    try:
        search = _zd_get("/search.json", params={"query": f'type:user "{name}"'})
        users = [
            {"id": r["id"], "name": r.get("name"), "email": r.get("email"), "role": r.get("role")}
            for r in search.get("results", []) if r.get("result_type") == "user"
        ]
        return jsonify({"query": name, "matches": users})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@zendesk_bp.route("/tickets-by-agent", methods=["GET", "OPTIONS"])
def tickets_by_agent():
    """
    GET /zendesk/tickets-by-agent?name=<agent_display_name>
    Uses /users/{id}/tickets/assigned.json — strictly returns only that user's tickets.
    """
    if request.method == "OPTIONS":
        return "", 200

    name = (request.args.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name query parameter is required"}), 400

    try:
        # Step 1 — find user, prefer exact name match
        search = _zd_get("/search.json", params={"query": f'type:user "{name}"'})
        all_users = [r for r in search.get("results", []) if r.get("result_type") == "user"]

        if not all_users:
            return jsonify({"tickets": [], "message": f"No Zendesk user found matching '{name}'"})

        exact = [u for u in all_users if u.get("name", "").strip().lower() == name.lower()]
        matched_user = exact[0] if exact else all_users[0]
        user_id    = matched_user["id"]
        agent_name = matched_user.get("name", name)

        # Step 2 — use the dedicated assigned-tickets endpoint for this user
        all_tickets = []
        page = 1
        while True:
            data = _zd_get(
                f"/users/{user_id}/tickets/assigned.json",
                params={"per_page": 100, "page": page, "sort_by": "updated_at", "sort_order": "desc"}
            )
            batch = data.get("tickets", [])
            all_tickets.extend(batch)
            if not data.get("next_page") or len(all_tickets) >= 300:
                break
            page += 1

        # Step 3 — enrich with requester names
        requester_ids = list({t.get("requester_id") for t in all_tickets if t.get("requester_id")})
        requester_map = {}
        if requester_ids:
            for i in range(0, len(requester_ids), 100):
                chunk = requester_ids[i:i+100]
                try:
                    udata = _zd_get(f"/users/show_many.json?ids={','.join(str(x) for x in chunk)}")
                    for u in udata.get("users", []):
                        requester_map[u["id"]] = u.get("name", "Unknown")
                except Exception:
                    pass

        tickets = []
        for t in all_tickets:
            fmt = _format_ticket(t)
            fmt["requester"] = requester_map.get(t.get("requester_id"), "Unknown")
            tickets.append(fmt)

        return jsonify({"tickets": tickets, "agent_name": agent_name, "total": len(tickets)})

    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else 500
        return jsonify({"error": f"Zendesk API error: {e}"}), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@zendesk_bp.route("/ticket/<int:ticket_id>", methods=["GET", "OPTIONS"])
def get_ticket(ticket_id):
    if request.method == "OPTIONS":
        return "", 200
    try:
        data   = _zd_get(f"/tickets/{ticket_id}.json")
        ticket = _format_ticket(data["ticket"])
        rid = data["ticket"].get("requester_id")
        if rid:
            try:
                udata = _zd_get(f"/users/{rid}.json")
                ticket["requester"] = udata.get("user", {}).get("name", "Unknown")
            except Exception:
                pass
        return jsonify({"ticket": ticket})
    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else 500
        return jsonify({"error": f"Zendesk API error: {e}"}), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500