# AuthentiQ — AI-Based Identity Assurance & Adaptive Verification System

**Smart India Hackathon 2026 • Blockchain & Cybersecurity Track**  
*Phase 1 Prototype: Frontend Architecture & Decision-Support Foundation*

> **SYNTHETIC DEMO ENVIRONMENT NOTICE**: All names, identification numbers, biometrics, addresses, and hashes in this prototype are synthetic, fictional demonstration records created strictly for hackathon evaluation and technical review. Not for operational use.

---

## 1. Overview & Core Philosophy

AuthentiQ is an **AI-assisted decision-support platform** for high-assurance identity verification. It is fundamentally distinct from simple "fake document detectors":

1. **Decoupled Risk & Confidence**:
   - **Fraud Risk (0–100)**: Evaluates active deception, forgery markers, and biometric discrepancies.
   - **Evidence Confidence (0–100)**: Evaluates corroboration completeness across independent streams.
   - *Low evidence confidence does NOT imply high fraud risk.*
2. **Strict Evidence State Semantics**:
   - `Positive`, `Negative`, `Uncertain`, `Unavailable`, `Informational`.
   - *Unavailable does NOT visually or logically mean negative* (e.g., an external database timeout adds +0 to fraud risk).
3. **Transparent Decision Engine (`src/services/riskEngine.ts`)**:
   - Implements deterministic, explainable priority rules:
     - `Confidence < 50` $\rightarrow$ **INCONCLUSIVE**
     - `Fraud Risk > 50` $\rightarrow$ **OFFICER REVIEW**
     - `Fraud Risk < 25 AND Confidence < 85` $\rightarrow$ **TARGETED VERIFICATION**
     - `Else` $\rightarrow$ **NORMAL PROCESSING**
4. **Functional Identity Graph (`/identity-graph`)**:
   - Interactive topological canvas showing entity relationships (`Person` $\rightarrow$ `associated with` $\rightarrow$ `Identity A` $\rightarrow$ `verified by` $\rightarrow$ `Document A`; `Identity A` $\rightarrow$ `potentially linked` $\rightarrow$ `Identity B` $\rightarrow$ `appears in` $\rightarrow$ `Related Record B`).
   - Relationship Evidence side panel with objective terminology (strictly no "Fraud Ring" conclusions).
5. **Tamper-Evident Prototype Audit Log (`/audit`)**:
   - Cryptographic SHA-256 block-chained event stream maintaining non-repudiation.
   - Privacy-preserving architecture: raw identity and biometric data are never stored on-ledger.
6. **Officer-in-the-Loop Governance**:
   - The AI generates **AI Recommendations**; final authority remains strictly with the **Authorized Officer Final Decision**.

---

## 2. Technology Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 (Cybersecurity Dark Slate/Navy Palette)
- **Routing**: React Router v7 (`react-router-dom`)
- **Icons**: Lucide React
- **Architecture**: Modular and decoupled, prepared for direct FastAPI backend integration in Phase 2

---

## 3. Application Structure & Routes

```
src/
├── components/
│   ├── common/
│   │   ├── MetricCard.tsx          # Stat card with synthetic data badges
│   │   ├── StatusBadge.tsx         # Semantic badges (Unavailable != Negative)
│   │   ├── RiskIndicator.tsx       # Fraud Risk meter (0-100)
│   │   ├── ConfidenceIndicator.tsx # Evidence Confidence gauge (0-100)
│   │   └── AlertCard.tsx           # Operational and security alerts
│   ├── verification/
│   │   ├── EvidenceCard.tsx        # 4 Evidence categories with signals
│   │   ├── VerificationTable.tsx   # Searchable/filterable verification queue
│   │   ├── ExplainableFindings.tsx # AI rationale breakdown
│   │   ├── WhyFactorsModal.tsx     # Interactive "Why? / View Factors" modal
│   │   ├── AdaptiveVerificationCard.tsx # Recommended action & officer review modal
│   │   └── IdentityRelationshipPreview.tsx # Preview widget with graph link
│   ├── graph/
│   │   ├── IdentityGraphView.tsx   # Interactive SVG drag/pan/zoom canvas
│   │   └── RelationshipPanel.tsx   # Relationship Evidence side inspector
│   └── audit/
│       └── AuditTable.tsx          # Tamper-evident SHA-256 chained ledger
├── data/
│   ├── mockVerifications.ts        # Synthetic verification dossier records
│   ├── mockIdentityGraph.ts        # Fictional multi-entity relationship graph
│   ├── mockAuditEvents.ts          # Tamper-evident ledger event blocks
│   └── mockAlerts.ts               # Operational & security alerts
├── layouts/
│   ├── MainLayout.tsx              # Shell with synthetic banner & responsive grid
│   ├── Header.tsx                  # Brand, system status, officer profile
│   └── Sidebar.tsx                 # Navigation & prototype versioning
├── pages/
│   ├── DashboardPage.tsx           # Route: /
│   ├── NewVerificationPage.tsx     # Route: /verification/new
│   ├── VerificationResultPage.tsx  # Route: /verification/:id
│   ├── IdentityGraphPage.tsx       # Route: /identity-graph
│   └── AuditPage.tsx               # Route: /audit
├── services/
│   └── riskEngine.ts               # Transparent Decision Engine logic
├── types/                          # Complete TypeScript interfaces
└── utils/                          # Formatters, SHA-256 hashing, crypto
```

---

## 4. How to Run

### Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 5. Phase 2 Roadmap: FastAPI & Blockchain Integration

1. **Python FastAPI Backend**:
   - Direct replacement of `src/services/riskEngine.ts` with API endpoints (`/api/v1/verification/evaluate`).
   - Deep learning microservices for optical security verification and facial vector embeddings.
2. **Permissioned Blockchain**:
   - Integration with Hyperledger Fabric / Ethereum private testnet to anchor SHA-256 audit hashes.
3. **Multi-Party Civil Gateway Connectors**:
   - Fault-tolerant async connectors with circuit breakers for government identity registries.
