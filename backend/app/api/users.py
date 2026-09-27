from fastapi import APIRouter, HTTPException

from app.db.queries import buscar_historico_usuario

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/{user_id}/history")
def get_user_history(user_id: str):

    history = buscar_historico_usuario(user_id)

    if not history:
        return {
            "user_id": user_id,
            "history": [],
            "message": "Usuário sem histórico."
        }

    return {
        "user_id": user_id,
        "history": history
    }