from fastapi import APIRouter

from app.db.queries import (
    buscar_historico_usuario,
    buscar_usuarios,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("")
def get_users():
    users = buscar_usuarios()

    return {
        "users": users
    }


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