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
def list_items(
    collection_id: Optional[UUID] = None,
    archived: bool = False,
    limit: int = Query(default=100, le=500),
    service: ItemsService = Depends(get_items_service)
):
    """List items with optional filtering."""
    return service.list(collection_id=collection_id, archived=archived, limit=limit)


@router.post("/", response_model=ItemResponse)
def create_item(
    item: ItemCreate,
    service: ItemsService = Depends(get_items_service),
    _: None = Depends(ensure_profile_exists)
):
    """Create a new item."""
    return service.create_with_scheduling(item.collection_id, item.model_dump(exclude={"collection_id"}))


@router.post("/bulk")
def bulk_create_items(
    bulk_items: ItemBulkCreate,
    service: ItemsService = Depends(get_items_service),
    _: None = Depends(ensure_profile_exists)
):
    """Bulk import items."""
    items = service.bulk_create(bulk_items.collection_id, bulk_items.items)
    return {"message": f"Created {len(items)} items", "items": items}


@router.get("/{item_id}")
def get_item(
    item_id: UUID,
    service: ItemsService = Depends(get_items_service)
):
    """Get item details."""
    return service.get(item_id, select="*, scheduling_states(*)")


@router.patch("/{item_id}")
def update_item(
    item_id: UUID,
    item: ItemUpdate,
    service: ItemsService = Depends(get_items_service)
):
    """Update item."""
    update_data = item.model_dump(exclude_unset=True)
    return service.update(item_id, update_data)


@router.delete("/{item_id}")
def delete_item(
    item_id: UUID,
    archive: bool = Query(default=True),
    service: ItemsService = Depends(get_items_service)
):
    """Delete or archive item."""
    if archive:
        return service.archive(item_id)
    return service.delete(item_id)
