import { useAnalytics, useSystemEvents } from '../hooks/useWarePick';

/**
 * AnalyticsPage — System analytics with KPIs, bot utilization, microservice pulse, and raw event feed.
 * Maps to Stitch screen: "System Analytics"
 */

const SERVICES = [
  { name: 'Order API', ping: '42ms', reqs: '12k req/s', status: 'ok' },
  { name: 'Inventory DB', ping: '18ms', reqs: '45k req/s', status: 'ok' },
  { name: 'Routing Eng', ping: '240ms', reqs: '8k req/s', status: 'error' },
  { name: 'Bot Fleet', ping: '65ms', reqs: '1.2k events/s', status: 'ok' },
  { name: 'Auth Svc', ping: '22ms', reqs: '3k req/s', status: 'ok' },
  { name: 'Analytics', ping: '120ms', reqs: '500 req/s', status: 'warn' },
  { name: 'Notification', ping: '35ms', reqs: '2k req/s', status: 'ok' },
];

export default function AnalyticsPage({ bots = [] }) {
  const summary = useAnalytics(4000);
  const systemEvents = useSystemEvents();

  const activeBots = bots.filter(b => ['picking', 'assigned', 'busy'].includes(b.status));
  const idleBots = bots.filter(b => b.status === 'idle');

  const pickingPct = bots.length > 0 ? Math.round((activeBots.length / bots.length) * 100) : 0;
  const idlePct = bots.length > 0 ? Math.round((idleBots.length / bots.length) * 100) : 0;
  const errorPct = Math.max(0, 100 - pickingPct - idlePct);

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary,
      systemEvents: systemEvents.slice(0, 100),
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warepick-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-margin mb-8 overflow-y-auto overflow-x-hidden flex flex-col">
      <div className="flex justify-between items-end mb-stack-lg shrink-0">
        <h1 className="font-headline-md text-headline-md text-primary">System Analytics</h1>
        <div className="flex gap-2">
          <button className="bg-surface-container-high/40 backdrop-blur-md border border-white/10 text-on-surface px-4 py-2 rounded-DEFAULT font-label-caps text-label-caps uppercase hover:bg-surface-variant transition-colors shadow-sm">Last 24 Hours</button>
          <button 
            onClick={handleExportReport}
            className="bg-primary/20 border border-primary/50 text-primary px-4 py-2 rounded-DEFAULT font-label-caps text-label-caps uppercase hover:bg-primary hover:text-on-primary transition-colors shadow-[0_0_15px_rgba(173,198,255,0.2)] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">download</span> Export Report
          </button>
        </div>
      </div>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-stack-lg shrink-0">
        <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl p-container-padding rounded-lg relative overflow-hidden group hover:border-white/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-[6px] h-[6px] rounded-full bg-secondary animate-pulse"></div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Total Orders</h3>
          </div>
          <div className="font-data-mono text-display-lg text-on-surface mt-2">{summary?.orders?.total?.toLocaleString() ?? '—'}</div>
          <div className="flex items-center gap-1 mt-2 text-secondary font-data-mono text-data-mono">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            <span>+8.4% vs last week</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 pointer-events-none bg-gradient-to-t from-secondary/20 to-transparent">
            <svg className="w-full h-full stroke-secondary stroke-1 fill-none" preserveAspectRatio="none" viewBox="0 0 100 30">
              <path d="M0,30 L10,25 L20,28 L30,15 L40,20 L50,10 L60,18 L70,5 L80,12 L90,2 L100,8"></path>
            </svg>
          </div>
        </div>
        
        <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl p-container-padding rounded-lg relative overflow-hidden group hover:border-white/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-[6px] h-[6px] rounded-full bg-primary animate-pulse"></div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Shipped</h3>
          </div>
          <div className="font-data-mono text-display-lg text-on-surface mt-2">{summary?.orders?.shipped?.toLocaleString() ?? '—'}</div>
          <div className="flex items-center gap-1 mt-2 text-primary font-data-mono text-data-mono">
            <span className="material-symbols-outlined text-[14px]">local_shipping</span>
            <span>{summary?.orders?.total ? Math.round((summary?.orders?.shipped / summary?.orders?.total) * 100) : 0}% Success Rate</span>
          </div>
        </div>
        
        <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl p-container-padding rounded-lg relative overflow-hidden group hover:border-error/50 hover:shadow-[0_0_20px_rgba(255,180,171,0.15)] transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-[6px] h-[6px] rounded-full bg-error"></div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Failed</h3>
          </div>
          <div className="font-data-mono text-display-lg text-error mt-2">{summary?.orders?.failed?.toLocaleString() ?? '0'}</div>
          <div className="flex items-center gap-1 mt-2 text-error font-data-mono text-data-mono">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>Needs Attention</span>
          </div>
        </div>
        
        <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl p-container-padding rounded-lg relative overflow-hidden group hover:border-white/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-[6px] h-[6px] rounded-full bg-tertiary"></div>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase">Avg. Fulfillment</h3>
          </div>
          <div className="font-data-mono text-display-lg text-on-surface mt-2">{summary?.avgFulfillmentTime ?? '—'}</div>
          <div className="flex items-center gap-1 mt-2 text-tertiary font-data-mono text-data-mono">
            <span className="material-symbols-outlined text-[14px]">timer</span>
            <span>vs Target</span>
          </div>
        </div>
      </div>
      
      {/* Middle Section: Bot Util & Microservices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mb-stack-lg shrink-0">
        {/* Bot Utilization */}
        <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-container-padding col-span-1 flex flex-col">
          <h3 className="font-title-sm text-title-sm text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">smart_toy</span> Bot Utilization
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div>
              <div className="flex justify-between font-label-caps text-label-caps uppercase mb-2">
                <span className="text-on-surface">Picking Activity</span>
                <span className="font-data-mono text-primary">{pickingPct}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(173,198,255,0.5)]" style={{ width: `${pickingPct}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between font-label-caps text-label-caps uppercase mb-2">
                <span className="text-on-surface">Idle / Charging</span>
                <span className="font-data-mono text-tertiary">{idlePct}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-tertiary rounded-full" style={{ width: `${idlePct}%` }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between font-label-caps text-label-caps uppercase mb-2">
                <span className="text-on-surface">Maintenance / Error</span>
                <span className="font-data-mono text-error">{errorPct}%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-error rounded-full" style={{ width: `${errorPct}%` }}></div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Active Bots</span>
              <span className="font-data-mono text-title-sm text-on-surface">{activeBots.length} / {bots.length || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Microservice Pulse */}
        <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-container-padding col-span-1 lg:col-span-2">
          <h3 className="font-title-sm text-title-sm text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">hub</span> Microservice Pulse
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
            {SERVICES.map((svc) => (
              <div key={svc.name} className={`bg-surface-container/30 backdrop-blur-md border p-3 rounded-DEFAULT ${svc.status === 'error' ? 'border-error/50 shadow-[0_0_15px_rgba(255,180,171,0.15)]' : svc.status === 'warn' ? 'border-tertiary/50 shadow-[0_0_15px_rgba(255,184,116,0.15)]' : 'border-white/10'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-caps text-label-caps text-on-surface uppercase truncate">{svc.name}</span>
                  <div className={`w-2 h-2 rounded-full ${svc.status === 'error' ? 'bg-error animate-pulse' : svc.status === 'warn' ? 'bg-tertiary' : 'bg-secondary'}`}></div>
                </div>
                <div className={`font-data-mono text-data-mono ${svc.status === 'error' ? 'text-error' : svc.status === 'warn' ? 'text-tertiary' : 'text-on-surface-variant'}`}>{svc.ping}</div>
                <div className="font-data-mono text-data-mono text-primary mt-1">{svc.reqs}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Detailed Event Feed */}
      <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-container-padding flex flex-col flex-1 min-h-[300px]">
        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
          <h3 className="font-title-sm text-title-sm text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">receipt_long</span> Raw Event Feed
          </h3>
          <div className="flex gap-2 items-center">
            <span className="bg-surface-container-highest text-on-surface-variant font-label-caps text-label-caps px-2 py-1 rounded">Live Tailing</span>
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto font-data-mono text-data-mono text-on-surface-variant space-y-2 pr-2 custom-scrollbar">
          {systemEvents.length === 0 && (
            <div className="text-center text-on-surface-variant/50 py-8">
              Waiting for system events...
            </div>
          )}
          {systemEvents.slice(0, 20).map((event, idx) => {
            const color = event.eventName?.includes('order') ? 'secondary'
              : event.eventName?.includes('bot') ? 'primary'
              : event.eventName?.includes('fail') || event.eventName?.includes('error') ? 'error'
              : 'tertiary';
            
            return (
              <div key={idx} className={`p-3 border-l-2 border-${color} bg-surface-container-highest/30 rounded-r`}>
                <div className="text-[11px] text-outline mb-1">
                  {event.timestamp ? new Date(event.timestamp).toISOString().replace('T', ' ').slice(0, 23) + ' UTC' : '—'}
                  {event.eventName && ` | ${event.eventName}`}
                </div>
                <pre className={`whitespace-pre-wrap text-${color}/80`}>
                  {JSON.stringify(event.data || event, null, 2)}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
