from fastapi import FastAPI

# Create apolication instance
app = FastAPI()

from app.views.prediction_view import router as prediction_router

app.include_router(prediction_router)

from app.views.dashboard_view import router as dashboard_router

app.include_router(dashboard_router)

# Example GET route
@app.get("/")
def read_root():
    return {"message": "Hello wold"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

from app.views.status_view import router as status_router

app.include_router(status_router)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)