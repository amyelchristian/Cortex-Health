"""
model_evaluation.py
===================
Computes all evaluation metrics, plots confusion matrix, ROC curves,
and feature-importance charts.  Saves figures to the plots/ directory.
"""

import os
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")          # non-interactive backend (safe for scripts)
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.preprocessing import label_binarize

from config import RISK_MAP, HIGH_RISK_THRESHOLD, HIGH_RISK_MARGIN

warnings.filterwarnings("ignore")

PLOT_DIR = "plots"
os.makedirs(PLOT_DIR, exist_ok=True)


# ── Core evaluation ────────────────────────────────────────────────────────────

def evaluate_model(
    model,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    model_name: str = "Model",
    xgb_mode: bool = False,
) -> dict:
    """
    Full evaluation suite.
    Set xgb_mode=True when the model internally uses 0-based labels
    (XGBAdapter wraps this automatically, so xgb_mode should be False for it).
    """
    print("\n" + "=" * 60)
    print(f" EVALUATION: {model_name}")
    print("=" * 60)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)

    # -- Apply two-condition high-risk override (matches production behaviour)
    #    Classify as High when BOTH conditions are met:
    #      1. P(High) >= HIGH_RISK_THRESHOLD
    #      2. P(High) >= max(proba) - HIGH_RISK_MARGIN
    if y_prob.shape[1] >= 3:
        high_proba = y_prob[:, 2]         # column index 2 = class 3 (High)
        max_proba  = y_prob.max(axis=1)
        override   = (high_proba >= HIGH_RISK_THRESHOLD) & (high_proba >= max_proba - HIGH_RISK_MARGIN)
        y_pred     = np.where(override, 3, y_pred)

    # -- Per-class metrics
    classes = sorted(y_test.unique())
    acc     = accuracy_score(y_test, y_pred)
    prec    = precision_score(y_test, y_pred, average=None, labels=classes, zero_division=0)
    rec     = recall_score(   y_test, y_pred, average=None, labels=classes, zero_division=0)
    f1      = f1_score(       y_test, y_pred, average=None, labels=classes, zero_division=0)

    print(f"\nOverall Accuracy : {acc:.4f}  ({acc*100:.2f} %)")
    print("\nPer-class metrics:")
    header = f"{'Class':<12} {'Precision':>10} {'Recall':>10} {'F1':>10}"
    print(header)
    print("-" * len(header))
    for i, cls in enumerate(classes):
        risk = RISK_MAP.get(cls, str(cls))
        print(f"  {cls} ({risk:<6}) {prec[i]:>10.4f} {rec[i]:>10.4f} {f1[i]:>10.4f}")

    f1_macro = f1_score(y_test, y_pred, average="macro", zero_division=0)
    print(f"\nMacro F1-score   : {f1_macro:.4f}")

    # -- ROC-AUC (one-vs-rest)
    y_bin = label_binarize(y_test, classes=classes)
    try:
        roc_auc = roc_auc_score(y_bin, y_prob, multi_class="ovr", average="macro")
        print(f"Macro ROC-AUC    : {roc_auc:.4f}")
    except Exception:
        roc_auc = None
        print("ROC-AUC: could not compute")

    # -- Classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=[RISK_MAP[c] for c in classes]))

    # -- Critical: High-Risk recall
    if 3 in classes:
        idx      = list(classes).index(3)
        hr_recall = rec[idx]
        hr_prec   = prec[idx]
        print(f"[CRITICAL] High-Risk Recall : {hr_recall:.4f}  (target > 0.95)")
        print(f"[CRITICAL] High-Risk Prec.  : {hr_prec:.4f}")

        if hr_recall < 0.95:
            print("  ⚠  High-Risk recall below target!  Consider adjusting class weights.")
        else:
            print("  ✓  High-Risk recall meets target.")

    metrics = {
        "accuracy":      acc,
        "precision":     dict(zip(classes, prec)),
        "recall":        dict(zip(classes, rec)),
        "f1":            dict(zip(classes, f1)),
        "f1_macro":      f1_macro,
        "roc_auc":       roc_auc,
        "y_pred":        y_pred,
        "y_prob":        y_prob,
        "classes":       classes,
    }
    return metrics


# ── Confusion matrix ───────────────────────────────────────────────────────────

def plot_confusion_matrix(
    y_test:     pd.Series,
    y_pred:     np.ndarray,
    model_name: str = "Model",
    save:       bool = True,
) -> None:
    classes    = sorted(y_test.unique())
    tick_labels= [f"{c}\n({RISK_MAP.get(c, c)})" for c in classes]

    cm = confusion_matrix(y_test, y_pred, labels=classes)
    cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle(f"Confusion Matrix – {model_name}", fontsize=14, fontweight="bold")

    for ax, data, fmt, title in zip(
        axes,
        [cm, cm_norm],
        ["d", ".2%"],
        ["Counts", "Row-Normalised"],
    ):
        sns.heatmap(
            data, annot=True, fmt=fmt,
            xticklabels=tick_labels, yticklabels=tick_labels,
            cmap="Blues", ax=ax,
            linewidths=0.5,
        )
        ax.set_title(title)
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")

    plt.tight_layout()
    if save:
        path = os.path.join(PLOT_DIR, f"confusion_matrix_{model_name.replace(' ','_')}.png")
        plt.savefig(path, dpi=150, bbox_inches="tight")
        print(f"[Plot] Confusion matrix saved → {path}")
    plt.close()


# ── ROC curves ────────────────────────────────────────────────────────────────

