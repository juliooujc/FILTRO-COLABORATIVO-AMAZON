import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { getRecommendations } from "../api/recommendations";
import { getProduct } from "../api/products";

function formatPrice(price) {
    if (price === null || price === undefined || price === "") {
        return "Preço não disponível";
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) {
        return String(price);
    }

    return numericPrice.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function Recommendations() {
    const location = useLocation();
    const navigate = useNavigate();

    const userId = location.state?.userId;
    const userName = location.state?.userName;

    const [recommendations, setRecommendations] = useState([]);
    const [neighborCount, setNeighborCount] = useState(0);
    const [coldStart, setColdStart] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [draftConfig, setDraftConfig] = useState({
        method: "cosine",
        k: 5,
        limit: 10,
        minCommonItems: 3,
    });

    const [activeConfig, setActiveConfig] = useState({
        method: "cosine",
        k: 5,
        limit: 10,
        minCommonItems: 3,
    });

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function loadRecommendations() {
            setLoading(true);
            setError(null);

            try {
                const data = await getRecommendations({
                    userId,
                    ...activeConfig,
                });

                let products = data.recommendations ?? [];

                // No cold start, o backend retorna os IDs,
                // mas não inclui os dados completos dos produtos.
                if (data.cold_start) {
                    products = await Promise.all(
                        products.map(async (recommendation) => {
                            try {
                                const product = await getProduct(
                                    recommendation.parent_asin
                                );

                                return {
                                    ...recommendation,
                                    product,
                                };
                            } catch {
                                // Mantém a recomendação mesmo se
                                // não conseguirmos buscar os detalhes.
                                return recommendation;
                            }
                        })
                    );
                }

                if (!cancelled) {
                    setRecommendations(products);
                    setNeighborCount(data.neighbors?.length ?? 0);
                    setColdStart(Boolean(data.cold_start));
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                            "Não foi possível carregar as recomendações."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadRecommendations();

        return () => {
            cancelled = true;
        };
    }, [userId, activeConfig]);

    function handleConfigChange(event) {
        const { name, value } = event.target;

        setDraftConfig((current) => ({
            ...current,
            [name]: name === "method" ? value : Number(value),
        }));
    }

    function handleApplyFilters() {
        setActiveConfig({ ...draftConfig });
    }

    if (!userId) {
        return (
            <main className="dashboard-page">
                <div className="dashboard-empty-state">
                    <h1>Nenhum usuário selecionado</h1>
                    <p>
                        Volte à página inicial e selecione um usuário
                        para visualizar as recomendações.
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

                    <button className="active">
                        Recomendações
                    </button>

                    <button
                        onClick={() =>
                            navigate("/history", {
                                state: { userId, userName },
                            })
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
                <div className="dashboard-welcome">
                    <div>
                        <span className="dashboard-eyebrow">
                            DESCOBERTA PERSONALIZADA
                        </span>

                        <h1>Recomendações para você</h1>

                        <p>
                            Produtos selecionados com base nas avaliações
                            de usuários com preferências semelhantes às suas.
                        </p>
                    </div>

                    <div className="current-user">
                        <span className="current-user-avatar">
                            {(userName || userId).charAt(0).toUpperCase()}
                        </span>

                        <div>
                            <small>Usuário atual</small>
                            <strong className="current-user-name">{userName || userId}</strong>

                            {userName && <small className="current-user-id">{userId}</small>}
                        </div>
                    </div>
                </div>

                <section className="recommendation-summary">
                    <article className="recommendation-summary-card">
                        <span className="stat-icon">✦</span>
                        <div>
                            <small>Produtos recomendados</small>
                            <strong>
                                {loading ? "..." : recommendations.length}
                            </strong>
                        </div>
                    </article>

                    <article className="recommendation-summary-card">
                        <span className="stat-icon">◎</span>
                        <div>
                            <small>Usuários semelhantes</small>
                            <strong>
                                {loading ? "..." : neighborCount}
                            </strong>
                        </div>
                    </article>

                    <article className="recommendation-summary-card">
                        <span className="stat-icon">⌕</span>
                        <div>
                            <small>Método utilizado</small>
                            <strong className="method-value">
                                {activeConfig.method === "cosine"
                                    ? "Cosine"
                                    : "Pearson"}
                            </strong>
                        </div>
                    </article>
                </section>

                <section className="recommendations-section">
                    <div className="recommendations-heading">
                        <div>
                            <span className="dashboard-eyebrow">
                                ALGORITMO DE RECOMENDAÇÃO
                            </span>

                            <h2>Produtos sugeridos</h2>

                            <p>
                                Ajuste os parâmetros para explorar diferentes
                                resultados do algoritmo.
                            </p>
                        </div>
                    </div>

                    <div className="recommendation-controls">
                        <label>
                            Método de similaridade
                            <select
                                name="method"
                                value={draftConfig.method}
                                onChange={handleConfigChange}
                            >
                                <option value="cosine">Cosine</option>
                                <option value="pearson">Pearson</option>
                            </select>
                        </label>

                        <label>
                            Usuários vizinhos (k)
                            <select
                                name="k"
                                value={draftConfig.k}
                                onChange={handleConfigChange}
                            >
                                <option value={3}>3</option>
                                <option value={5}>5</option>
                                <option value={11}>11</option>
                                <option value={15}>15</option>
                                <option value={21}>21</option>
                            </select>
                        </label>

                        <label>
                            Quantidade de produtos
                            <select
                                name="limit"
                                value={draftConfig.limit}
                                onChange={handleConfigChange}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </label>

                        <label>
                            Mínimo de itens em comum
                            <select
                                name="minCommonItems"
                                value={draftConfig.minCommonItems}
                                onChange={handleConfigChange}
                            >
                                <option value={1}>1</option>
                                <option value={3}>3</option>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </label>

                        <button
                            type="button"
                            className="recommendation-apply-button"
                            onClick={handleApplyFilters}
                            disabled={loading}
                        >
                            Aplicar
                        </button>
                    </div>

                    {coldStart && !loading && (
                        <div className="cold-start-notice">
                            <strong>Recomendações populares</strong>
                            <p>
                                Este usuário ainda não possui histórico de
                                avaliações. Por isso, estamos exibindo produtos
                                populares da base de dados.
                            </p>
                        </div>
                    )}

                    {loading ? (
                        <div className="recommendations-message">
                            <div className="loading-spinner" />
                            <p>Buscando recomendações...</p>
                        </div>
                    ) : error ? (
                        <div className="recommendations-message error">
                            <strong>
                                Não foi possível carregar as recomendações
                            </strong>
                            <p>{error}</p>
                            <button onClick={handleApplyFilters}>
                                Tentar novamente
                            </button>
                        </div>
                    ) : recommendations.length === 0 ? (
                        <div className="recommendations-message">
                            <strong>
                                Nenhuma recomendação encontrada
                            </strong>
                            <p>
                                Não encontramos produtos para os parâmetros
                                selecionados. Tente reduzir o mínimo de itens
                                em comum ou alterar o método de similaridade.
                            </p>
                        </div>
                    ) : (
                        <div className="recommendations-grid">
                            {recommendations.map((item) => (
                                <Link
                                    to={`/products/${encodeURIComponent(
                                        item.parent_asin
                                    )}`}
                                    state={{ userId, userName }}
                                    className="recommendation-card product-card-link"
                                    key={item.parent_asin}
                                    aria-label={`Ver detalhes do produto ${
                                        item.product?.title || item.parent_asin
                                    }`}
                                >
                                    <div className="recommendation-image">
                                        {item.product?.image_url ? (
                                            <img
                                                src={item.product.image_url}
                                                alt=""
                                            />
                                        ) : (
                                            <div className="product-image-placeholder">
                                                <span>G</span>
                                                <small>Sem imagem</small>
                                            </div>
                                        )}
                                    </div>

                                    <div className="recommendation-info">
                                        <span className="recommendation-product-id">
                                            {item.parent_asin}
                                        </span>

                                        <h3>
                                            {item.product?.title ||
                                                `Produto ${item.parent_asin}`}
                                        </h3>

                                        {item.product?.description && (
                                            <p className="recommendation-description">
                                                {item.product.description}
                                            </p>
                                        )}

                                        <div className="recommendation-card-footer">
                                            <div>
                                                <span className="recommendation-score">
                                                    ★{" "}
                                                    {Number(item.score).toFixed(2)}
                                                    <small> / 5</small>
                                                </span>

                                                <small className="score-caption">
                                                    {coldStart
                                                        ? "Avaliação média"
                                                        : "Nota prevista"}
                                                </small>
                                            </div>

                                            <span className="recommendation-price">
                                                {formatPrice(
                                                    item.product?.price
                                                )}
                                            </span>
                                        </div>

                                        {coldStart &&
                                            item.total_ratings !== undefined && (
                                                <small className="total-ratings">
                                                    {item.total_ratings} avaliações
                                                    na base
                                                </small>
                                            )}
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

export default Recommendations;