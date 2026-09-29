from fastapi import APIRouter, HTTPException

from app.db.queries import (
    buscar_historico_usuario,
    buscar_usuarios,
    criar_usuario,
    usuario_existe,
)

from app.models.schemas import UserRequest


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


@router.post("")
def create_user(request: UserRequest):

    if usuario_existe(request.user_id):
        raise HTTPException(
            status_code=409,
            detail="Usuário já existe."
        )

    try:
        criar_usuario(request.user_id)

        return {
            "message": "Usuário criado.",
            "user_id": request.user_id
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
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