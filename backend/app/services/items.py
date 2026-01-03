"""Items service."""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from uuid import UUID

from supabase import Client

from app.services.base import BaseService


class ItemsService(BaseService):
    """Service for items operations."""

    def __init__(self, supabase: Client, user_id: str):
        super().__init__("items", supabase, user_id)

    async def list(
        self,
        collection_id: Optional[UUID] = None,
        archived: bool = False,
        limit: int = 100,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """List items with optional filtering."""
        filters = {}
        if collection_id:
            filters["collection_id"] = str(collection_id)

        # Build query
        query = self.supabase.table(self.table_name) \
            .select("*, scheduling_states(*)") \
            .eq("user_id", self.user_id) \
            .order("created_at", desc=True) \
            .limit(limit)

        if collection_id:
            query = query.eq("collection_id", str(collection_id))

        if not archived:
            query = query.is_("archived_at", "null")

        response = query.execute()
        items = response.data

        # Fetch the most recent review for each item
        if items:
            item_ids = [item["id"] for item in items]
            reviews_response = self.supabase.table("reviews") \
                .select("item_id, rating, reviewed_at") \
                .eq("user_id", self.user_id) \
                .in_("item_id", item_ids) \
                .order("reviewed_at", desc=True) \
                .execute()

            # Create a map of item_id to most recent review
            recent_reviews = {}
            for review in reviews_response.data:
                if review["item_id"] not in recent_reviews:
                    recent_reviews[review["item_id"]] = review

            # Add recent review to each item
            for item in items:
                item["recent_review"] = recent_reviews.get(item["id"])

        return items

    async def create_with_scheduling(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create item and its scheduling state."""
        # Add user_id to data
        data["user_id"] = self.user_id

        # Create item
        item_response = self.supabase.table(self.table_name).insert(data).execute()
        created_item = item_response.data[0]

        # Create scheduling state for the new item
        self.supabase.table("scheduling_states").insert({
            "item_id": created_item["id"],
            "user_id": self.user_id,
            "status": "new",
            "next_review_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

        return created_item

    async def bulk_create(self, collection_id: UUID, items_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Bulk import items."""
        items_to_insert = []
        for item_data in items_data:
            items_to_insert.append({
                "user_id": self.user_id,
                "collection_id": str(collection_id),
                "title": item_data.get("title"),
                "external_id": item_data.get("external_id"),
                "external_url": item_data.get("external_url"),
                "metadata": item_data.get("metadata", {}),
                "notes": item_data.get("notes"),
            })

        # Insert items
        items_response = self.supabase.table(self.table_name).insert(items_to_insert).execute()

        # Create scheduling states
        scheduling_states = []
        for item in items_response.data:
            scheduling_states.append({
                "item_id": item["id"],
                "user_id": self.user_id,
                "status": "new",
                "next_review_at": datetime.now(timezone.utc).isoformat(),
            })

        self.supabase.table("scheduling_states").insert(scheduling_states).execute()

        return {
            "message": f"Created {len(items_response.data)} items",
            "items": items_response.data
        }

    async def archive(self, item_id: UUID) -> Dict[str, Any]:
        """Archive (soft delete) an item."""
        return await self.update(
            item_id,
            {"archived_at": datetime.now(timezone.utc).isoformat()},
            not_found_message="Item not found"
        )
