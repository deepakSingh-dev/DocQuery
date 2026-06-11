from pydantic import BaseModel, Field


class Citation(BaseModel):
    source: str
    page_number: int
    excerpt: str = Field(..., max_length=100)
    modality: str


class CitedAnswer(BaseModel):
    answer: str
    citations: list[Citation]
    confidence: float = Field(..., ge=0.0, le=1.0)
    has_sufficient_context: bool
