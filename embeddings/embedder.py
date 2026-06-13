"""Embedding client.

Generates dense vector embeddings for text via Ollama's nomic-embed-text
model, batching requests to bound memory use. Fails fast with a clear message
when Ollama is unreachable.
"""
import os

import requests
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBED_MODEL = "nomic-embed-text"
BATCH_SIZE = 32


def embed(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    _check_ollama()

    embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        for text in batch:
            response = requests.post(
                f"{OLLAMA_BASE_URL}/api/embeddings",
                json={"model": EMBED_MODEL, "prompt": text},
                timeout=30,
            )
            response.raise_for_status()
            embeddings.append(response.json()["embedding"])

    return embeddings


def _check_ollama():
    try:
        requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=15)
    except requests.exceptions.ConnectionError:
        raise RuntimeError("Cannot reach Ollama. Start it with: ollama serve")
    except requests.exceptions.ReadTimeout:
        # Ollama is running but busy (e.g. loading a model) — proceed
        pass
