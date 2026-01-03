"""Base service class for common database operations."""
from datetime import datetime, timezone
from typing import Optional, Any, Dict, List
from uuid import UUID

from fastapi import HTTPException
from supabase import Client


class BaseService:
    """Base service with common CRUD operations."""

    def __init__(self, table_name: str, supabase: Client, user_id: str):
        self.table_name = table_name
        self.supabase = supabase
        self.user_id = user_id

    async def list(
        self,
        order_by: str = "created_at",
        desc: bool = False,
        limit: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
        select: str = "*"
    ) -> List[Dict[str, Any]]:
        """List all items for the current user."""
        query = self.supabase.table(self.table_name).select(select).eq("user_id", self.user_id)

        # Apply additional filters
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)

        # Apply ordering
        query = query.order(order_by, desc=desc)

        # Apply limit
        if limit:
            query = query.limit(limit)

        response = query.execute()
        return response.data

    async def get(
        self,
        item_id: UUID,
        select: str = "*",
        not_found_message: str = "Item not found"
    ) -> Dict[str, Any]:
        """Get a single item by ID."""
        response = self.supabase.table(self.table_name) \
            .select(select) \
            .eq("id", str(item_id)) \
            .eq("user_id", self.user_id) \
            .single() \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail=not_found_message)

        return response.data

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new item."""
        # Add user_id to data
        data["user_id"] = self.user_id

        response = self.supabase.table(self.table_name).insert(data).execute()
        return response.data[0]

    async def update(
        self,
        item_id: UUID,
        data: Dict[str, Any],
        not_found_message: str = "Item not found"
    ) -> Dict[str, Any]:
        """Update an existing item."""
        # Add updated_at timestamp
        data["updated_at"] = datetime.now(timezone.utc).isoformat()

        response = self.supabase.table(self.table_name).update(data) \
            .eq("id", str(item_id)) \
            .eq("user_id", self.user_id) \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail=not_found_message)

        return response.data[0]

    async def delete(
        self,
        item_id: UUID,
        not_found_message: str = "Item not found"
    ) -> Dict[str, str]:
        """Delete an item."""
        response = self.supabase.table(self.table_name).delete() \
            .eq("id", str(item_id)) \
            .eq("user_id", self.user_id) \
            .execute()

        if not response.data:
            raise HTTPException(status_code=404, detail=not_found_message)

        return {"message": f"{self.table_name.capitalize()} deleted successfully"}
