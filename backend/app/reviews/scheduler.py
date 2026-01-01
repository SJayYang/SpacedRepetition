from datetime import datetime, timedelta
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


Rating = Literal[1, 2, 3, 4]
Status = Literal["new", "learning", "review"]


class SchedulingState(BaseModel):
    ease_factor: Decimal = Decimal("2.5")
    interval_days: int = 0
    repetitions: int = 0
    status: Status = "new"
    next_review_at: datetime = datetime.utcnow()
    last_review_at: datetime | None = None


class ReviewResult(BaseModel):
    new_state: SchedulingState
    next_review_at: datetime


class SM2Scheduler:
    """SM-2 Spaced Repetition Algorithm implementation."""

    MIN_EASE_FACTOR = Decimal("1.3")

    # Map 1-4 rating to SM-2's 0-5 quality scale
    RATING_MAP = {
        1: 0,  # Forgot
        2: 2,  # Hard
        3: 4,  # Good
        4: 5,  # Easy
    }

    def process_review(
        self,
        current_state: SchedulingState,
        rating: Rating
    ) -> ReviewResult:
        """Process a review and calculate next scheduling state."""

        q = self.RATING_MAP[rating]

        ease_factor = current_state.ease_factor
        interval_days = current_state.interval_days
        repetitions = current_state.repetitions

        # Check if this is a premature review (reviewed before it was due)
        # If reviewed early, we should be more conservative with intervals
        now = datetime.utcnow()
        is_early_review = False
        if current_state.last_review_at:
            time_since_last = (now - current_state.last_review_at).days
            # If reviewed within the same interval period, consider it early
            if time_since_last < interval_days:
                is_early_review = True

        # Update ease factor
        ease_factor = ease_factor + Decimal(str(
            0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
        ))
        ease_factor = max(self.MIN_EASE_FACTOR, ease_factor)

        # Calculate new interval
        if q < 3:
            # Failed - reset
            repetitions = 0
            interval_days = 1
        else:
            # Success
            repetitions += 1

            if repetitions == 1:
                interval_days = 1
            elif repetitions == 2:
                interval_days = 6
            else:
                interval_days = round(interval_days * float(ease_factor))

            # If this was an early review, adjust the interval based on rating
            if is_early_review:
                if rating == 3:  # Good - but reviewed early
                    # Reset to short interval since it's still being learned
                    interval_days = 1 if repetitions <= 2 else 3
                elif rating == 4:  # Easy - even though reviewed early
                    # Still comfortable, but don't extend too much
                    interval_days = max(3, min(interval_days, 7))

        next_review_at = datetime.utcnow() + timedelta(days=interval_days)
        status = self._determine_status(repetitions, interval_days)

        new_state = SchedulingState(
            ease_factor=ease_factor,
            interval_days=interval_days,
            repetitions=repetitions,
            status=status,
            next_review_at=next_review_at,
            last_review_at=datetime.utcnow()
        )

        return ReviewResult(
            new_state=new_state,
            next_review_at=next_review_at
        )

    def _determine_status(self, repetitions: int, interval_days: int) -> Status:
        if repetitions == 0:
            return "new"
        elif interval_days < 21:
            return "learning"
        return "review"


scheduler = SM2Scheduler()
