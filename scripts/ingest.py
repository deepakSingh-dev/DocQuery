"""Ingest CLI.

Command-line entry point that runs the full ingestion pipeline for a single
file (loader -> extractor -> vision -> chunker -> embedder -> store), printing
progress at each step.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ingestion.loader import load_documents
from ingestion.extractor import extract_pdf, extract_txt
from ingestion.vision import caption_page_images
from ingestion.chunker import chunk_document
from embeddings.embedder import embed
from vectordb.store import get_or_create_collection, store_chunks


def ingest(filepath: str) -> None:
    path = Path(filepath)
    if not path.exists():
        print(f"Error: file not found — {filepath}")
        sys.exit(1)

    source = path.name
    ext = path.suffix.lower()

    print(f"Ingesting: {source}")

    print("Extracting...")
    if ext == ".pdf":
        pages = extract_pdf(filepath)
    elif ext == ".txt":
        pages = extract_txt(filepath)
    else:
        print(f"Unsupported file type: {ext}")
        sys.exit(1)

    if not pages:
        print("No content extracted. Aborting.")
        sys.exit(1)

    chunks = chunk_document(pages, source, modality="text")

    if ext == ".pdf":
        for page in pages:
            caption = caption_page_images(filepath, page["page_number"])
            if caption:
                caption_chunks = chunk_document(
                    [{"page_number": page["page_number"], "text": caption}],
                    source,
                    modality="image_caption",
                )
                chunks.extend(caption_chunks)

    chunks = [c for c in chunks if c["text"].strip()]
    print(f"Chunking... {len(chunks)} chunks")

    print("Embedding...")
    texts = [c["text"] for c in chunks]
    embeddings = embed(texts)

    print("Storing...")
    collection = get_or_create_collection()
    store_chunks(collection, chunks, embeddings)
    print(f"Done. Total: {len(chunks)} chunks stored.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest a document into DocQuery")
    parser.add_argument("--file", required=True, help="Path to the file to ingest")
    args = parser.parse_args()
    ingest(args.file)
