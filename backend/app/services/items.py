from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from app.services.base import BaseService, Row
from app.services.collections import CollectionsService


class ItemsService(BaseService):
    table_name = "items"
    not_found_message = "Item not found"

    def list(
        self,
        collection_id: UUID | None = None,
        archived: bool = False,
        limit: int = 100,
    ) -> list[Row]:
        query = (
            self.table.select("*, scheduling_states(*)")
            .eq("user_id", self.user_id)
            .order("created_at", desc=True)
            .limit(limit)
        )
        if collection_id:
            query = query.eq("collection_id", str(collection_id))
        if not archived:
            query = query.is_("archived_at", "null")

        items = query.execute().data
        if not items:
            return items

        reviews = (
            self.supabase.table("reviews")
            .select("item_id, rating, reviewed_at")
            .eq("user_id", self.user_id)
            .in_("item_id", [item["id"] for item in items])
            .order("reviewed_at", desc=True)
            .execute()
            .data
        )
        recent_reviews = {}
        for review in reviews:
            recent_reviews.setdefault(review["item_id"], review)
        return [{**item, "recent_review": recent_reviews.get(item["id"])} for item in items]

    def create_with_scheduling(self, collection_id: UUID, data: Row) -> Row:
        return self._insert_items(collection_id, [data])[0]

    def bulk_create(self, collection_id: UUID, items: list[Row]) -> list[Row]:
        return self._insert_items(collection_id, items)

    def import_preset(self, collection_id: UUID, problems: list[Row]) -> list[Row]:
        return self._insert_items(collection_id, problems, skip_duplicates=True)

    def _insert_items(
        self,
        collection_id: UUID,
        items: list[Row],
        *,
        skip_duplicates: bool = False,
    ) -> list[Row]:
        CollectionsService(self.supabase, self.user_id).get(collection_id, select="id")
        if not items:
            return []

        rows = [
            {
                "user_id": self.user_id,
                "collection_id": str(collection_id),
                "title": item.get("title"),
                "external_id": item.get("external_id"),
                "external_url": item.get("external_url"),
                "metadata": item.get("metadata", {}),
                "notes": item.get("notes"),
            }
            for item in items
        ]
        if skip_duplicates:
            query = self.table.upsert(
                rows, on_conflict="user_id,collection_id,external_id", ignore_duplicates=True
            )
        else:
            query = self.table.insert(rows)
        created = query.execute().data
        if created:
            now = datetime.now(timezone.utc).isoformat()
            self.supabase.table("scheduling_states").insert([
                {
                    "item_id": item["id"],
                    "user_id": self.user_id,
                    "status": "new",
                    "next_review_at": now,
                }
                for item in created
            ]).execute()
        return created

    def archive(self, item_id: UUID) -> Row:
        return self.update(item_id, {"archived_at": datetime.now(timezone.utc).isoformat()})
