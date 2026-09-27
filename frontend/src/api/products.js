import request from "./client";

export async function getProduct(parentAsin) {
    return request(
        `/products/${encodeURIComponent(parentAsin)}`
    );
}