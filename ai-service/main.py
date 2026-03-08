"""
SafeZone AI — Python AI Microservice
FastAPI server for risk prediction, heatmaps, and journey anomaly detection.

Start: uvicorn main:app --reload --port 8000
"""

import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from routes.predict import router as predict_router
from routes.heatmap import router as heatmap_router
from routes.journey import router as journey_router

load_dotenv()

# ─── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ─── Lifespan — pre-load model on startup ────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🤖 SafeZone AI — Starting up...")
    # Try to pre-load the model
    try:
        import joblib
        if os.path.exists('models/risk_model.pkl'):
            model = joblib.load('models/risk_model.pkl')
            print("✅ Risk model loaded successfully")
        else:
            print("⚠️  Model not found — run: python models/train.py")
    except Exception as e:
        print(f"⚠️  Model load error: {e}")

    yield  # App runs here

    print("👋 SafeZone AI — Shutting down")


# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="SafeZone AI Microservice",
    description="AI-powered risk prediction and safety analytics for SafeZone platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limit handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ─────────────────────────────────────────────────────────────────────
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


# ─── Request Timing Middleware ────────────────────────────────────────────────
@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    ms = round((time.time() - start) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(ms)
    return response


# ─── Global error handler ─────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc), "path": str(request.url)}
    )


# ─── Routes ───────────────────────────────────────────────────────────────────
app.include_router(predict_router)
app.include_router(heatmap_router)
app.include_router(journey_router)


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    model_ready = os.path.exists('models/risk_model.pkl')
    return {
        "status": "ok",
        "service": "SafeZone AI Microservice",
        "version": "1.0.0",
        "model_ready": model_ready,
        "endpoints": [
            "POST /predict",
            "POST /predict/batch",
            "GET  /predict/area",
            "GET  /predict/model-info",
            "GET  /heatmap/incidents",
            "GET  /heatmap/safety",
            "GET  /heatmap/live",
            "POST /journey/analyze",
            "POST /journey/baseline",
        ]
    }


@app.get("/")
async def root():
    return {
        "message": "SafeZone AI 🛡️ — Smart Personal Safety Platform",
        "docs": "/docs",
        "health": "/health"
    }
