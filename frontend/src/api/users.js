// users.js

import request from "./client";

export async function getUsers() {
    return request("/users");
}

export async function getUserHistory(userId) {
    return request(
        `/users/${encodeURIComponent(userId)}/history`
    );
}

export async function createUser(userId) {
    return request("/users", {
        method: "POST",
        body: JSON.stringify({
            user_id: userId,
        }),
    });
}