from fastapi import FastAPI

# Create apolication instance
app = FastAPI()

# Example GET route
@app.get("/")
def read_root():
    return {"message": "Hello wold"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}