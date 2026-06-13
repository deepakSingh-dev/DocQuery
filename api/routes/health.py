"""Health route.

Reports the reachability of the three backing services — Ollama, ChromaDB, and
Redis — so the frontend can surface system status at a glance.
"""
import os

import redis as redis_client
import requests
from fastapi import APIRouter

from api.schemas import HealthResponse
from vectordb.store import get_or_create_collection

router = APIRouter()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        ollama=_check_ollama(),
        chromadb=_check_chromadb(),
        redis=_check_redis(),
    )


def _check_ollama() -> bool:
    try:
        r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        return r.status_code == 200
    except Exception:
        return False


def _check_chromadb() -> bool:
    try:
        get_or_create_collection()
        return True
    except Exception:
        return False


def _check_redis() -> bool:
    try:
        r = redis_client.Redis(host="localhost", port=6379, socket_timeout=2)
        return r.ping()
    except Exception:
        return False
