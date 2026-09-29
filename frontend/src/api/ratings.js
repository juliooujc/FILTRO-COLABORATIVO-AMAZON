// ratings.js

import request from "./client";

export async function rateProduct(
    userId,
    parentAsin,
    rating
) {
    return request(
        `/users/${encodeURIComponent(userId)}/ratings`,
        {
            method: "POST",
            body: JSON.stringify({
                parent_asin: parentAsin,
                rating,
            }),
        }
    );
}