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
│ ├─ deploy-parties.sh
│ └─ load-sample.sh
├─ docs/
│ ├─ architecture-diagram.png
│ └─ sequence-example.png
└─ README.md
```

---

## Quick Start

1. **Launch Canton (daemon mode)**  
   Use your downloaded Canton image (or local install) to expose the ledger on ports `5011/5012`. Example:
   ```bash
   docker run --rm --platform linux/amd64 \
     -p 5011:5011 -p 5012:5012 \
     -v "$(pwd)/scripts/canton:/config" \
     --entrypoint /canton/bin/canton \
     digitalasset/canton-community:<tag> \
     daemon --config /config/domain.conf
   ```

2. **Start the DAML JSON API**  
   Download `http-json-2.8.0.jar` from the DAML releases and run:
   ```bash
   java -jar http-json-2.8.0.jar \
     --ledger-host localhost \
     --ledger-port 5011 \
     --http-port 7575 \
     --allow-insecure-tokens
   ```

3. **Allocate parties + JWTs**  
   ```bash
   /opt/homebrew/bin/bash ./scripts/deploy-parties.sh
   ```
   This updates `ui/.env.local` with `Supplier_A`, `Buyer_B`, `Financier_F`, and `Custodian_C` tokens.

4. **Build the DAR & capture the package ID**  
   ```bash
   cd daml
   daml build
   dar=.daml/dist/arche-invoice-financing-0.1.0.dar
   package_id=$(daml damlc inspect-dar "$dar" | grep -m1 arche-invoice-financing | grep -o '[0-9a-f]\{64\}')
   ```
   Set `VITE_DAML_PACKAGE_ID=<package_id>` in `ui/.env.local`.

5. **(Optional) load sample data**  
   ```bash
   ./scripts/load-sample.sh
   ```

6. **Run the UI**  
   ```bash
   cd ui
   npm install
   npm run dev
   ```

Visit http://localhost:5173 to walk the Supplier → Buyer → Financier flow (the Vite dev server proxies `/v1` to the JSON API, so there are no CORS issues).

---

## Prerequisites

- DAML SDK / `daml` CLI (2.8.0 tooling for building the DAR)
- Canton Community distribution (Docker image or local install)
- Java 11+ (for the JSON API jar)
- Node.js 18+
- Bash 4 (macOS users can install via Homebrew for `deploy-parties.sh`)

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
