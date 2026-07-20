import React from 'react';

/**
 * InventoryPage — Inventory monitor with KPIs, SKU directory, and event log.
 * Maps to Stitch screens: "WarePick Inventory & Warehouse Management" + "Inventory & Stock"
 */
export default function InventoryPage({ inventory = [], orders = [] }) {
  // Calculate KPIs
  const totalUnits = inventory.reduce((sum, item) => sum + (item.available_quantity || 0) + (item.reserved_quantity || 0), 0);
  const lowStockItems = inventory.filter(item => item.available_quantity <= 10);
  const totalReserved = inventory.reduce((sum, item) => sum + (item.reserved_quantity || 0), 0);

  // Generate event log from recent orders
  const recentEvents = (orders || []).slice(0, 8).map((order, idx) => {
    const isError = order.status === 'inventory_failed';
    return {
      id: idx,
      time: order.updated_at || order.created_at,
      type: isError ? 'inventory.failed' : 'inventory.reserved',
      isError,
      message: isError
        ? `Allocation failed for order ${order.id?.slice(0, 8)}. Insufficient stock.`
        : `Stock reserved for Order #${order.id?.slice(0, 8)}`,
    };
  });

  return (
    <>
      <div className="absolute inset-0 bg-pattern z-0 opacity-50"></div>
      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-margin flex flex-col gap-stack-lg">
        {/* Page Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">Inventory Monitor</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-unit">Live tracking across all zones</p>
          </div>
          <div className="flex gap-stack-sm">
            <button className="px-4 py-2 bg-[#1C1C1E] border border-outline-variant rounded font-label-caps text-label-caps text-on-surface-variant hover:text-on-surface transition-colors">Export Data</button>
            <button className="px-4 py-2 bg-primary text-on-primary font-label-caps text-label-caps rounded font-bold hover:bg-primary-fixed-dim transition-colors shadow-[0_0_15px_rgba(173,198,255,0.2)]">Add Stock</button>
          </div>
        </div>
        
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          
          {/* KPI Cards (Top Row) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-gutter">
            
            {/* Total Units */}
            <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg p-container-padding flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Units</span>
                <span className="material-symbols-outlined text-on-surface-variant text-sm">inventory</span>
              </div>
              <div className="mt-stack-md flex items-baseline gap-stack-sm">
                <span className="font-display-lg text-display-lg text-on-surface font-data-mono">{totalUnits.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Low Stock Alert */}
            <div className="bg-[#1C1C1E] border border-error rounded-lg p-container-padding flex flex-col justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-error opacity-5 rounded-bl-full blur-xl"></div>
              <div className="flex justify-between items-start relative z-10">
                <span className="font-label-caps text-label-caps text-error uppercase flex items-center gap-unit">
                  <div className="w-1.5 h-1.5 bg-error rounded-full"></div>
                  Low Stock SKUs
                </span>
                <span className="material-symbols-outlined text-error text-sm">warning</span>
              </div>
              <div className="mt-stack-md flex items-baseline gap-stack-sm relative z-10">
                <span className="font-display-lg text-display-lg text-error font-data-mono">{lowStockItems.length}</span>
                <span className="font-data-mono text-data-mono text-on-surface-variant">Action Required</span>
              </div>
            </div>
            
            {/* Active Reservations */}
            <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg p-container-padding flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase flex items-center gap-unit">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full pulse-dot"></div>
                  Active Reservations
                </span>
                <span className="material-symbols-outlined text-primary text-sm">shopping_cart</span>
              </div>
              <div className="mt-stack-md flex items-baseline gap-stack-sm">
                <span className="font-display-lg text-display-lg text-on-surface font-data-mono">{totalReserved.toLocaleString()}</span>
                <span className="font-data-mono text-data-mono text-on-surface-variant">/ 1,200 Capacity</span>
              </div>
            </div>
          </div>
          
          {/* Real-time Event Log (Side Column) */}
          <div className="lg:col-span-4 bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg flex flex-col h-[600px] lg:row-span-2">
            <div className="p-container-padding border-b border-[#2C2C2E] flex justify-between items-center bg-[#222428] rounded-t-lg">
              <h3 className="font-title-sm text-title-sm text-on-surface">Event Log</h3>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">receipt_long</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-stack-sm">
              <div className="flex flex-col gap-0">
                {recentEvents.length === 0 && (
                  <div className="px-stack-md py-stack-sm text-on-surface-variant text-xs text-center">
                    Waiting for events...
                  </div>
                )}
                {recentEvents.map((event) => (
                  <div key={event.id} className={`px-stack-md py-stack-sm border-b border-[#2C2C2E] flex flex-col gap-unit hover:bg-surface-variant transition-colors ${event.isError ? 'bg-error/5' : ''}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-data-mono text-[10px] text-on-surface-variant">
                        {event.time ? new Date(event.time).toLocaleTimeString('en-US', { hour12: false }) + ' UTC' : '—'}
                      </span>
                      <span className={`font-label-caps text-[9px] px-2 py-0.5 rounded uppercase border ${event.isError ? 'text-error bg-error/10 border-error/20' : 'text-secondary bg-secondary/10 border-secondary/20'}`}>
                        {event.type}
                      </span>
                    </div>
                    <p className="font-body-md text-[13px] text-on-surface">{event.message}</p>
                  </div>
                ))}
                {/* Dummy fallback event just in case it looks too empty */}
                {recentEvents.length === 0 && (
                  <div className="px-stack-md py-stack-sm border-b border-[#2C2C2E] flex flex-col gap-unit hover:bg-surface-variant transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-data-mono text-[10px] text-on-surface-variant">14:15:02 UTC</span>
                      <span className="font-label-caps text-[9px] text-tertiary bg-tertiary/10 px-2 py-0.5 rounded uppercase border border-tertiary/20">stock.restock</span>
                    </div>
                    <p className="font-body-md text-[13px] text-on-surface">SKU <span className="font-data-mono text-tertiary">HD-NC-88</span> replenished at Loc <span className="font-data-mono">Z2-R4-S1</span>. +50 units.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* SKU Grid (Main Content) */}
          <div className="lg:col-span-8 bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg overflow-hidden flex flex-col">
            <div className="p-container-padding border-b border-[#2C2C2E] flex justify-between items-center bg-[#222428]">
              <h3 className="font-title-sm text-title-sm text-on-surface">SKU Directory</h3>
              <div className="flex gap-stack-sm">
                <button className="p-1 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">filter_list</span></button>
                <button className="p-1 text-on-surface-variant hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">grid_view</span></button>
              </div>
            </div>
            <div className="p-container-padding overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2C2C2E]">
                    <th className="pb-stack-sm font-label-caps text-label-caps text-on-surface-variant uppercase font-normal w-1/3">Product / SKU</th>
                    <th className="pb-stack-sm font-label-caps text-label-caps text-on-surface-variant uppercase font-normal">Location</th>
                    <th className="pb-stack-sm font-label-caps text-label-caps text-on-surface-variant uppercase font-normal text-right">Available</th>
                    <th className="pb-stack-sm font-label-caps text-label-caps text-on-surface-variant uppercase font-normal text-right">Reserved</th>
                    <th className="pb-stack-sm font-label-caps text-label-caps text-on-surface-variant uppercase font-normal text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="font-data-mono text-data-mono">
                  {inventory.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-on-surface-variant text-xs">
                        No inventory data available
                      </td>
                    </tr>
                  )}
                  {inventory.map((item) => {
                    const isLow = item.available_quantity <= 10;
                    const isWarning = item.available_quantity <= 25 && item.available_quantity > 10;
                    
                    // Simple icon mapping fallback
                    let iconName = 'inventory_2';
                    if (item.product_name?.toLowerCase().includes('mouse')) iconName = 'mouse';
                    if (item.product_name?.toLowerCase().includes('keyboard')) iconName = 'keyboard';
                    if (item.product_name?.toLowerCase().includes('monitor')) iconName = 'monitor';
                    if (item.product_name?.toLowerCase().includes('headset')) iconName = 'headphones';
                    if (item.product_name?.toLowerCase().includes('hub') || item.product_name?.toLowerCase().includes('usb')) iconName = 'usb';

                    return (
                      <tr key={item.sku} className={`border-b hover:bg-surface-variant transition-colors group ${isLow ? 'border-error/30 bg-error/5 hover:bg-error/10 relative' : 'border-[#2C2C2E]'}`}>
                        <td className="py-stack-md flex items-center gap-stack-md relative z-10">
                          <div className={`w-10 h-10 bg-surface-bright rounded border flex items-center justify-center shrink-0 ${isLow ? 'border-error/50' : 'border-outline-variant'}`}>
                            <span className={`material-symbols-outlined text-lg ${isLow ? 'text-error' : isWarning ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                              {iconName}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-body-md text-[13px] font-semibold text-on-surface">{item.product_name}</span>
                            <span className={`text-[11px] ${isLow ? 'text-error' : isWarning ? 'text-tertiary' : 'text-primary'}`}>{item.sku}</span>
                          </div>
                        </td>
                        <td className="py-stack-md text-on-surface-variant relative z-10">{item.zone || 'Z1-R1'}</td>
                        <td className={`py-stack-md text-right relative z-10 ${isLow ? 'text-error font-bold' : isWarning ? 'text-tertiary font-semibold' : 'text-on-surface'}`}>
                          {item.available_quantity}
                        </td>
                        <td className="py-stack-md text-right text-on-surface-variant relative z-10">{item.reserved_quantity}</td>
                        <td className="py-stack-md text-center relative z-10">
                          <div className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${isLow ? 'bg-error animate-pulse' : isWarning ? 'bg-tertiary' : 'bg-secondary'}`}></div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
