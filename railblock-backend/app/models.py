from __future__ import annotations

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth & User Management
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: str
    username: str
    name: str
    designation: str
    role: str
    department: str
    zone: str
    division: str
    email: str
    avatar: str
    permissions: Optional[List[str]] = Field(default_factory=list)
    isActive: Optional[bool] = True
    createdAt: Optional[str] = None
    lastLogin: Optional[str] = None


class LoginResponse(BaseModel):
    token: str
    user: UserOut


VALID_ROLES = {"PLANNER_ADMIN", "DEPT_ENGINEER", "SNT_OFFICER", "TRD_ENGINEER", "FIELD_CONTROLLER"}


class UserCreateRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str
    role: str  # PLANNER_ADMIN | DEPT_ENGINEER | SNT_OFFICER | TRD_ENGINEER | FIELD_CONTROLLER
    department: Optional[str] = "Engineering"
    designation: Optional[str] = "Railway Official"
    zone: Optional[str] = "Northern Railway"
    division: Optional[str] = "Delhi Division"
    avatar: Optional[str] = "IR"
    permissions: Optional[List[str]] = None


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    zone: Optional[str] = None
    division: Optional[str] = None
    password: Optional[str] = None
    isActive: Optional[bool] = None
    permissions: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Tasks (3-Tier CRIS COA / TMS Rolling Block Demands & Execution Logs)
# ---------------------------------------------------------------------------
class Task(BaseModel):
    id: str
    source: str = "MANUAL"
    divisionId: Optional[str] = "DLI"
    sectionName: Optional[str] = "NDLS-GZB"
    lineType: Optional[str] = "UP Main"
    stationFrom: Optional[str] = "NDLS"
    stationTo: Optional[str] = "GZB"
    corridor: str
    location: str
    department: str
    requestingDept: Optional[str] = None
    defectType: str
    blockPurpose: Optional[str] = "Track & Overhead Maintenance"
    description: str
    severity: str
    severityWeight: int
    overdueDays: int
    priorityScore: int
    status: str = "Pending"
    nominatedDate: Optional[str] = None
    requestedDate: str
    preferredDate: Optional[str] = None
    plannedStartTime: Optional[str] = "01:30"
    plannedEndTime: Optional[str] = "04:30"
    preferredWindow: str
    demandedDurationMins: Optional[int] = 180
    durationHours: float
    demandedTime: Optional[str] = None
    grantedTime: Optional[str] = None
    actualStartTime: Optional[str] = None
    actualEndTime: Optional[str] = None
    burstDurationMins: Optional[int] = 0
    trafficImpactStatus: Optional[str] = "Zero Delay / Regulated"
    requiresPowerBlock: bool = False
    requiresTrafficBlock: bool = True
    speedRestrictionKmph: Optional[int] = None
    notes: Optional[str] = None
    hitlStatus: Optional[str] = "PENDING_REVIEW"
    controllerRemarks: Optional[str] = None
    controllerId: Optional[str] = None
    reviewedAt: Optional[str] = None
    createdBy: Optional[str] = "system"
    createdByUserId: Optional[str] = None
    createdByName: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


