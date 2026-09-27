from collections import defaultdict

from app.db.connection import get_connection
from app.recommender.cosine import cosine_similarity
from app.recommender.pearson import pearson_similarity
from app.evaluation.evaluator import (
    buscar_produtos_train_usuario,
    buscar_ratings_comuns_train_base_completa,
    buscar_timestamp_corte_train,
)


def encontrar_vizinhos_avaliacao(
    user_id: str,
    method: str = "cosine",
    k: int = 5,
    min_common_items: int = 3,
):
    if method not in ("cosine", "pearson"):
        raise ValueError(
            "Método deve ser 'cosine' ou 'pearson'."
        )

    if k <= 0:
        raise ValueError(
            "K deve ser maior que zero."
        )

    if k % 2 == 0:
        raise ValueError(
            "K deve ser um número ímpar."
        )

    common_ratings = buscar_ratings_comuns_train_base_completa(
        user_id=user_id,
        min_common_items=min_common_items,
    )

    ratings_por_usuario = defaultdict(list)

    for item in common_ratings:
        ratings_por_usuario[item["user_id"]].append(item)

    neighbors = []

    for candidate_id, ratings in ratings_por_usuario.items():

        if len(ratings) < min_common_items:
            continue

        user_ratings = [
            item["user_rating"]
            for item in ratings
        ]

        candidate_ratings = [
            item["candidate_rating"]
            for item in ratings
        ]

        if method == "cosine":
            similarity = cosine_similarity(
                user_ratings,
                candidate_ratings,
            )
        else:
            similarity = pearson_similarity(
                user_ratings,
                candidate_ratings,
            )

        if method == "pearson" and similarity <= 0:
            continue

        neighbors.append({
            "user_id": candidate_id,
            "similarity": similarity,
            "common_items": len(ratings),
        })

    neighbors.sort(
        key=lambda x: x["similarity"],
        reverse=True,
    )

    return neighbors[:k]


def buscar_ratings_vizinhos_base_completa(
    neighbor_ids: list[str],
    timestamp_corte: int
):
    if not neighbor_ids:
        return []

    placeholders = ", ".join(["%s"] * len(neighbor_ids))

    query = f"""
        SELECT
            user_id,
            parent_asin,
            rating
        FROM ratings
        WHERE user_id IN ({placeholders})
          AND timestamp <= %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                query,
                (*neighbor_ids, timestamp_corte)
            )
            rows = cur.fetchall()

    return [
        {
            "user_id": row[0],
            "parent_asin": row[1],
            "rating": float(row[2]),
        }
        for row in rows
    ]


def gerar_recomendacoes_avaliacao(
    user_id: str,
    method: str = "cosine",
    k: int = 5,
    limit: int = 10,
    min_common_items: int = 3,
):
    timestamp_corte = buscar_timestamp_corte_train(user_id)
    user_products = buscar_produtos_train_usuario(user_id)

    if not user_products:
        return {
            "user_id": user_id,
            "recommendations": [],
            "neighbors": [],
        }
    
    timestamp_corte = buscar_timestamp_corte_train(user_id)

    neighbors = encontrar_vizinhos_avaliacao(
        user_id=user_id,
        method=method,
        k=k,
        min_common_items=min_common_items,
    )

    if not neighbors:
        return {
            "user_id": user_id,
            "recommendations": [],
            "neighbors": [],
        }

    neighbor_similarity = {
        neighbor["user_id"]: neighbor["similarity"]
        for neighbor in neighbors
    }

    neighbor_ids = list(
        neighbor_similarity.keys()
    )

    ratings = buscar_ratings_vizinhos_base_completa(
        neighbor_ids=neighbor_ids,
        timestamp_corte=timestamp_corte,
    )

    scores = defaultdict(float)
    similarity_totals = defaultdict(float)

    for item in ratings:

        product_id = item["parent_asin"]
        neighbor_id = item["user_id"]
        rating = item["rating"]

        # Não recomendar algo que o usuário
        # já avaliou no conjunto de treino.
        if product_id in user_products:
            continue

        similarity = neighbor_similarity[neighbor_id]

        scores[product_id] += (
            similarity * rating
        )

        similarity_totals[product_id] += abs(
            similarity
        )

    recommendations = []

    for product_id, score in scores.items():

        denominator = similarity_totals[
            product_id
        ]

        if denominator == 0:
            continue

        predicted_rating = (
            score / denominator
        )

        recommendations.append({
            "parent_asin": product_id,
            "score": round(
                predicted_rating,
                2
            ),
        })

    recommendations.sort(
        key=lambda x: x["score"],
        reverse=True,
    )

    return {
        "user_id": user_id,
        "neighbors": neighbors,
        "recommendations": recommendations[:limit],
    }

def prever_ratings_produtos(
    user_id: str,
    product_ids: set[str],
    method: str = "cosine",
    k: int = 5,
    min_common_items: int = 3,
):
    if not product_ids:
        return {}

    user_products = buscar_produtos_train_usuario(user_id)

    if not user_products:
        return {}

    timestamp_corte = buscar_timestamp_corte_train(user_id)

    neighbors = encontrar_vizinhos_avaliacao(
        user_id=user_id,
        method=method,
        k=k,
        min_common_items=min_common_items,
    )

    if not neighbors:
        return {}

    neighbor_similarity = {
        neighbor["user_id"]: neighbor["similarity"]
        for neighbor in neighbors
    }

    neighbor_ids = list(neighbor_similarity.keys())

    ratings = buscar_ratings_vizinhos_base_completa(
        neighbor_ids=neighbor_ids,
        timestamp_corte=timestamp_corte,
    )

    scores = defaultdict(float)
    similarity_totals = defaultdict(float)

    for item in ratings:
        product_id = item["parent_asin"]

        if product_id not in product_ids:
            continue

        if product_id in user_products:
            continue

        neighbor_id = item["user_id"]
        similarity = neighbor_similarity[neighbor_id]
        rating = item["rating"]

        scores[product_id] += similarity * rating
        similarity_totals[product_id] += abs(similarity)

    predictions = {}

    for product_id in product_ids:

        denominator = similarity_totals.get(
            product_id,
            0.0
        )

        if denominator == 0:
            continue

        predictions[product_id] = (
            scores[product_id] / denominator
        )

    return predictions