import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DamlClient } from '../lib/damlClient';
import { Templates } from '../lib/templates';
import { useContracts } from '../lib/useContracts';
import type {
  ConfirmedReceivable,
  FinancingAgreement,
  ReceivableAsset,
  SettlementRecord
} from '../types/contracts';
import { formatCurrency, formatDate } from '../lib/format';
import { Timeline, type TimelineStage } from '../components/Timeline';
import { ContractTable } from '../components/ContractTable';

interface Props {
  client?: DamlClient;
  defaultBuyer?: string;
  defaultFinancier?: string;
}

const tomorrowIso = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
};

export function SupplierPage({
  client,
  defaultBuyer = '',
  defaultFinancier = ''
}: Props) {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState({
    receivableId: '',
    amount: '1000',
    currency: 'USD',
    dueDate: tomorrowIso(),
    buyer: defaultBuyer,
    financiers: defaultFinancier
  });

  const receivables = useContracts<ReceivableAsset>(
    client,
    Templates.ReceivableAsset,
    client ? { supplier: client.party } : {}
  );
  const confirmed = useContracts<ConfirmedReceivable>(
    client,
    Templates.ConfirmedReceivable,
    client ? { supplier: client.party } : {}
  );
  const agreements = useContracts<FinancingAgreement>(
    client,
    Templates.FinancingAgreement,
    client ? { supplier: client.party } : {}
  );
  const settlements = useContracts<SettlementRecord>(
    client,
    Templates.SettlementRecord,
    client ? { supplier: client.party } : {}
  );

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Missing supplier credentials');
      const financiers = formState.financiers
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      const prospectiveFinanciers =
        financiers.length > 0
          ? financiers
          : defaultFinancier
          ? [defaultFinancier]
          : [];
      return client.create(Templates.ReceivableAsset, {
        receivableId: formState.receivableId,
        supplier: client.party,
        buyer: formState.buyer,
        amount: Number(formState.amount),
        currency: formState.currency,
        dueDate: formState.dueDate,
        prospectiveFinanciers
      });
    },
    onSuccess: () => {
      setFormState(prev => ({ ...prev, receivableId: '' }));
      invalidateAll();
    }
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      predicate: query =>
        typeof query.queryKey[0] === 'string' &&
        query.queryKey[0] === (client?.party ?? '')
    });
  };

  const stage: TimelineStage = useMemo(() => {
    if ((settlements.data?.length ?? 0) > 0) return 'SETTLED';
    if ((agreements.data?.length ?? 0) > 0) return 'FINANCED';
    if ((confirmed.data?.length ?? 0) > 0) return 'CONFIRMED';
    if ((receivables.data?.length ?? 0) > 0) return 'ISSUED';
    return 'ISSUED';
  }, [receivables.data, confirmed.data, agreements.data, settlements.data]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.receivableId || !formState.buyer) return;
    createInvoice.mutate();
  };

  if (!client) {
    return (
      <div className="card">
        <h3 className="section-title">Supplier Console</h3>
        <p>Please configure supplier credentials in `.env` to enable this view.</p>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <Timeline currentStage={stage} />

      <section className="card">
        <h3 className="section-title">Issue New Invoice</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Receivable ID
            <input
              value={formState.receivableId}
              onChange={event =>
                setFormState(s => ({ ...s, receivableId: event.target.value }))
              }
              placeholder="INV-2024-001"
              required
            />
          </label>
          <label>
            Amount (face value)
            <input
              type="number"
              min="1"
              step="0.01"
              value={formState.amount}
              onChange={event =>
                setFormState(s => ({ ...s, amount: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Currency
            <input
              value={formState.currency}
              onChange={event =>
                setFormState(s => ({ ...s, currency: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Buyer party
            <input
              value={formState.buyer}
              onChange={event =>
                setFormState(s => ({ ...s, buyer: event.target.value }))
              }
              placeholder="Buyer_B"
              required
            />
          </label>
          <label>
            Prospective financiers
            <input
              value={formState.financiers}
              onChange={event =>
                setFormState(s => ({ ...s, financiers: event.target.value }))
              }
              placeholder="Financier_F"
            />
            <small style={{ color: '#94a3b8' }}>
              Comma separated DAML party IDs.
            </small>
          </label>
          <label>
            Due date
            <input
              type="date"
              value={formState.dueDate}
              onChange={event =>
                setFormState(s => ({ ...s, dueDate: event.target.value }))
              }
              required
            />
          </label>
          <button
            type="submit"
            className="btn primary"
            disabled={createInvoice.isPending}
          >
            {createInvoice.isPending ? 'Submitting...' : 'Create Invoice'}
          </button>
        </form>
      </section>

      <ContractTable<ReceivableAsset>
        title="Issued Receivables"
        data={receivables.data}
        columns={[
          {
            header: 'Receivable',
            render: contract => contract.payload.receivableId
          },
          {
            header: 'Buyer',
            render: contract => contract.payload.buyer
          },
          {
            header: 'Amount',
            render: contract =>
              formatCurrency(contract.payload.amount, contract.payload.currency)
          },
          {
            header: 'Due date',
            render: contract => formatDate(contract.payload.dueDate)
          }
        ]}
        emptyMessage="No invoices yet."
      />
    </div>
  );
}


