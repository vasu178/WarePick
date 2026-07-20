/**
 * warehouseData.js
 *
 * Layout constants and mock data for the SVG-based warehouse floor plan.
 * SVG coordinate system: viewBox 0 0 720 520
 *
 * Rack IDs R1–R6 map to existing backend shelf codes:
 *   R1 → A1, R2 → A2, R5 → B1, R6 → B2, R9 → C1, R10 → C2
 */

/* ═══════════════════════════════════════════════════════════════════
   LAYOUT CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

export const SVG_WIDTH = 720;
export const SVG_HEIGHT = 520;

export const FLOOR_BOUNDS = { x: 30, y: 25, w: 660, h: 470 };

export const COLORS = {
  floor: '#0d1b2a',
  floorFill: '#131f2e',
  road: '#1e3a5f',
  rack: '#1e3a4a',
  rackBorder: '#2e5068',
  rackLabel: '#94b8cc',
  boundary: '#1a3048',
  // Bot halos
  idle: '#22c55e',
  busy: '#3b82f6',
  charging: '#eab308',
  offline: '#64748b',
  // Route colors
  routeActive: '#3b82f6',
  routeReturn: '#f97316',
  routeIdle: '#22c55e',
  // Station colors
  packing: '#a855f7',
  shipping: '#3b82f6',
  chargingStation: '#22c55e',
  // Destination pulse
  destPulse: '#22d3ee',
};

/* ═══════════════════════════════════════════════════════════════════
   STATUS MAPPING
   Backend statuses → display statuses for the map
   ═══════════════════════════════════════════════════════════════════ */

export function mapBotStatus(backendStatus) {
  switch (backendStatus) {
    case 'idle':
      return 'idle';
    case 'assigned':
    case 'picking':
    case 'returning':
      return 'busy';
    case 'charging':
      return 'charging';
    case 'offline':
    default:
      return 'offline';
  }
}

export function getStatusColor(displayStatus) {
  return COLORS[displayStatus] || COLORS.offline;
}

/* ═══════════════════════════════════════════════════════════════════
   RACKS  (R1–R17)
   Organic clusters matching the reference warehouse layout.
   ═══════════════════════════════════════════════════════════════════ */

const RW = 80;    // standard rack width
const RH = 48;    // standard rack height

export const RACKS = [
  // ── Top row — R1, R2, R3, R4  ────────────────────────────────
  { id: 'R1',  x: 120, y: 60,  w: RW, h: RH },
  { id: 'R2',  x: 215, y: 60,  w: RW, h: RH },
  { id: 'R3',  x: 310, y: 60,  w: RW, h: RH },
  { id: 'R4',  x: 405, y: 60,  w: RW, h: RH },

  // ── Middle-left cluster — R5, R6, R7 ─────────────────────────
  { id: 'R5',  x: 60,  y: 160, w: RW, h: RH },
  { id: 'R6',  x: 155, y: 160, w: RW, h: RH },
  { id: 'R7',  x: 155, y: 220, w: RW, h: RH },

  // ── Middle-center cluster — R8, R9, R10 ──────────────────────
  { id: 'R8',  x: 310, y: 160, w: RW, h: RH },
  { id: 'R9',  x: 310, y: 220, w: RW, h: RH },
  { id: 'R10', x: 405, y: 160, w: RW, h: RH },

  // ── Right cluster — R11, R12 ─────────────────────────────────
  { id: 'R11', x: 500, y: 190, w: RW, h: RH },
  { id: 'R12', x: 590, y: 190, w: RW, h: RH },

  // ── Bottom cluster — R13, R14, R15, R16 ──────────────────────
  { id: 'R13', x: 215, y: 340, w: RW, h: RH },
  { id: 'R14', x: 405, y: 370, w: RW, h: RH },
  { id: 'R15', x: 500, y: 370, w: RW, h: RH },
  { id: 'R16', x: 590, y: 370, w: RW, h: RH },

  // ── Far-left bottom — R17 ────────────────────────────────────
  { id: 'R17', x: 60,  y: 415, w: RW, h: RH },
];

