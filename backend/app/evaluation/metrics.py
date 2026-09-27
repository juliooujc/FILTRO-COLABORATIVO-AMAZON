import math


def calcular_mae(previsoes):
    if not previsoes:
        return 0.0

    erros = [
        abs(real - previsto)
        for real, previsto in previsoes
    ]

    return sum(erros) / len(erros)


def calcular_rmse(previsoes):
    if not previsoes:
        return 0.0

    erros_quadrados = [
        (real - previsto) ** 2
        for real, previsto in previsoes
    ]

    return math.sqrt(
        sum(erros_quadrados) / len(erros_quadrados)
    )


def calcular_precision_at_k(
    recomendacoes,
    itens_relevantes,
    k=10,
):
    top_k = [
        item["parent_asin"]
        for item in recomendacoes[:k]
    ]

    acertos = sum(
        1
        for item in top_k
        if item in itens_relevantes
    )

    return acertos / k


def calcular_recall_at_k(
    recomendacoes,
    itens_relevantes,
    k=10,
):
    if not itens_relevantes:
        return 0.0

    top_k = {
        item["parent_asin"]
        for item in recomendacoes[:k]
    }

    acertos = len(
        top_k.intersection(itens_relevantes)
    )

    return acertos / len(itens_relevantes)