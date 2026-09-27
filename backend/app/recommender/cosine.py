import numpy as np


def cosine_similarity(
    user_ratings: list[float],
    candidate_ratings: list[float]
) -> float:

    a = np.array(user_ratings, dtype=float)
    b = np.array(candidate_ratings, dtype=float)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(np.dot(a, b) / (norm_a * norm_b))