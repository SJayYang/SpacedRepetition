from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from collections import defaultdict

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user, get_supabase
from app.reviews.scheduler import scheduler, SchedulingState
from app.reviews.schemas import ReviewCreate, ReviewResponse

router = APIRouter()


@router.get("/due")
async def get_due_items(
    limit: int = Query(default=50, le=100),
    collection_id: Optional[UUID] = None,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Get items due for review."""
    query = supabase.table("scheduling_states") \
        .select("*, items(*)") \
        .eq("user_id", user["id"]) \
        .lte("next_review_at", datetime.utcnow().isoformat()) \
        .order("next_review_at") \
        .limit(limit)

    if collection_id:
        query = query.eq("items.collection_id", str(collection_id))

    response = query.execute()
    return response.data


@router.post("/", response_model=ReviewResponse)
async def submit_review(
    review: ReviewCreate,
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Submit a review rating and update scheduling."""

    # Get current scheduling state
    state_response = supabase.table("scheduling_states") \
        .select("*") \
        .eq("item_id", str(review.item_id)) \
        .eq("user_id", user["id"]) \
        .single() \
        .execute()

    current_state = state_response.data

    # Calculate new scheduling
    state = SchedulingState(
        ease_factor=current_state["ease_factor"],
        interval_days=current_state["interval_days"],
        repetitions=current_state["repetitions"],
        status=current_state["status"],
        next_review_at=current_state["next_review_at"],
        last_review_at=current_state["last_review_at"]
    )

    result = scheduler.process_review(state, review.rating)

    # Record review
    review_record = supabase.table("reviews").insert({
        "item_id": str(review.item_id),
        "user_id": user["id"],
        "rating": review.rating,
        "ease_factor_before": float(current_state["ease_factor"]),
        "interval_before": current_state["interval_days"],
        "ease_factor_after": float(result.new_state.ease_factor),
        "interval_after": result.new_state.interval_days,
    }).execute()

    # Update scheduling state
    supabase.table("scheduling_states").update({
        "ease_factor": float(result.new_state.ease_factor),
        "interval_days": result.new_state.interval_days,
        "repetitions": result.new_state.repetitions,
        "status": result.new_state.status,
        "next_review_at": result.new_state.next_review_at.isoformat(),
        "last_review_at": result.new_state.last_review_at.isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }).eq("item_id", str(review.item_id)).eq("user_id", user["id"]).execute()

    return ReviewResponse(
        id=review_record.data[0]["id"],
        item_id=review.item_id,
        rating=review.rating,
        next_review_at=result.new_state.next_review_at,
        interval_days=result.new_state.interval_days
    )


@router.get("/forecast")
async def get_forecast(
    days: int = Query(default=30, le=90),
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Get forecast of upcoming reviews."""

    end_date = datetime.utcnow().replace(hour=23, minute=59, second=59)
    end_date = end_date + timedelta(days=days)

    response = supabase.table("scheduling_states") \
        .select("next_review_at") \
        .eq("user_id", user["id"]) \
        .lte("next_review_at", end_date.isoformat()) \
        .execute()

    # Group by date
    forecast = defaultdict(int)

    for item in response.data:
        date = item["next_review_at"][:10]  # Extract YYYY-MM-DD
        forecast[date] += 1

    return [{"date": k, "count": v} for k, v in sorted(forecast.items())]


@router.get("/history")
async def get_review_history(
    limit: int = Query(default=100, le=500),
    user: dict = Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    """Get review history."""
    response = supabase.table("reviews") \
        .select("*, items(title, metadata)") \
        .eq("user_id", user["id"]) \
        .order("reviewed_at", desc=True) \
        .limit(limit) \
        .execute()

    return response.data
