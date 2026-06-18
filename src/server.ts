import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Connection, Client } from '@temporalio/client';
import { orderProcessingWorkflow } from './workflows';
import type { Order } from './activities';

const {
  TEMPORAL_API_KEY,
  TEMPORAL_NAMESPACE = 'quickstart-atanus686-aef58063.qe8rh',
  TEMPORAL_ADDRESS = 'quickstart-atanus686-aef58063.qe8rh.tmprl.cloud:7233',
  TEMPORAL_TASK_QUEUE = 'order-processing',
  PORT = '3001',
} = process.env;

async function createClient() {
  if (!TEMPORAL_API_KEY) throw new Error('TEMPORAL_API_KEY is required');
  const connection = await Connection.connect({
    address: TEMPORAL_ADDRESS,
    tls: true,
    apiKey: TEMPORAL_API_KEY,
  });
  return new Client({ connection, namespace: TEMPORAL_NAMESPACE });
}

function toDisplayStatus(name: string): string {
  return name.replace('WORKFLOW_EXECUTION_STATUS_', '').replace(/_/g, ' ');
}

async function main() {
  const client = await createClient();
  const app = express();
  app.use(cors());
  app.use(express.json());

  // POST /api/orders — start a new order workflow
  app.post('/api/orders', async (req, res) => {
    try {
      const order: Order = {
        orderId: `order-${Date.now()}`,
        ...req.body,
      };
      const handle = await client.workflow.start(orderProcessingWorkflow, {
        taskQueue: TEMPORAL_TASK_QUEUE,
        workflowId: order.orderId,
        args: [order],
      });
      res.json({ workflowId: handle.workflowId, runId: handle.firstExecutionRunId });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/orders — list recent order workflows
  app.get('/api/orders', async (_req, res) => {
    try {
      const orders: object[] = [];
      const iter = client.workflow.list({
        query: `WorkflowType = "orderProcessingWorkflow"`,
      });
      for await (const wf of iter) {
        orders.push({
          workflowId: wf.workflowId,
          runId: wf.runId,
          status: toDisplayStatus(wf.status.name),
          startTime: wf.startTime,
          closeTime: wf.closeTime ?? null,
          historyLength: wf.historyLength,
        });
        if (orders.length >= 20) break;
      }
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // GET /api/orders/:id — describe a specific workflow
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const handle = client.workflow.getHandle(req.params.id);
      const desc = await handle.describe();
      res.json({
        workflowId: desc.workflowId,
        runId: desc.runId,
        status: toDisplayStatus(desc.status.name),
        startTime: desc.startTime,
        closeTime: desc.closeTime ?? null,
        historyLength: desc.historyLength,
      });
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  });

  // DELETE /api/orders/:id — cancel a workflow
  app.delete('/api/orders/:id', async (req, res) => {
    try {
      const handle = client.workflow.getHandle(req.params.id);
      await handle.cancel();
      res.json({ cancelled: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.listen(Number(PORT), () => {
    console.log(`API server running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Server failed:', err);
  process.exit(1);
});
