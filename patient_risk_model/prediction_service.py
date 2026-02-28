"""
prediction_service.py
=====================
Stateless inference layer:
  - safety_check()      – hard-coded clinical override rules
  - predict_risk()      – full pipeline (feature engineering → ML → response)
  - format_response()   – standardised dict output
  - load_artefacts()    – loads model / scaler / feature names from disk
"""

import time
import pickle
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from config import (
    MODEL_PATH, SCALER_PATH, FEATURE_NAMES_PATH,
    RISK_MAP, SAFETY_THRESHOLDS, NORMAL_RANGES,
    HIGH_RISK_THRESHOLD, HIGH_RISK_MARGIN,
    CALIBRATION_TEMPERATURE, CLINICAL_BLEND_ALPHA,
)
from feature_engineering import engineer_single_patient


# ── Artefact loading ──────────────────────────────────────────────────────────

_cache: dict = {}          # module-level cache so artefacts load only once


def load_artefacts(
    model_path:         str = MODEL_PATH,
    scaler_path:        str = SCALER_PATH,
    feature_names_path: str = FEATURE_NAMES_PATH,
) -> tuple:
    """
    Load (model, scaler, feature_names) from disk.
    Caches the result after first load.
    """
    if "model" not in _cache:
        _cache["model"]         = joblib.load(model_path)
        _cache["scaler"]        = joblib.load(scaler_path)
        with open(feature_names_path, "rb") as f:
            _cache["feature_names"] = pickle.load(f)
        print(f"[Service] Artefacts loaded from {model_path}, {scaler_path}")

    return _cache["model"], _cache["scaler"], _cache["feature_names"]


def reload_artefacts(**kwargs) -> tuple:
    """Force-reload artefacts (use after re-training)."""
    _cache.clear()
    return load_artefacts(**kwargs)


# ── Safety check ──────────────────────────────────────────────────────────────

def safety_check(vitals: dict) -> str | None:
    """
    Hard-coded clinical override.  Returns 'High' if any critical threshold
    is breached; returns None otherwise (let ML decide).

    These rules are intentionally conservative – we CANNOT miss a critical
    deterioration event.
    """
    spo2 = vitals.get("spo2", 100)
    hr   = vitals.get("hr",   80)
    sbp  = vitals.get("sbp",  120)
    temp = vitals.get("temp", 98.6)

    if spo2 < SAFETY_THRESHOLDS["spo2_critical"]:
        return "High"
    if hr   < SAFETY_THRESHOLDS["hr_low"]:
        return "High"
    if hr   > SAFETY_THRESHOLDS["hr_high"]:
        return "High"
    if sbp  < SAFETY_THRESHOLDS["sbp_low"]:
        return "High"
    if sbp  > SAFETY_THRESHOLDS["sbp_high"]:
        return "High"
    if temp > SAFETY_THRESHOLDS["temp_high"]:
        return "High"

    return None


# ── Probability calibration ──────────────────────────────────────────────────

def _temperature_scaled_proba(model, X_scaled, temperature: float = CALIBRATION_TEMPERATURE):
    """
    Temperature Scaling (Guo et al., ICML 2017).

    Instead of using predict_proba (which applies softmax internally and
    produces degenerate 0/1 outputs for overconfident models), we:
      1. Extract raw margin scores (logits before softmax)
      2. Divide by temperature T > 1  →  softer distribution
      3. Apply softmax ourselves

    Returns numpy array of shape (n_classes,).
    """
    # Get raw logits from XGBoost (before internal softmax)
    try:
        margins = model.predict(X_scaled, output_margin=True)[0]
    except TypeError:
        # Fallback for models that don't support output_margin (e.g. RF)
        return model.predict_proba(X_scaled)[0]

    scaled = margins / max(temperature, 0.01)
    # Numerically-stable softmax
    shifted = scaled - np.max(scaled)
    exp_vals = np.exp(shifted)
    return exp_vals / np.sum(exp_vals)


