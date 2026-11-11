
from pathlib import Path
import json
import time

import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

BASE_DIR = Path(__file__).resolve().parents[2]
DATASET = BASE_DIR / "data/processed/clientes_limpios.csv"
OUTPUT = BASE_DIR / "models"

TARGET = "churn_risk_category"


def entrenar():
    print("[INFO] Cargando dataset...")
    df = pd.read_csv(DATASET)

    X = df.drop(columns=[TARGET])
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    print(f"[INFO] Entrenamiento: {len(X_train)} registros")
    print(f"[INFO] Prueba: {len(X_test)} registros")

    modelos = {
"Random Forest": RandomForestClassifier(
    n_estimators=150,
    max_depth=12,
    min_samples_leaf=5,
    random_state=42,
    class_weight="balanced_subsample",
    n_jobs=-1
),
        "Regresion Logistica": Pipeline([
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(
                max_iter=2000,
                class_weight="balanced"
            ))
        ])
    }

    OUTPUT.mkdir(exist_ok=True)
    resultados = {}

    for nombre, modelo in modelos.items():
        print(f"\n[INFO] Entrenando {nombre}...")

        inicio = time.perf_counter()
        modelo.fit(X_train, y_train)
        tiempo = time.perf_counter() - inicio

        pred = modelo.predict(X_test)

        accuracy = accuracy_score(y_test, pred)
        f1 = f1_score(y_test, pred, average="macro")
        train_accuracy = modelo.score(X_train, y_train)

        print(f"Accuracy Test: {accuracy:.4f}")
        print(f"F1 Macro: {f1:.4f}")
        print(f"Accuracy Train: {train_accuracy:.4f}")
        print(f"Tiempo: {tiempo:.2f} segundos")
        print(classification_report(y_test, pred, zero_division=0))
        print("Matriz de confusión:")
        print(confusion_matrix(y_test, pred))

        archivo = (
            "random_forest.joblib"
            if nombre == "Random Forest"
            else "logistic_regression.joblib"
        )

        joblib.dump(modelo, OUTPUT / archivo)

        resultados[nombre] = {
            "accuracy": round(accuracy, 4),
            "f1_macro": round(f1, 4),
            "train_accuracy": round(train_accuracy, 4),
            "tiempo_segundos": round(tiempo, 2),
            "archivo": archivo
        }

    with open(OUTPUT / "metrics.json", "w") as f:
        json.dump(resultados, f, indent=4)

    ganador = max(
        resultados,
        key=lambda n: resultados[n]["f1_macro"]
    )

    print(f"\n[SUCCESS] Modelo ganador: {ganador}")
    print("[SUCCESS] Modelos y métricas guardados.")


if __name__ == "__main__":
    entrenar()
