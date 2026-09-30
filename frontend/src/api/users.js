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

export async function createUser(userId, name) {
    return request("/users", {
        method: "POST",
        body: JSON.stringify({
            user_id: userId,
            name: name,
        }),
    });
}

export async function getUser(search) {
    const params = new URLSearchParams();

    if (search.name) {
        params.append("name", search.name);
    }

    if (search.userId) {
        params.append("user_id", search.userId);
    }

    return request(`/users/user?${params.toString()}`);
}