import logging
import os

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = "llama3.2-vision:11b"

VALID_ROUTES = {"answer_from_docs", "search_web", "run_code"}

PROMPT_TEMPLATE = """You are a query router. Classify the user query into exactly one category.

Categories:
- answer_from_docs: question about uploaded documents, files, or their content
- search_web: question about current events, news, or information not likely in documents
- run_code: request to calculate, compute, or execute something programmatically

Respond with ONLY one of: answer_from_docs, search_web, run_code

Query: {query}"""


def plan(query: str) -> str:
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": LLM_MODEL,
                "prompt": PROMPT_TEMPLATE.format(query=query),
                "stream": False,
            },
            timeout=30,
        )
        response.raise_for_status()
        route = response.json().get("response", "").strip().lower()

        for valid in VALID_ROUTES:
            if valid in route:
                route = valid
                break
        else:
            route = "answer_from_docs"
    except Exception as e:
        logger.warning(f"Planner LLM call failed: {e}")
        route = "answer_from_docs"

    print(f"[Planner] Routing to: {route}")
    return route
