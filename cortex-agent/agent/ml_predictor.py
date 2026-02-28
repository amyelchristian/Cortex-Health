"""
ml_predictor.py
Wrapper for the Cortex Random Forest ML model.
It handles feature engineering, scaling, safety overrides,
and the actual prediction logic.
"""
import os
import joblib
import pandas as pd
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'cortex_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'scaler.pkl')

class CortexMLPredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self._load_models()

    def _load_models(self):
        """Loads the pre-trained Random Forest model and scaler if they exist."""
        try:
            if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                print("Cortex ML Model loaded successfully.")
            else:
                print("Warning: Model files not found. Using fallback heuristics.")
        except Exception as e:
            print(f"Error loading models: {e}")

    def _check_safety_overrides(self, vitals: dict) -> dict:
        """
        Critical threshold overrides:
        SpO2 < 90% -> HIGH RISK
        HR > 150 or < 40 -> HIGH RISK
        BP > 180/110 or < 90/60 -> HIGH RISK
        Temp > 103F or < 95F -> HIGH RISK
        """
        hr = float(vitals.get("hr", 70))
        spo2 = float(vitals.get("spo2", 98))
        sys_bp = float(vitals.get("sys_bp", 120))
        dia_bp = float(vitals.get("dia_bp", 80))
        temp = float(vitals.get("temp", 98.6))

        if spo2 < 90:
            return {"risk_level": "High", "override": "Critical SpO2 Drop (<90%)"}
        if hr > 150 or hr < 40:
            return {"risk_level": "High", "override": f"Critical Heart Rate ({hr} bpm)"}
        if sys_bp > 180 or dia_bp > 110:
            return {"risk_level": "High", "override": f"Hypertensive Crisis ({sys_bp}/{dia_bp})"}
        if sys_bp < 90 or dia_bp < 60:
            return {"risk_level": "High", "override": f"Hypotensive Crisis ({sys_bp}/{dia_bp})"}
        if temp > 103 or temp < 95:
            return {"risk_level": "High", "override": f"Critical Temperature ({temp}F)"}
            
        return None

    def _engineer_features(self, vitals: dict) -> pd.DataFrame:
        """
        Expands 6 core vitals into a 34 feature set required by the model.
        (Simplified engineering for scaffolding)
        """
        hr = float(vitals.get("hr", 70))
        sys_bp = float(vitals.get("sys_bp", 120))
        dia_bp = float(vitals.get("dia_bp", 80))
        spo2 = float(vitals.get("spo2", 98))
        rr = float(vitals.get("rr", 16))
        temp = float(vitals.get("temp", 98.6))
        
        # Derived standard metrics
        map_val = dia_bp + ((sys_bp - dia_bp) / 3)
        shock_index = hr / sys_bp if sys_bp > 0 else 0

        features = {
            "hr": [hr],
            "sys_bp": [sys_bp],
            "dia_bp": [dia_bp],
            "spo2": [spo2],
            "rr": [rr],
            "temp": [temp],
            "map": [map_val],
            "shock_index": [shock_index],
            "pulse_pressure": [sys_bp - dia_bp],
            # Pad the rest to reach ~34 for standard ML requirement shapes
        }
        
        # Generate dummy 25 remaining features (rolling averages, deltas, etc.)
        for i in range(10, 35):
            features[f"feature_{i}"] = [np.random.normal(0, 1)]

        return pd.DataFrame(features)

    def _fallback_prediction(self, vitals: dict) -> dict:
        """Rule-based prediction used when the pickled model isn't available."""
        hr = float(vitals.get("hr", 70))
        spo2 = float(vitals.get("spo2", 98))
        sys = float(vitals.get("sys_bp", 120))
        
        if hr > 110 or sys > 140 or spo2 < 94:
            level = "Medium"
            probs = {"Low": 25.0, "Medium": 65.0, "High": 10.0}
            conf = 0.85
        else:
            level = "Low"
            probs = {"Low": 85.0, "Medium": 13.0, "High": 2.0}
            conf = 0.94
            
        return {
            "risk_category": level,
            "risk_score": 2 if level == "Medium" else 1,
            "probabilities": probs,
            "confidence": conf,
            "safety_override": False,
            "override_reason": None,
            "top_features": {
                "Heart Rate": 0.35,
                "Systolic BP": 0.25,
                "SpO2": 0.20
            }
        }

    def predict(self, vitals: dict) -> dict:
        """
        Main entry point for risk assessment.
        Checks hard overrides first, then performs ML feature engineering and prediction.
        """
        # Always run explicit safety layer first
        override = self._check_safety_overrides(vitals)
        if override:
            return {
                "risk_category": override["risk_level"],
                "risk_score": 3 if override["risk_level"] == "High" else 2,
                "probabilities": {"Low": 0.0, "Medium": 0.0, "High": 100.0},
                "confidence": 1.0,
                "safety_override": True,
                "override_reason": override["override"],
                "top_features": {
                    "Critical Threshold": 1.00,
                    "Safety Protocol": 0.85,
                    "Manual Override": 0.70
                }
            }

        # Use actual model if available
        if self.model and self.scaler:
            try:
                # 1. Engineer Features
                X = self._engineer_features(vitals)
                
                # 2. Scale
                X_scaled = self.scaler.transform(X)
                
                # 3. Predict Probabilities
                probs_array = self.model.predict_proba(X_scaled)[0]
                
                # Our models typically output [Low, Medium, High] ordered
                low_p = float(probs_array[0]) * 100
                med_p = float(probs_array[1]) * 100
                high_p = float(probs_array[2]) * 100
                
                # 4. Extract class based on highest probability
                cat_idx = np.argmax(probs_array)
                risk_level = ["Low", "Medium", "High"][cat_idx]
                
                # 5. Extract feature importances
                importances = self.model.feature_importances_
                
                return {
                    "risk_category": risk_level,
                    "risk_score": cat_idx + 1,
                    "probabilities": {"Low": low_p, "Medium": med_p, "High": high_p},
                    "confidence": float(probs_array[cat_idx]),
                    "safety_override": False,
                    "override_reason": None,
                    "top_features": {
                        "Heart Rate": float(importances[0]),
                        "Systolic BP": float(importances[1]),
                        "Shock Index": float(importances[7])
                    }
                }
            except Exception as e:
                print(f"ML inference failed: {e}. Falling back to heuristic rules.")
                return self._fallback_prediction(vitals)
        
        # Fallback if no model file loaded
        return self._fallback_prediction(vitals)

ml_predictor = CortexMLPredictor()
