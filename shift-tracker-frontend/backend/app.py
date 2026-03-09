from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

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
    "https://blue-pond-0c737da0.azurestaticapps.net"
]}}, supports_credentials=True)

app.register_blueprint(agent_bp)
app.register_blueprint(manager_bp)
app.register_blueprint(users_bp)
app.register_blueprint(zendesk_bp)

init_pool()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)