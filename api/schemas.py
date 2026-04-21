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
    label: str
    label_id: int
    confidence: float = Field(..., ge=0.0, le=1.0)
    probabilities: dict[str, float]
    flagged_phrases: list[str] = Field(default=[])
    detected_techniques: dict[str, list[str]] = Field(default={}, description="Propaganda techniques detected, mapped to example phrases.")


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


class BacklinkRequest(BaseModel):
    """Request body for backlink analysis."""
    url: str = Field(..., description="The URL or domain to analyze backlinks for.")


class BacklinkResponse(BaseModel):
    """Response body for backlink network analysis."""
    total_backlinks: int
    unique_referring_domains: int
    propaganda_sources: int
    credible_sources: int
    unknown_sources: int
    dark_web_links: int
    nofollow_ratio: float
    top_referring_domains: list[str]
    propaganda_referring_domains: list[str]
    credible_referring_domains: list[str]
    network_propaganda_score: float
