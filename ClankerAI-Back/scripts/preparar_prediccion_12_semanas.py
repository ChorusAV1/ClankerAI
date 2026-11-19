#!/usr/bin/env python3
"""ClankerAI: prepara datos para entrenar y evaluar un pronóstico de 12 semanas.

Entrada: data/synthetic/demanda_semanal.csv generado con el script anterior.
Salida (sin modificar el Excel original):
  demanda_entrenamiento.csv       -> filas con objetivo y variables históricas
  demanda_validacion_12s.csv      -> últimas 12 semanas observadas, evaluación
  calendario_futuro_12s.csv       -> próximas 12 semanas, SIN ventas inventadas
  resumen_preparacion.txt         -> rango, filas y advertencias

Ejecutar: python preparar_prediccion_12_semanas.py ruta/demanda_semanal.csv
Solo usa bibliotecas estándar de Python.
"""
import argparse
import csv
import math
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

LAGS = (1, 2, 4, 8, 12)
VENTANAS = (4, 8, 12)
COLUMNAS_BASE = ['semana_inicio', 'categoria', 'anio', 'mes', 'semana_anio',
                 'mes_sin', 'mes_cos', 'tendencia_semana']
COLUMNAS_LAGS = [f'lag_{n}' for n in LAGS]
COLUMNAS_MEDIAS = [f'media_{n}s' for n in VENTANAS]
COLUMNAS = COLUMNAS_BASE + COLUMNAS_LAGS + COLUMNAS_MEDIAS
OBJETIVO = 'unidades_simuladas'


def leer_csv(ruta: Path):
    series = defaultdict(dict)
    with ruta.open(encoding='utf-8-sig', newline='') as fd:
        reader = csv.DictReader(fd)
        requeridas = {'semana_inicio', 'categoria', OBJETIVO}
        if not requeridas.issubset(reader.fieldnames or []):
            raise ValueError(f'El CSV debe incluir las columnas: {sorted(requeridas)}')
        for row in reader:
            fecha = date.fromisoformat(row['semana_inicio'])
            if fecha.weekday() != 0:
                raise ValueError(f'La fecha {fecha} no es lunes. Se espera una serie semanal.')
            categoria = row['categoria'].strip()
            if not categoria:
                raise ValueError('Hay una categoría vacía')
            cantidad = int(row[OBJETIVO])
            if cantidad < 0:
                raise ValueError('Existen unidades negativas')
            if fecha in series[categoria]:
                raise ValueError(f'Fila duplicada para {categoria} y {fecha}')
            series[categoria][fecha] = cantidad
    if not series:
        raise ValueError('CSV vacío')
    return series


