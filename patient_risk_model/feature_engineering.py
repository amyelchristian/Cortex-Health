"""
feature_engineering.py
======================
Creates all derived, trend, interaction, and instability features
described in the project specification.

Feature groups
--------------
1.  Core vitals            (6)   – passed through unchanged
2.  Medical history        (3)   – passed through unchanged
3.  Current symptoms       (3)   – passed through unchanged
4.  Trend features         (5)   – change vs previous reading
5.  Derived features       (5)   – MAP, Pulse Pressure, Shock Index, etc.
6.  Vital instability      (3)   – variability / deviation scores
7.  Interaction features   (4)   – cross-feature products
8.  Abnormality flags      (5)   – binary out-of-range indicators
"""

import numpy as np
import pandas as pd

from config import NORMAL_RANGES


# ── 1. Trend features ──────────────────────────────────────────────────────────

def create_trend_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute change between current and previous reading.
    Defaults to 0 when no previous reading exists (has_previous_reading == 0).
    """
    pairs = [
        ("hr",   "prev_hr"),
        ("spo2", "prev_spo2"),
        ("sbp",  "prev_sbp"),
        ("dbp",  "prev_dbp"),
    ]
    for cur, prv in pairs:
        col_name = f"{cur}_change"
        if prv in df.columns:
            change = df[cur] - df[prv]
            # Zero out where there is no previous reading
            df[col_name] = np.where(
                df.get("has_previous_reading", pd.Series(0, index=df.index)) == 1,
                change,
                0.0,
            )
        else:
            df[col_name] = 0.0

    # Temperature trend
    if "prev_temp" in df.columns:
        df["temp_change"] = np.where(
            df.get("has_previous_reading", pd.Series(0, index=df.index)) == 1,
            df["temp"] - df["prev_temp"],
            0.0,
        )
    else:
        df["temp_change"] = 0.0

    return df


# ── 2. Derived clinical features ───────────────────────────────────────────────

def create_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clinically-validated composite scores:
    - MAP  (Mean Arterial Pressure)
    - Pulse Pressure
    - Shock Index
    - HR-to-SpO2 ratio
    - MEWS-like component score
    """
    # Mean Arterial Pressure
    df["map"] = df["dbp"] + (df["sbp"] - df["dbp"]) / 3.0

    # Pulse Pressure
    df["pulse_pressure"] = df["sbp"] - df["dbp"]

    # Shock Index (high values ↔ haemodynamic instability)
    df["shock_index"] = df["hr"] / df["sbp"].replace(0, np.nan)
    df["shock_index"] = df["shock_index"].fillna(df["shock_index"].median())

    # HR-to-SpO2 ratio
    df["hr_spo2_ratio"] = df["hr"] / df["spo2"].replace(0, np.nan)
    df["hr_spo2_ratio"] = df["hr_spo2_ratio"].fillna(df["hr_spo2_ratio"].median())

    # Simplified MEWS component score
    # Scores each vital 0-3 points depending on deviation severity
    def _mews_hr(hr):
        return np.select(
            [hr < 40, hr < 51, hr < 101, hr < 111, hr < 130, hr >= 130],
            [2,       3,       0,        1,        2,        3],
            default=0,
        )

    def _mews_sbp(sbp):
        return np.select(
            [sbp < 70, sbp < 81, sbp < 101, sbp < 200, sbp >= 200],
            [3,        2,        1,         0,          2],
            default=0,
        )

    def _mews_rr(rr):
        return np.select(
            [rr < 9, rr < 15, rr < 21, rr < 30, rr >= 30],
            [2,      0,       0,       1,        2],
            default=0,
        )

    def _mews_temp(temp):
        temp_c = (temp - 32) * 5 / 9        # °F → °C
        return np.select(
            [temp_c < 35, temp_c < 38.5, temp_c >= 38.5],
            [2,           0,             2],
            default=0,
        )

    df["mews_score"] = (
        _mews_hr(df["hr"])
        + _mews_sbp(df["sbp"])
        + _mews_rr(df["rr"])
        + _mews_temp(df["temp"])
    )

    return df


# ── 3. Vital instability features ─────────────────────────────────────────────

