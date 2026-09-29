import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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

function ProductDetails() {
    const { parentAsin } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const userId = location.state?.userId;

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            setLoading(true);
            setError(null);

            try {
                const response = await getProduct(parentAsin);

                // Algumas respostas podem trazer o produto
                // diretamente; outras podem usar a propriedade "product".
                const productData = response.product ?? response;

                if (!cancelled) {
                    setProduct(productData);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        "Não foi possível carregar os detalhes do produto."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [parentAsin]);

    function handleBack() {
        if (window.history.length > 1) {
            navigate(-1);
        } else if (userId) {
            navigate("/recommendations", { state: { userId } });
        } else {
            navigate("/");
        }
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
                            navigate("/dashboard", { state: { userId } })
                        }
                    >
                        Dashboard
                    </button>

                    <button
                        onClick={() =>
                            navigate("/recommendations", { state: { userId } })
                        }
                    >
                        Recomendações
                    </button>

                    <button
                        onClick={() =>
                            navigate("/history", { state: { userId } })
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

            <section className="dashboard-content product-details-content">
                <button
                    type="button"
                    className="product-back-button"
                    onClick={handleBack}
                >
                    ← Voltar
                </button>

                {loading ? (
                    <div className="product-details-message">
                        <div className="loading-spinner" />
                        <p>Carregando detalhes do produto...</p>
                    </div>
                ) : error ? (
                    <div className="product-details-message error">
                        <h2>Não foi possível carregar o produto</h2>
                        <p>{error}</p>
                        <button onClick={handleBack}>
                            Voltar
                        </button>
                    </div>
                ) : !product ? (
                    <div className="product-details-message">
                        <h2>Produto não encontrado</h2>
                        <p>Não encontramos informações para este produto.</p>
                        <button onClick={handleBack}>
                            Voltar
                        </button>
                    </div>
                ) : (
                    <section className="product-details-card">
                        <div className="product-details-image">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.title || "Produto"}
                                />
                            ) : (
                                <div className="product-image-placeholder">
                                    <span>G</span>
                                    <small>Sem imagem</small>
                                </div>
                            )}
                        </div>

                        <div className="product-details-info">
                            <span className="dashboard-eyebrow">
                                DETALHES DO PRODUTO
                            </span>

                            <h1>
                                {product.title || `Produto ${parentAsin}`}
                            </h1>

                            <p className="product-details-id">
                                Código: {product.parent_asin || parentAsin}
                            </p>

                            <div className="product-details-price">
                                {formatPrice(product.price)}
                            </div>

                            {product.description ? (
                                <div className="product-details-description">
                                    <h2>Descrição</h2>
                                    <p>{product.description}</p>
                                </div>
                            ) : (
                                <div className="product-details-description">
                                    <h2>Descrição</h2>
                                    <p>
                                        Não há uma descrição disponível para
                                        este produto na base de dados.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </section>
        </main>
    );
}

export default ProductDetails;