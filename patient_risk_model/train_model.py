"""
train_model.py
==============
Master training script.  Run this once to produce:
  - patient_risk_model.pkl
  - scaler.pkl
  - feature_names.pkl
  - plots/  (confusion matrices, ROC curves, feature importances)

Usage:
    python train_model.py [--tune] [--no-smote] [--n-samples N]

Flags:
    --tune        Enable RandomizedSearchCV hyperparameter tuning (slow)
    --no-smote    Skip SMOTE oversampling
    --n-samples   Number of synthetic patients to generate (default 15000)
"""

import sys
import pickle
import argparse
import joblib
import numpy as np

from data_processing    import load_data, clean_data, prepare_train_test_split, scale_features
from feature_engineering import engineer_features
from model_training     import (
    apply_smote,
    train_baseline_model,
    train_random_forest,
    train_xgboost,
    wrap_xgboost,
)
from model_evaluation   import (
    evaluate_model,
    plot_confusion_matrix,
    plot_roc_curve,
    feature_importance_plot,
    compare_models,
    check_overfitting,
)
from config import (
    MODEL_PATH, SCALER_PATH, FEATURE_NAMES_PATH,
    RANDOM_STATE, N_SAMPLES,
)


def parse_args():
    p = argparse.ArgumentParser(description="Train patient risk model")
    p.add_argument("--tune",      action="store_true", help="Run hyperparameter tuning")
    p.add_argument("--no-smote",  action="store_true", help="Skip SMOTE oversampling")
    p.add_argument("--n-samples", type=int, default=N_SAMPLES)
    return p.parse_args()


def main():
    args = parse_args()
    tune      = args.tune
    use_smote = not args.no_smote
    n_samples = args.n_samples

    print("\n" + "=" * 60)
    print("  PATIENT HEALTH DETERIORATION RISK MODEL — TRAINING")
    print("=" * 60)
    print(f"  Samples   : {n_samples:,}")
    print(f"  Tune HP   : {tune}")
    print(f"  SMOTE     : {use_smote}")
    print(f"  Seed      : {RANDOM_STATE}")
    print("=" * 60 + "\n")

    # ── 1. Data ────────────────────────────────────────────────────────────────
    raw_df = load_data(n_samples=n_samples, random_state=RANDOM_STATE)
    df     = clean_data(raw_df)

    # ── 2. Feature engineering ────────────────────────────────────────────────
    X, y = engineer_features(df)
    feature_names = X.columns.tolist()
    print(f"Feature matrix shape: {X.shape}")

    # ── 3. Train / test split ─────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = prepare_train_test_split(X, y)

    # ── 4. SMOTE on training set only ─────────────────────────────────────────
    if use_smote:
        X_train_bal, y_train_bal = apply_smote(X_train, y_train)
    else:
        X_train_bal, y_train_bal = X_train, y_train

    # ── 5. Scaling ────────────────────────────────────────────────────────────
    X_train_sc, X_test_sc, scaler = scale_features(X_train_bal, X_test)

    # ── 6. Train all three models ─────────────────────────────────────────────

    # -- Baseline
    lr_model = train_baseline_model(X_train_sc, y_train_bal)

    # -- Random Forest (primary)
    rf_model = train_random_forest(X_train_sc, y_train_bal, tune=tune)

    # -- XGBoost (advanced)
    xgb_raw   = train_xgboost(X_train_sc, y_train_bal, tune=tune)
    xgb_model = wrap_xgboost(xgb_raw)     # adapts 0-based → 1-based labels

    # ── 7. Evaluate ───────────────────────────────────────────────────────────
    all_results = {}

    for model, name, is_xgb in [
        (lr_model,  "Logistic Regression", False),
        (rf_model,  "Random Forest",       False),
        (xgb_model, "XGBoost",             False),  # XGBAdapter handles label shift
    ]:
        results = evaluate_model(model, X_test_sc, y_test, model_name=name)
        all_results[name] = results

        plot_confusion_matrix(y_test, results["y_pred"], model_name=name)
        plot_roc_curve(y_test, results["y_prob"],        model_name=name)
        feature_importance_plot(model, feature_names,    model_name=name)
        check_overfitting(
            model,
            X_train_sc, y_train_bal,
            X_test_sc,  y_test,
            model_name=name,
        )

    compare_models(all_results)

    # ── 8. Select best model ──────────────────────────────────────────────────
    # Primary criterion: macro F1; tie-break on High-Risk recall
    def model_score(name):
        r = all_results[name]
        return r["f1_macro"] * 0.6 + r["recall"].get(3, 0) * 0.4

    best_name  = max(all_results, key=model_score)
    best_model = {"Logistic Regression": lr_model,
                  "Random Forest":       rf_model,
                  "XGBoost":             xgb_model}[best_name]

    print("\n" + "=" * 60)
    print(f"  BEST MODEL: {best_name}")
    print(f"  Accuracy   : {all_results[best_name]['accuracy']:.4f}")
    print(f"  F1-macro   : {all_results[best_name]['f1_macro']:.4f}")
    print(f"  HR Recall  : {all_results[best_name]['recall'].get(3, 0):.4f}")
    print("=" * 60)

    # ── 9. Save artefacts ─────────────────────────────────────────────────────
    joblib.dump(best_model, MODEL_PATH)
    joblib.dump(scaler,     SCALER_PATH)
    with open(FEATURE_NAMES_PATH, "wb") as f:
        pickle.dump(feature_names, f)

    print(f"\n[Save] Model        → {MODEL_PATH}")
    print(f"[Save] Scaler       → {SCALER_PATH}")
    print(f"[Save] Feature names→ {FEATURE_NAMES_PATH}")
    print("\n Training complete.  Run 'python test_model.py' to validate.\n")

    return best_model, scaler, feature_names, all_results


if __name__ == "__main__":
    main()