class TaskCreate(BaseModel):
    department: Optional[str] = None
    description: str
    location: str
    corridor: str
    divisionId: Optional[str] = "DLI"
    sectionName: Optional[str] = "NDLS-GZB"
    lineType: Optional[str] = "UP Main"
    stationFrom: Optional[str] = "NDLS"
    stationTo: Optional[str] = "GZB"
    defectType: Optional[str] = "Track Geometry / Ballast Deficiency"
    blockPurpose: Optional[str] = "Track & Overhead Maintenance"
    severity: Optional[str] = "High"
    durationHours: Optional[float] = 2.5
    preferredDate: Optional[str] = None
    requestedDate: Optional[str] = None
    nominatedDate: Optional[str] = None
    plannedStartTime: Optional[str] = "01:30"
    plannedEndTime: Optional[str] = "04:30"
    preferredWindow: Optional[str] = "01:30 - 04:30"
    overdueDays: Optional[int] = 0
    requiresTrafficBlock: Optional[bool] = True
    requiresPowerBlock: Optional[bool] = False
    speedRestrictionKmph: Optional[int] = 30
    trafficImpactStatus: Optional[str] = "Zero Delay / Regulated"
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Real-Time COA / TMS Stream Ingestion Models
# ---------------------------------------------------------------------------
class COAStreamItem(BaseModel):
    division_id: Optional[str] = Field("DLI", alias="divisionId")
    section_name: Optional[str] = Field("NDLS-GZB", alias="sectionName")
    line_type: Optional[str] = Field("UP Main", alias="lineType")
    station_from: Optional[str] = Field("NDLS", alias="stationFrom")
    station_to: Optional[str] = Field("GZB", alias="stationTo")
    nominated_date: Optional[str] = Field(None, alias="nominatedDate")
    planned_start_time: Optional[str] = Field("01:30", alias="plannedStartTime")
    planned_end_time: Optional[str] = Field("04:30", alias="plannedEndTime")
    demanded_time: Optional[str] = Field(None, alias="demandedTime")
    granted_time: Optional[str] = Field(None, alias="grantedTime")
    actual_start_time: Optional[str] = Field(None, alias="actualStartTime")
    actual_end_time: Optional[str] = Field(None, alias="actualEndTime")
    burst_duration_mins: Optional[int] = Field(0, alias="burstDurationMins")
    requesting_dept: Optional[str] = Field("Engineering", alias="requestingDept")
    block_purpose: Optional[str] = Field("Deep Screening & Track Maintenance", alias="blockPurpose")
    description: Optional[str] = "Rolling block demand"
    traffic_impact_status: Optional[str] = Field("Zero Delay / Regulated", alias="trafficImpactStatus")
    corridor: Optional[str] = "NDLS-GZB"
    location: Optional[str] = "Section Km 24/2"
    severity: Optional[str] = "High"
    overdue_days: Optional[int] = Field(0, alias="overdueDays")
    requires_power_block: Optional[bool] = Field(False, alias="requiresPowerBlock")
    requires_traffic_block: Optional[bool] = Field(True, alias="requiresTrafficBlock")
    speed_restriction_kmph: Optional[int] = Field(30, alias="speedRestrictionKmph")


class COAStreamBatchRequest(BaseModel):
    source_system: Optional[str] = "COA"  # COA | TMS | FOIS | ICMS
    stream_id: Optional[str] = None
    records: List[COAStreamItem]


class COAStreamResponse(BaseModel):
    success: bool
    streamId: str
    sourceSystem: str
    recordsIngested: int
    conflictsDetected: int
    tasksCreated: List[dict]
    timestamp: str


# ---------------------------------------------------------------------------
# Grounded Hallucination-Free RAG Knowledge Layer
# ---------------------------------------------------------------------------
class KnowledgeIngestRequest(BaseModel):
    manualName: str  # G&SR | ACTM_VOL_II | IRPWM | BWM | ROLLING_BLOCK_2024
    chapter: Optional[str] = None
    ruleNumber: Optional[str] = None
    title: str
    content: str
    tags: Optional[List[str]] = None


class KnowledgeChunkOut(BaseModel):
    id: str
    manualName: str
    chapter: Optional[str] = None
    ruleNumber: Optional[str] = None
    title: str
    content: str
    tags: List[str]
    createdAt: Optional[str] = None


class GroundedCitation(BaseModel):
    manualName: str
    chapter: Optional[str] = None
    ruleNumber: Optional[str] = None
    title: str
    excerpt: str
    verifiedGroundTruth: bool = True


class RAGQueryRequest(BaseModel):
    query: str
    corridorContext: Optional[str] = None
    strictGroundedOnly: Optional[bool] = True


class RAGQueryResponse(BaseModel):
    query: str
    answerMarkdown: str
    citations: List[GroundedCitation]
    groundedInRules: bool
    hallucinationCheckPassed: bool
    liveSystemContext: Optional[Dict[str, Any]] = None
    suggestedActions: Optional[List[dict]] = None
    timestamp: str


