from uuid import UUID

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_authenticated_supabase, ensure_profile_exists
from app.collections.schemas import CollectionCreate, CollectionUpdate, CollectionResponse
from app.services.collections import CollectionsService

router = APIRouter()


def get_collections_service(
    user: dict = Depends(get_current_user),
    supabase = Depends(get_authenticated_supabase)
) -> CollectionsService:
    """Dependency to get collections service."""
    return CollectionsService(supabase, user["id"])


@router.get("/")
def list_collections(
    service: CollectionsService = Depends(get_collections_service)
):
    """List user's collections."""
    return service.list()


@router.post("/", response_model=CollectionResponse)
def create_collection(
    collection: CollectionCreate,
    service: CollectionsService = Depends(get_collections_service),
    _: None = Depends(ensure_profile_exists)
):
    """Create a new collection."""
    return service.create(collection.model_dump())


@router.get("/{collection_id}")
def get_collection(
    collection_id: UUID,
    service: CollectionsService = Depends(get_collections_service)
):
    """Get collection details."""
    return service.get(collection_id)


@router.patch("/{collection_id}")
def update_collection(
    collection_id: UUID,
    collection: CollectionUpdate,
    service: CollectionsService = Depends(get_collections_service)
):
    """Update collection."""
    update_data = collection.model_dump(exclude_unset=True)
    return service.update(collection_id, update_data)


@router.delete("/{collection_id}")
def delete_collection(
    collection_id: UUID,
    service: CollectionsService = Depends(get_collections_service)
):
    """Delete collection."""
    return service.delete(collection_id)
