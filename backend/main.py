from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi import Depends
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import User, Lead
from backend.schemas import LeadCreate, LeadOut, LeadUpdate, UserCreate
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI()
security = HTTPBearer()

# Allow frontend requests
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",        # if you’re serving with `serve docs` default
    "https://harikabv.in/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],           # no wildcard when allow_credentials=True
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Secret key for JWT
SECRET_KEY = "secret123"
ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24


class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

@app.post("/auth/request-otp")
def request_otp(data: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"otp": "123456"}

@app.post("/auth/verify-otp")
def verify_otp(data: OTPVerify, db: Session = Depends(get_db)):
    if data.otp != "123456":
        raise HTTPException(status_code=401, detail="Invalid OTP")
    user = db.query(User).filter(User.phone == data.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    payload = {
        "phone": user.phone,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"token": token, "role": user.role}

@app.get("/auth/me")
def read_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    return {"phone": payload["phone"], "role": payload["role"]}

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/leads")
async def create_lead(request: Request, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # if user["role"] != "promotor":
    #     raise HTTPException(status_code=403, detail="Only promotors can create leads")

    data = await request.json()
    new_lead = Lead(
        name=data["name"],
        phone=data["phone"],
        place=data["place"],
        created_by=user["phone"]
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return {"message": "Lead created successfully", "lead_id": new_lead.id}

@app.get("/leads/my")
def get_my_leads(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # print(user)
    # if user["role"] != "promotor":
    #     raise HTTPException(status_code=403, detail="Only promotors can access their leads")
    # print("User ", user)
    leads = db.query(Lead).filter_by(created_by=user["phone"]).order_by(Lead.created_at.desc()).all()
    return [
        {
            "id": lead.id,
            "name": lead.name,
            "phone": lead.phone,
            "place": lead.place,
            "created_at": lead.created_at.isoformat()
        } for lead in leads
    ]

@app.get("/leads", response_model=list[LeadOut])
def get_all_leads(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    print(current_user)
    if current_user.get('role') not in ("executive", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    leads = db.query(Lead).filter().all()
    return leads

@app.put("/leads/{id}", response_model=LeadOut)
def update_lead(
    id: int,
    update: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.get("role") not in ("executive", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    for field, value in update.dict(exclude_unset=True).items():
        setattr(lead, field, value)

    db.commit()
    db.refresh(lead)
    return lead


@app.post("/users/create")
async def create_user(user: UserCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    # Logic to add user to DB and assign role
    new_user = User(**user.dict())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/all")
async def get_all_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")
    users = db.query(User).all()
    return users

