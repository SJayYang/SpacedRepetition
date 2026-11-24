from collections import Counter
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.dependencies import ensure_profile_exists, get_authenticated_supabase, get_current_user
from app.reviews.queries import active_scheduling_states
from app.reviews.scheduler import SchedulingState, scheduler
from app.reviews.schemas import ReviewCreate, ReviewResponse

router = APIRouter()


@router.get("/due")
def get_due_items(
    limit: int = Query(default=50, le=100),
    collection_id: UUID | None = None,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase),
):
    """Get items due for review."""
    query = (
        active_scheduling_states(supabase, user["id"], "*", item_columns="*")
        .lte("next_review_at", datetime.now(timezone.utc).isoformat())
        .order("next_review_at")
        .limit(limit)
    )

    if collection_id:
        query = query.eq("items.collection_id", str(collection_id))

    response = query.execute()
    return response.data


@router.post("/", response_model=ReviewResponse)
async def submit_review(
    review: ReviewCreate,
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase),
    _: None = Depends(ensure_profile_exists),
):
    """Submit a review rating and update scheduling."""

    item_id = str(review.item_id)
    user_id = user["id"]
    states = (
        supabase.table("scheduling_states")
        .select("*")
        .eq("item_id", item_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
        .data
    )
    if not states:
        raise HTTPException(status_code=404, detail="Scheduling state not found")

    state = SchedulingState.model_validate(states[0])
    new_state = scheduler.process_review(state, review.rating).new_state

    # Record review
    review_record = supabase.table("reviews").insert({
        "item_id": item_id,
        "user_id": user_id,
        "rating": review.rating,
        "ease_factor_before": float(state.ease_factor),
        "interval_before": state.interval_days,
        "ease_factor_after": float(new_state.ease_factor),
        "interval_after": new_state.interval_days,
    }).execute()

    # Update scheduling state
    supabase.table("scheduling_states").update({
        "ease_factor": float(new_state.ease_factor),
        "interval_days": new_state.interval_days,
        "repetitions": new_state.repetitions,
        "status": new_state.status,
        "next_review_at": new_state.next_review_at.isoformat(),
        "last_review_at": new_state.last_review_at.isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("item_id", item_id).eq("user_id", user_id).execute()

    return ReviewResponse(
        id=review_record.data[0]["id"],
        item_id=review.item_id,
        rating=review.rating,
        next_review_at=new_state.next_review_at,
        interval_days=new_state.interval_days
    )


@router.get("/forecast")
def get_forecast(
    days: int = Query(default=30, le=90),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase),
):
    """Get forecast of upcoming reviews."""

    end_date = datetime.now(timezone.utc).replace(hour=23, minute=59, second=59)
    end_date = end_date + timedelta(days=days)

    response = (
        active_scheduling_states(supabase, user["id"], "next_review_at")
        .lte("next_review_at", end_date.isoformat())
        .execute()
    )

    forecast = Counter(item["next_review_at"][:10] for item in response.data)
    return [{"date": day, "count": count} for day, count in sorted(forecast.items())]


@router.get("/history")
def get_review_history(
    limit: int = Query(default=100, le=500),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase),
):
    """Get review history."""
    response = supabase.table("reviews") \
        .select("*, items(title, metadata)") \
        .eq("user_id", user["id"]) \
        .order("reviewed_at", desc=True) \
        .limit(limit) \
        .execute()

    return response.data
