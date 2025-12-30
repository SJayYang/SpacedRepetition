from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel


class ItemCreate(BaseModel):
    collection_id: UUID
    title: str
    external_id: Optional[str] = None
    external_url: Optional[str] = None
    metadata: dict = {}
    notes: Optional[str] = None


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    external_url: Optional[str] = None
    metadata: Optional[dict] = None
    notes: Optional[str] = None


class ItemBulkCreate(BaseModel):
    collection_id: UUID
    items: List[dict]


class ItemResponse(BaseModel):
    id: UUID
    user_id: UUID
    collection_id: UUID
    title: str
    external_id: Optional[str]
    external_url: Optional[str]
    metadata: dict
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    archived_at: Optional[datetime]
