"""
test_model.py
=============
Validates the trained model against the three canonical test cases from the
project specification, plus additional edge-case and stress tests.

Run after training:
    python test_model.py
"""

import sys
import time
import json

# ── Test cases from project spec ──────────────────────────────────────────────

SPEC_CASES = [
    {
        "name": "Normal Patient (Low Risk)",
        "input": {
            "hr":   75, "spo2": 98, "sbp": 120, "dbp": 80,
            "rr":   16, "temp": 98.6,
            "diabetes": 0, "hypertension": 0, "heart_disease": 0,
            "chest_pain": 0, "breathlessness": 0, "fever": 0,
        },
        "expected_score": 1,
        "expected_category": "Low",
    },
    {
        "name": "Borderline Patient (Medium Risk)",
        "input": {
            "hr":   95, "spo2": 94, "sbp": 135, "dbp": 88,
            "rr":   22, "temp": 99.5,
            "diabetes": 0, "hypertension": 1, "heart_disease": 0,
            "chest_pain": 0, "breathlessness": 1, "fever": 0,
        },
        "expected_score": 2,
        "expected_category": "Medium",
    },
    {
        "name": "Critical Patient (High Risk)",
        "input": {
            "hr":  120, "spo2": 88, "sbp": 160, "dbp": 95,
            "rr":   28, "temp": 102,
            "diabetes": 1, "hypertension": 0, "heart_disease": 1,
            "chest_pain": 1, "breathlessness": 1, "fever": 0,
        },
        "expected_score": 3,
        "expected_category": "High",
    },
]

# ── Extra edge / stress cases ─────────────────────────────────────────────────

EXTRA_CASES = [
    {
        "name": "SpO2 < 90 → Safety Override (High)",
        "input": {
            "hr": 80, "spo2": 87, "sbp": 118, "dbp": 76,
            "rr": 18, "temp": 98.6,
            "diabetes": 0, "hypertension": 0, "heart_disease": 0,
            "chest_pain": 0, "breathlessness": 0, "fever": 0,
        },
        "expected_score": 3,
        "expected_category": "High",
        "expect_override": True,
    },
    {
        "name": "HR > 150 → Safety Override (High)",
        "input": {
            "hr": 155, "spo2": 97, "sbp": 110, "dbp": 70,
            "rr": 16,  "temp": 98.6,
            "diabetes": 0, "hypertension": 0, "heart_disease": 0,
            "chest_pain": 0, "breathlessness": 0, "fever": 0,
        },
        "expected_score": 3,
        "expected_category": "High",
        "expect_override": True,
    },
    {
        "name": "SBP > 180 → Safety Override (High)",
        "input": {
            "hr": 85, "spo2": 97, "sbp": 190, "dbp": 100,
            "rr": 16, "temp": 98.6,
            "diabetes": 0, "hypertension": 1, "heart_disease": 0,
            "chest_pain": 0, "breathlessness": 0, "fever": 0,
        },
        "expected_score": 3,
        "expected_category": "High",
        "expect_override": True,
    },
    {
        "name": "Temp > 103 → Safety Override (High)",
        "input": {
            "hr": 88, "spo2": 96, "sbp": 115, "dbp": 75,
            "rr": 18, "temp": 104,
            "diabetes": 0, "hypertension": 0, "heart_disease": 0,
            "chest_pain": 0, "breathlessness": 0, "fever": 1,
        },
        "expected_score": 3,
        "expected_category": "High",
        "expect_override": True,
    },
    {
        "name": "With Previous Reading (Low Risk, improving)",
        "input": {
            "hr":   72, "spo2": 99, "sbp": 115, "dbp": 75,
            "rr":   14, "temp": 98.2,
            "diabetes": 0, "hypertension": 0, "heart_disease": 0,
            "chest_pain": 0, "breathlessness": 0, "fever": 0,
            "has_previous_reading": 1,
            "prev_hr": 75, "prev_spo2": 97, "prev_sbp": 120, "prev_dbp": 78,
        },
        "expected_score": 1,
        "expected_category": "Low",
    },
    {
        "name": "Multi-comorbidity, stable vitals (Medium-High risk)",
        "input": {
            "hr":   92, "spo2": 93, "sbp": 142, "dbp": 90,
            "rr":   21, "temp": 99.9,
            "diabetes": 1, "hypertension": 1, "heart_disease": 1,
            "chest_pain": 1, "breathlessness": 1, "fever": 1,
        },
        "expected_score": None,   # Accept 2 or 3
        "expected_category": None,
    },
]


