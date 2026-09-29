// recommendations.js

import request from "./client";

export async function getRecommendations({
    userId,
    method = "cosine",
    k = 5,
    limit = 10,
    minCommonItems = 3,
}) {
    const params = new URLSearchParams({
        method,
        k: String(k),
        limit: String(limit),
        min_common_items: String(minCommonItems),
    });

    return request(
        `/users/${encodeURIComponent(userId)}/recommendations?${params}`
    );
}