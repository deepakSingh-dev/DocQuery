CHUNK_SIZE = 500   # words
OVERLAP = 50       # words


def _split_text(text: str) -> list[str]:
    words = text.split()
    if not words:
        return []

    step = CHUNK_SIZE - OVERLAP
    chunks = []
    for i in range(0, len(words), step):
        chunk_words = words[i : i + CHUNK_SIZE]
        chunks.append(" ".join(chunk_words))
        if i + CHUNK_SIZE >= len(words):
            break

    return chunks


def chunk_document(pages: list[dict], source: str, modality: str = "text") -> list[dict]:
    chunks = []
    chunk_index = 0

    for page in pages:
        page_number = page["page_number"]
        text = page.get("text", "")

        if modality == "text":
            for chunk_text in _split_text(text):
                if not chunk_text.strip():
                    continue
                chunks.append({
                    "id": f"{source}_p{page_number}_c{chunk_index}",
                    "text": chunk_text,
                    "source": source,
                    "page_number": page_number,
                    "chunk_index": chunk_index,
                    "modality": "text",
                })
                chunk_index += 1

            for table_text in page.get("tables", []):
                if not table_text.strip():
                    continue
                chunks.append({
                    "id": f"{source}_p{page_number}_c{chunk_index}",
                    "text": table_text,
                    "source": source,
                    "page_number": page_number,
                    "chunk_index": chunk_index,
                    "modality": "table",
                })
                chunk_index += 1

        else:
            # "table" or "image_caption" — store as a single chunk, no splitting
            if text.strip():
                chunks.append({
                    "id": f"{source}_p{page_number}_c{chunk_index}",
                    "text": text,
                    "source": source,
                    "page_number": page_number,
                    "chunk_index": chunk_index,
                    "modality": modality,
                })
                chunk_index += 1

    return chunks
