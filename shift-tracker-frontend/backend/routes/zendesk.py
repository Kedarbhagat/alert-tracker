"""
routes/zendesk.py
~~~~~~~~~~~~~~~~~
Proxy routes that talk to Zendesk on behalf of the frontend.
Keeps credentials server-side; frontend never sees the API token.

Required env vars:
    ZENDESK_SUBDOMAIN   e.g.  yourcompany   (not the full URL)
    ZENDESK_EMAIL       agent/admin email used for basic auth
    ZENDESK_API_TOKEN   API token (not password)
"""
import os
import requests
from flask import Blueprint, request, jsonify

zendesk_bp = Blueprint("zendesk", __name__, url_prefix="/zendesk")

# ── Zendesk credentials from environment ─────────────────────────────────────

def _zd_base():
    return f"https://{os.getenv('ZENDESK_SUBDOMAIN')}.zendesk.com/api/v2"

def _zd_auth():
    return (
        f"{os.getenv('ZENDESK_EMAIL')}/token",
        os.getenv("ZENDESK_API_TOKEN"),
    )

def _zd_get(path, params=None):
    """Make a GET request to Zendesk, return parsed JSON or raise."""
    url = f"{_zd_base()}{path}"
    resp = requests.get(url, auth=_zd_auth(), params=params, timeout=10)
    resp.raise_for_status()
    return resp.json()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _format_ticket(t):
    """Flatten a Zendesk ticket object to what the frontend needs."""
    return {
        "id":         t["id"],
        "subject":    t.get("subject") or "(no subject)",
        "status":     t.get("status", "open"),
        "priority":   t.get("priority") or "normal",
        "updated_at": t.get("updated_at"),
        "created_at": t.get("created_at"),
        "requester":  None,          # filled in by _enrich if needed
        "url":        t.get("url"),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@zendesk_bp.route("/tickets-by-agent", methods=["GET", "OPTIONS"])
def tickets_by_agent():
    """
    GET /zendesk/tickets-by-agent?name=<agent_display_name>

    1. Search for a Zendesk user whose name matches.
    2. Return ALL tickets assigned to that user (any status).
    """
    if request.method == "OPTIONS":
        return "", 200

    name = (request.args.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name query parameter is required"}), 400

    try:
        # Step 1 — resolve the Zendesk user ID by display name
        search = _zd_get("/search.json", params={"query": f'type:user "{name}"'})
        users  = [r for r in search.get("results", []) if r.get("result_type") == "user"]

        if not users:
            return jsonify({"tickets": [], "message": f"No Zendesk user found matching '{name}'"})

        # Take the best match (first result — Zendesk sorts by relevance)
        user_id    = users[0]["id"]
        agent_name = users[0].get("name", name)

        # Step 2 — fetch all tickets assigned to that user (paginate up to 100)
        all_tickets = []
        page = 1
        while True:
            data = _zd_get(
                "/tickets.json",
                params={"assignee_id": user_id, "per_page": 100, "page": page, "sort_by": "updated_at", "sort_order": "desc"}
            )
            batch = data.get("tickets", [])
            all_tickets.extend(batch)
            if not data.get("next_page") or len(all_tickets) >= 300:
                break
            page += 1

        # Step 3 — enrich with requester names (batch lookup)
        requester_ids = list({t.get("requester_id") for t in all_tickets if t.get("requester_id")})
        requester_map = {}
        if requester_ids:
            # Zendesk bulk user fetch
            chunk_size = 100
            for i in range(0, len(requester_ids), chunk_size):
                chunk = requester_ids[i:i+chunk_size]
                ids_str = ",".join(str(x) for x in chunk)
                try:
                    udata = _zd_get(f"/users/show_many.json?ids={ids_str}")
                    for u in udata.get("users", []):
                        requester_map[u["id"]] = u.get("name", "Unknown")
                except Exception:
                    pass

        tickets = []
        for t in all_tickets:
            fmt = _format_ticket(t)
            fmt["requester"] = requester_map.get(t.get("requester_id"), "Unknown")
            tickets.append(fmt)

        return jsonify({
            "tickets":    tickets,
            "agent_name": agent_name,
            "total":      len(tickets),
        })

    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else 500
        return jsonify({"error": f"Zendesk API error: {e}"}), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@zendesk_bp.route("/ticket/<int:ticket_id>", methods=["GET", "OPTIONS"])
def get_ticket(ticket_id):
    """GET /zendesk/ticket/<id>  — fetch a single ticket (used by polling)."""
    if request.method == "OPTIONS":
        return "", 200
    try:
        data   = _zd_get(f"/tickets/{ticket_id}.json")
        ticket = _format_ticket(data["ticket"])

        # Requester name
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