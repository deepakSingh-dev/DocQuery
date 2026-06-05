import logging
import os
from contextlib import asynccontextmanager

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import chat, documents, health

load_dotenv()

logger = logging.getLogger(__name__)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        if r.status_code != 200:
            logger.warning("Ollama is reachable but returned an unexpected status.")
    except Exception:
        logger.warning(
            "⚠️  Ollama is not reachable at %s. Start it with: ollama serve",
            OLLAMA_BASE_URL,
        )
    yield


app = FastAPI(
    title="DocQuery",
    version="1.0.0",
    description="Enterprise AI Research & Document Intelligence Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/")
def root() -> dict:
    return {"name": "DocQuery", "version": "1.0.0"}
