<div align="center">

# 🔍 DocQuery

### Enterprise AI Document Intelligence & Agentic RAG Platform

**Chat with any document. Get answers grounded in verified, page-level citations — powered by a self-correcting AI agent that runs 100% locally.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic_AI-FF6F00)](https://langchain-ai.github.io/langgraph/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-5A67D8)](https://www.trychroma.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-000000)](https://ollama.com/)
[![Celery](https://img.shields.io/badge/Celery-Redis-37814A?logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 🎯 What is DocQuery?

**DocQuery** is a full-stack **Generative AI** application that turns a pile of documents into an intelligent, queryable knowledge base. Upload PDFs containing **text, tables, or scanned images**, ask questions in plain English, and get accurate answers with **inline citations** pointing to the exact source and page. When your documents fall short, an **autonomous AI agent** decides — on its own — to search the web or run code to find the answer.

The entire system runs **locally and free of charge** on open-source **Large Language Models (LLMs)** via **Ollama** — no API keys, no recurring cloud bills, and complete **data privacy**. This makes it a realistic reference architecture for **privacy-first, on-premise enterprise AI** in regulated domains like finance, healthcare, and legal.

> **In one line:** A local, citation-grounded, **Retrieval-Augmented Generation (RAG)** platform with a **self-correcting agentic reasoning loop** and a real-time streaming chat UI.

---

## 💡 Why it stands out

- **Zero hallucination by design** — answers are strictly grounded in retrieved context, with explicit `has_sufficient_context` refusal when the documents don't contain the answer.
- **Self-correcting agent** — instead of a single retrieval pass, a **LangGraph** state machine grades its own results and **reformulates the query** until confidence is high (up to 3 attempts).
- **Truly multimodal** — parses plain text, extracts tables to Markdown, and uses a **vision-language model** to caption charts, diagrams, and scanned images.
- **Production patterns, not a toy** — async task queues, WebSocket streaming, health checks, typed schemas, and a Gitflow-based delivery process.

---

## ✨ Features

| | Feature | Tech |
|---|---|---|
| 📄 | **Multimodal document ingestion** — text, tables, image captions | PyMuPDF · Camelot · Vision LLM |
| 🧠 | **Semantic search / RAG** over a persistent vector store | ChromaDB · nomic-embed-text |
| 🤖 | **Self-correcting agentic RAG loop** with query reformulation | LangGraph |
| 🧭 | **LLM task router** — docs vs. web search vs. code execution | Ollama · LangGraph |
| 🔧 | **Tool-calling via Model Context Protocol (MCP)** | MCP Python SDK |
| 📑 | **Verified page-level citations** with confidence scores | Pydantic |
| ⚡ | **Async background ingestion** + auto-ingest file watcher | Celery · Redis · Watchdog |
| 🌊 | **Real-time token streaming** chat interface | FastAPI WebSockets · Next.js |
| 🔒 | **100% local & private** — no data leaves your machine | Ollama |

---

## 🧰 Tech Stack

**AI / Machine Learning**
`Large Language Models (LLM)` · `Retrieval-Augmented Generation (RAG)` · `LangGraph` · `Agentic AI` · `Vector Embeddings` · `Semantic Search` · `ChromaDB` · `Ollama` · `llama3.2-vision` · `nomic-embed-text` · `Multimodal AI` · `Computer Vision` · `Model Context Protocol (MCP)` · `Prompt Engineering` · `NLP`

**Backend**
`Python` · `FastAPI` · `WebSockets` · `Celery` · `Redis` · `Pydantic` · `PyMuPDF` · `Camelot` · `Watchdog` · `DuckDuckGo Search`

**Frontend**
`Next.js (App Router)` · `React` · `TypeScript` · `Tailwind CSS`

**Infrastructure / DevOps**
`Docker` · `Docker Compose` · `Git / Gitflow` · `Microservices` · `Async Task Queues`

---

## 🏗️ Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │        Next.js + TypeScript + Tailwind        │
                  │   Streaming Chat · Drag-Drop Upload · Cites    │
                  └──────────────┬──────────────┬────────────────┘
                   REST / WebSocket            │ multipart upload
                                 ▼              ▼
                  ┌──────────────────────────────────────────────┐
                  │                 FastAPI Backend               │
                  │    /chat   /chat/stream   /documents  /health  │
                  └───────┬────────────────────────┬─────────────┘
                          │                         │ enqueue job
              query (RAG) ▼                         ▼
        ┌──────────────────────────┐    ┌──────────────────────────┐
        │  LangGraph Agentic Core   │    │   Celery + Redis Workers   │
        │                           │    │     (async ingestion)      │
        │   planner_node (router)   │    └─────────────┬─────────────┘
        │   ┌──────┬───────┬──────┐ │                  ▼
        │  docs   web     code     │    ┌──────────────────────────┐
        │ retrieve search exec     │    │   Ingestion Pipeline       │
        │ evaluate  │      │       │    │  Load → Extract (text +    │
        │ requery   └──┐ ┌─┘       │    │  tables) → Vision Caption  │
        │   └────► generate ◄──────┘    │  → Chunk → Embed → Store   │
        │        (cited answer)     │    └─────────────┬─────────────┘
        └────────────┬─────────────┘                  │ upsert
                     │ embed + search                 ▼
                  ┌──────────────────────────────────────────────┐
                  │           ChromaDB Vector Store (local)        │
                  │   vectors + metadata + page-level citations    │
                  └────────────────────┬─────────────────────────┘
                                       ▲ inference
                  ┌──────────────────────────────────────────────┐
                  │     Ollama — llama3.2-vision · nomic-embed     │
                  └──────────────────────────────────────────────┘
```

### The Agentic RAG Loop
1. **Plan** — an LLM classifies the query → `answer_from_docs` · `search_web` · `run_code`
2. **Retrieve** — semantic vector search pulls the most relevant chunks from ChromaDB
3. **Evaluate** — the agent grades retrieval confidence; if low, it **rewrites the query and retries** (max 3 loops)
4. **Generate** — produces a grounded, **cited** answer with a confidence score — and refuses to answer when context is insufficient

---

## 🚀 Quick Start

### Prerequisites
| Tool | Version |
|---|---|
| [Ollama](https://ollama.com/) | latest |
| Python | 3.11+ |
| Node.js | 18+ |
| Docker + Compose | latest |

Pull the models (one-time):
```bash
ollama pull llama3.2-vision:11b   # multimodal LLM (text + vision)
ollama pull nomic-embed-text      # embedding model
```

### Setup
```bash
git clone <your-repo-url> docquery && cd docquery

python3 -m venv venv
source venv/bin/activate           # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Launch (one terminal per service)
```bash
ollama serve                                                          # 1. LLM server
docker compose up -d                                                  # 2. Redis broker
uvicorn api.main:app --reload                                         # 3. API  → :8000/docs
celery -A tasks.ingest_task worker --loglevel=info --concurrency=1    # 4. Worker
```
```bash
cd frontend && npm install && npm run dev                            # 5. UI → :3000
```

### Use it
1. Go to **http://localhost:3000/documents** → drag-drop a PDF → wait for **✅ Ready**
2. Open the chat page → ask a question → watch the answer **stream live with citations**

**Prefer the CLI?**
```bash
python3 scripts/ingest.py --file uploads/your.pdf
python3 scripts/ask.py "What does the document say about revenue?" --verbose
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health of Ollama, ChromaDB, Redis |
| `POST` | `/documents/upload` | Upload a file → async ingestion |
| `GET` | `/documents` | List ingested documents + stats |
| `DELETE` | `/documents/{filename}` | Delete a document and its vectors |
| `POST` | `/chat` | Ask a question → cited answer (agent) |
| `WS` | `/chat/stream` | Stream answer tokens + final citations |

Interactive Swagger docs: **http://localhost:8000/docs**

---

## 📂 Project Structure

```
docquery/
├── ingestion/      # loader · extractor (PyMuPDF/Camelot) · vision captioner · chunker
├── embeddings/     # Ollama embedding client (batched, 768-dim)
├── vectordb/       # ChromaDB store + semantic search
├── rag/            # citation schema · retriever · cited-answer generator
├── agent/          # LangGraph nodes · state machine · planner · file watcher
├── mcp_tools/      # MCP server: web_search · run_python · read_file
├── tasks/          # Celery async ingestion (+ LLM summarization)
├── api/            # FastAPI app · routes · Pydantic schemas
├── scripts/        # CLI: ingest.py · search.py · ask.py
├── frontend/       # Next.js + TypeScript + Tailwind UI
└── docker-compose.yml
```

---

## 🎓 Skills & Concepts Demonstrated

- **Retrieval-Augmented Generation (RAG):** chunking with overlap, dense embeddings, vector indexing, similarity thresholding, context injection
- **Agentic AI:** LangGraph stateful graphs, cyclic self-correction, conditional routing, multi-step tool-using agents
- **Tool-Augmented LLMs:** Model Context Protocol (MCP), web search, sandboxed Python execution, safe file access
- **Multimodal AI / Computer Vision:** vision-language captioning of charts, diagrams, and scanned pages
- **Prompt Engineering:** structured JSON outputs, anti-hallucination grounding, query reformulation
- **AI Infrastructure / MLOps:** local model serving (Ollama), async queues (Celery/Redis), Docker, health checks
- **Full-Stack Engineering:** typed REST + WebSocket APIs, real-time React streaming UI, drag-and-drop UX

---

## 🗺️ Roadmap

- [ ] **Evaluation harness** — RAGAS metrics (faithfulness, answer relevance, context precision) in CI
- [ ] **Auth & multi-tenancy** — JWT + per-user isolated vector collections
- [ ] **Cloud deployment** — containerized stack on GPU instances
- [ ] **Cross-encoder re-ranking** for higher retrieval precision
- [ ] **Multi-turn conversation memory**

---

## 📄 License

[MIT](LICENSE)

---

<div align="center">

**Built to demonstrate end-to-end AI Engineering — document ingestion → agentic reasoning → streaming production UI.**

*Recruiters & engineers: thanks for visiting! Feel free to open an issue or reach out.* 👋

</div>
