from pydantic import BaseModel, Field


class UserRequest(BaseModel):
    user_id: str = Field(
        min_length=1,
        max_length=50
    )
    name: str = Field(
        min_length=1,
        max_length=100
    )


class RatingRequest(BaseModel):
    parent_asin: str
    rating: float = Field(
        ge=1,
        le=5
    )


class RatingResponse(BaseModel):
    user_id: str
    parent_asin: str
    rating: float