def _clinical_severity(vitals: dict) -> np.ndarray:
    """
    Rule-based clinical risk probability estimated from vital signs,
    symptoms, and medical history using established clinical scoring.

    Returns a 3-element array [P(Low), P(Medium), P(High)] that reflects
    clinical intuition independent of the ML model.

    Scoring components (each 0–1, then combined):
      1. Vital deviation score  — how far each vital is from normal
      2. MEWS-like acuity score — Modified Early Warning Score
      3. Symptom burden         — number of active symptoms
      4. Comorbidity burden     — number of pre-existing conditions
    """
    # 1. Vital deviation score (weighted distance from normal midpoints)
    norms = {k: (lo + hi) / 2 for k, (lo, hi) in NORMAL_RANGES.items()}
    half_ranges = {k: max((hi - lo) / 2, 1e-6) for k, (lo, hi) in NORMAL_RANGES.items()}
    weights = {"hr": 0.20, "spo2": 0.30, "sbp": 0.20, "dbp": 0.08, "rr": 0.12, "temp": 0.10}

    vital_dev = 0.0
    for col, w in weights.items():
        val = vitals.get(col, norms[col])
        dev = abs(val - norms[col]) / half_ranges[col]
        vital_dev += w * min(dev, 3.0)  # cap at 3× normal range

    # 2. Simplified MEWS score (0–12 scale → 0–1)
    hr   = vitals.get("hr", 80)
    sbp  = vitals.get("sbp", 120)
    rr   = vitals.get("rr", 16)
    temp = vitals.get("temp", 98.6)

    mews = 0
    # HR scoring
    if hr < 40: mews += 2
    elif hr < 51: mews += 3
    elif hr < 101: mews += 0
    elif hr < 111: mews += 1
    elif hr < 130: mews += 2
    else: mews += 3
    # SBP scoring
    if sbp < 70: mews += 3
    elif sbp < 81: mews += 2
    elif sbp < 101: mews += 1
    elif sbp < 200: mews += 0
    else: mews += 2
    # RR scoring
    if rr < 9: mews += 2
    elif rr < 15: mews += 0
    elif rr < 21: mews += 0
    elif rr < 30: mews += 1
    else: mews += 2
    # Temperature scoring (°F)
    temp_c = (temp - 32) * 5 / 9
    if temp_c < 35: mews += 2
    elif temp_c < 38.5: mews += 0
    else: mews += 2

    mews_norm = min(mews / 8.0, 1.0)  # normalize to 0–1

    # 3. Symptom burden (0–3 → 0–1)
    symptom_count = sum(1 for k in ("chest_pain", "breathlessness", "fever")
                        if vitals.get(k, 0))
    symptom_norm = symptom_count / 3.0

    # 4. Comorbidity burden (0–3 → 0–1)
    comorbidity_count = sum(1 for k in ("diabetes", "hypertension", "heart_disease")
                           if vitals.get(k, 0))
    comorbidity_norm = comorbidity_count / 3.0

    # Combined severity (0–1 scale)
    severity = (
        0.40 * min(vital_dev, 1.0)
        + 0.30 * mews_norm
        + 0.18 * symptom_norm
        + 0.12 * comorbidity_norm
    )
    severity = np.clip(severity, 0.0, 1.0)

    # Map severity → probability distribution using logistic curves
    # Low severity → mostly P(Low); high severity → mostly P(High)
    if severity < 0.15:
        p_low, p_med, p_high = 0.75, 0.20, 0.05
    elif severity < 0.30:
        p_low  = 0.55 - (severity - 0.15) * 2.0
        p_med  = 0.35
        p_high = 0.10 + (severity - 0.15) * 1.0
    elif severity < 0.50:
        p_low  = 0.25 - (severity - 0.30) * 0.75
        p_med  = 0.45
        p_high = 0.30 + (severity - 0.30) * 0.50
    elif severity < 0.70:
        p_low  = 0.10 - (severity - 0.50) * 0.40
        p_med  = 0.40 - (severity - 0.50) * 0.50
        p_high = 0.50 + (severity - 0.50) * 0.75
    else:
        p_low  = max(0.02, 0.02 - (severity - 0.70) * 0.05)
        p_med  = max(0.08, 0.30 - (severity - 0.70) * 0.70)
        p_high = 1.0 - p_low - p_med

    total = p_low + p_med + p_high
    return np.array([p_low / total, p_med / total, p_high / total])


def calibrate_probabilities(
    model, X_scaled, patient_dict: dict,
    temperature: float = CALIBRATION_TEMPERATURE,
    alpha: float = CLINICAL_BLEND_ALPHA,
) -> np.ndarray:
    """
    Produce calibrated risk probabilities by blending:
      1. Temperature-scaled XGBoost probabilities  (ML signal)
      2. Clinical severity scoring                  (rule-based signal)

    Final = (1 - α) × ML_proba  +  α × clinical_proba

    Returns numpy array [P(Low), P(Medium), P(High)].
    """
    ml_proba = _temperature_scaled_proba(model, X_scaled, temperature)
    clinical_proba = _clinical_severity(patient_dict)

    blended = (1.0 - alpha) * ml_proba + alpha * clinical_proba
    # Ensure it sums to 1
    blended = blended / blended.sum()
    return blended


# ── Core prediction ───────────────────────────────────────────────────────────

