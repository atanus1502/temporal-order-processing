export interface Order {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  paymentMethodId: string;
  shippingAddress: string;
}

export interface OrderResult {
  orderId: string;
  totalAmount: number;
  chargeId?: string;
  fulfillmentId?: string;
  notificationId?: string;
}

// --- Validate Order ---
export async function validateOrder(order: Order): Promise<{ valid: boolean; totalAmount: number }> {
  console.log(`[validateOrder] Validating order ${order.orderId}`);

  if (!order.items || order.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }
  if (!order.customerId) {
    throw new Error('Order must have a customer ID');
  }
  if (!order.shippingAddress) {
    throw new Error('Order must have a shipping address');
  }

  const totalAmount = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (totalAmount <= 0) {
    throw new Error('Order total must be greater than zero');
  }

  console.log(`[validateOrder] Order ${order.orderId} is valid. Total: $${totalAmount.toFixed(2)}`);
  return { valid: true, totalAmount };
}

// --- Charge Payment ---
export async function chargePayment(order: Order, totalAmount: number): Promise<string> {
  console.log(`[chargePayment] Charging $${totalAmount.toFixed(2)} for order ${order.orderId}`);

  // Simulate payment processing (replace with real payment provider call)
  await new Promise((resolve) => setTimeout(resolve, 200));

  const chargeId = `ch_${Date.now()}_${order.orderId}`;
  console.log(`[chargePayment] Payment successful. Charge ID: ${chargeId}`);
  return chargeId;
}

// --- Refund Payment (compensating action) ---
export async function refundPayment(chargeId: string, reason: string): Promise<void> {
  console.log(`[refundPayment] Refunding charge ${chargeId}. Reason: ${reason}`);
  // Simulate refund (replace with real payment provider call)
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(`[refundPayment] Refund for ${chargeId} processed`);
}

// --- Fulfill Order ---
export async function fulfillOrder(order: Order, chargeId: string): Promise<string> {
  console.log(`[fulfillOrder] Fulfilling order ${order.orderId} (charge: ${chargeId})`);

  // Simulate warehouse / inventory system call
  await new Promise((resolve) => setTimeout(resolve, 300));

  const fulfillmentId = `ff_${Date.now()}_${order.orderId}`;
  console.log(`[fulfillOrder] Fulfillment created. ID: ${fulfillmentId}`);
  return fulfillmentId;
}

// --- Cancel Fulfillment (compensating action) ---
export async function cancelFulfillment(fulfillmentId: string, reason: string): Promise<void> {
  console.log(`[cancelFulfillment] Cancelling fulfillment ${fulfillmentId}. Reason: ${reason}`);
  await new Promise((resolve) => setTimeout(resolve, 100));
  console.log(`[cancelFulfillment] Fulfillment ${fulfillmentId} cancelled`);
}

// --- Send Notification ---
export async function sendNotification(
  order: Order,
  fulfillmentId: string,
  totalAmount: number,
): Promise<string> {
  console.log(`[sendNotification] Notifying customer ${order.customerId} for order ${order.orderId}`);

  // Simulate email/SMS (replace with real notification service)
  await new Promise((resolve) => setTimeout(resolve, 100));

  const notificationId = `notif_${Date.now()}_${order.orderId}`;
  console.log(`[sendNotification] Notification sent. ID: ${notificationId}`);
  return notificationId;
}
