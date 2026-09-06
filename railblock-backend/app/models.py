from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Auth
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


class LoginResponse(BaseModel):
    token: str
    user: UserOut


# ---------------------------------------------------------------------------
# Tasks (departmental maintenance block requests)
# ---------------------------------------------------------------------------
class Task(BaseModel):
    id: str
    source: str = "MANUAL"
    department: str
    description: str
    location: str
    corridor: str
    defectType: str
    severity: str
    severityWeight: int
    overdueDays: int
    priorityScore: int
    status: str = "Pending"
    requestedDate: str
    preferredWindow: str
    durationHours: float
    requiresPowerBlock: bool = False
    requiresTrafficBlock: bool = True
    speedRestrictionKmph: Optional[int] = None
    createdAt: str


class TaskCreate(BaseModel):
    department: str
    description: str
    location: str
    corridor: str
    defectType: Optional[str] = "Track Geometry / Ballast Deficiency"
    severity: Optional[str] = "High"
    durationHours: Optional[float] = 2.5
    preferredDate: Optional[str] = None
    requestedDate: Optional[str] = None
    preferredWindow: Optional[str] = "01:30 - 04:30"
    overdueDays: Optional[int] = 0
    requiresTrafficBlock: Optional[bool] = True
    requiresPowerBlock: Optional[bool] = False
    speedRestrictionKmph: Optional[int] = 30
    notes: Optional[str] = None


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
    
# class OptimizationResponse(BaseModel):
#     ...
#     scheduledBlocks: List[ScheduledBlock]
#     bundles: List[Bundle] = Field(default_factory=list)   # <-- add this line
#     status: str = "SUCCESS"

# ---------------------------------------------------------------------------
# Optimization engine
# ---------------------------------------------------------------------------
# class DateRange(BaseModel):
#     start: str
#     end: str


# class OptimizationRequest(BaseModel):
#     corridors: List[str]
#     dateRange: DateRange
#     maxBlockDurationHours: float = 4.0
#     safetyBufferMinutes: int = 15
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


class OptimizationResponse(BaseModel):
    optimizationId: str
    engine: str = "Greedy Constraint Satisfaction + Shadow Bundling Solver (v2.4)"
    executionTimeMs: int
    timestamp: str
    summary: OptimizationSummary
    scheduledBlocks: List[ScheduledBlock]
    bundles: List[Bundle] = Field(default_factory=list)
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