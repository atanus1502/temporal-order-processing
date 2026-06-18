import { proxyActivities, ApplicationFailure } from '@temporalio/workflow';
import type { Order, OrderResult } from './activities';
import type * as activities from './activities';

const {
  validateOrder,
  chargePayment,
  refundPayment,
  fulfillOrder,
  cancelFulfillment,
  sendNotification,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    backoffCoefficient: 2,
  },
});

export async function orderProcessingWorkflow(order: Order): Promise<OrderResult> {
  let chargeId: string | undefined;
  let fulfillmentId: string | undefined;

  // Step 1: Validate
  const { totalAmount } = await validateOrder(order);

  // Step 2: Charge — compensate on downstream failure
  chargeId = await chargePayment(order, totalAmount);

  try {
    // Step 3: Fulfill
    fulfillmentId = await fulfillOrder(order, chargeId);
  } catch (fulfillErr) {
    // Compensate: refund the charge before re-throwing
    await refundPayment(chargeId, `Fulfillment failed: ${(fulfillErr as Error).message}`);
    throw ApplicationFailure.nonRetryable(
      `Order ${order.orderId} failed during fulfillment and payment was refunded`,
      'FulfillmentFailed',
    );
  }

  try {
    // Step 4: Notify
    const notificationId = await sendNotification(order, fulfillmentId, totalAmount);
    return { orderId: order.orderId, totalAmount, chargeId, fulfillmentId, notificationId };
  } catch (notifErr) {
    // Notification failure is non-critical: log but don't roll back the order
    console.log(`[orderProcessingWorkflow] Notification failed (non-fatal): ${(notifErr as Error).message}`);
    return { orderId: order.orderId, totalAmount, chargeId, fulfillmentId };
  }
}
