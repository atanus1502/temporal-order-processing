import type { WorkflowSummary } from '../types';

function badgeClass(status: string) {
  if (status.includes('RUNNING'))    return 'badge badge-running';
  if (status.includes('COMPLETED'))  return 'badge badge-completed';
  if (status.includes('FAILED'))     return 'badge badge-failed';
  if (status.includes('CANCEL'))     return 'badge badge-cancelled';
  if (status.includes('TIMED'))      return 'badge badge-timedout';
  return 'badge badge-default';
}

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface Props {
  orders: WorkflowSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCancel: (id: string) => void;
}

export default function OrderList({ orders, selectedId, onSelect, onCancel }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Orders</h2>
        <span className="list-meta">{orders.length} workflow{orders.length !== 1 ? 's' : ''} · auto-refresh 3s</span>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📭</div>
          <p>No orders yet — submit one to get started.</p>
        </div>
      ) : (
        <table className="order-table">
          <thead>
            <tr>
              <th>Workflow ID</th>
              <th>Status</th>
              <th>Started</th>
              <th>Closed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr
                key={o.runId}
                className={selectedId === o.workflowId ? 'selected' : ''}
                onClick={() => onSelect(o.workflowId)}
              >
                <td>
                  <div className="wf-id" title={o.workflowId}>{o.workflowId}</div>
                </td>
                <td>
                  <span className={badgeClass(o.status)}>
                    {o.status.includes('RUNNING') && <span className="dot-running" />}
                    {o.status.replace(/ /g, ' ')}
                  </span>
                </td>
                <td>
                  <div className="time-str">{fmtTime(o.startTime)}</div>
                  {fmtDate(o.startTime) && <div style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{fmtDate(o.startTime)}</div>}
                </td>
                <td className="time-str">{fmtTime(o.closeTime)}</td>
                <td onClick={e => e.stopPropagation()}>
                  {o.status.includes('RUNNING') && (
                    <button
                      className="btn-danger-sm"
                      onClick={() => onCancel(o.workflowId)}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
