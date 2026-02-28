#!/usr/bin/env python3
"""
CORTEX ML v3.0 - COMPREHENSIVE MODEL EVALUATION & REPORT GENERATOR
Loads trained model, reproduces test set, runs full evaluation, generates formatted report.
"""

import os
import sys
import json
import gzip
import time
import pickle
import warnings
from datetime import datetime

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, cohen_kappa_score,
    matthews_corrcoef, roc_auc_score
)
from sklearn.preprocessing import label_binarize

warnings.filterwarnings('ignore')
np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

print("=" * 70)
print("       CORTEX ML v3.0 - COMPREHENSIVE MODEL EVALUATION")
print("=" * 70)
print(f"Evaluation Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

# ═══════════════════════════════════════════════════════════════
# STEP 1: LOAD MODEL ARTIFACTS
# ═══════════════════════════════════════════════════════════════
print("STEP 1: LOADING MODEL ARTIFACTS")
print("-" * 50)

model = joblib.load(os.path.join(BASE_DIR, 'model_production.pkl'))
scaler = joblib.load(os.path.join(BASE_DIR, 'scaler_production.pkl'))
feature_names = joblib.load(os.path.join(BASE_DIR, 'feature_names_production.pkl'))
with open(os.path.join(BASE_DIR, 'model_metadata.json'), 'r') as f:
    metadata = json.load(f)
with open(os.path.join(BASE_DIR, 'threshold_config.json'), 'r') as f:
    threshold_config = json.load(f)

model_size_mb = os.path.getsize(os.path.join(BASE_DIR, 'model_production.pkl')) / (1024 * 1024)

print(f"  Model: {model.__class__.__name__} (v{metadata['version']})")
print(f"  Model size: {model_size_mb:.1f} MB")
print(f"  Features: {len(feature_names)}")
print(f"  Optimal threshold: {threshold_config['optimal_threshold']}")
print(f"  Training date: {metadata['training_date']}")
print()

# ═══════════════════════════════════════════════════════════════
# STEP 2: REPRODUCE TEST SET (same pipeline as training)
# ═══════════════════════════════════════════════════════════════
print("STEP 2: REPRODUCING TEST SET (same pipeline as training)")
print("-" * 50)

# Load all data sources
print("[1/4] Loading Dataset.csv...")
df_main = pd.read_csv(os.path.join(DATA_DIR, 'Dataset.csv'), low_memory=False)
print(f"  -> {len(df_main):,} records")

print("[2/4] Loading CHARTEVENTS.csv...")
df_chart = pd.read_csv(os.path.join(DATA_DIR, 'CHARTEVENTS.csv'), low_memory=False)
print(f"  -> {len(df_chart):,} records")

print("[3/4] Loading stroke data...")
df_stroke = pd.read_csv(os.path.join(DATA_DIR, 'healthcare-dataset-stroke-data.csv'))
print(f"  -> {len(df_stroke):,} records")

print("[4/4] Loading MIMIC-IV ED...")
with gzip.open(os.path.join(DATA_DIR, 'mimic-iv-ed-demo-2.2', 'ed', 'vitalsign.csv.gz'), 'rt') as f:
    df_ed = pd.read_csv(f)
with gzip.open(os.path.join(DATA_DIR, 'mimic-iv-ed-demo-2.2', 'ed', 'triage.csv.gz'), 'rt') as f:
    df_triage = pd.read_csv(f)
with gzip.open(os.path.join(DATA_DIR, 'mimic-iv-ed-demo-2.2', 'ed', 'edstays.csv.gz'), 'rt') as f:
    df_edstays = pd.read_csv(f)
print(f"  -> {len(df_ed):,} vitalsign + {len(df_triage):,} triage + {len(df_edstays):,} edstays")

# Process datasets (identical to training pipeline)
print("\nProcessing data (identical pipeline to training)...")

# Process main dataset
df1 = df_main[['HR', 'O2Sat', 'Temp', 'SBP', 'MAP', 'DBP', 'Resp', 'Age', 'Gender', 'SepsisLabel', 'Patient_ID']].copy()
df1.columns = ['hr', 'spo2', 'temp', 'sbp', 'map', 'dbp', 'rr', 'age', 'gender', 'sepsis_label', 'patient_id']
temp_median = df1['temp'].dropna().median()
if temp_median < 45:
    df1['temp'] = df1['temp'] * 9/5 + 32
df1['source'] = 'sepsis_challenge'

# Process CHARTEVENTS
vital_items = {220045: 'hr', 220210: 'rr', 223761: 'temp', 220179: 'sbp', 220180: 'dbp', 220277: 'spo2', 220052: 'map'}
df_chart_vitals = df_chart[df_chart['itemid'].isin(vital_items.keys())].copy()
df_chart_vitals['vital_name'] = df_chart_vitals['itemid'].map(vital_items)
df_chart_vitals['valuenum'] = pd.to_numeric(df_chart_vitals['valuenum'], errors='coerce')
chart_pivot = df_chart_vitals.pivot_table(
    index=['subject_id', 'charttime'], columns='vital_name', values='valuenum', aggfunc='first'
).reset_index()
chart_pivot.columns.name = None
chart_pivot = chart_pivot.rename(columns={'subject_id': 'patient_id'})
chart_pivot['source'] = 'mimic_chart'

# Process ED
df_ed2 = df_ed.rename(columns={'heartrate': 'hr', 'resprate': 'rr', 'o2sat': 'spo2', 'subject_id': 'patient_id'})
df_ed2 = df_ed2.merge(df_edstays[['stay_id', 'disposition']], on='stay_id', how='left')
df_ed2['source'] = 'mimic_ed'

# Process stroke
df_stroke2 = df_stroke.rename(columns={'id': 'patient_id', 'avg_glucose_level': 'glucose'})
df_stroke2['bmi'] = pd.to_numeric(df_stroke2['bmi'], errors='coerce')
df_stroke2['source'] = 'stroke'

# Combine
all_cols = ['patient_id', 'hr', 'spo2', 'temp', 'sbp', 'dbp', 'map', 'rr', 'age', 'gender', 'source']
extra_cols = ['sepsis_label', 'disposition', 'hypertension', 'heart_disease', 'stroke']
use_cols = all_cols + extra_cols

for df_tmp in [df1, chart_pivot, df_ed2, df_stroke2]:
    for col in use_cols:
        if col not in df_tmp.columns:
            df_tmp[col] = np.nan

df_combined = pd.concat([
    df1[use_cols], chart_pivot[use_cols], df_ed2[use_cols], df_stroke2[use_cols]
], ignore_index=True)
original_size = len(df_combined)

# Data cleaning (identical to training)
vital_cols = ['hr', 'spo2', 'temp', 'sbp', 'dbp', 'map', 'rr']
for col in vital_cols:
    df_combined[col] = pd.to_numeric(df_combined[col], errors='coerce')

vitals_present = df_combined[vital_cols].notna().sum(axis=1)
df_combined = df_combined[vitals_present >= 2].copy()

df_combined = df_combined.drop_duplicates(subset=vital_cols + ['patient_id'], keep='first')

df_combined.loc[(df_combined['hr'] < 20) | (df_combined['hr'] > 200), 'hr'] = np.nan
df_combined.loc[(df_combined['spo2'] < 50) | (df_combined['spo2'] > 100), 'spo2'] = np.nan
df_combined.loc[(df_combined['sbp'] < 50) | (df_combined['sbp'] > 250), 'sbp'] = np.nan
df_combined.loc[(df_combined['dbp'] < 30) | (df_combined['dbp'] > 150), 'dbp'] = np.nan
df_combined.loc[(df_combined['rr'] < 5) | (df_combined['rr'] > 50), 'rr'] = np.nan
df_combined.loc[(df_combined['temp'] < 90) | (df_combined['temp'] > 110), 'temp'] = np.nan
df_combined.loc[(df_combined['map'] < 30) | (df_combined['map'] > 200), 'map'] = np.nan

vitals_present_after = df_combined[vital_cols].notna().sum(axis=1)
df_combined = df_combined[vitals_present_after >= 2].copy()

# Impute missing
for col in vital_cols:
    median_val = df_combined[col].median()
    df_combined[col] = df_combined[col].fillna(median_val)

# Age/gender
df_combined['age'] = pd.to_numeric(df_combined['age'], errors='coerce')
df_combined['age'] = df_combined['age'].fillna(df_combined['age'].median())
df_combined.loc[df_combined['age'] > 120, 'age'] = df_combined['age'].median()
df_combined.loc[df_combined['age'] < 0, 'age'] = df_combined['age'].median()
df_combined['gender'] = pd.to_numeric(df_combined['gender'], errors='coerce').fillna(0)

# Assign risk labels (v3.0 - vitals only, no outcome leakage)
def assign_risk_label(row):
    high_risk_count = 0
    medium_risk_count = 0
    if pd.notna(row['spo2']):
        if row['spo2'] < 90: high_risk_count += 2
        elif row['spo2'] < 94: medium_risk_count += 1
    if pd.notna(row['hr']):
        if row['hr'] > 130 or row['hr'] < 40: high_risk_count += 2
        elif row['hr'] > 100 or row['hr'] < 50: medium_risk_count += 1
    if pd.notna(row['sbp']):
        if row['sbp'] > 180 or row['sbp'] < 90: high_risk_count += 2
        elif row['sbp'] > 140 or row['sbp'] < 100: medium_risk_count += 1
    if pd.notna(row['dbp']):
        if row['dbp'] > 120 or row['dbp'] < 40: high_risk_count += 1
        elif row['dbp'] > 90 or row['dbp'] < 60: medium_risk_count += 1
    if pd.notna(row['rr']):
        if row['rr'] > 30 or row['rr'] < 8: high_risk_count += 2
        elif row['rr'] > 20 or row['rr'] < 12: medium_risk_count += 1
    if pd.notna(row['temp']):
        if row['temp'] > 104 or row['temp'] < 95: high_risk_count += 1
        elif row['temp'] > 100.4 or row['temp'] < 96.8: medium_risk_count += 1
    if high_risk_count >= 2: return 3
    elif high_risk_count >= 1 or medium_risk_count >= 2: return 2
    else: return 1

df_combined['risk_level'] = df_combined.apply(assign_risk_label, axis=1)
clean_size = len(df_combined)

# Feature engineering (identical to training)
df_combined['map'] = np.where(
    df_combined['map'].isna() | (df_combined['map'] == 0),
    df_combined['dbp'] + (df_combined['sbp'] - df_combined['dbp']) / 3,
    df_combined['map']
)
df_combined['hypertension'] = df_combined['hypertension'].fillna(0).astype(int)
df_combined['heart_disease'] = df_combined['heart_disease'].fillna(0).astype(int)
df_combined['diabetes'] = 0
df_combined['pulse_pressure'] = df_combined['sbp'] - df_combined['dbp']
df_combined['shock_index'] = df_combined['hr'] / df_combined['sbp'].replace(0, np.nan)
df_combined['shock_index'] = df_combined['shock_index'].fillna(df_combined['shock_index'].median())

def calc_mews(row):
    score = 0
    if row['hr'] < 40 or row['hr'] > 130: score += 3
    elif row['hr'] > 110: score += 2
    elif row['hr'] < 50 or row['hr'] > 100: score += 1
    if row['sbp'] < 70: score += 3
    elif row['sbp'] < 80: score += 2
    elif row['sbp'] < 100 or row['sbp'] > 200: score += 1
    if row['rr'] < 9 or row['rr'] > 30: score += 3
    elif row['rr'] > 20: score += 2
    elif row['rr'] < 14 or row['rr'] > 15: score += 1
    if row['temp'] > 104: score += 2
    elif row['temp'] < 95 or row['temp'] > 101.3: score += 1
    if row['spo2'] < 85: score += 3
    elif row['spo2'] < 90: score += 2
    elif row['spo2'] < 94: score += 1
    return score

df_combined['mews_score'] = df_combined.apply(calc_mews, axis=1)
df_combined['hr_abnormal'] = ((df_combined['hr'] > 100) | (df_combined['hr'] < 60)).astype(int)
df_combined['spo2_abnormal'] = (df_combined['spo2'] < 94).astype(int)
df_combined['bp_abnormal'] = ((df_combined['sbp'] > 140) | (df_combined['sbp'] < 90) |
                               (df_combined['dbp'] > 90) | (df_combined['dbp'] < 60)).astype(int)
df_combined['temp_abnormal'] = ((df_combined['temp'] > 100.4) | (df_combined['temp'] < 96.8)).astype(int)
df_combined['rr_abnormal'] = ((df_combined['rr'] > 20) | (df_combined['rr'] < 12)).astype(int)
df_combined['total_abnormal_vitals'] = (df_combined['hr_abnormal'] + df_combined['spo2_abnormal'] +
                                         df_combined['bp_abnormal'] + df_combined['temp_abnormal'] +
                                         df_combined['rr_abnormal'])
df_combined['vital_instability_score'] = (
    df_combined['hr_abnormal'] * 1.5 + df_combined['spo2_abnormal'] * 2.0 +
    df_combined['bp_abnormal'] * 1.5 + df_combined['temp_abnormal'] * 1.0 +
    df_combined['rr_abnormal'] * 1.5 + df_combined['mews_score'] * 0.5
)
df_combined['hr_spo2_ratio'] = df_combined['hr'] / df_combined['spo2'].replace(0, np.nan)
df_combined['hr_spo2_ratio'] = df_combined['hr_spo2_ratio'].fillna(df_combined['hr_spo2_ratio'].median())
df_combined['symptom_count'] = df_combined['hypertension'] + df_combined['heart_disease'] + df_combined['diabetes']
df_combined['pp_ratio'] = df_combined['pulse_pressure'] / df_combined['sbp'].replace(0, np.nan)
df_combined['pp_ratio'] = df_combined['pp_ratio'].fillna(df_combined['pp_ratio'].median())
df_combined['dbp_sbp_ratio'] = df_combined['dbp'] / df_combined['sbp'].replace(0, np.nan)
df_combined['dbp_sbp_ratio'] = df_combined['dbp_sbp_ratio'].fillna(df_combined['dbp_sbp_ratio'].median())
df_combined['hr_squared'] = df_combined['hr'] ** 2 / 10000
df_combined['spo2_deficit'] = 100 - df_combined['spo2']
df_combined['spo2_deficit_sq'] = df_combined['spo2_deficit'] ** 2 / 100
df_combined['age_group'] = pd.cut(df_combined['age'], bins=[0, 30, 50, 65, 80, 120],
                                   labels=[0, 1, 2, 3, 4]).astype(float).fillna(2)
df_combined['age_risk'] = (df_combined['age'] > 65).astype(int)
df_combined['cardio_risk'] = (df_combined['hr_abnormal'] + df_combined['bp_abnormal'] +
                               df_combined['heart_disease'] + (df_combined['shock_index'] > 0.9).astype(int))
df_combined['respiratory_risk'] = (df_combined['spo2_abnormal'] + df_combined['rr_abnormal'] +
                                    (df_combined['spo2'] < 92).astype(int))
df_combined['critical_score'] = (df_combined['vital_instability_score'] +
                                  df_combined['mews_score'] * 0.3 + df_combined['age_risk'] * 0.5)
df_combined['hr_deviation'] = abs(df_combined['hr'] - 75) / 75
df_combined['sbp_deviation'] = abs(df_combined['sbp'] - 120) / 120
df_combined['rr_deviation'] = abs(df_combined['rr'] - 16) / 16
df_combined['critical_spo2_flag'] = (df_combined['spo2'] < 90).astype(int)
df_combined['critical_hr_flag'] = ((df_combined['hr'] < 40) | (df_combined['hr'] > 130)).astype(int)
df_combined['critical_bp_flag'] = ((df_combined['sbp'] < 90) | (df_combined['sbp'] > 180)).astype(int)
df_combined['critical_rr_flag'] = ((df_combined['rr'] < 8) | (df_combined['rr'] > 30)).astype(int)
df_combined['critical_temp_flag'] = ((df_combined['temp'] < 95) | (df_combined['temp'] > 104)).astype(int)
df_combined['multi_critical_flag'] = (
    (df_combined['critical_spo2_flag'] + df_combined['critical_hr_flag'] +
     df_combined['critical_bp_flag'] + df_combined['critical_rr_flag'] +
     df_combined['critical_temp_flag']) >= 2
).astype(int)
df_combined['emergency_score'] = (
    df_combined['critical_spo2_flag'] * 3.0 +
    df_combined['critical_hr_flag'] * 2.5 +
    df_combined['critical_bp_flag'] * 2.5 +
    df_combined['critical_rr_flag'] * 2.0 +
    df_combined['critical_temp_flag'] * 1.5 +
    df_combined['multi_critical_flag'] * 3.0 +
    (df_combined['shock_index'] > 1.0).astype(int) * 2.0
)

feature_cols = list(feature_names)

X = df_combined[feature_cols].copy()
y = df_combined['risk_level'].copy()

for col in feature_cols:
    X[col] = pd.to_numeric(X[col], errors='coerce')
    if X[col].isna().any():
        X[col] = X[col].fillna(X[col].median())
X = X.replace([np.inf, -np.inf], np.nan)
for col in feature_cols:
    if X[col].isna().any():
        X[col] = X[col].fillna(X[col].median())

# Same split as training (random_state=42, test_size=0.2, stratified)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scale using the SAVED scaler (not refit)
X_test_scaled = scaler.transform(X_test)
X_train_scaled = scaler.transform(X_train)

# Determine class mapping: model may use 0-indexed (0,1,2) or 1-indexed (1,2,3)
model_classes = sorted(model.classes_.tolist())
if model_classes == [0, 1, 2]:
    # XGBoost remapped to 0-indexed; remap y_train/y_test to match
    y_train = y_train - 1
    y_test = y_test - 1
    risk_names = {0: 'Low', 1: 'Medium', 2: 'High'}
    class_labels = [0, 1, 2]
else:
    risk_names = {1: 'Low', 2: 'Medium', 3: 'High'}
    class_labels = [1, 2, 3]

print(f"  Model classes: {model_classes}")
print(f"  Total clean records: {clean_size:,}")
print(f"  Training set: {len(X_train):,}")
print(f"  Test set: {len(X_test):,}")
print(f"  Features: {len(feature_cols)}")
print()
print("  Test set class distribution:")
for level in sorted(y_test.unique()):
    count = (y_test == level).sum()
    print(f"    {risk_names[level]} Risk ({level}): {count:,} ({count/len(y_test)*100:.1f}%)")
print()

# ═══════════════════════════════════════════════════════════════
# STEP 3: COMPREHENSIVE EVALUATION
# ═══════════════════════════════════════════════════════════════
print("STEP 3: COMPREHENSIVE EVALUATION")
print("-" * 50)

# Predictions
print("Making predictions...")
start_time = time.time()
y_pred = model.predict(X_test_scaled)
pred_time = time.time() - start_time
print(f"  Predictions complete in {pred_time:.3f}s")

# Probabilities
y_pred_proba = model.predict_proba(X_test_scaled)

# Train predictions (for gap)
y_train_pred = model.predict(X_train_scaled)
train_accuracy = accuracy_score(y_train, y_train_pred)

# Overall metrics
test_accuracy = accuracy_score(y_test, y_pred)
macro_f1 = f1_score(y_test, y_pred, average='macro')
weighted_f1 = f1_score(y_test, y_pred, average='weighted')
kappa = cohen_kappa_score(y_test, y_pred)
mcc = matthews_corrcoef(y_test, y_pred)
train_test_gap = abs(train_accuracy - test_accuracy)

# Per-class metrics
precision_per = precision_score(y_test, y_pred, average=None, labels=class_labels)
recall_per = recall_score(y_test, y_pred, average=None, labels=class_labels)
f1_per = f1_score(y_test, y_pred, average=None, labels=class_labels)

# ROC-AUC
y_test_bin = label_binarize(y_test, classes=class_labels)
roc_macro = roc_auc_score(y_test_bin, y_pred_proba, average='macro', multi_class='ovr')
roc_weighted = roc_auc_score(y_test_bin, y_pred_proba, average='weighted', multi_class='ovr')
roc_per_class = []
for i in range(3):
    roc_per_class.append(roc_auc_score(y_test_bin[:, i], y_pred_proba[:, i]))

# Confusion matrix
cm = confusion_matrix(y_test, y_pred, labels=class_labels)

# Inference latency
print("Measuring inference latency...")
n_latency = 1000
sample_idx = np.random.choice(len(X_test_scaled), n_latency, replace=False)
latencies = []
for i in sample_idx:
    t0 = time.time()
    _ = model.predict(X_test_scaled[i:i+1])
    latencies.append((time.time() - t0) * 1000)
latencies = np.array(latencies)
lat_mean = np.mean(latencies)
lat_median = np.median(latencies)
lat_p95 = np.percentile(latencies, 95)
lat_p99 = np.percentile(latencies, 99)
lat_min = np.min(latencies)
lat_max = np.max(latencies)

# Batch throughput
t0 = time.time()
_ = model.predict(X_test_scaled[:10000])
batch_time = time.time() - t0
throughput = 10000 / batch_time

print(f"  Mean latency: {lat_mean:.2f}ms | P95: {lat_p95:.2f}ms")
print()

# Clinical test cases
print("Running clinical test cases...")

clinical_tests = [
    {
        'name': 'Normal healthy patient',
        'expected': 'Low',
        'vitals': {'hr': 72, 'spo2': 98, 'temp': 98.6, 'sbp': 120, 'dbp': 80, 'rr': 16,
                   'age': 35, 'gender': 1, 'hypertension': 0, 'heart_disease': 0}
    },
    {
        'name': 'Moderate risk patient',
        'expected': 'Medium',
        'vitals': {'hr': 105, 'spo2': 93, 'temp': 100.5, 'sbp': 145, 'dbp': 92, 'rr': 22,
                   'age': 55, 'gender': 0, 'hypertension': 1, 'heart_disease': 0}
    },
    {
        'name': 'Critical patient',
        'expected': 'High',
        'vitals': {'hr': 140, 'spo2': 85, 'temp': 103, 'sbp': 85, 'dbp': 50, 'rr': 32,
                   'age': 70, 'gender': 1, 'hypertension': 1, 'heart_disease': 1}
    },
    {
        'name': 'Safety: SpO2=85%',
        'expected': 'High',
        'vitals': {'hr': 80, 'spo2': 85, 'temp': 98.6, 'sbp': 120, 'dbp': 80, 'rr': 18,
                   'age': 50, 'gender': 0, 'hypertension': 0, 'heart_disease': 0}
    },
    {
        'name': 'Safety: HR=160',
        'expected': 'High',
        'vitals': {'hr': 160, 'spo2': 96, 'temp': 98.6, 'sbp': 130, 'dbp': 85, 'rr': 20,
                   'age': 45, 'gender': 1, 'hypertension': 0, 'heart_disease': 0}
    },
    {
        'name': 'Safety: SBP=85',
        'expected': 'High',
        'vitals': {'hr': 100, 'spo2': 95, 'temp': 99.0, 'sbp': 85, 'dbp': 55, 'rr': 22,
                   'age': 60, 'gender': 0, 'hypertension': 1, 'heart_disease': 0}
    },
    {
        'name': 'Borderline case',
        'expected': 'Low/Medium',
        'vitals': {'hr': 95, 'spo2': 95, 'temp': 99.5, 'sbp': 135, 'dbp': 85, 'rr': 18,
                   'age': 50, 'gender': 1, 'hypertension': 0, 'heart_disease': 0}
    },
    {
        'name': 'Elderly w/ comorbidities',
        'expected': 'Medium',
        'vitals': {'hr': 92, 'spo2': 94, 'temp': 99.2, 'sbp': 150, 'dbp': 88, 'rr': 20,
                   'age': 78, 'gender': 1, 'hypertension': 1, 'heart_disease': 1}
    },
    {
        'name': 'Isolated hypertension',
        'expected': 'Medium/High',
        'vitals': {'hr': 88, 'spo2': 96, 'temp': 98.4, 'sbp': 185, 'dbp': 100, 'rr': 18,
                   'age': 62, 'gender': 0, 'hypertension': 1, 'heart_disease': 0}
    },
]

def build_features(vitals_dict):
    """Build full 44-feature vector from basic vitals."""
    v = vitals_dict
    hr = v['hr']; spo2 = v['spo2']; temp = v['temp']; sbp = v['sbp']
    dbp = v['dbp']; rr = v.get('rr', 16); age = v.get('age', 50)
    gender = v.get('gender', 0)
    hyp = v.get('hypertension', 0); hd = v.get('heart_disease', 0); diab = 0

    map_val = dbp + (sbp - dbp) / 3
    pp = sbp - dbp
    si = hr / sbp if sbp > 0 else 0

    # MEWS
    mews = 0
    if hr < 40 or hr > 130: mews += 3
    elif hr > 110: mews += 2
    elif hr < 50 or hr > 100: mews += 1
    if sbp < 70: mews += 3
    elif sbp < 80: mews += 2
    elif sbp < 100 or sbp > 200: mews += 1
    if rr < 9 or rr > 30: mews += 3
    elif rr > 20: mews += 2
    elif rr < 14 or rr > 15: mews += 1
    if temp > 104: mews += 2
    elif temp < 95 or temp > 101.3: mews += 1
    if spo2 < 85: mews += 3
    elif spo2 < 90: mews += 2
    elif spo2 < 94: mews += 1

    hr_abn = int(hr > 100 or hr < 60)
    spo2_abn = int(spo2 < 94)
    bp_abn = int(sbp > 140 or sbp < 90 or dbp > 90 or dbp < 60)
    temp_abn = int(temp > 100.4 or temp < 96.8)
    rr_abn = int(rr > 20 or rr < 12)
    total_abn = hr_abn + spo2_abn + bp_abn + temp_abn + rr_abn

    vis = hr_abn * 1.5 + spo2_abn * 2.0 + bp_abn * 1.5 + temp_abn * 1.0 + rr_abn * 1.5 + mews * 0.5

    hr_spo2 = hr / spo2 if spo2 > 0 else 0
    symp = hyp + hd + diab
    pp_ratio = pp / sbp if sbp > 0 else 0
    dbp_sbp = dbp / sbp if sbp > 0 else 0
    hr_sq = hr ** 2 / 10000
    spo2_def = 100 - spo2
    spo2_def_sq = spo2_def ** 2 / 100

    if age <= 30: ag = 0
    elif age <= 50: ag = 1
    elif age <= 65: ag = 2
    elif age <= 80: ag = 3
    else: ag = 4

    age_r = int(age > 65)
    cardio = hr_abn + bp_abn + hd + int(si > 0.9)
    resp = spo2_abn + rr_abn + int(spo2 < 92)
    crit_score = vis + mews * 0.3 + age_r * 0.5
    hr_dev = abs(hr - 75) / 75
    sbp_dev = abs(sbp - 120) / 120
    rr_dev = abs(rr - 16) / 16

    c_spo2 = int(spo2 < 90)
    c_hr = int(hr < 40 or hr > 130)
    c_bp = int(sbp < 90 or sbp > 180)
    c_rr = int(rr < 8 or rr > 30)
    c_temp = int(temp < 95 or temp > 104)
    multi_crit = int((c_spo2 + c_hr + c_bp + c_rr + c_temp) >= 2)
    emerg = c_spo2 * 3.0 + c_hr * 2.5 + c_bp * 2.5 + c_rr * 2.0 + c_temp * 1.5 + multi_crit * 3.0 + int(si > 1.0) * 2.0

    return [hr, spo2, temp, sbp, dbp, map_val, rr, age, gender, ag,
            hyp, hd, diab, pp, si, mews, hr_abn, spo2_abn, bp_abn, temp_abn, rr_abn,
            total_abn, vis, cardio, resp, crit_score, hr_spo2, symp, pp_ratio, dbp_sbp,
            hr_sq, spo2_def, spo2_def_sq, age_r, hr_dev, sbp_dev, rr_dev,
            c_spo2, c_hr, c_bp, c_rr, c_temp, multi_crit, emerg]

clinical_results = []
for test in clinical_tests:
    features = build_features(test['vitals'])
    features_scaled = scaler.transform([features])
    pred_class = model.predict(features_scaled)[0]
    pred_proba = model.predict_proba(features_scaled)[0]
    pred_name = risk_names[int(pred_class)]

    expected = test['expected']
    if '/' in expected:
        parts = expected.split('/')
        passed = pred_name in parts
    else:
        passed = pred_name == expected

    clinical_results.append({
        'name': test['name'],
        'expected': expected,
        'predicted': pred_name,
        'confidence': max(pred_proba) * 100,
        'passed': passed
    })

clinical_passed = sum(1 for r in clinical_results if r['passed'])
clinical_total = len(clinical_results)
print(f"  Clinical tests: {clinical_passed}/{clinical_total} passed")
print()

# ═══════════════════════════════════════════════════════════════
# STEP 4: DATA SOURCE BREAKDOWN
# ═══════════════════════════════════════════════════════════════
print("STEP 4: DATA SOURCE ANALYSIS")
print("-" * 50)

source_counts = {
    'Dataset.csv (Sepsis Challenge)': len(df_main),
    'CHARTEVENTS.csv (MIMIC)': len(df_chart),
    'Stroke Data': len(df_stroke),
    'MIMIC-IV ED vitalsign': len(df_ed),
    'MIMIC-IV ED triage': len(df_triage),
    'MIMIC-IV ED edstays': len(df_edstays),
}
total_raw = sum(source_counts.values())
print("  Raw data sources:")
for name, count in source_counts.items():
    print(f"    {name}: {count:,}")
print(f"  Total raw records: {total_raw:,}")
print(f"  After cleaning: {clean_size:,}")
print(f"  Training samples: {len(X_train):,}")
print(f"  Test samples: {len(X_test):,}")
print(f"  Synthetic data: 0 (SMOTE disabled)")
print(f"  Real patient data: 100%")
print()

# ═══════════════════════════════════════════════════════════════
# STEP 5: GENERATE COMPREHENSIVE REPORT
# ═══════════════════════════════════════════════════════════════
print("STEP 5: GENERATING COMPREHENSIVE REPORT")
print("-" * 50)

# Target verification
targets = [
    ('Overall Accuracy',  '>= 98%',    test_accuracy * 100,   'pct',  lambda v: v >= 98.0),
    ('High-Risk Recall',  '>= 95%',    recall_per[2] * 100,   'pct',  lambda v: v >= 95.0),
    ('Medium-Risk Recall', '>= 90%',   recall_per[1] * 100,   'pct',  lambda v: v >= 90.0),
    ('Low-Risk Recall',   '>= 95%',    recall_per[0] * 100,   'pct',  lambda v: v >= 95.0),
    ('Macro F1-Score',    '>= 0.90',   macro_f1,              'f4',   lambda v: v >= 0.90),
    ('Train/Test Gap',    '< 3%',      train_test_gap * 100,  'pct',  lambda v: v < 3.0),
    ('Inference (P95)',   '< 100ms',   lat_p95,               'ms',   lambda v: v < 100.0),
]

results = []
for name, target, achieved, fmt, check_fn in targets:
    passed = check_fn(achieved)
    if fmt == 'pct':
        ach_str = f"{achieved:.2f}%"
    elif fmt == 'f4':
        ach_str = f"{achieved:.4f}"
    elif fmt == 'ms':
        ach_str = f"{achieved:.2f}ms"
    else:
        ach_str = f"{achieved:.2f}"
    results.append((name, target, ach_str, 'PASS' if passed else 'FAIL'))

targets_passed = sum(1 for r in results if r[3] == 'PASS')
targets_total = len(results)
production_ready = targets_passed == targets_total

# Build report
now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
training_time = metadata.get('training_time_seconds', 0)
train_min = int(training_time // 60)
train_sec = int(training_time % 60)

# Get model params
model_params = {}
if hasattr(model, 'get_params'):
    params = model.get_params()
    for key in ['n_estimators', 'max_depth', 'min_child_weight', 'learning_rate',
                'subsample', 'colsample_bytree', 'gamma', 'reg_alpha', 'reg_lambda',
                'min_samples_split', 'min_samples_leaf', 'max_features',
                'class_weight', 'criterion', 'bootstrap', 'random_state']:
        if key in params:
            model_params[key] = params[key]

report = []
report.append("=" * 70)
report.append("       CORTEX ML v3.0 - COMPREHENSIVE EVALUATION REPORT")
report.append("=" * 70)
report.append(f" Evaluation Date: {now_str}")
report.append(f" Model Version: {metadata['version']}")
report.append(f" Algorithm: {model.__class__.__name__}")
report.append("=" * 70)
report.append("")

# EXECUTIVE SUMMARY
report.append(" EXECUTIVE SUMMARY")
report.append("-" * 70)
report.append(f" Model: {model.__class__.__name__} (Cortex Patient Risk Predictor v{metadata['version']})")
report.append(f" Overall Accuracy: {test_accuracy*100:.2f}%")
report.append(f" High-Risk Recall: {recall_per[2]*100:.2f}%")
report.append(f" Production Ready: {'YES' if production_ready else 'NO'}")
report.append(f" Targets Met: {targets_passed}/{targets_total}")
report.append(f" Training Time: {train_min}m {train_sec}s")
report.append(f" Label Strategy: Vitals-only (no outcome leakage)")
report.append(f" Synthetic Data: None (real patient data only)")
report.append("")

# 1. MODEL INFORMATION
report.append("=" * 70)
report.append(" 1. MODEL INFORMATION")
report.append("-" * 70)
report.append(f" Algorithm: {model.__class__.__name__}")
report.append(f" Module: {model.__class__.__module__}")
report.append(f" Number of Features: {len(feature_cols)}")
report.append(f" Number of Classes: 3 (Low=1, Medium=2, High=3)")
report.append(f" Class Weights: {metadata.get('class_weights', 'N/A')}")
report.append(f" Optimal Threshold: {threshold_config['optimal_threshold']}")
report.append(f" Model Size: {model_size_mb:.1f} MB")
report.append("")
report.append(" Hyperparameters:")
for k, v in model_params.items():
    report.append(f"   {k}: {v}")
report.append("")

# 2. TRAINING DATA
report.append("=" * 70)
report.append(" 2. TRAINING DATA SUMMARY")
report.append("-" * 70)
report.append(f" Data Sources: 4 clinical datasets")
report.append(f"   - Dataset.csv (Sepsis Challenge): {len(df_main):,} records")
report.append(f"   - CHARTEVENTS.csv (MIMIC): {len(df_chart):,} records")
report.append(f"   - Stroke Data: {len(df_stroke):,} records")
report.append(f"   - MIMIC-IV ED: {len(df_ed):,} vitalsign records")
report.append(f" Total Raw Records: {original_size:,}")
report.append(f" After Cleaning: {clean_size:,}")
report.append(f" Data Retention: {clean_size/original_size*100:.1f}%")
report.append("")
report.append(f" Exact Patient Counts:")
report.append(f"   Total clean records: {clean_size:,}")
report.append(f"   Training set (80%): {len(X_train):,}")
report.append(f"   Test set (20%): {len(X_test):,}")
report.append(f"   Synthetic data: 0 (SMOTE disabled)")
report.append(f"   Real data: 100%")
report.append("")
report.append(f" Class Distribution (full dataset):")
# Use remapped y for distribution (matches model classes)
y_remapped = y - 1 if model_classes == [0, 1, 2] else y
risk_counts = y_remapped.value_counts().sort_index()
for level, count in risk_counts.items():
    pct = count / len(y_remapped) * 100
    report.append(f"   {risk_names[level]} Risk ({level}): {count:,} ({pct:.1f}%)")
report.append("")

# 3. PERFORMANCE METRICS
report.append("=" * 70)
report.append(" 3. PERFORMANCE METRICS")
report.append("-" * 70)
report.append("")
report.append(" A. OVERALL METRICS:")
report.append(f"    Accuracy:                    {test_accuracy*100:.2f}%")
report.append(f"    Macro F1-Score:              {macro_f1:.4f}")
report.append(f"    Weighted F1-Score:           {weighted_f1:.4f}")
report.append(f"    Cohen's Kappa:               {kappa:.4f}")
report.append(f"    Matthews Corr Coeff (MCC):   {mcc:.4f}")
report.append(f"    ROC-AUC (macro):             {roc_macro:.4f}")
report.append(f"    ROC-AUC (weighted):          {roc_weighted:.4f}")
report.append("")

report.append(" B. PER-CLASS METRICS:")
class_names_report = [risk_names[c] + ' Risk' for c in class_labels]
high_risk_label = class_labels[-1]  # last label is high risk
supports = [(y_test == c).sum() for c in class_labels]
for i, (cname, clabel) in enumerate(zip(class_names_report, class_labels)):
    marker = " *** CRITICAL CLASS ***" if clabel == high_risk_label else ""
    report.append(f"    {cname.upper()} (Class {clabel}):{marker}")
    report.append(f"    Precision: {precision_per[i]*100:.2f}%    Recall: {recall_per[i]*100:.2f}%    F1: {f1_per[i]:.4f}")
    report.append(f"    ROC-AUC: {roc_per_class[i]:.4f}    Support: {supports[i]:,}")
    report.append("")

report.append(" C. CONFUSION MATRIX:")
report.append("")
report.append("                    PREDICTED")
report.append("              Low        Medium       High")
for i, (cname, clabel) in enumerate(zip(class_names_report, class_labels)):
    row = "    " + f"{cname:>10}" + "".join(f"{cm[i][j]:>12,}" for j in range(3))
    report.append(row)
report.append("")
report.append(f"    Total errors: {(cm.sum() - np.trace(cm)):,} / {cm.sum():,} ({(cm.sum()-np.trace(cm))/cm.sum()*100:.2f}%)")
report.append(f"    High-Risk missed (FN): {cm[2][0] + cm[2][1]} / {supports[2]:,}")
report.append(f"    High-Risk false alarms (FP): {cm[0][2] + cm[1][2]}")
report.append("")

report.append(" D. OVERFITTING CHECK:")
report.append(f"    Train Accuracy: {train_accuracy*100:.2f}%")
report.append(f"    Test Accuracy:  {test_accuracy*100:.2f}%")
report.append(f"    Gap:            {train_test_gap*100:.2f}%")
report.append(f"    CV Mean:        {metadata.get('cv_mean', 0)*100:.2f}% +/- {metadata.get('cv_std', 0)*100:.2f}%")
report.append("")

# 4. INFERENCE PERFORMANCE
report.append("=" * 70)
report.append(" 4. INFERENCE PERFORMANCE")
report.append("-" * 70)
report.append(f" Single Prediction Latency ({n_latency} predictions):")
report.append(f"   Min:    {lat_min:.4f} ms")
report.append(f"   Mean:   {lat_mean:.4f} ms")
report.append(f"   Median: {lat_median:.4f} ms")
report.append(f"   P95:    {lat_p95:.4f} ms    Target: < 100ms    {'PASS' if lat_p95 < 100 else 'FAIL'}")
report.append(f"   P99:    {lat_p99:.4f} ms")
report.append(f"   Max:    {lat_max:.4f} ms")
report.append("")
report.append(f" Batch Throughput (10,000 predictions):")
report.append(f"   Total Time: {batch_time:.4f} seconds")
report.append(f"   Throughput: {throughput:,.0f} predictions/second")
report.append(f"   Model Size: {model_size_mb:.1f} MB")
report.append("")

# 5. TARGET VERIFICATION TABLE
report.append("=" * 70)
report.append(" 5. TARGET VERIFICATION")
report.append("-" * 70)
report.append("")

# Formatted table
col_w = [25, 12, 12, 8]
header = f" {'Metric':<{col_w[0]}} {'Target':<{col_w[1]}} {'Achieved':<{col_w[2]}} {'Status':<{col_w[3]}}"
sep = " " + "-" * (sum(col_w) + 3)
report.append(sep)
report.append(header)
report.append(sep)
for name, target, ach_str, status in results:
    sym = "PASS" if status == "PASS" else "FAIL"
    report.append(f" {name:<{col_w[0]}} {target:<{col_w[1]}} {ach_str:<{col_w[2]}} {sym:<{col_w[3]}}")
report.append(sep)
report.append(f" TARGETS MET: {targets_passed}/{targets_total}")
if production_ready:
    report.append(f" STATUS: APPROVED FOR PRODUCTION")
else:
    report.append(f" STATUS: NEEDS IMPROVEMENT")
    for name, target, ach_str, status in results:
        if status == 'FAIL':
            report.append(f"   FAILED: {name} - Target {target}, Achieved {ach_str}")
report.append("")

# 6. CLINICAL TESTS
report.append("=" * 70)
report.append(" 6. CLINICAL TEST CASES")
report.append("-" * 70)
for r in clinical_results:
    sym = "PASS" if r['passed'] else "FAIL"
    report.append(f" {sym} | {r['name']:<30} -> {r['predicted']:<8} (expected: {r['expected']}, conf: {r['confidence']:.1f}%)")
report.append(f"\n Results: {clinical_passed}/{clinical_total} PASSED")
safety_tests = [r for r in clinical_results if 'Safety' in r['name']]
safety_passed = sum(1 for r in safety_tests if r['passed'])
report.append(f" Safety System (Cases 4-6): {safety_passed}/{len(safety_tests)} OPERATIONAL")
report.append("")

# 7. FEATURE IMPORTANCE
report.append("=" * 70)
report.append(" 7. TOP 20 FEATURE IMPORTANCE")
report.append("-" * 70)
if hasattr(model, 'feature_importances_'):
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    for rank in range(min(20, len(indices))):
        idx = indices[rank]
        report.append(f" {rank+1:>3}. {feature_cols[idx]:<35} {importances[idx]*100:.2f}%")
report.append("")

# 8. FILES
report.append("=" * 70)
report.append(" 8. SAVED ARTIFACTS")
report.append("-" * 70)
artifacts = [
    ('model_production.pkl', f'{model_size_mb:.1f} MB', 'Trained XGBoost model'),
    ('scaler_production.pkl', '-', 'StandardScaler for feature scaling'),
    ('feature_names_production.pkl', '-', '44 feature names'),
    ('threshold_config.json', '-', 'Optimal threshold configuration'),
    ('model_metadata.json', '-', 'Full model metadata'),
    ('confusion_matrix_production.png', '-', 'Confusion matrix visualization'),
    ('feature_importance_production.png', '-', 'Feature importance chart'),
    ('roc_curves_production.png', '-', 'ROC curves per class'),
    ('training_report_production.txt', '-', 'Training report'),
]
for fname, size, desc in artifacts:
    fpath = os.path.join(BASE_DIR, fname)
    exists = "EXISTS" if os.path.exists(fpath) else "MISSING"
    report.append(f"   {fname:<40} {size:<10} {exists:<8} {desc}")
report.append("")

# 9. FINAL VERDICT
report.append("=" * 70)
report.append(" FINAL VERDICT")
report.append("=" * 70)
report.append("")
report.append(f" MODEL: Cortex Patient Risk Predictor v{metadata['version']}")
report.append(f" ALGORITHM: {model.__class__.__name__}")
report.append(f" TRAINED ON: {clean_size:,} real patient records (no synthetic data)")
report.append(f" THRESHOLD: {threshold_config['optimal_threshold']}")
report.append("")
report.append(f" Overall Accuracy:    {test_accuracy*100:.2f}%  [Target: >= 98%]    {'PASS' if test_accuracy >= 0.98 else 'FAIL'}")
report.append(f" High-Risk Recall:    {recall_per[2]*100:.2f}%  [Target: >= 95%]    {'PASS' if recall_per[2] >= 0.95 else 'FAIL'}")
report.append(f" Targets Met:         {targets_passed}/{targets_total}")
report.append("")
if production_ready:
    report.append(f" STATUS: APPROVED FOR PRODUCTION")
else:
    report.append(f" STATUS: NOT READY - NEEDS IMPROVEMENT")
report.append("")
report.append(f" Evaluation Date: {now_str}")
report.append("=" * 70)
report.append(" END OF EVALUATION REPORT")
report.append("=" * 70)

report_text = "\n".join(report)

# Save report
report_path = os.path.join(BASE_DIR, 'cortex_model_evaluation_report.txt')
with open(report_path, 'w') as f:
    f.write(report_text)

# Print report
print()
print(report_text)
print()
print(f"Report saved to: {report_path}")
print()

# ═══════════════════════════════════════════════════════════════
# FINAL SUMMARY (console-friendly table)
# ═══════════════════════════════════════════════════════════════
print()
print("=" * 70)
print("              QUICK REFERENCE - TARGET VERIFICATION TABLE")
print("=" * 70)
print()
print(f"  {'Metric':<25} {'Target':<12} {'Achieved':<12} {'Status'}")
print(f"  {'-'*25} {'-'*12} {'-'*12} {'-'*8}")
for name, target, ach_str, status in results:
    marker = "PASS" if status == "PASS" else "** FAIL **"
    print(f"  {name:<25} {target:<12} {ach_str:<12} {marker}")
print()
print(f"  TARGETS: {targets_passed}/{targets_total}")
print(f"  CLINICAL: {clinical_passed}/{clinical_total}")
print(f"  PRODUCTION: {'APPROVED' if production_ready else 'NOT READY'}")
print()
print(f"  Patients trained on: {len(X_train):,} (real)")
print(f"  Patients tested on:  {len(X_test):,}")
print(f"  Synthetic data:      0 (none)")
print(f"  Total clean records: {clean_size:,}")
print()
print("=" * 70)
