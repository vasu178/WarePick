import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalytics } from '../hooks/useWarePick';
import WarehouseCanvas from '../components/3d/WarehouseCanvas';

/**
 * Convert backend grid coordinates (21x17) to the new 800x600 SVG space.
 */
function gridToNewSVG(gx, gy) {
  // New mapping: aisles at gx=2,6,10,14,18 map to 96, 256, 416, 576, 736.
  let svgY = 64 + (gy || 0) * 32;
  
  if (gy === 14) {
    svgY = 534; // Center between 3rd shelf row (y=496) and packing station (y=572)
  } else if (gy === 15) {
    svgY = 602; // Center inside packing/shipping station
  }
  
  return [gx * 40 + 16, svgY];
}

function getBotColorToken(botCode) {
  if (!botCode) return 'primary';
  if (botCode.includes('1')) return 'primary';
  if (botCode.includes('2')) return 'secondary';
  if (botCode.includes('3')) return 'tertiary';
  if (botCode.includes('4')) return 'accent';
  if (botCode.includes('5')) return 'warning';
  return 'primary';
}

function getHexColor(colorStr) {
  if (colorStr === 'primary') return '#adc6ff';
  if (colorStr === 'secondary') return '#53e16f';
  if (colorStr === 'tertiary') return '#ffb874';
  if (colorStr === 'accent') return '#e879f9';
  if (colorStr === 'warning') return '#fde047';
  if (colorStr === 'error') return '#ffb4ab';
  return '#c1c6d7'; // default
}

