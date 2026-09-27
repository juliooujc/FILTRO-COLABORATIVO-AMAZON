import numpy as np


def pearson_similarity(
    user_ratings: list[float],
    candidate_ratings: list[float]
) -> float:

    a = np.array(user_ratings, dtype=float)
    b = np.array(candidate_ratings, dtype=float)

    if len(a) < 2:
        return 0.0

    if np.std(a) == 0 or np.std(b) == 0:
        return 0.0

    correlation = np.corrcoef(a, b)[0, 1]

    if np.isnan(correlation):
        return 0.0

    return float(correlation)