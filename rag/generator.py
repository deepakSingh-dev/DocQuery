import json
import logging
import os

import requests
from dotenv import load_dotenv

from rag.citations import Citation, CitedAnswer

load_dotenv()

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = "llama3.2-vision:11b"

SYSTEM_PROMPT = """You are a precise document question-answering assistant.
Rules:
- Answer ONLY from the provided context chunks.
- Always cite the source filename and page number for every claim.
- If the context is insufficient, respond exactly: "I don't have enough information in the provided documents"
- Never hallucinate or invent facts not present in the context.

Respond in this exact JSON format:
{
  "answer": "<your answer>",
  "citations": [
    {"source": "<filename>", "page_number": <int>, "excerpt": "<quote under 100 chars>", "modality": "<text|table|image_caption>"}
  ],
  "confidence": <float 0.0-1.0>,
  "has_sufficient_context": <true|false>
}"""


def _build_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        header = f"[Source: {chunk['source']} | Page: {chunk['page_number']} | Type: {chunk['modality']}]"
        parts.append(f"{header}\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def _parse_response(raw: str, query: str) -> CitedAnswer:
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON found in response")

    data = json.loads(raw[start:end])
    citations = [Citation(**c) for c in data.get("citations", [])]
    return CitedAnswer(
        answer=data.get("answer", raw.strip()),
        citations=citations,
        confidence=float(data.get("confidence", 0.0)),
        has_sufficient_context=bool(data.get("has_sufficient_context", False)),
    )


def generate(query: str, chunks: list[dict]) -> CitedAnswer:
    if not chunks:
        return CitedAnswer(
            answer="I don't have enough information in the provided documents",
            citations=[],
            confidence=0.0,
            has_sufficient_context=False,
        )

    context = _build_context(chunks)
    prompt = f"{SYSTEM_PROMPT}\n\nContext:\n{context}\n\nQuestion: {query}"

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": LLM_MODEL, "prompt": prompt, "stream": False},
            timeout=120,
        )
        response.raise_for_status()
        raw = response.json().get("response", "")
    except Exception as e:
        logger.warning(f"LLM call failed: {e}")
        return CitedAnswer(
            answer="Error contacting the language model.",
            citations=[],
            confidence=0.0,
            has_sufficient_context=False,
        )

    try:
        return _parse_response(raw, query)
    except Exception as e:
        logger.warning(f"Failed to parse LLM response: {e}\nRaw: {raw[:200]}")
        return CitedAnswer(
            answer=raw.strip(),
            citations=[],
            confidence=0.0,
            has_sufficient_context=True,
        )