function DynamicBot({ bot, position, onClick }) {
  const [svgX, svgY] = gridToNewSVG(position?.x ?? bot?.x_position, position?.y ?? bot?.y_position);
  const statusStr = position?.status ?? bot?.status ?? 'idle';
  const colorToken = getBotColorToken(bot?.bot_code);
  const colorHex = getHexColor(colorToken);
  
  const botCode = (bot?.bot_code || bot?.id || '?').replace('BOT-', '').replace('0', '');

  const [trail, setTrail] = React.useState([]);

  React.useEffect(() => {
    if (statusStr === 'idle') {
      setTrail([]);
    } else {
      setTrail(prev => {
        const last = prev[prev.length - 1];
        if (!last || last.x !== svgX || last.y !== svgY) {
          return [...prev, { x: svgX, y: svgY }];
        }
        return prev;
      });
    }
  }, [svgX, svgY, statusStr]);

  return (
    <>
      {trail.length > 1 && (
        <polyline 
          points={trail.map(p => `${p.x},${p.y}`).join(' ')} 
          fill="none" 
          stroke={colorHex} 
          strokeWidth="3"
          opacity="0.4"
          strokeDasharray="4 4"
        />
      )}
      <motion.g
        initial={false}
        animate={{ x: svgX, y: svgY }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        onClick={() => onClick && onClick(bot.id)}
        style={{ cursor: 'pointer' }}
      >
        <circle cx="0" cy="0" fill="#1c2028" r="16" stroke={colorHex} strokeWidth="2"></circle>
        <circle cx="0" cy="0" fill="none" opacity="0.3" r="20" stroke={colorHex} strokeWidth="1"></circle>
        <text fill={colorHex} fontFamily="Inter" fontSize="10" fontWeight="bold" textAnchor="middle" x="0" y="28">BOT-{botCode}</text>
        <rect fill="none" height="10" rx="2" stroke={colorHex} strokeWidth="1.5" width="12" x="-6" y="-5"></rect>
        <circle cx="-3" cy="-1" fill={colorHex} r="1"></circle>
        <circle cx="3" cy="-1" fill={colorHex} r="1"></circle>
        <line stroke={colorHex} strokeWidth="1" x1="-3" x2="3" y1="3" y2="3"></line>
        <line stroke={colorHex} strokeWidth="1.5" x1="0" x2="0" y1="-5" y2="-8"></line>
        <circle cx="0" cy="-9" fill={colorHex} r="1.5"></circle>
      </motion.g>
    </>
  );
}

export default function WarehouseFloorPage({ bots = [], botPositions = {}, orders = [], onBotClick }) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = React.useRef({ x: 0, y: 0 });
  const summary = useAnalytics(4000);

  const mapWidth = 900;
  const mapHeight = 660;
  const viewBoxWidth = mapWidth / zoom;
  const viewBoxHeight = mapHeight / zoom;
  const viewBoxX = (mapWidth - viewBoxWidth) / 2 + panX;
  const viewBoxY = (mapHeight - viewBoxHeight) / 2 + panY;
  const viewBox = `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;

  const panDirection = (dx, dy) => {
    setPanX(prev => prev + dx * viewBoxWidth * 0.2);
    setPanY(prev => prev + dy * viewBoxHeight * 0.2);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPanX(prev => prev - dx * 1.5 / zoom);
    setPanY(prev => prev - dy * 1.5 / zoom);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    // Zoom in on scroll up, zoom out on scroll down
    const zoomDir = e.deltaY < 0 ? 1 : -1;
    setZoom(prev => {
      const newZoom = prev + zoomDir * 0.15;
      return Math.max(0.5, Math.min(newZoom, 3));
    });
  };

  // Metrics calculation
  const activeBots = bots.filter(b => ['picking', 'assigned', 'busy'].includes(b.status));
  const activeOrder = (orders || []).find(o => ['picking', 'assigned', 'checking_inventory'].includes(o.status));

  const formatAvgTime = (sec) => {
    if (!sec) return '—';
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  // Show all bots in status
  const displayBots = bots;

  // Fake live events for visual flair, matching the static design but you can plug real ones later
  const events = [
    { time: '10:24:10', text: 'BOT-02 picked SKU-1001 at C2', color: 'text-secondary' },
    { time: '10:23:48', text: 'BOT-02 arrived at Aisle C – C2', color: 'text-secondary' },
    { time: '10:22:31', text: 'BOT-01 picked SKU-2003 at A1', color: 'text-primary' },
    { time: '10:21:55', text: 'BOT-03 started moving to Packing', color: 'text-tertiary' },
    { time: '10:21:20', text: 'Order ORD-10432 assigned to BOT-02', color: 'text-primary' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full bg-transparent">
      {/* Header */}
      <header className="h-16 flex items-center px-6 border-b border-white/10 bg-surface-container-high/30 backdrop-blur-md shadow-sm z-10 shrink-0">
        <button className="mr-4 text-on-surface-variant hover:text-on-surface md:hidden">
          <i className="fa-solid fa-bars text-lg"></i>
        </button>
        <h1 className="text-lg font-semibold flex items-center gap-3 text-on-surface">
          Warehouse Map – Live Bot Tracking
          <span className="flex items-center gap-1 text-xs font-normal text-secondary bg-secondary-container px-2 py-0.5 rounded-full border border-secondary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span> Live
          </span>
        </h1>
      </header>
      
      {/* Content Layout */}
      <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Central Map Area */}
        <div className="flex-1 flex flex-col gap-6 min-h-0">
          <div className="flex-1 min-h-0 relative w-full overflow-hidden rounded-xl border border-white/10 bg-surface/40 backdrop-blur-md shadow-xl">
            <WarehouseCanvas
              bots={bots}
              botPositions={botPositions}
              orders={orders}
              onBotClick={onBotClick}
            />
          </div>
          
          {/* Bottom Metrics */}
          <div className="grid grid-cols-5 gap-3 shrink-0">
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <i className="fa-solid fa-clipboard-check"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate">Total Orders</div>
                <div className="text-lg font-semibold text-on-surface leading-tight">{summary?.orders?.total ?? 0}</div>
                <div className="text-[10px] text-on-surface-variant">Today</div>
              </div>
            </div>
            
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <i className="fa-solid fa-check-circle"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate">Completed</div>
                <div className="text-lg font-semibold text-on-surface leading-tight">{summary?.orders?.shipped ?? 0}</div>
                <div className="text-[10px] text-on-surface-variant flex items-center gap-1">Today <span className="text-secondary text-[9px]"><i className="fa-solid fa-arrow-up"></i> 18%</span></div>
              </div>
            </div>
            
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <i className="fa-solid fa-clock"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate">In Progress</div>
                <div className="text-lg font-semibold text-on-surface leading-tight">{summary?.orders?.inProgress ?? 0}</div>
                <div className="text-[10px] text-on-surface-variant flex items-center gap-1">Today <span className="text-secondary text-[9px]"><i className="fa-solid fa-arrow-up"></i> 5%</span></div>
              </div>
            </div>
            
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-error/10 flex items-center justify-center text-error">
                <i className="fa-solid fa-times-circle"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate">Failed</div>
                <div className="text-lg font-semibold text-on-surface leading-tight">{summary?.orders?.failed ?? 0}</div>
                <div className="text-[10px] text-on-surface-variant flex items-center gap-1">Today <span className="text-error text-[9px]"><i className="fa-solid fa-arrow-down"></i> 50%</span></div>
              </div>
            </div>
            
            <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                <i className="fa-solid fa-stopwatch"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate">Avg Pick Time</div>
                <div className="text-lg font-semibold text-on-surface leading-tight">{formatAvgTime(summary?.avgFulfillmentTimeSec)}</div>
                <div className="text-[10px] text-on-surface-variant">Per Order</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar Area */}
        <div className="w-full lg:w-72 flex flex-col gap-4 shrink-0 min-h-0">
          {/* Bot Status Card */}
          <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-4 flex flex-col max-h-[200px]">
            <h2 className="text-xs font-bold text-on-surface-variant tracking-wider mb-4 uppercase shrink-0">Bot Status</h2>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {displayBots.map(bot => {
                const liveStatus = botPositions[bot.id]?.status || bot.status;
                const isActive = ['picking', 'assigned', 'busy'].includes(liveStatus);
                const isDeliveringPacking = liveStatus === 'delivering_to_packing';
                const isDeliveringShipping = liveStatus === 'delivering_to_shipping';
                const isReturning = liveStatus === 'returning';
                
                const colorToken = getBotColorToken(bot.bot_code);

                const pct = (isActive || isDeliveringPacking || isDeliveringShipping) ? 72 : isReturning ? 45 : 100;
                
                return (
                  <div key={bot.id}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-${colorToken}/20 flex items-center justify-center border border-${colorToken}/50`}>
                          <i className={`fa-solid fa-robot text-${colorToken} text-xs`}></i>
                        </div>
                        <div>
                          <div className={`font-medium text-${colorToken}`}>{bot.bot_code}</div>
                          <div className="text-xs text-on-surface-variant capitalize">{liveStatus?.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-on-surface">{pct}%</div>
                    </div>
                    <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div className={`h-full bg-${colorToken}`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {displayBots.length === 0 && (
                <div className="text-on-surface-variant text-xs text-center py-4">No bots connected</div>
              )}
            </div>
          </div>
          
          {/* Current Order Card */}
          <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-5">
            <h2 className="text-xs font-bold text-on-surface-variant tracking-wider mb-4 uppercase">Current Order</h2>
            {activeOrder ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Order ID</span>
                  <span className="text-primary font-medium">{activeOrder.id?.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Status</span>
                  <span className="text-secondary capitalize">{activeOrder.status?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Items</span>
                  <span className="text-on-surface">3 / 5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Assigned Bot</span>
                  <span className="text-secondary">{activeOrder.assigned_bot_id ? `BOT-${activeOrder.assigned_bot_id.slice(0,4)}` : 'Pending'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Destination</span>
                  <span className="text-tertiary">{activeOrder.destination || 'Packing Station'}</span>
                </div>
              </div>
            ) : (
              <div className="text-on-surface-variant text-xs text-center py-4">No active orders</div>
            )}
          </div>
          
          {/* Live Events Card */}
          <div className="bg-surface/40 backdrop-blur-md border border-white/10 shadow-xl rounded-xl p-5 flex-1 flex flex-col min-h-[200px]">
            <h2 className="text-xs font-bold text-on-surface-variant tracking-wider mb-4 uppercase">Live Events</h2>
            <div className="space-y-3 overflow-y-auto pr-2 text-xs flex-1 custom-scrollbar">
              {events.map((ev, i) => (
                <div key={i} className="flex gap-3">
                  <span className={`${ev.color} shrink-0`}>{ev.time}</span>
                  <span className="text-on-surface-variant">{ev.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
