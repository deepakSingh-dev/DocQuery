"""Retriever.

Thin RAG retrieval layer over the vector store: runs a similarity search and
filters out hits below a confidence threshold, returning an empty list rather
than raising when nothing is relevant enough.
"""
from vectordb.store import get_or_create_collection
from vectordb.search import search


def retrieve(
    query: str,
    n_results: int = 5,
    min_score: float = 0.4,
) -> list[dict]:
    collection = get_or_create_collection()
    results = search(collection, query, n_results=n_results)
    filtered = [r for r in results if r["score"] >= min_score]
    return sorted(filtered, key=lambda x: x["score"], reverse=True)
