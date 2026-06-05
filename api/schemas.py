from pydantic import BaseModel


class QuestionRequest(BaseModel):
    question: str


class CitationResponse(BaseModel):
    source: str
    page_number: int
    excerpt: str
    modality: str


class CitedAnswerResponse(BaseModel):
    answer: str
    citations: list[CitationResponse]
    confidence: float
    has_sufficient_context: bool


class DocumentInfo(BaseModel):
    filename: str
    chunk_count: int
    modalities: list[str]


class UploadResponse(BaseModel):
    task_id: str
    filename: str
    status: str


class HealthResponse(BaseModel):
    ollama: bool
    chromadb: bool
    redis: bool
