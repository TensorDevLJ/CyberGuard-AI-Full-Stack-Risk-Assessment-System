from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
from datetime import datetime, timedelta
import jwt
import hashlib
import secrets
import json

from database import SessionLocal, engine, User, UserLog, RiskScore
from ml_engine import RiskScoringEngine
from auth import create_access_token, verify_password, get_password_hash, decode_access_token
from models import UserCreate, UserLogin, UserResponse, RiskScoreResponse, LogEntry, PredictionRequest

app = FastAPI(title="CyberGuard AI", description="AI-Powered Cybersecurity Risk Assessment Platform", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
risk_engine = RiskScoringEngine()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/auth/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        role=user_data.role or "analyst"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@app.post("/api/auth/login")
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role
    }

@app.post("/api/predict", response_model=RiskScoreResponse)
async def predict_risk(
    request: PredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Convert request to feature vector
    features = risk_engine.extract_features(request.dict())
    
    # Get risk score and explanation
    risk_score, explanation, recommendations = risk_engine.predict(features)
    
    # Log the prediction
    user_log = UserLog(
        user_id=request.user_id,
        timestamp=datetime.now(),
        action=request.action,
        resource=request.resource,
        location=request.location,
        success=request.success,
        risk_score=risk_score
    )
    db.add(user_log)
    
    # Update or create risk score record
    existing_score = db.query(RiskScore).filter(RiskScore.user_id == request.user_id).first()
    if existing_score:
        existing_score.current_score = risk_score
        existing_score.last_updated = datetime.now()
    else:
        risk_record = RiskScore(
            user_id=request.user_id,
            current_score=risk_score,
            last_updated=datetime.now()
        )
        db.add(risk_record)
    
    db.commit()
    
    return RiskScoreResponse(
        user_id=request.user_id,
        risk_score=risk_score,
        explanation=explanation,
        recommendations=recommendations,
        timestamp=datetime.now()
    )

@app.get("/api/users/risk-scores")
async def get_all_risk_scores(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scores = db.query(RiskScore).all()
    
    result = []
    for score in scores:
        user = db.query(User).filter(User.id == score.user_id).first()
        if user:
            result.append({
                "user_id": score.user_id,
                "name": user.name,
                "email": user.email,
                "current_score": score.current_score,
                "last_updated": score.last_updated,
                "risk_level": risk_engine.get_risk_level(score.current_score)
            })
    
    return result

@app.get("/api/users/{user_id}/activity")
async def get_user_activity(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(UserLog).filter(UserLog.user_id == user_id).order_by(UserLog.timestamp.desc()).limit(100).all()
    
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp,
            "action": log.action,
            "resource": log.resource,
            "location": log.location,
            "success": log.success,
            "risk_score": log.risk_score
        }
        for log in logs
    ]

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get total users
    total_users = db.query(User).count()
    
    # Get high risk users (score > 30)
    high_risk_users = db.query(RiskScore).filter(RiskScore.current_score > 30).count()
    
    # Get recent alerts (last 24 hours)
    yesterday = datetime.now() - timedelta(days=1)
    recent_alerts = db.query(UserLog).filter(
        UserLog.timestamp > yesterday,
        UserLog.risk_score > 25
    ).count()
    
    # Get average risk score
    avg_score = db.query(RiskScore).with_entities(
        db.func.avg(RiskScore.current_score)
    ).scalar() or 0
    
    return {
        "total_users": total_users,
        "high_risk_users": high_risk_users,
        "recent_alerts": recent_alerts,
        "average_risk_score": round(float(avg_score), 2)
    }

@app.get("/api/dashboard/trends")
async def get_risk_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get daily risk trends for the last 7 days
    trends = []
    for i in range(7):
        date = datetime.now() - timedelta(days=i)
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        avg_score = db.query(UserLog).filter(
            UserLog.timestamp.between(day_start, day_end)
        ).with_entities(db.func.avg(UserLog.risk_score)).scalar() or 0
        
        trends.append({
            "date": day_start.isoformat(),
            "average_score": round(float(avg_score), 2)
        })
    
    return list(reversed(trends))

@app.post("/api/upload_logs")
async def upload_logs(
    logs_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Batch upload system logs for processing"""
    logs = logs_data.get('logs', [])
    processed_count = 0
    
    for log_entry in logs:
        try:
            # Process each log entry
            features = risk_engine.extract_features(log_entry)
            risk_score, explanation, recommendations = risk_engine.predict(features)
            
            # Create log entry
            user_log = UserLog(
                user_id=log_entry.get('user_id', 1),
                timestamp=datetime.now(),
                action=log_entry.get('action', 'unknown'),
                resource=log_entry.get('resource', ''),
                location=log_entry.get('location', ''),
                success=log_entry.get('success', True),
                risk_score=risk_score
            )
            db.add(user_log)
            processed_count += 1
            
        except Exception as e:
            print(f"Error processing log entry: {e}")
            continue
    
    db.commit()
    
    return {
        "message": f"Successfully processed {processed_count} log entries",
        "processed_count": processed_count,
        "total_logs": len(logs)
    }

@app.get("/api/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get security recommendations based on current risk levels"""
    high_risk_users = db.query(RiskScore).filter(RiskScore.current_score >= 30).all()
    
    recommendations = []
    
    for risk_record in high_risk_users:
        user = db.query(User).filter(User.id == risk_record.user_id).first()
        if user:
            # Get recent activities for context
            recent_logs = db.query(UserLog).filter(
                UserLog.user_id == user.id,
                UserLog.timestamp > datetime.now() - timedelta(hours=24)
            ).order_by(UserLog.timestamp.desc()).limit(5).all()
            
            # Generate recommendations based on risk score and recent activity
            user_recommendations = risk_engine._generate_recommendations(
                risk_record.current_score, 
                [0, 0, 1, 0, 3, 2, 0, 60]  # Default feature vector
            )
            
            recommendations.append({
                "user_id": user.id,
                "user_name": user.name,
                "user_email": user.email,
                "risk_score": risk_record.current_score,
                "risk_level": risk_engine.get_risk_level(risk_record.current_score),
                "recommendations": user_recommendations,
                "recent_activity_count": len(recent_logs),
                "last_updated": risk_record.last_updated
            })
    
    return {
        "total_high_risk_users": len(recommendations),
        "recommendations": recommendations,
        "generated_at": datetime.now()
    }
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)