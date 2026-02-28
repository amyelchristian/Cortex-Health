"""
data_processing.py
==================
Loads real patient data from PhysioNet MIMIC datasets (MIMIC-IV ED demo
and MIMIC-III Clinical Database demo), cleans and prepares it for the
patient-risk ML pipeline.

Data sources (auto-detected from ../Data/):
  - MIMIC-IV ED demo v2.2   → vitalsign, triage, edstays, diagnosis
  - MIMIC-III demo v1.4     → CHARTEVENTS, ADMISSIONS, ICUSTAYS, DIAGNOSES_ICD

Falls back to synthetic data if neither dataset is found.

Column schema produced (unchanged from original interface):
  hr, spo2, sbp, dbp, rr, temp,
  diabetes, hypertension, heart_disease, chest_pain, breathlessness, fever,
  has_previous_reading, prev_hr, prev_spo2, prev_sbp, prev_dbp,
  risk_score  (1=Low, 2=Medium, 3=High)
"""

import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

from config import VITAL_BOUNDS, RANDOM_STATE, TEST_SIZE, N_SAMPLES

warnings.filterwarnings("ignore")


# ── Path detection ─────────────────────────────────────────────────────────────

def _find_data_root() -> Path | None:
    """Search for the PhysioNet data directory relative to this script."""
    script_dir = Path(__file__).resolve().parent
    candidates = [
        script_dir.parent / "Data",   # ../Data/  (capital D – actual location)
        script_dir.parent / "data",   # ../data/  (lowercase)
        script_dir / "data",          # ./data/
        script_dir / "Data",          # ./Data/
    ]
    for p in candidates:
        if p.exists() and p.is_dir():
            return p
    return None


# ── ICD comorbidity helpers ────────────────────────────────────────────────────

def _icd_flags(dx: pd.DataFrame, id_col: str) -> pd.DataFrame:
    """
    Given a diagnoses DataFrame with columns [id_col, 'icd_code'],
    return a DataFrame indexed by id_col with binary comorbidity columns:
      diabetes, hypertension, heart_disease.
    ICD-9 and ICD-10 codes both handled.
    """
    # Normalise code column name
    code_col = next(
        (c for c in dx.columns if "icd" in c.lower() and "code" in c.lower()),
        dx.columns[-1],
    )

    dx = dx[[id_col, code_col]].copy()
    dx[code_col] = dx[code_col].astype(str).str.strip().str.upper()

    def _flag(pattern):
        return dx[code_col].str.startswith(pattern)

    # ICD-9: 250=diabetes, 401-405=hypertension, 410-429=heart disease
    # ICD-10: E11=diabetes, I10=hypertension, I2x/I5x=heart disease
    dx["diabetes"] = (
        _flag("250") | _flag("E10") | _flag("E11") | _flag("E13")
    ).astype(int)
    dx["hypertension"] = (
        _flag("401") | _flag("402") | _flag("403") | _flag("404") |
        _flag("405") | _flag("I10") | _flag("I11") | _flag("I12") |
        _flag("I13") | _flag("I15")
    ).astype(int)
    dx["heart_disease"] = (
        _flag("410") | _flag("411") | _flag("412") | _flag("413") |
        _flag("414") | _flag("428") | _flag("427") |
        _flag("I20") | _flag("I21") | _flag("I22") | _flag("I50")
    ).astype(int)

    flags = (
        dx.groupby(id_col)[["diabetes", "hypertension", "heart_disease"]]
        .max()
        .reset_index()
    )
    return flags


def _symptom_flags_from_complaint(series: pd.Series) -> pd.DataFrame:
    """
    Derive binary symptom flags from free-text chief complaint.
    Returns DataFrame with chest_pain, breathlessness, fever.
    """
    s = series.fillna("").str.lower()
    return pd.DataFrame({
        "chest_pain":     s.str.contains(r"chest.pain|chest pain|cp", regex=True).astype(int),
        "breathlessness": s.str.contains(r"breath|dyspnea|sob|shortness", regex=True).astype(int),
        "fever":          s.str.contains(r"fever|febrile|temp", regex=True).astype(int),
    })


