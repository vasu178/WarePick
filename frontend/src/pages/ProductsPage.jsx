import React, { useState } from 'react';

export default function ProductsPage({ inventory = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = inventory.filter(item => 
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="absolute inset-0 bg-pattern z-0 opacity-50"></div>
      
      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-margin flex flex-col gap-stack-lg">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-stack-md">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">Product Locations</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-unit">Find items across the warehouse</p>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input 
              className="bg-surface-container/30 backdrop-blur-md border border-white/10 shadow-inner rounded-lg text-on-surface text-body-md font-body-md pl-10 pr-4 py-2 w-full sm:w-64 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" 
              placeholder="Search product or SKU..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter pb-8">
          {filteredInventory.map(item => {
            const isLow = item.available_quantity <= 10;
            const isWarning = item.available_quantity <= 25 && item.available_quantity > 10;
            
            let iconName = 'category';
            if (item.product_name?.toLowerCase().includes('mouse')) iconName = 'mouse';
            if (item.product_name?.toLowerCase().includes('keyboard')) iconName = 'keyboard';
            if (item.product_name?.toLowerCase().includes('monitor')) iconName = 'monitor';
            if (item.product_name?.toLowerCase().includes('headset')) iconName = 'headphones';
            
            return (
              <div key={item.sku} className="bg-surface/40 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_25px_rgba(173,198,255,0.15)] rounded-lg p-container-padding flex flex-col gap-stack-sm cursor-default shadow-xl">
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-lg bg-surface-container/50 border flex items-center justify-center shrink-0 ${isLow ? 'border-error/50 bg-error/5 shadow-[0_0_15px_rgba(255,180,171,0.15)]' : 'border-white/10'}`}>
                    <span className={`material-symbols-outlined text-2xl ${isLow ? 'text-error' : 'text-primary'}`}>{iconName}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Location</span>
                    <span className="font-data-mono font-bold text-lg text-on-surface bg-surface-container/50 backdrop-blur-sm px-2 py-1 rounded mt-1 border border-white/10 shadow-inner tracking-wide">{item.zone || 'Z1-R1'}</span>
                  </div>
                </div>
                
                <div className="mt-stack-sm flex flex-col gap-1">
                  <h3 className="font-title-md text-title-md text-on-surface line-clamp-2 leading-snug" title={item.product_name}>{item.product_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-data-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">{item.sku}</span>
                  </div>
                </div>
                
                <div className="h-px bg-white/10 my-unit w-full"></div>
                
                <div className="flex justify-between items-center mt-auto">
                   <div className="flex flex-col">
                     <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Available</span>
                     <span className={`font-data-mono text-sm flex items-center gap-1 ${isLow ? 'text-error font-bold' : isWarning ? 'text-tertiary font-bold' : 'text-on-surface'}`}>
                       {item.available_quantity} 
                       {isLow && <span className="material-symbols-outlined text-[14px]">warning</span>}
                     </span>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Reserved</span>
                     <span className="font-data-mono text-sm text-on-surface-variant">{item.reserved_quantity}</span>
                   </div>
                </div>
              </div>
            );
          })}
          
          {filteredInventory.length === 0 && (
             <div className="col-span-full py-16 text-center flex flex-col items-center gap-3">
               <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-50">inventory_2</span>
               <span className="text-on-surface-variant">No products found matching "{searchTerm}"</span>
             </div>
          )}
        </div>
      </div>
    </>
  );
}
