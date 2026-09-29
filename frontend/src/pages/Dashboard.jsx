import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { getUserHistory } from "../api/users";
import { getRecommendations } from "../api/recommendations";
import { getProduct } from "../api/products";

function formatDate(timestamp) {
    if (!timestamp) return "Data não disponível";

    const value = Number(timestamp);
    const date = new Date(value < 1e12 ? value * 1000 : value);

    if (Number.isNaN(date.getTime())) {
        return "Data não disponível";
    }

    return date.toLocaleDateString("pt-BR");
}

function formatPrice(price) {
    if (price === null || price === undefined) {
        return "Preço não disponível";
    }

    return Number(price).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function getTimestamp(timestamp) {
    const value = Number(timestamp);

    if (!Number.isFinite(value)) return 0;

    return value < 1e12 ? value * 1000 : value;
}

function Dashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const userId = location.state?.userId;
    const userName = location.state?.userName;
    const displayName = userName || userId;

    const [history, setHistory] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [coldStart, setColdStart] = useState(false);
    const [neighborCount, setNeighborCount] = useState(0);

    const [loadingHistory, setLoadingHistory] = useState(true);
    const [loadingRecommendations, setLoadingRecommendations] = useState(true);

    const [historyError, setHistoryError] = useState(null);
    const [recommendationError, setRecommendationError] = useState(null);

    // Filtros do histórico e do gráfico
    const [periodFilter, setPeriodFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState("all");

    useEffect(() => {
        if (!userId) {
            setLoadingHistory(false);
            setLoadingRecommendations(false);
            return;
        }

        let cancelled = false;

        async function loadDashboard() {
            setLoadingHistory(true);
            setLoadingRecommendations(true);
            setHistoryError(null);
            setRecommendationError(null);

            // Carrega o histórico do usuário.
            try {
                const data = await getUserHistory(userId);

                if (!cancelled) {
                    setHistory(data.history ?? []);
                }
            } catch (error) {
                if (!cancelled) {
                    setHistoryError(error.message);
                }
            } finally {
                if (!cancelled) {
                    setLoadingHistory(false);
                }
            }

            // Carrega as recomendações.
            try {
                const data = await getRecommendations({
                    userId,
                    method: "cosine",
                    k: 5,
                    limit: 4,
                    minCommonItems: 3,
                });

                let products = data.recommendations ?? [];

                // No cold start, a API retorna os IDs dos produtos,
                // então buscamos os detalhes de cada um.
                if (data.cold_start) {
                    products = await Promise.all(
                        products.map(async (recommendation) => {
                            try {
                                const product = await getProduct(
                                    recommendation.parent_asin
                                );

                                return { ...recommendation, product };
                            } catch {
                                return recommendation;
                            }
                        })
                    );
                }

                if (!cancelled) {
                    setColdStart(Boolean(data.cold_start));
                    setNeighborCount(data.neighbors?.length ?? 0);
                    setRecommendations(products);
                }
            } catch (error) {
                if (!cancelled) {
                    setRecommendationError(error.message);
                }
            } finally {
                if (!cancelled) {
                    setLoadingRecommendations(false);
                }
            }
        }

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    // Média geral das avaliações.
    const averageRating = useMemo(() => {
        if (history.length === 0) return 0;

        const total = history.reduce(
            (sum, item) => sum + Number(item.rating || 0),
            0
        );

        return total / history.length;
    }, [history]);

    // Quantidade de avaliações positivas (4 ou 5 estrelas).
    const positiveRatings = useMemo(() => {
        return history.filter(
            (item) => Number(item.rating) >= 4
        ).length;
    }, [history]);

    // Aplica os filtros selecionados ao histórico.
    const filteredHistory = useMemo(() => {
        const now = Date.now();

        return history.filter((item) => {
            const timestamp = getTimestamp(item.timestamp);

            if (periodFilter !== "all") {
                const days = Number(periodFilter);
                const limit = now - days * 24 * 60 * 60 * 1000;

                if (!timestamp || timestamp < limit) {
                    return false;
                }
            }

            if (
                ratingFilter !== "all" &&
                Number(item.rating) < Number(ratingFilter)
            ) {
                return false;
            }

            return true;
        });
    }, [history, periodFilter, ratingFilter]);

    // Avaliações recentes, respeitando os filtros.
    const recentHistory = useMemo(() => {
        return [...filteredHistory]
            .sort(
                (a, b) =>
                    getTimestamp(b.timestamp) - getTimestamp(a.timestamp)
            )
            .slice(0, 5);
    }, [filteredHistory]);

    // Distribuição das notas para o gráfico.
    const ratingDistribution = useMemo(() => {
        return [1, 2, 3, 4, 5].map((rating) => ({
            rating,
            count: filteredHistory.filter(
                (item) => Number(item.rating) === rating
            ).length,
        }));
    }, [filteredHistory]);

    if (!userId) {
        return (
            <main className="dashboard-page">
                <div className="dashboard-empty-state">
                    <h1>Nenhum usuário selecionado</h1>
                    <p>
                        Volte à página inicial e selecione um usuário para
                        continuar.
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
                        className="active"
                        onClick={() =>
                            navigate("/dashboard", { state: { userId, userName } })
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

                    <button
                        onClick={() =>
                            navigate("/history", { state: { userId, userName } })
                        }
                    >
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
                {/* Boas-vindas */}
                <div className="dashboard-welcome">
                    <div>
                        <span className="dashboard-eyebrow">
                            PAINEL DO USUÁRIO
                        </span>

                        <h1>Bem-vindo ao GourmetRec</h1>

                        <p>
                            Acompanhe seu histórico e descubra produtos
                            recomendados para você.
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

                {/* Indicadores */}
                <section className="dashboard-stats">
                    <article className="stat-card">
                        <span className="stat-icon">▤</span>

                        <div>
                            <small>Avaliações realizadas</small>
                            <strong>
                                {loadingHistory ? "..." : history.length}
                            </strong>
                        </div>
                    </article>

                    <article className="stat-card">
                        <span className="stat-icon">★</span>

                        <div>
                            <small>Média das suas notas</small>
                            <strong>
                                {loadingHistory
                                    ? "..."
                                    : averageRating.toFixed(2)}
                                <span className="stat-unit"> / 5</span>
                            </strong>
                        </div>
                    </article>

                    <article className="stat-card">
                        <span className="stat-icon">◎</span>

                        <div>
                            <small>Usuários semelhantes</small>
                            <strong>
                                {loadingRecommendations
                                    ? "..."
                                    : neighborCount}
                            </strong>
                        </div>
                    </article>

                    <article className="stat-card">
                        <span className="stat-icon">✦</span>

                        <div>
                            <small>Recomendações disponíveis</small>
                            <strong>
                                {loadingRecommendations
                                    ? "..."
                                    : recommendations.length}
                            </strong>
                        </div>
                    </article>

                    <article className="stat-card">
                        <span className="stat-icon">♥</span>

                        <div>
                            <small>Avaliações positivas</small>
                            <strong>
                                {loadingHistory ? "..." : positiveRatings}
                                <span className="stat-unit">
                                    {" "}
                                    / {history.length}
                                </span>
                            </strong>
                        </div>
                    </article>
                </section>

                {/* Análise das avaliações */}
                <section className="dashboard-section analytics-section">
                    <div className="section-heading">
                        <div>
                            <span className="dashboard-eyebrow">
                                ANÁLISE
                            </span>
                            <h2>Suas avaliações</h2>
                        </div>

                        <span className="analytics-total">
                            {loadingHistory
                                ? "Carregando..."
                                : `${filteredHistory.length} avaliação(ões)`}
                        </span>
                    </div>

                    <div className="analytics-card">
                        {/* Gráfico */}
                        <div className="rating-chart">
                            <div className="chart-heading">
                                <div>
                                    <h3>Distribuição das notas</h3>
                                    <p>
                                        Quantidade de avaliações por
                                        classificação
                                    </p>
                                </div>

                                <strong>{filteredHistory.length}</strong>
                            </div>

                            {loadingHistory ? (
                                <p className="chart-empty">
                                    Carregando avaliações...
                                </p>
                            ) : historyError ? (
                                <p className="chart-empty">
                                    Não foi possível carregar os dados do
                                    gráfico.
                                </p>
                            ) : filteredHistory.length === 0 ? (
                                <p className="chart-empty">
                                    Nenhuma avaliação encontrada para os
                                    filtros selecionados.
                                </p>
                            ) : (
                                <div className="rating-bars">
                                    {ratingDistribution.map(
                                        ({ rating, count }) => {
                                            const percentage =
                                                filteredHistory.length > 0
                                                    ? (count /
                                                          filteredHistory.length) *
                                                      100
                                                    : 0;

                                            return (
                                                <div
                                                    className="rating-bar-row"
                                                    key={rating}
                                                >
                                                    <span className="rating-label">
                                                        {rating} ★
                                                    </span>

                                                    <div className="rating-bar-track">
                                                        <div
                                                            className="rating-bar-fill"
                                                            style={{
                                                                width: `${percentage}%`,
                                                            }}
                                                        />
                                                    </div>

                                                    <span className="rating-count">
                                                        {count}
                                                    </span>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Recomendações */}
                <section className="dashboard-section">
                    <div className="section-heading">
                        <div>
                            <span className="dashboard-eyebrow">
                                PARA VOCÊ
                            </span>
                            <h2>Recomendações</h2>
                        </div>

                        <button
                            className="text-button"
                            onClick={() =>
                                navigate("/recommendations", {
                                    state: { userId },
                                })
                            }
                        >
                            Ver todas →
                        </button>
                    </div>

                    {loadingRecommendations ? (
                        <div className="dashboard-message">
                            Carregando recomendações...
                        </div>
                    ) : recommendationError ? (
                        <div className="dashboard-message error">
                            Não foi possível carregar as recomendações:{" "}
                            {recommendationError}
                        </div>
                    ) : recommendations.length === 0 ? (
                        <div className="dashboard-message">
                            Ainda não há recomendações disponíveis para este
                            usuário.
                        </div>
                    ) : (
                        <>
                            {coldStart && (
                                <p className="recommendation-note">
                                    Este usuário ainda não possui avaliações
                                    suficientes. Exibindo sugestões populares.
                                </p>
                            )}

                            <div className="recommendation-grid">
                                {recommendations.map((item) => (
                                    <Link
                                        to={`/products/${encodeURIComponent(item.parent_asin)}`}
                                        state={{ userId, userName }}
                                        className="recommendation-card product-card-link"
                                        key={item.parent_asin}
                                        aria-label={`Ver detalhes do produto ${
                                            item.product?.title || item.parent_asin
                                        }`}
                                    >
                                        {item.product?.image_url ? (
                                            <img
                                                src={item.product.image_url}
                                                alt=""
                                            />
                                        ) : (
                                            <div className="product-image-placeholder">
                                                Sem imagem
                                            </div>
                                        )}

                                        <div className="recommendation-info">
                                            <h3>
                                                {item.product?.title ||
                                                    `Produto ${item.parent_asin}`}
                                            </h3>

                                            <strong className="recommendation-score">
                                                ★{" "}
                                                {Number(item.score).toFixed(2)}
                                                <span> / 5</span>
                                            </strong>

                                            <small>
                                                {formatPrice(
                                                    item.product?.price
                                                )}
                                            </small>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                {/* Histórico recente */}
                <section className="dashboard-section">
                    <div className="section-heading">
                        <div>
                            <span className="dashboard-eyebrow">
                                ATIVIDADE
                            </span>

                            <h2>Avaliações recentes</h2>

                            <p className="history-filter-caption">
                                Exibindo até 5 avaliações conforme os filtros
                                selecionados.
                            </p>
                        </div>

                        <button
                            className="text-button"
                            onClick={() =>
                                navigate("/history", {
                                    state: { userId },
                                })
                            }
                        >
                            Ver histórico →
                        </button>
                    </div>

                    {loadingHistory ? (
                        <div className="dashboard-message">
                            Carregando histórico...
                        </div>
                    ) : historyError ? (
                        <div className="dashboard-message error">
                            Não foi possível carregar o histórico:{" "}
                            {historyError}
                        </div>
                    ) : recentHistory.length === 0 ? (
                        <div className="dashboard-message">
                            Nenhuma avaliação encontrada para os filtros
                            selecionados.
                        </div>
                    ) : (
                        <div className="recent-list">
                            {recentHistory.map((item) => (
                                <Link
                                    to={`/products/${encodeURIComponent(item.parent_asin)}`}
                                    state={{ userId, userName }}
                                    className="recent-item product-card-link"
                                    key={item.parent_asin}
                                    aria-label={`Ver detalhes do produto ${
                                        item.product?.title || item.parent_asin
                                    }`}
                                >
                                    {item.product?.image_url ? (
                                        <img
                                            src={item.product.image_url}
                                            alt=""
                                        />
                                    ) : (
                                        <div className="recent-image-placeholder">
                                            G
                                        </div>
                                    )}

                                    <div className="recent-product-info">
                                        <strong>
                                            {item.product?.title ||
                                                `Produto ${item.parent_asin}`}
                                        </strong>

                                        <small>
                                            {formatDate(item.timestamp)}
                                        </small>
                                    </div>

                                    <span className="recent-rating">
                                        ★ {Number(item.rating).toFixed(1)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </section>
        </main>
    );
}

export default Dashboard;