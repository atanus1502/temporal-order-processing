import 'dotenv/config';
import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

const {
  TEMPORAL_API_KEY,
  TEMPORAL_NAMESPACE = 'quickstart-atanus686-aef58063.qe8rh',
  TEMPORAL_ADDRESS = 'quickstart-atanus686-aef58063.qe8rh.tmprl.cloud:7233',
  TEMPORAL_TASK_QUEUE = 'order-processing',
} = process.env;

async function run() {
  if (!TEMPORAL_API_KEY) {
    throw new Error('TEMPORAL_API_KEY environment variable is required');
  }

  console.log(`Connecting to Temporal Cloud at ${TEMPORAL_ADDRESS} (namespace: ${TEMPORAL_NAMESPACE})`);

  const connection = await NativeConnection.connect({
    address: TEMPORAL_ADDRESS,
    tls: true,
    apiKey: TEMPORAL_API_KEY,
  });

  const worker = await Worker.create({
    connection,
    namespace: TEMPORAL_NAMESPACE,
    taskQueue: TEMPORAL_TASK_QUEUE,
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  console.log(`Worker started. Listening on task queue: ${TEMPORAL_TASK_QUEUE}`);
  await worker.run();
}

run().catch((err) => {
  console.error('Worker failed:', err);
  process.exit(1);
});
