import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getUsers } from "../api/users";

function UserSelection() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadUsers() {
            try {
                setLoading(true);
                setError(null);

                const data = await getUsers();

                setUsers(data.users ?? []);
            } catch (err) {
                console.error(err);
                setError(
                    err.message ||
                    "Não foi possível carregar os usuários."
                );
            } finally {
                setLoading(false);
            }
        }

        loadUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        const normalizedSearch = search
            .trim()
            .toLowerCase();

        if (!normalizedSearch) {
            return users.slice(0, 6);
        }

        return users
            .filter((userId) =>
                userId.toLowerCase().includes(normalizedSearch)
            )
            .slice(0, 12);
    }, [users, search]);

    function handleSelectUser(userId) {
        setSelectedUser(userId);
    }

    function handleEnter() {
        if (!selectedUser) {
            return;
        }

        navigate("/dashboard", {
            state: {
                userId: selectedUser,
            },
        });
    }

    return (
        <main className="selection-page">
            <header className="topbar">
                <div className="brand">
                    <div className="brand-mark">
                        G
                    </div>

                    <span>GourmetRec</span>
                </div>

                <nav className="topbar-nav">
                    <button type="button">
                        Sobre
                    </button>

                    <button type="button">
                        Ajuda
                    </button>
                </nav>
            </header>

            <section className="selection-background">
                <div className="selection-overlay" />

                <div className="selection-card">
                    <div className="selection-icon">
                        G
                    </div>

                    <h1>GourmetRec</h1>

                    <h2>
                        Sistema de Recomendação
                        <br />
                        de Alimentos Gourmet
                    </h2>

                    <p className="selection-description">
                        Descubra novos sabores e produtos
                        gourmet da Amazon baseados nas
                        avaliações de usuários semelhantes.
                    </p>

                    <div className="selection-divider" />

                    <h3>
                        Selecione um usuário para começar
                    </h3>

                    <div className="search-box">
                        <span className="search-icon">
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Pesquisar usuário..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />
                    </div>

                    <div className="users-heading">
                        <span>
                            {search
                                ? "Resultados da pesquisa"
                                : "Usuários disponíveis"}
                        </span>

                        <span className="user-count">
                            {users.length} usuários
                        </span>
                    </div>

                    {loading && (
                        <div className="status-message">
                            Carregando usuários...
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <strong>Erro:</strong>
                            <span>{error}</span>
                            <small>
                                Verifique se o FastAPI está
                                executando em localhost:8000.
                            </small>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            {filteredUsers.length > 0 ? (
                                <div className="users-grid">
                                    {filteredUsers.map((userId) => {
                                        const isSelected =
                                            selectedUser === userId;

                                        return (
                                            <button
                                                key={userId}
                                                type="button"
                                                className={`user-button ${
                                                    isSelected
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handleSelectUser(
                                                        userId
                                                    )
                                                }
                                            >
                                                <span className="user-avatar">
                                                    {userId
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>

                                                <span className="user-id">
                                                    {userId}
                                                </span>

                                                {isSelected && (
                                                    <span className="selected-indicator">
                                                        ✓
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-users">
                                    <strong>
                                        Nenhum usuário encontrado
                                    </strong>

                                    <span>
                                        Tente pesquisar por outro
                                        trecho do ID.
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                    <button
                        type="button"
                        className="enter-button"
                        disabled={!selectedUser}
                        onClick={handleEnter}
                    >
                        <span>
                            {selectedUser
                                ? "Entrar no sistema"
                                : "Selecione um usuário"}
                        </span>

                        {selectedUser && (
                            <span className="arrow">
                                →
                            </span>
                        )}
                    </button>

                    {selectedUser && (
                        <div className="selected-user-info">
                            Usuário selecionado:
                            <strong>{selectedUser}</strong>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

export default UserSelection;