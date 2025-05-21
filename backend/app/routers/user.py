from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import os
from typing import List

router = APIRouter(tags=["user"])
auth_scheme = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "secretkey")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
    return payload.get("phone")

@router.get("/leads/today")
def leads_today(db: Session = Depends(get_db), phone: str = Depends(get_current_user)):
    count = crud.get_today_leads_count(db, phone)
    return {"count": count}

@router.get("/doctors", response_model=List[schemas.DoctorOut])
def search_doctors(search: str = "", db: Session = Depends(get_db), phone: str = Depends(get_current_user)):
    doctors = crud.search_doctors(db, search)
    return doctors

@router.post("/leads", response_model=schemas.LeadOut)
def create_lead(lead: schemas.LeadCreate, db: Session = Depends(get_db), phone: str = Depends(get_current_user)):
    return crud.create_lead(db, phone, lead)
