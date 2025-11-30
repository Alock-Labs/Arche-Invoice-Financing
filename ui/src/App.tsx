import { useMemo, useState } from 'react';
import { SupplierPage } from './pages/Supplier';
import { BuyerPage } from './pages/Buyer';
import { FinancierPage } from './pages/Financier';
import { buildClients } from './lib/partyConfig';
import type { PartyRole } from './lib/types';

const tabs: Array<{ key: PartyRole; label: string }> = [
  { key: 'supplier', label: 'Supplier' },
  { key: 'buyer', label: 'Buyer' },
  { key: 'financier', label: 'Financier' }
];

export default function App() {
  const clients = useMemo(() => buildClients(), []);
  const [activeTab, setActiveTab] = useState<PartyRole>('supplier');
  const defaults = {
    buyer: import.meta.env.VITE_BUYER_PARTY ?? '',
    financier: import.meta.env.VITE_FINANCIER_PARTY ?? '',
    custodian: import.meta.env.VITE_CUSTODIAN_PARTY ?? ''
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'supplier':
        return (
          <SupplierPage
            client={clients.supplier}
            defaultBuyer={defaults.buyer}
            defaultFinancier={defaults.financier}
          />
        );
      case 'buyer':
        return <BuyerPage client={clients.buyer} />;
      case 'financier':
        return (
          <FinancierPage
            client={clients.financier}
            custodianParty={defaults.custodian}
          />
        );
      case 'custodian':
        return (
          <div className="card">
            <p>Custodian view ships post-MVP.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="layout">
      <header>
        <h1 style={{ margin: 0 }}>Arche — Deterministic Invoice Financing</h1>
        <p style={{ color: '#555', maxWidth: '720px' }}>
          Issue, confirm, finance, and settle receivables on Canton with party
          specific consoles backed by the DAML JSON API.
        </p>
      </header>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </main>
  );
}


