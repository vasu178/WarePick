import { useState } from 'react';
import { useOrderAPI } from '../hooks/useWarePick';

/**
 * OrdersPage — Order management with create form, demo controls, and live timeline.
 * Maps to Stitch screen: "Order Control Panel"
 */

const DEMO_SKUS = [
  { sku: 'SKU-1001', label: 'SKU-1001 (Wireless Mouse)' },
  { sku: 'SKU-1002', label: 'SKU-1002 (USB-C Cable)' },
  { sku: 'SKU-1003', label: 'SKU-1003 (Keyboard)' },
  { sku: 'SKU-1004', label: 'SKU-1004 (Laptop Stand)' },
  { sku: 'SKU-1005', label: 'SKU-1005 (Headphones)' },
  { sku: 'SKU-1006', label: 'SKU-1006 (Power Bank)' },
];

export default function OrdersPage({ orders = [] }) {
  const { createDemoOrder, createBatchOrders, createOrder, resetSystem, loading } = useOrderAPI();
  const [form, setForm] = useState({
    sku: DEMO_SKUS[0].sku,
    quantity: 1,
    priority: 'normal',
    customerName: '',
    destination: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createOrder({
      customerName: form.customerName || 'Demo Customer',
      destination: form.destination || 'Dock A',
      priority: form.priority,
      items: [{ sku: form.sku, quantity: form.quantity, productName: DEMO_SKUS.find(s => s.sku === form.sku)?.label || form.sku }],
    });
    setForm(prev => ({ ...prev, customerName: '', destination: '' }));
  };

  const getStatusColor = (status) => {
    if (['shipped', 'delivered'].includes(status)) return 'secondary';
    if (['picking', 'assigned', 'waiting_for_bot'].includes(status)) return 'primary';
    if (['checking_inventory', 'created'].includes(status)) return 'tertiary';
    if (['inventory_failed', 'failed'].includes(status)) return 'error';
    return 'on-surface-variant';
  };

  return (
    <div className="flex-1 p-margin overflow-y-auto overflow-x-hidden flex flex-col">
      <header className="mb-stack-lg flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface">Order Control Panel</h1>
          <p className="font-data-mono text-data-mono text-on-surface-variant mt-2">Manage fulfillment queue and system testing.</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-secondary/30 bg-secondary/10 text-secondary font-label-caps text-label-caps">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            SYSTEM NOMINAL
          </span>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter flex-1 min-h-0">
        {/* Left Column: Controls (Forms & Demo) */}
        <div className="lg:col-span-5 flex flex-col gap-gutter">
          {/* Create New Order Form */}
          <section className="bg-surface-container rounded-lg border border-outline-variant p-container-padding shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 mb-3 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-primary">add_box</span>
              <h2 className="font-title-sm text-title-sm text-on-surface">Create New Order</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase">SKU Selection</label>
                <div className="relative">
                  <select 
                    value={form.sku}
                    onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full bg-[#0F0F10] border border-outline-variant rounded p-2 text-data-mono font-data-mono text-on-surface focus:outline-none focus:border-primary appearance-none transition-colors"
                  >
                    {DEMO_SKUS.map(s => <option key={s.sku} value={s.sku}>{s.label}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 uppercase">Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={form.quantity}
                  onChange={(e) => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-[#0F0F10] border border-outline-variant rounded p-2 text-data-mono font-data-mono text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2 uppercase">Priority Level</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="priority" 
                      value="normal" 
                      checked={form.priority === 'normal'}
                      onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="form-radio text-primary bg-[#0F0F10] border-outline-variant focus:ring-primary focus:ring-offset-background" 
                    />
                    <span className="font-data-mono text-data-mono text-on-surface group-hover:text-primary transition-colors">Normal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="priority" 
                      value="high" 
                      checked={form.priority === 'high'}
                      onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="form-radio text-tertiary bg-[#0F0F10] border-outline-variant focus:ring-tertiary focus:ring-offset-background" 
                    />
                    <span className="font-data-mono text-data-mono text-on-surface group-hover:text-tertiary transition-colors flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">priority_high</span> High
                    </span>
                  </label>
                </div>
              </div>
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-primary-container text-on-primary-container font-label-caps text-label-caps py-2.5 px-4 rounded hover:bg-primary-fixed transition-colors flex items-center justify-center gap-2 font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">send</span>
                  Dispatch Order
                </button>
              </div>
            </div>
          </section>
          
          {/* Demo Controls Section */}
          <section className="bg-surface-container rounded-lg border border-outline-variant p-container-padding shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 mb-3 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-tertiary">science</span>
              <h2 className="font-title-sm text-title-sm text-on-surface">Demo Controls</h2>
            </div>
            <div className="space-y-2 flex flex-col">
              <button 
                type="button" 
                onClick={createDemoOrder}
                disabled={loading}
                className="bg-surface-variant border border-outline-variant text-on-surface hover:text-primary hover:border-primary font-label-caps text-label-caps py-2 px-4 rounded transition-colors flex items-center justify-between group disabled:opacity-50"
              >
                <span className="flex items-center gap-2 uppercase">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  Generate Sample Order
                </span>
                <span className="font-data-mono text-[10px] text-on-surface-variant group-hover:text-primary">CTRL+G</span>
              </button>
              <button 
                type="button" 
                onClick={() => createBatchOrders(10)}
                disabled={loading}
                className="bg-surface-variant border border-outline-variant text-on-surface hover:text-tertiary hover:border-tertiary font-label-caps text-label-caps py-2 px-4 rounded transition-colors flex items-center justify-between group disabled:opacity-50"
              >
                <span className="flex items-center gap-2 uppercase">
                  <span className="material-symbols-outlined text-[18px]">speed</span>
                  Start Load Test (10 Orders)
                </span>
              </button>
              <button 
                type="button" 
                onClick={resetSystem}
                disabled={loading}
                className="mt-2 bg-error/10 border border-error/50 text-error hover:bg-error hover:text-on-error font-label-caps text-label-caps py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 uppercase disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">warning</span>
                System Reset
              </button>
            </div>
          </section>
        </div>
        
        {/* Right Column: Live Order Timeline */}
        <div className="lg:col-span-7 h-full flex flex-col">
          <section className="bg-surface-container rounded-lg border border-outline-variant flex-1 flex flex-col overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]">
            <div className="p-container-padding border-b border-outline-variant flex justify-between items-center bg-surface-container-high z-10">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                <h2 className="font-title-sm text-title-sm text-on-surface">Live Order Timeline</h2>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px]">Auto-refresh: ON</span>
            </div>
            
            {/* Timeline Feed */}
            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
              <ul className="flex flex-col">
                {orders.length === 0 && (
                  <li className="p-container-padding text-center text-on-surface-variant text-sm">
                    No orders yet — create one above!
                  </li>
                )}
                {orders.slice(0, 5).map((order, idx) => {
                  const color = getStatusColor(order.status);
                  const isLast = idx === Math.min(orders.length, 5) - 1;
                  return (
                    <li key={order.id} className="border-b border-outline-variant/50 p-container-padding hover:bg-surface-variant/30 transition-colors flex gap-4">
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-3 h-3 rounded-full bg-${color} ring-4 ring-${color}/20 ${idx === 0 ? 'animate-pulse' : ''}`}></div>
                        {!isLast && <div className="w-px h-full bg-outline-variant my-1"></div>}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-data-mono text-data-mono text-primary">{order.id?.slice(0, 8)}</span>
                            {order.priority === 'high' && (
                              <span className="material-symbols-outlined text-[14px] text-tertiary" title="High Priority">priority_high</span>
                            )}
                          </div>
                          <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px]">
                            {order.created_at ? new Date(order.created_at).toLocaleTimeString('en-US', { hour12: false }) : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-${color}/10 text-${color} border border-${color}/20`}>
                            {order.status?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface text-sm">
                          {order.items && order.items.length > 0 ? `${order.items[0].productName} x ${order.items[0].quantity}` : 'Items...'}
                        </p>
                        
                        {order.status === 'picking' && (
                          <div className="bg-[#0F0F10] border border-outline-variant rounded p-2 flex items-center gap-3 mt-2">
                            <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center">
                              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">smart_toy</span>
                            </div>
                            <div>
                              <div className="font-label-caps text-label-caps text-on-surface-variant uppercase">Assigned Bot</div>
                              <div className="font-data-mono text-data-mono text-on-surface">{order.assigned_bot_id ? `BOT-${order.assigned_bot_id.slice(0, 4)}` : 'Pending'}</div>
                            </div>
                          </div>
                        )}
                        
                        {order.status === 'checking_inventory' && (
                          <div className="w-full max-w-xs mt-3">
                            <div className="flex justify-between mb-1">
                              <span className="font-label-caps text-[9px] text-on-surface-variant uppercase">Received</span>
                              <span className="font-label-caps text-[9px] text-tertiary uppercase">Checking</span>
                              <span className="font-label-caps text-[9px] text-on-surface-variant uppercase">Assigned</span>
                            </div>
                            <div className="flex items-center">
                              <div className="h-1 flex-1 bg-secondary rounded-l"></div>
                              <div className="h-1 flex-1 bg-tertiary relative">
                                <div className="absolute -right-1 -top-1 w-3 h-3 bg-tertiary rounded-full shadow-[0_0_8px_rgba(255,184,116,0.6)]"></div>
                              </div>
                              <div className="h-1 flex-1 bg-surface-variant rounded-r"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
