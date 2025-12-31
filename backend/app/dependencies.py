from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

from app.config import settings

security = HTTPBearer()


def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def get_supabase_admin() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase)
) -> dict:
    """Verify JWT token and return user data."""
    try:
        token = credentials.credentials
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )

        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "token": token
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


def get_authenticated_supabase(user: dict = Depends(get_current_user)) -> Client:
    """Get Supabase client with user's JWT token for RLS."""
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    # Set the Authorization header on the postgrest client so RLS policies can identify the user
    # This allows auth.uid() in RLS policies to work correctly
    if hasattr(client.postgrest, 'headers'):
        client.postgrest.headers['Authorization'] = f"Bearer {user['token']}"
    elif hasattr(client.postgrest, 'session'):
        client.postgrest.session.headers['Authorization'] = f"Bearer {user['token']}"
    return client


async def ensure_profile_exists(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase)
) -> None:
    """Ensure user profile exists in database. Create if missing."""
    # Check if profile exists
    try:
        response = supabase.table("profiles") \
            .select("id") \
            .eq("id", user["id"]) \
            .execute()
        
        # Profile exists if we got any data back
        if response.data and len(response.data) > 0:
            return
    except Exception:
        # If check fails, try to create profile anyway
        pass
    
    # Create profile with default values
    try:
        supabase.table("profiles").insert({
            "id": user["id"],
            "email": user.get("email"),
            "display_name": None,
            "avatar_url": None,
            "timezone": "UTC",
            "daily_review_limit": 100,
            "new_items_per_day": 20,
            "default_ease_factor": 2.5
        }).execute()
    except Exception as e:
        # If insert fails, check the error type
        error_str = str(e).lower()
        
        # If it's a unique constraint violation, profile was created by another request
        if "23505" in str(e) or "unique" in error_str or "duplicate" in error_str:
            # Profile was created by another request, that's fine
            return
        
        # For other errors, verify if profile exists now (might have been created by trigger)
        try:
            response = supabase.table("profiles") \
                .select("id") \
                .eq("id", user["id"]) \
                .execute()
            if response.data and len(response.data) > 0:
                # Profile exists now, ignore the error
                return
        except Exception:
            pass
        
        # Profile still doesn't exist, re-raise the original error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user profile: {str(e)}"
        )