# ── MIMIC-IV ED loader ─────────────────────────────────────────────────────────

def load_mimic_iv_ed_data(data_root: Path) -> pd.DataFrame | None:
    """
    Load MIMIC-IV ED demo data (vitalsign, triage, edstays, diagnosis).

    Returns a DataFrame in the standard schema, or None if files are missing.

    Label mapping:
      HOME / ELOPED / LAMA / LWBS  → 1  Low
      ADMITTED + acuity 3-4        → 2  Medium
      ADMITTED + acuity 1-2        → 3  High
      TRANSFER                     → 3  High
      OTHER                        → 2  Medium
    """
    ed_dir = data_root / "mimic-iv-ed-demo-2.2" / "ed"
    required = [
        ed_dir / "vitalsign.csv.gz",
        ed_dir / "edstays.csv.gz",
        ed_dir / "triage.csv.gz",
    ]
    if not all(p.exists() for p in required):
        return None

    print("[MIMIC-IV ED] Loading vital signs …")
    vs = pd.read_csv(ed_dir / "vitalsign.csv.gz")

    # ── aggregate multiple readings per stay ──────────────────────────────────
    # first reading  → "previous"; median of all readings → "current"
    vs_sorted = vs.sort_values(["stay_id", "charttime"])

    first = (
        vs_sorted.groupby("stay_id")
        [["heartrate", "o2sat", "sbp", "dbp"]]
        .first()
        .rename(columns={
            "heartrate": "prev_hr",
            "o2sat":     "prev_spo2",
            "sbp":       "prev_sbp",
            "dbp":       "prev_dbp",
        })
    )

    agg = (
        vs_sorted.groupby("stay_id")
        .agg(
            hr=("heartrate",   "median"),
            rr=("resprate",    "median"),
            spo2=("o2sat",     "median"),
            sbp=("sbp",        "median"),
            dbp=("dbp",        "median"),
            temp=("temperature","median"),
            n_readings=("charttime", "count"),
        )
    )
    vs_agg = agg.join(first).reset_index()

    # has_previous_reading = 1 if more than one vital-sign row existed
    vs_agg["has_previous_reading"] = (vs_agg["n_readings"] > 1).astype(int)
    # zero out prev_* when there was only one reading (no true "previous")
    single = vs_agg["has_previous_reading"] == 0
    for col in ["prev_hr", "prev_spo2", "prev_sbp", "prev_dbp"]:
        vs_agg.loc[single, col] = np.nan

    # ── load triage & edstays ─────────────────────────────────────────────────
    print("[MIMIC-IV ED] Loading triage and ED stays …")
    tr = pd.read_csv(ed_dir / "triage.csv.gz",
                     usecols=["stay_id", "acuity", "chiefcomplaint"])
    es = pd.read_csv(ed_dir / "edstays.csv.gz",
                     usecols=["stay_id", "hadm_id", "disposition"])

    df = es.merge(vs_agg, on="stay_id", how="inner")
    df = df.merge(tr, on="stay_id", how="left")

    # ── labels ────────────────────────────────────────────────────────────────
    low_disp  = {"HOME", "ELOPED", "LEFT AGAINST MEDICAL ADVICE",
                 "LEFT WITHOUT BEING SEEN"}
    high_disp = {"TRANSFER"}

    def _label(row):
        d = str(row["disposition"]).strip().upper()
        if d in low_disp:
            return 1
        if d in high_disp:
            return 3
        if d == "ADMITTED":
            acuity = row["acuity"]
            if pd.isna(acuity) or acuity >= 3:
                return 2
            return 3   # acuity 1 or 2 → critical
        return 2       # OTHER

    df["risk_score"] = df.apply(_label, axis=1)

    # ── comorbidities from diagnosis ──────────────────────────────────────────
    dx_path = ed_dir / "diagnosis.csv"
    if dx_path.exists():
        dx = pd.read_csv(dx_path, usecols=lambda c: c in
                         ["stay_id", "icd_code", "icd9_code"])
        id_col = "stay_id"
        flags = _icd_flags(dx, id_col)
        df = df.merge(flags, on="stay_id", how="left")
    for col in ["diabetes", "hypertension", "heart_disease"]:
        if col not in df.columns:
            df[col] = 0
        else:
            df[col] = df[col].fillna(0).astype(int)

    # ── symptom flags from chief complaint ────────────────────────────────────
    sym = _symptom_flags_from_complaint(df["chiefcomplaint"])
    df = pd.concat([df.reset_index(drop=True), sym.reset_index(drop=True)], axis=1)

    # ── select and return standard columns ────────────────────────────────────
    keep = [
        "hr", "spo2", "sbp", "dbp", "rr", "temp",
        "diabetes", "hypertension", "heart_disease",
        "chest_pain", "breathlessness", "fever",
        "has_previous_reading",
        "prev_hr", "prev_spo2", "prev_sbp", "prev_dbp",
        "risk_score",
    ]
    df = df[[c for c in keep if c in df.columns]].copy()

    print(f"[MIMIC-IV ED] Loaded {len(df):,} patient stays")
    print(f"[MIMIC-IV ED] Risk distribution:\n"
          f"{df['risk_score'].value_counts().sort_index().to_string()}")
    return df


