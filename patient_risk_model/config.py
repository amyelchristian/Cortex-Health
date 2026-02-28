"""
Configuration constants for the Patient Health Deterioration Risk Prediction System.
"""

# ── Physiological validity bounds ──────────────────────────────────────────────
VITAL_BOUNDS = {
    "hr":   (30,  200),   # Heart Rate (bpm)
    "spo2": (70,  100),   # Oxygen Saturation (%)
    "sbp":  (70,  250),   # Systolic BP (mmHg)
    "dbp":  (40,  150),   # Diastolic BP (mmHg)
    "rr":   (5,   40),    # Respiratory Rate (breaths/min)
    "temp": (95,  108),   # Temperature (°F)
}

# ── Normal vital ranges (for abnormality flags) ────────────────────────────────
NORMAL_RANGES = {
    "hr":   (60,  100),
    "spo2": (95,  100),
    "sbp":  (90,  120),
    "dbp":  (60,  80),
    "rr":   (12,  20),
    "temp": (97,  99.1),
}

# ── Hard safety override thresholds ───────────────────────────────────────────
SAFETY_THRESHOLDS = {
    "spo2_critical":  90,
    "hr_low":         40,
    "hr_high":       150,
    "sbp_low":        90,
    "sbp_high":      180,
    "temp_high":     103,
}

# ── Risk label mapping ─────────────────────────────────────────────────────────
RISK_MAP = {1: "Low", 2: "Medium", 3: "High"}

# ── High-risk decision threshold ─────────────────────────────────────────────
# Two-condition override: classify as High when BOTH conditions are met:
#   1. P(High) >= HIGH_RISK_THRESHOLD  (minimum absolute probability)
#   2. P(High) >= max(proba) - HIGH_RISK_MARGIN  (within margin of top class)
# This catches borderline cases where P(High) is close to the argmax class,
# boosting High-risk recall toward the ≥ 95 % target without false-alarming
# patients where another class is clearly dominant.
HIGH_RISK_THRESHOLD = 0.25
HIGH_RISK_MARGIN    = 0.45

# ── Probability calibration ──────────────────────────────────────────────────
# Temperature Scaling (Guo et al., ICML 2017) softens overconfident XGBoost
# probabilities.  T=1 → original; T>1 → softer / more spread out.
CALIBRATION_TEMPERATURE = 4.0

# Clinical severity blending weight (0–1).
# Final proba = (1 - α) × ML_proba + α × clinical_proba
# Higher α gives more influence to the rule-based clinical scoring.
CLINICAL_BLEND_ALPHA = 0.35

# ── Model artefact paths ───────────────────────────────────────────────────────
# Paths are resolved relative to this config file's own directory so that
# imports work correctly regardless of which directory uvicorn is started from.
# An env var MODEL_DIR can override (set by api.py at startup).
import os as _os
_DIR = _os.environ.get("MODEL_DIR") or _os.path.dirname(_os.path.abspath(__file__))

MODEL_PATH         = _os.path.join(_DIR, "patient_risk_model.pkl")
SCALER_PATH        = _os.path.join(_DIR, "scaler.pkl")
FEATURE_NAMES_PATH = _os.path.join(_DIR, "feature_names.pkl")

# ── Training configuration ─────────────────────────────────────────────────────
RANDOM_STATE = 42
TEST_SIZE    = 0.20
CV_FOLDS     = 5

# ── Data generation ────────────────────────────────────────────────────────────
N_SAMPLES = 15_000
