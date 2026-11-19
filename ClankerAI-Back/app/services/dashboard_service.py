from pathlib import Path
from functools import lru_cache
import json
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
DATASET = BASE_DIR / "data" / "E-commerce_Customer_Segmentation_2026.xlsx"
METRICS = BASE_DIR / "models" / "metrics.json"
CLIENTES_MANUALES = BASE_DIR / "data" / "manual" / "clientes_nuevos.csv"


@lru_cache(maxsize=1)
def cargar_clientes():
    """Dataset original: se conserva en caché porque no cambia."""
    return pd.read_excel(DATASET)


def cargar_clientes_manuales():
    """Leer en cada consulta para detectar nuevos registros sin reiniciar FastAPI."""
    if not CLIENTES_MANUALES.is_file() or CLIENTES_MANUALES.stat().st_size == 0:
        return pd.DataFrame(columns=["customer_id", "categoria_preferida"])

    manuales = pd.read_csv(CLIENTES_MANUALES, dtype=str, keep_default_na=False)
    for columna in ("customer_id", "categoria_preferida"):
        if columna not in manuales.columns:
            manuales[columna] = ""
    manuales["customer_id"] = manuales["customer_id"].str.strip()
    manuales["categoria_preferida"] = manuales["categoria_preferida"].str.strip()
    return manuales[manuales["customer_id"] != ""].drop_duplicates(
        subset=["customer_id"], keep="first"
    )


def clientes_manuales_nuevos(originales, manuales):
    """Excluir IDs que ya existen en el Excel para no contar duplicados."""
    if "customer_id" not in originales.columns or manuales.empty:
        return manuales
    existentes = set(originales["customer_id"].dropna().astype(str).str.strip())
    return manuales[~manuales["customer_id"].isin(existentes)]


def obtener_resumen():
    originales = cargar_clientes()
    nuevos = clientes_manuales_nuevos(originales, cargar_clientes_manuales())

    return {
        "total_clientes": int(len(originales) + len(nuevos)),
        # Los clientes manuales no tienen datos financieros ni riesgo de churn.
        # Por eso estas métricas se calculan únicamente con los registros completos.
        "gasto_total_usd": round(float(originales["total_spent_usd"].sum()), 2),
        "ticket_promedio_usd": round(float(originales["avg_order_value_usd"].mean()), 2),
        "riesgo_abandono": {
            str(k): int(v)
            for k, v in originales["churn_risk_category"].value_counts().items()
        },
    }


def obtener_categorias():
    originales = cargar_clientes()
    nuevos = clientes_manuales_nuevos(originales, cargar_clientes_manuales())
    categorias_originales = originales["preferred_category_1"].dropna().astype(str).str.strip()
    categorias_nuevas = nuevos["categoria_preferida"].astype(str).str.strip()
    categorias = pd.concat([categorias_originales, categorias_nuevas], ignore_index=True)
    categorias = categorias[~categorias.str.lower().isin(("", "none", "nan"))]
    conteo = categorias.value_counts()
    total_clientes = len(originales) + len(nuevos)

    return [
        {
            "categoria": str(categoria),
            "clientes": int(total),
            "porcentaje": round(float(total / total_clientes * 100), 2) if total_clientes else 0.0,
        }
        for categoria, total in conteo.items()
    ]


def obtener_metricas():
    with open(METRICS, encoding="utf-8") as archivo:
        return json.load(archivo)