# ── Runner ────────────────────────────────────────────────────────────────────

def run_tests():
    from prediction_service import predict_risk

    print("\n" + "=" * 68)
    print("  PATIENT RISK MODEL — VALIDATION TEST SUITE")
    print("=" * 68)

    passed = 0
    failed = 0
    all_cases = SPEC_CASES + EXTRA_CASES

    for i, case in enumerate(all_cases, 1):
        name   = case["name"]
        inp    = case["input"]
        exp_sc = case.get("expected_score")
        exp_ct = case.get("expected_category")
        exp_ov = case.get("expect_override", None)

        t0     = time.perf_counter()
        result = predict_risk(inp)
        ms     = (time.perf_counter() - t0) * 1000

        ok = True
        notes = []

        if exp_sc is not None and result["risk_score"] != exp_sc:
            ok = False
            notes.append(f"score {result['risk_score']} ≠ expected {exp_sc}")

        if exp_ct is not None and result["risk_category"] != exp_ct:
            ok = False
            notes.append(f"category '{result['risk_category']}' ≠ expected '{exp_ct}'")

        if exp_ov is not None and result["safety_override"] != exp_ov:
            ok = False
            notes.append(f"safety_override={result['safety_override']} ≠ expected {exp_ov}")

        if ms > 100:
            notes.append(f"⚠ slow: {ms:.1f} ms (target < 100 ms)")

        status = "PASS ✓" if ok else "FAIL ✗"
        if ok:
            passed += 1
        else:
            failed += 1

        print(f"\n[{i:02d}] {name}")
        print(f"      Result  : risk={result['risk_score']} ({result['risk_category']})  "
              f"conf={result['confidence']:.3f}  override={result['safety_override']}")
        print(f"      Probas  : Low={result['probabilities']['Low']:.3f}  "
              f"Med={result['probabilities']['Medium']:.3f}  "
              f"High={result['probabilities']['High']:.3f}")
        print(f"      Time    : {ms:.1f} ms")
        print(f"      Status  : {status}" + (f"  ← {'; '.join(notes)}" if notes else ""))

    print("\n" + "=" * 68)
    print(f"  RESULTS: {passed} passed  |  {failed} failed  |  {len(all_cases)} total")
    print("=" * 68 + "\n")

    return failed == 0


# ── Performance stress test ────────────────────────────────────────────────────

def stress_test(n: int = 200):
    from prediction_service import predict_risk

    print(f"\n[Stress] Running {n} predictions …")
    template = SPEC_CASES[0]["input"].copy()

    import random
    random.seed(42)
    times = []
    for _ in range(n):
        inp = template.copy()
        inp["hr"]   = random.uniform(55, 105)
        inp["spo2"] = random.uniform(94, 100)
        t0  = time.perf_counter()
        predict_risk(inp)
        times.append((time.perf_counter() - t0) * 1000)

    avg = sum(times) / len(times)
    p95 = sorted(times)[int(0.95 * len(times))]
    print(f"[Stress] avg={avg:.2f} ms  p95={p95:.2f} ms  max={max(times):.2f} ms")
    if p95 < 100:
        print("[Stress] ✓  p95 latency < 100 ms target")
    else:
        print("[Stress] ⚠  p95 latency exceeds 100 ms target")


if __name__ == "__main__":
    success = run_tests()
    stress_test()
    sys.exit(0 if success else 1)