# ── MIMIC-III loader ───────────────────────────────────────────────────────────

# CareVue and MetaVision itemids for the six core vitals
_MIMIC3_ITEMIDS = {
    "hr":   [211, 220045],
    "rr":   [618, 220210],
    "spo2": [646, 220277],
    "sbp":  [51, 455, 220179, 220050],   # arterial + NBP systolic
    "dbp":  [8441, 8368, 220180, 220051], # NBP + arterial diastolic
    "temp_f": [678, 679],                 # Temperature °F
    "temp_c": [676, 677],                 # Temperature °C → converted to °F
}

_ALL_VITAL_IDS = {iid for ids in _MIMIC3_ITEMIDS.values() for iid in ids}

_ITEMID_TO_FEAT: dict[int, str] = {}
for _feat, _ids in _MIMIC3_ITEMIDS.items():
    for _iid in _ids:
        _ITEMID_TO_FEAT[_iid] = _feat


def load_mimic_iii_data(data_root: Path) -> pd.DataFrame | None:
    """
    Load MIMIC-III demo data.

    Extracts vital signs from CHARTEVENTS (using known itemids),
    aggregates per hospital admission, and derives labels from
    ADMISSIONS (in-hospital mortality) + ICUSTAYS (ICU transfer).

    Label mapping:
      hospital_expire_flag = 1         → 3  High
      ICU stay exists (survived)       → 2  Medium
      No ICU, survived                 → 1  Low
    """
    iii_dir = data_root / "mimic-iii-clinical-database-demo-1.4"
    ce_path = iii_dir / "CHARTEVENTS.csv"
    adm_path = iii_dir / "ADMISSIONS.csv"
    icu_path = iii_dir / "ICUSTAYS.csv"

    if not all(p.exists() for p in [ce_path, adm_path, icu_path]):
        return None

    print("[MIMIC-III] Loading CHARTEVENTS (this may take a moment) …")
    ce = pd.read_csv(
        ce_path,
        usecols=["subject_id", "hadm_id", "itemid", "charttime", "valuenum"],
        dtype={"itemid": "int32"},
        low_memory=False,
    )
    ce = ce[ce["itemid"].isin(_ALL_VITAL_IDS)].dropna(subset=["valuenum"]).copy()
    ce["feature"] = ce["itemid"].map(_ITEMID_TO_FEAT)

    # Convert °C to °F
    mask_c = ce["feature"] == "temp_c"
    ce.loc[mask_c, "valuenum"] = ce.loc[mask_c, "valuenum"] * 9 / 5 + 32
    ce.loc[mask_c, "feature"] = "temp_f"
    ce["feature"] = ce["feature"].replace("temp_f", "temp")

    # Remove clearly impossible values before aggregation
    bounds = {
        "hr":   (20, 300),
        "rr":   (4, 60),
        "spo2": (50, 100),
        "sbp":  (40, 300),
        "dbp":  (20, 200),
        "temp": (88, 115),   # °F range
    }
    for feat, (lo, hi) in bounds.items():
        mask = ce["feature"] == feat
        ce = ce[~(mask & ~ce["valuenum"].between(lo, hi))]

    print("[MIMIC-III] Pivoting vitals per admission …")
    ce = ce.sort_values(["hadm_id", "feature", "charttime"])

    # First reading per (hadm_id, feature) → used as "previous"
    first_vals = (
        ce.groupby(["subject_id", "hadm_id", "feature"])["valuenum"]
        .first()
        .unstack("feature")
        .rename(columns=lambda c: f"prev_{c}")
        .reset_index()
    )

    # Count readings per vital per admission
    n_reads = (
        ce.groupby(["hadm_id", "feature"])["valuenum"]
        .count()
        .unstack("feature")
        .fillna(0)
        .reset_index()
    )

    # Median per (hadm_id, feature) → current vital value
    vitals = (
        ce.groupby(["subject_id", "hadm_id", "feature"])["valuenum"]
        .median()
        .unstack("feature")
        .reset_index()
    )
    vitals.columns.name = None

    # ── merge with admissions and ICU stays ──────────────────────────────────
    adm = pd.read_csv(
        adm_path,
        usecols=["subject_id", "hadm_id", "hospital_expire_flag"],
    )
    icu = pd.read_csv(
        icu_path,
        usecols=["hadm_id", "los"],
    )
    icu_grp = (
        icu.groupby("hadm_id")
        .agg(n_icu_stays=("los", "count"), max_icu_los=("los", "max"))
        .reset_index()
    )

    df = vitals.merge(adm, on=["subject_id", "hadm_id"], how="inner")
    df = df.merge(icu_grp, on="hadm_id", how="left")
    df["n_icu_stays"] = df["n_icu_stays"].fillna(0)

    # ── labels ────────────────────────────────────────────────────────────────
    df["risk_score"] = np.where(
        df["hospital_expire_flag"] == 1, 3,
        np.where(df["n_icu_stays"] > 0, 2, 1),
    )

    # ── previous reading columns ──────────────────────────────────────────────
    df = df.merge(
        first_vals[["subject_id", "hadm_id"]
                   + [c for c in first_vals.columns
                      if c.startswith("prev_")]],
        on=["subject_id", "hadm_id"],
        how="left",
    )

    # has_previous_reading: True if any vital had > 1 reading
    n_reads = n_reads.merge(
        df[["hadm_id"]], on="hadm_id", how="right"
    ).fillna(0)
    any_multiple = (n_reads.drop(columns=["hadm_id"]) > 1).any(axis=1)
    df["has_previous_reading"] = any_multiple.values.astype(int)

    # Zero out prev_* that equal current (only one reading)
    single = df["has_previous_reading"] == 0
    for col in ["prev_hr", "prev_spo2", "prev_sbp", "prev_dbp"]:
        if col in df.columns:
            df.loc[single, col] = np.nan

    # ── comorbidities from DIAGNOSES_ICD ─────────────────────────────────────
    dx_path = iii_dir / "DIAGNOSES_ICD.csv"
    if dx_path.exists():
        dx = pd.read_csv(dx_path, usecols=["hadm_id", "icd9_code"])
        dx = dx.rename(columns={"icd9_code": "icd_code"})
        flags = _icd_flags(dx, "hadm_id")
        df = df.merge(flags, on="hadm_id", how="left")

    for col in ["diabetes", "hypertension", "heart_disease"]:
        if col not in df.columns:
            df[col] = 0
        else:
            df[col] = df[col].fillna(0).astype(int)

    # Symptoms: not directly available in MIMIC-III CHARTEVENTS;
    # derive from ICD codes as a proxy
    if dx_path.exists():
        dx2 = pd.read_csv(dx_path, usecols=["hadm_id", "icd9_code"])
        dx2["icd9_code"] = dx2["icd9_code"].astype(str)
        chest = dx2[dx2["icd9_code"].str.startswith(
            ("7865", "4111", "4110", "41189", "4130")
        )]["hadm_id"].unique()
        breath = dx2[dx2["icd9_code"].str.startswith(
            ("7862", "5184", "5185", "4280", "4281")
        )]["hadm_id"].unique()
        fever_ids = dx2[dx2["icd9_code"].str.startswith(
            ("7800", "7801", "99591", "99590")
        )]["hadm_id"].unique()

        df["chest_pain"]    = df["hadm_id"].isin(chest).astype(int)
        df["breathlessness"] = df["hadm_id"].isin(breath).astype(int)
        df["fever"]         = df["hadm_id"].isin(fever_ids).astype(int)
    else:
        df["chest_pain"] = df["breathlessness"] = df["fever"] = 0

    # ── select standard columns ───────────────────────────────────────────────
    # Rename temp_f → temp if needed
    if "temp_f" in df.columns and "temp" not in df.columns:
        df.rename(columns={"temp_f": "temp"}, inplace=True)

    keep = [
        "hr", "spo2", "sbp", "dbp", "rr", "temp",
        "diabetes", "hypertension", "heart_disease",
        "chest_pain", "breathlessness", "fever",
        "has_previous_reading",
        "prev_hr", "prev_spo2", "prev_sbp", "prev_dbp",
        "risk_score",
    ]
    df = df[[c for c in keep if c in df.columns]].copy()

    print(f"[MIMIC-III] Loaded {len(df):,} hospital admissions")
    print(f"[MIMIC-III] Risk distribution:\n"
          f"{df['risk_score'].value_counts().sort_index().to_string()}")
    return df


