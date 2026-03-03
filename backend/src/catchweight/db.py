"""
Database access utility.

- No ORM, raw SQL
- Explicit connection handling
- All queries run against sap_poc schema
"""

import os
import psycopg
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")


@contextmanager
def get_connection():
    """
    Yield a PostgreSQL connection scoped to sap_poc schema.

    Caller owns transaction semantics.
    Do NOT pass options via connect() — Neon pooler rejects startup params.
    """
    conn = psycopg.connect(DATABASE_URL, connect_timeout=10)
    try:
        conn.execute("SET statement_timeout = '30s'")
        conn.execute("SET search_path TO sap_poc, public")
        yield conn
    finally:
        conn.close()


def get_db():
    """FastAPI-compatible DB dependency (generator, not contextmanager)."""
    with get_connection() as conn:
        yield conn