def predict_risk(
    patient_dict:       dict,
    model              = None,
    scaler             = None,
    feature_names: list = None,
) -> dict:
    """
    Full inference pipeline for one patient.

    Parameters
    ----------
    patient_dict : dict
        Keys must include all mandatory vitals/history/symptoms fields.
        Optional: has_previous_reading, prev_hr, prev_spo2, prev_sbp, prev_dbp.

    model, scaler, feature_names
        If None, loaded automatically from disk (cached after first call).

    Returns
    -------
    dict with keys:
        risk_score, risk_category, risk_probability, confidence,
        safety_override, override_reason, timestamp, inference_ms
    """
    t0 = time.perf_counter()

    # -- Load artefacts if not provided
    if model is None:
        model, scaler, feature_names = load_artefacts()

    # -- 1. Safety check (hard rules first)
    override = safety_check(patient_dict)

    # -- 2. Feature engineering
    row = engineer_single_patient(patient_dict)

    # -- 3. Align columns to training feature order
    missing_cols = [c for c in feature_names if c not in row.columns]
    for col in missing_cols:
        row[col] = 0.0

    extra_cols = [c for c in row.columns if c not in feature_names]
    row = row.drop(columns=extra_cols, errors="ignore")
    row = row[feature_names]

    # -- 4. Scale (wrap back into DataFrame to keep feature names intact)
    row_scaled = pd.DataFrame(
        scaler.transform(row), columns=feature_names
    )

    # -- 5. Calibrated prediction ──────────────────────────────────────────
    # Always compute real probabilities so all 3 risk levels are shown.
    proba = calibrate_probabilities(
        model, row_scaled, patient_dict,
    ).tolist()

    # -- 6. Classification decision
    if override is not None:
        # Safety override: force High classification but keep real probabilities
        risk_score = 3
        elapsed = (time.perf_counter() - t0) * 1000
        return format_response(
            risk_score=risk_score,
            risk_category="High",
            probabilities=proba,
            safety_override=True,
            override_reason="Critical vital signs detected – safety rule triggered",
            elapsed_ms=elapsed,
        )

    # Two-condition high-risk override on calibrated probabilities:
    #   1. P(High) >= HIGH_RISK_THRESHOLD
    #   2. P(High) >= max(proba) - HIGH_RISK_MARGIN
    p_high = proba[2] if len(proba) > 2 else 0.0
    if p_high >= HIGH_RISK_THRESHOLD and p_high >= max(proba) - HIGH_RISK_MARGIN:
        risk_score = 3
    else:
        # Classify by argmax of calibrated probabilities (0-indexed → 1-indexed)
        risk_score = int(np.argmax(proba)) + 1

    elapsed = (time.perf_counter() - t0) * 1000
    return format_response(
        risk_score=risk_score,
        risk_category=RISK_MAP[risk_score],
        probabilities=proba,
        safety_override=False,
        override_reason=None,
        elapsed_ms=elapsed,
    )


# ── Response formatter ────────────────────────────────────────────────────────

def format_response(
    risk_score:       int,
    risk_category:    str,
    probabilities:    list,
    safety_override:  bool,
    override_reason:  str | None,
    elapsed_ms:       float,
) -> dict:
    """
    Build the standardised API-compatible response dictionary.
    """
    # Map probability index to 1-based risk score
    # probabilities are ordered [p(Low), p(Medium), p(High)]
    idx = risk_score - 1
    risk_probability = float(probabilities[idx]) if 0 <= idx < len(probabilities) else 0.0
    confidence       = float(max(probabilities)) if probabilities else 0.0

    response = {
        "risk_score":        risk_score,
        "risk_category":     risk_category,
        "risk_probability":  round(risk_probability, 4),
        "confidence":        round(confidence, 4),
        "probabilities":     {
            "Low":    round(float(probabilities[0]), 4) if len(probabilities) > 0 else 0.0,
            "Medium": round(float(probabilities[1]), 4) if len(probabilities) > 1 else 0.0,
            "High":   round(float(probabilities[2]), 4) if len(probabilities) > 2 else 0.0,
        },
        "safety_override":   safety_override,
        "override_reason":   override_reason,
        "timestamp":         datetime.now(timezone.utc).isoformat(),
        "inference_ms":      round(elapsed_ms, 2),
    }
    return response


# ── Batch prediction ──────────────────────────────────────────────────────────

def predict_batch(
    patients:   list[dict],
    model       = None,
    scaler      = None,
    feature_names: list = None,
) -> list[dict]:
    """
    Run predict_risk for a list of patient dicts.
    Artefacts are loaded once and reused.
    """
    if model is None:
        model, scaler, feature_names = load_artefacts()

    return [
        predict_risk(p, model=model, scaler=scaler, feature_names=feature_names)
        for p in patients
    ]