# ── Synthetic data (fallback) ──────────────────────────────────────────────────

def _cohort(n: int, risk: int, rng: np.random.Generator) -> pd.DataFrame:
    """Draw one risk cohort with distributions calibrated to MIMIC-IV/eICU stats."""
    if risk == 1:
        hr   = rng.normal(75,  10, n).clip(55, 100)
        spo2 = rng.normal(98,   1, n).clip(95, 100)
        sbp  = rng.normal(120, 10, n).clip(100, 140)
        dbp  = rng.normal(78,   8, n).clip(60,  90)
        rr   = rng.normal(16,   2, n).clip(12,  20)
        temp = rng.normal(98.6, 0.5, n).clip(97, 99.5)
        p_dm, p_htn, p_hd = 0.10, 0.15, 0.05
        p_cp, p_sob, p_fv = 0.02, 0.02, 0.05
    elif risk == 2:
        hr   = rng.normal(95,  15, n).clip(60, 120)
        spo2 = rng.normal(94,   2, n).clip(90,  97)
        sbp  = rng.normal(138, 15, n).clip(100, 165)
        dbp  = rng.normal(88,  10, n).clip(60, 110)
        rr   = rng.normal(22,   3, n).clip(16,  30)
        temp = rng.normal(99.8, 0.8, n).clip(98, 102)
        p_dm, p_htn, p_hd = 0.35, 0.45, 0.20
        p_cp, p_sob, p_fv = 0.25, 0.35, 0.30
    else:
        hr   = rng.normal(118, 20, n).clip(40, 160)
        spo2 = rng.normal(88,   4, n).clip(70,  93)
        sbp  = rng.normal(158, 25, n).clip(85, 220)
        dbp  = rng.normal(95,  15, n).clip(50, 140)
        rr   = rng.normal(28,   4, n).clip(20,  40)
        temp = rng.normal(101.5, 1.2, n).clip(97, 107)
        p_dm, p_htn, p_hd = 0.55, 0.65, 0.45
        p_cp, p_sob, p_fv = 0.55, 0.70, 0.50

    diabetes      = rng.binomial(1, p_dm,  n)
    hypertension  = rng.binomial(1, p_htn, n)
    heart_disease = rng.binomial(1, p_hd,  n)
    chest_pain    = rng.binomial(1, p_cp,  n)
    breathlessness = rng.binomial(1, p_sob, n)
    fever         = rng.binomial(1, p_fv,  n)

    has_prev = rng.binomial(1, 0.70, n).astype(bool)
    prev_hr   = np.where(has_prev, hr   + rng.normal(0, 5,   n), np.nan)
    prev_spo2 = np.where(has_prev, spo2 + rng.normal(0, 1.5, n), np.nan)
    prev_sbp  = np.where(has_prev, sbp  + rng.normal(0, 8,   n), np.nan)
    prev_dbp  = np.where(has_prev, dbp  + rng.normal(0, 6,   n), np.nan)

    def sparse(arr, rate=0.02):
        out = arr.astype(float).copy()
        out[rng.random(n) < rate] = np.nan
        return out

    return pd.DataFrame({
        "hr": sparse(hr), "spo2": sparse(spo2),
        "sbp": sparse(sbp), "dbp": sparse(dbp),
        "rr": sparse(rr), "temp": sparse(temp),
        "diabetes": diabetes, "hypertension": hypertension,
        "heart_disease": heart_disease, "chest_pain": chest_pain,
        "breathlessness": breathlessness, "fever": fever,
        "has_previous_reading": has_prev.astype(int),
        "prev_hr": prev_hr, "prev_spo2": prev_spo2,
        "prev_sbp": prev_sbp, "prev_dbp": prev_dbp,
        "risk_score": risk,
    })


