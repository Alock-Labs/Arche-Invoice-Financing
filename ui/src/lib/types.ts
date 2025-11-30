export interface TemplateId {
  moduleName: string;
  entityName: string;
  packageId?: string;
}

export interface DamlContract<T> {
  contractId: string;
  payload: T;
  observers: string[];
  signatories: string[];
  agreementText?: string;
  createdAt?: string;
}

export type PartyRole = 'supplier' | 'buyer' | 'financier' | 'custodian';


