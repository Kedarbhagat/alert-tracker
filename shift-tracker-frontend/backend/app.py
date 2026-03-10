from flask import Flask, redirect, request
from flask_cors import CORS
from dotenv import load_dotenv
import json, base64, urllib.parse

from db import init_pool
from routes.agent import agent_bp
from routes.manager import manager_bp
from routes.users import users_bp
from routes.zendesk import zendesk_bp

load_dotenv()

app = Flask(__name__)

app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True

CORS(app, resources={r"/*": {"origins": [
    "https://blue-pond-0c737da03.6.azurestaticapps.net"
]}}, supports_credentials=True)

FRONTEND_URL = "https://blue-pond-0c737da03.6.azurestaticapps.net"

@app.route("/")
@app.route("/auth-done")
def auth_done():
    """After Azure AD login, extract email from Azure headers and pass to frontend."""
    try:
        principal_header = request.headers.get("X-MS-CLIENT-PRINCIPAL")
        name_header = request.headers.get("X-MS-CLIENT-PRINCIPAL-NAME")
        id_header = request.headers.get("X-MS-CLIENT-PRINCIPAL-ID")

        print(f"DEBUG auth-done: principal={bool(principal_header)}, name={name_header}, id={id_header}")

        # Try X-MS-CLIENT-PRINCIPAL-NAME first (simplest — usually the email for AAD)
        if name_header and "@" in name_header:
            print(f"DEBUG using name header as email: {name_header}")
            return redirect(f"{FRONTEND_URL}?email={urllib.parse.quote(name_header)}")

        # Fall back to parsing full principal
        if principal_header:
            principal = json.loads(base64.b64decode(principal_header).decode("utf-8"))
            print(f"DEBUG principal: {json.dumps(principal)[:500]}")
            claims = principal.get("claims", [])
            email = None
            for claim in claims:
                if claim.get("typ") in [
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
                    "preferred_username",
                    "email"
                ]:
                    email = claim.get("val")
                    break
            if not email:
                email = principal.get("userDetails", "")
            if email:
                print(f"DEBUG using claims email: {email}")
                return redirect(f"{FRONTEND_URL}?email={urllib.parse.quote(email)}")
    except Exception as e:
        print(f"Auth-done error: {e}")

    print("DEBUG auth-done: no email found, redirecting without email")
    return redirect(FRONTEND_URL)

app.register_blueprint(agent_bp)
app.register_blueprint(manager_bp)
app.register_blueprint(users_bp)
app.register_blueprint(zendesk_bp)

init_pool()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)