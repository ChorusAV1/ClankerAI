from fastapi import APIRouter
from app.controllers.status_controller import consultar_estado

router = APIRouter(prefix="/api", tags=["Sistema"])

@router.get("/status")
def status():
    return consultar_estado()