import { useState, useEffect, useCallback, useRef } from 'react';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import OrderDetail from './components/OrderDetail';
import { useOrderNotifications } from './hooks/useOrderNotifications';
import type { WorkflowSummary, Toast } from './types';

function NotificationBadge() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  async function request() {
    if (!('Notification' in window)) return;
    const p = await Notification.requestPermission();
    setPermission(p);
  }

  if (!('Notification' in window)) return null;

  if (permission === 'granted') {
    return <span className="notif-badge granted" title="Push notifications on">🔔 Notifications on</span>;
  }
  if (permission === 'denied') {
    return <span className="notif-badge denied" title="Notifications blocked in browser settings">🔕 Notifications blocked</span>;
  }
  return (
    <button className="notif-badge prompt" onClick={request} title="Enable push notifications">
      🔔 Enable notifications
    </button>
  );
}

export default function App() {
  const [orders, setOrders] = useState<WorkflowSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const { checkTransitions } = useOrderNotifications();

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) return;
      const data: WorkflowSummary[] = await res.json();
      checkTransitions(data);
      setOrders(data);
    } catch {
      // silent
    }
  }, [checkTransitions]);

  useEffect(() => { fetchOrders(); }, [fetchOrders, refreshKey]);
  useEffect(() => {
    const id = setInterval(fetchOrders, 3000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const stats = {
    total:     orders.length,
    running:   orders.filter(o => o.status.includes('RUNNING')).length,
    completed: orders.filter(o => o.status.includes('COMPLETED')).length,
    failed:    orders.filter(o => o.status.includes('FAILED')).length,
  };

  const selectedOrder = orders.find(o => o.workflowId === selectedId) ?? null;

  return (
    <>
      <header className="header">
        <span className="header-logo">⚡</span>
        <h1>Order Processing</h1>
        <div className="header-right">
          <NotificationBadge />
          <span className="header-sub">Temporal Cloud · quickstart-atanus686</span>
        </div>
      </header>

      <main className="page">
        <div className="stats">
          <div className="stat">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Running</div>
            <div className="stat-value running">{stats.running}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Completed</div>
            <div className="stat-value completed">{stats.completed}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Failed</div>
            <div className="stat-value failed">{stats.failed}</div>
          </div>
        </div>

        <div className="main-row">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <OrderList
              orders={orders}
              selectedId={selectedId}
              onSelect={id => setSelectedId(prev => prev === id ? null : id)}
              onCancel={async (id) => {
                await fetch(`/api/orders/${encodeURIComponent(id)}`, { method: 'DELETE' });
                addToast({ type: 'success', title: 'Workflow cancelled', body: id });
                fetchOrders();
              }}
            />
            {selectedOrder && (
              <OrderDetail order={selectedOrder} onClose={() => setSelectedId(null)} />
            )}
          </div>

          <div>
            <OrderForm
              onSuccess={(workflowId) => {
                addToast({ type: 'success', title: 'Order submitted', body: workflowId });
                setRefreshKey(k => k + 1);
                setSelectedId(workflowId);
              }}
              onError={(msg) => addToast({ type: 'error', title: 'Submission failed', body: msg })}
            />
          </div>
        </div>
      </main>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{t.type === 'success' ? '✓' : '✕'}</span>
            <div className="toast-text">
              <div className="toast-title">{t.title}</div>
              {t.body && <div className="toast-body">{t.body}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
