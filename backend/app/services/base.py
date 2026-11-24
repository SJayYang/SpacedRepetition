from datetime import datetime, timezone
from typing import Any, ClassVar
from uuid import UUID

from fastapi import HTTPException
from supabase import Client

Row = dict[str, Any]


class BaseService:
    table_name: ClassVar[str]
    not_found_message: ClassVar[str]

    def __init__(self, supabase: Client, user_id: str):
        self.supabase = supabase
        self.user_id = user_id

    @property
    def table(self):
        return self.supabase.table(self.table_name)

    def get(self, item_id: UUID, select: str = "*") -> Row:
        response = (
            self.table.select(select)
            .eq("id", str(item_id))
            .eq("user_id", self.user_id)
            .limit(1)
            .execute()
        )
        return self._first_row(response.data)

    def create(self, data: Row) -> Row:
        return self.table.insert({**data, "user_id": self.user_id}).execute().data[0]

    def update(self, item_id: UUID, data: Row) -> Row:
        response = (
            self.table.update({**data, "updated_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", str(item_id))
            .eq("user_id", self.user_id)
            .execute()
        )
        return self._first_row(response.data)

    def delete(self, item_id: UUID) -> dict[str, str]:
        response = (
            self.table.delete()
            .eq("id", str(item_id))
            .eq("user_id", self.user_id)
            .execute()
        )
        self._first_row(response.data)
        return {"message": f"{self.table_name.capitalize()} deleted successfully"}

    def _first_row(self, rows: list[Row]) -> Row:
        if not rows:
            raise HTTPException(status_code=404, detail=self.not_found_message)
        return rows[0]
