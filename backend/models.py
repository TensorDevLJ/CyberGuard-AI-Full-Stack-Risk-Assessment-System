from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Optional[str] = "analyst"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    created_at: datetime

class PredictionRequest(BaseModel):
    user_id: int
    action: str
    resource: Optional[str] = ""
    location: Optional[str] = ""
    success: bool = True
    login_frequency: Optional[int] = 1
    failed_attempts: Optional[int] = 0
    file_size: Optional[int] = 0
    session_duration: Optional[int] = 60

class RiskScoreResponse(BaseModel):
    user_id: int
    risk_score: float
    explanation: str
    recommendations: List[str]
    timestamp: datetime

class LogEntry(BaseModel):
    id: int
    timestamp: datetime
    action: str
    resource: str
    location: str
    success: bool
    risk_score: float