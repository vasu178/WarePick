import { useState } from 'react';
import { useOrderAPI } from '../hooks/useWarePick';
import { Package, Zap, RotateCcw, Send } from 'lucide-react';

const DEMO_SKUS = [
  { sku: 'SKU-1001', productName: 'Wireless Mouse' },
  { sku: 'SKU-1002', productName: 'USB-C Cable' },
  { sku: 'SKU-1003', productName: 'Keyboard' },
  { sku: 'SKU-1004', productName: 'Laptop Stand' },
  { sku: 'SKU-1005', productName: 'Headphones' },
  { sku: 'SKU-1006', productName: 'Power Bank' },
];

/**
 * OrderPanel — Left panel with order form, demo controls, and order list.
 */
export default function OrderPanel({ orders = [] }) {
  const { createDemoOrder, createBatchOrders, createOrder, resetSystem, loading } = useOrderAPI();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    destination: '',
    priority: 'normal',
    items: [{ sku: 'SKU-1001', quantity: 1 }],
  });

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.destination) return;
    await createOrder({
      ...form,
      items: form.items.map(item => ({
        ...item,
        productName: DEMO_SKUS.find(s => s.sku === item.sku)?.productName || item.sku,
      })),
    });
    setForm({ customerName: '', destination: '', priority: 'normal', items: [{ sku: 'SKU-1001', quantity: 1 }] });
    setShowForm(false);
  };

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { sku: 'SKU-1001', quantity: 1 }] }));
  };

  const updateItem = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));
  };

  const removeItem = (idx) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="panel">
      {/* Demo Controls */}
      <div>
        <div className="section-header">Quick Actions</div>
        <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
          <button className="btn btn--primary btn--full" onClick={createDemoOrder} disabled={loading}>
            <Package size={14} /> Create Demo Order
          </button>
          <button className="btn btn--success btn--full" onClick={() => createBatchOrders(10)} disabled={loading}>
            <Zap size={14} /> Batch 10 Orders
          </button>
          <div className="flex gap-2">
            <button className="btn btn--full" onClick={() => setShowForm(!showForm)}>
              <Send size={14} /> {showForm ? 'Cancel' : 'Custom Order'}
            </button>
            <button className="btn btn--danger" onClick={resetSystem} disabled={loading} title="Reset system">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Custom Order Form */}
      {showForm && (
        <form onSubmit={handleSubmitOrder} className="card flex flex-col gap-2">
          <div className="section-header">New Order</div>
          <div className="form-group">
            <label className="form-label">Customer</label>
            <input className="form-input" placeholder="Customer name"
              value={form.customerName} onChange={e => setForm(prev => ({ ...prev, customerName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Destination</label>
            <input className="form-input" placeholder="City"
              value={form.destination} onChange={e => setForm(prev => ({ ...prev, destination: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={form.priority}
              onChange={e => setForm(prev => ({ ...prev, priority: e.target.value }))}>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="section-header" style={{ marginTop: 4 }}>Items</div>
          {form.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select className="form-select" style={{ flex: 2 }} value={item.sku}
                onChange={e => updateItem(idx, 'sku', e.target.value)}>
                {DEMO_SKUS.map(s => <option key={s.sku} value={s.sku}>{s.productName}</option>)}
              </select>
              <input type="number" className="form-input" style={{ width: 50 }} min={1} max={20}
                value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
              {form.items.length > 1 && (
                <button type="button" className="btn btn--sm btn--danger" onClick={() => removeItem(idx)}>×</button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn--sm" onClick={addItem}>+ Add Item</button>
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>Submit Order</button>
        </form>
      )}

      {/* Order List */}
      <div>
        <div className="section-header">Orders ({orders.length})</div>
        <div className="flex flex-col gap-2" style={{ marginTop: 4, maxHeight: '50vh', overflowY: 'auto' }}>
          {orders.length === 0 && (
            <div className="text-muted text-xs" style={{ textAlign: 'center', padding: 16 }}>
              No orders yet — create one above!
            </div>
          )}
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card__header">
                <span className="order-card__id">{order.id?.slice(0, 8)}</span>
                <span className={`status-badge status-badge--${order.status}`}>
                  <span className="status-badge__dot" />
                  {order.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="order-card__details">
                <span>{order.customer_name}</span>
                <span>→ {order.destination}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
