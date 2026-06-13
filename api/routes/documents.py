"""Documents route.

Endpoints to manage the document corpus: upload a file (queuing async
ingestion), list ingested documents with their chunk and modality stats, poll a
task's status, and delete a document along with its vectors.
"""
import os
from collections import defaultdict
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from api.schemas import DocumentInfo, UploadResponse
from vectordb.store import get_or_create_collection

router = APIRouter()

UPLOADS_DIR = Path("uploads")


@router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile) -> UploadResponse:
    UPLOADS_DIR.mkdir(exist_ok=True)
    dest = UPLOADS_DIR / file.filename
    content = await file.read()
    dest.write_bytes(content)

    try:
        from tasks.ingest_task import ingest_document
        task = ingest_document.delay(str(dest.resolve()))
        task_id = task.id
    except Exception:
        task_id = "sync"
        from scripts.ingest import ingest
        ingest(str(dest))

    return UploadResponse(task_id=task_id, filename=file.filename, status="queued")


@router.get("/documents", response_model=list[DocumentInfo])
def list_documents() -> list[DocumentInfo]:
    collection = get_or_create_collection()
    result = collection.get(include=["metadatas"])

    sources: dict[str, dict] = defaultdict(lambda: {"count": 0, "modalities": set()})
    for meta in result.get("metadatas") or []:
        src = meta.get("source", "unknown")
        sources[src]["count"] += 1
        sources[src]["modalities"].add(meta.get("modality", "text"))

    return [
        DocumentInfo(
            filename=src,
            chunk_count=info["count"],
            modalities=sorted(info["modalities"]),
        )
        for src, info in sorted(sources.items())
    ]


@router.get("/documents/task/{task_id}")
def get_task_status(task_id: str) -> dict:
    if task_id == "sync":
        return {"task_id": task_id, "status": "SUCCESS", "result": None}
    try:
        from celery.result import AsyncResult
        from tasks.ingest_task import celery_app
        result = AsyncResult(task_id, app=celery_app)
        return {
            "task_id": task_id,
            "status": result.status,
            "result": result.result if result.ready() else None,
        }
    except Exception as e:
        return {"task_id": task_id, "status": "UNKNOWN", "result": None, "error": str(e)}


@router.delete("/documents/{filename}")
def delete_document(filename: str) -> dict:
    collection = get_or_create_collection()

    try:
        collection.delete(where={"source": {"$eq": filename}})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ChromaDB delete failed: {e}")

    file_path = UPLOADS_DIR / filename
    if file_path.exists():
        file_path.unlink()

    return {"status": "deleted", "filename": filename}
