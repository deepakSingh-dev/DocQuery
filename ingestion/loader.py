import os
from pathlib import Path

SUPPORTED_EXTENSIONS = {".pdf", ".txt"}


def load_documents(folder: str) -> list[dict]:
    folder_path = Path(folder)

    if not folder_path.exists():
        raise FileNotFoundError(f"Folder not found: {folder}")

    documents = []
    for path in sorted(folder_path.rglob("*")):
        if not path.is_file():
            continue
        if path.name.startswith("."):
            continue
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        documents.append({
            "source": path.name,
            "path": str(path),
            "extension": path.suffix.lower(),
        })

    return documents
