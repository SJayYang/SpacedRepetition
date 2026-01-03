"""Collections service."""
from typing import List, Dict, Any

from supabase import Client

from app.services.base import BaseService


class CollectionsService(BaseService):
    """Service for collections operations."""

    def __init__(self, supabase: Client, user_id: str):
        super().__init__("collections", supabase, user_id)

    async def list(self, **kwargs) -> List[Dict[str, Any]]:
        """List collections ordered by creation date."""
        return await super().list(order_by="created_at", desc=False, **kwargs)
