from fastapi import APIRouter, Depends

from app.dependencies import get_current_user, get_supabase

router = APIRouter()


@router.get("/me")
async def get_current_user_info(
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Get current user profile."""
    response = supabase.table("profiles") \
        .select("*") \
        .eq("id", user["id"]) \
        .single() \
        .execute()

    return response.data


@router.patch("/settings")
async def update_settings(
    settings: dict,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Update user settings."""
    response = supabase.table("profiles") \
        .update(settings) \
        .eq("id", user["id"]) \
        .execute()

    return response.data[0]
