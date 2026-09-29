import time

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
    timestamp = int(time.time() * 1000)

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
        );
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                # Verifica se o usuário existe
                cur.execute(
                    """
                    SELECT 1
                    FROM users
                    WHERE user_id = %s;
                    """,
                    (user_id,)
                )

                if cur.fetchone() is None:
                    raise HTTPException(
                        status_code=404,
                        detail="Usuário não encontrado."
                    )

                # Verifica se o produto existe
                cur.execute(
                    """
                    SELECT 1
                    FROM products
                    WHERE parent_asin = %s;
                    """,
                    (request.parent_asin,)
                )

                if cur.fetchone() is None:
                    raise HTTPException(
                        status_code=404,
                        detail="Produto não encontrado."
                    )

                # Verifica se já existe avaliação
                cur.execute(
                    """
                    SELECT 1
                    FROM ratings
                    WHERE user_id = %s
                      AND parent_asin = %s;
                    """,
                    (
                        user_id,
                        request.parent_asin,
                    )
                )

                if cur.fetchone() is not None:
                    raise HTTPException(
                        status_code=409,
                        detail="Usuário já avaliou este produto."
                    )

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
            "message": "Avaliação criada.",
            "user_id": user_id,
            "parent_asin": request.parent_asin,
            "rating": request.rating,
            "timestamp": timestamp,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@router.put("/{user_id}/ratings/{parent_asin}")
def update_rating(
    user_id: str,
    parent_asin: str,
    request: RatingRequest
):
    timestamp = int(time.time() * 1000)

    query = """
        UPDATE ratings
        SET
            rating = %s,
            timestamp = %s
        WHERE user_id = %s
          AND parent_asin = %s;
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute(
                    """
                    SELECT 1
                    FROM users
                    WHERE user_id = %s;
                    """,
                    (user_id,)
                )

                if cur.fetchone() is None:
                    raise HTTPException(
                        status_code=404,
                        detail="Usuário não encontrado."
                    )

                cur.execute(
                    """
                    SELECT 1
                    FROM products
                    WHERE parent_asin = %s;
                    """,
                    (parent_asin,)
                )

                if cur.fetchone() is None:
                    raise HTTPException(
                        status_code=404,
                        detail="Produto não encontrado."
                    )

                cur.execute(
                    query,
                    (
                        request.rating,
                        timestamp,
                        user_id,
                        parent_asin,
                    )
                )

                if cur.rowcount == 0:
                    raise HTTPException(
                        status_code=404,
                        detail="Avaliação não encontrada."
                    )

            conn.commit()

        return {
            "message": "Avaliação atualizada.",
            "user_id": user_id,
            "parent_asin": parent_asin,
            "rating": request.rating,
            "timestamp": timestamp,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@router.delete("/{user_id}/ratings/{parent_asin}")
def delete_rating(
    user_id: str,
    parent_asin: str
):
    query = """
        DELETE FROM ratings
        WHERE user_id = %s
          AND parent_asin = %s;
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:

                cur.execute(
                    query,
                    (
                        user_id,
                        parent_asin,
                    )
                )

                if cur.rowcount == 0:
                    raise HTTPException(
                        status_code=404,
                        detail="Avaliação não encontrada."
                    )

            conn.commit()

        return {
            "message": "Avaliação excluída.",
            "user_id": user_id,
            "parent_asin": parent_asin,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )