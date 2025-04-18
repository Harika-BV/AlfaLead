from sqlalchemy import Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, TIMESTAMP, Boolean, ForeignKey

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    phone = Column(String, primary_key=True, index=True)
    role = Column(String)  # 'admin', 'executive', or 'promotor'
    created_at = Column(DateTime, default=datetime.utcnow)

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    phone = Column(Text, nullable=False)
    place = Column(Text, nullable=False)
    created_by = Column(Text, ForeignKey("users.phone"), nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    is_archived = Column(Boolean, default=False)