def plot_roc_curve(
    y_test:     pd.Series,
    y_prob:     np.ndarray,
    model_name: str = "Model",
    save:       bool = True,
) -> None:
    classes = sorted(y_test.unique())
    y_bin   = label_binarize(y_test, classes=classes)
    colours = ["#2196F3", "#FF9800", "#F44336"]

    fig, ax = plt.subplots(figsize=(8, 6))
    for i, cls in enumerate(classes):
        fpr, tpr, _ = roc_curve(y_bin[:, i], y_prob[:, i])
        try:
            auc = roc_auc_score(y_bin[:, i], y_prob[:, i])
            label = f"Class {cls} ({RISK_MAP.get(cls,'?')}) – AUC {auc:.3f}"
        except Exception:
            label = f"Class {cls} ({RISK_MAP.get(cls,'?')})"
        ax.plot(fpr, tpr, color=colours[i % len(colours)], lw=2, label=label)

    ax.plot([0, 1], [0, 1], "k--", lw=1)
    ax.set_xlim([0, 1]); ax.set_ylim([0, 1.02])
    ax.set_xlabel("False Positive Rate"); ax.set_ylabel("True Positive Rate")
    ax.set_title(f"ROC Curves (OvR) – {model_name}", fontweight="bold")
    ax.legend(loc="lower right")
    ax.grid(alpha=0.3)

    plt.tight_layout()
    if save:
        path = os.path.join(PLOT_DIR, f"roc_curve_{model_name.replace(' ','_')}.png")
        plt.savefig(path, dpi=150, bbox_inches="tight")
        print(f"[Plot] ROC curves saved → {path}")
    plt.close()


# ── Feature importance ────────────────────────────────────────────────────────

def feature_importance_plot(
    model,
    feature_names: list,
    model_name:    str  = "Model",
    top_n:         int  = 20,
    save:          bool = True,
) -> pd.DataFrame:
    """
    Works with Random Forest (feature_importances_) and
    XGBoost / XGBAdapter models.
    """
    try:
        # Unwrap XGBAdapter if needed
        base = getattr(model, "model", model)
        importances = base.feature_importances_
    except AttributeError:
        print(f"[FI] {model_name} does not expose feature_importances_ – skipping.")
        return pd.DataFrame()

    fi = pd.DataFrame(
        {"feature": feature_names, "importance": importances}
    ).sort_values("importance", ascending=False).head(top_n)

    fig, ax = plt.subplots(figsize=(10, max(6, top_n // 2)))
    colours = plt.cm.RdYlGn_r(np.linspace(0.1, 0.9, len(fi)))
    ax.barh(fi["feature"][::-1], fi["importance"][::-1], color=colours[::-1])
    ax.set_xlabel("Feature Importance (Gini / Gain)")
    ax.set_title(f"Top {top_n} Feature Importances – {model_name}", fontweight="bold")
    ax.grid(axis="x", alpha=0.3)

    plt.tight_layout()
    if save:
        path = os.path.join(PLOT_DIR, f"feature_importance_{model_name.replace(' ','_')}.png")
        plt.savefig(path, dpi=150, bbox_inches="tight")
        print(f"[Plot] Feature importance saved → {path}")
    plt.close()

    print(f"\n[FI] Top-10 features ({model_name}):")
    print(fi.head(10).to_string(index=False))
    return fi


# ── Model comparison ──────────────────────────────────────────────────────────

def compare_models(results: dict, save: bool = True) -> None:
    """
    Bar chart comparing accuracy, F1-macro and high-risk recall
    across all trained models.
    """
    model_names  = list(results.keys())
    accuracies   = [results[m]["accuracy"]  for m in model_names]
    f1_macros    = [results[m]["f1_macro"]  for m in model_names]
    hr_recalls   = [results[m]["recall"].get(3, 0) for m in model_names]

    x = np.arange(len(model_names))
    w = 0.25

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.bar(x - w, accuracies, w, label="Accuracy",      color="#2196F3", alpha=0.85)
    ax.bar(x,     f1_macros,  w, label="F1 Macro",      color="#4CAF50", alpha=0.85)
    ax.bar(x + w, hr_recalls, w, label="High-Risk Rec.",color="#F44336", alpha=0.85)

    ax.axhline(0.90, ls="--", color="grey", lw=1, label="90 % target")
    ax.axhline(0.95, ls=":",  color="red",  lw=1, label="95 % HR-recall target")

    ax.set_xticks(x)
    ax.set_xticklabels(model_names, fontweight="bold")
    ax.set_ylim([0.5, 1.05])
    ax.set_ylabel("Score")
    ax.set_title("Model Comparison", fontsize=14, fontweight="bold")
    ax.legend()
    ax.grid(axis="y", alpha=0.3)

    plt.tight_layout()
    if save:
        path = os.path.join(PLOT_DIR, "model_comparison.png")
        plt.savefig(path, dpi=150, bbox_inches="tight")
        print(f"[Plot] Model comparison saved → {path}")
    plt.close()


# ── Overfitting check ─────────────────────────────────────────────────────────

def check_overfitting(
    model,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test:  pd.DataFrame,
    y_test:  pd.Series,
    model_name: str = "Model",
) -> None:
    train_acc = accuracy_score(y_train, model.predict(X_train))
    test_acc  = accuracy_score(y_test,  model.predict(X_test))
    gap       = train_acc - test_acc

    print(f"\n[Overfit Check] {model_name}")
    print(f"  Train accuracy : {train_acc:.4f}")
    print(f"  Test  accuracy : {test_acc:.4f}")
    print(f"  Gap            : {gap:.4f}  ({'OK ✓' if gap < 0.05 else 'WARNING ⚠'})")
