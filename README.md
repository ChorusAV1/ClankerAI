# ClankerAI - Asistente de deciciones predictivo

## Instrucciones de instalación (Windows powershell)

### Backend:
1. Clonar repositorio
```
git clone https://github.com/ChorusAV1/ClankerAI
```

2. Entrar al directorio del back
```
cd .\ClankerAI\ClankerAI-Back
```

3. Crear el entorno virtual
```
py -3.13 -m venv .venv
```

4. Preparar las dependencias compatibles con windows
```
$devRequirements = Join-Path $env:TEMP 'clankerai-requirements.txt'
```
```
Get-Content .\requirements.txt | Where-Object { $_ -notmatch '^uvloop==' } | Set-Content -Encoding ascii $devRequirements
```

5. Instalar dependencias
```
.\.venv\Scripts\python.exe -m pip install -r $devRequirements
```

6. Generar datos sintéticos
```
python scripts/generar_historial_clankerai.py data/E-commerce_Customer_Segmentation_2026.xlsx
```

7. Copiar el archivo historial_ventas_simulado.csv que generó el comando anterior que está en `ClankerAI-Back\data\datos_simulados_clankerai\` a `ClankerAI-Back\data\synthetic\`
```
Copy-Item -Path "data\datos_simulados_clankerai\historial_ventas_simulado.csv" -Destination "data\synthetic\"
```

8. Ejecutar el back
```
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --loop asyncio --host 127.0.0.1 --port 8000
```

### Frontend:
1. Entrar al directorio del front
```
cd ClankerAI-Front
```

2. Instalar dependencias
```
npm install --legacy-peer-deps
```

3. Ejecutar 
```
npm run dev
```

#### Una vez con el front y back ejecutándose, abrir la URL http://localhost:5173/
#### El modelo del back tarda tiempo en procesar los datos por lo que es normal que en las pantallas del dashboard aparezca "Cargando resumen...", tras unos momentos los datos se mostrarán.