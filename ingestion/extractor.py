import logging
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


def _table_to_markdown(table) -> str:
    df = table.df
    rows = []
    for i, row in df.iterrows():
        rows.append("| " + " | ".join(str(cell) for cell in row) + " |")
    if not rows:
        return ""
    header = rows[0]
    separator = "| " + " | ".join("---" for _ in df.columns) + " |"
    return "\n".join([header, separator] + rows[1:])


def extract_pdf(path: str) -> list[dict]:
    try:
        doc = fitz.open(path)
    except Exception as e:
        logger.warning(f"Cannot open PDF {path}: {e}")
        return []

    if doc.is_encrypted:
        logger.warning(f"Encrypted PDF skipped: {path}")
        doc.close()
        return []

    pages = []
    for page_num in range(len(doc)):
        try:
            page = doc[page_num]
            text = page.get_text()
        except Exception as e:
            logger.warning(f"Cannot read page {page_num + 1} of {path}: {e}")
            text = ""

        tables = _extract_tables(path, page_num + 1)

        pages.append({
            "page_number": page_num + 1,
            "text": text,
            "tables": tables,
        })

    doc.close()
    return pages


def _extract_tables(path: str, page_number: int) -> list[str]:
    try:
        import camelot
        table_list = camelot.read_pdf(path, pages=str(page_number), suppress_stdout=True)
        return [_table_to_markdown(t) for t in table_list if t.df is not None]
    except Exception as e:
        logger.warning(f"Table extraction failed for {path} page {page_number}: {e}")
        return []


def extract_txt(path: str) -> list[dict]:
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            text = f.read()
    except Exception as e:
        logger.warning(f"Cannot read txt file {path}: {e}")
        return []

    return [{"page_number": 1, "text": text, "tables": []}]
