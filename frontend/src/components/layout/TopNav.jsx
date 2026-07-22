import { useState, useRef, useEffect } from 'react';
import { useRealtimeTable } from '../../hooks/useWarePick';

export default function TopNav() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  
  const { data: orders } = useRealtimeTable('orders', { orderBy: 'created_at', ascending: false, limit: 20 });
  const notifications = orders.filter(o => ['created', 'shipped'].includes(o.status)).slice(0, 10);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin h-16 bg-surface-container-high/40 backdrop-blur-md border-b border-white/10 shadow-sm">
      <div className="flex items-center gap-gutter">
        <div className="flex items-center gap-stack-sm text-primary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>widgets</span>
          <span className="font-title-sm text-title-sm font-black tracking-tighter uppercase">WarePick</span>
        </div>
      </div>
      
      <div className="flex items-center gap-stack-md" ref={dropdownRef}>
        
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')} 
            className={`text-on-surface-variant hover:bg-surface-container-highest p-2 rounded transition-colors relative ${activeDropdown === 'notifications' ? 'bg-surface-container-highest text-primary' : ''}`}
          >
            <span className="material-symbols-outlined">notifications</span>
            {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full pulse-dot"></span>}
          </button>
          
          {activeDropdown === 'notifications' && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-lg shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-outline-variant bg-surface-container flex justify-between items-center">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Notifications</h3>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">{notifications.length} New</span>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl opacity-50">notifications_off</span>
                    <span className="text-sm">No new notifications</span>
                  </div>
                ) : (
                  <ul className="flex flex-col">
                    {notifications.map(n => (
                      <li key={n.id} className="p-4 border-b border-outline-variant/50 hover:bg-surface-variant/30 text-sm transition-colors cursor-default">
                        <div className="flex gap-3">
                          <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.status === 'created' ? 'bg-tertiary/10 text-tertiary' : 'bg-secondary/10 text-secondary'}`}>
                            <span className="material-symbols-outlined text-[16px]">{n.status === 'created' ? 'add_shopping_cart' : 'local_shipping'}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <span className={`font-bold text-[10px] uppercase tracking-wider ${n.status === 'created' ? 'text-tertiary' : 'text-secondary'}`}>Order {n.status}</span>
                              <span className="text-[10px] text-on-surface-variant font-data-mono">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-on-surface text-xs leading-snug">
                              Order <span className="font-data-mono text-primary">{n.id.slice(0,8)}</span> has been {n.status}.
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="p-2 border-t border-outline-variant bg-surface-container text-center">
                <button className="text-xs text-primary hover:text-primary-fixed transition-colors font-medium">Mark all as read</button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'settings' ? null : 'settings')} 
            className={`text-on-surface-variant hover:bg-surface-container-highest p-2 rounded transition-colors ${activeDropdown === 'settings' ? 'bg-surface-container-highest text-primary' : ''}`}
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          {activeDropdown === 'settings' && (
             <div className="absolute right-0 mt-2 w-56 bg-surface border border-outline-variant rounded-lg shadow-2xl overflow-hidden z-50">
               <div className="p-3 border-b border-outline-variant bg-surface-container">
                 <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Settings</h3>
               </div>
               <ul className="py-2">
                 <li className="px-4 py-2.5 hover:bg-surface-variant text-sm cursor-pointer flex items-center justify-between text-on-surface transition-colors">
                   <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[18px] text-on-surface-variant">dark_mode</span> Dark Mode</div>
                   <div className="w-8 h-4 bg-primary rounded-full relative"><div className="absolute right-1 top-1 w-2 h-2 bg-on-primary rounded-full"></div></div>
                 </li>
                 <li className="px-4 py-2.5 hover:bg-surface-variant text-sm cursor-pointer flex items-center gap-3 text-on-surface transition-colors">
                   <span className="material-symbols-outlined text-[18px] text-on-surface-variant">volume_up</span> Sound Alerts
                 </li>
                 <li className="px-4 py-2.5 hover:bg-surface-variant text-sm cursor-pointer flex items-center gap-3 text-on-surface transition-colors">
                   <span className="material-symbols-outlined text-[18px] text-on-surface-variant">tune</span> System Preferences
                 </li>
               </ul>
             </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setActiveDropdown(activeDropdown === 'profile' ? null : 'profile')} 
            className={`text-on-surface-variant hover:bg-surface-container-highest p-2 rounded transition-colors ${activeDropdown === 'profile' ? 'bg-surface-container-highest text-primary' : ''}`}
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
          {activeDropdown === 'profile' && (
             <div className="absolute right-0 mt-2 w-64 bg-surface border border-outline-variant rounded-lg shadow-2xl overflow-hidden z-50">
               <div className="p-4 border-b border-outline-variant bg-surface-container flex items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                   <span className="material-symbols-outlined text-2xl">person</span>
                 </div>
                 <div className="min-w-0 flex-1">
                   <div className="font-bold text-on-surface text-sm truncate">Operator 04</div>
                   <div className="text-xs text-on-surface-variant truncate">operator04@warepick.io</div>
                   <div className="text-[10px] text-secondary flex items-center gap-1 mt-1 font-bold uppercase tracking-wider"><span className="w-1.5 h-1.5 bg-secondary rounded-full"></span> Online</div>
                 </div>
               </div>
               <ul className="py-2">
                 <li className="px-4 py-2.5 hover:bg-surface-variant text-sm cursor-pointer flex items-center gap-3 text-on-surface transition-colors">
                   <span className="material-symbols-outlined text-[18px] text-on-surface-variant">badge</span> My Profile
                 </li>
                 <li className="px-4 py-2.5 hover:bg-surface-variant text-sm cursor-pointer flex items-center gap-3 text-on-surface transition-colors">
                   <span className="material-symbols-outlined text-[18px] text-on-surface-variant">history</span> Shift History
                 </li>
                 <div className="h-px bg-outline-variant my-1"></div>
                 <li className="px-4 py-2.5 hover:bg-error/10 text-sm cursor-pointer flex items-center gap-3 text-error transition-colors">
                   <span className="material-symbols-outlined text-[18px]">logout</span> Sign Out
                 </li>
               </ul>
             </div>
          )}
        </div>

      </div>
    </header>
  );
}
