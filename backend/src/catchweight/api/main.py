"""CatchWeight POC — FastAPI application."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
import psycopg
import traceback

from catchweight.api.v1 import materials, movements, stock, valuation, reconciliation, seed, dataproducts, admin, forecasting, schema

logger = logging.getLogger(__name__)

app = FastAPI(title="CatchWeight POC", version="0.1.0")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    logger.error("Unhandled %s on %s %s:\n%s", type(exc).__name__, request.method, request.url.path, tb)
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {exc}"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://catchweight-api.onrender.com",
        "https://catchweight-dashboard.onrender.com",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(materials.router, prefix="/v1")
app.include_router(movements.router, prefix="/v1")
app.include_router(stock.router, prefix="/v1")
app.include_router(valuation.router, prefix="/v1")
app.include_router(reconciliation.router, prefix="/v1")
app.include_router(seed.router, prefix="/v1")
app.include_router(dataproducts.router, prefix="/v1")
app.include_router(admin.router, prefix="/v1")
app.include_router(forecasting.router, prefix="/v1")
app.include_router(schema.router, prefix="/v1")


@app.get("/health")
def health():
    status = {
        "service": "catchweight-poc",
        "version": "0.1.0",
        "database": "unknown",
    }

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        status["database"] = "missing DATABASE_URL"
        return status

    try:
        with psycopg.connect(db_url, connect_timeout=5) as conn:
            conn.execute("SET search_path TO sap_poc")
            conn.execute("SELECT 1")
            # Verify key tables exist
            row = conn.execute(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'sap_poc'"
            ).fetchone()
            status["database"] = "connected"
            status["sap_poc_tables"] = row[0] if row else 0
    except Exception as e:
        status["database"] = f"error: {e}"

    return status
