from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.dependencies import get_authenticated_supabase, get_current_user
from app.reviews.queries import active_scheduling_states

router = APIRouter()


def success_rate(successes: int, total: int) -> float:
    return round(successes / total * 100, 1) if total else 0


def count_rows(supabase: Client, table: str, user_id: str):
    return supabase.table(table).select("id", count="exact").eq("user_id", user_id).limit(1)


@router.get("/summary")
def get_summary(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase),
):
    now = datetime.now(timezone.utc)
    user_id = user["id"]
    due = (
        active_scheduling_states(supabase, user_id, "id", count="exact")
        .limit(1)
        .lte("next_review_at", now.isoformat())
        .execute()
    )
    overdue = (
        active_scheduling_states(supabase, user_id, "id", count="exact")
        .limit(1)
        .lte("next_review_at", (now - timedelta(days=1)).isoformat())
        .execute()
    )
    items = count_rows(supabase, "items", user_id).is_("archived_at", "null").execute()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    reviews_today = (
        count_rows(supabase, "reviews", user_id)
        .gte("reviewed_at", today.isoformat())
        .execute()
    )
    retention = (
        supabase.table("reviews")
        .select("rating")
        .eq("user_id", user_id)
        .gte("reviewed_at", (now - timedelta(days=30)).isoformat())
        .execute()
        .data
    )
    return {
        "due_count": due.count or 0,
        "overdue_count": overdue.count or 0,
        "total_items": items.count or 0,
        "reviews_today": reviews_today.count or 0,
        "streak": calculate_streak(user_id, supabase, now),
        "retention_rate": success_rate(sum(review["rating"] >= 3 for review in retention), len(retention)),
    }


@router.get("/retention")
def get_retention_rate(
    days: int = Query(default=30, le=365),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase),
):
    start = datetime.now(timezone.utc) - timedelta(days=days)
    reviews = (
        supabase.table("reviews")
        .select("rating, reviewed_at")
        .eq("user_id", user["id"])
        .gte("reviewed_at", start.isoformat())
        .order("reviewed_at")
        .execute()
        .data
    )
    ratings_by_day = defaultdict(list)
    for review in reviews:
        ratings_by_day[review["reviewed_at"][:10]].append(review["rating"])

    return [
        {"date": day, "rate": success_rate(sum(rating >= 3 for rating in ratings), len(ratings)), "total_reviews": len(ratings)}
        for day, ratings in sorted(ratings_by_day.items())
    ]


@router.get("/heatmap")
def get_heatmap(
    days: int = Query(default=365, le=365),
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase),
):
    start = datetime.now(timezone.utc) - timedelta(days=days)
    reviews = (
        supabase.table("reviews")
        .select("reviewed_at")
        .eq("user_id", user["id"])
        .gte("reviewed_at", start.isoformat())
        .execute()
        .data
    )
    counts = Counter(review["reviewed_at"][:10] for review in reviews)
    return [{"date": day, "count": count} for day, count in sorted(counts.items())]


@router.get("/topics")
def get_topics_performance(
    user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_supabase),
):
    reviews = (
        supabase.table("reviews")
        .select("rating, items(metadata)")
        .eq("user_id", user["id"])
        .execute()
        .data
    )
    ratings_by_topic = defaultdict(list)
    for review in reviews:
        item = review.get("items") or {}
        metadata = item.get("metadata") or {}
        for topic in metadata.get("topics") or []:
            ratings_by_topic[topic].append(review["rating"])

    return [
        {
            "topic": topic,
            "total_reviews": len(ratings),
            "success_rate": success_rate(sum(rating >= 3 for rating in ratings), len(ratings)),
        }
        for topic, ratings in sorted(ratings_by_topic.items(), key=lambda entry: len(entry[1]), reverse=True)
    ]


def calculate_streak(user_id: str, supabase: Client, now: datetime) -> int:
    start = now - timedelta(days=60)
    reviews = (
        supabase.table("reviews")
        .select("reviewed_at")
        .eq("user_id", user_id)
        .gte("reviewed_at", start.isoformat())
        .order("reviewed_at", desc=True)
        .execute()
        .data
    )
    days = {date.fromisoformat(review["reviewed_at"][:10]) for review in reviews}
    latest = max((day for day in days if day <= now.date()), default=None)
    if latest is None:
        return 0

    streak = 0
    while latest in days:
        streak += 1
        latest -= timedelta(days=1)
    return streak
