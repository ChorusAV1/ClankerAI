"""Entrena y guarda un Random Forest para demanda semanal sintética de ClankerAI.
Ejecutar desde ClankerAI-Back: .venv/bin/python scripts/entrenar_demanda.py
"""
from pathlib import Path
from datetime import timedelta
import json
import math
import numpy as np
import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'synthetic'
PREP = DATA / 'prediccion_12_semanas'
MODELS = ROOT / 'models'
TARGET = 'unidades_simuladas'
FEATURES = ['categoria', 'anio', 'mes', 'semana_anio', 'mes_sin', 'mes_cos',
            'tendencia_semana', 'lag_1', 'lag_2', 'lag_4', 'lag_8', 'lag_12',
            'media_4s', 'media_8s', 'media_12s']


def build_model():
    prep = ColumnTransformer([
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['categoria']),
        ('num', 'passthrough', [x for x in FEATURES if x != 'categoria']),
    ])
    return Pipeline([
        ('preprocess', prep),
        ('regressor', RandomForestRegressor(n_estimators=250, min_samples_leaf=2,
                                            max_features=0.9, random_state=42, n_jobs=-1))
    ])


def build_one(date, cat, idx, history):
    if len(history) < 12:
        raise ValueError(f'No hay 12 semanas anteriores para {cat}')
    return {
        'categoria': cat,
        'anio': date.year,
        'mes': date.month,
        'semana_anio': date.isocalendar().week,
        'mes_sin': round(math.sin(2 * math.pi * (date.month - 1) / 12), 6),
        'mes_cos': round(math.cos(2 * math.pi * (date.month - 1) / 12), 6),
        'tendencia_semana': idx,
        **{f'lag_{n}': float(history[-n]) for n in [1, 2, 4, 8, 12]},
        **{f'media_{n}s': round(float(np.mean(history[-n:])), 4) for n in [4, 8, 12]},
    }


def recursive_forecast(model, weekly, start, end):
    """Usa solo historia anterior a start; cada pronóstico alimenta el siguiente."""
    date_list = sorted(weekly['semana_inicio'].unique())
    all_dates_before = [d for d in date_list if d < start]
    if len(all_dates_before) < 12:
        raise ValueError('Historial insuficiente antes de la fecha inicial')
    out = []
    cats = sorted(weekly['categoria'].unique())
    # Un pronóstico para cada categoría y semana, sin consultar datos reales futuros.
    for cat in cats:
        series = weekly.set_index(['categoria','semana_inicio'])[TARGET]
        hist = [float(series.loc[(cat,d)]) for d in all_dates_before]
        for idx, dt in enumerate(pd.date_range(start, end, freq='7D'), start=len(all_dates_before)):
            row = build_one(dt, cat, idx, hist)
            prediction = max(0, float(model.predict(pd.DataFrame([row])[FEATURES])[0]))
            out.append({'semana_inicio': dt.strftime('%Y-%m-%d'), 'categoria': cat,
                        'unidades_predichas': round(prediction), 'paso_pronostico': idx-len(all_dates_before)+1})
            hist.append(prediction)
    return pd.DataFrame(out).sort_values(['semana_inicio','categoria']).reset_index(drop=True)


