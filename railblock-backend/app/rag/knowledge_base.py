"""
Indian Railways Official Regulatory & Operational Knowledge Repository (RAG Ground Truth)
Covers verified clauses from:
1. General & Subsidiary Rules (G&SR) - Chapter XVII (Working of Trains on Electrified Sections), Rule 17.03 (PTW & 25kV OHE clearance), Rule 4.08 (Caution Orders), Rule 15.06 (Track maintenance under traffic block).
2. AC Traction Manual (ACTM Vol II) - 25kV Traction Power Isolation & Earthing Protocols.
3. Indian Railways Permanent Way Manual (IRPWM) - Track geometry, Deep screening, BCM/CSM tamping, Speed relaxation.
4. Block Working Manual (BWM) - Single/Double line block instruments, Shadow block bundling, Burst recovery.
5. Rolling Block Programme Guidelines (2024) - 52-week corridor planning, advance requisition, cross-departmental bundling.
"""

IR_KNOWLEDGE_BASE = [
    {
        "id": "GSR-17-03",
        "manual_name": "G&SR",
        "chapter": "Chapter XVII: Working of Trains on Electrified Sections",
        "rule_number": "Rule 17.03",
        "title": "Permit to Work (PTW) & 25kV OHE Minimum Safe Distance",
        "content": (
            "Under G&SR Rule 17.03, no person, track maintenance machine (BCM, CSM, UNIMAT), "
            "or crane shall work within a distance of 2.0 meters from any live 25kV 50Hz AC overhead equipment (OHE) "
            "unless an official Permit to Work (PTW) has been issued by the Traction Power Controller (TPC) "
            "and confirmed by the Section Engineer (TRD). The section must be isolated, de-energized, and earthed."
        ),
        "tags": ["G&SR", "PTW", "OHE", "Safety", "25kV", "Electrical", "Clearance"]
    },
    {
        "id": "GSR-17-05",
        "manual_name": "G&SR",
        "chapter": "Chapter XVII: Working of Trains on Electrified Sections",
        "rule_number": "Rule 17.05",
        "title": "Earthing Sequence and Discharge Rods Placement",
        "content": (
            "Under G&SR Rule 17.05, after the Traction Power Controller (TPC) has isolated the OHE sub-sector, "
            "the TRD supervisor must affix standard discharge rods with approved copper bonding cables to both "
            "the UP-line and DN-line boundaries of the work zone before issuing PTW to Civil or S&T staff. "
            "The distance between two consecutive discharge rods must not exceed 1000 meters in a continuous work zone."
        ),
        "tags": ["G&SR", "Earthing", "Discharge Rod", "OHE", "Safety", "TRD"]
    },
    {
        "id": "GSR-17-08",
        "manual_name": "G&SR",
        "chapter": "Chapter XVII: Working of Trains on Electrified Sections",
        "rule_number": "Rule 17.08",
        "title": "Co-Working Rules for Track Machines under De-Energized OHE",
        "content": (
            "G&SR Rule 17.08 permits heavy on-track diesel machines (Ballast Cleaning Machines, Track Relaying Trains) "
            "to operate concurrently with OHE maintenance wagons (Tower Wagons) inside the same corridor section "
            "provided that: (a) Continuous metallic bonding is verified by the Section Engineer (TRD); "
            "(b) A longitudinal safety separation buffer of at least 150 meters is strictly maintained between machines; "
            "(c) A combined shadow block is sanctioned by the Chief Controller / Sr. DOM."
        ),
        "tags": ["G&SR", "Co-working", "Track Machines", "Tower Wagon", "Shadow Block", "Bundling"]
    },
    {
        "id": "GSR-04-08",
        "manual_name": "G&SR",
        "chapter": "Chapter IV: General Rules for Working Trains",
        "rule_number": "Rule 4.08",
        "title": "Caution Orders & Speed Restrictions at Block Boundaries",
        "content": (
            "Under G&SR Rule 4.08, whenever a maintenance block involves track opening, turnout renewal, or deep screening, "
            "the Station Master of the block stations on either end must issue a Caution Order (Form T/409) to the Loco Pilot "
            "and Guard of every approaching train, specifying the exact kilometerage and restricted speed (e.g. 20 kmph or 30 kmph) "
            "until formal track certification (Form T/1518) is handed over by the Permanent Way Inspector (SSE/P.Way)."
        ),
        "tags": ["G&SR", "Caution Order", "Speed Restriction", "Form T409", "Station Master"]
    },
    {
        "id": "GSR-15-06",
        "manual_name": "G&SR",
        "chapter": "Chapter XV: Permanent Way and Works",
        "rule_number": "Rule 15.06",
        "title": "Sanction and Execution of Traffic Blocks",
        "content": (
            "Under G&SR Rule 15.06, no engineering work that interferes with the safe transit of trains or requires "
            "disconnection of points, locks, or signals shall be commenced without the prior sanction of the Senior Divisional "
            "Operating Manager (Sr. DOM) or Chief Section Controller. Traffic blocks must be requisitioned with designated start time, "
            "duration, affected lines, and required speed restrictions."
        ),
        "tags": ["G&SR", "Traffic Block", "Sanction", "Sr DOM", "PWay"]
    },
    {
        "id": "ACTM-VOL2-SEC4",
        "manual_name": "ACTM_VOL_II",
        "chapter": "Chapter IV: Power Blocks and Isolation",
        "rule_number": "Section 4.2",
        "title": "Power Block Classification (Emergency, Planned, Shadow)",
        "content": (
            "According to the AC Traction Manual (ACTM Vol II, Section 4.2), power blocks are categorized into: "
            "(1) Emergency Power Block: Granted immediately on telegraphic/radio notice of OHE breakdown or danger to life; "
            "(2) Planned Power Block: Pre-scheduled in the 52-week rolling block calendar during lean non-suburban night windows; "
            "(3) Shadow Power Block: Granted concurrently when a Traffic Block is sanctioned for Civil or S&T engineering works, "
            "maximizing corridor utilization without causing independent traction train detentions."
        ),
        "tags": ["ACTM", "Power Block", "Shadow Block", "Emergency", "TRD", "Traction"]
    },
    {
        "id": "IRPWM-PARA-238",
        "manual_name": "IRPWM",
        "chapter": "Chapter II: Track Maintenance Protocols",
        "rule_number": "Para 238",
        "title": "Deep Screening and Ballast Cleaning Tolerances",
        "content": (
            "According to Indian Railways Permanent Way Manual (IRPWM Para 238), deep screening using Ballast Cleaning Machines (BCM) "
            "requires a minimum continuous block duration of 3.0 to 4.0 hours for economical output (>200 meters/hour). "
            "After deep screening, track must be packed with a Hydraulic Tamping Machine (CSM/Duomatic) and boxed before passing "
            "the first train at a restricted speed of 20 kmph."
        ),
        "tags": ["IRPWM", "Deep Screening", "BCM", "Tamping", "Track Maintenance", "Civil"]
    },
    {
        "id": "IRPWM-PARA-308",
        "manual_name": "IRPWM",
        "chapter": "Chapter III: Post-Maintenance Speed Relaxation Schedule",
        "rule_number": "Para 308",
        "title": "Speed Relaxation Schedule Following Heavy Track Machine Work",
        "content": (
            "Under IRPWM Para 308, the standard speed relaxation schedule following mechanized deep screening and tamping is: "
            "Day 1: 20 kmph (after initial packing); Day 2: 45 kmph (after second tamping run); Day 3: 75 kmph; "
            "Day 4: Normal sectional speed (130 kmph or 160 kmph) upon achieving Track Quality Index (TQI) < 32."
        ),
        "tags": ["IRPWM", "Speed Relaxation", "TQI", "Track Quality", "PWay"]
    },
    {
        "id": "BWM-SEC-8",
        "manual_name": "BWM",
        "chapter": "Section 8: Single and Double Line Tokenless Block Working",
        "rule_number": "Rule 8.14",
        "title": "Shadow Bundling and Train Separation Inside Block Section",
        "content": (
            "Under Block Working Manual (BWM Rule 8.14), multiple departmental maintenance units (P.Way, TRD, S&T) "
            "may occupy the same absolute block section under a single Unified Corridor Shadow Block. "
            "The Station Master must enter the block memo in the Train Register and set the Block Instrument to 'Line Closed / Blocked'. "
            "Neither unit shall clear the section until all departmental supervisors have surrendered their respective memo slips."
        ),
        "tags": ["BWM", "Block Working", "Shadow Bundling", "Station Master", "Train Register"]
    },
    {
        "id": "ROLLING-BLOCK-2024",
        "manual_name": "ROLLING_BLOCK_2024",
        "chapter": "Ministry of Railways Rolling Block Programme (2024)",
        "rule_number": "Clause 3.1",
        "title": "52-Week Rolling Corridor Windows & Integrated Mega Block Norms",
        "content": (
            "As per Railway Board Directive (2024) on Rolling Block Planning: (1) All Zonal Railways shall publish a 52-week "
            "rolling corridor window calendar; (2) Departmental requests (Engineering, S&T, TRD) must be consolidated into integrated "
            "mega-blocks during night non-suburban gaps (01:30 - 04:30 hrs); (3) Bundling compliance must exceed 80% to eliminate "
            "isolated daytime speed restrictions and preserve 95%+ Rajdhani and Vande Bharat passenger punctuality."
        ),
        "tags": ["Rolling Block", "Railway Board", "Night Corridor", "Punctuality", "Vande Bharat", "Mega Block"]
    }
]
