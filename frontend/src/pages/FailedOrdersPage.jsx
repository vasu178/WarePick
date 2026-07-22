import React, { useState, useEffect } from 'react';
import { supabase, API_BASE } from '../lib/supabase';

export default function FailedOrdersPage() {
  const [failedOrders, setFailedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  const fetchFailedOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .in('status', ['failed', 'inventory_failed'])
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setFailedOrders(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedOrders();

    const channel = supabase
      .channel('failed-orders-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchFailedOrders();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleReattempt = async (orderId) => {
    setRetryingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/reattempt`, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reattempt order');
      }
    } catch (err) {
      console.error(err);
      alert(`Error reattempting order: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleRemove = async (orderId) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      alert(`Error removing order: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 p-margin overflow-y-auto overflow-x-hidden flex flex-col">
      <header className="mb-stack-lg flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg text-error flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl">warning</span>
            Failed Orders
          </h1>
          <p className="font-data-mono text-data-mono text-on-surface-variant mt-2">View and recover orders that encountered issues in the pipeline.</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-error/30 bg-error/10 text-error font-label-caps text-label-caps">
            {failedOrders.length} FAILED ORDERS
          </span>
        </div>
      </header>

      <section className="bg-surface-container rounded-lg border border-outline-variant flex-1 flex flex-col overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] min-h-0">
        <div className="p-container-padding border-b border-outline-variant flex justify-between items-center bg-surface-container-high z-10">
          <h2 className="font-title-sm text-title-sm text-on-surface">Queue</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
          {loading && failedOrders.length === 0 ? (
            <div className="p-container-padding text-center text-on-surface-variant">Loading...</div>
          ) : failedOrders.length === 0 ? (
            <div className="p-container-padding text-center text-on-surface-variant flex flex-col items-center justify-center h-full gap-2 min-h-[200px]">
              <span className="material-symbols-outlined text-4xl opacity-50">check_circle</span>
              <p>No failed orders. The pipeline is healthy!</p>
            </div>
          ) : (
            <ul className="flex flex-col">
              {failedOrders.map((order) => (
                <li key={order.id} className="border-b border-outline-variant/50 p-container-padding hover:bg-surface-variant/30 transition-colors flex gap-4 items-center">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-data-mono text-data-mono text-primary">{order.id?.slice(0, 8)}</span>
                        {order.priority === 'high' && (
                          <span className="material-symbols-outlined text-[14px] text-tertiary" title="High Priority">priority_high</span>
                        )}
                      </div>
                      <span className="font-data-mono text-data-mono text-on-surface-variant text-[11px]">
                        {order.created_at ? new Date(order.created_at).toLocaleTimeString('en-US') : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error border border-error/20">
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <div className="font-body-md text-body-md text-on-surface text-sm space-y-1">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between bg-[#0F0F10] p-2 rounded text-xs border border-outline-variant">
                          <span>{item.product_name || item.sku}</span>
                          <span className="text-secondary">x {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="shrink-0 ml-4 flex gap-2">
                    <button
                      onClick={() => handleRemove(order.id)}
                      className="bg-error/10 text-error border border-error/30 hover:bg-error hover:text-on-error font-label-caps text-label-caps py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 uppercase"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Remove
                    </button>
                    <button
                      onClick={() => handleReattempt(order.id)}
                      disabled={retryingId === order.id}
                      className="bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-on-primary font-label-caps text-label-caps py-2 px-4 rounded transition-colors flex items-center justify-center gap-2 uppercase disabled:opacity-50"
                    >
                      {retryingId === order.id ? (
                        <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">replay</span>
                      )}
                      Reattempt
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
