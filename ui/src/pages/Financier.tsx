import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DamlClient } from '../lib/damlClient';
import { Templates } from '../lib/templates';
import { useContracts } from '../lib/useContracts';
import type {
  ConfirmedReceivable,
  FinancingAgreement,
  SettlementRecord
} from '../types/contracts';
import { ContractTable } from '../components/ContractTable';
import { formatCurrency, formatDate } from '../lib/format';
import type { DamlContract } from '../lib/types';

interface Props {
  client?: DamlClient;
  custodianParty?: string;
}

export function FinancierPage({ client, custodianParty }: Props) {
  const queryClient = useQueryClient();
  const confirmed = useContracts<ConfirmedReceivable>(
    client,
    Templates.ConfirmedReceivable
  );
  const agreements = useContracts<FinancingAgreement>(
    client,
    Templates.FinancingAgreement,
    client ? { financier: client.party } : {}
  );
  const settlements = useContracts<SettlementRecord>(
    client,
    Templates.SettlementRecord,
    client ? { paidTo: client.party } : {}
  );

  const [selected, setSelected] =
    useState<DamlContract<ConfirmedReceivable> | undefined>();
  const [advancePct, setAdvancePct] = useState('80');
  const [rateBps, setRateBps] = useState('350');
  const [maturity, setMaturity] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 60);
    return date.toISOString().slice(0, 10);
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      predicate: query =>
        typeof query.queryKey[0] === 'string' &&
        query.queryKey[0] === (client?.party ?? '')
    });

  const finance = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Missing financier credentials');
      if (!selected) throw new Error('No receivable selected');
      if (!custodianParty)
        throw new Error('Set VITE_CUSTODIAN_PARTY in env to finance');
      return client.exercise(
        Templates.ConfirmedReceivable,
        selected.contractId,
        'Finance',
        {
          financier: client.party,
          advancePct: Number(advancePct),
          rateBps: Number(rateBps),
          maturity,
          custodian: custodianParty
        }
      );
    },
    onSuccess: () => {
      setSelected(undefined);
      invalidate();
    }
  });

  const handleFinance = (event: FormEvent) => {
    event.preventDefault();
    finance.mutate();
  };

  if (!client) {
    return (
      <div className="card">
        <h3 className="section-title">Financier Console</h3>
        <p>Configure financier credentials to continue.</p>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <ContractTable<ConfirmedReceivable>
        title="Confirmed Receivables"
        data={confirmed.data}
        columns={[
          {
            header: 'Receivable',
            render: contract => contract.payload.receivableId
          },
          {
            header: 'Amount',
            render: contract =>
              formatCurrency(contract.payload.amount, contract.payload.currency)
          },
          {
            header: 'Due Date',
            render: contract => formatDate(contract.payload.dueDate)
          }
        ]}
        actions={contract => (
          <button
            className="btn secondary"
            onClick={() => setSelected(contract)}
          >
            Use terms
          </button>
        )}
        emptyMessage="No eligible receivables currently visible."
      />

      <section className="card">
        <h3 className="section-title">Finance Terms</h3>
        {selected ? (
          <form onSubmit={handleFinance}>
            <div style={{ marginBottom: '0.5rem', color: '#6b7280' }}>
              Financing receivable <strong>{selected.payload.receivableId}</strong>
            </div>
            <label>
              Advance %
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={advancePct}
                onChange={event => setAdvancePct(event.target.value)}
              />
            </label>
            <label>
              Rate (bps)
              <input
                type="number"
                min="0"
                value={rateBps}
                onChange={event => setRateBps(event.target.value)}
              />
            </label>
            <label>
              Maturity date
              <input
                type="date"
                value={maturity}
                onChange={event => setMaturity(event.target.value)}
              />
            </label>
            <button
              type="submit"
              className="btn primary"
              disabled={finance.isPending}
            >
              {finance.isPending ? 'Financing...' : 'Create Agreement'}
            </button>
          </form>
        ) : (
          <div className="empty-state">
            Select a confirmed receivable above to propose terms.
          </div>
        )}
      </section>

      <ContractTable<FinancingAgreement>
        title="Active Financing Agreements"
        data={agreements.data}
        columns={[
          {
            header: 'Receivable',
            render: contract => contract.payload.receivableId
          },
          {
            header: 'Principal',
            render: contract =>
              formatCurrency(
                contract.payload.principal,
                contract.payload.currency
              )
          },
          {
            header: 'Maturity',
            render: contract => formatDate(contract.payload.maturity)
          },
          {
            header: 'Rate (bps)',
            render: contract => contract.payload.rateBps
          }
        ]}
        emptyMessage="No active financings."
      />

      <ContractTable<SettlementRecord>
        title="Settlements"
        data={settlements.data}
        columns={[
          {
            header: 'Receivable',
            render: contract => contract.payload.receivableId
          },
          {
            header: 'Paid Amount',
            render: contract =>
              formatCurrency(contract.payload.paidAmount, 'USD')
          },
          {
            header: 'Paid On',
            render: contract => formatDate(contract.payload.paidOn)
          }
        ]}
        emptyMessage="No settlements yet."
      />
    </div>
  );
}


