from fastapi import APIRouter, HTTPException

from app.db.queries import buscar_produto


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.get("/{parent_asin}")
def get_product(parent_asin: str):
    product = buscar_produto(parent_asin)

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Produto não encontrado."
        )

    return product