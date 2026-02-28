"""
model_training.py
=================
Trains three classifiers with optional SMOTE oversampling and
RandomizedSearchCV hyperparameter tuning, then selects the best model.

Models
------
1. Logistic Regression   – fast interpretable baseline
2. Random Forest         – primary model (⭐ recommended)
3. XGBoost               – advanced ensemble
"""

import warnings
import numpy as np
import pandas as pd
from sklearn.linear_model    import LogisticRegression
from sklearn.ensemble        import RandomForestClassifier
from sklearn.model_selection import (
    StratifiedKFold, RandomizedSearchCV, cross_val_score
)
from sklearn.metrics import f1_score
from imblearn.over_sampling  import SMOTE

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except Exception:
    XGBOOST_AVAILABLE = False
    XGBClassifier = None   # type: ignore

from config import RANDOM_STATE, CV_FOLDS

warnings.filterwarnings("ignore")


# ── SMOTE oversampling ─────────────────────────────────────────────────────────

def apply_smote(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    random_state: int = RANDOM_STATE,
) -> tuple:
    """
    Apply SMOTE to balance class distribution.
    Returns (X_resampled, y_resampled) as DataFrames/Series.
    """
    print("\n[SMOTE] Class distribution before oversampling:")
    print(f"  {y_train.value_counts().sort_index().to_dict()}")

    sm = SMOTE(random_state=random_state, k_neighbors=5)
    X_res, y_res = sm.fit_resample(X_train, y_train)

    X_res = pd.DataFrame(X_res, columns=X_train.columns)
    y_res = pd.Series(y_res, name="risk_score")

    print("[SMOTE] Class distribution after oversampling:")
    print(f"  {y_res.value_counts().sort_index().to_dict()}\n")
    return X_res, y_res


# ── 1. Logistic Regression ────────────────────────────────────────────────────

