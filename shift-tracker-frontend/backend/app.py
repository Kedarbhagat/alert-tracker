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
        # Azure App Service injects this header with the authenticated user's info
        principal_header = request.headers.get("X-MS-CLIENT-PRINCIPAL")
        if principal_header:
            principal = json.loads(base64.b64decode(principal_header).decode("utf-8"))
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
                return redirect(f"{FRONTEND_URL}?email={urllib.parse.quote(email)}")
    except Exception as e:
        print(f"Auth-done error: {e}")
    return redirect(FRONTEND_URL)

app.register_blueprint(agent_bp)
app.register_blueprint(manager_bp)
app.register_blueprint(users_bp)
app.register_blueprint(zendesk_bp)

init_pool()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)