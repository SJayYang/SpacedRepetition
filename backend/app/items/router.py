from datetime import datetime
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_current_user, get_authenticated_supabase, ensure_profile_exists
from app.items.schemas import ItemCreate, ItemUpdate, ItemBulkCreate, ItemResponse

router = APIRouter()


@router.get("/")
async def list_items(
    collection_id: Optional[UUID] = None,
    archived: bool = False,
    limit: int = Query(default=100, le=500),
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase)
):
    """List items with optional filtering."""
    query = supabase.table("items").select("*, scheduling_states(*)") \
        .eq("user_id", user["id"]) \
        .order("created_at", desc=True) \
        .limit(limit)

    if collection_id:
        query = query.eq("collection_id", str(collection_id))

    if not archived:
        query = query.is_("archived_at", "null")

    response = query.execute()
    return response.data


@router.post("/", response_model=ItemResponse)
async def create_item(
    item: ItemCreate,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase),
    _: None = Depends(ensure_profile_exists)
):
    """Create a new item."""
    # Create item
    item_response = supabase.table("items").insert({
        "user_id": user["id"],
        "collection_id": str(item.collection_id),
        "title": item.title,
        "external_id": item.external_id,
        "external_url": item.external_url,
        "metadata": item.metadata,
        "notes": item.notes,
    }).execute()

    created_item = item_response.data[0]

    # Create scheduling state for the new item
    supabase.table("scheduling_states").insert({
        "item_id": created_item["id"],
        "user_id": user["id"],
        "status": "new",
        "next_review_at": datetime.utcnow().isoformat(),
    }).execute()

    return created_item


@router.post("/bulk")
async def bulk_create_items(
    bulk_items: ItemBulkCreate,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase),
    _: None = Depends(ensure_profile_exists)
):
    """Bulk import items."""
    items_to_insert = []
    for item_data in bulk_items.items:
        items_to_insert.append({
            "user_id": user["id"],
            "collection_id": str(bulk_items.collection_id),
            "title": item_data.get("title"),
            "external_id": item_data.get("external_id"),
            "external_url": item_data.get("external_url"),
            "metadata": item_data.get("metadata", {}),
            "notes": item_data.get("notes"),
        })

    # Insert items
    items_response = supabase.table("items").insert(items_to_insert).execute()

    # Create scheduling states
    scheduling_states = []
    for item in items_response.data:
        scheduling_states.append({
            "item_id": item["id"],
            "user_id": user["id"],
            "status": "new",
            "next_review_at": datetime.utcnow().isoformat(),
        })

    supabase.table("scheduling_states").insert(scheduling_states).execute()

    return {"message": f"Created {len(items_response.data)} items", "items": items_response.data}


@router.get("/{item_id}")
async def get_item(
    item_id: UUID,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase)
):
    """Get item details."""
    response = supabase.table("items") \
        .select("*, scheduling_states(*)") \
        .eq("id", str(item_id)) \
        .eq("user_id", user["id"]) \
        .single() \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")

    return response.data


@router.patch("/{item_id}")
async def update_item(
    item_id: UUID,
    item: ItemUpdate,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase)
):
    """Update item."""
    update_data = item.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()

    response = supabase.table("items").update(update_data) \
        .eq("id", str(item_id)) \
        .eq("user_id", user["id"]) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")

    return response.data[0]


@router.delete("/{item_id}")
async def delete_item(
    item_id: UUID,
    archive: bool = Query(default=True),
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase)
):
    """Delete or archive item."""
    if archive:
        # Soft delete (archive)
        response = supabase.table("items").update({
            "archived_at": datetime.utcnow().isoformat()
        }).eq("id", str(item_id)).eq("user_id", user["id"]).execute()
    else:
        # Hard delete
        response = supabase.table("items").delete() \
            .eq("id", str(item_id)) \
            .eq("user_id", user["id"]) \
            .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Item not found")

    return {"message": "Item archived" if archive else "Item deleted"}
