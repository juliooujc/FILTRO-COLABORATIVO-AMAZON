// client.js

const API_URL = "http://localhost:8000";

async function request(endpoint, options = {}) {
    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        }
    );

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(
            data.detail || "Erro ao comunicar com a API."
        );

        error.status = response.status;

        throw error;
    }

    return data;
}

export default request;