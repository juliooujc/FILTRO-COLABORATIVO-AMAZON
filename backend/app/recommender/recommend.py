from collections import defaultdict

from app.db.connection import get_connection
from app.db.queries import (
    buscar_produtos_usuario,
    buscar_produto,
)
from app.recommender.knn import encontrar_vizinhos


def buscar_ratings_dos_vizinhos(neighbor_ids: list[str]):
    if not neighbor_ids:
        return []

    placeholders = ", ".join(["%s"] * len(neighbor_ids))

    query = f"""
        SELECT
            user_id,
            parent_asin,
            rating
        FROM ratings
        WHERE user_id IN ({placeholders});
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, neighbor_ids)
            rows = cur.fetchall()

    return [
        {
            "user_id": row[0],
            "parent_asin": row[1],
            "rating": float(row[2]),
        }
        for row in rows
    ]


def gerar_recomendacoes(
    user_id: str,
    method: str = "cosine",
    k: int = 5,
    limit: int = 10,
    min_common_items: int = 3,
):
    user_products = buscar_produtos_usuario(user_id)

    # Usuário sem histórico
    if not user_products:
        return {
            "cold_start": True,
            "neighbors": [],
            "recommendations": gerar_recomendacoes_populares(limit),
        }

    neighbors = encontrar_vizinhos(
        user_id=user_id,
        method=method,
        k=k,
        min_common_items=min_common_items,
    )

    if not neighbors:
        return {
            "cold_start": False,
            "neighbors": [],
            "recommendations": [],
        }

    neighbor_similarity = {
        n["user_id"]: n["similarity"]
        for n in neighbors
    }

    neighbor_ids = list(neighbor_similarity.keys())

    ratings = buscar_ratings_dos_vizinhos(
        neighbor_ids
    )

    scores = defaultdict(float)
    similarity_totals = defaultdict(float)

    for item in ratings:

        product_id = item["parent_asin"]
        neighbor_id = item["user_id"]
        rating = item["rating"]

        # Não recomendar produtos que o usuário já avaliou.
        if product_id in user_products:
            continue

        similarity = neighbor_similarity[neighbor_id]

        # Todas as avaliações do vizinho participam
        # do cálculo da previsão.
        scores[product_id] += similarity * rating
        similarity_totals[product_id] += abs(similarity)

    recommendations = []

    for product_id, score in scores.items():

        denominator = similarity_totals[product_id]

        if denominator == 0:
            continue

        predicted_rating = score / denominator

        recommendations.append({
            "parent_asin": product_id,
            "score": round(predicted_rating, 2),
        })

    recommendations.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    # Adiciona os dados dos produtos às recomendações.
    recommendations_with_products = []

    for recommendation in recommendations[:limit]:

        product = buscar_produto(
            recommendation["parent_asin"]
        )

        recommendations_with_products.append({
            **recommendation,
            "product": product
        })

    return {
        "cold_start": False,
        "neighbors": neighbors,
        "recommendations": recommendations_with_products,
    }


def gerar_recomendacoes_populares(limit: int = 10):
    query = """
        SELECT
            parent_asin,
            COUNT(*) AS total_ratings,
            AVG(rating) AS average_rating
        FROM ratings
        GROUP BY parent_asin
        HAVING COUNT(*) >= 20
        ORDER BY average_rating DESC, total_ratings DESC
        LIMIT %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (limit,))
            rows = cur.fetchall()

    return [
        {
            "parent_asin": row[0],
            "score": round(float(row[2]), 2),
            "total_ratings": row[1],
        }
        for row in rows
    ]