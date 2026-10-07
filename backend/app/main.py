from fastapi import FastAPI
from app.routers import auth

app = FastAPI(title="Potter Community Platform API")

app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Potter Community Platform API is running"}

