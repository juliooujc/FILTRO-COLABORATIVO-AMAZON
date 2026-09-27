from fastapi import APIRouter, HTTPException, Query

from app.recommender.recommend import gerar_recomendacoes

router = APIRouter(
    prefix="/users",
    tags=["Recommendations"]
)


@router.get("/{user_id}/recommendations")
def get_recommendations(
    user_id: str,
    method: str = Query(
        default="cosine",
        pattern="^(cosine|pearson)$"
    ),
    k: int = Query(
        default=5,
        ge=1,
        le=100
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100
    ),
    min_common_items: int = Query(
        default=3,
        ge=1,
        le=50
    ),
):

    try:
        result = gerar_recomendacoes(
            user_id=user_id,
            method=method,
            k=k,
            limit=limit,
            min_common_items=min_common_items,
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )