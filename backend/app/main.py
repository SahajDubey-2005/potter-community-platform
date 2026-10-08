from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, verification

app = FastAPI(
    title="Potter Community Platform API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(verification.router)

@app.get("/")
def read_root():
    return {"message": "Potter Platform Backend Running!"}