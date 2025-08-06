from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./cyberguard.db"

# Create engine
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class
Base = declarative_base()

# User model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default="analyst")  # admin, analyst, viewer
    created_at = Column(DateTime, default=datetime.now)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    logs = relationship("UserLog", back_populates="user")
    risk_scores = relationship("RiskScore", back_populates="user")

# User activity logs
class UserLog(Base):
    __tablename__ = "user_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.now)
    action = Column(String)  # login, file_access, download, etc.
    resource = Column(String)  # file path, system name, etc.
    location = Column(String)  # IP address or location
    success = Column(Boolean, default=True)
    risk_score = Column(Float, default=5.0)
    
    # Relationships
    user = relationship("User", back_populates="logs")

# Risk scores
class RiskScore(Base):
    __tablename__ = "risk_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    current_score = Column(Float, default=5.0)
    previous_score = Column(Float, default=5.0)
    last_updated = Column(DateTime, default=datetime.now)
    explanation = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="risk_scores")

# Create tables
Base.metadata.create_all(bind=engine)