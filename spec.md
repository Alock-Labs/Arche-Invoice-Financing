# Arche Implementation Specification

This document defines how to implement the Arche MVP on Canton Network using DAML, the JSON API, and a React/Vite frontend.

---

# 1. MVP Scope

Implement a minimal, deterministic workflow:

1. Supplier creates invoice  
2. Buyer confirms invoice  
3. Financier finances the receivable  
4. Custodian marks the receivable as pledged  
5. Buyer settles payment at maturity  
6. Financier receives repayment  
7. Pledge registry is cleared  

Focus on correctness, determinism, and privacy — not UI polish.

---

# 2. Domain & Party Setup

For MVP, run **one Canton domain** with four parties:

- `Supplier_A`
- `Buyer_B`
- `Financier_F`
- `Custodian_C`

Scripts:

- `start-canton.sh` — starts Canton + JSON API  
- `deploy-parties.sh` — allocates parties, writes to `.env`  
- `load-sample.sh` — optional example invoice

---

# 3. DAML Contract Templates

## 3.1 `ReceivableAsset`

Represents an invoice created by Supplier.

**Fields**
- receivableId : Text  
- supplier : Party  
- buyer : Party  
- amount : Decimal  
- currency : Text  
- dueDate : Date  

**Visibility**
- signatory supplier
- observer buyer

**Choice: Confirm** (controller buyer)
- archives original  
- creates `ConfirmedReceivable`

---

## 3.2 `ConfirmedReceivable`

Represents buyer-acknowledged receivable.

**Choice: Finance** (controller financier)
- checks pledge registry  
- creates `FinancingAgreement`  
- creates `PledgeRegistry` entry (custodian signatory)

---

## 3.3 `FinancingAgreement`

Represents financing terms.

**Fields**
- receivableId  
- supplier, buyer, financier  
- principal  
- faceAmount  
- rateBps  
- maturity : Date  
- custodian : Party  

**Choice: Settle** (controller buyer)
- archives agreement  
- creates `SettlementRecord`  
- instructs custodian to `MarkUnpledged`

---

## 3.4 `PledgeRegistry` (Minimal Shared Truth)

Owned by custodian. Prevents double financing.

**Fields**
- custodian : Party  
- receivableId : Text  
- status : Text (“Pledged”, “Unpledged”)  
- beneficiary : Party  

**Visibility**
- signatory custodian
- observer beneficiary

**Choices**
- `MarkPledged`  
- `MarkUnpledged`

This contract exposes **no economics** — only pledge state.

---

## 3.5 `SettlementRecord`

Immutable proof of repayment.

**Fields**
- receivableId  
- paidAmount  
- payer : Party  
- paidTo : Party  
- paidOn : Date  

Signatory: financier  
Observers: supplier, buyer (optional)

---

# 4. Frontend Specification

Frontend uses **React + Vite + TypeScript**.

## Pages

### Supplier Page
- Form to create invoice  
- Table: issued invoices  
- Status timeline  

### Buyer Page
- Table: invoices awaiting confirmation  
- Button: Confirm  
- Button: Settle (only after financing & at maturity)

### Financier Page
- Table: eligible confirmed receivables  
- Form: Financing terms (advance %, rateBps, maturity)  
- Table: active financing agreements  
- Table: settlements  

---

# 5. JSON API Client

`damlClient.ts` wraps:

- `query(templateId)`  
- `create(templateId, payload)`  
- `exercise(templateId, contractId, choice, argument)`  

JWT per party (Supplier/Buyer/Financier/Custodian).

---

# 6. Validation Rules

- A receivable cannot be financed if a PledgeRegistry entry exists.  
- Settlement cannot occur before maturity.  
- Only buyer can settle.  
- Custodian controls pledge state transitions.  
- Supplier cannot re-issue same `receivableId` (enforced by convention or index contract).  

---

# 7. Privacy Enforcement

- `ReceivableAsset` visible ONLY to Supplier + Buyer.  
- `ConfirmedReceivable` visible to Supplier + Buyer (Financier sees via “offer” flow or after creation).  
- `FinancingAgreement` visible to Financier (+ optional Supplier/Buyer as observers).  
- `PledgeRegistry` visible ONLY to Custodian (plus beneficiary).  
- `SettlementRecord` visible to Financier (+ optional Supplier/Buyer).  

No party ever sees data they shouldn’t.

---

# 8. Testing Requirements

## DAML unit tests
- Confirm twice → fail  
- Finance twice → fail  
- Settlement before maturity → fail  
- Correct creation & archiving of contracts  

## UI flow tests
- Issue → Confirm → Finance → Settle shows correct timeline  
- Double finance visually blocked  

---

# 9. Deliverables

- **DAML contract code**  
- **React UI**  
- **JSON API wrapper**  
- **Shell scripts for environment**  
- **Architecture diagram**  
- **Demo video**  

This is enough for the ideathon.

---

# 10. Roadmap (Post-MVP)

- Structured credit pools / ABS  
- Digital cash / CBDC settlement integration  
- Multi-domain cross-border deployment  
- Regulated investor onboarding  