"""Vector search.

Embeds a query and runs a similarity search against the ChromaDB collection,
returning hits with a normalised relevance score (1 - cosine distance) sorted
from most to least relevant.
"""
import chromadb

from embeddings.embedder import embed


def search(
    collection: chromadb.Collection,
    query: str,
    n_results: int = 5,
) -> list[dict]:
    query_embedding = embed([query])[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    distances = results["distances"][0]

    hits = []
    for doc, meta, distance in zip(docs, metas, distances):
        hits.append({
            "text": doc,
            "source": meta.get("source", ""),
            "page_number": meta.get("page_number", 0),
            "modality": meta.get("modality", "text"),
            "score": round(1 - distance, 4),
        })

    return sorted(hits, key=lambda x: x["score"], reverse=True)
