# Arche — Deterministic Invoice Financing (Canton + DAML)

Arche turns paper invoices into **programmable, auditable assets** on the Canton Network.  
This MVP demonstrates how a supplier can issue an invoice, a buyer can confirm it, a financier can advance funds, and the settlement is executed deterministically and privately on-ledger.

Arche is built with:

- **DAML** — rights-based, deterministic contract modeling  
- **Canton Network** — multi-party, privacy-preserving ledger  
- **React + Vite + TypeScript** — simple UI for demoing flows  
- **DAML JSON API** — to interact with on-ledger contracts

---

## Overview

Traditional trade finance relies on emails, PDFs, and fragmented databases.  
This creates slow settlement, costly reconciliation, and frequent fraud such as **double financing**.

Arche replaces this with a deterministic workflow where suppliers, buyers, financiers, and custodians share verifiable contract states without exposing private data.

The MVP shows:

1. Supplier issues an invoice  
2. Buyer confirms  
3. Financier provides funding  
4. Custodian marks pledge  
5. Buyer pays  
6. Financier receives settlement automatically  

---

## Tech Stack

- **Ledger/Runtime:** Canton (local dev)  
- **Language:** DAML  
- **Frontend:** React + Vite + TypeScript  
- **API Layer:** DAML JSON API  
- **Scripts:** Docker / Bash for environment setup  

---

## Repository Structure
```
Arche-Invoice-Financing/
├─ daml/
│ ├─ Arche.daml
│ ├─ Arche.Pledge.daml
│ └─ daml.yaml
├─ ui/
│ ├─ src/
│ │ ├─ pages/
│ │ │ ├─ Supplier.tsx
│ │ │ ├─ Buyer.tsx
│ │ │ └─ Financier.tsx
│ │ ├─ components/
│ │ │ ├─ Timeline.tsx
│ │ │ └── ContractTable.tsx
│ │ └─ lib/damlClient.ts
│ └─ index.html
├─ scripts/
│ ├─ start-canton.sh
│ ├─ deploy-parties.sh
│ └─ load-sample.sh
├─ docs/
│ ├─ architecture-diagram.png
│ └─ sequence-example.png
└─ README.md
```

---

## Quick Start

### 1. Start Canton + JSON API
```bash
./scripts/start-canton.sh
./scripts/deploy-parties.sh
```

### 2. Load sample receivable (optional)
```bash
./scripts/load-sample.sh
```

### 3. Run the UI
```bash
cd ui
cp env.example .env.local   # update packageId + JWTs if needed
npm install
npm run dev
```

Visit http://localhost:5173 to walk the Supplier → Buyer → Financier flow.

---

## Prerequisites

- DAML SDK 2.8.0+
- Docker Desktop (for Canton + JSON API)
- Node.js 18+

---

## Development Workflow

1. `daml build` – compiles the contracts in `daml/src`
2. `npm run dev` (inside `ui/`) – starts the React console
3. Iterate on DAML → rebuild → refresh the UI; JSON API streams the latest state

Run the included DAML scripts/tests:
```bash
cd daml
daml test
```

---

## Project Deliverables

- `daml/src` – Receivable, Financing, and Pledge templates plus tests
- `scripts/` – helper scripts for Canton, party deployment, and sample data
- `ui/` – Vite + React interface with Supplier/Buyer/Financier workspaces
- `docs/` – placeholder architecture + sequence diagrams

See `spec.md` for the authoritative product scope.
