"""Agent nodes.

The individual operations of the agentic RAG loop — retrieve, evaluate,
requery, and generate — each implemented as a function that reads from and
mutates the shared graph state.
"""
import logging
import os

import requests
from dotenv import load_dotenv

from rag.retriever import retrieve
from rag.generator import generate

load_dotenv()

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = "llama3.2-vision:11b"


def retrieve_node(state: dict) -> dict:
    query = state["current_query"]
    results = retrieve(query)
    state["all_chunks"] = state.get("all_chunks", []) + results
    state["attempt_count"] = state.get("attempt_count", 0) + 1
    state["_last_chunk_count"] = len(results)
    return state


def evaluate_node(state: dict) -> dict:
    attempt_count = state.get("attempt_count", 1)
    last_count = state.get("_last_chunk_count", 0)

    if last_count == 0:
        avg_score = 0.0
    else:
        all_chunks = state.get("all_chunks", [])
        recent = all_chunks[-last_count:]
        scores = [c.get("score", 0.0) for c in recent]
        avg_score = sum(scores) / len(scores) if scores else 0.0

    if avg_score < 0.45 and attempt_count < 3:
        state["needs_requery"] = True
    else:
        state["needs_requery"] = False

    return state


def requery_node(state: dict) -> dict:
    original_query = state["original_query"]
    attempt_count = state.get("attempt_count", 1)
    chunks_so_far = state.get("all_chunks", [])

    context_snippets = "\n".join(
        f"- {c['text'][:100]}" for c in chunks_so_far[:3]
    )

    prompt = (
        f"The user asked: \"{original_query}\"\n"
        f"The search so far returned low-relevance results:\n{context_snippets}\n\n"
        "Generate a better, more specific search query to find relevant information. "
        "Respond with ONLY the new query, no explanation."
    )

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": LLM_MODEL, "prompt": prompt, "stream": False},
            timeout=60,
        )
        response.raise_for_status()
        new_query = response.json().get("response", "").strip().strip('"')
    except Exception as e:
        logger.warning(f"Requery LLM call failed: {e}")
        new_query = original_query

    print(f'[Agent] Attempt {attempt_count} — Reformulated query: "{new_query}"')
    state["current_query"] = new_query
    return state


def generate_node(state: dict) -> dict:
    query = state["original_query"]
    chunks = state.get("all_chunks", [])

    seen_ids = set()
    unique_chunks = []
    for c in chunks:
        key = c.get("text", "")[:80]
        if key not in seen_ids:
            seen_ids.add(key)
            unique_chunks.append(c)

    state["final_answer"] = generate(query, unique_chunks)
    return state
