
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
DATASET = BASE_DIR / "data" / "E-commerce_Customer_Segmentation_2026.xlsx"
OUTPUT = BASE_DIR / "data" / "processed"

FEATURES = [
    "age",
    "tenure_months",
    "total_purchases",
    "avg_order_value_usd",
    "days_since_last_purchase",
    "return_count",
    "complaint_count",
    "satisfaction_score",
    "email_open_rate",
    "click_through_rate",
    "conversion_rate",
]

TARGET = "churn_risk_category"


def preprocess():
    print("[INFO] Cargando dataset...")
    df = pd.read_excel(DATASET)
    print(f"[INFO] Registros originales: {len(df)}")

    columnas = FEATURES + [TARGET]
    df = df[columnas].copy()

    for columna in FEATURES:
        df[columna] = pd.to_numeric(
            df[columna], errors="coerce"
        )

    df = df.dropna(subset=[TARGET])
    df[TARGET] = df[TARGET].astype(str).str.strip()
    df = df[df[TARGET] != ""]

    for columna in FEATURES:
        df[columna] = df[columna].fillna(
            df[columna].median()
        )

    OUTPUT.mkdir(parents=True, exist_ok=True)
    destino = OUTPUT / "clientes_limpios.csv"

    df.to_csv(destino, index=False)

    print(f"[SUCCESS] Registros procesados: {len(df)}")
    print(f"[SUCCESS] Archivo guardado: {destino}")
    print("[INFO] Clases disponibles:")
    print(df[TARGET].value_counts())


if __name__ == "__main__":
    preprocess()
