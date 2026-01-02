from datetime import datetime, timezone
from uuid import UUID
from pydantic import BaseModel
from app.reviews.scheduler import Rating


class ReviewCreate(BaseModel):
    item_id: UUID
    rating: Rating


class ReviewResponse(BaseModel):
    id: UUID
    item_id: UUID
    rating: int
    next_review_at: datetime
    interval_days: int
