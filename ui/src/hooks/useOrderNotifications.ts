import { useEffect, useRef, useCallback } from 'react';
import type { WorkflowSummary } from '../types';

function isTerminal(status: string) {
  return !status.includes('RUNNING');
}

export function useOrderNotifications() {
  const prevStatuses = useRef<Map<string, string>>(new Map());
  const permissionGranted = useRef(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      permissionGranted.current = true;
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => {
        permissionGranted.current = p === 'granted';
      });
    }
  }, []);

  const checkTransitions = useCallback((orders: WorkflowSummary[]) => {
    if (!permissionGranted.current) return;

    orders.forEach(order => {
      const prev = prevStatuses.current.get(order.workflowId);

      // Only fire on RUNNING → terminal transition
      if (prev && prev.includes('RUNNING') && isTerminal(order.status)) {
        const completed = order.status.includes('COMPLETED');
        const title = completed ? '✅ Order completed' : `⚠️ Order ${order.status.toLowerCase()}`;
        const body = order.workflowId;

        const n = new Notification(title, {
          body,
          icon: completed ? undefined : undefined,
          tag: order.workflowId, // deduplicate — same tag replaces previous
          silent: false,
        });

        // Auto-close after 6 s
        setTimeout(() => n.close(), 6000);
      }
    });

    // Snapshot current statuses for next comparison
    prevStatuses.current = new Map(orders.map(o => [o.workflowId, o.status]));
  }, []);

  return { checkTransitions };
}
