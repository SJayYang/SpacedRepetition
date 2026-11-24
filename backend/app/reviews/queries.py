from typing import Literal

from supabase import Client


def active_scheduling_states(
    supabase: Client,
    user_id: str,
    columns: str,
    *,
    item_columns: str = "",
    count: Literal["exact"] | None = None,
):
    return (
        supabase.table("scheduling_states")
        .select(f"{columns}, items!inner({item_columns})", count=count)
        .eq("user_id", user_id)
        .is_("items.archived_at", "null")
    )
