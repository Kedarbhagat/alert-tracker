from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from db import init_pool
from routes.agent import agent_bp
from routes.manager import manager_bp
from routes.users import users_bp

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

app.register_blueprint(agent_bp)
app.register_blueprint(manager_bp)
app.register_blueprint(users_bp)

init_pool()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)