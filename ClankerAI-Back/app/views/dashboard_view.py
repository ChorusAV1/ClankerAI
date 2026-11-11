
from fastapi import APIRouter

from app.services.dashboard_service import (
    obtener_resumen,
    obtener_categorias,
    obtener_metricas,
)

router = APIRouter(
    prefix="/api",
    tags=["Dashboard"]
)


@router.get("/overview")
def overview():
    return obtener_resumen()


@router.get("/categories")
def categories():
    return obtener_categorias()


@router.get("/model/performance")
def model_performance():
    return obtener_metricas()
