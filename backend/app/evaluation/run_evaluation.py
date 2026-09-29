# run_evaluation.py

from app.evaluation.evaluator import (
    buscar_usuarios_avaliacao,
    buscar_test_relevantes,
    buscar_test_ratings,
)

from app.evaluation.knn_evaluation import (
    gerar_recomendacoes_avaliacao,
    prever_ratings_produtos,
)

from app.evaluation.metrics import (
    calcular_mae,
    calcular_rmse,
    calcular_precision_at_k,
    calcular_recall_at_k,
)


def executar_experimento(
    method: str,
    k: int,
    limit: int = 10,
    min_common_items: int = 3,
):
    usuarios = buscar_usuarios_avaliacao()

    resultados_usuarios = []

    print()
    print("=" * 70)
    print(f"Método: {method} | K={k}")
    print("=" * 70)

    for indice, user_id in enumerate(usuarios, start=1):

        print(
            f"[{indice}/{len(usuarios)}] "
            f"{user_id}"
        )

        resultado = gerar_recomendacoes_avaliacao(
            user_id=user_id,
            method=method,
            k=k,
            limit=limit,
            min_common_items=min_common_items,
        )

        recomendacoes = resultado["recommendations"]

        itens_relevantes = buscar_test_relevantes(
            user_id
        )

        test_ratings = buscar_test_ratings(
            user_id
        )

        precision = calcular_precision_at_k(
            recomendacoes=recomendacoes,
            itens_relevantes=itens_relevantes,
            k=limit,
        )

        recall = calcular_recall_at_k(
            recomendacoes=recomendacoes,
            itens_relevantes=itens_relevantes,
            k=limit,
        )

        previsoes_dict = prever_ratings_produtos(
        user_id=user_id,
        product_ids=set(test_ratings.keys()),
        method=method,
        k=k,
        min_common_items=min_common_items,
    )

        previsoes = []

        for product_id, previsto in previsoes_dict.items():

            real = test_ratings[product_id]

            previsoes.append(
                (real, previsto)
            )

        mae = calcular_mae(previsoes)
        rmse = calcular_rmse(previsoes)
        predicted_test_items = len(previsoes)

        hits = sum(
            1
            for item in recomendacoes[:limit]
            if item["parent_asin"] in itens_relevantes
        )

        resultados_usuarios.append({
            "user_id": user_id,
            "mae": mae,
            "rmse": rmse,
            "precision": precision,
            "recall": recall,
            "recommendations": len(recomendacoes),
            "test_relevant": len(itens_relevantes),
            "hits": hits,
            "test_items": len(test_ratings),
            "predicted_test_items": predicted_test_items,
        })

    usuarios_com_previsao = [
        resultado
        for resultado in resultados_usuarios
        if resultado["predicted_test_items"] > 0
    ]

    if usuarios_com_previsao:
        mae_medio = sum(
            resultado["mae"]
            for resultado in usuarios_com_previsao
        ) / len(usuarios_com_previsao)

        rmse_medio = sum(
            resultado["rmse"]
            for resultado in usuarios_com_previsao
        ) / len(usuarios_com_previsao)
    else:
        mae_medio = 0.0
        rmse_medio = 0.0

    precision_medio = sum(
        resultado["precision"]
        for resultado in resultados_usuarios
    ) / len(resultados_usuarios)

    recall_medio = sum(
        resultado["recall"]
        for resultado in resultados_usuarios
    ) / len(resultados_usuarios)

    total_previsoes = sum(
        resultado["predicted_test_items"]
        for resultado in resultados_usuarios
    )
    return {
        "method": method,
        "k": k,
        "users": len(resultados_usuarios),
        "users_with_recommendations": len(
            usuarios_com_previsao
        ),
        "mae": mae_medio,
        "rmse": rmse_medio,
        "precision_at_10": precision_medio,
        "recall_at_10": recall_medio,
        "users_results": resultados_usuarios,
        "total_predictions": total_previsoes,
    }