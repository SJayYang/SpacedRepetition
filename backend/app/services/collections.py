from app.services.base import BaseService, Row


class CollectionsService(BaseService):
    table_name = "collections"
    not_found_message = "Collection not found"

    def list(self) -> list[Row]:
        return (
            self.table.select("*")
            .eq("user_id", self.user_id)
            .order("created_at")
            .execute()
            .data
        )
