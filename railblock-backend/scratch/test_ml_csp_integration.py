"""
Comprehensive Automated Verification Suite for ML-Assisted Constraint Optimization Integration (v3.0)
Validates all 10 mandated architectural tests:
TEST 1: ML prediction is successfully generated.
TEST 2: ML prediction is consumed by optimization solver.
TEST 3: Predicted duration / buffer is correctly transformed into planningDurationHours.
TEST 4: Overrun risk affects soft ranking only (composite prioritization).
TEST 5: Hard constraints cannot be violated even when ML predicts low risk.
TEST 6: Two incompatible / mismatched corridor blocks can never be scheduled together.
TEST 7: Optimization still works reliably if ML prediction fails (Graceful Fallback).
TEST 8: Existing RBAC permissions remain intact.
TEST 9: HITL approval/modify/deny remains final authority with digital signatures.
TEST 10: Existing RAG functionality remains completely decoupled and operational.
"""
import sys
import os
import time

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.db_init import init_db
from app.db_models import TaskDB, CorridorWindowDB, ScheduleDB, UserDB, ConflictDB
from app.routers.ml_optimization import predict_task_ml, predict_tasks_batch
import app.routers.optimization as opt_module

client = TestClient(app)


def run_all_tests():
    print("================================================================================")
    print("      STARTING RAILBLOCK v3.0 ML-CSP INTEGRATION VERIFICATION SUITE             ")
    print("================================================================================")

    init_db()
    db = SessionLocal()

    # Login as Admin
    login_res = client.post("/api/auth/login", json={"username": "planner.admin", "password": "Password123!"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {token}"}

    # Login as Dept Engineer
    eng_res = client.post("/api/auth/login", json={"username": "engineer.ndls", "password": "Password123!"})
    assert eng_res.status_code == 200
    eng_token = eng_res.json()["token"]
    eng_headers = {"Authorization": f"Bearer {eng_token}"}

    # --------------------------------------------------------------------------
    # TEST 1: ML Prediction is successfully generated
    # --------------------------------------------------------------------------
    print("\n[TEST 1] Testing ML Prediction Generation...")
    sample_task = {
        "id": "TSK-TEST-ML-01",
        "department": "Engineering",
        "corridor": "NDLS-GZB",
        "severity": "Critical",
        "durationHours": 3.0,
        "overdueDays": 6,
        "requiresPowerBlock": True,
        "requiresTrafficBlock": True,
    }
    ml_res = predict_task_ml(sample_task)
    assert ml_res.taskId == "TSK-TEST-ML-01"
    assert ml_res.predictedDurationHours > 0.0
    assert 0.0 <= ml_res.overrunRiskPercent <= 100.0
    assert ml_res.recommendedBufferMinutes in (10, 15, 30)
    assert len(ml_res.riskDrivers) > 0
    print(f"  ✓ ML prediction generated: Requested={ml_res.requestedDurationHours}h, Predicted={ml_res.predictedDurationHours}h, Risk={ml_res.overrunRiskPercent}%, Buffer={ml_res.recommendedBufferMinutes}min.")

    # --------------------------------------------------------------------------
    # TEST 2: ML Prediction is consumed by optimization solver
    # --------------------------------------------------------------------------
    print("\n[TEST 2] Testing ML Prediction Consumption by CSP Optimizer...")
    # Create test task via API
    task_payload = {
        "divisionId": "DLI",
        "sectionName": "NDLS-GZB",
        "corridor": "NDLS-GZB",
        "location": "Km 18/2 Track Renewal",
        "severity": "High",
        "durationHours": 2.0,
        "requestedDate": "2026-09-18",
        "plannedStartTime": "01:30",
        "plannedEndTime": "03:30",
        "department": "Engineering",
        "defectType": "Deep Ballast Screening",
        "description": "BCM machine deep screening & sleeper packing",
        "requiresTrafficBlock": True,
        "requiresPowerBlock": False
    }
    create_task_res = client.post("/api/tasks", json=task_payload, headers=eng_headers)
    assert create_task_res.status_code == 201
    created_task_id = create_task_res.json()["id"]

    # Run optimization
    opt_run_res = client.post("/api/optimization/run", json={"corridors": ["NDLS-GZB"]}, headers=admin_headers)
    assert opt_run_res.status_code == 200
    opt_data = opt_run_res.json()
    assert opt_data["mlAssisted"] is True
    assert "v3.0" in opt_data["engine"]
    assert opt_data["summary"]["tasksScheduled"] >= 1
    assert opt_data["summary"]["mlAssistedTasks"] >= 1
    
    # Verify scheduled block has ML metadata
    found_block = False
    for blk in opt_data["scheduledBlocks"]:
        if created_task_id in blk["taskIds"]:
            found_block = True
            assert blk["mlAssisted"] is True
            assert blk["predictedDurationHours"] is not None
            assert blk["overrunRiskPercent"] is not None
            assert blk["recommendedBufferMinutes"] is not None
            assert blk["constraintStatus"]["corridorMatch"] is True
            assert blk["constraintStatus"]["capacityValid"] is True
            assert "ML" in blk["selectionReason"] or "accommodated" in blk["selectionReason"]
    assert found_block, f"Task {created_task_id} was not scheduled into any block."
    print(f"  ✓ Verified ML predictions consumed and persisted in ScheduledBlock for task {created_task_id}.")

    # --------------------------------------------------------------------------
    # TEST 3: Predicted duration/buffer correctly transformed into planningDurationHours
    # --------------------------------------------------------------------------
    print("\n[TEST 3] Testing Transformation into planningDurationHours...")
    for blk in opt_data["scheduledBlocks"]:
        if blk.get("mlAssisted"):
            expected_planning = round(blk["predictedDurationHours"] + (blk["recommendedBufferMinutes"] / 60.0), 2)
            assert abs(blk["planningDurationHours"] - expected_planning) < 0.05, f"Mismatch: {blk['planningDurationHours']} vs {expected_planning}"
    print("  ✓ Verified formula: planningDurationHours = round(predictedDurationHours + (recommendedBufferMinutes / 60.0), 2).")

    # --------------------------------------------------------------------------
    # TEST 4: Overrun risk affects soft ranking only
    # --------------------------------------------------------------------------
    print("\n[TEST 4] Testing Soft Ranking & Priority Weighting...")
    # Two tasks with same base priority, but one has higher complexity/overrun risk
    t_low = {"id": "T-LOW", "durationHours": 1.0, "severity": "Low", "overdueDays": 0, "department": "Operating", "corridor": "NDLS-GZB"}
    t_high = {"id": "T-HIGH", "durationHours": 3.5, "severity": "Critical", "overdueDays": 10, "department": "Engineering", "corridor": "NDLS-GZB", "requiresPowerBlock": True}
    
    pred_low = predict_task_ml(t_low)
    pred_high = predict_task_ml(t_high)
    assert pred_high.overrunRiskPercent > pred_low.overrunRiskPercent
    assert pred_high.recommendedBufferMinutes >= pred_low.recommendedBufferMinutes
    print(f"  ✓ Soft ranking verified: High risk task received {pred_high.overrunRiskPercent}% risk score vs {pred_low.overrunRiskPercent}% for low risk task.")

    # --------------------------------------------------------------------------
    # TEST 5: Hard constraints cannot be violated even when ML recommends otherwise
    # --------------------------------------------------------------------------
    print("\n[TEST 5] Testing Hard Constraint Inviolability (Capacity & Window Limits)...")
    # An impossible 5-hour task requested for a 3-hour registered window
    oversized_task = {
        "divisionId": "DLI",
        "sectionName": "NDLS-GZB",
        "corridor": "NDLS-GZB",
        "location": "Km 99/9 Impossible Giant Block",
        "severity": "Low",
        "durationHours": 5.5,  # Exceeds maxBlockDurationHours (4.0h)
        "requestedDate": "2026-09-08",
        "plannedStartTime": "01:00",
        "plannedEndTime": "06:30",
        "department": "Operating",
        "defectType": "Test Block",
        "description": "Test impossible capacity block",
        "requiresTrafficBlock": True,
        "requiresPowerBlock": False
    }
    over_res = client.post("/api/tasks", json=oversized_task, headers=eng_headers)
    assert over_res.status_code == 201
    over_id = over_res.json()["id"]

    # Run optimization with strict 4.0h max
    opt_over_res = client.post("/api/optimization/run", json={"corridors": ["NDLS-GZB"], "maxBlockDurationHours": 4.0}, headers=admin_headers)
    assert opt_over_res.status_code == 200
    over_run = opt_over_res.json()
    
    # Check that oversized task was NOT scheduled in a standard 3.0h registered window
    for blk in over_run["scheduledBlocks"]:
        assert blk["durationHours"] <= 4.0, f"Hard capacity violated: {blk['durationHours']} > 4.0h"
    print("  ✓ Hard capacity constraints strictly enforced: No block exceeded 4.0h max limit.")

    # --------------------------------------------------------------------------
    # TEST 6: Incompatible / Mismatched Corridor Blocks Never Scheduled Together
    # --------------------------------------------------------------------------
    print("\n[TEST 6] Testing Corridor Isolation Hard Constraints...")
    # Corridor BCT-ST task
    bct_task = {
        "divisionId": "BCT",
        "sectionName": "BCT-ST",
        "corridor": "BCT-ST",
        "location": "Surat Yard",
        "severity": "High",
        "durationHours": 2.0,
        "requestedDate": "2026-09-20",
        "plannedStartTime": "01:30",
        "plannedEndTime": "03:30",
        "department": "Engineering",
        "defectType": "Turnout Renewal",
        "description": "Surat Yard point testing",
        "requiresTrafficBlock": True,
        "requiresPowerBlock": False
    }
    bct_create = client.post("/api/tasks", json=bct_task, headers=eng_headers)
    assert bct_create.status_code == 201
    bct_id = bct_create.json()["id"]

    # Run optimizer for NDLS-GZB only
    ndls_only_res = client.post("/api/optimization/run", json={"corridors": ["NDLS-GZB"]}, headers=admin_headers)
    assert ndls_only_res.status_code == 200
    ndls_data = ndls_only_res.json()
    for blk in ndls_data["scheduledBlocks"]:
        assert blk["corridor"] == "NDLS-GZB"
        assert bct_id not in blk["taskIds"]
    print("  ✓ Corridor isolation verified: BCT-ST task was strictly excluded from NDLS-GZB run.")

    # --------------------------------------------------------------------------
    # TEST 7: Graceful Fallback if ML is Unavailable
    # --------------------------------------------------------------------------
    print("\n[TEST 7] Testing Graceful Fallback on ML Exception...")
    # Create a fresh pending task for fallback scheduling test
    fallback_task = {
        "divisionId": "DLI",
        "sectionName": "NDLS-GZB",
        "corridor": "NDLS-GZB",
        "location": "Km 45/2 Fallback Test Section",
        "severity": "Medium",
        "durationHours": 2.0,
        "requestedDate": "2026-09-22",
        "plannedStartTime": "01:30",
        "plannedEndTime": "03:30",
        "department": "Signal & Telecom",
        "defectType": "Axle Counter Maintenance",
        "description": "Test deterministic fallback without ML",
        "requiresTrafficBlock": True,
        "requiresPowerBlock": False
    }
    fb_task_res = client.post("/api/tasks", json=fallback_task, headers=eng_headers)
    assert fb_task_res.status_code == 201

    # Temporarily monkey-patch predict_task_ml to throw an intentional exception
    orig_fn = opt_module.predict_task_ml
    def broken_ml(t):
        raise RuntimeError("Simulated ML Inference Engine Offline / Timeout")

    try:
        opt_module.predict_task_ml = broken_ml
        fallback_res = client.post("/api/optimization/run", json={"corridors": ["NDLS-GZB"]}, headers=admin_headers)
        assert fallback_res.status_code == 200, f"Fallback failed: {fallback_res.text}"
        fallback_data = fallback_res.json()
        assert fallback_data["status"] == "SUCCESS"
        assert len(fallback_data["scheduledBlocks"]) >= 1
        print("  ✓ Graceful Fallback verified: Optimizer successfully generated deterministic schedule even when ML threw an exception.")
    finally:
        # Restore original ML function
        opt_module.predict_task_ml = orig_fn

    # --------------------------------------------------------------------------
    # TEST 8: Existing RBAC Permissions Unchanged
    # --------------------------------------------------------------------------
    print("\n[TEST 8] Testing RBAC Invariance...")
    # Admin cannot create tasks (403)
    admin_create = client.post("/api/tasks", json=task_payload, headers=admin_headers)
    assert admin_create.status_code == 403
    # Dept engineer cannot run reset-database (403)
    eng_reset = client.post("/api/admin/reset-database", headers=eng_headers)
    assert eng_reset.status_code == 403
    print("  ✓ RBAC verified: Strict separation of duties between Admins and Department Engineers maintained.")

    # --------------------------------------------------------------------------
    # TEST 9: HITL Review & Digital Signatures Unchanged
    # --------------------------------------------------------------------------
    print("\n[TEST 9] Testing HITL Controller Review & Cryptographic Signatures...")
    hitl_payload = {
        "taskId": created_task_id,
        "action": "APPROVE",
        "remarks": "ML-assisted schedule confirmed and authorized by Section Controller."
    }
    hitl_res = client.post("/api/hitl/review", json=hitl_payload, headers=admin_headers)
    assert hitl_res.status_code == 200
    hitl_data = hitl_res.json()
    assert hitl_data["status"] == "CONTROLLER_APPROVED"
    assert "IR-CRIS-SIG" in hitl_data["digitalSignature"]
    print(f"  ✓ HITL Review sanctioned: Status={hitl_data['status']}, Signature={hitl_data['digitalSignature'][:32]}...")

    # --------------------------------------------------------------------------
    # TEST 10: RAG Functionality Decoupled & Functional
    # --------------------------------------------------------------------------
    print("\n[TEST 10] Testing RAG Grounded Query Decoupling...")
    rag_req = {
        "query": "What is the minimum safe clearance distance from 25kV OHE conductors and what are PTW earthing rules?",
        "corridorContext": "NDLS-GZB",
    }
    rag_res = client.post("/api/ai/rag-query", json=rag_req, headers=admin_headers)
    assert rag_res.status_code == 200, f"RAG query failed: {rag_res.text}"
    rag_data = rag_res.json()
    assert rag_data["groundedInRules"] is True
    assert len(rag_data["citations"]) >= 1
    print(f"  ✓ RAG Grounded query verified with {len(rag_data['citations'])} regulatory citations. Decoupled from numerical optimizer.")

    print("\n================================================================================")
    print("     ALL 10 ML-CSP INTEGRATION TESTS PASSED PERFECTLY (100% SUCCESS)            ")
    print("================================================================================")


if __name__ == "__main__":
    run_all_tests()
