const steps = [
  { key: 'ISSUED', label: 'Issued', description: 'Supplier created invoice' },
  {
    key: 'CONFIRMED',
    label: 'Confirmed',
    description: 'Buyer acknowledged liability'
  },
  {
    key: 'FINANCED',
    label: 'Financed',
    description: 'Financier advanced funds'
  },
  {
    key: 'SETTLED',
    label: 'Settled',
    description: 'Buyer repaid financier'
  }
] as const;

export type TimelineStage = (typeof steps)[number]['key'];

interface Props {
  currentStage: TimelineStage;
}

export function Timeline({ currentStage }: Props) {
  const currentIndex = steps.findIndex(step => step.key === currentStage);

  return (
    <div className="card">
      <h3 className="section-title">Deterministic Timeline</h3>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          return (
            <div
              key={step.key}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '12px',
                background: isCompleted ? '#e0ffe7' : '#edf0f7',
                border: isCompleted ? '1px solid #10b981' : '1px dashed #c3c9d9'
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: isCompleted ? '#047857' : '#94a3b8'
                }}
              >
                {step.label}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                {step.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


