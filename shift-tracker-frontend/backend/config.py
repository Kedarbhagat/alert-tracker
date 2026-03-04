import os
import pytz
import psycopg2
from psycopg2 import pool
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

IST = pytz.timezone("Asia/Kolkata")
DATABASE_URL = os.getenv("DATABASE_URL")

_pool = None


def initialize_pool():
    global _pool
    try:
        _pool = psycopg2.pool.SimpleConnectionPool(1, 20, DATABASE_URL, sslmode="require")
        print("✅ Connection pool created")
    except Exception as e:
        print(f"❌ Pool creation failed: {e}")


def get_conn():
    try:
        return _pool.getconn()
    except Exception as e:
        print(f"❌ Failed to get connection: {e}")
        return None


def release_conn(conn):
    if conn:
        _pool.putconn(conn)


def fmt_ist(dt):
    """Return an ISO string in IST; handles naive (assumed UTC) datetimes."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST).isoformat()