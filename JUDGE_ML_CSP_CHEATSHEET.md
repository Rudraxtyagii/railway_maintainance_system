# RAILBLOCK v3.0: Judge & Evaluator ML-CSP Cheat Sheet

**Key Focus:** Quick, high-impact technical answers for hackathon judges, technical evaluators, and system auditors.

---

### Q1. What is the role of Machine Learning in RAILBLOCK?
**Answer:**
ML functions exclusively as a **predictive intelligence layer**. It predicts operational variables such as execution duration, overrun risk probability, multi-department synergy compatibility, and recommended safety buffers before scheduling occurs.

---

### Q2. What is the role of CSP (Constraint Satisfaction Problem)?
**Answer:**
CSP is the **deterministic decision and scheduling authority**. It takes maintenance requests, available corridor timetable windows, and physical track boundaries, and computes a feasible, conflict-free schedule by strictly enforcing hard railway rules.

---

### Q3. What exact outputs does ML provide to the optimizer?
**Answer:**
1. **`predictedDurationHours`**: Estimated actual execution duration accounting for machinery mobilization, weather, and department complexity.
2. **`overrunRiskPercent`**: Sigmoid probability of the block exceeding its requested duration.
3. **`recommendedBufferMinutes`**: Recommended safety margin (+10m, +15m, or +30m).
4. **`planningDurationHours`**: Derived planning duration ($=\text{predicted} + \frac{\text{buffer}}{60}$) used for window fitting.

---

### Q4. What are the Hard Operational Constraints enforced by the CSP?
**Answer:**
Hard constraints **cannot be compromised under any circumstances**:
- **Corridor Match:** A block requisition for NDLS-GZB cannot be assigned to BCT-ST.
- **Date Boundary:** Blocks must align with the requested date or registered corridor window.
- **Physical Capacity Limit:** Block duration cannot exceed available corridor window duration ($\le 4.0\text{h}$).
- **Traction & Traffic Isolation:** 25kV OHE power shutoff and Permit-to-Work (PTW) rules are strictly aggregated.
- **Spatial Clash Prevention:** Incompatible overlapping track occupations are eliminated.

---

### Q5. What are the Soft Optimization Factors influenced by ML?
**Answer:**
Soft factors affect **preference ranking among feasible candidates**, but never create an invalid schedule:
- **Composite Priority Score:** `effectiveScore = priorityScore + (overrunRiskPercent * 0.1)` (schedules urgent and high-overrun-risk maintenance into early night windows).
- **Dynamic Safety Buffer Allocation:** Extends planning duration to accommodate buffer when corridor window capacity allows.

---

### Q6. Can ML ever override a railway safety or operational constraint?
**Answer:**
**NO. Mathematically and architecturally impossible.** The CSP feasibility solver evaluates hard physical constraints *after* receiving ML parameters. If a task violates a hard constraint (e.g. requires 5 hours in a 3-hour window), it is rejected regardless of what ML predicted.

---

### Q7. What happens if the ML prediction engine fails or goes offline?
**Answer:**
The system features **Graceful Deterministic Fallback**:
- Catches the exception and logs a warning.
- Immediately reverts to deterministic raw parameters (`planningDurationHours = requestedDurationHours`, `overrunRisk = 0.0`, `mlAssisted = False`).
- The 2-Pass Greedy CSP solver continues execution with 100% reliability and zero downtime.

---

### Q8. Does ML generate the final schedule directly?
**Answer:**
**NO.** ML does not place blocks on the timetable grid. Scheduling is performed by the 2-Pass Greedy Constraint Satisfaction Solver and Shadow Block Bundler.

---

### Q9. Who makes the final operational decision to execute a block?
**Answer:**
The **Human Section Controller (HITL)**. Under Indian Railways General & Subsidiary Rules (G&SR), the AI/ML system is a decision-support tool. All synthesized schedules require controller review and are authorized with **cryptographic digital signatures (`IR-CRIS-SIG`)**.

---

### Q10. Why is this hybrid ML + CSP architecture superior to pure End-to-End Deep Learning?
**Answer:**
1. **100% Mathematical Safety Guarantee:** Pure neural networks are probabilistic and cannot guarantee zero constraint violations; CSP guarantees 100% compliance.
2. **Deterministic & Explainable:** Every schedule assignment provides an exact constraint checklist and decision rationale.
3. **Sub-second Execution:** In-memory 2-pass CSP executes in under 20 milliseconds, compared to minutes for heavy neural models.

---

### Summary Diagram for Presentation:

```
[ Maintenance Demand ]
          ↓
[ ML Predictive Layer ]   --> Predicts Duration, Overrun Risk %, Buffer Minutes
          ↓
[ 2-Pass CSP Solver ]     --> Enforces 100% Hard Safety & Corridor Constraints
          ↓
[ Feasible Schedule ]     --> Bundled, Conflict-Free Timetable Recommendation
          ↓
[ Human Controller HITL]  --> Final Authorization & Digital Cryptographic Signature
```
