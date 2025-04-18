from pydantic import BaseModel, Field
from typing import Optional

# ---------- USER SCHEMAS ----------

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str

# ---------- LEAD SCHEMAS ----------

class LeadCreate(BaseModel):
    name: str
    phone: str
    place: str
    email: Optional[str]
    transcript: Optional[str]
    timeToPurchase: Optional[str]
    priceQuoted: Optional[str]

class LeadUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    place: str | None = None
    archived: bool | None = None

class LeadOut(BaseModel):
    id: int
    name: str
    phone: str
    place: str
    created_by: str

    class Config:
        orm_mode = True


# User creation schema
class UserCreate(BaseModel):
    phone: str = Field(..., pattern=r"^\+?[1-9]\d{1,14}$")  # Valid phone number (E.164 format)
    role: str = Field(..., pattern="^(promotor|executive|admin)$")  # Role validation
    
    
    class Config:
        orm_mode = True  # Allow Pydantic models to be used with SQLAlchemy models

# User schema for response (excluding password)
class UserResponse(BaseModel):
    id: int
    phone: str
    role: str

    class Config:
        orm_mode = True
