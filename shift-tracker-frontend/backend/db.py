import os
import pytz
import psycopg2.pool
from contextlib import contextmanager
from datetime import datetime, timezone

IST = pytz.timezone("Asia/Kolkata")
_pool = None


def init_pool():
    global _pool
    _pool = psycopg2.pool.SimpleConnectionPool(1, 20, os.getenv("DATABASE_URL"), sslmode="require")
    print("✅ DB pool ready")


@contextmanager
def db():
    """Usage:  with db() as cur:  cur.execute(...)"""
    conn = _pool.getconn()
    try:
        cur = conn.cursor()
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        _pool.putconn(conn)


def to_ist(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST).isoformat()