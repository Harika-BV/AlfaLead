from sqlalchemy import select, func
from sqlalchemy.orm import Session
from . import models, schemas
from datetime import date

def create_user_if_not_exists(db: Session, phone: str):
    result = db.execute(select(models.User).filter_by(phone=phone))
    user = result.scalars().first()
    if not user:
        user = models.User(phone=phone)
        db.add(user)
        db.commit()
    return user

def get_today_leads_count(db: Session, phone: str):
    today = date.today()
    stmt = select(func.count(models.Lead.id)).filter(
        models.Lead.user_phone == phone,
        func.date(models.Lead.created_at) == today
    )
    result = db.execute(stmt)
    return result.scalar()

def search_doctors(db: Session, search: str):
    stmt = select(models.Doctor).filter(
        models.Doctor.name.ilike(f"%{search}%") |
        models.Doctor.phone.ilike(f"%{search}%") |
        models.Doctor.place.ilike(f"%{search}%")
    )
    result = db.execute(stmt)
    return result.scalars().all()

def create_lead(db: Session, user_phone: str, lead_in: schemas.LeadCreate):
    lead = models.Lead(
        user_phone=user_phone,
        doctor_id=lead_in.doctor_id,
        ocr_data=lead_in.ocr_data,
        speech_data=lead_in.speech_data,
        comments=lead_in.comments
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead

def get_admin_stats(db: Session):
    today = date.today()
    total_leads = (db.execute(
        select(func.count(models.Lead.id)).filter(func.date(models.Lead.created_at) == today)
    )).scalar()
    total_users = (db.execute(
        select(func.count(models.User.id)))
    ).scalar()
    return {"todayLeads": total_leads, "totalUsers": total_users}

def get_all_admins(db: Session):
    result = db.execute(select(models.Admin))
    return result.scalars().all()

def create_admin(db: Session, admin_in: schemas.AdminCreate):
    admin = models.Admin(name=admin_in.name, phone=admin_in.phone)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
