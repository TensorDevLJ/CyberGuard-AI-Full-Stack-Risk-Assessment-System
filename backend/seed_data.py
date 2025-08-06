import asyncio
import random
from datetime import datetime, timedelta
from database import SessionLocal, User, UserLog, RiskScore
from auth import get_password_hash

def create_sample_data():
    db = SessionLocal()
    
    # Clear existing data
    db.query(UserLog).delete()
    db.query(RiskScore).delete()
    db.query(User).delete()
    db.commit()
    
    # Create admin user
    admin_user = User(
        email="admin@demo.com",
        name="System Administrator", 
        hashed_password=get_password_hash("admin123"),
        role="admin"
    )
    db.add(admin_user)
    
    # Create sample users
    sample_users = [
        {"name": "Alice Johnson", "email": "alice@company.com", "role": "analyst"},
        {"name": "Bob Wilson", "email": "bob@company.com", "role": "analyst"},
        {"name": "Charlie Brown", "email": "charlie@company.com", "role": "viewer"},
        {"name": "Diana Smith", "email": "diana@company.com", "role": "analyst"},
        {"name": "Eve Davis", "email": "eve@company.com", "role": "viewer"},
        {"name": "Frank Miller", "email": "frank@company.com", "role": "analyst"},
        {"name": "Grace Lee", "email": "grace@company.com", "role": "viewer"},
        {"name": "Henry Chen", "email": "henry@company.com", "role": "analyst"},
    ]
    
    users = []
    for user_data in sample_users:
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            hashed_password=get_password_hash("password123"),
            role=user_data["role"]
        )
        db.add(user)
        users.append(user)
    
    db.commit()
    
    # Create sample activity logs and risk scores
    actions = ["login", "file_access", "download", "upload", "system_access"]
    resources = [
        "/admin/config.php", "/home/user/documents", "/var/log/system.log",
        "/database/backup.sql", "/files/sensitive_data.xlsx", "/system/auth.conf"
        "/reports/financial.pdf", "/hr/employee_data.csv", "/config/network.conf",
        "/backup/database_dump.sql", "/logs/security.log", "/admin/user_management.php"
    ]
    locations = ["192.168.1.100", "10.0.0.50", "203.0.113.42", "198.51.100.30"]
    
    # Generate data for the last 7 days (more recent for better demo)
    for user in users:
        activities_count = random.randint(15, 50)
        risk_scores = []
        
        for i in range(activities_count):
            # Create timestamp within last 7 days
            days_ago = random.randint(0, 7)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            timestamp = datetime.now() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
            
            # Generate risk factors
            is_off_hours = hours_ago < 6 or hours_ago > 22
            is_weekend = timestamp.weekday() > 4
            failed_login = random.random() < 0.1
            sensitive_resource = any(keyword in random.choice(resources).lower() 
                                   for keyword in ['admin', 'config', 'database', 'backup'])
            
            # Calculate base risk score
            base_risk = 5
            if is_off_hours:
                base_risk += random.randint(10, 20)
            if is_weekend:
                base_risk += random.randint(5, 15)
            if failed_login:
                base_risk += random.randint(15, 25)
            if sensitive_resource:
                base_risk += random.randint(5, 15)
            if random.random() < 0.05:  # 5% chance of high-risk activity
                base_risk += random.randint(20, 30)
            
            # Add some randomness
            risk_score = min(50, max(5, base_risk + random.randint(-5, 5)))
            risk_scores.append(risk_score)
            
            # Create activity log
            log = UserLog(
                user_id=user.id,
                timestamp=timestamp,
                action=random.choice(actions),
                resource=random.choice(resources),
                location=random.choice(locations),
                success=not failed_login,
                risk_score=risk_score
            )
            db.add(log)
        
        # Create risk score record
        current_score = risk_scores[-1] if risk_scores else 5.0
        risk_record = RiskScore(
            user_id=user.id,
            current_score=current_score,
            previous_score=risk_scores[-2] if len(risk_scores) > 1 else 5.0,
            last_updated=datetime.now(),
            explanation=f"Based on {activities_count} recent activities"
        )
        db.add(risk_record)
    
    db.commit()
    db.close()
    print("Sample data created successfully!")
    print("Demo credentials:")
    print("- Admin: admin@demo.com / admin123")
    print("- User: alice@company.com / password123")

if __name__ == "__main__":
    create_sample_data()