def create_instability_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Quantify how far each patient deviates from a clinically-normal baseline.
    """
    # Normalised deviations from mid-point of normal range
    norms = {
        "hr":   (NORMAL_RANGES["hr"][0]   + NORMAL_RANGES["hr"][1])   / 2,   # 80
        "spo2": (NORMAL_RANGES["spo2"][0] + NORMAL_RANGES["spo2"][1]) / 2,   # 97.5
        "sbp":  (NORMAL_RANGES["sbp"][0]  + NORMAL_RANGES["sbp"][1])  / 2,   # 105
        "dbp":  (NORMAL_RANGES["dbp"][0]  + NORMAL_RANGES["dbp"][1])  / 2,   # 70
        "rr":   (NORMAL_RANGES["rr"][0]   + NORMAL_RANGES["rr"][1])   / 2,   # 16
        "temp": (NORMAL_RANGES["temp"][0] + NORMAL_RANGES["temp"][1]) / 2,   # 98.05
    }
    ranges = {
        k: (NORMAL_RANGES[k][1] - NORMAL_RANGES[k][0]) / 2 for k in norms
    }

    weights = {"hr": 0.25, "spo2": 0.30, "sbp": 0.20,
               "dbp": 0.10, "rr": 0.10, "temp": 0.05}

    instability = pd.Series(0.0, index=df.index)
    for col, w in weights.items():
        dev = (df[col] - norms[col]).abs() / max(ranges[col], 1e-6)
        instability += w * dev

    df["vital_instability_score"] = instability

    # HR variability proxy: |current – previous| (0 if no prior reading)
    if "hr_change" in df.columns:
        df["hr_variability"] = df["hr_change"].abs()
    else:
        df["hr_variability"] = 0.0

    # BP variability proxy: |pulse_pressure_change|
    if "sbp_change" in df.columns and "dbp_change" in df.columns:
        df["bp_variability"] = (df["sbp_change"] - df["dbp_change"]).abs()
    else:
        df["bp_variability"] = 0.0

    return df


# ── 4. Interaction features ────────────────────────────────────────────────────

def create_interaction_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cross-feature products capturing combined risk signals.
    """
    # Comorbidity × vital cross-terms
    df["diabetes_x_sbp"]       = df["diabetes"]      * df["sbp"]
    df["heart_disease_x_spo2"] = df["heart_disease"] * df["spo2"]

    # Symptom burden count
    symptom_cols = ["chest_pain", "breathlessness", "fever"]
    df["symptom_count"] = df[[c for c in symptom_cols if c in df.columns]].sum(axis=1)

    # Comorbidity count
    hx_cols = ["diabetes", "hypertension", "heart_disease"]
    df["comorbidity_count"] = df[[c for c in hx_cols if c in df.columns]].sum(axis=1)

    return df


# ── 5. Abnormality flags ───────────────────────────────────────────────────────

def create_abnormality_flags(df: pd.DataFrame) -> pd.DataFrame:
    """
    Binary flags for vitals outside normal ranges, plus a total count.
    """
    lo_hr,  hi_hr  = NORMAL_RANGES["hr"]
    lo_sp,  hi_sp  = NORMAL_RANGES["spo2"]
    lo_sb,  hi_sb  = NORMAL_RANGES["sbp"]
    lo_db,  hi_db  = NORMAL_RANGES["dbp"]
    _,      hi_tmp = NORMAL_RANGES["temp"]

    df["hr_abnormal"]   = ((df["hr"]   < lo_hr)  | (df["hr"]   > hi_hr)).astype(int)
    df["spo2_abnormal"] = (df["spo2"]  < lo_sp).astype(int)
    df["bp_abnormal"]   = ((df["sbp"]  > hi_sb)  | (df["dbp"]  > hi_db)).astype(int)
    df["temp_abnormal"] = (df["temp"]  > hi_tmp).astype(int)

    df["total_abnormal_vitals"] = (
        df["hr_abnormal"]
        + df["spo2_abnormal"]
        + df["bp_abnormal"]
        + df["temp_abnormal"]
    )
    return df


# ── Master pipeline ────────────────────────────────────────────────────────────

# Columns that are auxiliary (not ML features)
_DROP_COLS = [
    "has_previous_reading",
    "prev_hr", "prev_spo2", "prev_sbp", "prev_dbp", "prev_temp",
    "risk_score",
]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Full feature-engineering pipeline.
    Accepts a cleaned DataFrame (output of data_processing.clean_data).
    Returns (X, y) where X is the feature DataFrame and y the label Series.
    """
    print("=" * 60)
    print(" FEATURE ENGINEERING")
    print("=" * 60)

    df = df.copy()

    df = create_trend_features(df)
    print("[FE] Trend features created")

    df = create_derived_features(df)
    print("[FE] Derived clinical features created")

    df = create_instability_features(df)
    print("[FE] Instability features created")

    df = create_interaction_features(df)
    print("[FE] Interaction features created")

    df = create_abnormality_flags(df)
    print("[FE] Abnormality flags created")

    # Separate target
    y = df["risk_score"].copy()

    # Drop non-feature columns
    drop = [c for c in _DROP_COLS if c in df.columns]
    X = df.drop(columns=drop)

    print(f"[FE] Total features: {X.shape[1]}")
    print(f"[FE] Feature list:\n  {list(X.columns)}\n")

    return X, y


def engineer_single_patient(patient_dict: dict) -> pd.DataFrame:
    """
    Engineer features for a single patient dict (used at inference time).
    Returns a single-row DataFrame with all ML features.
    """
    # Ensure previous-reading columns exist
    defaults = {
        "has_previous_reading": 0,
        "prev_hr":   np.nan,
        "prev_spo2": np.nan,
        "prev_sbp":  np.nan,
        "prev_dbp":  np.nan,
    }
    for k, v in defaults.items():
        if k not in patient_dict:
            patient_dict[k] = v

    df = pd.DataFrame([patient_dict])

    df = create_trend_features(df)
    df = create_derived_features(df)
    df = create_instability_features(df)
    df = create_interaction_features(df)
    df = create_abnormality_flags(df)

    drop = [c for c in _DROP_COLS if c in df.columns]
    return df.drop(columns=drop, errors="ignore")
