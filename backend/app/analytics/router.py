from datetime import datetime, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user, get_authenticated_supabase

router = APIRouter()


@router.get("/summary")
async def get_summary(
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase)
):
    """Get dashboard summary statistics."""

    # Due items count
    due_response = supabase.table("scheduling_states") \
        .select("id", count="exact") \
        .eq("user_id", user["id"]) \
        .lte("next_review_at", datetime.utcnow().isoformat()) \
        .execute()

    # Overdue items (more than 1 day overdue)
    yesterday = datetime.utcnow() - timedelta(days=1)
    overdue_response = supabase.table("scheduling_states") \
        .select("id", count="exact") \
        .eq("user_id", user["id"]) \
        .lte("next_review_at", yesterday.isoformat()) \
        .execute()

    # Total items
    total_items_response = supabase.table("items") \
        .select("id", count="exact") \
        .eq("user_id", user["id"]) \
        .is_("archived_at", "null") \
        .execute()

    # Reviews completed today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_reviews_response = supabase.table("reviews") \
        .select("id", count="exact") \
        .eq("user_id", user["id"]) \
        .gte("reviewed_at", today_start.isoformat()) \
        .execute()

    # Calculate streak
    streak = await calculate_streak(user["id"], supabase)

    # Retention rate (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    retention_response = supabase.table("reviews") \
        .select("rating") \
        .eq("user_id", user["id"]) \
        .gte("reviewed_at", thirty_days_ago.isoformat()) \
        .execute()

    retention_rate = 0
    if retention_response.data:
        successful_reviews = sum(1 for r in retention_response.data if r["rating"] >= 3)
        retention_rate = round(successful_reviews / len(retention_response.data) * 100, 1)

    return {
        "due_count": due_response.count or 0,
        "overdue_count": overdue_response.count or 0,
        "total_items": total_items_response.count or 0,
        "reviews_today": today_reviews_response.count or 0,
        "streak": streak,
        "retention_rate": retention_rate,
    }


@router.get("/retention")
async def get_retention_rate(
    days: int = Query(default=30, le=365),
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase)
):
    """Get retention rate over time."""
    start_date = datetime.utcnow() - timedelta(days=days)

    response = supabase.table("reviews") \
        .select("rating, reviewed_at") \
        .eq("user_id", user["id"]) \
        .gte("reviewed_at", start_date.isoformat()) \
        .order("reviewed_at") \
        .execute()

    # Group by date
    by_date = defaultdict(lambda: {"total": 0, "successful": 0})

    for review in response.data:
        date = review["reviewed_at"][:10]
        by_date[date]["total"] += 1
        if review["rating"] >= 3:
            by_date[date]["successful"] += 1

    # Calculate retention rate per day
    result = []
    for date, counts in sorted(by_date.items()):
        rate = round(counts["successful"] / counts["total"] * 100, 1) if counts["total"] > 0 else 0
        result.append({
            "date": date,
            "rate": rate,
            "total_reviews": counts["total"]
        })

    return result


@router.get("/heatmap")
async def get_heatmap(
    days: int = Query(default=365, le=365),
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase)
):
    """Get activity heatmap data (GitHub-style)."""
    start_date = datetime.utcnow() - timedelta(days=days)

    response = supabase.table("reviews") \
        .select("reviewed_at") \
        .eq("user_id", user["id"]) \
        .gte("reviewed_at", start_date.isoformat()) \
        .execute()

    # Count reviews per day
    by_date = defaultdict(int)
    for review in response.data:
        date = review["reviewed_at"][:10]
        by_date[date] += 1

    return [{"date": k, "count": v} for k, v in sorted(by_date.items())]


@router.get("/topics")
async def get_topics_performance(
    user: dict = Depends(get_current_user),
    supabase=Depends(get_authenticated_supabase)
):
    """Get performance breakdown by topic."""
    # Get all reviews with item metadata
    response = supabase.table("reviews") \
        .select("rating, items(metadata)") \
        .eq("user_id", user["id"]) \
        .execute()

    # Aggregate by topic
    by_topic = defaultdict(lambda: {"total": 0, "successful": 0})

    for review in response.data:
        if review.get("items") and review["items"].get("metadata"):
            topics = review["items"]["metadata"].get("topics", [])
            for topic in topics:
                by_topic[topic]["total"] += 1
                if review["rating"] >= 3:
                    by_topic[topic]["successful"] += 1

    # Calculate success rate per topic
    result = []
    for topic, counts in by_topic.items():
        success_rate = round(counts["successful"] / counts["total"] * 100, 1) if counts["total"] > 0 else 0
        result.append({
            "topic": topic,
            "total_reviews": counts["total"],
            "success_rate": success_rate
        })

    return sorted(result, key=lambda x: x["total_reviews"], reverse=True)


async def calculate_streak(user_id: str, supabase) -> int:
    """Calculate current review streak in days."""
    # Get reviews from last 60 days
    start_date = datetime.utcnow() - timedelta(days=60)

    response = supabase.table("reviews") \
        .select("reviewed_at") \
        .eq("user_id", user_id) \
        .gte("reviewed_at", start_date.isoformat()) \
        .order("reviewed_at", desc=True) \
        .execute()

    if not response.data:
        return 0

    # Extract unique dates
    dates_with_reviews = set()
    for review in response.data:
        date = review["reviewed_at"][:10]
        dates_with_reviews.add(date)

    # Count consecutive days from today
    streak = 0
    current_date = datetime.utcnow().date()

    while True:
        if current_date.isoformat() in dates_with_reviews:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            # Allow one day gap (grace period)
            if streak == 0:
                current_date -= timedelta(days=1)
                if current_date < start_date.date():
                    break
            else:
                break

    return streak
