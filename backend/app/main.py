from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.users import router as users_router
from app.api.recommendations import router as recommendations_router
from app.api.ratings import router as ratings_router
from app.api.products import router as products_router


app = FastAPI(
    title="Amazon Recommender",
    description="Sistema de recomendação baseado em filtragem colaborativa.",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(users_router)
app.include_router(recommendations_router)
app.include_router(ratings_router)
app.include_router(products_router)


@app.get("/")
def root():
    return {
        "message": "Amazon Recommender API",
        "status": "online"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}