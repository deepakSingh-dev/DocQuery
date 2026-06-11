import base64
import logging
import os

import fitz  # PyMuPDF
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
VISION_MODEL = "llama3.2-vision:11b"
CAPTION_PROMPT = "Describe all visual content on this page including any charts, diagrams, or images in detail."


def caption_page_images(pdf_path: str, page_number: int) -> str | None:
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        logger.warning(f"Cannot open PDF for vision {pdf_path}: {e}")
        return None

    try:
        page = doc[page_number - 1]
        images = page.get_images(full=True)

        if not images:
            return None

        pix = page.get_pixmap(dpi=150)
        png_bytes = pix.tobytes("png")
        image_b64 = base64.b64encode(png_bytes).decode("utf-8")
    except Exception as e:
        logger.warning(f"Cannot render page {page_number} of {pdf_path}: {e}")
        return None
    finally:
        doc.close()

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": VISION_MODEL,
                "prompt": CAPTION_PROMPT,
                "images": [image_b64],
                "stream": False,
            },
            timeout=10,
        )
        response.raise_for_status()
        return response.json().get("response", "").strip() or None
    except requests.exceptions.Timeout:
        logger.warning(f"Ollama vision timeout on {pdf_path} page {page_number}")
        return None
    except Exception as e:
        logger.warning(f"Ollama vision error on {pdf_path} page {page_number}: {e}")
        return None
