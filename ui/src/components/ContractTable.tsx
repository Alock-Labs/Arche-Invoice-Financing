import type { ReactNode } from 'react';
import type { DamlContract } from '../lib/types';

export interface Column<T> {
  header: string;
  render: (contract: DamlContract<T>) => ReactNode;
}

interface Props<T> {
  title: string;
  data?: Array<DamlContract<T>>;
  columns: Array<Column<T>>;
  emptyMessage?: string;
  actions?: (contract: DamlContract<T>) => ReactNode;
}

export function ContractTable<T>({
  title,
  data,
  columns,
  emptyMessage = 'No records yet',
  actions
}: Props<T>) {
  return (
    <section className="card">
      <h3 className="section-title">{title}</h3>
      {data && data.length > 0 ? (
        <table>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>{column.header}</th>
              ))}
              {actions && <th />}
            </tr>
          </thead>
          <tbody>
            {data.map(contract => (
              <tr key={contract.contractId}>
                {columns.map((column, index) => (
                  <td key={index}>{column.render(contract)}</td>
                ))}
                {actions && <td>{actions(contract)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">{emptyMessage}</div>
      )}
    </section>
  );
}