# ---------------------------------------------------------------------------
# Human-in-the-Loop (HITL) Controller Review Models
# ---------------------------------------------------------------------------
class HITLReviewActionRequest(BaseModel):
    taskId: Optional[str] = None
    bundleId: Optional[str] = None
    scheduleId: Optional[str] = None
    action: str  # APPROVE | MODIFY | REJECT | OVERRIDE
    modifiedStartTime: Optional[str] = None
    modifiedEndTime: Optional[str] = None
    modifiedDate: Optional[str] = None
    modifiedSpeedRestriction: Optional[int] = None
    remarks: str = "Controller review decision entered in accordance with G&SR."


class HITLOverrideRequest(BaseModel):
    taskId: str
    reason: str
    emergencyJustification: str
    authorizationPasscode: Optional[str] = "CRIS@2026"


class HITLReviewResponse(BaseModel):
    reviewId: str
    entityId: str
    action: str
    status: str
    controllerName: str
    digitalSignature: str
    timestamp: str
    remarks: str


# ---------------------------------------------------------------------------
# Corridors & timetable windows
# ---------------------------------------------------------------------------
class Corridor(BaseModel):
    code: str
    name: str
    zone: str
    lines: List[str]


class CorridorWindow(BaseModel):
    id: str
    corridor: str
    line: str
    date: str
    startTime: str
    endTime: str
    durationHours: float
    status: str
    trafficDensity: str
    occupancyBefore: str
    occupancyAfter: str
    suitableTasks: List[str] = Field(default_factory=list)
    conflictCount: int = 0


# ---------------------------------------------------------------------------
# Conflicts & bundles
# ---------------------------------------------------------------------------
class Conflict(BaseModel):
    id: str
    type: str
    corridor: str
    date: str
    departments: List[str]
    taskIds: List[str]
    description: str
    status: str = "Open"


class ConflictResolveRequest(BaseModel):
    resolution: str


class Bundle(BaseModel):
    id: str
    corridor: str
    date: str
    departments: List[str]
    taskIds: List[str]
    windowId: Optional[str] = None
    downtimeSavedHours: float
    status: str = "Candidate"


