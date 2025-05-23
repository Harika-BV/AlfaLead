from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from jose import jwt
import os

router = APIRouter(prefix="/auth", tags=["auth"])
JWT_SECRET = os.getenv("JWT_SECRET", "secretkey")

@router.post("/request-otp", response_model=schemas.OTPResonse)
def request_otp(data: schemas.OTPRequest):
    return {"phone": data.phone, "otp": "1234"}

@router.post("/verify-otp", response_model=schemas.Token)
def verify_otp(data: schemas.OTPVerify, db: Session = Depends(get_db)):
    if data.otp != "1234":
        raise HTTPException(status_code=401, detail="Invalid OTP")
    crud.create_user_if_not_exists(db, data.phone)
    token = jwt.encode({"phone": data.phone}, JWT_SECRET, algorithm="HS256")
    return {"token": token}