def main():
    for name in ['demanda_entrenamiento.csv','demanda_validacion_12s.csv','calendario_futuro_12s.csv']:
        if not (PREP / name).exists():
            raise FileNotFoundError(f'Falta: {PREP / name}')
    if not (DATA / 'demanda_semanal.csv').exists():
        raise FileNotFoundError(f'Falta: {DATA / "demanda_semanal.csv"}')

    train = pd.read_csv(PREP / 'demanda_entrenamiento.csv', encoding='utf-8-sig')
    valid = pd.read_csv(PREP / 'demanda_validacion_12s.csv', encoding='utf-8-sig')
    calendar = pd.read_csv(PREP / 'calendario_futuro_12s.csv', encoding='utf-8-sig')
    weekly = pd.read_csv(DATA / 'demanda_semanal.csv', encoding='utf-8-sig')
    weekly['semana_inicio'] = pd.to_datetime(weekly['semana_inicio'])
    weekly = weekly.sort_values(['semana_inicio','categoria']).reset_index(drop=True)

    model = build_model()
    model.fit(train[FEATURES], train[TARGET])
    valid_start = pd.to_datetime(valid['semana_inicio'].min())
    valid_end = pd.to_datetime(valid['semana_inicio'].max())
    predicted = recursive_forecast(model, weekly, valid_start, valid_end)
    actual = valid[['semana_inicio','categoria',TARGET]].copy()
    checked = predicted.merge(actual, on=['semana_inicio','categoria'], validate='one_to_one')
    errors = np.abs(checked[TARGET] - checked['unidades_predichas'])
    metrics = {
        'modelo': 'RandomForestRegressor',
        'origen_datos': 'sintetico',
        'tipo_evaluacion': 'pronostico_recursivo_12_semanas_sin_valores_futuros',
        'filas_entrenamiento': int(len(train)),
        'filas_validacion': int(len(checked)),
        'mae_unidades': round(float(mean_absolute_error(checked[TARGET], checked['unidades_predichas'])), 3),
        'rmse_unidades': round(float(np.sqrt(mean_squared_error(checked[TARGET], checked['unidades_predichas']))), 3),
        'wape_porcentaje': round(float(errors.sum() / max(checked[TARGET].sum(), 1) * 100), 3),
    }
    # Referencia simple: últimas 4 semanas conocidas, congeladas durante las 12 predichas.
    simple_rows = []
    for cat in sorted(weekly['categoria'].unique()):
        h = weekly[(weekly['categoria']==cat) & (weekly['semana_inicio']<valid_start)][TARGET].tail(4)
        simple_rows.append((cat, float(h.mean())))
    baseline = dict(simple_rows)
    metrics['wape_baseline_4s_porcentaje'] = round(float((checked.apply(
        lambda r: abs(r[TARGET] - baseline[r['categoria']]), axis=1).sum()
        / max(checked[TARGET].sum(), 1)) * 100), 3)

    # Entrenar versión definitiva con TODOS los datos observados hasta el corte final.
    full = pd.concat([train, valid], ignore_index=True)
    final_model = build_model()
    final_model.fit(full[FEATURES], full[TARGET])
    future_start = pd.to_datetime(calendar['semana_inicio'].min())
    future_end = pd.to_datetime(calendar['semana_inicio'].max())
    future = recursive_forecast(final_model, weekly, future_start, future_end)
    MODELS.mkdir(parents=True, exist_ok=True)
    joblib.dump({'model': final_model, 'features': FEATURES,
                 'target': TARGET, 'data_source': 'synthetic',
                 'last_history_week': str(weekly['semana_inicio'].max().date())},
                MODELS / 'random_forest_demand.joblib')
    (MODELS / 'demand_metrics.json').write_text(json.dumps(metrics, indent=2, ensure_ascii=False), encoding='utf-8')
    checked.to_csv(PREP / 'resultado_validacion_12s.csv', index=False, encoding='utf-8-sig')
    future.to_csv(PREP / 'predicciones_futuras_12s.csv', index=False, encoding='utf-8-sig')
    print('\nModelo guardado:', MODELS / 'random_forest_demand.joblib')
    print('Métricas:', MODELS / 'demand_metrics.json')
    print('Pronóstico:', PREP / 'predicciones_futuras_12s.csv')
    print('Validación:', PREP / 'resultado_validacion_12s.csv')
    print('\n', json.dumps(metrics, indent=2, ensure_ascii=False))
    if metrics['wape_porcentaje'] > metrics['wape_baseline_4s_porcentaje']:
        print('\nADVERTENCIA: el modelo NO superó la referencia de promedio 4 semanas.')


if __name__ == '__main__':
    main()
