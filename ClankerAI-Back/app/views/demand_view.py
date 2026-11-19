"""Consulta predicciones precomputadas e historial semanal sintético."""
import csv
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api", tags=["Demanda"])
ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "synthetic"
PREDICTIONS = DATA / "prediccion_12_semanas" / "predicciones_futuras_12s.csv"
HISTORY = DATA / "demanda_semanal.csv"
METRICS = ROOT / "models" / "demand_metrics.json"


def load_csv(path: Path):
    if not path.is_file():
        raise HTTPException(status_code=503, detail=f"Falta el archivo {path.name}. Ejecuta scripts/entrenar_demanda.py")
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


@router.get("/demand-forecast")
def demand_forecast(category: str = Query(..., min_length=1), weeks: int = Query(12, ge=1, le=12)):
    forecasts = load_csv(PREDICTIONS)
    categories = sorted({r["categoria"] for r in forecasts})
    if category not in categories:
        raise HTTPException(status_code=404, detail=f"Categoría desconocida: {category}. Disponibles: {', '.join(categories)}")

    predictions = sorted(
        (r for r in forecasts if r["categoria"] == category),
        key=lambda r: r["semana_inicio"]
    )[:weeks]
    history = sorted(
        (r for r in load_csv(HISTORY) if r["categoria"] == category),
        key=lambda r: r["semana_inicio"]
    )[-12:]
    metrics = json.loads(METRICS.read_text(encoding="utf-8")) if METRICS.is_file() else None

    return {
        "categoria": category,
        "semanas": weeks,
        "origen_datos": "sintetico",
        "historico": [{"semana_inicio": r["semana_inicio"], "unidades": int(float(r["unidades_simuladas"]))} for r in history],
        "pronostico": [{"semana_inicio": r["semana_inicio"], "unidades": int(float(r["unidades_predichas"]))} for r in predictions],
        "total_previsto": sum(int(float(r["unidades_predichas"])) for r in predictions),
        "metricas": metrics,
    }
