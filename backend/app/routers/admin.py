from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import os
from datetime import date
from typing import List, Optional
from ..models import Lead

router = APIRouter(prefix="/admin", tags=["admin"])
admin_scheme = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "secretkey")

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(admin_scheme)):
    payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
    return payload.get("phone")

@router.get("/stats")
def stats(db: Session = Depends(get_db), phone: str = Depends(get_current_admin)):
    return crud.get_admin_stats(db)

@router.get("/admins", response_model=List[schemas.AdminOut])
def list_admins(db: Session = Depends(get_db), phone: str = Depends(get_current_admin)):
    return crud.get_all_admins(db)

@router.post("/admins", response_model=schemas.AdminOut)
def add_admin(admin_in: schemas.AdminCreate, db: Session = Depends(get_db), phone: str = Depends(get_current_admin)):
    return crud.create_admin(db, admin_in)

@router.get("/leads")
def list_leads(
    from_: Optional[date] = None,
    to: Optional[date] = None,
    user: Optional[str] = None,
    doctor: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin)
):
    q = db.query(Lead)
    if from_:
        q = q.filter(Lead.created_at >= from_)
    if to:
        q = q.filter(Lead.created_at <= to)
    if user:
        q = q.filter(Lead.user_phone == user)
    if doctor:
        # join with Doctor table to filter by name/phone/place
        q = q.join(Doctor).filter(
          or_(
            Doctor.name.ilike(f"%{doctor}%"),
            Doctor.phone.ilike(f"%{doctor}%")
          )
        )
    return q.order_by(Lead.created_at.desc()).all()