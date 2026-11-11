
from pathlib import Path
import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]

MODELO = joblib.load(
    BASE_DIR / "models" / "random_forest.joblib"
)

FEATURES = list(MODELO.feature_names_in_)


def predecir(entrada: dict) -> dict:
    faltantes = [
        columna for columna in FEATURES
        if columna not in entrada
    ]

    if faltantes:
        raise ValueError(
            f"Faltan campos: {', '.join(faltantes)}"
        )

    datos = pd.DataFrame([entrada])[FEATURES]

    prediccion = MODELO.predict(datos)[0]
    probabilidades = MODELO.predict_proba(datos)[0]

    indice = list(MODELO.classes_).index(prediccion)
    confianza = float(probabilidades[indice])

    return {
        "clase_predicha": str(prediccion),
        "confianza": round(confianza * 100, 2),
        "status": "success"
    }
