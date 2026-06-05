import os
from pathlib import Path

UPLOADS_DIR = Path("uploads")


def read_file(filename: str) -> str:
    if ".." in filename or "/" in filename or "\\" in filename:
        return "Error: invalid filename — path traversal not allowed."

    file_path = UPLOADS_DIR / filename

    if not file_path.exists():
        return f"Error: file '{filename}' not found in uploads/."

    try:
        return file_path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return f"Error reading file: {e}"
