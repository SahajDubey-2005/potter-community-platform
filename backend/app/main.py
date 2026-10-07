from fastapi import FastAPI

app = FastAPI(title="Potter Community Platform API")

@app.get("/")
def read_root():
    return {"message": "Potter Community Platform API is running"}

