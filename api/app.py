"""
Propaganda Detection API — FastAPI Application

Exposes a REST API for analysing text with a fine-tuned mBERT model.
"""

import os
import logging
from contextlib import asynccontextmanager

import requests as http_requests
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeRequest,
    BatchAnalyzeResponse,
    HealthResponse,
    FetchUrlRequest,
    FetchUrlResponse,
)
from model import get_detector

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Model directory — set via env var or default to ./model
# ---------------------------------------------------------------------------

MODEL_DIR = os.getenv("MODEL_DIR", os.path.join(os.path.dirname(__file__), "model"))

# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the model on startup."""
    logger.info("Starting Propaganda Detection API …")
    detector = get_detector()
    detector.load(model_dir=MODEL_DIR)
    yield
    logger.info("Shutting down Propaganda Detection API …")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Propaganda Detection API",
    description=(
        "Analyse text for propaganda using a fine-tuned multilingual BERT "
        "(mBERT) model. Provides single-text and batch analysis endpoints."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Angular frontend and common dev ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",   # Angular dev server
        "http://localhost:3000",
        "http://localhost:8080",
        "*",                       # Remove in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Return the health / readiness status of the API."""
    detector = get_detector()
    return HealthResponse(
        status="healthy" if detector.is_loaded else "not_ready",
        model_loaded=detector.is_loaded,
        model_name="bert-base-multilingual-cased (fine-tuned)",
        device=str(detector.device),
    )


@app.post("/api/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_text(request: AnalyzeRequest):
    """
    Analyse a single text for propaganda.

    Returns the predicted label, confidence score, and per-class probabilities.
    """
    detector = get_detector()
    if not detector.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded yet.")

    try:
        result = detector.predict(request.text)
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=str(exc))

    return AnalyzeResponse(**result)


@app.post("/api/fetch-url", response_model=FetchUrlResponse, tags=["Analysis"])
async def fetch_url(request: FetchUrlRequest):
    """
    Fetch a URL and extract its main text content for analysis.
    """
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = http_requests.get(request.url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        title = soup.title.string.strip() if soup.title else ""
        # Remove script/style tags
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = " ".join(soup.get_text(separator=" ").split())
        if not text:
            raise HTTPException(status_code=422, detail="Could not extract text from URL.")
        return FetchUrlResponse(url=request.url, text=text[:5000], title=title)
    except http_requests.RequestException as exc:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {exc}")


@app.post(
    "/api/analyze/batch",
    response_model=BatchAnalyzeResponse,
    tags=["Analysis"],
)
async def analyze_batch(request: BatchAnalyzeRequest):
    """
    Analyse multiple texts for propaganda in one request (max 64).

    Returns a list of results, one per input text.
    """
    detector = get_detector()
    if not detector.is_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded yet.")

    try:
        results = detector.predict_batch(request.texts)
    except Exception as exc:
        logger.exception("Batch prediction failed")
        raise HTTPException(status_code=500, detail=str(exc))

    return BatchAnalyzeResponse(
        results=[AnalyzeResponse(**r) for r in results],
    )


# ---------------------------------------------------------------------------
# Entry-point (for convenience: python app.py)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