/* ═══════════════════════════════════════════════════════════════════
   SHELF CODE → RACK ID MAPPING  (for backend compatibility)
   ═══════════════════════════════════════════════════════════════════ */

export const SHELF_TO_RACK = {
  A1: 'R1',  A2: 'R2',
  B1: 'R5',  B2: 'R6',
  C1: 'R9',  C2: 'R10',
};

/**
 * Convert a backend grid position { x, y } to SVG coords.
 * The bot-simulator uses a 21×17 grid. We map that into the
 * floor area (with margins) of our SVG space.
 */
export function gridToSVG(gx, gy) {
  const { x, y, w, h } = FLOOR_BOUNDS;
  return [x + (gx / 21) * w, y + (gy / 17) * h];
}

/* ═══════════════════════════════════════════════════════════════════
   STATIONS  — Landmark positions
   ═══════════════════════════════════════════════════════════════════ */

export const STATIONS = [
  {
    id: 'charging',
    label: 'Charging Station',
    icon: '⚡',
    x: 540,
    y: 40,
    type: 'charging',
    color: COLORS.chargingStation,
  },
  {
    id: 'packing',
    label: 'Packing Station',
    icon: '📦',
    x: 60,
    y: 465,
    type: 'packing',
    color: COLORS.packing,
  },
  {
    id: 'shipping',
    label: 'Shipping Dock',
    icon: '🚚',
    x: 480,
    y: 465,
    type: 'shipping',
    color: COLORS.shipping,
  },
];

/* ═══════════════════════════════════════════════════════════════════
   ROAD / AISLE NETWORK
   Rendered as the bottom SVG layer to form internal paths.
   ═══════════════════════════════════════════════════════════════════ */

export const ROADS = {
  // Perimeter road (rendered as a stroked rect)
  perimeter: { x: 40, y: 35, w: 640, h: 450, strokeWidth: 18 },

  // Horizontal aisles
  horizontal: [
    { x: 50, y: 130, w: 620, h: 20 },   // below top row
    { x: 50, y: 285, w: 620, h: 20 },   // main center aisle
    { x: 50, y: 400, w: 400, h: 16 },   // lower aisle
  ],

  // Vertical aisles
  vertical: [
    { x: 248, y: 40,  w: 18, h: 440 },  // left-center vertical
    { x: 395, y: 40,  w: 18, h: 440 },  // center vertical
    { x: 495, y: 40,  w: 18, h: 340 },  // right-center vertical
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   DEMO BOTS  (5 bots, always visible in disconnected mode)
   Coordinates are in SVG-space (not grid-space)
   ═══════════════════════════════════════════════════════════════════ */

export const DEMO_BOTS = [
  {
    id: 'demo-B1',
    bot_code: 'B1',
    status: 'busy',
    _svgX: 200, _svgY: 140,
    route: [
      [200, 140], [300, 140], [405, 100], [405, 60],
    ],
    destination: [405, 60],
  },
  {
    id: 'demo-B2',
    bot_code: 'B2',
    status: 'idle',
    _svgX: 450, _svgY: 200,
    route: null,
    destination: null,
  },
  {
    id: 'demo-B3',
    bot_code: 'B3',
    status: 'charging',
    _svgX: 565, _svgY: 70,
    route: null,
    destination: null,
  },
  {
    id: 'demo-B4',
    bot_code: 'B4',
    status: 'busy',
    _svgX: 330, _svgY: 350,
    route: [
      [330, 350], [420, 350], [500, 370],
    ],
    destination: [500, 370],
  },
  {
    id: 'demo-B5',
    bot_code: 'B5',
    status: 'idle',
    _svgX: 100, _svgY: 300,
    route: null,
    destination: null,
  },
];
