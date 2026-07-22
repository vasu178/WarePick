import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalytics } from '../hooks/useWarePick';

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

  // Show up to 5 bots in status
  const displayBots = bots.slice(0, 5);

  // Fake live events for visual flair, matching the static design but you can plug real ones later
  const events = [
    { time: '10:24:10', text: 'BOT-02 picked SKU-1001 at C2', color: 'text-secondary' },
    { time: '10:23:48', text: 'BOT-02 arrived at Aisle C – C2', color: 'text-secondary' },
    { time: '10:22:31', text: 'BOT-01 picked SKU-2003 at A1', color: 'text-primary' },
    { time: '10:21:55', text: 'BOT-03 started moving to Packing', color: 'text-tertiary' },
    { time: '10:21:20', text: 'Order ORD-10432 assigned to BOT-02', color: 'text-primary' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full bg-background">
      {/* Header */}
      <header className="h-16 flex items-center px-6 border-b border-outline-variant bg-surface-container-high/90 backdrop-blur-sm z-10 shrink-0">
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
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex-1 relative overflow-hidden flex items-center justify-center">
            
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button 
                onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
                className="w-8 h-8 bg-surface border border-outline-variant rounded flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
                title="Zoom In"
              >
                <i className="fa-solid fa-plus"></i>
              </button>
              <button 
                onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
                className="w-8 h-8 bg-surface border border-outline-variant rounded flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
                title="Zoom Out"
              >
                <i className="fa-solid fa-minus"></i>
              </button>
              <button 
                onClick={() => { setZoom(1); setPanX(0); setPanY(0); }}
                className="w-8 h-8 bg-surface border border-outline-variant rounded flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm text-xs font-semibold"
                title="Reset Zoom"
              >
                1x
              </button>
            </div>

            {/* SVG Interactive Map */}
            <svg
              className={`w-full h-full transition-all ease-out ${isDragging ? 'cursor-grabbing duration-0' : 'cursor-grab duration-300'}`}
              viewBox={viewBox}
              xmlns="http://www.w3.org/2000/svg"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <defs>
                <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#414755" strokeWidth="0.5"></path>
                </pattern>
                {/* Arrowhead markers for routes */}
                <marker id="arrow-bot1" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="8" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#adc6ff"></path>
                </marker>
                <marker id="arrow-bot2" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="8" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#53e16f"></path>
                </marker>
                <marker id="arrow-bot3" markerHeight="6" markerWidth="6" orient="auto-start-reverse" refX="8" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffb874"></path>
                </marker>
              </defs>
              
              {/* Background Grid */}
              <rect fill="url(#grid)" height="100%" width="100%" x={viewBoxX} y={viewBoxY}></rect>
              
              {/* Zones */}
              <rect className="zone-border" fill="none" height="48" stroke="#8b90a0" width="544" x="144" y="16"></rect>
              <text className="zone-text" fill="#c1c6d7" fontSize="12" textAnchor="middle" x="416" y="44">INBOUND / RECEIVING</text>
              <path d="M 416 64 L 416 74" markerEnd="url(#arrow-bot1)" stroke="#8b90a0" strokeWidth="2"></path>
              
              <rect className="zone-border" fill="none" height="60" stroke="#ffb874" width="300" x="266" y="572"></rect>
              <text className="zone-text" fill="#ffb874" fontSize="12" textAnchor="middle" x="416" y="592">PACKING STATION</text>
              <rect fill="#31353d" height="20" rx="2" stroke="#ffb874" strokeWidth="1" width="40" x="346" y="602"></rect>
              <text fill="#ffb874" fontFamily="Inter" fontSize="8" textAnchor="middle" x="366" y="613">P1</text>
              <rect fill="#31353d" height="20" rx="2" stroke="#ffb874" strokeWidth="1" width="40" x="446" y="602"></rect>
              <text fill="#ffb874" fontFamily="Inter" fontSize="8" textAnchor="middle" x="466" y="613">P2</text>
              
              <rect className="zone-border" fill="none" height="60" stroke="#adc6ff" width="140" x="740" y="572"></rect>
              <text className="zone-text" fill="#adc6ff" fontSize="12" textAnchor="middle" x="810" y="592">SHIPPING AREA</text>
              <path d="M 795 607 L 815 607 L 815 597 L 835 597 L 835 617 L 785 617 Z" fill="none" stroke="#adc6ff" strokeWidth="2"></path>
              <circle cx="800" cy="622" fill="#adc6ff" r="4"></circle>
              <circle cx="825" cy="622" fill="#adc6ff" r="4"></circle>
              
              {/* Racks */}
              {/* Aisle A (x=144) */}
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="144" y="144"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="176" y="180">A1</text>
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="144" y="288"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="176" y="324">A2</text>
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="144" y="432"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="176" y="468">A3</text>
              
              {/* Aisle B (x=304) */}
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="304" y="144"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="336" y="180">B1</text>
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="304" y="288"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="336" y="324">B2</text>
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="304" y="432"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="336" y="468">B3</text>
              
              {/* Aisle C (x=464) */}
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="464" y="144"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="496" y="180">C1</text>
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="464" y="288"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="496" y="324">C2</text>
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="464" y="432"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="496" y="468">C3</text>
              
              {/* Aisle D (x=624) */}
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="624" y="144"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="656" y="180">D1</text>
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="624" y="288"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="656" y="324">D2</text>
              <rect className="rack-bg" fill="#363942" height="64" stroke="#414755" width="64" x="624" y="432"></rect>
              <text className="rack-text" fill="#e0e2ed" fontWeight="bold" textAnchor="middle" x="656" y="468">D3</text>
              
              {/* Dynamic Bots */}
              <AnimatePresence>
                {bots.map(bot => (
                  <DynamicBot 
                    key={bot.id} 
                    bot={bot} 
                    position={botPositions[bot.id]} 
                    onClick={onBotClick}
                  />
                ))}
              </AnimatePresence>
            </svg>
          </div>
          
          {/* Bottom Metrics */}
          <div className="grid grid-cols-5 gap-3 shrink-0">
            <div className="bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <i className="fa-solid fa-clipboard-check"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate">Total Orders</div>
                <div className="text-lg font-semibold text-on-surface leading-tight">{summary?.orders?.total ?? 0}</div>
                <div className="text-[10px] text-on-surface-variant">Today</div>
              </div>
            </div>
            
            <div className="bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <i className="fa-solid fa-check-circle"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate">Completed</div>
                <div className="text-lg font-semibold text-on-surface leading-tight">{summary?.orders?.shipped ?? 0}</div>
                <div className="text-[10px] text-on-surface-variant flex items-center gap-1">Today <span className="text-secondary text-[9px]"><i className="fa-solid fa-arrow-up"></i> 18%</span></div>
              </div>
            </div>
            
            <div className="bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <i className="fa-solid fa-clock"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate">In Progress</div>
                <div className="text-lg font-semibold text-on-surface leading-tight">{summary?.orders?.inProgress ?? 0}</div>
                <div className="text-[10px] text-on-surface-variant flex items-center gap-1">Today <span className="text-secondary text-[9px]"><i className="fa-solid fa-arrow-up"></i> 5%</span></div>
              </div>
            </div>
            
            <div className="bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-error/10 flex items-center justify-center text-error">
                <i className="fa-solid fa-times-circle"></i>
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate">Failed</div>
                <div className="text-lg font-semibold text-on-surface leading-tight">{summary?.orders?.failed ?? 0}</div>
                <div className="text-[10px] text-on-surface-variant flex items-center gap-1">Today <span className="text-error text-[9px]"><i className="fa-solid fa-arrow-down"></i> 50%</span></div>
              </div>
            </div>
            
            <div className="bg-surface border border-outline-variant rounded-xl p-3 flex items-center gap-3">
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
          <div className="bg-surface border border-outline-variant rounded-xl p-4">
            <h2 className="text-xs font-bold text-on-surface-variant tracking-wider mb-4 uppercase">Bot Status</h2>
            <div className="space-y-4">
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
          <div className="bg-surface border border-outline-variant rounded-xl p-5">
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
          <div className="bg-surface border border-outline-variant rounded-xl p-5 flex-1 flex flex-col min-h-[200px]">
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