def generate_synthetic_patient_data(
    n_samples: int = N_SAMPLES,
    random_state: int = RANDOM_STATE,
) -> pd.DataFrame:
    """Generate synthetic cohort (~60 % Low, ~28 % Medium, ~12 % High)."""
    rng = np.random.default_rng(random_state)
    n_low    = int(n_samples * 0.60)
    n_medium = int(n_samples * 0.28)
    n_high   = n_samples - n_low - n_medium
    df = pd.concat(
        [_cohort(n_low, 1, rng), _cohort(n_medium, 2, rng), _cohort(n_high, 3, rng)],
        ignore_index=True,
    ).sample(frac=1, random_state=random_state).reset_index(drop=True)
    print(f"[DataGen] Generated {len(df):,} synthetic patient records")
    print(f"[DataGen] Risk distribution:\n"
          f"{df['risk_score'].value_counts().sort_index().to_string()}\n")
    return df


# ── Public entry point ─────────────────────────────────────────────────────────

def load_data(
    n_samples: int = N_SAMPLES,
    random_state: int = RANDOM_STATE,
) -> pd.DataFrame:
    """
    Load patient data.

    Priority:
      1. MIMIC-IV ED demo  (../Data/mimic-iv-ed-demo-2.2/)
      2. MIMIC-III demo    (../Data/mimic-iii-clinical-database-demo-1.4/)
      3. Synthetic fallback

    Both real datasets are combined when both are available.
    """
    print("=" * 60)
    print(" PATIENT DATA LOADING")
    print("=" * 60)

    data_root = _find_data_root()
    frames = []

    if data_root is not None:
        print(f"[DataLoad] Found data root: {data_root}\n")

        ed_df = load_mimic_iv_ed_data(data_root)
        if ed_df is not None:
            frames.append(ed_df)

        iii_df = load_mimic_iii_data(data_root)
        if iii_df is not None:
            frames.append(iii_df)
    else:
        print("[DataLoad] No PhysioNet data directory found.")

    if frames:
        real_df = pd.concat(frames, ignore_index=True)
        real_df = real_df.sample(frac=1, random_state=random_state).reset_index(drop=True)
        print(f"\n[DataLoad] Combined real data: {len(real_df):,} records")
        print(f"[DataLoad] Overall risk distribution:\n"
              f"{real_df['risk_score'].value_counts().sort_index().to_string()}\n")

        # If the real dataset is too small (demo subsets), augment with
        # synthetic data so the model has enough training signal.
        if len(real_df) < n_samples:
            n_synth = n_samples - len(real_df)
            print(f"[DataLoad] Real data ({len(real_df):,}) < target ({n_samples:,}).")
            print(f"[DataLoad] Augmenting with {n_synth:,} synthetic samples …\n")
            synth_df = generate_synthetic_patient_data(n_synth, random_state)
            df = pd.concat([real_df, synth_df], ignore_index=True)
            df = df.sample(frac=1, random_state=random_state).reset_index(drop=True)
            print(f"[DataLoad] Blended dataset: {len(df):,} records "
                  f"({len(real_df):,} real + {len(synth_df):,} synthetic)")
            print(f"[DataLoad] Final risk distribution:\n"
                  f"{df['risk_score'].value_counts().sort_index().to_string()}\n")
            return df

        return real_df

    # ── Fallback to synthetic ─────────────────────────────────────────────────
    print("[DataLoad] No real data loaded – using synthetic fallback.\n")
    return generate_synthetic_patient_data(n_samples, random_state)


