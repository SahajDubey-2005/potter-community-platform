from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary in-memory database for testing
fake_users_db = []

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "CITIZEN"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@app.get("/")
def read_root():
    return {"message": "Potter Platform Backend Running!"}

@app.post("/auth/register")
def register(user: UserRegister):
    for u in fake_users_db:
        if u["email"] == user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    new_user = {
        "id": len(fake_users_db) + 1,
        "full_name": user.full_name,
        "email": user.email,
        "password": user.password,
        "role": user.role
    }
    fake_users_db.append(new_user)
    return {"message": "User registered successfully", "user_id": new_user["id"]}

@app.post("/auth/login")
def login(credentials: UserLogin):
    for u in fake_users_db:
        if u["email"] == credentials.email and u["password"] == credentials.password:
            return {
                "access_token": "mock-jwt-token-for-testing",
                "token_type": "bearer"
            }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials"
    )

@app.get("/auth/me")
def get_current_user():
    # Returning the first registered user as mockup profile for testing
    if fake_users_db:
        return fake_users_db[0]
    raise HTTPException(status_code=404, detail="User not found")