# ---------------------------------------------------------------------------
# Optimization engine
# ---------------------------------------------------------------------------
class DateRange(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None


class OptimizationRequest(BaseModel):
    corridors: Optional[List[str]] = None
    dateRange: Optional[DateRange] = None
    maxBlockDurationHours: float = 4.0
    safetyBufferMinutes: int = 15


class ScheduledBlock(BaseModel):
    id: str
    blockCode: str
    corridor: str
    corridorName: str
    date: str
    startTime: str
    endTime: str
    durationHours: float
    departments: List[str]
    taskIds: List[str]
    tasksCount: int
    priority: str
    bundleId: Optional[str] = None
    status: str = "Proposed"
    trafficBlockGranted: bool = False
    powerBlockGranted: bool = False
    controllerApproval: str = "Pending"
    speedRestrictionKmph: Optional[int] = None
    efficiencyGainPercent: float = 0.0
    requestedDurationHours: Optional[float] = None
    predictedDurationHours: Optional[float] = None
    overrunRiskPercent: Optional[float] = None
    recommendedBufferMinutes: Optional[int] = None
    planningDurationHours: Optional[float] = None
    mlAssisted: Optional[bool] = True
    constraintStatus: Optional[Dict[str, bool]] = None
    selectionReason: Optional[str] = None


class OptimizationSummary(BaseModel):
    tasksScheduled: int
    tasksNotScheduled: int
    conflictsResolved: int
    bundlesCreated: int
    totalBlockDurationHours: float
    manualPlanningDowntimeHours: float
    optimizedDowntimeHours: float
    downtimeSavedHours: float
    downtimeSavingPercent: float
    networkUtilization: str
    mlAssistedTasks: int = 0
    averageOverrunRiskPercent: float = 0.0


class OptimizationResponse(BaseModel):
    optimizationId: str
    engine: str = "ML-Assisted 2-Pass Greedy Constraint Satisfaction + Shadow Bundling Solver (v3.0)"
    executionTimeMs: int
    timestamp: str
    summary: OptimizationSummary
    scheduledBlocks: List[ScheduledBlock]
    bundles: List[Bundle] = Field(default_factory=list)
    mlAssisted: bool = True
    status: str = "SUCCESS"


# ---------------------------------------------------------------------------
# Master schedule
# ---------------------------------------------------------------------------
class ValidationCheck(BaseModel):
    check: str
    passed: bool
    detail: str


class ValidationResult(BaseModel):
    scheduleId: str
    allPassed: bool
    checks: List[ValidationCheck]


# ---------------------------------------------------------------------------
# Sync
# ---------------------------------------------------------------------------
class SourceStatus(BaseModel):
    id: str
    name: str
    description: str
    status: str
    lastSyncTime: str
    recordsReceived: int
    recordsSuccess: int
    recordsFailed: int
    frequency: str


class SyncHistoryEntry(BaseModel):
    id: str
    source: str
    started: str
    completed: Optional[str] = None
    records: int
    success: int
    failed: int
    status: str


class SyncTriggerRequest(BaseModel):
    source: str = "ALL"


class SyncTriggerResponse(BaseModel):
    updatedSources: List[SourceStatus]
    historyItem: SyncHistoryEntry


# ---------------------------------------------------------------------------
# Data quality & NLP text-extraction pipeline
# ---------------------------------------------------------------------------
class ParsedAttributes(BaseModel):
    department: str
    defectType: str
    location: str
    severity: str
    confidenceScore: str


class UnstructuredSample(BaseModel):
    id: str
    source: str
    rawText: str
    parsingStatus: str
    parsed: ParsedAttributes


class DataQualityMetrics(BaseModel):
    totalRawRecords: int
    cleanRecords: int
    duplicateRecords: int
    outliers: int
    parsedRecords: int
    recordsRequiringReview: int
    sampleUnstructured: List[UnstructuredSample]


class ParseTextRequest(BaseModel):
    text: str


class ParsedDefectResponse(BaseModel):
    department: str
    defectType: str
    location: str
    severity: str
    confidenceScore: str
    parsingStatus: str = "AI Parsed"
    duplicateStatus: str = "Unique"


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------
class Notification(BaseModel):
    id: str
    type: str
    title: str
    message: str
    timestamp: str
    unread: bool
    actionUrl: str
    category: str
    relatedId: Optional[str] = None


# ---------------------------------------------------------------------------
# Machine Learning Optimization & Predictive Intelligence
# ---------------------------------------------------------------------------
class MLTaskPrediction(BaseModel):
    taskId: str
    department: str
    corridor: str
    requestedDurationHours: float
    predictedDurationHours: float
    overrunRiskPercent: float
    riskLevel: str
    confidenceScore: str
    recommendedBufferMinutes: int
    riskDrivers: List[str] = Field(default_factory=list)


class MLDurationBatchRequest(BaseModel):
    taskIds: Optional[List[str]] = None
    weatherFactor: Optional[str] = "Clear"
    nightShift: Optional[bool] = True
    trackComplexityMultiplier: Optional[float] = 1.0


class MLDurationBatchResponse(BaseModel):
    predictions: List[MLTaskPrediction]
    highRiskCount: int
    averageOverrunRiskPercent: float
    totalBufferRecommendedMinutes: int
    generatedAt: str


class MLBundleSynergy(BaseModel):
    bundleId: str
    corridor: str
    date: str
    departments: List[str]
    taskIds: List[str]
    synergyScorePercent: float
    savedHours: float
    safetyIndex: float
    compatibilityReason: str


class MLRiskAssessmentRequest(BaseModel):
    corridor: str
    date: str
    startTime: str
    durationHours: float
    departments: List[str]


class MLRiskAssessmentResponse(BaseModel):
    punctualityScorePercent: float
    passengerTrainDelayRiskMinutes: float
    freightHoldingEstimatedMinutes: float
    riskCategory: str
    recommendedAdjustment: Optional[str] = None


class MLInsightsSummary(BaseModel):
    totalAnalyzedTasks: int
    averageDurationAccuracy: str
    predictedDowntimeReductionPercent: float
    topRiskCorridors: List[str]
    highSynergyCombinations: List[dict]
    modelEngine: str = "Hybrid Gradient-Boosted + MCDM Multi-Agent Solver"