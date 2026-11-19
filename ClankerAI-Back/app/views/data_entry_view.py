"""Registros manuales persistentes; no modifica datasets originales ni modelos."""
import csv
from datetime import date
from pathlib import Path
from threading import Lock
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["Ingreso de datos"])
ROOT = Path(__file__).resolve().parents[2]
MANUAL = ROOT / "data" / "manual"
LOCK = Lock()
CATEGORIES = {
    "Grocery", "Automotive", "Sports & Fitness", "Fashion", "Home & Kitchen", "Books",
    "Electronics", "Office Supplies", "Health & Personal Care", "Pet Supplies", "Toys", "Beauty",
}

class NuevaVenta(BaseModel):
    fecha: date
    categoria: str = Field(min_length=1, max_length=90)
    unidades: int = Field(ge=1, le=1000000)
    monto_usd: float = Field(ge=0, le=100000000)
    customer_id: str = Field(default="", max_length=100)

class NuevoCliente(BaseModel):
    customer_id: str = Field(min_length=1, max_length=100)
    categoria_preferida: str = Field(min_length=1, max_length=90)
    notas: str = Field(default="", max_length=500)


def guardar_csv(nombre: str, campos: list[str], registro: dict):
    MANUAL.mkdir(parents=True, exist_ok=True)
    archivo = MANUAL / nombre
    with LOCK:
        nuevo = not archivo.exists() or archivo.stat().st_size == 0
        with archivo.open("a", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=campos)
            if nuevo:
                writer.writeheader()
            writer.writerow(registro)

@router.post('/data-entry/sales', status_code=201)
def agregar_venta(venta: NuevaVenta):
    if venta.categoria not in CATEGORIES:
        raise HTTPException(status_code=422, detail="Categoría no válida")
    if venta.fecha > date.today():
        raise HTTPException(status_code=422, detail="La fecha no puede estar en el futuro")
    registro = {"id": uuid4().hex, "fecha": venta.fecha.isoformat(), "categoria": venta.categoria,
                "unidades": venta.unidades, "monto_usd": round(venta.monto_usd, 2),
                "customer_id": venta.customer_id.strip(), "origen": "manual"}
    guardar_csv("ventas_nuevas.csv", list(registro), registro)
    return {"status": "success", "mensaje": "Venta guardada", "registro": registro}

@router.post('/data-entry/customers', status_code=201)
def agregar_cliente(cliente: NuevoCliente):
    if cliente.categoria_preferida not in CATEGORIES:
        raise HTTPException(status_code=422, detail="Categoría no válida")
    registro = {"customer_id": cliente.customer_id.strip(), "categoria_preferida": cliente.categoria_preferida,
                "notas": cliente.notas.strip(), "fecha_registro": date.today().isoformat(), "origen": "manual"}
    if not registro['customer_id']:
        raise HTTPException(status_code=422, detail="Indica el identificador del cliente")
    archivo = MANUAL / "clientes_nuevos.csv"
    with LOCK:
        MANUAL.mkdir(parents=True, exist_ok=True)
        if archivo.exists():
            with archivo.open(encoding='utf-8', newline='') as f:
                if any(r.get('customer_id') == registro['customer_id'] for r in csv.DictReader(f)):
                    raise HTTPException(status_code=409, detail="El cliente ya existe en los registros manuales")
        with archivo.open('a', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=list(registro))
            if f.tell() == 0:
                writer.writeheader()
            writer.writerow(registro)
    return {"status": "success", "mensaje": "Cliente guardado", "registro": registro}