def train_baseline_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    random_state: int = RANDOM_STATE,
) -> LogisticRegression:
    """Train a simple multi-class Logistic Regression baseline."""
    print("=" * 60)
    print(" MODEL 1: Logistic Regression (baseline)")
    print("=" * 60)

    model = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        random_state=random_state,
        solver="lbfgs",
        C=1.0,
    )
    model.fit(X_train, y_train)

    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=random_state)
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1_macro")
    print(f"[LR] {CV_FOLDS}-fold CV F1-macro: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    return model


# ── 2. Random Forest ──────────────────────────────────────────────────────────

def train_random_forest(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    tune: bool = True,
    random_state: int = RANDOM_STATE,
) -> RandomForestClassifier:
    """
    Train a Random Forest with optional RandomizedSearchCV tuning.
    Default params chosen to hit > 90 % accuracy without tuning.
    """
    print("=" * 60)
    print(" MODEL 2: Random Forest ⭐ (primary model)")
    print("=" * 60)

    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=random_state)

    if tune:
        param_dist = {
            "n_estimators":     [100, 200, 300, 500],
            "max_depth":        [10, 20, 30, None],
            "min_samples_split":[2, 5, 10],
            "min_samples_leaf": [1, 2, 4],
            "max_features":     ["sqrt", "log2"],
        }
        base = RandomForestClassifier(
            class_weight="balanced",
            random_state=random_state,
            n_jobs=-1,
        )
        search = RandomizedSearchCV(
            base,
            param_distributions=param_dist,
            n_iter=20,
            scoring="f1_macro",
            cv=cv,
            random_state=random_state,
            n_jobs=-1,
            verbose=1,
        )
        search.fit(X_train, y_train)
        model  = search.best_estimator_
        print(f"[RF] Best params: {search.best_params_}")
        print(f"[RF] Best CV F1-macro: {search.best_score_:.4f}")
    else:
        model = RandomForestClassifier(
            n_estimators=300,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features="sqrt",
            class_weight="balanced",
            random_state=random_state,
            n_jobs=-1,
        )
        model.fit(X_train, y_train)
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1_macro")
        print(f"[RF] {CV_FOLDS}-fold CV F1-macro: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    return model


# ── 3. XGBoost ────────────────────────────────────────────────────────────────

def train_xgboost(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    tune: bool = True,
    random_state: int = RANDOM_STATE,
):
    """
    Train an XGBoost multi-class classifier with optional tuning.
    Labels are shifted to 0-based (XGBoost requirement).
    """
    print("=" * 60)
    print(" MODEL 3: XGBoost (advanced ensemble)")
    print("=" * 60)

    if not XGBOOST_AVAILABLE:
        print("[XGB] XGBoost not available (libomp missing on this system).")
        print("[XGB] Falling back to an extra Random Forest with different params.")
        return train_random_forest(X_train, y_train, tune=False, random_state=random_state + 1)

    # XGBoost needs 0-based class labels
    y_xgb = y_train - 1

    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=random_state)

    # Class-weight adjustment for imbalance
    class_counts = np.bincount(y_xgb.astype(int))
    scale_pos_weight = class_counts[0] / max(class_counts[-1], 1)

    if tune:
        param_dist = {
            "n_estimators":    [100, 200, 300],
            "max_depth":       [3, 5, 7, 10],
            "learning_rate":   [0.01, 0.05, 0.1, 0.3],
            "subsample":       [0.8, 1.0],
            "colsample_bytree":[0.8, 1.0],
            "reg_alpha":       [0, 0.1, 0.5],
            "reg_lambda":      [1, 2, 5],
        }
        base = XGBClassifier(
            objective="multi:softprob",
            num_class=3,
            eval_metric="mlogloss",
            use_label_encoder=False,
            random_state=random_state,
            verbosity=0,
            n_jobs=-1,
        )
        search = RandomizedSearchCV(
            base,
            param_distributions=param_dist,
            n_iter=20,
            scoring="f1_macro",
            cv=cv,
            random_state=random_state,
            n_jobs=-1,
            verbose=1,
        )
        search.fit(X_train, y_xgb)
        model = search.best_estimator_
        print(f"[XGB] Best params: {search.best_params_}")
        print(f"[XGB] Best CV F1-macro: {search.best_score_:.4f}")
    else:
        model = XGBClassifier(
            objective="multi:softprob",
            num_class=3,
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="mlogloss",
            use_label_encoder=False,
            random_state=random_state,
            verbosity=0,
            n_jobs=-1,
        )
        model.fit(X_train, y_xgb)
        cv_scores = cross_val_score(model, X_train, y_xgb, cv=cv, scoring="f1_macro")
        print(f"[XGB] {CV_FOLDS}-fold CV F1-macro: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    return model


# ── Hyperparameter tuning (standalone) ────────────────────────────────────────

def hyperparameter_tuning(
    model_name: str,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    random_state: int = RANDOM_STATE,
):
    """
    Convenience function to run tuning for a named model.
    model_name ∈ {'random_forest', 'xgboost'}
    """
    if model_name == "random_forest":
        return train_random_forest(X_train, y_train, tune=True, random_state=random_state)
    elif model_name == "xgboost":
        return train_xgboost(X_train, y_train, tune=True, random_state=random_state)
    else:
        raise ValueError(f"Unknown model name: {model_name}")


# ── XGBoost prediction adapter ────────────────────────────────────────────────

class XGBAdapter:
    """
    Thin wrapper around XGBClassifier (or RF fallback) that maps 0-based
    internal labels back to 1-based risk scores so the rest of the pipeline
    is consistent.
    """
    def __init__(self, model, is_xgb: bool = True):
        self.model  = model
        self.is_xgb = is_xgb   # False when used as RF fallback

    def predict(self, X):
        preds = self.model.predict(X)
        return preds + 1 if self.is_xgb else preds   # XGB: 0-based → 1-based

    def predict_proba(self, X):
        return self.model.predict_proba(X)

    def __getattr__(self, name):
        # Guard against infinite recursion during pickle/unpickle:
        # if 'model' itself isn't set yet, raise AttributeError immediately.
        if name in ("model", "is_xgb"):
            raise AttributeError(name)
        return getattr(self.model, name)


def wrap_xgboost(model) -> XGBAdapter:
    """
    Return an XGBAdapter that produces 1-based class labels.
    If XGBoost was unavailable and we got an RF fallback, the adapter
    is still returned but predict() will just call the RF directly
    (RF already uses 1-based labels, so we mark the offset accordingly).
    """
    is_xgb = XGBOOST_AVAILABLE and isinstance(model, XGBClassifier)
    return XGBAdapter(model, is_xgb=is_xgb)
