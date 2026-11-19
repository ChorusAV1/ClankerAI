#!/usr/bin/env python3
"""Genera historial sintético y demanda semanal desde el Excel de ClankerAI.

No modifica el original. Usa solo la biblioteca estándar de Python.
Uso:
 python generar_historial_clankerai.py 'E-commerce_Customer_Segmentation_2026(1).xlsx'
"""
import csv
import random
import sys
import zipfile
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET

SEMILLA = 20261119
FECHA_CORTE = date(2026, 11, 1)  # fecha de referencia, no 'hoy'
INICIO_HISTORIAL = date(2024, 11, 1)
PREFERENCIAS = ('preferred_category_1', 'preferred_category_2', 'preferred_category_3')
COLUMNAS = ('customer_id', 'tenure_months', 'total_purchases', 'days_since_last_purchase',
            'avg_order_value_usd', *PREFERENCIAS)
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def leer_filas_excel(ruta):
    """Lee la primera hoja XLSX de manera incremental, incluso para archivos grandes."""
    with zipfile.ZipFile(ruta) as archivo:
        compartidos = []
        if 'xl/sharedStrings.xml' in archivo.namelist():
            with archivo.open('xl/sharedStrings.xml') as entrada:
                for _, elem in ET.iterparse(entrada, events=('end',)):
                    if elem.tag == NS + 'si':
                        compartidos.append(''.join((t.text or '') for t in elem.iter(NS + 't')))
                        elem.clear()
        with archivo.open('xl/worksheets/sheet1.xml') as entrada:
            cabeceras = None
            for _, elem in ET.iterparse(entrada, events=('end',)):
                if elem.tag != NS + 'row':
                    continue
                fila = {}
                for celda in elem.findall(NS + 'c'):
                    ref = celda.attrib.get('r', '')
                    col = ''.join(c for c in ref if c.isalpha())
                    valor_elem = celda.find(NS + 'v')
                    if celda.attrib.get('t') == 'inlineStr':
                        valor = ''.join((t.text or '') for t in celda.iter(NS + 't'))
                    else:
                        valor = '' if valor_elem is None else (valor_elem.text or '')
                        if celda.attrib.get('t') == 's' and valor:
                            valor = compartidos[int(valor)]
                    fila[col] = valor
                if cabeceras is None:
                    cabeceras = {col: value for col, value in fila.items()}
                    faltantes = set(COLUMNAS) - set(cabeceras.values())
                    if faltantes:
                        raise ValueError('Faltan columnas: ' + ', '.join(sorted(faltantes)))
                else:
                    yield {name: fila.get(col, '') for col, name in cabeceras.items() if name in COLUMNAS}
                elem.clear()


def numero(valor, por_defecto=0.0):
    try:
        return float(valor)
    except (TypeError, ValueError):
        return por_defecto


def main(ruta):
    origen = Path(ruta)
    if not origen.is_file():
        raise FileNotFoundError(origen)
    carpeta = origen.parent / 'datos_simulados_clankerai'
    carpeta.mkdir(exist_ok=True)
    detalle = carpeta / 'historial_ventas_simulado.csv'
    semanal = carpeta / 'demanda_semanal.csv'
    rng = random.Random(SEMILLA)
    totales = defaultdict(lambda: [0, 0, 0.0])
    clientes = 0
    eventos = 0
    with detalle.open('w', newline='', encoding='utf-8-sig') as salida:
        writer = csv.writer(salida)
        writer.writerow(['fecha_compra', 'customer_id', 'categoria', 'unidades_estimadas',
                         'monto_estimado_usd', 'origen'])
        for cliente in leer_filas_excel(origen):
            identificador = cliente.get('customer_id', '')
            if not identificador:
                continue
            clientes += 1
            compras = max(0, int(numero(cliente.get('total_purchases'))))
            antiguedad = max(1, int(numero(cliente.get('tenure_months'), 1)))
            dias_ultima = max(0, int(numero(cliente.get('days_since_last_purchase'))))
            ultima = FECHA_CORTE - timedelta(days=dias_ultima)
            if ultima > FECHA_CORTE:
                ultima = FECHA_CORTE
            # Antigüedad aproximada: 30.44 días por mes.
            primera_posible = FECHA_CORTE - timedelta(days=round(antiguedad * 30.44))
            # Si los valores de antigüedad y recencia son incompatibles, omitimos el cliente.
            if compras == 0 or ultima < primera_posible:
                continue
            categorias = [str(cliente.get(p, '')).strip() for p in PREFERENCIAS]
            categorias = [c for c in categorias if c and c.lower() not in ('none', 'nan')]
            if not categorias:
                continue
            pesos = [0.60, 0.25, 0.15][:len(categorias)]
            importe_promedio = max(0, numero(cliente.get('avg_order_value_usd')))
            duracion = max(0, (ultima - primera_posible).days)
            # 1 compra en la fecha de última compra; las demás distribuidas uniformemente.
            # Es una hipótesis sintética, NO una recuperación de fechas reales.
            for indice in range(compras):
                fecha = ultima if indice == 0 else primera_posible + timedelta(days=rng.randint(0, duracion))
                if not INICIO_HISTORIAL <= fecha <= FECHA_CORTE:
                    continue
                categoria = rng.choices(categorias, weights=pesos, k=1)[0]
                unidades = rng.choices([1, 2, 3], weights=[0.60, 0.30, 0.10], k=1)[0]
                # No se inventa precio por unidad: el importe representa el valor promedio de PEDIDO.
                monto = round(importe_promedio, 2)
                writer.writerow([fecha.isoformat(), identificador, categoria, unidades,
                                 f'{monto:.2f}', 'sintetico'])
                lunes = fecha - timedelta(days=fecha.weekday())
                agregado = totales[(lunes, categoria)]
                agregado[0] += 1
                agregado[1] += unidades
                agregado[2] += monto
                eventos += 1
            if clientes % 10000 == 0:
                print(f'Clientes procesados: {clientes:,}', flush=True)
    categorias_observadas = sorted({categoria for _, categoria in totales})
    with semanal.open('w', newline='', encoding='utf-8-sig') as salida:
        writer = csv.writer(salida)
        writer.writerow(['semana_inicio', 'categoria', 'pedidos_simulados',
                         'unidades_simuladas', 'importe_simulado_usd', 'origen'])
        lunes = INICIO_HISTORIAL - timedelta(days=INICIO_HISTORIAL.weekday())
        while lunes <= FECHA_CORTE:
            for categoria in categorias_observadas:
                pedidos, unidades, importe = totales.get((lunes, categoria), (0, 0, 0.0))
                writer.writerow([lunes.isoformat(), categoria, pedidos, unidades,
                                 f'{importe:.2f}', 'sintetico'])
            lunes += timedelta(days=7)
    print(f'Clientes leídos: {clientes:,}; transacciones sintéticas exportadas: {eventos:,}')
    print(f'Archivos generados:\n{detalle}\n{semanal}')
    print('ADVERTENCIA: fechas, categorías por transacción y unidades fueron simuladas;')
    print('no sirven para validar desempeño sobre ventas reales.')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Uso: python generar_historial_clankerai.py archivo.xlsx')
    main(sys.argv[1])
