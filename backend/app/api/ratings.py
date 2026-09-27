from fastapi import APIRouter, HTTPException

from app.db.connection import get_connection
from app.models.schemas import RatingRequest

router = APIRouter(
    prefix="/users",
    tags=["Ratings"]
)


@router.post("/{user_id}/ratings")
def create_rating(
    user_id: str,
    request: RatingRequest
):
    query = """
        INSERT INTO ratings (
            user_id,
            parent_asin,
            rating,
            timestamp
        )
        VALUES (
            %s,
            %s,
            %s,
            %s
        )
        ON CONFLICT (user_id, parent_asin)
        DO UPDATE SET
            rating = EXCLUDED.rating,
            timestamp = EXCLUDED.timestamp;
    """

    import time
    timestamp = int(time.time() * 1000)

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    query,
                    (
                        user_id,
                        request.parent_asin,
                        request.rating,
                        timestamp,
                    )
                )

            conn.commit()

        return {
            "message": "Avaliação registrada.",
            "user_id": user_id,
            "parent_asin": request.parent_asin,
            "rating": request.rating,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )