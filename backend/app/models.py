from sqlalchemy import Column, Integer, String, Boolean, Enum
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    ARTISAN = "ARTISAN"
    CITIZEN = "CITIZEN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.CITIZEN)
    is_active = Column(Boolean, default=True)

