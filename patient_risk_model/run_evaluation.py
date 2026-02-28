"""
run_evaluation.py
=================
Comprehensive 9-part model evaluation & benchmark report.

Parts
-----
1. Model Loading & Verification
2. Accuracy Metrics (Overall, Per-class, Confusion Matrix, ROC-AUC, PR curves,
   Cohen's Kappa, MCC, Weighted F1, NPV)
3. Performance Benchmarking (latency, batch throughput, memory, scalability)
4. Clinical Safety Validation (9 test cases + 7 safety rules)
5. Error Analysis (misclassifications, feature importance)
6. Cross-Validation Analysis
7. Benchmark Comparison
8. Final Report Generation (boxed summary)
9. File Outputs (evaluation_report.txt, JSON, CSV, PNGs)

Usage:
    python run_evaluation.py
"""

import os
import sys
import json
import csv
import time
import pickle
import random
import warnings
import traceback

import joblib
import numpy as np
import pandas as pd

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    classification_report,
    cohen_kappa_score,
    matthews_corrcoef,
    precision_recall_curve,
    average_precision_score,
)
from sklearn.preprocessing import label_binarize
from sklearn.model_selection import StratifiedKFold, cross_val_score

from data_processing import load_data, clean_data, prepare_train_test_split, scale_features
from feature_engineering import engineer_features
from model_training import apply_smote
from model_evaluation import (
    evaluate_model,
    plot_confusion_matrix,
    plot_roc_curve,
    feature_importance_plot,
    compare_models,
    check_overfitting,
)
from prediction_service import predict_risk, load_artefacts
from config import (
    MODEL_PATH, SCALER_PATH, FEATURE_NAMES_PATH,
    RANDOM_STATE, N_SAMPLES, RISK_MAP, HIGH_RISK_THRESHOLD, HIGH_RISK_MARGIN,
)

warnings.filterwarnings("ignore")

PLOT_DIR = "plots"
os.makedirs(PLOT_DIR, exist_ok=True)

# ── Targets ──────────────────────────────────────────────────────────────────
TARGETS = {
    "overall_accuracy":   0.90,
    "high_risk_recall":   0.95,
    "medium_risk_recall": 0.85,
    "low_risk_recall":    0.90,
    "macro_f1":           0.85,
    "weighted_f1":        0.90,
    "cohens_kappa":       0.80,
    "mcc":                0.75,
    "train_test_gap":     0.05,
    "inference_p95_ms":   100,
    "inference_p99_ms":   120,
    "inference_mean_ms":  80,
}

RISK_LABELS = {1: "Low", 2: "Medium", 3: "High"}


# ═════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═════════════════════════════════════════════════════════════════════════════

def _pf(passed: bool) -> str:
    return "PASS" if passed else "FAIL"

def _icon(passed: bool) -> str:
    return "✓" if passed else "✗"

def _fmt(val, is_pct=False, is_ms=False):
    if is_ms:
        return f"{val:.2f} ms"
    if is_pct:
        return f"{val*100:.2f}%"
    return f"{val:.4f}"


# ═════════════════════════════════════════════════════════════════════════════
# PART 1: MODEL LOADING & VERIFICATION
# ═════════════════════════════════════════════════════════════════════════════

def part1_load_model():
    print("\n" + "=" * 68)
    print("  PART 1: MODEL LOADING & VERIFICATION")
    print("=" * 68)

    # Check files exist
    for label, path in [("Model", MODEL_PATH), ("Scaler", SCALER_PATH), ("Features", FEATURE_NAMES_PATH)]:
        exists = os.path.exists(path)
        size_mb = os.path.getsize(path) / 1024 / 1024 if exists else 0
        print(f"  {label:<12} : {'EXISTS' if exists else 'MISSING':<8}  {size_mb:.2f} MB  ({path})")

    model, scaler, feature_names = load_artefacts()

    # Unwrap adapter
    base = getattr(model, "model", model)
    model_type = type(base).__name__

    print(f"\n  Model Type       : {type(model).__name__}")
    print(f"  Base Model       : {model_type}")
    print(f"  Features Expected: {len(feature_names)}")
    print(f"  Class Labels     : {list(RISK_MAP.keys())} → {list(RISK_MAP.values())}")

    # Model params
    if hasattr(base, "get_params"):
        params = base.get_params()
        key_params = {k: v for k, v in params.items()
                      if k in ("n_estimators", "max_depth", "min_samples_split",
                               "min_samples_leaf", "max_features", "class_weight")}
        print(f"  Key Parameters   : {key_params}")

    if hasattr(base, "n_estimators"):
        print(f"  N Estimators     : {base.n_estimators}")
    if hasattr(base, "n_features_in_"):
        print(f"  N Features (fit) : {base.n_features_in_}")

    model_size_mb = os.path.getsize(MODEL_PATH) / 1024 / 1024
    scaler_size_mb = os.path.getsize(SCALER_PATH) / 1024 / 1024

    info = {
        "model_type": type(model).__name__,
        "base_model": model_type,
        "n_features": len(feature_names),
        "feature_names": list(feature_names),
        "model_size_mb": round(model_size_mb, 2),
        "scaler_size_mb": round(scaler_size_mb, 2),
    }
    return model, scaler, feature_names, info


# ═════════════════════════════════════════════════════════════════════════════
# PART 2: ACCURACY METRICS
# ═════════════════════════════════════════════════════════════════════════════