def fechas_continuas(series):
    fechas = sorted({f for datos in series.values() for f in datos})
    inicio, fin = fechas[0], fechas[-1]
    completas = [inicio + timedelta(weeks=i) for i in range((fin - inicio).days // 7 + 1)]
    if len(fechas) != len(completas):
        raise ValueError('Faltan semanas. Corregir el historial antes de entrenar.')
    for cat, datos in series.items():
        ausentes = [f for f in completas if f not in datos]
        if ausentes:
            raise ValueError(f'Faltan {len(ausentes)} semanas para {cat}; primera: {ausentes[0]}.')
    if len(completas) < 40:
        raise ValueError('Se requieren al menos 40 semanas para preparar entrenamiento y validación.')
    return completas


def caracteristicas(fecha, categoria, indice, historico):
    # Solo se usan semanas ANTERIORES a la semana que intentamos pronosticar.
    numero_mes = fecha.month
    datos = {
        'semana_inicio': fecha.isoformat(), 'categoria': categoria,
        'anio': fecha.year, 'mes': numero_mes,
        'semana_anio': fecha.isocalendar().week,
        'mes_sin': round(math.sin(2 * math.pi * (numero_mes - 1) / 12), 6),
        'mes_cos': round(math.cos(2 * math.pi * (numero_mes - 1) / 12), 6),
        'tendencia_semana': indice,
    }
    for paso in LAGS:
        datos[f'lag_{paso}'] = historico[-paso]
    for n in VENTANAS:
        datos[f'media_{n}s'] = round(sum(historico[-n:]) / n, 4)
    return datos


def escribir_csv(ruta, campos, filas):
    with ruta.open('w', newline='', encoding='utf-8-sig') as fd:
        writer = csv.DictWriter(fd, fieldnames=campos)
        writer.writeheader()
        writer.writerows(filas)


def ejecutar(entrada: Path, salida: Path, horizonte: int):
    series = leer_csv(entrada)
    fechas = fechas_continuas(series)
    if horizonte < 1 or horizonte > 12:
        raise ValueError('El horizonte debe estar entre 1 y 12 semanas')
    if len(fechas) <= max(LAGS) + horizonte + 12:
        raise ValueError('Historial insuficiente para lags, validación y entrenamiento')
    entrenamiento, validacion, futuro = [], [], []
    corte = len(fechas) - horizonte
    categorias = sorted(series)
    for cat in categorias:
        valores = [series[cat][fecha] for fecha in fechas]
        for i in range(max(LAGS), len(fechas)):
            registro = caracteristicas(fechas[i], cat, i, valores[:i])
            registro[OBJETIVO] = valores[i]
            (entrenamiento if i < corte else validacion).append(registro)
        # No conocemos la demanda futura. Los lags deben actualizarse semana a
        # semana con las predicciones del modelo durante el pronóstico recursivo.
        for paso in range(1, horizonte + 1):
            fecha = fechas[-1] + timedelta(weeks=paso)
            registro = {
                'semana_inicio': fecha.isoformat(), 'categoria': cat,
                'anio': fecha.year, 'mes': fecha.month,
                'semana_anio': fecha.isocalendar().week,
                'mes_sin': round(math.sin(2 * math.pi * (fecha.month - 1) / 12), 6),
                'mes_cos': round(math.cos(2 * math.pi * (fecha.month - 1) / 12), 6),
                'tendencia_semana': len(fechas) - 1 + paso,
                'paso_pronostico': paso,
            }
            futuro.append(registro)
    entrenamiento.sort(key=lambda x: (x['semana_inicio'], x['categoria']))
    validacion.sort(key=lambda x: (x['semana_inicio'], x['categoria']))
    futuro.sort(key=lambda x: (x['semana_inicio'], x['categoria']))
    salida.mkdir(parents=True, exist_ok=True)
    escribir_csv(salida / 'demanda_entrenamiento.csv', COLUMNAS + [OBJETIVO], entrenamiento)
    escribir_csv(salida / 'demanda_validacion_12s.csv', COLUMNAS + [OBJETIVO], validacion)
    escribir_csv(salida / 'calendario_futuro_12s.csv', COLUMNAS_BASE + ['paso_pronostico'], futuro)
    resumen = (
        f'Entrada: {entrada}\n'
        f'Semanas históricas: {len(fechas)} ({fechas[0]} a {fechas[-1]})\n'
        f'Categorías: {len(categorias)}\n'
        f'Entrenamiento: {len(entrenamiento)} filas (hasta {fechas[corte-1]})\n'
        f'Validación: {len(validacion)} filas ({fechas[corte]} a {fechas[-1]})\n'
        f'Calendario futuro: {len(futuro)} filas '
        f'({fechas[-1]+timedelta(weeks=1)} a {fechas[-1]+timedelta(weeks=horizonte)})\n\n'
        'IMPORTANTE:\n'
        '- El Excel original no se modifica. El origen de las ventas es SINTÉTICO.\n'
        '- El CSV de futuro NO incluye valores observados ni pronósticos inventados.\n'
        '- Antes de desplegar, entrenar un modelo usando solo entrenamiento.\n'
        '- Para evaluar 12 pasos de verdad, pronosticar recursivamente desde el corte\n'
        '  SIN usar los lags precalculados de validación para semanas posteriores.\n'
        '- Para el pronóstico futuro, construir lags desde el historial y agregar\n'
        '  sucesivamente cada predicción; NO rellenar los lags futuros con ceros.\n'
        '- No interpreta ventas como inventario disponible ni demanda real.\n'
    )
    (salida / 'resumen_preparacion.txt').write_text(resumen, encoding='utf-8')
    print(resumen)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('csv', type=Path, help='Ruta a demanda_semanal.csv')
    parser.add_argument('--salida', type=Path, default=None, help='Carpeta de salida')
    parser.add_argument('--semanas', type=int, default=12, help='Horizonte, 1-12 (predeterminado: 12)')
    args = parser.parse_args()
    ejecutar(args.csv, args.salida or args.csv.parent / 'prediccion_12_semanas', args.semanas)
