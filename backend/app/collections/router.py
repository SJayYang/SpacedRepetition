from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user, get_supabase
from app.collections.schemas import CollectionCreate, CollectionUpdate, CollectionResponse

router = APIRouter()


@router.get("/")
async def list_collections(
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """List user's collections."""
    response = supabase.table("collections") \
        .select("*") \
        .eq("user_id", user["id"]) \
        .order("created_at") \
        .execute()

    return response.data


@router.post("/", response_model=CollectionResponse)
async def create_collection(
    collection: CollectionCreate,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Create a new collection."""
    response = supabase.table("collections").insert({
        "user_id": user["id"],
        "name": collection.name,
        "description": collection.description,
        "item_type": collection.item_type,
        "is_default": collection.is_default,
    }).execute()

    return response.data[0]


@router.get("/{collection_id}")
async def get_collection(
    collection_id: UUID,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Get collection details."""
    response = supabase.table("collections") \
        .select("*") \
        .eq("id", str(collection_id)) \
        .eq("user_id", user["id"]) \
        .single() \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    return response.data


@router.patch("/{collection_id}")
async def update_collection(
    collection_id: UUID,
    collection: CollectionUpdate,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Update collection."""
    update_data = collection.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow().isoformat()

    response = supabase.table("collections").update(update_data) \
        .eq("id", str(collection_id)) \
        .eq("user_id", user["id"]) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    return response.data[0]


@router.delete("/{collection_id}")
async def delete_collection(
    collection_id: UUID,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Delete collection."""
    response = supabase.table("collections").delete() \
        .eq("id", str(collection_id)) \
        .eq("user_id", user["id"]) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Collection not found")

    return {"message": "Collection deleted successfully"}
