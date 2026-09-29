// ratings.js

import request from "./client";

export async function createRating(
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

export async function updateRating(
    userId,
    parentAsin,
    rating
) {
    return request(
        `/users/${encodeURIComponent(userId)}/ratings/${encodeURIComponent(parentAsin)}`,
        {
            method: "PUT",
            body: JSON.stringify({
                parent_asin: parentAsin,
                rating,
            }),
        }
    );
}

export async function deleteRating(
    userId,
    parentAsin
) {
    return request(
        `/users/${encodeURIComponent(userId)}/ratings/${encodeURIComponent(parentAsin)}`,
        {
            method: "DELETE",
        }
    );
}

export async function rateProduct(
    userId,
    parentAsin,
    rating
) {
    return createRating(
        userId,
        parentAsin,
        rating
    );
}