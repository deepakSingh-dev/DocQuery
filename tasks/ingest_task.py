"""Async ingestion task.

The Celery task that runs the full ingestion pipeline off the request path:
load, extract, caption, chunk, embed, and store a document, then generate and
store a one-paragraph LLM summary as an extra chunk.
"""
import logging
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = "llama3.2-vision:11b"

celery_app = Celery(
    "docquery",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"


def _generate_summary(text_sample: str, source: str) -> str:
    prompt = (
        f"Write a concise one-paragraph summary of the following document excerpt "
        f"from '{source}':\n\n{text_sample[:2000]}"
    )
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": LLM_MODEL, "prompt": prompt, "stream": False},
            timeout=300,
        )
        response.raise_for_status()
        return response.json().get("response", "").strip()
    except Exception as e:
        logger.warning(f"Summary generation failed: {e}")
        return ""


@celery_app.task
def ingest_document(filepath: str) -> dict:
    from ingestion.extractor import extract_pdf, extract_txt
    from ingestion.vision import caption_page_images
    from ingestion.chunker import chunk_document
    from embeddings.embedder import embed
    from vectordb.store import get_or_create_collection, store_chunks

    path = Path(filepath)
    source = path.name
    ext = path.suffix.lower()

    logger.info(f"[Celery] Ingesting: {source}")

    if ext == ".pdf":
        pages = extract_pdf(filepath)
    elif ext == ".txt":
        pages = extract_txt(filepath)
    else:
        return {"status": "error", "message": f"Unsupported file type: {ext}"}

    if not pages:
        return {"status": "error", "message": "No content extracted"}

    chunks = chunk_document(pages, source, modality="text")

    if ext == ".pdf":
        for page in pages:
            caption = caption_page_images(filepath, page["page_number"])
            if caption:
                chunks.extend(
                    chunk_document(
                        [{"page_number": page["page_number"], "text": caption}],
                        source,
                        modality="image_caption",
                    )
                )

    chunks = [c for c in chunks if c["text"].strip()]

    texts = [c["text"] for c in chunks]
    embeddings = embed(texts)

    collection = get_or_create_collection()
    store_chunks(collection, chunks, embeddings)

    stored_count = len(chunks)
    logger.info(f"[Celery] Core ingestion done: {stored_count} chunks for {source}")

    # Summary is best-effort and entirely optional. The whole block is wrapped
    # so that ANY failure (LLM timeout, Ollama saturated, embed error) only logs
    # a warning — core ingestion has already succeeded and the task must not fail.
    try:
        all_text = " ".join(p.get("text", "") for p in pages)
        summary = _generate_summary(all_text, source)
        if summary:
            summary_chunk = [{
                "id": f"{source}_summary",
                "text": summary,
                "source": source,
                "page_number": 0,
                "chunk_index": 9999,
                "modality": "summary",
            }]
            summary_embeddings = embed([summary])
            store_chunks(collection, summary_chunk, summary_embeddings)
            stored_count += 1
            logger.info(f"[Celery] Summary chunk stored for {source}")
    except Exception as e:
        logger.warning(f"[Celery] Summary step skipped (non-fatal): {e}")

    return {"status": "success", "chunks_stored": stored_count, "source": source}
