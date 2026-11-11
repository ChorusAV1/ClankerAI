from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

from app.controllers.prediction_controller import realizar_prediccion

router = APIRouter(prefix="/api", tags=["Predicciones"])


class ClienteInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    age: int
    tenure_months: int
    total_purchases: int
    avg_order_value_usd: float
    days_since_last_purchase: int
    return_count: int
    complaint_count: int
    satisfaction_score: float
    email_open_rate: float
    click_through_rate: float
    conversion_rate: float


@router.post("/predict")
def predict(cliente: ClienteInput):
    try:
        return realizar_prediccion(cliente.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))