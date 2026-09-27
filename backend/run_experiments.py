from app.evaluation.run_evaluation import (
    executar_experimento,
)


EXPERIMENTOS = [
    ("cosine", 5),
    ("cosine", 11),
    ("cosine", 21),
    ("pearson", 5),
    ("pearson", 11),
    ("pearson", 21),
]


resultados = []


for method, k in EXPERIMENTOS:

    resultado = executar_experimento(
        method=method,
        k=k,
        limit=10,
        min_common_items=3,
    )

    resultados.append(resultado)

    print()
    print("RESULTADO")
    print("-" * 40)
    print("Método:", method)
    print("K:", k)
    print("Usuários:", resultado["users"])
    print(
        "Com recomendações:",
        resultado["users_with_recommendations"],
    )
    print("MAE:", resultado["mae"])
    print("RMSE:", resultado["rmse"])
    print(
        "Precision@10:",
        resultado["precision_at_10"],
    )
    print(
        "Recall@10:",
        resultado["recall_at_10"],
    )
    print("Previsões de teste:", resultado["total_predictions"])


print()
print("=" * 80)
print("RESUMO FINAL")
print("=" * 80)

print(
    f"{'Método':<10}"
    f"{'K':<5}"
    f"{'MAE':<12}"
    f"{'RMSE':<12}"
    f"{'Precision@10':<18}"
    f"{'Recall@10':<15}"
)

for resultado in resultados:

    print(
        f"{resultado['method']:<10}"
        f"{resultado['k']:<5}"
        f"{resultado['mae']:<12.4f}"
        f"{resultado['rmse']:<12.4f}"
        f"{resultado['precision_at_10']:<18.4f}"
        f"{resultado['recall_at_10']:<15.4f}"
    )