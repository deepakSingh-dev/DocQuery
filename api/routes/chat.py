"""Chat route.

Question-answering endpoints: a synchronous POST that runs the full LangGraph
agent, and a WebSocket that streams answer tokens in real time and sends a final
citation block once generation completes.
"""
import asyncio
import json
import os
import threading

import requests
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from agent.graph import run_agent
from api.schemas import CitationResponse, CitedAnswerResponse, QuestionRequest
from rag.citations import CitedAnswer
from rag.generator import SYSTEM_PROMPT, _build_context, _parse_response
from rag.retriever import retrieve

router = APIRouter()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = "llama3.2-vision:11b"


def _to_response(result: CitedAnswer) -> CitedAnswerResponse:
    return CitedAnswerResponse(
        answer=result.answer,
        citations=[CitationResponse(**c.model_dump()) for c in result.citations],
        confidence=result.confidence,
        has_sufficient_context=result.has_sufficient_context,
    )


@router.post("/chat", response_model=CitedAnswerResponse)
def chat(request: QuestionRequest) -> CitedAnswerResponse:
    result = run_agent(request.question)
    return _to_response(result)


@router.websocket("/chat/stream")
async def chat_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        question = data.get("question", "")

        chunks = await asyncio.to_thread(retrieve, question)
        context = _build_context(chunks)
        prompt = f"{SYSTEM_PROMPT}\n\nContext:\n{context}\n\nQuestion: {question}"

        queue: asyncio.Queue = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def _ollama_stream() -> None:
            try:
                resp = requests.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={"model": LLM_MODEL, "prompt": prompt, "stream": True},
                    stream=True,
                    timeout=120,
                )
                for raw_line in resp.iter_lines():
                    if raw_line:
                        payload = json.loads(raw_line)
                        token = payload.get("response", "")
                        if token:
                            loop.call_soon_threadsafe(queue.put_nowait, ("token", token))
                        if payload.get("done"):
                            break
            except Exception as e:
                loop.call_soon_threadsafe(queue.put_nowait, ("error", str(e)))
            loop.call_soon_threadsafe(queue.put_nowait, ("done", ""))

        thread = threading.Thread(target=_ollama_stream, daemon=True)
        thread.start()

        full_response = ""
        while True:
            kind, content = await queue.get()
            if kind == "token":
                full_response += content
                await websocket.send_text(content)
            else:
                break

        try:
            cited = _parse_response(full_response, question)
        except Exception:
            cited = CitedAnswer(
                answer=full_response,
                citations=[],
                confidence=0.0,
                has_sufficient_context=bool(chunks),
            )

        await websocket.send_json({"type": "citations", "data": _to_response(cited).model_dump()})

    except WebSocketDisconnect:
        pass
