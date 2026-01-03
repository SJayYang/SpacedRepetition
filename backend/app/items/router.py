from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user, get_authenticated_supabase, ensure_profile_exists
from app.items.schemas import ItemCreate, ItemUpdate, ItemBulkCreate, ItemResponse
from app.services.items import ItemsService

router = APIRouter()


def get_items_service(
    user: dict = Depends(get_current_user),
    supabase = Depends(get_authenticated_supabase)
) -> ItemsService:
    """Dependency to get items service."""
    return ItemsService(supabase, user["id"])


@router.get("/")
async def list_items(
    collection_id: Optional[UUID] = None,
    archived: bool = False,
    limit: int = Query(default=100, le=500),
    service: ItemsService = Depends(get_items_service)
):
    """List items with optional filtering."""
    return await service.list(collection_id=collection_id, archived=archived, limit=limit)


@router.post("/", response_model=ItemResponse)
async def create_item(
    item: ItemCreate,
    service: ItemsService = Depends(get_items_service),
    _: None = Depends(ensure_profile_exists)
):
    """Create a new item."""
    return await service.create_with_scheduling({
        "collection_id": str(item.collection_id),
        "title": item.title,
        "external_id": item.external_id,
        "external_url": item.external_url,
        "metadata": item.metadata,
        "notes": item.notes,
    })


@router.post("/bulk")
async def bulk_create_items(
    bulk_items: ItemBulkCreate,
    service: ItemsService = Depends(get_items_service),
    _: None = Depends(ensure_profile_exists)
):
    """Bulk import items."""
    return await service.bulk_create(bulk_items.collection_id, bulk_items.items)


@router.get("/{item_id}")
async def get_item(
    item_id: UUID,
    service: ItemsService = Depends(get_items_service)
):
    """Get item details."""
    return await service.get(item_id, select="*, scheduling_states(*)", not_found_message="Item not found")


@router.patch("/{item_id}")
async def update_item(
    item_id: UUID,
    item: ItemUpdate,
    service: ItemsService = Depends(get_items_service)
):
    """Update item."""
    update_data = item.model_dump(exclude_unset=True)
    return await service.update(item_id, update_data, not_found_message="Item not found")


@router.delete("/{item_id}")
async def delete_item(
    item_id: UUID,
    archive: bool = Query(default=True),
    service: ItemsService = Depends(get_items_service)
):
    """Delete or archive item."""
    if archive:
        # Soft delete (archive)
        return await service.archive(item_id)
    else:
        # Hard delete
        return await service.delete(item_id, not_found_message="Item not found")
