from datetime import datetime, timezone
from uuid import UUID
from typing import Optional
from pydantic import BaseModel


class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    item_type: str = "leetcode"
    is_default: bool = False


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CollectionResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str]
    item_type: str
    is_default: bool
    created_at: datetime
    updated_at: datetime
