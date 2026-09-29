from app.db.connection import get_connection


def buscar_historico_usuario(user_id: str):
    query = """
        SELECT
            r.parent_asin,
            r.rating,
            r.timestamp,
            p.title,
            p.description,
            p.price,
            p.image_url
        FROM ratings r
        LEFT JOIN products p
            ON p.parent_asin = r.parent_asin
        WHERE r.user_id = %s
        ORDER BY r.timestamp;
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
            "product": {
                "title": row[3],
                "description": row[4],
                "price": float(row[5]) if row[5] is not None else None,
                "image_url": row[6],
            }
        }
        for row in rows
    ]


def buscar_produtos_usuario(user_id: str):
    query = """
        SELECT parent_asin, rating
        FROM ratings
        WHERE user_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id,))
            rows = cur.fetchall()

    return {
        row[0]: float(row[1])
        for row in rows
    }


def buscar_usuarios_candidatos(
    user_id: str,
    min_common_items: int = 3
):
    query = """
        SELECT
            r.user_id,
            COUNT(*) AS common_items
        FROM ratings r
        WHERE r.parent_asin IN (
            SELECT parent_asin
            FROM ratings
            WHERE user_id = %s
        )
        AND r.user_id <> %s
        GROUP BY r.user_id
        HAVING COUNT(*) >= %s
        ORDER BY common_items DESC;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                query,
                (user_id, user_id, min_common_items)
            )
            rows = cur.fetchall()

    return [
        {
            "user_id": row[0],
            "common_items": row[1],
        }
        for row in rows
    ]


def buscar_ratings_em_comum(
    user_id: str,
    candidate_id: str
):
    query = """
        SELECT
            r1.parent_asin,
            r1.rating,
            r2.rating
        FROM ratings r1
        INNER JOIN ratings r2
            ON r1.parent_asin = r2.parent_asin
        WHERE r1.user_id = %s
          AND r2.user_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                query,
                (user_id, candidate_id)
            )
            rows = cur.fetchall()

    return [
        {
            "parent_asin": row[0],
            "user_rating": float(row[1]),
            "candidate_rating": float(row[2]),
        }
        for row in rows
    ]

def buscar_ratings_comuns_dos_candidatos(
    user_id: str,
    min_common_items: int = 3
):
    query = """
        WITH target AS (
            SELECT
                parent_asin,
                rating
            FROM ratings
            WHERE user_id = %s
        ),
        candidates AS (
            SELECT
                r.user_id,
                COUNT(*) AS common_items
            FROM ratings r
            INNER JOIN target t
                ON t.parent_asin = r.parent_asin
            WHERE r.user_id <> %s
            GROUP BY r.user_id
            HAVING COUNT(*) >= %s
        )
        SELECT
            r.user_id,
            r.parent_asin,
            t.rating AS user_rating,
            r.rating AS candidate_rating
        FROM ratings r
        INNER JOIN target t
            ON t.parent_asin = r.parent_asin
        INNER JOIN candidates c
            ON c.user_id = r.user_id
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

def buscar_usuarios():
    query = """
        SELECT user_id
        FROM users
        ORDER BY user_id
        LIMIT 1000;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

    return [
        row[0]
        for row in rows
    ]

def buscar_produto(parent_asin: str):
    query = """
        SELECT
            parent_asin,
            title,
            description,
            price,
            image_url
        FROM products
        WHERE parent_asin = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (parent_asin,))
            row = cur.fetchone()

    if not row:
        return None

    return {
        "parent_asin": row[0],
        "title": row[1],
        "description": row[2],
        "price": float(row[3]) if row[3] is not None else None,
        "image_url": row[4],
    }


def criar_usuario(user_id: str):
    query = """
        INSERT INTO users (user_id)
        VALUES (%s);
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id,))

        conn.commit()


def usuario_existe(user_id: str):
    query = """
        SELECT EXISTS (
            SELECT 1
            FROM users
            WHERE user_id = %s
        );
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (user_id,))
            row = cur.fetchone()

    return row[0]