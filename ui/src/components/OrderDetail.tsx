import type { WorkflowSummary } from '../types';

const STEPS = [
  { key: 'validate', label: 'Validate Order',   desc: 'Check items, customer, address' },
  { key: 'charge',   label: 'Charge Payment',   desc: 'Process payment method' },
  { key: 'fulfill',  label: 'Fulfill Order',    desc: 'Reserve inventory & create shipment' },
  { key: 'notify',   label: 'Send Notification',desc: 'Email / SMS confirmation to customer' },
];

function inferStep(status: string, historyLength?: number): number {
  if (status.includes('COMPLETED')) return 4;
  if (status.includes('FAILED') || status.includes('CANCEL') || status.includes('TIMED')) return -1;
  // Rough heuristic from history event count
  const h = historyLength ?? 0;
  if (h < 5)  return 0;
  if (h < 9)  return 1;
  if (h < 13) return 2;
  return 3;
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' });
}

interface Props {
  order: WorkflowSummary & { historyLength?: number };
  onClose: () => void;
}

export default function OrderDetail({ order, onClose }: Props) {
  const isFailed = order.status.includes('FAILED') || order.status.includes('CANCEL') || order.status.includes('TIMED');
  const currentStep = inferStep(order.status, order.historyLength);

  function stepState(idx: number) {
    if (isFailed) {
      // Mark up-to-and-including the last completed step as done, rest as failed
      if (idx < currentStep) return 'done';
      if (idx === currentStep) return 'failed';
      return 'pending';
    }
    if (idx < currentStep) return 'done';
    if (idx === currentStep) return order.status.includes('RUNNING') ? 'active' : 'done';
    return 'pending';
  }

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h3>Workflow Detail</h3>
        <button className="close-btn" onClick={onClose} title="Close">✕</button>
      </div>
      <div className="detail-body">
        <div className="detail-field">
          <span className="detail-field-label">Workflow ID</span>
          <span className="detail-field-value mono">{order.workflowId}</span>
        </div>
        <div className="detail-field">
          <span className="detail-field-label">Run ID</span>
          <span className="detail-field-value mono" style={{ color: 'var(--gray-500)' }}>{order.runId}</span>
        </div>
        <div className="detail-divider" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="detail-field">
            <span className="detail-field-label">Started</span>
            <span className="detail-field-value">{fmt(order.startTime)}</span>
          </div>
          <div className="detail-field">
            <span className="detail-field-label">Closed</span>
            <span className="detail-field-value">{fmt(order.closeTime)}</span>
          </div>
        </div>
        <div className="detail-divider" />
        <div>
          <div className="detail-field-label" style={{ marginBottom: '0.75rem' }}>Progress</div>
          <div className="steps">
            {STEPS.map((step, idx) => {
              const state = stepState(idx);
              const isLast = idx === STEPS.length - 1;
              return (
                <div key={step.key} className="step">
                  <div className="step-indicator">
                    <div className={`step-dot ${state}`}>
                      {state === 'done'   && '✓'}
                      {state === 'active' && '…'}
                      {state === 'failed' && '✕'}
                      {state === 'pending' && ''}
                    </div>
                    {!isLast && <div className={`step-line ${state === 'done' ? 'done' : ''}`} />}
                  </div>
                  <div className="step-content">
                    <div className={`step-name ${state}`}>{step.label}</div>
                    <div className="step-desc">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
