// frontend/src/pages/ProductDetails.jsx

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getProduct } from "../api/products";
import { getUserHistory } from "../api/users";
import {
  createRating,
  updateRating,
  deleteRating,
} from "../api/ratings";

import "../App.css";

function ProductDetails() {
  const { parentAsin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const userId = location.state?.userId;
  const userName = location.state?.userName;

  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(null);
  const [hasExistingRating, setHasExistingRating] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingRating, setSavingRating] = useState(false);
  const [error, setError] = useState("");
  const [ratingMessage, setRatingMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const productData = await getProduct(parentAsin);

        if (!isMounted) return;
        setProduct(productData);

        // Sem usuário identificado, não há avaliação pessoal para carregar.
        if (!userId) {
          setRating(null);
          setHasExistingRating(false);
          return;
        }

        // Procura uma avaliação anterior deste usuário para este produto.
        const historyData = await getUserHistory(userId);
        const history = historyData?.history ?? [];

        const existingRating = history.find(
          (item) =>
            item.parent_asin === parentAsin ||
            item.parentAsin === parentAsin
        );

        if (!isMounted) return;

        if (existingRating) {
          setRating(Number(existingRating.rating));
          setHasExistingRating(true);
        } else {
          setRating(null);
          setHasExistingRating(false);
        }
      } catch (err) {
        console.error("Erro ao carregar produto:", err);

        if (isMounted) {
          setError("Não foi possível carregar os dados do produto.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [parentAsin, userId]);

  function goTo(path) {
    navigate(path, {
      state: {
        userId,
        userName,
      },
    });
  }

  async function handleSaveRating() {
    if (!userId) {
      setRatingMessage("É necessário estar identificado para avaliar.");
      return;
    }

    if (rating === null) {
      setRatingMessage("Selecione uma quantidade de estrelas antes de salvar.");
      return;
    }

    try {
      setSavingRating(true);
      setRatingMessage("");

      if (hasExistingRating) {
        await updateRating(userId, parentAsin, rating);
        setRatingMessage("Sua avaliação foi atualizada!");
      } else {
        await createRating(userId, parentAsin, rating);
        setHasExistingRating(true);
        setRatingMessage("Sua avaliação foi salva!");
      }
    } catch (err) {
      console.error("Erro ao salvar avaliação:", err);
      setRatingMessage("Não foi possível salvar sua avaliação.");
    } finally {
      setSavingRating(false);
    }
  }

  async function handleDeleteRating() {
    if (!userId || !hasExistingRating) return;

    try {
      setSavingRating(true);
      setRatingMessage("");

      await deleteRating(userId, parentAsin);

      setRating(null);
      setHasExistingRating(false);
      setRatingMessage("Sua avaliação foi removida.");
    } catch (err) {
      console.error("Erro ao excluir avaliação:", err);
      setRatingMessage("Não foi possível remover sua avaliação.");
    } finally {
      setSavingRating(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <p className="product-details-status">Carregando produto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="dashboard-page">
        <p className="product-details-status">
          {error || "Produto não encontrado."}
        </p>

        <button
          className="product-details-back-button"
          onClick={() => goTo("/dashboard")}
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-content">
          <h1>GourmetRec</h1>

          <nav className="product-details-nav">
            <button onClick={() => goTo("/dashboard")}>
              Início
            </button>

            <button onClick={() => goTo("/recommendations")}>
              Recomendações
            </button>

            <button onClick={() => goTo("/history")}>
              Histórico
            </button>
          </nav>

          {userName && (
            <span className="product-details-user">
              Olá, {userName}
            </span>
          )}
        </div>
      </header>

      <main className="dashboard-content">
        <button
          className="product-details-back-button"
          onClick={() => goTo("/dashboard")}
        >
          ← Voltar
        </button>

        <section className="product-details-card">
          <div className="product-details-image-container">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="product-details-image"
              />
            ) : (
              <div className="product-details-image-placeholder">
                Imagem indisponível
              </div>
            )}
          </div>

          <div className="product-details-info">
            <h2>{product.title}</h2>

            <p className="product-details-description">
              {product.description || "Descrição não disponível."}
            </p>

            {product.price !== null &&
              product.price !== undefined && (
                <p className="product-details-price">
                  Preço:{" "}
                  {typeof product.price === "number"
                    ? `R$ ${product.price.toFixed(2)}`
                    : product.price}
                </p>
              )}

            <p className="product-details-asin">
              ASIN: {product.parent_asin}
            </p>
          </div>
        </section>

        <section className="product-rating-section">
          <h2>Sua avaliação</h2>

          {!userId ? (
            <p>
              Não foi possível identificar o usuário. Volte à página inicial
              e selecione seu perfil para avaliar este produto.
            </p>
          ) : (
            <>
              <p className="product-rating-description">
                {rating === null
                  ? "Você ainda não avaliou este produto. Selecione de 1 a 5 estrelas."
                  : `Sua avaliação: ${rating} de 5 estrelas`}
              </p>

              <div
                className="product-rating-stars"
                role="group"
                aria-label="Selecione sua avaliação"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      rating !== null && value <= rating
                        ? "selected"
                        : ""
                    }
                    onClick={() => {
                      setRating(value);
                      setRatingMessage("");
                    }}
                    aria-label={`${value} estrelas`}
                    aria-pressed={rating === value}
                    disabled={savingRating}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div className="product-rating-actions">
                <button
                  className="product-rating-save-button"
                  onClick={handleSaveRating}
                  disabled={savingRating || rating === null}
                >
                  {savingRating
                    ? "Salvando..."
                    : hasExistingRating
                    ? "Atualizar avaliação"
                    : "Salvar avaliação"}
                </button>

                {hasExistingRating && (
                  <button
                    className="product-rating-delete-button"
                    onClick={handleDeleteRating}
                    disabled={savingRating}
                  >
                    Remover avaliação
                  </button>
                )}
              </div>

              {ratingMessage && (
                <p className="product-rating-message" role="status">
                  {ratingMessage}
                </p>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default ProductDetails;