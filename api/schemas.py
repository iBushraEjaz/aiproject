"""
Pydantic schemas for the Propaganda Detection API.
"""

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Request body for single text analysis."""
    text: str = Field(
        ...,
        min_length=1,
        description="The text to analyze for propaganda.",
        examples=["The government is secretly controlling the media to manipulate public opinion."],
    )


class AnalyzeResponse(BaseModel):
    """Response body for single text analysis."""
    label: str = Field(..., description="Predicted label: 'propaganda' or 'non-propaganda'.")
    label_id: int = Field(..., description="Numeric label ID (0 = non-propaganda, 1 = propaganda).")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score for the predicted label.")
    probabilities: dict[str, float] = Field(
        ...,
        description="Softmax probabilities for each class.",
    )


class BatchAnalyzeRequest(BaseModel):
    """Request body for batch text analysis."""
    texts: list[str] = Field(
        ...,
        min_length=1,
        max_length=64,
        description="List of texts to analyze (max 64 per request).",
    )


class BatchAnalyzeResponse(BaseModel):
    """Response body for batch text analysis."""
    results: list[AnalyzeResponse]


class HealthResponse(BaseModel):
    """Response body for the health check endpoint."""
    status: str
    model_loaded: bool
    model_name: str
    device: str


class FetchUrlRequest(BaseModel):
    """Request body for URL text extraction."""
    url: str = Field(..., description="The URL to fetch and extract text from.")


class FetchUrlResponse(BaseModel):
    """Response body for URL text extraction."""
    url: str
    text: str
    title: str
