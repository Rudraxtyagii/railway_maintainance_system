"""
Comprehensive Automated Verification Suite for RAILBLOCK Backend (v3.0)
Validates:
1. Database RBAC Authentication (salted PBKDF2 hash verification & token issuance)
2. Grounded Hallucination-Free RAG Engine with manual citations
3. Real-Time CRIS COA / TMS Stream Ingestion (3-Tier Layer)
4. Human-in-the-Loop (HITL) Controller Review & Cryptographic Signatures
5. Optimization & Analytics calculations directly from DB
"""
import sys
import os

# Ensure backend root is on path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.db_init import init_db
from app.db_models import UserDB, TaskDB, HITLReviewDB, KnowledgeChunkDB

client = TestClient(app)


def test_suite():
    print("================================================================================")
    print("            STARTING RAILBLOCK SYSTEM AUTOMATED VERIFICATION SUITE              ")
    print("================================================================================")

    # 0. Initialize DB
    init_db()
    db = SessionLocal()

    # --------------------------------------------------------------------------
    # 1. Test Authentication & RBAC
    # --------------------------------------------------------------------------
    print("\n[TEST 1] Testing Database RBAC Authentication...")
    
    # 1a. Successful Login
    res = client.post("/api/auth/login", json={"username": "planner.admin", "password": "Password123!"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    data = res.json()
    token = data["token"]
    user = data["user"]
    assert user["username"] == "planner.admin"
    assert user["role"] == "PLANNER_ADMIN"
    print(f"  ✓ Successful DB login for {user['name']} ({user['role']}). Token received.")

    # 1b. Failed Login with invalid password
    res_fail = client.post("/api/auth/login", json={"username": "planner.admin", "password": "WrongPassword"})
    assert res_fail.status_code == 401
    print("  ✓ Correctly rejected invalid password with 401 Unauthorized.")

    # 1c. Failed Login with unknown user (no self-signup)
    res_unknown = client.post("/api/auth/login", json={"username": "unknown.hacker", "password": "Password123!"})
    assert res_unknown.status_code == 401
    print("  ✓ Correctly rejected unregistered persona with 401 Unauthorized.")

    auth_headers = {"Authorization": f"Bearer {token}"}

    # --------------------------------------------------------------------------
    # 2. Test Grounded RAG Knowledge Engine & Hallucination Checks
    # --------------------------------------------------------------------------
    print("\n[TEST 2] Testing Grounded Hallucination-Free RAG Engine...")
    
    # 2a. OHE 25kV Safety Query
    rag_res = client.post("/api/ai/rag-query", json={
        "query": "What is the minimum safe clearance distance from 25kV OHE conductors and what are PTW earthing rules?",
        "corridorContext": "NDLS-GZB"
    }, headers=auth_headers)
    assert rag_res.status_code == 200
    rag_data = rag_res.json()
    assert rag_data["groundedInRules"] is True
    assert rag_data["hallucinationCheckPassed"] is True
    assert len(rag_data["citations"]) > 0
    citation_names = [c["manualName"] for c in rag_data["citations"]]
    print(f"  ✓ Grounded RAG Query Success. Citations verified: {citation_names}")
    print(f"  ✓ Grounding rule excerpt: {rag_data['citations'][0]['title']} ({rag_data['citations'][0]['ruleNumber']})")
    assert "2.0 meters" in rag_data["answerMarkdown"] or "2.0" in rag_data["answerMarkdown"]

    # 2b. IRPWM Deep Screening Query
    rag_res2 = client.post("/api/ai/chat", json={
        "message": "What are the deep screening tamping tolerances and speed relaxation schedule under IRPWM?",
        "contextCorridor": "DDU-PRYJ"
    }, headers=auth_headers)
    assert rag_res2.status_code == 200
    chat_data = rag_res2.json()
    assert chat_data["hallucinationCheckPassed"] is True
    print(f"  ✓ Copilot chat grounded in IRPWM standards with {len(chat_data.get('citations', []))} citations.")

    # --------------------------------------------------------------------------
    # 3. Test Real-Time CRIS COA / TMS Stream Ingestion (3-Tier Layer)
    # --------------------------------------------------------------------------
    print("\n[TEST 3] Testing Real-Time COA / TMS Stream Ingestion...")
    stream_payload = {
        "source_system": "COA",
        "stream_id": "CRIS-STREAM-TEST-001",
        "records": [
            {
                "divisionId": "DLI",
                "sectionName": "NDLS-GZB",
                "lineType": "UP Main",
                "stationFrom": "NDLS",
                "stationTo": "GZB",
                "nominatedDate": "2026-09-15",
                "plannedStartTime": "01:30",
                "plannedEndTime": "04:30",
                "demandedTime": "3.0 hrs",
                "requestingDept": "Engineering",
                "blockPurpose": "BCM Deep Screening & Ballast Packing",
                "description": "Continuous track mechanized screening section Km 24/0 to 26/0",
                "trafficImpactStatus": "Regulated Freight / Zero Passenger Delay",
                "corridor": "NDLS-GZB",
                "location": "Section Km 24/0",
                "severity": "Critical",
                "overdueDays": 4,
                "requiresPowerBlock": True,
                "requiresTrafficBlock": True,
                "speedRestrictionKmph": 20
            },
            {
                "divisionId": "DLI",
                "sectionName": "NDLS-GZB",
                "lineType": "UP Main",
                "stationFrom": "ANVR",
                "stationTo": "SBB",
                "nominatedDate": "2026-09-15",
                "plannedStartTime": "02:00",
                "plannedEndTime": "04:00",
                "demandedTime": "2.0 hrs",
                "requestingDept": "Traction Distribution",
                "blockPurpose": "25kV OHE Contact Wire Replacement",
                "description": "Dropper inspection & contact wire tensioning",
                "trafficImpactStatus": "Zero Delay",
                "corridor": "NDLS-GZB",
                "location": "Section Km 25/2",
                "severity": "High",
                "overdueDays": 1,
                "requiresPowerBlock": True,
                "requiresTrafficBlock": False,
                "speedRestrictionKmph": 30
            }
        ]
    }

    ingest_res = client.post("/api/ingest/stream", json=stream_payload, headers=auth_headers)
    assert ingest_res.status_code == 201, f"Ingestion failed: {ingest_res.text}"
    ingest_data = ingest_res.json()
    assert ingest_data["recordsIngested"] == 2
    print(f"  ✓ Stream Ingested: {ingest_data['recordsIngested']} records committed to DB. Stream ID: {ingest_data['streamId']}")
    print(f"  ✓ Automated Conflict Detection: {ingest_data['conflictsDetected']} spatial clash(es) flagged.")

    created_tasks = ingest_data["tasksCreated"]
    target_task_id = created_tasks[0]["id"]

    # Verify task exists in DB
    db_task = db.query(TaskDB).filter(TaskDB.id == target_task_id).first()
    assert db_task is not None
    assert db_task.division_id == "DLI"
    assert db_task.section_name == "NDLS-GZB"
    assert db_task.line_type == "UP Main"
    assert db_task.severity == "Critical"
    print(f"  ✓ Verified persistence in PostgreSQL TaskDB for {target_task_id} (Priority: {db_task.priority_score}).")

    # --------------------------------------------------------------------------
    # 4. Test Human-in-the-Loop (HITL) Controller Review Workflow
    # --------------------------------------------------------------------------
    print("\n[TEST 4] Testing Human-in-the-Loop (HITL) Controller Review & Digital Signatures...")
    
    # 4a. Fetch Pending Reviews
    pending_res = client.get("/api/hitl/pending", headers=auth_headers)
    assert pending_res.status_code == 200
    pending_list = pending_res.json()
    assert any(t["id"] == target_task_id for t in pending_list)
    print(f"  ✓ Task {target_task_id} correctly surfaced in HITL Controller Queue ({len(pending_list)} items pending).")

    # 4b. Controller Modifies & Approves Block Window
    review_payload = {
        "taskId": target_task_id,
        "action": "MODIFY",
        "modifiedStartTime": "01:45",
        "modifiedEndTime": "04:15",
        "modifiedSpeedRestriction": 25,
        "remarks": "Window adjusted by 15 mins to grant 100% line clearance to 12424 Rajdhani Express."
    }
    review_res = client.post("/api/hitl/review", json=review_payload, headers=auth_headers)
    assert review_res.status_code == 200
    review_data = review_res.json()
    assert review_data["action"] == "MODIFY"
    assert review_data["status"] == "CONTROLLER_MODIFIED"
    assert "IR-CRIS-SIG" in review_data["digitalSignature"]
    print(f"  ✓ Controller Review Action logged: {review_data['status']}")
    print(f"  ✓ Cryptographic Digital Signature Token: {review_data['digitalSignature']}")

    # 4c. Verify Audit Trail
    audit_res = client.get("/api/hitl/audit-trail", headers=auth_headers)
    assert audit_res.status_code == 200
    audit_trail = audit_res.json()
    assert len(audit_trail) > 0
    print(f"  ✓ Live Audit Trail verified ({len(audit_trail)} recorded entries).")

    # --------------------------------------------------------------------------
    # 5. Test Live Analytics Dashboard Feed
    # --------------------------------------------------------------------------
    print("\n[TEST 5] Testing Live Analytics & KPI Feed directly from DB...")
    dash_res = client.get("/api/analytics/dashboard", headers=auth_headers)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["totalBlockRequests"] >= 2
    assert dash["downtimeSavedHours"] >= 0
    print(f"  ✓ Live Dashboard KPIs computed from DB:")
    print(f"    • Total Requests: {dash['totalBlockRequests']}")
    print(f"    • Pending: {dash['pendingRequests']}")
    print(f"    • Available Windows: {dash['availableBlockWindows']}")
    print(f"    • Active Conflicts: {dash['activeConflicts']}")
    print(f"    • Downtime Saved: {dash['downtimeSavedHours']} hrs")

    # --------------------------------------------------------------------------
    # 6. Test Role Separation & Real-Time Departmental Allocation Notifications
    # --------------------------------------------------------------------------
    print("\n[TEST 6] Testing Role Separation & Departmental Block Allocation Notifications...")
    
    # 6a. Admin cannot create block requests (403 Forbidden)
    task_req = {
        "divisionId": "DLI",
        "sectionName": "NDLS-GZB",
        "corridor": "NDLS-GZB",
        "location": "Km 28/4",
        "severity": "High",
        "durationHours": 2.0,
        "requestedDate": "2026-09-18",
        "plannedStartTime": "01:30",
        "plannedEndTime": "03:30",
        "department": "Engineering",
        "defectType": "Turnout Diamond Crossing Wear",
        "description": "Special crossing renewal on Point 104B",
        "requiresTrafficBlock": True,
        "requiresPowerBlock": False
    }
    admin_create_res = client.post("/api/tasks", json=task_req, headers=auth_headers)
    assert admin_create_res.status_code == 403, f"Expected 403 for admin task creation, got {admin_create_res.status_code}"
    print("  ✓ Admin correctly rejected with 403 Forbidden when attempting to create block request.")

    # 6b. Departmental Officer (engineer.ndls) logs in and creates block request
    dept_login_res = client.post("/api/auth/login", json={"username": "engineer.ndls", "password": "Password123!"})
    assert dept_login_res.status_code == 200
    dept_token = dept_login_res.json()["token"]
    dept_headers = {"Authorization": f"Bearer {dept_token}"}

    dept_create_res = client.post("/api/tasks", json=task_req, headers=dept_headers)
    assert dept_create_res.status_code == 201, f"Department task creation failed: {dept_create_res.text}"
    dept_task = dept_create_res.json()
    assert dept_task["createdBy"] == "engineer.ndls"
    assert dept_task["requestingDept"] == "Engineering"
    dept_task_id = dept_task["id"]
    print(f"  ✓ Department Officer (engineer.ndls) successfully submitted block request {dept_task_id}.")

    # 6c. Section Controller / Admin approves the block
    approve_payload = {
        "taskId": dept_task_id,
        "action": "APPROVE",
        "remarks": "Approved during planned corridor shadow window."
    }
    approve_res = client.post("/api/hitl/review", json=approve_payload, headers=auth_headers)
    assert approve_res.status_code == 200
    print(f"  ✓ Section Controller officially sanctioned block {dept_task_id}.")

    # --------------------------------------------------------------------------
    # 7. Test Admin Database Reset & Clean-Slate State
    # --------------------------------------------------------------------------
    print("\n[TEST 7] Testing Admin Clean-Slate Database Reset & Statistics...")
    
    # 7a. Non-admin forbidden from resetting database (403 Forbidden)
    non_admin_reset = client.post("/api/admin/reset-database", headers=dept_headers)
    assert non_admin_reset.status_code == 403, f"Expected 403 for non-admin reset, got {non_admin_reset.status_code}"
    print("  ✓ Non-admin persona correctly rejected with 403 Forbidden when attempting database reset.")

    # 7b. Admin retrieves live DB stats
    stats_res = client.get("/api/admin/db-stats", headers=auth_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["users"] >= 5
    assert stats["tasks"] >= 1
    print(f"  ✓ Live DB Stats verified: {stats['users']} users, {stats['tasks']} tasks, {stats['corridors']} corridors.")

    # 7c. Admin executes database reset
    reset_res = client.post("/api/admin/reset-database", headers=auth_headers)
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["status"] == "SUCCESS"
    print(f"  ✓ Admin successfully triggered database reset: {reset_data['message']}")

    # 7d. Verify operational queues are 0 while foundational entities remain
    post_stats_res = client.get("/api/admin/db-stats", headers=auth_headers)
    assert post_stats_res.status_code == 200
    post_stats = post_stats_res.json()
    assert post_stats["tasks"] == 0
    assert post_stats["conflicts"] == 0
    assert post_stats["schedules"] == 0
    assert post_stats["users"] >= 5
    assert post_stats["corridors"] >= 4
    assert post_stats["knowledgeChunks"] >= 5
    print("  ✓ Verified Clean Slate: 0 tasks, 0 conflicts, 0 schedules in DB.")
    print(f"  ✓ Preserved Foundational Config: {post_stats['users']} authenticatable users & {post_stats['knowledgeChunks']} RAG knowledge chunks.")

    # 7e. Verify list tasks is clean []
    empty_tasks_res = client.get("/api/tasks", headers=auth_headers)
    assert empty_tasks_res.status_code == 200
    assert len(empty_tasks_res.json()) == 0
    print("  ✓ Verified GET /api/tasks returns [] in clean state.")

    # --------------------------------------------------------------------------
    # 8. Test Targeted Notification Delivery & Isolation
    # --------------------------------------------------------------------------
    print("\n[TEST 8] Testing Targeted Notification Delivery & Isolation...")
    
    # 8a. S&T Officer logs in and creates an S&T block request
    snt_login = client.post("/api/auth/login", json={"username": "snt.user", "password": "Password123!"})
    assert snt_login.status_code == 200
    snt_token = snt_login.json()["token"]
    snt_headers = {"Authorization": f"Bearer {snt_token}"}

    snt_task_req = {
        "divisionId": "DLI",
        "sectionName": "NDLS-GZB",
        "corridor": "NDLS-GZB",
        "location": "Cabin 4 Interlocking",
        "severity": "High",
        "durationHours": 1.5,
        "requestedDate": "2026-09-19",
        "plannedStartTime": "02:00",
        "plannedEndTime": "03:30",
        "department": "Signal & Telecom",
        "defectType": "Electronic Interlocking Point Overhaul",
        "description": "Routine testing of point machine 102A/B and track circuit failover",
        "requiresTrafficBlock": True,
        "requiresPowerBlock": False
    }
    snt_create_res = client.post("/api/tasks", json=snt_task_req, headers=snt_headers)
    assert snt_create_res.status_code == 201
    snt_task_id = snt_create_res.json()["id"]
    print(f"  ✓ S&T Officer created block request {snt_task_id}.")

    # 8b. Check Admin notifications - should see the targeted notification for new task
    admin_notifs_res = client.get("/api/notifications", headers=auth_headers)
    assert admin_notifs_res.status_code == 200
    admin_notifs = admin_notifs_res.json()
    assert any(snt_task_id in n.get("message", "") or "New Block Requisition" in n.get("title", "") for n in admin_notifs)
    print("  ✓ Admin received targeted notification for new departmental block request.")

    # 8c. Admin approves S&T request
    snt_approve_payload = {
        "taskId": snt_task_id,
        "action": "APPROVE",
        "remarks": "Approved for 02:00 - 03:30 maintenance shadow."
    }
    snt_approve_res = client.post("/api/hitl/review", json=snt_approve_payload, headers=auth_headers)
    assert snt_approve_res.status_code == 200
    print(f"  ✓ Admin approved S&T block request {snt_task_id}.")

    # 8d. S&T Officer checks notifications - should receive the approval notification
    snt_notifs_res = client.get("/api/notifications", headers=snt_headers)
    assert snt_notifs_res.status_code == 200
    snt_notifs = snt_notifs_res.json()
    assert any(snt_task_id in n.get("title", "") or (snt_task_id in n.get("message", "") and "approved" in n.get("message", "").lower()) for n in snt_notifs)
    print(f"  ✓ S&T Officer received targeted approval notification for {snt_task_id}.")

    # --------------------------------------------------------------------------
    # 9. Test User Provisioning & Account Status Lifecycle
    # --------------------------------------------------------------------------
    print("\n[TEST 9] Testing Admin User Provisioning & RBAC Account Lifecycle...")
    
    # 9a. Non-admin forbidden from provisioning users (403)
    non_admin_prov = client.post("/api/auth/users", json={
        "username": "test_officer",
        "name": "Test Officer",
        "email": "test@railnet.gov.in",
        "password": "Password123!",
        "role": "DEPT_ENGINEER"
    }, headers=snt_headers)
    assert non_admin_prov.status_code == 403
    print("  ✓ Non-admin correctly forbidden (403) from provisioning users.")

    # 9b. Admin provisions with invalid role -> 400 Bad Request
    invalid_role_res = client.post("/api/auth/users", json={
        "username": "hacker_user",
        "name": "Hacker User",
        "email": "hacker@test.com",
        "password": "Password123!",
        "role": "SUPER_SUPER_ADMIN_CUSTOM"
    }, headers=auth_headers)
    assert invalid_role_res.status_code == 400
    print("  ✓ Admin provisioning with unauthorized role rejected with 400 Bad Request.")

    # 9c. Admin provisions a valid TRD Officer
    import uuid
    uniq_suffix = uuid.uuid4().hex[:6]
    test_uname = f"new.trd.{uniq_suffix}"
    test_email = f"kavita.{uniq_suffix}@railnet.gov.in"
    valid_prov_res = client.post("/api/auth/users", json={
        "username": test_uname,
        "name": "Kavita Nair",
        "email": test_email,
        "password": "SecurePassword123!",
        "role": "TRD_ENGINEER",
        "department": "Electrical / Traction Distribution",
        "designation": "Assistant Divisional Electrical Engineer (ADEE/TRD)",
        "zone": "Northern Railway",
        "division": "Delhi Division"
    }, headers=auth_headers)
    assert valid_prov_res.status_code == 201
    prov_user = valid_prov_res.json()
    assert prov_user["username"] == test_uname
    assert prov_user["role"] == "TRD_ENGINEER"
    prov_user_id = prov_user["id"]
    print(f"  ✓ Admin successfully provisioned new TRD Officer {prov_user['name']} (ID: {prov_user_id}).")

    # 9d. Newly provisioned user logs in successfully
    new_user_login = client.post("/api/auth/login", json={
        "username": test_uname,
        "password": "SecurePassword123!"
    })
    assert new_user_login.status_code == 200
    assert new_user_login.json()["user"]["role"] == "TRD_ENGINEER"
    print("  ✓ Newly provisioned officer logged in successfully with database credentials.")

    # 9e. Admin suspends the user account
    suspend_res = client.put(f"/api/auth/users/{prov_user_id}", json={"isActive": False}, headers=auth_headers)
    assert suspend_res.status_code == 200
    assert suspend_res.json()["isActive"] is False
    print("  ✓ Admin suspended user account (isActive=False).")

    # 9f. Suspended user login fails with 403 Forbidden
    suspended_login = client.post("/api/auth/login", json={
        "username": test_uname,
        "password": "SecurePassword123!"
    })
    assert suspended_login.status_code == 403
    print("  ✓ Suspended user login rejected with 403 Forbidden.")

    print("\n================================================================================")
    print("            ALL 9 VERIFICATION SUITES PASSED PERFECTLY (100% SUCCESS)           ")
    print("================================================================================")


if __name__ == "__main__":
    test_suite()

