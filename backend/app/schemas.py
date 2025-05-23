from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    token: str

class OTPRequest(BaseModel):
    phone: str

class OTPResonse(BaseModel):
    phone: str
    otp: str

class OTPVerify(OTPRequest):
    otp: str

class AdminCreate(BaseModel):
    name: str
    phone: str

class AdminOut(AdminCreate):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True

class DoctorBase(BaseModel):
    name: str
    phone: str
    place: str

class DoctorOut(DoctorBase):
    id: int
    class Config:
        orm_mode = True

class LeadCreate(BaseModel):
    doctor_id: int
    ocr_data: dict
    speech_data: dict
    comments: Optional[str]

class LeadOut(BaseModel):
    id: int
    user_phone: str
    doctor_id: int
    ocr_data: dict
    speech_data: dict
    comments: Optional[str]
    created_at: datetime
    class Config:
        orm_mode = True
