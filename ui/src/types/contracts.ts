export interface ReceivableAsset {
  receivableId: string;
  supplier: string;
  buyer: string;
  amount: string;
  currency: string;
  dueDate: string;
  prospectiveFinanciers: string[];
}

export interface ConfirmedReceivable extends ReceivableAsset {}

export interface FinancingAgreement {
  receivableId: string;
  supplier: string;
  buyer: string;
  financier: string;
  principal: string;
  faceAmount: string;
  rateBps: number;
  maturity: string;
  currency: string;
  custodian: string;
  pledgeCid: string;
}

export interface SettlementRecord {
  receivableId: string;
  paidAmount: string;
  payer: string;
  paidTo: string;
  paidOn: string;
  supplier: string;
  buyer: string;
  financier: string;
}

export interface PledgeRegistry {
  custodian: string;
  receivableId: string;
  status: string;
  beneficiary: string;
  observerParties: string[];
}

export interface PledgeReleaseRequest {
  custodian: string;
  financier: string;
  buyer: string;
  pledgeCid: string;
  receivableId: string;
}


