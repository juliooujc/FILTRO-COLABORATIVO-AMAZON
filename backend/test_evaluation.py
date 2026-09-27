from app.evaluation.knn_evaluation import (
    gerar_recomendacoes_avaliacao,
)
from app.evaluation.evaluator import buscar_timestamp_corte_train

USER_ID = "AE2EG4D7PRYCZUCKWHCB7I767NCA"


resultado = gerar_recomendacoes_avaliacao(
    user_id=USER_ID,
    method="cosine",
    k=5,
    limit=10,
    min_common_items=3,
)


print("Usuário:", resultado["user_id"])

print("\nVizinhos:")
for neighbor in resultado["neighbors"]:
    print(
        neighbor["user_id"],
        "similaridade=",
        neighbor["similarity"],
        "comuns=",
        neighbor["common_items"],
    )

print("\nRecomendações:")
for recommendation in resultado["recommendations"]:
    print(
        recommendation["parent_asin"],
        "score=",
        recommendation["score"],
    )


timestamp_corte = buscar_timestamp_corte_train(USER_ID)

print("\nTimestamp de corte:")
print(timestamp_corte)