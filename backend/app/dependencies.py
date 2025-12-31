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
