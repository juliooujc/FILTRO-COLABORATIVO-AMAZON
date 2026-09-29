from fastapi import APIRouter, HTTPException

from app.db.queries import (
    buscar_historico_usuario,
    buscar_usuario,
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
        criar_usuario(
            request.user_id,
            request.name
        )

        return {
            "message": "Usuário criado.",
            "user_id": request.user_id,
            "name": request.name
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@router.get("/{user_id}/history")
def get_user_history(user_id: str):

    user = buscar_usuario(user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado."
        )

    history = buscar_historico_usuario(user_id)

    if not history:
        return {
            "user_id": user["user_id"],
            "name": user["name"],
            "history": [],
            "message": "Usuário sem histórico."
        }

    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "history": history
    }