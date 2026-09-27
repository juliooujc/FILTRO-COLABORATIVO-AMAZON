from app.db.connection import get_connection


def buscar_train_usuario(user_id: str):
    query = """
        SELECT
            parent_asin,
            rating,
            timestamp
        FROM evaluation_ratings
        WHERE user_id = %s
          AND conjunto = 'train'
        ORDER BY timestamp;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id,))
            rows = cur.fetchall()

    return [
        {
            "parent_asin": row[0],
            "rating": float(row[1]),
            "timestamp": row[2],
        }
        for row in rows
    ]


def buscar_test_usuario(user_id: str):
    query = """
        SELECT
            parent_asin,
            rating,
            timestamp
        FROM evaluation_ratings
        WHERE user_id = %s
          AND conjunto = 'test'
        ORDER BY timestamp;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id,))
            rows = cur.fetchall()

    return [
        {
            "parent_asin": row[0],
            "rating": float(row[1]),
            "timestamp": row[2],
        }
        for row in rows
    ]


def buscar_produtos_train_usuario(user_id: str):
    query = """
        SELECT
            parent_asin,
            rating
        FROM evaluation_ratings
        WHERE user_id = %s
          AND conjunto = 'train';
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id,))
            rows = cur.fetchall()

    return {
        row[0]: float(row[1])
        for row in rows
    }


def buscar_ratings_comuns_train(
    user_id: str,
    min_common_items: int = 3
):
    query = """
        WITH target AS (
            SELECT
                parent_asin,
                rating
            FROM evaluation_ratings
            WHERE user_id = %s
              AND conjunto = 'train'
        ),
        candidates AS (
            SELECT
                r.user_id,
                COUNT(*) AS common_items
            FROM evaluation_ratings r
            INNER JOIN target t
                ON t.parent_asin = r.parent_asin
            WHERE r.user_id <> %s
              AND r.conjunto = 'train'
            GROUP BY r.user_id
            HAVING COUNT(*) >= %s
        )
        SELECT
            r.user_id,
            r.parent_asin,
            t.rating AS user_rating,
            r.rating AS candidate_rating
        FROM evaluation_ratings r
        INNER JOIN target t
            ON t.parent_asin = r.parent_asin
        INNER JOIN candidates c
            ON c.user_id = r.user_id
        WHERE r.conjunto = 'train'
        ORDER BY r.user_id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                query,
                (
                    user_id,
                    user_id,
                    min_common_items,
                )
            )
            rows = cur.fetchall()

    return [
        {
            "user_id": row[0],
            "parent_asin": row[1],
            "user_rating": float(row[2]),
            "candidate_rating": float(row[3]),
        }
        for row in rows
    ]