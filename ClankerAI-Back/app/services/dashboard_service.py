
from pathlib import Path
from functools import lru_cache

import pandas as pd
import json

BASE_DIR = Path(__file__).resolve().parents[2]
DATASET = BASE_DIR / "data" / "E-commerce_Customer_Segmentation_2026.xlsx"
METRICS = BASE_DIR / "models" / "metrics.json"


@lru_cache(maxsize=1)
def cargar_clientes():
    return pd.read_excel(DATASET)


def obtener_resumen():
    df = cargar_clientes()

    return {
        "total_clientes": len(df),
        "gasto_total_usd": round(
            float(df["total_spent_usd"].sum()), 2
        ),
        "ticket_promedio_usd": round(
            float(df["avg_order_value_usd"].mean()), 2
        ),
        "riesgo_abandono": {
            str(k): int(v)
            for k, v in df["churn_risk_category"]
            .value_counts().items()
        }
    }


def obtener_categorias():
    df = cargar_clientes()

    conteo = df["preferred_category_1"].value_counts()

    return [
        {
            "categoria": str(categoria),
            "clientes": int(total),
            "porcentaje": round(
                float(total / len(df) * 100), 2
            )
        }
        for categoria, total in conteo.items()
        if str(categoria).strip().lower() not in ("none", "nan")
    ]


def obtener_metricas():
    with open(METRICS, encoding="utf-8") as archivo:
        return json.load(archivo)
