import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DamlClient } from '../lib/damlClient';
import { Templates } from '../lib/templates';
import { useContracts } from '../lib/useContracts';
import type {
  FinancingAgreement,
  ReceivableAsset,
  SettlementRecord
} from '../types/contracts';
import { formatCurrency, formatDate } from '../lib/format';
import { ContractTable } from '../components/ContractTable';

interface Props {
  client?: DamlClient;
}

export function BuyerPage({ client }: Props) {
  const queryClient = useQueryClient();
  const receivables = useContracts<ReceivableAsset>(
    client,
    Templates.ReceivableAsset,
    client ? { buyer: client.party } : {}
  );
  const agreements = useContracts<FinancingAgreement>(
    client,
    Templates.FinancingAgreement,
    client ? { buyer: client.party } : {}
  );
  const settlements = useContracts<SettlementRecord>(
    client,
    Templates.SettlementRecord,
    client ? { buyer: client.party } : {}
  );

  const invalidateBuyerQueries = () =>
    queryClient.invalidateQueries({
      predicate: query =>
        typeof query.queryKey[0] === 'string' &&
        query.queryKey[0] === (client?.party ?? '')
    });

  const confirmInvoice = useMutation({
    mutationFn: async (contractId: string) => {
      if (!client) throw new Error('Missing buyer credentials');
      return client.exercise(
        Templates.ReceivableAsset,
        contractId,
        'Confirm',
        {}
      );
    },
    onSuccess: invalidateBuyerQueries
  });

  const settleAgreement = useMutation({
    mutationFn: async (params: {
      contractId: string;
      paidAmount: string;
      currency: string;
    }) => {
      if (!client) throw new Error('Missing buyer credentials');
      return client.exercise(
        Templates.FinancingAgreement,
        params.contractId,
        'Settle',
        {
          paidAmount: Number(params.paidAmount),
          paidOn: new Date().toISOString().slice(0, 10)
        }
      );
    },
    onSuccess: invalidateBuyerQueries
  });

  if (!client) {
    return (
      <div className="card">
        <h3 className="section-title">Buyer Console</h3>
        <p>Configure buyer credentials to interact with receivables.</p>
      </div>
    );
  }

  const canSettle = (agreement: FinancingAgreement) => {
    const maturity = new Date(agreement.maturity);
    return maturity <= new Date();
  };

  return (
    <div className="grid" style={{ gap: '1.5rem' }}>
      <ContractTable<ReceivableAsset>
        title="Invoices Awaiting Confirmation"
        data={receivables.data}
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
            className="btn primary"
            onClick={() => confirmInvoice.mutate(contract.contractId)}
            disabled={confirmInvoice.isPending}
          >
            Confirm
          </button>
        )}
        emptyMessage="No invoices pending confirmation."
      />

      <ContractTable<FinancingAgreement>
        title="Financing Agreements"
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
        actions={contract => {
          const ready = canSettle(contract.payload);
          const disabled = settleAgreement.isPending || !ready;
          return (
            <button
              className="btn primary"
              disabled={disabled}
              onClick={() =>
                settleAgreement.mutate({
                  contractId: contract.contractId,
                  paidAmount: contract.payload.faceAmount,
                  currency: contract.payload.currency
                })
              }
            >
              {settleAgreement.isPending
                ? 'Settling...'
                : ready
                ? 'Settle'
                : 'Waiting for maturity'}
            </button>
          );
        }}
        emptyMessage="No active financing agreements."
      />

      <ContractTable<SettlementRecord>
        title="Repayment History"
        data={settlements.data}
        columns={[
          {
            header: 'Receivable',
            render: contract => contract.payload.receivableId
          },
          {
            header: 'Amount Paid',
            render: contract =>
              formatCurrency(contract.payload.paidAmount, 'USD')
          },
          {
            header: 'Paid On',
            render: contract => formatDate(contract.payload.paidOn)
          }
        ]}
        emptyMessage="No settlements recorded."
      />
    </div>
  );
}


