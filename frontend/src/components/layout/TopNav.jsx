export default function TopNav() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin h-16 bg-surface-container-high border-b border-outline-variant">
      <div className="flex items-center gap-gutter">
        <div className="flex items-center gap-stack-sm text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>widgets</span>
          <span className="font-title-sm text-title-sm font-black tracking-tighter uppercase">WarePick</span>
        </div>
        <div className="hidden md:flex items-center ml-stack-lg gap-stack-md">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input 
              className="bg-[#0F0F10] border border-outline-variant rounded text-on-surface text-body-md font-body-md pl-10 pr-4 py-2 w-64 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" 
              placeholder="Search SKU or Location..." 
              type="text"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-stack-md">
        <button className="text-on-surface-variant hover:bg-surface-container-highest p-2 rounded transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full pulse-dot"></span>
        </button>
        <button className="text-on-surface-variant hover:bg-surface-container-highest p-2 rounded transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <button className="text-on-surface-variant hover:bg-surface-container-highest p-2 rounded transition-colors">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}
