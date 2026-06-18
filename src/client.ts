import 'dotenv/config';
import { Connection, Client } from '@temporalio/client';
import { orderProcessingWorkflow } from './workflows';
import type { Order } from './activities';

const {
  TEMPORAL_API_KEY,
  TEMPORAL_NAMESPACE = 'quickstart-atanus686-aef58063.qe8rh',
  TEMPORAL_ADDRESS = 'quickstart-atanus686-aef58063.qe8rh.tmprl.cloud:7233',
  TEMPORAL_TASK_QUEUE = 'order-processing',
} = process.env;

const sampleOrder: Order = {
  orderId: `order-${Date.now()}`,
  customerId: 'customer-42',
  items: [
    { productId: 'prod-001', quantity: 2, price: 29.99 },
    { productId: 'prod-007', quantity: 1, price: 9.99 },
  ],
  paymentMethodId: 'pm_test_card',
  shippingAddress: '123 Main St, San Francisco, CA 94105',
};

async function run() {
  if (!TEMPORAL_API_KEY) {
    throw new Error('TEMPORAL_API_KEY environment variable is required');
  }

  console.log(`Connecting to Temporal Cloud at ${TEMPORAL_ADDRESS}`);

  const connection = await Connection.connect({
    address: TEMPORAL_ADDRESS,
    tls: true,
    apiKey: TEMPORAL_API_KEY,
  });

  const client = new Client({ connection, namespace: TEMPORAL_NAMESPACE });

  console.log(`Starting order workflow for order: ${sampleOrder.orderId}`);

  const handle = await client.workflow.start(orderProcessingWorkflow, {
    taskQueue: TEMPORAL_TASK_QUEUE,
    workflowId: `order-${sampleOrder.orderId}`,
    args: [sampleOrder],
  });

  console.log(`Workflow started. ID: ${handle.workflowId}, Run ID: ${handle.firstExecutionRunId}`);
  console.log('Waiting for result...');

  const result = await handle.result();
  console.log('Order processed successfully:', JSON.stringify(result, null, 2));

  await connection.close();
}

run().catch((err) => {
  console.error('Failed to start workflow:', err);
  process.exit(1);
});
