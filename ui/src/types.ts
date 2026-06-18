export interface WorkflowSummary {
  workflowId: string;
  runId: string;
  status: string;
  startTime: string;
  closeTime: string | null;
  historyLength?: number;
}

export interface Toast {
  id: number;
  type: 'success' | 'error';
  title: string;
  body?: string;
}
