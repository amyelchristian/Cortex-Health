"""
api.py
======
FastAPI prediction service for the Patient Health Deterioration Risk Model.

Endpoints
---------
GET  /health          – liveness check
GET  /model/info      – artefact metadata
POST /predict         – single-patient risk prediction
POST /predict/batch   – bulk prediction (list of patients)

Run locally:
    uvicorn api:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import sys

# ── Path bootstrap (must happen before any local imports) ─────────────────────
# Resolve the directory that contains api.py itself and prepend it to sys.path.
# This makes sibling modules (config, prediction_service, …) importable
# regardless of which directory uvicorn / Python was launched from.
_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

# Also tell the model-loading code where to find the .pkl artefacts.
os.environ.setdefault("MODEL_DIR", _HERE)

import pickle
import joblib
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from config import MODEL_PATH, SCALER_PATH, FEATURE_NAMES_PATH, RISK_MAP
from prediction_service import predict_risk, predict_batch, safety_check, load_artefacts

# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title        = "Patient Health Deterioration Risk Prediction API",
    description  = (
        "Predicts 3-level patient deterioration risk (Low / Medium / High) "
        "from vital signs, medical history, and symptoms using an ensemble ML model. "
        "Safety overrides are applied for critical vital-sign thresholds."
    ),
    version      = "1.0.0",
    docs_url     = "/docs",
    redoc_url    = "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins  = ["*"],       # restrict in production
    allow_methods  = ["*"],
    allow_headers  = ["*"],
)

# ── Startup: pre-load artefacts ───────────────────────────────────────────────

@app.on_event("startup")
async def _startup():
    """Load model artefacts into the module-level cache at startup."""
    try:
        load_artefacts()
        print("[API] Model artefacts loaded successfully.")
    except FileNotFoundError as e:
        print(f"[API] WARNING: artefacts not found – {e}")
        print("[API] Run python train_model.py first to generate the model files.")


# ── Request / Response schemas ────────────────────────────────────────────────

class PatientData(BaseModel):
    # Core vitals
    hr:   float = Field(..., ge=30,  le=200,  description="Heart rate (bpm)")
    spo2: float = Field(..., ge=70,  le=100,  description="Oxygen saturation (%)")
    sbp:  float = Field(..., ge=70,  le=250,  description="Systolic blood pressure (mmHg)")
    dbp:  float = Field(..., ge=40,  le=150,  description="Diastolic blood pressure (mmHg)")
    rr:   float = Field(..., ge=5,   le=40,   description="Respiratory rate (breaths/min)")
    temp: float = Field(..., ge=95,  le=108,  description="Body temperature (°F)")

    # Medical history (binary)
    diabetes:      bool = Field(False, description="Diabetes diagnosis")
    hypertension:  bool = Field(False, description="Hypertension diagnosis")
    heart_disease: bool = Field(False, description="Heart disease diagnosis")

    # Current symptoms (binary)
    chest_pain:    bool = Field(False, description="Chest pain present")
    breathlessness:bool = Field(False, description="Breathlessness present")
    fever:         bool = Field(False, description="Fever present")

    # Optional previous reading
    has_previous_reading: bool          = Field(False, description="Previous reading available")
    prev_hr:              Optional[float] = Field(None, description="Previous heart rate (bpm)")
    prev_spo2:            Optional[float] = Field(None, description="Previous SpO₂ (%)")
    prev_sbp:             Optional[float] = Field(None, description="Previous systolic BP (mmHg)")
    prev_dbp:             Optional[float] = Field(None, description="Previous diastolic BP (mmHg)")

    @field_validator("dbp")
    @classmethod
    def _dbp_lt_sbp(cls, v, info):
        if "sbp" in info.data and v >= info.data["sbp"]:
            raise ValueError("DBP must be less than SBP")
        return v

    def to_dict(self) -> dict:
        d = self.model_dump()
        # Convert bools → int for feature engineering
        for k in ("diabetes", "hypertension", "heart_disease",
                   "chest_pain", "breathlessness", "fever",
                   "has_previous_reading"):
            if k in d:
                d[k] = int(d[k])
        return d


class PredictionResponse(BaseModel):
    risk_score:       int
    risk_category:    str
    risk_probability: float
    confidence:       float
    probabilities:    dict
    safety_override:  bool
    override_reason:  Optional[str]
    timestamp:        str
    inference_ms:     float


class BatchRequest(BaseModel):
    patients: list[PatientData] = Field(..., min_length=1, max_length=500)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    """Liveness probe."""
    artefacts_ok = os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH)
    return {
        "status":       "healthy" if artefacts_ok else "degraded",
        "artefacts":    artefacts_ok,
        "timestamp":    datetime.now(timezone.utc).isoformat(),
        "version":      "1.0.0",
    }


@app.get("/model/info", tags=["Model"])
async def model_info():
    """Return metadata about the loaded model artefacts."""
    info = {"model_path": MODEL_PATH, "scaler_path": SCALER_PATH}
    if os.path.exists(FEATURE_NAMES_PATH):
        with open(FEATURE_NAMES_PATH, "rb") as f:
            names = pickle.load(f)
        info["n_features"]     = len(names)
        info["feature_names"]  = names
    return info


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_endpoint(data: PatientData):
    """
    Predict health deterioration risk for a single patient.

    Returns risk score (1-3), category (Low/Medium/High), and
    per-class probabilities.  Safety overrides are applied automatically.
    """
    try:
        result = predict_risk(data.to_dict())
        return PredictionResponse(**result)
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model artefacts not found.  Run python train_model.py first.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch", tags=["Prediction"])
async def predict_batch_endpoint(request: BatchRequest):
    """
    Bulk prediction for up to 500 patients.
    Returns a list of PredictionResponse objects.
    """
    try:
        patient_dicts = [p.to_dict() for p in request.patients]
        results       = predict_batch(patient_dicts)
        return {"count": len(results), "predictions": results}
    except FileNotFoundError:
        raise HTTPException(
            status_code=503,
            detail="Model artefacts not found.  Run python train_model.py first.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/safety-check", tags=["Prediction"])
async def safety_check_endpoint(data: PatientData):
    """
    Run only the hard-coded safety rules (no ML).
    Useful for a fast triage gate before full prediction.
    """
    override = safety_check(data.to_dict())
    return {
        "safety_override": override is not None,
        "risk_category":   override or "Unknown (needs ML prediction)",
        "timestamp":       datetime.now(timezone.utc).isoformat(),
    }


# ── Dev entrypoint ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)
