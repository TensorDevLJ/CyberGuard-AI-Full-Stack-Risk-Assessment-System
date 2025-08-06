import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from datetime import datetime, timedelta
import joblib
import os
import random

class RiskScoringEngine:
    def __init__(self):
        self.isolation_forest = IsolationForest(
            n_estimators=200,
            contamination=0.1,
            random_state=42,
            max_features=0.8
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = [
            'hour_of_day', 'day_of_week', 'login_frequency', 
            'failed_attempts', 'resource_sensitivity', 'location_risk',
            'file_size', 'session_duration'
        ]
        
        # Initialize with sample data if model doesn't exist
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the model with synthetic training data"""
        # Generate synthetic training data
        n_samples = 1000
        training_data = []
        
        for _ in range(n_samples):
            # Normal behavior (90% of data)
            if random.random() < 0.9:
                hour = random.choice([8, 9, 10, 11, 14, 15, 16, 17])  # Business hours
                failed_attempts = random.randint(0, 2)
                login_freq = random.randint(1, 5)
                resource_sensitivity = random.randint(1, 3)
                location_risk = random.randint(1, 2)
                file_size = random.randint(1, 100)
                session_duration = random.randint(30, 480)  # 30min to 8hr
            # Anomalous behavior (10% of data)
            else:
                hour = random.choice([0, 1, 2, 3, 22, 23])  # Off hours
                failed_attempts = random.randint(3, 10)
                login_freq = random.randint(15, 50)
                resource_sensitivity = random.randint(4, 5)
                location_risk = random.randint(3, 5)
                file_size = random.randint(500, 5000)
                session_duration = random.randint(1, 30)  # Very short or very long
            
            training_data.append([
                hour, random.randint(0, 6), login_freq, failed_attempts,
                resource_sensitivity, location_risk, file_size, session_duration
            ])
        
        # Train the model
        X_train = np.array(training_data)
        X_train_scaled = self.scaler.fit_transform(X_train)
        self.isolation_forest.fit(X_train_scaled)
        self.is_trained = True
    
    def extract_features(self, log_data):
        """Extract features from log data"""
        now = datetime.now()
        
        features = {
            'hour_of_day': now.hour,
            'day_of_week': now.weekday(),
            'login_frequency': log_data.get('login_frequency', 1),
            'failed_attempts': log_data.get('failed_attempts', 0),
            'resource_sensitivity': self._get_resource_sensitivity(log_data.get('resource', '')),
            'location_risk': self._get_location_risk(log_data.get('location', '')),
            'file_size': log_data.get('file_size', 0),
            'session_duration': log_data.get('session_duration', 60)
        }
        
        return np.array([features[name] for name in self.feature_names]).reshape(1, -1)
    
    def _get_resource_sensitivity(self, resource):
        """Assign sensitivity level to resources"""
        if not resource:
            return 1
        
        resource_lower = resource.lower()
        if any(keyword in resource_lower for keyword in ['admin', 'root', 'system']):
            return 5
        elif any(keyword in resource_lower for keyword in ['config', 'database', 'backup']):
            return 4
        elif any(keyword in resource_lower for keyword in ['financial', 'hr', 'personal']):
            return 4
        elif any(keyword in resource_lower for keyword in ['restricted', 'confidential']):
            return 3
        else:
            return 2
    
    def _get_location_risk(self, location):
        """Assign risk level to locations"""
        if not location:
            return 1
        
        # Simple risk assessment based on IP patterns
        if location.startswith('192.168') or location.startswith('10.'):
            return 1  # Internal network
        elif any(country in location for country in ['US', 'UK', 'CA', 'AU']):
            return 2  # Trusted countries
        else:
            return 4  # Unknown/high-risk locations
    
    def predict(self, features):
        """Predict risk score and provide explanation"""
        if not self.is_trained:
            return 5.0, "Model not trained", []
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Get anomaly score
        anomaly_score = self.isolation_forest.decision_function(features_scaled)[0]
        
        # Convert to risk score (5-50 scale)
        # Isolation Forest returns negative values for anomalies
        risk_score = max(5, min(50, 25 + (-anomaly_score * 20)))
        
        # Generate explanation
        explanation = self._generate_explanation(features[0], risk_score)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risk_score, features[0])
        
        return round(risk_score, 1), explanation, recommendations
    
    def _generate_explanation(self, features, risk_score):
        """Generate human-readable explanation for the risk score"""
        explanations = []
        
        hour, day_of_week, login_freq, failed_attempts, resource_sens, location_risk, file_size, session_dur = features
        
        # Time-based factors
        if hour < 6 or hour > 20:
            explanations.append("Access during off-hours")
        
        if day_of_week > 4:  # Weekend
            explanations.append("Weekend activity")
        
        # Authentication factors
        if failed_attempts > 3:
            explanations.append(f"Multiple failed login attempts ({int(failed_attempts)})")
        
        if login_freq > 10:
            explanations.append("High login frequency")
        
        # Resource factors
        if resource_sens >= 4:
            explanations.append("Access to sensitive resources")
        
        # Location factors
        if location_risk >= 3:
            explanations.append("Access from high-risk location")
        
        # Data transfer factors
        if file_size > 1000:
            explanations.append("Large data transfer")
        
        if session_dur < 5:
            explanations.append("Unusually short session")
        elif session_dur > 600:
            explanations.append("Extended session duration")
        
        if not explanations:
            return "Normal activity pattern"
        
        return "; ".join(explanations)
    
    def _generate_recommendations(self, risk_score, features):
        """Generate actionable recommendations based on risk score"""
        recommendations = []
        
        if risk_score >= 40:
            recommendations.extend([
                "Immediately review user activity",
                "Consider temporary access restriction",
                "Trigger security incident response"
            ])
        elif risk_score >= 30:
            recommendations.extend([
                "Require additional authentication",
                "Monitor user activity closely",
                "Review access permissions"
            ])
        elif risk_score >= 20:
            recommendations.extend([
                "Flag for review",
                "Enable enhanced logging",
                "Send security awareness reminder"
            ])
        else:
            recommendations.append("Continue monitoring")
        
        # Specific recommendations based on features
        hour, day_of_week, login_freq, failed_attempts, resource_sens, location_risk, file_size, session_dur = features
        
        if failed_attempts > 3:
            recommendations.append("Implement account lockout policy")
        
        if location_risk >= 3:
            recommendations.append("Verify user location and implement geo-blocking")
        
        if file_size > 1000:
            recommendations.append("Review data loss prevention policies")
        
        return recommendations
    
    def get_risk_level(self, risk_score):
        """Convert numeric risk score to risk level"""
        if risk_score >= 40:
            return "Critical"
        elif risk_score >= 30:
            return "High"
        elif risk_score >= 20:
            return "Medium"
        elif risk_score >= 10:
            return "Low"
        else:
            return "Minimal"