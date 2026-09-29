import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { getUserHistory } from "../api/users";
import { getProduct } from "../api/products";

function getTimestamp(timestamp) {
    if (timestamp === null || timestamp === undefined || timestamp === "") {
        return 0;
    }

    const value = Number(timestamp);

    if (!Number.isFinite(value)) {
        return 0;
    }

    return value < 1e12 ? value * 1000 : value;
}

function formatDate(timestamp) {
    const value = getTimestamp(timestamp);

    if (!value) {
        return "Data não disponível";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Data não disponível";
    }

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function History() {
    const location = useLocation();
    const navigate = useNavigate();

    const userId = location.state?.userId;
    const userName = location.state?.userName || "";
    const displayName = userName || userId;

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [ratingFilter, setRatingFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function loadHistory() {
            setLoading(true);
            setError(null);

            try {
                const data = await getUserHistory(userId);
                const ratings = data.history ?? [];

                // Busca os detalhes dos produtos em paralelo.
                const historyWithProducts = await Promise.all(
                    ratings.map(async (item) => {
                        try {
                            const response = await getProduct(item.parent_asin);

                            return {
                                ...item,
                                product: response.product ?? response,
                            };
                        } catch {
                            // A avaliação continua aparecendo mesmo
                            // se não for possível carregar o produto.
                            return {
                                ...item,
                                product: null,
                            };
                        }
                    })
                );

                if (!cancelled) {
                    setHistory(historyWithProducts);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                            "Não foi possível carregar o histórico."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadHistory();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const averageRating = useMemo(() => {
        if (history.length === 0) return 0;

        const total = history.reduce(
            (sum, item) => sum + Number(item.rating || 0),
            0
        );

        return total / history.length;
    }, [history]);

    const filteredHistory = useMemo(() => {
        let result = [...history];

        if (ratingFilter !== "all") {
            result = result.filter(
                (item) => Number(item.rating) === Number(ratingFilter)
            );
        }

        result.sort((a, b) => {
            const difference =
                getTimestamp(a.timestamp) - getTimestamp(b.timestamp);

            return sortOrder === "newest" ? -difference : difference;
        });

        return result;
    }, [history, ratingFilter, sortOrder]);

    if (!userId) {
        return (
            <main className="dashboard-page">
                <div className="dashboard-empty-state">
                    <h1>Nenhum usuário selecionado</h1>
                    <p>
                        Volte à página inicial e selecione um usuário
                        para visualizar seu histórico.
                    </p>
                    <button onClick={() => navigate("/")}>
                        Voltar à seleção
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="dashboard-page">
            <header className="dashboard-topbar">
                <div className="brand">
                    <div className="brand-mark">G</div>
                    <span>GourmetRec</span>
                </div>

                <nav className="dashboard-nav">
                    <button
                        onClick={() =>
                            navigate("/dashboard", {
                                state: { userId, userName },
                            })
                        }
                    >
                        Dashboard
                    </button>

                    <button
                        onClick={() =>
                            navigate("/recommendations", {
                                state: { userId, userName },
                            })
                        }
                    >
                        Recomendações
                    </button>

                    <button className="active">
                        Histórico
                    </button>
                </nav>

                <button
                    className="change-user-button"
                    onClick={() => navigate("/")}
                >
                    Trocar usuário
                </button>
            </header>

            <section className="dashboard-content">
                <div className="dashboard-welcome">
                    <div>
                        <span className="dashboard-eyebrow">
                            SUA ATIVIDADE
                        </span>

                        <h1>Meu histórico</h1>

                        <p>
                            Todos os produtos que você já avaliou,
                            organizados em um só lugar.
                        </p>
                    </div>

                    <div className="current-user">
                        <span className="current-user-avatar">
                            {displayName.charAt(0).toUpperCase()}
                        </span>

                        <div>
                            <small>Usuário atual</small>
                            <strong className="current-user-name">{userName || userId}</strong>

                            {userName && <small className="current-user-id">{userId}</small>}
                        </div>
                    </div>
                </div>

                <section className="dashboard-stats history-stats">
                    <article className="stat-card">
                        <span className="stat-icon">▤</span>
                        <div>
                            <small>Avaliações realizadas</small>
                            <strong>
                                {loading ? "..." : history.length}
                            </strong>
                        </div>
                    </article>

                    <article className="stat-card">
                        <span className="stat-icon">★</span>
                        <div>
                            <small>Média das suas notas</small>
                            <strong>
                                {loading ? "..." : averageRating.toFixed(2)}
                                <span className="stat-unit"> / 5</span>
                            </strong>
                        </div>
                    </article>

                    <article className="stat-card">
                        <span className="stat-icon">♡</span>
                        <div>
                            <small>Avaliações positivas</small>
                            <strong>
                                {loading
                                    ? "..."
                                    : history.filter(
                                          (item) => Number(item.rating) >= 4
                                      ).length}
                            </strong>
                        </div>
                    </article>
                </section>

                <section className="history-section">
                    <div className="history-heading">
                        <div>
                            <span className="dashboard-eyebrow">
                                REGISTROS
                            </span>
                            <h2>Produtos avaliados</h2>
                            <p>
                                Consulte suas notas e quando cada avaliação
                                foi registrada.
                            </p>
                        </div>
                    </div>

                    <div className="history-toolbar">
                        <span>
                            {loading
                                ? "Carregando avaliações..."
                                : `${filteredHistory.length} de ${history.length} avaliações`}
                        </span>

                        <div className="history-filters">
                            <label>
                                Nota
                                <select
                                    value={ratingFilter}
                                    onChange={(event) =>
                                        setRatingFilter(event.target.value)
                                    }
                                >
                                    <option value="all">Todas</option>
                                    <option value="5">5 estrelas</option>
                                    <option value="4">4 estrelas</option>
                                    <option value="3">3 estrelas</option>
                                    <option value="2">2 estrelas</option>
                                    <option value="1">1 estrela</option>
                                </select>
                            </label>

                            <label>
                                Ordenar por
                                <select
                                    value={sortOrder}
                                    onChange={(event) =>
                                        setSortOrder(event.target.value)
                                    }
                                >
                                    <option value="newest">Mais recentes</option>
                                    <option value="oldest">Mais antigas</option>
                                </select>
                            </label>
                        </div>
                    </div>

                    {loading ? (
                        <div className="history-message">
                            <div className="loading-spinner" />
                            <p>Carregando seu histórico...</p>
                        </div>
                    ) : error ? (
                        <div className="history-message error">
                            <strong>
                                Não foi possível carregar o histórico
                            </strong>
                            <p>{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="history-message">
                            <strong>Nenhuma avaliação encontrada</strong>
                            <p>
                                Este usuário ainda não possui avaliações
                                registradas.
                            </p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="history-message">
                            <strong>Nenhum resultado para este filtro</strong>
                            <p>
                                Não há avaliações com a nota selecionada.
                                Tente escolher outra opção.
                            </p>
                        </div>
                    ) : (
                        <div className="history-list">
                            {filteredHistory.map((item, index) => (
                                <Link
                                    to={`/products/${encodeURIComponent(
                                        item.parent_asin
                                    )}`}
                                    state={{ userId, userName }}
                                    className="history-item product-card-link"
                                    key={`${item.parent_asin}-${item.timestamp ?? index}`}
                                    aria-label={`Ver detalhes do produto ${
                                        item.product?.title || item.parent_asin
                                    }`}
                                >
                                    <div className="history-product-image">
                                        {item.product?.image_url ? (
                                            <img
                                                src={item.product.image_url}
                                                alt=""
                                            />
                                        ) : (
                                            <div className="history-image-placeholder">
                                                G
                                            </div>
                                        )}
                                    </div>

                                    <div className="history-product-info">
                                        <strong>
                                            {item.product?.title ||
                                                `Produto ${item.parent_asin}`}
                                        </strong>

                                        <small>
                                            Código: {item.parent_asin}
                                        </small>
                                    </div>

                                    <div className="history-rating">
                                        <div className="history-stars">
                                            {"★".repeat(
                                                Math.max(
                                                    0,
                                                    Math.min(
                                                        5,
                                                        Number(item.rating) || 0
                                                    )
                                                )
                                            )}
                                            <span>
                                                {"★".repeat(
                                                    Math.max(
                                                        0,
                                                        5 -
                                                            Math.min(
                                                                5,
                                                                Number(item.rating) || 0
                                                            )
                                                    )
                                                )}
                                            </span>
                                        </div>

                                        <small>
                                            {Number(item.rating).toFixed(1)} / 5
                                        </small>
                                    </div>

                                    <div className="history-date">
                                        <small>Data da avaliação</small>
                                        <strong>
                                            {formatDate(item.timestamp)}
                                        </strong>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}

export default History;