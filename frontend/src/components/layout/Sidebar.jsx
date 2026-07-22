export default function Sidebar({ activePage, onNavigate }) {
  return (
    <nav className="hidden md:flex fixed left-0 top-16 bottom-8 w-64 z-40 flex-col py-stack-md bg-surface-container/30 backdrop-blur-md border-r border-white/10 shadow-lg">
      <div className="px-margin mb-stack-lg">
        <h2 className="font-headline-md text-headline-md text-primary">System Control</h2>
        <p className="font-label-caps text-label-caps text-on-surface-variant mt-unit">V2.4 Active</p>
      </div>
      <div className="flex flex-col gap-unit flex-1">
        <a 
          onClick={() => onNavigate?.('floor')} 
          className={`flex items-center gap-stack-sm mx-2 px-4 py-3 rounded-lg font-label-caps text-label-caps cursor-pointer transition-all duration-300 ${
            activePage === 'floor' 
              ? 'bg-secondary-container text-on-secondary-container font-bold transition-transform translate-x-1' 
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant hover:-translate-y-1 hover:shadow-md'
          }`}
        >
          <span className="material-symbols-outlined text-lg">precision_manufacturing</span>
          <span>Warehouse Floor</span>
        </a>
        <a 
          onClick={() => onNavigate?.('orders')} 
          className={`flex items-center gap-stack-sm mx-2 px-4 py-3 rounded-lg font-label-caps text-label-caps cursor-pointer transition-all duration-300 ${
            activePage === 'orders' 
              ? 'bg-secondary-container text-on-secondary-container font-bold transition-transform translate-x-1' 
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant hover:-translate-y-1 hover:shadow-md'
          }`}
        >
          <span className="material-symbols-outlined text-lg">inventory_2</span>
          <span>Orders</span>
        </a>
        <a 
          onClick={() => onNavigate?.('inventory')} 
          className={`flex items-center gap-stack-sm mx-2 px-4 py-3 rounded-lg font-label-caps text-label-caps cursor-pointer transition-all duration-300 ${
            activePage === 'inventory' 
              ? 'bg-secondary-container text-on-secondary-container font-bold transition-transform translate-x-1' 
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant hover:-translate-y-1 hover:shadow-md'
          }`}
        >
          <span className="material-symbols-outlined text-lg">shelves</span>
          <span>Inventory</span>
        </a>
        <a 
          onClick={() => onNavigate?.('products')} 
          className={`flex items-center gap-stack-sm mx-2 px-4 py-3 rounded-lg font-label-caps text-label-caps cursor-pointer transition-all duration-300 ${
            activePage === 'products' 
              ? 'bg-secondary-container text-on-secondary-container font-bold transition-transform translate-x-1' 
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant hover:-translate-y-1 hover:shadow-md'
          }`}
        >
          <span className="material-symbols-outlined text-lg">category</span>
          <span>Products</span>
        </a>
        <a 
          onClick={() => onNavigate?.('analytics')} 
          className={`flex items-center gap-stack-sm mx-2 px-4 py-3 rounded-lg font-label-caps text-label-caps cursor-pointer transition-all duration-300 ${
            activePage === 'analytics' 
              ? 'bg-secondary-container text-on-secondary-container font-bold transition-transform translate-x-1' 
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant hover:-translate-y-1 hover:shadow-md'
          }`}
        >
          <span className="material-symbols-outlined text-lg">analytics</span>
          <span>Analytics</span>
        </a>
        <a 
          onClick={() => onNavigate?.('failed')} 
          className={`flex items-center gap-stack-sm mx-2 px-4 py-3 rounded-lg font-label-caps text-label-caps cursor-pointer transition-all duration-300 ${
            activePage === 'failed' 
              ? 'bg-error-container text-on-error-container font-bold transition-transform translate-x-1' 
              : 'text-on-surface-variant hover:text-error hover:bg-error/10 hover:-translate-y-1 hover:shadow-md'
          }`}
        >
          <span className="material-symbols-outlined text-lg text-error">warning</span>
          <span className="text-error">Failed Orders</span>
        </a>
      </div>
      <div className="px-margin mt-auto flex items-center gap-stack-sm pt-stack-md border-t border-white/10">
        <img 
          alt="User Profile" 
          className="w-8 h-8 rounded-full object-cover border border-outline-variant" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAed-TQdm2ZNxEBvv59SfPQvzGFiEdbH1EfAA_5ugvHq-bILwexoQrLqSaZUztsy3Iwr8n_rFoF_tZojPaz1IUje1Lcc6yJCr7fW2yDLR15IPpJllT8iOAWJlzdkMvTaOSP6fIPlhepByjbUwU_3Ag_IOOYIiOoHGoqj_nYJBQfJSaWN_G9-Ty54dv_cE3zSsLQcxjxvTKHNoC6yJDwxVWIWVwqlS6eOii-Z-Xw9eP3K1kWEq2AHy2S"
        />
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface">Operator 04</span>
          <span className="font-data-mono text-data-mono text-secondary text-[10px]">Online</span>
        </div>
      </div>
    </nav>
  );
}