# ── Cleaning helpers ───────────────────────────────────────────────────────────

def remove_outliers(df: pd.DataFrame) -> pd.DataFrame:
    """Drop rows with physiologically impossible vital values."""
    original = len(df)
    mask = pd.Series(True, index=df.index)
    for col, (lo, hi) in VITAL_BOUNDS.items():
        if col in df.columns:
            mask &= df[col].isna() | df[col].between(lo, hi)
    df_clean = df.loc[mask].copy()
    removed  = original - len(df_clean)
    if removed:
        print(f"[Outliers] Removed {removed:,} rows with impossible vital values")
    return df_clean


def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Imputation strategy
    -------------------
    * Rows with > 50 % missing vitals  →  dropped  (relaxed for small real data)
    * Core vitals                      →  median imputation
    * Previous-reading columns         →  median imputation
    """
    vital_cols = ["hr", "spo2", "sbp", "dbp", "rr", "temp"]
    prev_cols  = ["prev_hr", "prev_spo2", "prev_sbp", "prev_dbp"]

    # Drop rows where > half of the core vitals are missing
    n_vital_missing = df[vital_cols].isna().sum(axis=1)
    before = len(df)
    df = df[n_vital_missing <= 3].copy()    # allow up to 3 of 6 vitals missing
    dropped = before - len(df)
    if dropped:
        print(f"[Missing] Dropped {dropped:,} rows (>50 % core vitals missing)")

    # Median imputation for remaining missings
    for col in vital_cols + prev_cols:
        if col in df.columns and df[col].isna().any():
            df[col] = df[col].fillna(df[col].median())

    print(f"[Missing] After imputation: {len(df):,} records remain")
    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Full sequential cleaning pipeline."""
    print("\n" + "=" * 60)
    print(" DATA CLEANING")
    print("=" * 60)
    print(f"Initial records: {len(df):,}")
    df = remove_outliers(df)
    df = handle_missing_values(df)
    print(f"Final clean records: {len(df):,}\n")
    return df


# ── Train/test split & scaling ─────────────────────────────────────────────────

def prepare_train_test_split(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float  = TEST_SIZE,
    random_state: int = RANDOM_STATE,
) -> tuple:
    """Stratified 80/20 split preserving class proportions."""
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )
    print(f"\n[Split] Train: {len(X_tr):,}  |  Test: {len(X_te):,}")
    print(f"[Split] Train distribution:\n{y_tr.value_counts().sort_index().to_string()}")
    print(f"[Split] Test  distribution:\n{y_te.value_counts().sort_index().to_string()}\n")
    return X_tr, X_te, y_tr, y_te


def scale_features(
    X_train: pd.DataFrame,
    X_test:  pd.DataFrame,
) -> tuple:
    """
    Fit StandardScaler on training data, transform both splits.
    Returns (X_train_scaled, X_test_scaled, fitted_scaler).
    """
    scaler = StandardScaler()
    cols   = X_train.columns.tolist()
    X_tr_sc = pd.DataFrame(scaler.fit_transform(X_train), columns=cols)
    X_te_sc = pd.DataFrame(scaler.transform(X_test),      columns=cols)
    print(f"[Scaler] StandardScaler fitted on {len(X_train):,} training samples")
    return X_tr_sc, X_te_sc, scaler
