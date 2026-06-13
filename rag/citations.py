"""Citation schema.

Pydantic models that define the contract for a grounded answer: a list of
source/page/excerpt citations plus a self-assessed confidence and a flag
indicating whether the retrieved context was sufficient to answer.
"""
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
