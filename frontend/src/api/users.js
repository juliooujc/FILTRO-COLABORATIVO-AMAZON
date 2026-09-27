import request from "./client";

export async function getUsers() {
    return request("/users");
}

export async function getUserHistory(userId) {
    return request(
        `/users/${encodeURIComponent(userId)}/history`
    );
}