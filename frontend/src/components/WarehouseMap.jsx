import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RACKS, STATIONS, ROADS, COLORS, FLOOR_BOUNDS, DEMO_BOTS,
  SVG_WIDTH, SVG_HEIGHT,
  gridToSVG, mapBotStatus, getStatusColor,
} from '../data/warehouseData';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const DEFAULT_VIEWBOX = { x: 0, y: 0, w: SVG_WIDTH, h: SVG_HEIGHT };
const MIN_ZOOM = 0.4;
const ZOOM_STEP = 0.15;

/* ═══════════════════════════════════════════════════════════════════
   HELPER: Route color by backend status
   ═══════════════════════════════════════════════════════════════════ */

function getRouteStyle(status) {
  const s = typeof status === 'string' ? status : 'idle';
  if (s === 'picking' || s === 'assigned' || s === 'busy') {
    return { stroke: COLORS.routeActive, dasharray: '8,5', animate: true };
  }
  if (s === 'returning') {
    return { stroke: COLORS.routeReturn, dasharray: '6,4', animate: true };
  }
  return { stroke: COLORS.routeIdle, dasharray: '4,4', animate: false };
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENT: Road / Aisle Layer
   ═══════════════════════════════════════════════════════════════════ */

function RoadLayer() {
  const { perimeter, horizontal, vertical } = ROADS;
  return (
    <g className="road-lanes">
      {/* Perimeter road */}
      <rect
        x={perimeter.x} y={perimeter.y}
        width={perimeter.w} height={perimeter.h}
        rx={12} ry={12}
        fill="none"
        stroke={COLORS.road}
        strokeWidth={perimeter.strokeWidth}
        opacity={0.35}
      />

      {/* Horizontal aisles */}
      {horizontal.map((r, i) => (
        <rect
          key={`h-${i}`}
          x={r.x} y={r.y} width={r.w} height={r.h}
          rx={4} ry={4}
          fill={COLORS.road}
          opacity={0.45}
        />
      ))}

      {/* Vertical aisles */}
      {vertical.map((r, i) => (
        <rect
          key={`v-${i}`}
          x={r.x} y={r.y} width={r.w} height={r.h}
          rx={4} ry={4}
          fill={COLORS.road}
          opacity={0.45}
        />
      ))}
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENT: Rack
   ═══════════════════════════════════════════════════════════════════ */

function Rack({ rack }) {
  return (
    <g>
      <rect
        x={rack.x}
        y={rack.y}
        width={rack.w}
        height={rack.h}
        rx={5}
        ry={5}
        fill={COLORS.rack}
        stroke={COLORS.rackBorder}
        strokeWidth={1}
      />
      <text
        x={rack.x + rack.w / 2}
        y={rack.y + rack.h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={COLORS.rackLabel}
        fontSize={12}
        fontWeight={700}
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {rack.id}
      </text>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENT: Station Landmark
   Rendered as a solid card with colored left accent border.
   ═══════════════════════════════════════════════════════════════════ */

function StationLandmark({ station }) {
  const cardW = 130;
  const cardH = 34;
  return (
    <g>
      {/* Card background */}
      <rect
        x={station.x}
        y={station.y}
        width={cardW}
        height={cardH}
        rx={6} ry={6}
        fill="rgba(16, 30, 46, 0.9)"
        stroke={station.color}
        strokeWidth={0}
      />
      {/* Left accent bar */}
      <rect
        x={station.x}
        y={station.y}
        width={4}
        height={cardH}
        rx={2} ry={0}
        fill={station.color}
      />
      {/* Subtle glow under the card */}
      <rect
        x={station.x + 2}
        y={station.y + cardH - 2}
        width={cardW - 4}
        height={3}
        rx={1}
        fill={station.color}
        opacity={0.15}
      />
      {/* Icon */}
      <text
        x={station.x + 18}
        y={station.y + cardH / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        style={{ pointerEvents: 'none' }}
      >
        {station.icon}
      </text>
      {/* Label */}
      <text
        x={station.x + 32}
        y={station.y + cardH / 2}
        textAnchor="start"
        dominantBaseline="central"
        fill="#c8d6e5"
        fontSize={10}
        fontWeight={600}
        fontFamily="'Inter', sans-serif"
        letterSpacing="0.03em"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {station.label}
      </text>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENT: Route polyline
   Accepts waypoints as [[x,y], …] in SVG space
   ═══════════════════════════════════════════════════════════════════ */

function RoutePolyline({ waypoints, status }) {
  if (!waypoints || waypoints.length < 2) return null;
  const { stroke, dasharray, animate } = getRouteStyle(status);
  const points = waypoints.map(p => {
    // Support both [x,y] array and {x,y} object
    const px = Array.isArray(p) ? p[0] : p.x;
    const py = Array.isArray(p) ? p[1] : p.y;
    return `${px},${py}`;
  }).join(' ');

  return (
    <polyline
      points={points}
      fill="none"
      stroke={stroke}
      strokeWidth={2.5}
      strokeDasharray={dasharray}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.8}
      className={animate ? 'route-march' : ''}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENT: Destination pulse marker
   ═══════════════════════════════════════════════════════════════════ */

function DestinationMarker({ destination }) {
  if (!destination) return null;
  const cx = Array.isArray(destination) ? destination[0] : destination.x;
  const cy = Array.isArray(destination) ? destination[1] : destination.y;
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} className="dest-pulse-ring" />
      <circle cx={cx} cy={cy} r={6} className="dest-pulse-ring dest-pulse-ring--delay" />
      <circle cx={cx} cy={cy} r={3.5} fill={COLORS.destPulse} opacity={0.9} />
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENT: Bot icon (animated with Framer Motion)
   ═══════════════════════════════════════════════════════════════════ */

function BotMarker({ bot, svgX, svgY, displayStatus, onClick }) {
  const color = getStatusColor(displayStatus);
  const label = (bot.bot_code || bot.id || '?')
    .replace('BOT-0', '')
    .replace('BOT-', '')
    .replace('demo-', '');

  return (
    <motion.g
      initial={false}
      animate={{ x: svgX, y: svgY }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => onClick?.(bot.id)}
      style={{ cursor: 'pointer' }}
    >
      {/* Outer halo glow */}
      <circle
        cx={0} cy={0} r={16}
        fill={color}
        opacity={0.15}
        className="bot-halo"
      />
      <circle
        cx={0} cy={0} r={22}
        fill="none"
        stroke={color}
        strokeWidth={1}
        opacity={0.1}
        className="bot-halo"
      />
      {/* Bot body */}
      <circle
        cx={0} cy={0} r={10}
        fill={color}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={1.5}
        filter="url(#botGlow)"
      />
      {/* Label */}
      <text
        x={0} y={1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={8}
        fontWeight={700}
        fontFamily="'JetBrains Mono', monospace"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>
    </motion.g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT: WarehouseMap
   ═══════════════════════════════════════════════════════════════════ */

export default function WarehouseMap({ bots = [], botPositions = {}, onBotClick }) {
  /* ─── Zoom/pan state ──────────────────────────────────────────── */
  const [viewBox, setViewBox] = useState({ ...DEFAULT_VIEWBOX });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vbx: 0, vby: 0 });
  const svgRef = useRef(null);

  /* ─── Zoom with mouse wheel ──────────────────────────────────── */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setViewBox(vb => {
      const zoomDir = e.deltaY < 0 ? -1 : 1;
      const factor = 1 + ZOOM_STEP * zoomDir;
      const newW = Math.max(SVG_WIDTH * MIN_ZOOM, Math.min(SVG_WIDTH / MIN_ZOOM, vb.w * factor));
      const newH = Math.max(SVG_HEIGHT * MIN_ZOOM, Math.min(SVG_HEIGHT / MIN_ZOOM, vb.h * factor));

      const svg = svgRef.current;
      if (svg) {
        const rect = svg.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width;
        const my = (e.clientY - rect.top) / rect.height;
        return {
          x: vb.x + (vb.w - newW) * mx,
          y: vb.y + (vb.h - newH) * my,
          w: newW,
          h: newH,
        };
      }
      return { x: vb.x, y: vb.y, w: newW, h: newH };
    });
  }, []);

  /* ─── Pan handlers ───────────────────────────────────────────── */
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, vbx: viewBox.x, vby: viewBox.y };
  }, [viewBox]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = ((e.clientX - panStart.current.x) / rect.width) * viewBox.w;
    const dy = ((e.clientY - panStart.current.y) / rect.height) * viewBox.h;
    setViewBox(vb => ({
      ...vb,
      x: panStart.current.vbx - dx,
      y: panStart.current.vby - dy,
    }));
  }, [isPanning, viewBox.w, viewBox.h]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseUp, handleMouseMove]);

  /* ─── Zoom buttons ───────────────────────────────────────────── */
  const zoomIn = useCallback(() => {
    setViewBox(vb => {
      const factor = 1 - ZOOM_STEP;
      const newW = Math.max(SVG_WIDTH * MIN_ZOOM, vb.w * factor);
      const newH = Math.max(SVG_HEIGHT * MIN_ZOOM, vb.h * factor);
      return {
        x: vb.x + (vb.w - newW) / 2,
        y: vb.y + (vb.h - newH) / 2,
        w: newW,
        h: newH,
      };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setViewBox(vb => {
      const factor = 1 + ZOOM_STEP;
      const newW = Math.min(SVG_WIDTH / MIN_ZOOM, vb.w * factor);
      const newH = Math.min(SVG_HEIGHT / MIN_ZOOM, vb.h * factor);
      return {
        x: vb.x + (vb.w - newW) / 2,
        y: vb.y + (vb.h - newH) / 2,
        w: newW,
        h: newH,
      };
    });
  }, []);

  /* ─── Pan buttons ────────────────────────────────────────────── */
  const panDirection = useCallback((dx, dy) => {
    setViewBox(vb => ({
      ...vb,
      x: vb.x + dx * vb.w * 0.2,
      y: vb.y + dy * vb.h * 0.2,
    }));
  }, []);

  const resetView = useCallback(() => {
    setViewBox({ ...DEFAULT_VIEWBOX });
  }, []);

  /* ─── Resolve bots: use real data or fall back to demo bots ──── */
  const resolvedBots = useMemo(() => {
    // If we have real bots from the backend, use them
    if (bots.length > 0) {
      return bots.map(bot => {
        const bc = botPositions[bot.id];
        const x = bc?.x ?? bot.x_position ?? 0;
        const y = bc?.y ?? bot.y_position ?? 0;
        const backendStatus = bc?.status ?? bot.status ?? 'idle';
        const displayStatus = mapBotStatus(backendStatus);
        const path = bc?.path || bot.route || null;
        const destination = bc?.destination ?? bot.destination ?? null;
        const [svgX, svgY] = gridToSVG(x, y);

        // Convert grid-based route to SVG coords
        let svgRoute = null;
        if (path && path.length > 1) {
          svgRoute = path.map(p => {
            const [rx, ry] = gridToSVG(p.x, p.y);
            return [rx, ry];
          });
        }

        let svgDest = null;
        if (destination) {
          const [dx, dy] = gridToSVG(destination.x, destination.y);
          svgDest = [dx, dy];
        }

        return {
          ...bot, svgX, svgY, displayStatus, backendStatus,
          svgRoute, svgDest,
        };
      });
    }

    // Fallback: use demo bots (always visible when disconnected)
    return DEMO_BOTS.map(bot => ({
      ...bot,
      svgX: bot._svgX,
      svgY: bot._svgY,
      displayStatus: mapBotStatus(bot.status),
      backendStatus: bot.status,
      svgRoute: bot.route,
      svgDest: bot.destination,
    }));
  }, [bots, botPositions]);

  /* ─── Render ──────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full w-full">
      {/* Title Bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-outline-variant bg-surface-container-high/50">
        <span className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider">Warehouse Map</span>
        <button
          className="text-on-surface-variant hover:text-primary font-data-mono text-[11px] transition-colors"
          onClick={resetView}
        >
          Reset View
        </button>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 overflow-hidden">
        {/* Zoom and Pan Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-4">
          {/* Zoom */}
          <div className="flex flex-col gap-1 shadow-md">
            <button
              className="w-8 h-8 bg-surface-container-high border border-outline-variant rounded-t text-on-surface hover:bg-surface-bright hover:text-primary transition-colors flex items-center justify-center font-mono text-lg"
              onClick={zoomIn}
              title="Zoom In"
            >+</button>
            <button
              className="w-8 h-8 bg-surface-container-high border border-outline-variant border-t-0 rounded-b text-on-surface hover:bg-surface-bright hover:text-primary transition-colors flex items-center justify-center font-mono text-lg"
              onClick={zoomOut}
              title="Zoom Out"
            >−</button>
          </div>
          
          {/* Pan */}
          <div className="grid grid-cols-3 gap-1 shadow-md p-1 bg-surface-container-high border border-outline-variant rounded">
            <div />
            <button
              className="w-6 h-6 bg-surface border border-outline-variant rounded text-on-surface hover:bg-surface-bright hover:text-primary transition-colors flex items-center justify-center text-xs"
              onClick={() => panDirection(0, -1)}
              title="Pan Up"
            >▲</button>
            <div />
            <button
              className="w-6 h-6 bg-surface border border-outline-variant rounded text-on-surface hover:bg-surface-bright hover:text-primary transition-colors flex items-center justify-center text-xs"
              onClick={() => panDirection(-1, 0)}
              title="Pan Left"
            >◀</button>
            <button
              className="w-6 h-6 bg-surface border border-outline-variant rounded text-on-surface hover:bg-surface-bright hover:text-primary transition-colors flex items-center justify-center text-xs"
              onClick={() => panDirection(0, 1)}
              title="Pan Down"
            >▼</button>
            <button
              className="w-6 h-6 bg-surface border border-outline-variant rounded text-on-surface hover:bg-surface-bright hover:text-primary transition-colors flex items-center justify-center text-xs"
              onClick={() => panDirection(1, 0)}
              title="Pan Right"
            >▶</button>
          </div>
        </div>

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
          className={`w-full h-full warehouse-svg ${isPanning ? 'warehouse-svg--panning' : ''}`}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        >
          {/* ── Defs ──────────────────────────────────────────── */}
          <defs>
            <filter id="botGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── LAYER 0: Floor background ─────────────────────── */}
          <rect
            x={FLOOR_BOUNDS.x} y={FLOOR_BOUNDS.y}
            width={FLOOR_BOUNDS.w} height={FLOOR_BOUNDS.h}
            rx={12} ry={12}
            fill={COLORS.floorFill}
            stroke={COLORS.boundary}
            strokeWidth={1.5}
          />

          {/* ── LAYER 1: Road / aisle network ─────────────────── */}
          <RoadLayer />

          {/* ── LAYER 2: Racks ────────────────────────────────── */}
          {RACKS.map(rack => (
            <Rack key={rack.id} rack={rack} />
          ))}

          {/* ── LAYER 3: Stations ─────────────────────────────── */}
          {STATIONS.map(station => (
            <StationLandmark key={station.id} station={station} />
          ))}

          {/* ── LAYER 4: Route polylines ──────────────────────── */}
          {resolvedBots.map(bot => (
            <RoutePolyline
              key={`route-${bot.id}`}
              waypoints={bot.svgRoute}
              status={bot.backendStatus}
            />
          ))}

          {/* ── LAYER 5: Destination markers ──────────────────── */}
          {resolvedBots.map(bot => (
            <DestinationMarker
              key={`dest-${bot.id}`}
              destination={bot.svgDest}
            />
          ))}

          {/* ── LAYER 6: Bot markers (top layer) ──────────────── */}
          <AnimatePresence>
            {resolvedBots.map(bot => (
              <BotMarker
                key={bot.id}
                bot={bot}
                svgX={bot.svgX}
                svgY={bot.svgY}
                displayStatus={bot.displayStatus}
                onClick={onBotClick}
              />
            ))}
          </AnimatePresence>
        </svg>
      </div>

      {/* Legend Bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-outline-variant bg-surface-container-high/30 text-on-surface-variant">
        <span className="font-label-caps text-[10px] uppercase tracking-wider">Legend:</span>
        <span className="flex items-center gap-1 text-xs">🤖 Bot</span>
        <span className="flex items-center gap-1 text-xs">
          <span className="w-4 h-0 border-t-2 border-dashed border-primary" /> Active Route
        </span>
        <span className="flex items-center gap-1 text-xs">
          <span className="w-2 h-2 rounded-full border border-primary/50 bg-primary/20" /> Destination
        </span>
        <span className="flex items-center gap-1 text-xs">
          <span className="w-3 h-2 rounded-sm bg-surface-bright border border-outline-variant" /> Rack
        </span>
      </div>
    </div>
  );
}
