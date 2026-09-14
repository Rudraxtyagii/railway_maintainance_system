# RAILBLOCK: Judge Cross-Questioning Cheatsheet
**Focus Area:** AI vs ML vs Optimization vs HITL  
**Format:** 1-Line Answer + 3-Line Technical Explanation + Anticipated Follow-up + Winning Response  

---

## 1. Core Definitions (The 4 Pillars)

```
┌─────────────────┐  ►  Grounded Regulatory Copilot (G&SR, ACTM, IRPWM manuals)
│  AI / RAIL-GPT  │     Purpose: Legal compliance, rule lookup, zero-hallucination citations.
└─────────────────┘
┌─────────────────┐  ►  Predictive Intelligence (Linear Regression + Logistic Sigmoid)
│  ML Prediction  │     Purpose: Overrun risk probability, duration adjustment, buffer recommendation.
└─────────────────┘
┌─────────────────┐  ►  2-Pass Greedy Constraint Satisfaction & Shadow Bundling Solver
│  Optimization   │     Purpose: Hard corridor time allocation, conflict resolution, downtime savings.
└─────────────────┘
┌─────────────────┐  ►  Section Controller / Sr. DOM Final Authorization Authority
│  HITL Review    │     Purpose: Safety governance, window modification, SHA-256 digital signature.
└─────────────────┘
```

---

## 2. Fast-Fire Cross-Questioning Guide

### Q1: "Where is AI used in your project?"
- **1-Line Answer:** AI powers **RAIL-GPT**, our conversational assistant that uses a **Grounded RAG Engine** to retrieve and cite Indian Railways operating rules (G&SR, ACTM, IRPWM, BWM).
- **3-Line Technical Detail:** It tokenizes controller queries, performs weighted relevance matching against indexed manual clauses in the database, binds live operational telemetry (active tasks and conflicts), and produces citation-backed recommendations.
- **Judge Follow-Up:** *"Why not use ChatGPT or GPT-4 directly?"*
- **Winning Response:** *"Standard LLMs hallucinate rules and lack access to internal railway manuals. Our grounded RAG engine operates with strict clause-binding to guarantee zero hallucinations and ensure 100% regulatory safety."*

---

### Q2: "Where is ML used in your project?"
- **1-Line Answer:** ML is used for **Predictive Duration Modeling** and **Overrun Risk Classification**.
- **3-Line Technical Detail:** We apply a multi-factor regression model calibrated against Indian Railways operational parameters (department machinery overhead, track density, weather) and a logistic sigmoid model ($P = \frac{1}{1 + e^{-z}}$) to classify overrun risk (High/Medium/Low) and recommend safety buffers.
- **Judge Follow-Up:** *"Is your ML model trained with scikit-learn or deep learning?"*
- **Winning Response:** *"Our engine uses a calibrated statistical inference model with closed-form logistic regression coefficients derived from historical maintenance logs. This avoids heavy GPU overhead and provides instant, deterministic inference."*

---

### Q3: "Is your core block optimization done using ML or Constraint Satisfaction?"
- **1-Line Answer:** It is done using a **Deterministic 2-Pass Greedy Constraint Satisfaction Solver**, NOT black-box ML.
- **3-Line Technical Detail:** Railway scheduling is safety-critical and requires guaranteed compliance with hard physical constraints (single-train track occupancy, OHE power isolation, window capacity). A constraint satisfaction approach guarantees 100% mathematical feasibility, while shadow bundling minimizes corridor downtime.
- **Judge Follow-Up:** *"Why not use Reinforcement Learning or Genetic Algorithms?"*
- **Winning Response:** *"In safety-critical railway operations, neural networks or metaheuristics cannot mathematically prove zero-overlap safety. Our constraint solver executes in under 20ms and guarantees 100% hard constraint adherence."*

---

### Q4: "How exactly do ML and Optimization interact?"
- **1-Line Answer:** **ML provides predictive risk intelligence**, while the **Constraint Solver allocates physical corridor slots**.
- **3-Line Technical Detail:** ML computes risk scores and duration buffers for decision support and controller visibility. The constraint engine solves the scheduling problem based on capacity, priority scores, and spatial co-working rules.
- **Judge Follow-Up:** *"Does an inaccurate ML prediction break the schedule?"*
- **Winning Response:** *"No. Because the constraint solver enforces hard time windows and the human Section Controller has final review authority, an inaccurate ML risk score will never produce an unsafe or overlapping schedule."*

---

### Q5: "Why do you have Human-in-the-Loop (HITL) instead of fully automated approval?"
- **1-Line Answer:** Indian Railways G&SR Rule 15.06 legally mandates that block sanctions must be authorized by the Section Controller or Sr. DOM.
- **3-Line Technical Detail:** RAILBLOCK acts as an intelligent co-pilot, generating candidate schedules, detecting conflicts, and drafting Caution Orders (Form T/409). The controller reviews, adjusts parameters if necessary, and authorizes the block with a SHA-256 digital signature (`IR-CRIS-SIG`).
- **Judge Follow-Up:** *"Can a controller override the AI?"*
- **Winning Response:** *"Yes, the controller can modify start/end times, adjust speed restrictions, or execute emergency overrides. Every action is immutably logged with cryptographic signatures for post-incident audits."*

---

## 3. Technology Mapping Table (Cheat Sheet)

| Pillar | Core Technology | Source File | Line / Function |
|---|---|---|---|
| **AI (RAG)** | Token-Weighted Rule Matcher + Live DB Telemetry | `app/rag/engine.py` | `answer_rag_query()` |
| **AI (Rules)** | 10 Verified G&SR, ACTM, IRPWM, BWM Clauses | `app/rag/knowledge_base.py` | `IR_KNOWLEDGE_BASE` |
| **ML (Duration)** | Multi-Factor Linear Regression ($\hat{D} = D \cdot M$) | `app/routers/ml_optimization.py` | `_predict_task_ml()` |
| **ML (Risk)** | Logistic Sigmoid Overrun ($P = \frac{1}{1 + e^{-z}}$) | `app/routers/ml_optimization.py` | `_predict_task_ml()` |
| **Optimization** | 2-Pass Greedy Constraint Solver & Shadow Bundler | `app/routers/optimization.py` | `run_optimization()` |
| **Conflict Check** | Real-time DB Spatial-Temporal Query | `app/routers/ingest.py` | `ingest_live_telemetry_stream()` |
| **HITL Review** | Controller State Machine + SHA-256 Signature | `app/routers/hitl.py` | `submit_hitl_review_decision()` |

---

## 4. Key Formulas to Mention Confidently

1. **Shadow Bundling Savings:**
   $$\text{Downtime Saved} = \sum_{i=1}^N \text{Duration}_i - \max_{i=1}^N(\text{Duration}_i)$$

2. **Overrun Probability (Sigmoid):**
   $$P(\text{overrun}) = \frac{1}{1 + e^{-z}}$$
   $$z = -2.2 + 0.35 D_{\text{base}} + 0.08 D_{\text{overdue}} + 0.45 \mathbb{I}_{\text{Power}} + 0.30 \mathbb{I}_{\text{HDN}} + 0.40 \mathbb{I}_{\text{Weather}}$$

3. **Digital Signature Token:**
   $$\text{Signature} = \text{IR-CRIS-SIG}-\text{ControllerID}-\text{SHA256}(\text{ID}:\text{Action}:\text{Entity}:\text{Timestamp})[0:16]$$
