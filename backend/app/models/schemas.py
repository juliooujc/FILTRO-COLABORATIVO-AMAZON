from pydantic import BaseModel, Field


class RatingRequest(BaseModel):
    parent_asin: str
    rating: float = Field(ge=1, le=5)


class RatingResponse(BaseModel):
    user_id: str
    parent_asin: str
    rating: float