def part2_accuracy_metrics(model, scaler, feature_names):
    print("\n" + "=" * 68)
    print("  PART 2: ACCURACY METRICS — COMPLETE EVALUATION")
    print("=" * 68)

    # Rebuild deterministic test split
    raw_df = load_data(n_samples=N_SAMPLES, random_state=RANDOM_STATE)
    df = clean_data(raw_df)
    X, y = engineer_features(df)
    X_train, X_test, y_train, y_test = prepare_train_test_split(X, y)
    X_train_bal, y_train_bal = apply_smote(X_train, y_train)

    X_test_sc = pd.DataFrame(scaler.transform(X_test), columns=feature_names)
    X_train_sc = pd.DataFrame(scaler.transform(X_train_bal), columns=feature_names)

    # ── Get predictions (with high-risk override matching production) ──────
    results = evaluate_model(model, X_test_sc, y_test, model_name="Saved Model")
    y_pred = results["y_pred"]
    y_prob = results["y_prob"]
    classes = results["classes"]

    # ── A. OVERALL PERFORMANCE ────────────────────────────────────────────
    acc = results["accuracy"]
    f1_mac = results["f1_macro"]
    roc_auc = results["roc_auc"]
    f1_weighted = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    kappa = cohen_kappa_score(y_test, y_pred)
    mcc = matthews_corrcoef(y_test, y_pred)

    print("\n  A. OVERALL PERFORMANCE:")
    print(f"  {'Metric':<25} {'Target':>10} {'Achieved':>12} {'Status':>8}")
    print("  " + "-" * 58)
    overall_checks = [
        ("Overall Accuracy",     acc,         TARGETS["overall_accuracy"],   acc >= TARGETS["overall_accuracy"]),
        ("Macro F1-Score",       f1_mac,      TARGETS["macro_f1"],           f1_mac >= TARGETS["macro_f1"]),
        ("Weighted F1-Score",    f1_weighted, TARGETS["weighted_f1"],        f1_weighted >= TARGETS["weighted_f1"]),
        ("Cohen's Kappa",        kappa,       TARGETS["cohens_kappa"],       kappa >= TARGETS["cohens_kappa"]),
        ("Matthews Corr Coef",   mcc,         TARGETS["mcc"],               mcc >= TARGETS["mcc"]),
    ]
    for label, val, tgt, passed in overall_checks:
        print(f"  {label:<25} {'>= ' + str(tgt):>10} {val:>12.4f} {_pf(passed) + ' ' + _icon(passed):>8}")

    if roc_auc:
        print(f"  {'Macro ROC-AUC':<25} {'---':>10} {roc_auc:>12.4f} {'INFO':>8}")

    # ── B. PER-CLASS PERFORMANCE ──────────────────────────────────────────
    recall_map = results["recall"]
    prec_map = results["precision"]
    f1_map = results["f1"]

    # Compute NPV per class (Negative Predictive Value)
    cm = confusion_matrix(y_test, y_pred, labels=classes)
    support = {cls: int((y_test == cls).sum()) for cls in classes}

    # NPV = TN / (TN + FN)
    npv = {}
    for i, cls in enumerate(classes):
        fn = cm[i, :].sum() - cm[i, i]   # actual=cls, predicted != cls
        tn_fn = cm.sum() - cm[:, i].sum()  # not predicted as cls
        tn = tn_fn - fn
        npv[cls] = tn / max(tn + fn, 1)

    print(f"\n  B. PER-CLASS PERFORMANCE:")
    print(f"  {'Risk Level':<12} {'Precision':>10} {'Recall':>10} {'F1':>10} {'Support':>10} {'NPV':>10}")
    print("  " + "-" * 64)
    for cls in classes:
        lbl = RISK_LABELS.get(cls, str(cls))
        star = " ⭐" if cls == 3 else ""
        print(f"  {lbl + f' ({cls})':<12} {prec_map[cls]:>10.4f} {recall_map[cls]:>10.4f} "
              f"{f1_map[cls]:>10.4f} {support[cls]:>10} {npv[cls]:>10.4f}{star}")

    # ── C. TARGET VERIFICATION ────────────────────────────────────────────
    low_recall = recall_map.get(1, 0.0)
    med_recall = recall_map.get(2, 0.0)
    high_recall = recall_map.get(3, 0.0)

    train_acc = accuracy_score(y_train_bal, model.predict(X_train_sc))
    test_acc = accuracy_score(y_test, y_pred)
    overfit_gap = train_acc - test_acc

    print(f"\n  C. TARGET VERIFICATION:")
    target_checks = {
        "Overall Accuracy >= 90%":   (acc,          TARGETS["overall_accuracy"],   acc >= TARGETS["overall_accuracy"]),
        "High-Risk Recall >= 95%":   (high_recall,  TARGETS["high_risk_recall"],   high_recall >= TARGETS["high_risk_recall"]),
        "Medium-Risk Recall >= 85%": (med_recall,   TARGETS["medium_risk_recall"], med_recall >= TARGETS["medium_risk_recall"]),
        "Low-Risk Recall >= 90%":    (low_recall,   TARGETS["low_risk_recall"],    low_recall >= TARGETS["low_risk_recall"]),
        "Macro F1-Score >= 0.85":    (f1_mac,       TARGETS["macro_f1"],           f1_mac >= TARGETS["macro_f1"]),
        "Train/Test Gap < 5%":       (overfit_gap,  TARGETS["train_test_gap"],     overfit_gap < TARGETS["train_test_gap"]),
    }
    print(f"  {'Target':<30} {'Actual':>10} {'Required':>10} {'Status':>8}")
    print("  " + "-" * 62)
    for label, (actual, target, passed) in target_checks.items():
        fmt_a = f"{actual:.4f}"
        fmt_t = f"{target:.2f}"
        print(f"  {label:<30} {fmt_a:>10} {fmt_t:>10} {_pf(passed) + ' ' + _icon(passed):>8}")

    all_pass = all(p for _, _, p in target_checks.values())

    # ── D. CONFUSION MATRIX ──────────────────────────────────────────────
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)

    print(f"\n  D. CONFUSION MATRIX (counts):")
    hdr = f"  {'Actual \\ Pred':<16}" + "".join(f"{RISK_LABELS.get(c,c):>10}" for c in classes)
    print(hdr)
    print("  " + "-" * (16 + 10 * len(classes)))
    for i, cls in enumerate(classes):
        row = f"  {RISK_LABELS.get(cls, cls):<16}" + "".join(f"{cm[i,j]:>10}" for j in range(len(classes)))
        print(row)

    print(f"\n  CONFUSION MATRIX (row-normalised %):")
    print(hdr)
    print("  " + "-" * (16 + 10 * len(classes)))
    for i, cls in enumerate(classes):
        row = f"  {RISK_LABELS.get(cls, cls):<16}" + "".join(f"{cm_norm[i,j]:>9.1%} " for j in range(len(classes)))
        print(row)

    # ── E. CLASSIFICATION REPORT ─────────────────────────────────────────
    print(f"\n  E. CLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred, target_names=[RISK_MAP[c] for c in classes]))

    # ── F. ROC-AUC ANALYSIS ──────────────────────────────────────────────
    y_bin = label_binarize(y_test, classes=classes)
    print(f"  F. ROC-AUC PER CLASS:")
    roc_per_class = {}
    for i, cls in enumerate(classes):
        try:
            auc_val = roc_auc_score(y_bin[:, i], y_prob[:, i])
            roc_per_class[cls] = auc_val
            print(f"    Class {cls} ({RISK_LABELS[cls]:<6}) AUC = {auc_val:.4f}")
        except Exception:
            roc_per_class[cls] = None
            print(f"    Class {cls} ({RISK_LABELS[cls]:<6}) AUC = N/A")
    print(f"    Macro-averaged ROC-AUC = {roc_auc:.4f}" if roc_auc else "    Macro ROC-AUC = N/A")

    # ── G. PRECISION-RECALL CURVES ───────────────────────────────────────
    print(f"\n  G. PRECISION-RECALL ANALYSIS:")
    ap_per_class = {}
    fig, ax = plt.subplots(figsize=(8, 6))
    colours = ["#2196F3", "#FF9800", "#F44336"]
    for i, cls in enumerate(classes):
        try:
            prec_curve, rec_curve, _ = precision_recall_curve(y_bin[:, i], y_prob[:, i])
            ap = average_precision_score(y_bin[:, i], y_prob[:, i])
            ap_per_class[cls] = ap
            ax.plot(rec_curve, prec_curve, color=colours[i % len(colours)], lw=2,
                    label=f"Class {cls} ({RISK_LABELS[cls]}) – AP {ap:.3f}")
            print(f"    Class {cls} ({RISK_LABELS[cls]:<6}) Average Precision = {ap:.4f}")
        except Exception:
            ap_per_class[cls] = None
            print(f"    Class {cls} ({RISK_LABELS[cls]:<6}) AP = N/A")

    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title("Precision-Recall Curves (One-vs-Rest)", fontweight="bold")
    ax.legend(loc="lower left")
    ax.grid(alpha=0.3)
    plt.tight_layout()
    pr_path = os.path.join(PLOT_DIR, "precision_recall_curves.png")
    plt.savefig(pr_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"    [Plot] PR curves saved → {pr_path}")

    # Save other standard plots
    plot_confusion_matrix(y_test, y_pred, model_name="Saved_Model")
    plot_roc_curve(y_test, y_prob, model_name="Saved_Model")
    fi_df = feature_importance_plot(model, feature_names, model_name="Saved_Model")

    metrics = {
        "accuracy": acc,
        "f1_macro": f1_mac,
        "f1_weighted": f1_weighted,
        "cohens_kappa": kappa,
        "mcc": mcc,
        "roc_auc_macro": roc_auc,
        "roc_auc_per_class": {str(k): v for k, v in roc_per_class.items()},
        "ap_per_class": {str(k): v for k, v in ap_per_class.items()},
        "precision": {str(k): v for k, v in prec_map.items()},
        "recall": {str(k): v for k, v in recall_map.items()},
        "f1": {str(k): v for k, v in f1_map.items()},
        "npv": {str(k): v for k, v in npv.items()},
        "support": {str(k): v for k, v in support.items()},
        "train_accuracy": train_acc,
        "test_accuracy": test_acc,
        "overfit_gap": overfit_gap,
        "confusion_matrix": cm.tolist(),
        "confusion_matrix_norm": cm_norm.tolist(),
        "target_checks": {k: {"actual": v[0], "required": v[1], "passed": v[2]} for k, v in target_checks.items()},
        "all_targets_met": all_pass,
    }

    return (metrics, fi_df, y_test, y_pred, y_prob, y_train, y_train_bal,
            X_train_sc, X_test_sc, X_train, classes, cm, cm_norm, target_checks)


# ═════════════════════════════════════════════════════════════════════════════
# PART 3: PERFORMANCE BENCHMARKING
# ═════════════════════════════════════════════════════════════════════════════

def part3_benchmarking():
    print("\n" + "=" * 68)
    print("  PART 3: PERFORMANCE BENCHMARKING")
    print("=" * 68)

    template = {
        "hr": 80, "spo2": 97, "sbp": 120, "dbp": 78,
        "rr": 16, "temp": 98.6,
        "diabetes": 0, "hypertension": 0, "heart_disease": 0,
        "chest_pain": 0, "breathlessness": 0, "fever": 0,
    }

    # Warm up
    for _ in range(5):
        predict_risk(template)

    # ── A. INFERENCE LATENCY (1000 predictions) ─────────────────────────
    print("\n  A. INFERENCE LATENCY (1,000 single predictions):")
    random.seed(42)
    latencies = []
    n_lat = 1000
    for _ in range(n_lat):
        inp = template.copy()
        inp["hr"] = random.uniform(55, 140)
        inp["spo2"] = random.uniform(88, 100)
        inp["sbp"] = random.uniform(85, 180)
        inp["dbp"] = random.uniform(50, 110)
        inp["rr"] = random.uniform(10, 32)
        inp["temp"] = random.uniform(97, 103)
        inp["diabetes"] = random.choice([0, 1])
        inp["hypertension"] = random.choice([0, 1])
        t0 = time.perf_counter()
        predict_risk(inp)
        latencies.append((time.perf_counter() - t0) * 1000)

    lat_min = np.min(latencies)
    lat_mean = np.mean(latencies)
    lat_median = np.median(latencies)
    lat_p95 = np.percentile(latencies, 95)
    lat_p99 = np.percentile(latencies, 99)
    lat_max = np.max(latencies)
    lat_std = np.std(latencies)

    lat_checks = {
        "Mean Time": (lat_mean, TARGETS["inference_mean_ms"], lat_mean < TARGETS["inference_mean_ms"]),
        "Median (p50)": (lat_median, TARGETS["inference_mean_ms"], lat_median < TARGETS["inference_mean_ms"]),
        "p95 Time": (lat_p95, TARGETS["inference_p95_ms"], lat_p95 < TARGETS["inference_p95_ms"]),
        "p99 Time": (lat_p99, TARGETS["inference_p99_ms"], lat_p99 < TARGETS["inference_p99_ms"]),
    }

    print(f"  {'Metric':<14} {'Value':>10} {'Target':>10} {'Status':>8}")
    print("  " + "-" * 46)
    print(f"  {'Min Time':<14} {lat_min:>9.2f}ms {'---':>10} {'INFO':>8}")
    for label, (val, tgt, passed) in lat_checks.items():
        print(f"  {label:<14} {val:>9.2f}ms {f'< {tgt:.0f}ms':>10} {_pf(passed) + ' ' + _icon(passed):>8}")
    print(f"  {'Max Time':<14} {lat_max:>9.2f}ms {'---':>10} {'INFO':>8}")
    print(f"  {'Std Dev':<14} {lat_std:>9.2f}ms {'---':>10} {'INFO':>8}")

    # ── B. BATCH THROUGHPUT ──────────────────────────────────────────────
    print(f"\n  B. BATCH THROUGHPUT (10,000 predictions):")
    random.seed(42)
    batch_size = 10_000
    batch_patients = []
    for _ in range(batch_size):
        inp = template.copy()
        inp["hr"] = random.uniform(55, 140)
        inp["spo2"] = random.uniform(88, 100)
        inp["sbp"] = random.uniform(85, 180)
        batch_patients.append(inp)

    t0 = time.perf_counter()
    model_b, scaler_b, fn_b = load_artefacts()
    for p in batch_patients:
        predict_risk(p, model=model_b, scaler=scaler_b, feature_names=fn_b)
    batch_time = time.perf_counter() - t0

    throughput = batch_size / batch_time
    avg_lat_batch = batch_time / batch_size * 1000

    print(f"  Total Time       : {batch_time:.2f} seconds")
    print(f"  Throughput       : {throughput:.0f} predictions/second")
    print(f"  Average Latency  : {avg_lat_batch:.2f} ms/prediction")

    # ── C. MEMORY FOOTPRINT ──────────────────────────────────────────────
    print(f"\n  C. MEMORY FOOTPRINT:")
    model_mb = os.path.getsize(MODEL_PATH) / 1024 / 1024
    scaler_mb = os.path.getsize(SCALER_PATH) / 1024 / 1024
    fn_mb = os.path.getsize(FEATURE_NAMES_PATH) / 1024 / 1024
    total_mb = model_mb + scaler_mb + fn_mb

    # Approximate runtime memory using sys.getsizeof (rough estimate)
    try:
        import tracemalloc
        tracemalloc.start()
        _m, _s, _f = load_artefacts()
        predict_risk(template, model=_m, scaler=_s, feature_names=_f)
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        runtime_mb = current / 1024 / 1024
        peak_mb = peak / 1024 / 1024
    except Exception:
        runtime_mb = total_mb * 3  # rough estimate
        peak_mb = total_mb * 4

    mem_ok = total_mb < 500
    print(f"  Model file size  : {model_mb:.2f} MB")
    print(f"  Scaler file size : {scaler_mb:.2f} MB")
    print(f"  Feature names    : {fn_mb:.4f} MB")
    print(f"  Total on disk    : {total_mb:.2f} MB")
    print(f"  Runtime memory   : {runtime_mb:.2f} MB")
    print(f"  Peak memory      : {peak_mb:.2f} MB")
    print(f"  Memory efficient : {'YES (< 500 MB) ✓' if mem_ok else 'NO (>= 500 MB) ✗'}")

    # ── D. SCALABILITY TEST ──────────────────────────────────────────────
    print(f"\n  D. SCALABILITY TEST:")
    batch_sizes = [1, 10, 100, 1000, 10000]
    scale_times = []
    m, s, fn = load_artefacts()
    for bs in batch_sizes:
        pts = [template.copy() for _ in range(bs)]
        t0 = time.perf_counter()
        for p in pts:
            predict_risk(p, model=m, scaler=s, feature_names=fn)
        elapsed = (time.perf_counter() - t0) * 1000
        scale_times.append(elapsed)
        per = elapsed / bs
        print(f"  Batch {bs:>5}: {elapsed:>10.1f} ms total  |  {per:>8.2f} ms/prediction")

    # Check linearity
    if len(scale_times) >= 2 and scale_times[0] > 0:
        ratio = (scale_times[-1] / scale_times[0]) / (batch_sizes[-1] / batch_sizes[0])
        linearity = "APPROXIMATELY LINEAR" if 0.3 < ratio < 3.0 else "NON-LINEAR"
        print(f"  Scaling behaviour: {linearity}")

    bench = {
        "latency_min_ms": round(lat_min, 2),
        "latency_mean_ms": round(lat_mean, 2),
        "latency_median_ms": round(lat_median, 2),
        "latency_p95_ms": round(lat_p95, 2),
        "latency_p99_ms": round(lat_p99, 2),
        "latency_max_ms": round(lat_max, 2),
        "latency_std_ms": round(lat_std, 2),
        "batch_throughput_per_sec": round(throughput, 0),
        "batch_avg_latency_ms": round(avg_lat_batch, 2),
        "model_size_mb": round(model_mb, 2),
        "total_disk_mb": round(total_mb, 2),
        "runtime_memory_mb": round(runtime_mb, 2),
        "peak_memory_mb": round(peak_mb, 2),
    }
    return bench, lat_checks


# ═════════════════════════════════════════════════════════════════════════════
# PART 4: CLINICAL SAFETY VALIDATION
# ═════════════════════════════════════════════════════════════════════════════

def part4_clinical_safety():
    print("\n" + "=" * 68)
    print("  PART 4: CLINICAL SAFETY VALIDATION")
    print("=" * 68)

    # ── A. 9 STANDARD TEST CASES ─────────────────────────────────────────
    test_cases = [
        {
            "name": "TEST 1 - Normal Healthy Patient",
            "input": {
                "hr": 75, "spo2": 98, "sbp": 120, "dbp": 80, "rr": 16, "temp": 98.6,
                "diabetes": 0, "hypertension": 0, "heart_disease": 0,
                "chest_pain": 0, "breathlessness": 0, "fever": 0,
            },
            "expected": [1],
            "description": "All normal vitals, no history, no symptoms",
        },
        {
            "name": "TEST 2 - Moderate Risk Patient",
            "input": {
                "hr": 95, "spo2": 94, "sbp": 135, "dbp": 88, "rr": 22, "temp": 99.5,
                "diabetes": 0, "hypertension": 1, "heart_disease": 0,
                "chest_pain": 0, "breathlessness": 1, "fever": 0,
            },
            "expected": [2],
            "description": "Elevated vitals, hypertension + breathlessness",
        },
        {
            "name": "TEST 3 - Critical Patient",
            "input": {
                "hr": 120, "spo2": 88, "sbp": 160, "dbp": 95, "rr": 28, "temp": 102,
                "diabetes": 1, "hypertension": 1, "heart_disease": 1,
                "chest_pain": 1, "breathlessness": 1, "fever": 1,
            },
            "expected": [3],
            "description": "All conditions true, all symptoms, critical vitals",
        },
        {
            "name": "TEST 4 - Safety Override (Low SpO2)",
            "input": {
                "hr": 85, "spo2": 85, "sbp": 130, "dbp": 85, "rr": 20, "temp": 99.0,
                "diabetes": 0, "hypertension": 0, "heart_disease": 0,
                "chest_pain": 0, "breathlessness": 0, "fever": 0,
            },
            "expected": [3],
            "description": "SpO2 < 90 triggers safety override → High",
            "expect_safety": True,
        },
        {
            "name": "TEST 5 - Safety Override (Tachycardia)",
            "input": {
                "hr": 155, "spo2": 96, "sbp": 125, "dbp": 82, "rr": 18, "temp": 98.8,
                "diabetes": 0, "hypertension": 0, "heart_disease": 0,
                "chest_pain": 0, "breathlessness": 0, "fever": 0,
            },
            "expected": [3],
            "description": "HR > 150 triggers safety override → High",
            "expect_safety": True,
        },
        {
            "name": "TEST 6 - Safety Override (Severe Hypotension)",
            "input": {
                "hr": 95, "spo2": 96, "sbp": 85, "dbp": 55, "rr": 20, "temp": 98.6,
                "diabetes": 0, "hypertension": 0, "heart_disease": 0,
                "chest_pain": 0, "breathlessness": 0, "fever": 0,
            },
            "expected": [3],
            "description": "SBP < 90 triggers safety override → High",
            "expect_safety": True,
        },
        {
            "name": "TEST 7 - Borderline Low Risk",
            "input": {
                "hr": 88, "spo2": 95, "sbp": 128, "dbp": 84, "rr": 19, "temp": 99.0,
                "diabetes": 0, "hypertension": 0, "heart_disease": 0,
                "chest_pain": 0, "breathlessness": 0, "fever": 0,
            },
            "expected": [1, 2],
            "description": "Slightly elevated vitals — Low or Medium acceptable",
        },
        {
            "name": "TEST 8 - Elderly with Comorbidities",
            "input": {
                "hr": 92, "spo2": 93, "sbp": 145, "dbp": 90, "rr": 21, "temp": 98.9,
                "diabetes": 1, "hypertension": 1, "heart_disease": 0,
                "chest_pain": 0, "breathlessness": 0, "fever": 0,
            },
            "expected": [2, 3],
            "description": "Diabetes + hypertension, borderline vitals",
        },
        {
            "name": "TEST 9 - High BP Isolated",
            "input": {
                "hr": 80, "spo2": 98, "sbp": 175, "dbp": 105, "rr": 17, "temp": 98.6,
                "diabetes": 0, "hypertension": 1, "heart_disease": 0,
                "chest_pain": 0, "breathlessness": 0, "fever": 0,
            },
            "expected": [2, 3],
            "description": "Elevated BP with hypertension history",
        },
    ]

    print(f"\n  A. STANDARD TEST CASES ({len(test_cases)}):\n")
    test_results = []
    passed_count = 0

    for tc in test_cases:
        result = predict_risk(tc["input"])
        risk = result["risk_score"]
        cat = result["risk_category"]
        conf = result["confidence"]
        override = result["safety_override"]
        passed = risk in tc["expected"]
        if passed:
            passed_count += 1

        exp_str = "/".join(str(e) for e in tc["expected"])
        status = f"{'PASS ✓' if passed else 'FAIL ✗'}"

        print(f"  {tc['name']}")
        print(f"    {tc['description']}")
        print(f"    Expected: {exp_str}  |  Got: {risk} ({cat})  |  Confidence: {conf:.4f}"
              f"  |  Safety: {'YES' if override else 'No'}")
        print(f"    Status: {status}\n")

        test_results.append({
            "name": tc["name"],
            "expected": tc["expected"],
            "predicted": risk,
            "category": cat,
            "confidence": conf,
            "safety_override": override,
            "passed": passed,
        })

    print(f"  SUMMARY: {passed_count}/{len(test_cases)} tests passed\n")

    # ── B. SAFETY RULE VERIFICATION ──────────────────────────────────────
    print("  B. SAFETY RULE VERIFICATION:\n")
    safety_rules = [
        ("SpO2 < 90%",              {"hr": 80, "spo2": 85, "sbp": 120, "dbp": 80, "rr": 16, "temp": 98.6}),
        ("HR < 40 bpm",             {"hr": 35, "spo2": 97, "sbp": 120, "dbp": 80, "rr": 16, "temp": 98.6}),
        ("HR > 150 bpm",            {"hr": 160, "spo2": 97, "sbp": 120, "dbp": 80, "rr": 16, "temp": 98.6}),
        ("SBP < 90 mmHg",           {"hr": 80, "spo2": 97, "sbp": 80, "dbp": 50, "rr": 16, "temp": 98.6}),
        ("SBP > 180 mmHg",          {"hr": 80, "spo2": 97, "sbp": 190, "dbp": 100, "rr": 16, "temp": 98.6}),
        ("Temp > 103°F",            {"hr": 80, "spo2": 97, "sbp": 120, "dbp": 80, "rr": 16, "temp": 104}),
        ("Multiple critical vitals", {"hr": 160, "spo2": 85, "sbp": 80, "dbp": 50, "rr": 16, "temp": 104}),
    ]

    safety_defaults = {
        "diabetes": 0, "hypertension": 0, "heart_disease": 0,
        "chest_pain": 0, "breathlessness": 0, "fever": 0,
    }

    safety_pass = 0
    safety_results = []
    print(f"  {'Safety Rule':<28} {'Threshold':>12} {'Result':>8} {'Override':>10} {'Status':>8}")
    print("  " + "-" * 70)
    for rule_name, vitals in safety_rules:
        inp = {**safety_defaults, **vitals}
        res = predict_risk(inp)
        is_high = res["risk_score"] == 3
        is_override = res["safety_override"]
        passed = is_high
        if passed:
            safety_pass += 1
        safety_results.append({
            "rule": rule_name,
            "risk_score": res["risk_score"],
            "safety_override": is_override,
            "passed": passed,
        })
        print(f"  {rule_name:<28} {'→ High':>12} {res['risk_score']:>8} {'YES' if is_override else 'No':>10} {_pf(passed) + ' ' + _icon(passed):>8}")

    print(f"\n  SAFETY RULES: {safety_pass}/{len(safety_rules)} working\n")

    return {
        "test_cases": test_results,
        "tests_passed": passed_count,
        "tests_total": len(test_cases),
        "safety_rules": safety_results,
        "safety_passed": safety_pass,
        "safety_total": len(safety_rules),
    }


# ═════════════════════════════════════════════════════════════════════════════
# PART 5: ERROR ANALYSIS
# ═════════════════════════════════════════════════════════════════════════════

def part5_error_analysis(y_test, y_pred, y_prob, X_test_sc, fi_df, classes, cm):
    print("\n" + "=" * 68)
    print("  PART 5: ERROR ANALYSIS")
    print("=" * 68)

    # ── A. MISCLASSIFICATION ANALYSIS ────────────────────────────────────
    print("\n  A. MISCLASSIFICATION ANALYSIS:\n")

    # False Negatives: High-Risk patients classified as Low/Medium
    high_mask = y_test == 3
    high_total = high_mask.sum()
    fn_mask = high_mask & (y_pred != 3)
    fn_count = fn_mask.sum()
    fn_pct = fn_count / max(high_total, 1) * 100

    print(f"  FALSE NEGATIVES (High-Risk → Low/Medium) — MOST DANGEROUS:")
    print(f"    Count      : {fn_count} / {high_total}")
    print(f"    Percentage : {fn_pct:.2f}%")

    if fn_count > 0:
        fn_indices = np.where(fn_mask)[0]
        print(f"    Worst examples (up to 3):")
        for idx in fn_indices[:3]:
            true_cls = y_test.iloc[idx]
            pred_cls = y_pred[idx]
            probs = y_prob[idx]
            print(f"      Sample {idx}: True={true_cls}(High) Pred={pred_cls}({RISK_LABELS.get(pred_cls,'?')}) "
                  f"P=[Low:{probs[0]:.3f} Med:{probs[1]:.3f} High:{probs[2]:.3f}]")

    # False Positives: Low-Risk classified as High
    low_mask = y_test == 1
    low_total = low_mask.sum()
    fp_mask = low_mask & (y_pred == 3)
    fp_count = fp_mask.sum()
    fp_pct = fp_count / max(low_total, 1) * 100

    print(f"\n  FALSE POSITIVES (Low-Risk → High):")
    print(f"    Count      : {fp_count} / {low_total}")
    print(f"    Percentage : {fp_pct:.2f}%")
    print(f"    Note       : Over-caution is safer than under-detection.")

    # Confusion patterns
    print(f"\n  CONFUSION PATTERNS:")
    low_med_conf = (cm[0, 1] + cm[1, 0]) / cm.sum() * 100
    med_high_conf = (cm[1, 2] + cm[2, 1]) / cm.sum() * 100
    low_high_conf = (cm[0, 2] + cm[2, 0]) / cm.sum() * 100
    print(f"    Low ↔ Medium  confusion rate : {low_med_conf:.2f}%")
    print(f"    Medium ↔ High confusion rate : {med_high_conf:.2f}%")
    print(f"    Low ↔ High    confusion rate : {low_high_conf:.2f}%")

    total_errors = cm.sum() - np.trace(cm)
    if total_errors > 0:
        # Most common error
        cm_nodiag = cm.copy()
        np.fill_diagonal(cm_nodiag, 0)
        max_idx = np.unravel_index(cm_nodiag.argmax(), cm_nodiag.shape)
        from_cls = classes[max_idx[0]]
        to_cls = classes[max_idx[1]]
        print(f"    Most common error: {RISK_LABELS[from_cls]} → {RISK_LABELS[to_cls]} ({cm_nodiag[max_idx]} cases)")

    # ── B. FEATURE IMPORTANCE ─────────────────────────────────────────────
    print(f"\n  B. FEATURE IMPORTANCE (Top 15):\n")
    if not fi_df.empty:
        total_imp = fi_df["importance"].sum()
        print(f"  {'Rank':<6} {'Feature':<30} {'Importance':>12} {'%':>8}")
        print("  " + "-" * 58)
        for rank, (_, row) in enumerate(fi_df.head(15).iterrows(), 1):
            pct = row["importance"] / total_imp * 100 if total_imp > 0 else 0
            print(f"  {rank:<6} {row['feature']:<30} {row['importance']:>12.6f} {pct:>7.1f}%")
    else:
        print("  Feature importance not available.")

    return {
        "fn_high_risk": int(fn_count),
        "fn_high_risk_pct": round(fn_pct, 2),
        "fp_low_to_high": int(fp_count),
        "fp_low_to_high_pct": round(fp_pct, 2),
        "total_errors": int(total_errors),
        "low_med_confusion_pct": round(low_med_conf, 2),
        "med_high_confusion_pct": round(med_high_conf, 2),
    }


# ═════════════════════════════════════════════════════════════════════════════
# PART 6: CROSS-VALIDATION ANALYSIS
# ═════════════════════════════════════════════════════════════════════════════

def part6_cross_validation(model, X_train_sc, y_train_bal):
    print("\n" + "=" * 68)
    print("  PART 6: CROSS-VALIDATION ANALYSIS")
    print("=" * 68)

    try:
        base = getattr(model, "model", model)
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

        cv_accuracy = cross_val_score(base, X_train_sc, y_train_bal, cv=cv, scoring="accuracy")
        cv_f1 = cross_val_score(base, X_train_sc, y_train_bal, cv=cv, scoring="f1_macro")

        print(f"\n  5-Fold Stratified Cross-Validation on Training Data:\n")
        print(f"  {'Fold':<8} {'Accuracy':>10} {'F1 Macro':>10}")
        print("  " + "-" * 30)
        for i in range(5):
            print(f"  {i+1:<8} {cv_accuracy[i]:>10.4f} {cv_f1[i]:>10.4f}")
        print("  " + "-" * 30)
        print(f"  {'Mean':<8} {cv_accuracy.mean():>10.4f} {cv_f1.mean():>10.4f}")
        print(f"  {'Std':<8} {cv_accuracy.std():>10.4f} {cv_f1.std():>10.4f}")
        print(f"  {'Min':<8} {cv_accuracy.min():>10.4f} {cv_f1.min():>10.4f}")
        print(f"  {'Max':<8} {cv_accuracy.max():>10.4f} {cv_f1.max():>10.4f}")

        consistency = "GOOD (low variance)" if cv_accuracy.std() < 0.02 else "MODERATE" if cv_accuracy.std() < 0.05 else "POOR (high variance)"
        print(f"\n  Consistency: {consistency}")

        return {
            "cv_accuracy_mean": round(float(cv_accuracy.mean()), 4),
            "cv_accuracy_std": round(float(cv_accuracy.std()), 4),
            "cv_accuracy_min": round(float(cv_accuracy.min()), 4),
            "cv_accuracy_max": round(float(cv_accuracy.max()), 4),
            "cv_f1_mean": round(float(cv_f1.mean()), 4),
            "cv_f1_std": round(float(cv_f1.std()), 4),
            "consistency": consistency,
        }
    except Exception as e:
        print(f"  Cross-validation could not be run: {e}")
        return {"error": str(e)}


# ═════════════════════════════════════════════════════════════════════════════
# PART 7: BENCHMARK COMPARISON
# ═════════════════════════════════════════════════════════════════════════════

def part7_benchmark_comparison(metrics):
    print("\n" + "=" * 68)
    print("  PART 7: BENCHMARK COMPARISON")
    print("=" * 68)

    acc = metrics["accuracy"]
    benchmarks = [
        ("FDA Medical AI (typical)",  "85-90%",   0.85, 0.90),
        ("Published Research (avg)",  "80-92%",   0.80, 0.92),
        ("Clinical Deployment (min)", "90%+",     0.90, 1.00),
        ("MIMIC Benchmark (typical)", "75-85%",   0.75, 0.85),
    ]

    print(f"\n  {'Benchmark':<30} {'Standard':>12} {'Cortex':>10} {'Status':>10}")
    print("  " + "-" * 66)

    comparison_rows = []
    for name, std_str, low, high in benchmarks:
        if acc >= high:
            status = "EXCEEDS ✓"
        elif acc >= low:
            status = "MEETS ✓"
        else:
            status = "BELOW ✗"
        print(f"  {name:<30} {std_str:>12} {acc*100:>9.2f}% {status:>10}")
        comparison_rows.append({
            "benchmark": name,
            "standard": std_str,
            "cortex_accuracy": round(acc * 100, 2),
            "status": status.strip(),
        })

    return comparison_rows


# ═════════════════════════════════════════════════════════════════════════════
# PART 8 & 9: FINAL REPORT + FILE OUTPUTS
# ═════════════════════════════════════════════════════════════════════════════

def part8_final_report(model_info, metrics, bench, safety, error_info, cv_info,
                       comparison, fi_df, classes, cm, cm_norm, target_checks, lat_checks):
    print("\n" + "=" * 68)
    print("  PART 8: FINAL REPORT")
    print("=" * 68)

    acc = metrics["accuracy"]
    f1_mac = metrics["f1_macro"]
    f1_wt = metrics["f1_weighted"]
    kappa = metrics["cohens_kappa"]
    mcc_val = metrics["mcc"]
    roc_auc = metrics["roc_auc_macro"]
    high_recall = metrics["recall"]["3"]
    med_recall = metrics["recall"]["2"]
    low_recall = metrics["recall"]["1"]
    high_prec = metrics["precision"]["3"]
    med_prec = metrics["precision"]["2"]
    low_prec = metrics["precision"]["1"]
    high_f1 = metrics["f1"]["3"]
    med_f1 = metrics["f1"]["2"]
    low_f1 = metrics["f1"]["1"]
    overfit_gap = metrics["overfit_gap"]
    all_pass = metrics["all_targets_met"]

    from datetime import datetime, timezone
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    # Build the boxed report
    lines = []
    lines.append("")
    lines.append("╔" + "═" * 66 + "╗")
    lines.append("║" + "  CORTEX MODEL — EVALUATION & BENCHMARK REPORT".center(66) + "║")
    lines.append("╠" + "═" * 66 + "╣")
    lines.append("║" + f"  Test Date    : {timestamp}".ljust(66) + "║")
    lines.append("║" + f"  Model Type   : {model_info['base_model']}".ljust(66) + "║")
    lines.append("║" + f"  Features     : {model_info['n_features']}".ljust(66) + "║")
    lines.append("║" + f"  Test Dataset : {sum(int(v) for v in metrics['support'].values())} patients".ljust(66) + "║")
    lines.append("╠" + "═" * 66 + "╣")
    lines.append("║" + "".ljust(66) + "║")
    lines.append("║" + "  OVERALL PERFORMANCE:".ljust(66) + "║")
    lines.append("║" + f"  • Overall Accuracy:     {acc*100:>6.2f}%     [{_pf(acc >= 0.90)} {_icon(acc >= 0.90)}]".ljust(66) + "║")
    lines.append("║" + f"  • Macro F1-Score:       {f1_mac:>7.4f}     [{_pf(f1_mac >= 0.85)} {_icon(f1_mac >= 0.85)}]".ljust(66) + "║")
    lines.append("║" + f"  • Weighted F1-Score:    {f1_wt:>7.4f}     [{_pf(f1_wt >= 0.90)} {_icon(f1_wt >= 0.90)}]".ljust(66) + "║")
    lines.append("║" + f"  • Cohen's Kappa:        {kappa:>7.4f}     [{_pf(kappa >= 0.80)} {_icon(kappa >= 0.80)}]".ljust(66) + "║")
    lines.append("║" + f"  • Matthews Corr Coef:   {mcc_val:>7.4f}     [{_pf(mcc_val >= 0.75)} {_icon(mcc_val >= 0.75)}]".ljust(66) + "║")
    lines.append("║" + f"  • High-Risk Recall:     {high_recall*100:>6.2f}%     [{_pf(high_recall >= 0.95)} {_icon(high_recall >= 0.95)}] ⭐".ljust(66) + "║")
    if roc_auc:
        lines.append("║" + f"  • Macro ROC-AUC:        {roc_auc:>7.4f}".ljust(66) + "║")
    lines.append("║" + "".ljust(66) + "║")
    lines.append("║" + "  PER-CLASS PERFORMANCE:".ljust(66) + "║")
    lines.append("║" + f"  • Low Risk:    Prec {low_prec*100:.1f}% | Rec {low_recall*100:.1f}% | F1 {low_f1*100:.1f}%".ljust(66) + "║")
    lines.append("║" + f"  • Medium Risk: Prec {med_prec*100:.1f}% | Rec {med_recall*100:.1f}% | F1 {med_f1*100:.1f}%".ljust(66) + "║")
    lines.append("║" + f"  • High Risk:   Prec {high_prec*100:.1f}% | Rec {high_recall*100:.1f}% | F1 {high_f1*100:.1f}%  ⭐".ljust(66) + "║")
    lines.append("║" + "".ljust(66) + "║")
    lines.append("║" + "  PERFORMANCE BENCHMARKS:".ljust(66) + "║")
    lines.append("║" + f"  • Inference Time (p95):  {bench['latency_p95_ms']:>6.2f} ms  [{_pf(bench['latency_p95_ms'] < 100)} < 100ms]".ljust(66) + "║")
    lines.append("║" + f"  • Throughput:            {bench['batch_throughput_per_sec']:.0f} pred/sec".ljust(66) + "║")
    lines.append("║" + f"  • Model Size:            {bench['model_size_mb']:.1f} MB".ljust(66) + "║")
    lines.append("║" + f"  • Memory Usage:          {bench['runtime_memory_mb']:.1f} MB".ljust(66) + "║")
    lines.append("║" + "".ljust(66) + "║")
    lines.append("║" + "  CLINICAL SAFETY:".ljust(66) + "║")
    lines.append("║" + f"  • Standard Tests:        {safety['tests_passed']}/{safety['tests_total']} PASSED".ljust(66) + "║")
    lines.append("║" + f"  • Safety Rules:          {safety['safety_passed']}/{safety['safety_total']} WORKING".ljust(66) + "║")
    lines.append("║" + f"  • False Negatives:       {error_info['fn_high_risk']} ({error_info['fn_high_risk_pct']:.1f}%)  [CRITICAL METRIC]".ljust(66) + "║")
    lines.append("║" + "".ljust(66) + "║")
    lines.append("║" + "  OVERFITTING CHECK:".ljust(66) + "║")
    lines.append("║" + f"  • Train/Test Gap:        {overfit_gap*100:.2f}%     [{_pf(overfit_gap < 0.05)} < 5%]".ljust(66) + "║")
    lines.append("║" + "".ljust(66) + "║")

    if cv_info and "cv_accuracy_mean" in cv_info:
        lines.append("║" + "  CROSS-VALIDATION:".ljust(66) + "║")
        lines.append("║" + f"  • 5-Fold Accuracy:       {cv_info['cv_accuracy_mean']:.4f} ± {cv_info['cv_accuracy_std']:.4f}".ljust(66) + "║")
        lines.append("║" + f"  • 5-Fold F1 Macro:       {cv_info['cv_f1_mean']:.4f} ± {cv_info['cv_f1_std']:.4f}".ljust(66) + "║")
        lines.append("║" + f"  • Consistency:           {cv_info['consistency']}".ljust(66) + "║")
        lines.append("║" + "".ljust(66) + "║")

    lines.append("║" + "  FINAL STATUS:".ljust(66) + "║")
    if all_pass and safety["tests_passed"] == safety["tests_total"]:
        lines.append("║" + "  ✓ ALL TARGETS MET — READY FOR PRODUCTION".ljust(66) + "║")
    else:
        n_met = sum(1 for v in target_checks.values() if v[2])
        lines.append("║" + f"  ⚠ {n_met}/{len(target_checks)} TARGETS MET — NEEDS IMPROVEMENT".ljust(66) + "║")
    lines.append("╚" + "═" * 66 + "╝")

    for line in lines:
        print(line)

    # ── RECOMMENDATION ────────────────────────────────────────────────────
    print("\n  RECOMMENDATION:")
    if all_pass and safety["tests_passed"] == safety["tests_total"]:
        print("  The model meets ALL defined performance targets and passes all")
        print("  clinical safety tests. It demonstrates strong generalisation with")
        print(f"  a train/test accuracy gap of only {overfit_gap*100:.2f}%.")
        print(f"  High-risk recall ({high_recall*100:.2f}%) exceeds the critical 95% target,")
        print("  minimising the chance of missing deteriorating patients.")
        print("\n  Strengths:")
        print(f"  - Excellent overall accuracy ({acc*100:.2f}%)")
        print(f"  - Strong High-Risk recall ({high_recall*100:.2f}%) with safety overrides")
        print(f"  - Fast inference ({bench['latency_p95_ms']:.1f}ms p95)")
        print(f"  - Low overfitting ({overfit_gap*100:.2f}% gap)")
        print(f"  - All {safety['safety_total']} safety rules operational")
    else:
        print("  Some targets are not met. Review the FAIL items above.")

    # ── PART 9: FILE OUTPUTS ──────────────────────────────────────────────
    print("\n" + "=" * 68)
    print("  PART 9: FILE OUTPUTS")
    print("=" * 68)

    # 1. evaluation_report.txt
    report_path = os.path.join(os.path.dirname(__file__), "evaluation_report.txt")
    with open(report_path, "w") as f:
        for line in lines:
            f.write(line + "\n")
        f.write("\n")
        f.write("-" * 68 + "\n")
        f.write("DETAILED METRICS\n")
        f.write("-" * 68 + "\n")
        f.write(f"  Overall Accuracy       : {acc:.4f}  ({acc*100:.2f}%)\n")
        f.write(f"  Macro F1-Score         : {f1_mac:.4f}\n")
        f.write(f"  Weighted F1-Score      : {f1_wt:.4f}\n")
        f.write(f"  Cohen's Kappa          : {kappa:.4f}\n")
        f.write(f"  Matthews Corr Coef     : {mcc_val:.4f}\n")
        f.write(f"  Macro ROC-AUC          : {roc_auc:.4f}\n" if roc_auc else "  Macro ROC-AUC          : N/A\n")
        f.write("\n")

        f.write("-" * 68 + "\n")
        f.write("PER-CLASS METRICS\n")
        f.write("-" * 68 + "\n")
        f.write(f"  {'Class':<14} {'Precision':>10} {'Recall':>10} {'F1':>10} {'NPV':>10} {'Support':>10}\n")
        f.write("  " + "-" * 64 + "\n")
        for cls_s in ["1", "2", "3"]:
            cls = int(cls_s)
            lbl = RISK_LABELS.get(cls, cls_s)
            f.write(f"  {lbl + f' ({cls_s})':<14} {metrics['precision'][cls_s]:>10.4f} {metrics['recall'][cls_s]:>10.4f} "
                    f"{metrics['f1'][cls_s]:>10.4f} {metrics['npv'][cls_s]:>10.4f} {metrics['support'][cls_s]:>10}\n")
        f.write("\n")

        f.write("-" * 68 + "\n")
        f.write("TARGET VERIFICATION\n")
        f.write("-" * 68 + "\n")
        f.write(f"  {'Target':<32} {'Actual':>10} {'Required':>10} {'Status':>8}\n")
        f.write("  " + "-" * 62 + "\n")
        for label, (actual, target, passed) in target_checks.items():
            fmt_a = f"{actual:.4f}" if isinstance(actual, float) and actual < 10 else f"{actual:.2f}ms"
            fmt_t = f"{target:.2f}" if isinstance(target, float) and target < 10 else f"{target:.0f}ms"
            f.write(f"  {label:<32} {fmt_a:>10} {fmt_t:>10} {_pf(passed):>8}\n")
        f.write("\n")
        if all_pass:
            f.write("  >>> ALL TARGETS MET <<<\n\n")
        else:
            n_pass = sum(1 for _, (_, _, p) in target_checks.items() if p)
            f.write(f"  >>> {n_pass}/{len(target_checks)} targets met <<<\n\n")

        f.write("-" * 68 + "\n")
        f.write("INFERENCE LATENCY\n")
        f.write("-" * 68 + "\n")
        f.write(f"  Runs           : 1,000\n")
        f.write(f"  Mean           : {bench['latency_mean_ms']:.2f} ms\n")
        f.write(f"  Median         : {bench['latency_median_ms']:.2f} ms\n")
        f.write(f"  P95            : {bench['latency_p95_ms']:.2f} ms\n")
        f.write(f"  P99            : {bench['latency_p99_ms']:.2f} ms\n")
        f.write(f"  Max            : {bench['latency_max_ms']:.2f} ms\n")
        f.write(f"  Throughput     : {bench['batch_throughput_per_sec']:.0f} pred/sec\n\n")

        f.write("-" * 68 + "\n")
        f.write("CONFUSION MATRIX (counts)\n")
        f.write("-" * 68 + "\n")
        cm_hdr = f"  {'Actual \\ Pred':<16}" + "".join(f"{RISK_LABELS.get(c,c):>10}" for c in classes)
        f.write(cm_hdr + "\n")
        f.write("  " + "-" * (16 + 10 * len(classes)) + "\n")
        for i, cls in enumerate(classes):
            row_str = f"  {RISK_LABELS.get(cls, cls):<16}" + "".join(f"{cm[i,j]:>10}" for j in range(len(classes)))
            f.write(row_str + "\n")
        f.write("\n")
        f.write("CONFUSION MATRIX (row-normalised %)\n")
        f.write("  " + "-" * (16 + 10 * len(classes)) + "\n")
        f.write(cm_hdr + "\n")
        f.write("  " + "-" * (16 + 10 * len(classes)) + "\n")
        for i, cls in enumerate(classes):
            row_str = f"  {RISK_LABELS.get(cls, cls):<16}" + "".join(f"{cm_norm[i,j]:>9.1%} " for j in range(len(classes)))
            f.write(row_str + "\n")
        f.write("\n")

        f.write("-" * 68 + "\n")
        f.write("ERROR ANALYSIS\n")
        f.write("-" * 68 + "\n")
        f.write(f"  False Negatives (High→Low/Med): {error_info['fn_high_risk']} ({error_info['fn_high_risk_pct']:.2f}%)\n")
        f.write(f"  False Positives (Low→High)    : {error_info['fp_low_to_high']} ({error_info['fp_low_to_high_pct']:.2f}%)\n")
        f.write(f"  Total misclassifications      : {error_info['total_errors']}\n\n")

        f.write("-" * 68 + "\n")
        f.write("TOP 15 FEATURES BY IMPORTANCE\n")
        f.write("-" * 68 + "\n")
        if not fi_df.empty:
            total_imp = fi_df["importance"].sum()
            f.write(f"  {'Rank':<6} {'Feature':<30} {'Importance':>12} {'%':>8}\n")
            f.write("  " + "-" * 58 + "\n")
            for rank, (_, row) in enumerate(fi_df.head(15).iterrows(), 1):
                pct = row["importance"] / total_imp * 100 if total_imp > 0 else 0
                f.write(f"  {rank:<6} {row['feature']:<30} {row['importance']:>12.6f} {pct:>7.1f}%\n")
        else:
            f.write("  Feature importance not available.\n")
        f.write("\n")

        if cv_info and "cv_accuracy_mean" in cv_info:
            f.write("-" * 68 + "\n")
            f.write("CROSS-VALIDATION\n")
            f.write("-" * 68 + "\n")
            f.write(f"  5-Fold Accuracy : {cv_info['cv_accuracy_mean']:.4f} ± {cv_info['cv_accuracy_std']:.4f}\n")
            f.write(f"  5-Fold F1 Macro : {cv_info['cv_f1_mean']:.4f} ± {cv_info['cv_f1_std']:.4f}\n")
            f.write(f"  Min Accuracy    : {cv_info['cv_accuracy_min']:.4f}\n")
            f.write(f"  Max Accuracy    : {cv_info['cv_accuracy_max']:.4f}\n")
            f.write(f"  Consistency     : {cv_info['consistency']}\n\n")

        f.write("-" * 68 + "\n")
        f.write("CLINICAL SAFETY\n")
        f.write("-" * 68 + "\n")
        f.write(f"  Standard Tests  : {safety['tests_passed']}/{safety['tests_total']} PASSED\n")
        f.write(f"  Safety Rules    : {safety['safety_passed']}/{safety['safety_total']} WORKING\n\n")
        for tc in safety["test_cases"]:
            exp_str = "/".join(str(e) for e in tc["expected"])
            f.write(f"  {tc['name']}: Expected={exp_str} Got={tc['predicted']}({tc['category']}) "
                    f"Conf={tc['confidence']:.4f} Safety={'YES' if tc['safety_override'] else 'No'} "
                    f"→ {_pf(tc['passed'])}\n")
        f.write("\n")

        f.write("-" * 68 + "\n")
        f.write("BENCHMARK COMPARISON\n")
        f.write("-" * 68 + "\n")
        f.write(f"  {'Benchmark':<30} {'Standard':>12} {'Cortex':>10} {'Status':>10}\n")
        f.write("  " + "-" * 66 + "\n")
        for row in comparison:
            f.write(f"  {row['benchmark']:<30} {row['standard']:>12} {row['cortex_accuracy']:>9.2f}% {row['status']:>10}\n")
        f.write("\n")

        f.write("-" * 68 + "\n")
        f.write("PLOTS GENERATED\n")
        f.write("-" * 68 + "\n")
        f.write("  plots/confusion_matrix_Saved_Model.png\n")
        f.write("  plots/roc_curve_Saved_Model.png\n")
        f.write("  plots/feature_importance_Saved_Model.png\n")
        f.write("  plots/precision_recall_curves.png\n")
        f.write("\n" + "=" * 68 + "\n")
        f.write("  END OF REPORT\n")
        f.write("=" * 68 + "\n")

    print(f"  1. evaluation_report.txt     → {report_path}")

    # 2. test_results_summary.json
    json_path = os.path.join(os.path.dirname(__file__), "test_results_summary.json")
    json_data = {
        "timestamp": timestamp,
        "model_info": model_info,
        "metrics": {k: v for k, v in metrics.items()
                    if k not in ("confusion_matrix", "confusion_matrix_norm")},
        "benchmarks": bench,
        "clinical_safety": safety,
        "error_analysis": error_info,
        "cross_validation": cv_info,
        "benchmark_comparison": comparison,
    }
    # Convert numpy types for JSON serialisation
    def _convert(obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, (np.bool_,)):
            return bool(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return obj

    with open(json_path, "w") as f:
        json.dump(json_data, f, indent=2, default=_convert)
    print(f"  2. test_results_summary.json → {json_path}")

    # 3. benchmark_comparison.csv
    csv_path = os.path.join(os.path.dirname(__file__), "benchmark_comparison.csv")
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["benchmark", "standard", "cortex_accuracy", "status"])
        writer.writeheader()
        writer.writerows(comparison)
    print(f"  3. benchmark_comparison.csv  → {csv_path}")

    # List PNGs
    print(f"  4. plots/confusion_matrix_Saved_Model.png")
    print(f"  5. plots/roc_curve_Saved_Model.png")
    print(f"  6. plots/precision_recall_curves.png")
    print(f"  7. plots/feature_importance_Saved_Model.png")

    print("\n" + "=" * 68)
    print("  EVALUATION COMPLETE")
    print("=" * 68 + "\n")

    return all_pass


# ═════════════════════════════════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════════════════════════════════

def main():
    print("\n" + "╔" + "═" * 66 + "╗")
    print("║" + "  COMPREHENSIVE MODEL EVALUATION & BENCHMARK (9 PARTS)".center(66) + "║")
    print("╚" + "═" * 66 + "╝")

    # Part 1
    model, scaler, feature_names, model_info = part1_load_model()

    # Part 2
    (metrics, fi_df, y_test, y_pred, y_prob, y_train, y_train_bal,
     X_train_sc, X_test_sc, X_train, classes, cm, cm_norm, target_checks) = \
        part2_accuracy_metrics(model, scaler, feature_names)

    # Part 3
    bench, lat_checks = part3_benchmarking()

    # Add latency checks to target_checks for the report
    target_checks["Inference P95 < 100ms"] = (
        bench["latency_p95_ms"], TARGETS["inference_p95_ms"],
        bench["latency_p95_ms"] < TARGETS["inference_p95_ms"]
    )

    # Part 4
    safety = part4_clinical_safety()

    # Part 5
    error_info = part5_error_analysis(y_test, y_pred, y_prob, X_test_sc, fi_df, classes, cm)

    # Part 6
    cv_info = part6_cross_validation(model, X_train_sc, y_train_bal)

    # Part 7
    comparison = part7_benchmark_comparison(metrics)

    # Parts 8 & 9
    all_pass = part8_final_report(
        model_info, metrics, bench, safety, error_info, cv_info,
        comparison, fi_df, classes, cm, cm_norm, target_checks, lat_checks
    )

    return all_pass


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
