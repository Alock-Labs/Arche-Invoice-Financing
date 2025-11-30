import { DamlClient } from './damlClient';
import type { PartyRole } from './types';

interface PartyCredential {
  party?: string;
  token?: string;
}

const baseUrl =
  import.meta.env.VITE_JSON_API_BASE_URL ?? 'http://localhost:7575';

const credentials: Record<PartyRole, PartyCredential> = {
  supplier: {
    party: import.meta.env.VITE_SUPPLIER_PARTY,
    token: import.meta.env.VITE_SUPPLIER_JWT
  },
  buyer: {
    party: import.meta.env.VITE_BUYER_PARTY,
    token: import.meta.env.VITE_BUYER_JWT
  },
  financier: {
    party: import.meta.env.VITE_FINANCIER_PARTY,
    token: import.meta.env.VITE_FINANCIER_JWT
  },
  custodian: {
    party: import.meta.env.VITE_CUSTODIAN_PARTY,
    token: import.meta.env.VITE_CUSTODIAN_JWT
  }
};

export const buildClients = (): Partial<Record<PartyRole, DamlClient>> => {
  return Object.entries(credentials).reduce((acc, [role, cred]) => {
    if (cred.party && cred.token) {
      acc[role as PartyRole] = new DamlClient({
        baseUrl,
        party: cred.party,
        token: cred.token
      });
    }
    return acc;
  }, {} as Partial<Record<PartyRole, DamlClient>>);
};


