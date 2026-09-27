from collections import defaultdict

from app.db.queries import (
    buscar_ratings_comuns_dos_candidatos,
)

from app.recommender.cosine import cosine_similarity
from app.recommender.pearson import pearson_similarity


def encontrar_vizinhos(
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

    common_ratings = buscar_ratings_comuns_dos_candidatos(
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