import { useState } from 'react';

interface Product { productId: string; label: string; price: number; }

const PRODUCTS: Product[] = [
  { productId: 'prod-001', label: 'Wireless Headphones',  price: 29.99 },
  { productId: 'prod-002', label: 'USB-C Cable (3-pack)', price:  9.99 },
  { productId: 'prod-003', label: 'Laptop Stand',         price: 49.99 },
  { productId: 'prod-004', label: 'Mechanical Keyboard',  price: 89.99 },
];

interface Props {
  onSuccess: (workflowId: string) => void;
  onError: (msg: string) => void;
}

export default function OrderForm({ onSuccess, onError }: Props) {
  const [customerId, setCustomerId]       = useState('customer-42');
  const [address, setAddress]             = useState('123 Main St, San Francisco, CA 94105');
  const [payment, setPayment]             = useState('pm_test_visa');
  const [quantities, setQuantities]       = useState<Record<string, number>>({});
  const [loading, setLoading]             = useState(false);

  function setQty(productId: string, delta: number) {
    setQuantities(prev => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[productId]; else copy[productId] = next;
      return copy;
    });
  }

  const items = PRODUCTS
    .filter(p => quantities[p.productId])
    .map(p => ({ productId: p.productId, price: p.price, quantity: quantities[p.productId] }));

  const total = PRODUCTS.reduce(
    (sum, p) => sum + p.price * (quantities[p.productId] ?? 0), 0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { onError('Add at least one item.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, shippingAddress: address, paymentMethodId: payment, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      setQuantities({});
      onSuccess(data.workflowId);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>New Order</h2>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-section-title">Customer</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Customer ID</label>
                <input value={customerId} onChange={e => setCustomerId(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Payment</label>
                <select value={payment} onChange={e => setPayment(e.target.value)}>
                  <option value="pm_test_visa">Visa ···4242</option>
                  <option value="pm_test_mc">Mastercard ···5555</option>
                  <option value="pm_test_amex">Amex ···0005</option>
                </select>
              </div>
              <div className="form-group full">
                <label>Shipping Address</label>
                <input value={address} onChange={e => setAddress(e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Items</div>
            <div className="products">
              {PRODUCTS.map(p => {
                const qty = quantities[p.productId] ?? 0;
                return (
                  <div key={p.productId} className={`product-card ${qty > 0 ? 'active' : ''}`}>
                    <div className="product-info">
                      <div className="product-name">{p.label}</div>
                      <div className="product-price">${p.price.toFixed(2)} each</div>
                    </div>
                    <div className="qty-ctrl">
                      <button type="button" className="qty-btn" onClick={() => setQty(p.productId, -1)} disabled={qty === 0}>−</button>
                      <span className="qty-num">{qty}</span>
                      <button type="button" className="qty-btn" onClick={() => setQty(p.productId, +1)}>+</button>
                    </div>
                    <div className="product-subtotal">
                      {qty > 0 ? `$${(p.price * qty).toFixed(2)}` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-footer">
            <div className="order-total">
              {total > 0
                ? <>Total: <strong>${total.toFixed(2)}</strong></>
                : <span style={{ color: 'var(--gray-400)' }}>Select items above</span>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading || items.length === 0}>
              {loading ? 'Submitting…' : 'Submit Order →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
