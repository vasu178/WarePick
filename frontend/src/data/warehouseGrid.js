/**
 * Warehouse grid layout definition — 20x16 grid.
 *
 * Cell types:
 *  'E' = empty/aisle
 *  'D' = dock zone
 *  'S:XX' = shelf (XX = shelf code like A1, B2)
 *  'P' = packing zone
 *  'X' = dispatch zone
 */

// Grid is 20 columns × 16 rows
export const GRID_COLS = 20;
export const GRID_ROWS = 16;

// prettier-ignore
export const GRID_LAYOUT = [
  // Row 0 (top): labels
  ['E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E'],
  // Row 1: Dock zone
  ['D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','D','E','E','E','E'],
  // Row 2: empty/aisles
  ['E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E'],
  // Row 3: Shelf row A header
  ['E','E','S:A1','S:A1','S:A1','E','E','S:A2','S:A2','S:A2','E','E','E','E','E','E','E','E','E','E'],
  // Row 4: Shelf row A main
  ['E','E','S:A1','S:A1','S:A1','E','E','S:A2','S:A2','S:A2','E','E','E','E','E','E','E','E','E','E'],
  // Row 5: aisle
  ['E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E'],
  // Row 6: Shelf row B header
  ['E','E','S:B1','S:B1','S:B1','E','E','S:B2','S:B2','S:B2','E','E','E','E','E','E','E','E','E','E'],
  // Row 7: Shelf row B main
  ['E','E','S:B1','S:B1','S:B1','E','E','S:B2','S:B2','S:B2','E','E','E','E','E','E','E','E','E','E'],
  // Row 8: aisle
  ['E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E'],
  // Row 9: Shelf row C header
  ['E','E','S:C1','S:C1','S:C1','E','E','S:C2','S:C2','S:C2','E','E','E','E','E','E','E','E','E','E'],
  // Row 10: Shelf row C main
  ['E','E','S:C1','S:C1','S:C1','E','E','S:C2','S:C2','S:C2','E','E','E','E','E','E','E','E','E','E'],
  // Row 11: aisle
  ['E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E'],
  // Row 12: empty
  ['E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E'],
  // Row 13: Packing zone
  ['E','E','E','E','E','E','E','E','E','E','E','E','E','P','P','P','P','P','E','E'],
  // Row 14: Packing / Dispatch
  ['E','E','E','E','E','E','E','E','E','E','E','E','E','P','P','P','P','P','E','E'],
  // Row 15: Dispatch
  ['E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','E','X','X','X','X'],
];

/**
 * Returns the CSS class for a cell type.
 */
export function getCellClass(cellType) {
  if (cellType === 'E') return 'grid-cell--empty';
  if (cellType === 'D') return 'grid-cell--dock';
  if (cellType.startsWith('S:')) return 'grid-cell--shelf';
  if (cellType === 'P') return 'grid-cell--packing';
  if (cellType === 'X') return 'grid-cell--dispatch';
  return 'grid-cell--empty';
}

/**
 * Returns the label for a cell.
 */
export function getCellLabel(cellType, row, col) {
  if (cellType === 'D' && row === 1) return '🔲';
  if (cellType.startsWith('S:')) {
    const code = cellType.split(':')[1];
    // Only show label in center of shelf block
    return code;
  }
  if (cellType === 'P') return '📦';
  if (cellType === 'X') return '🚚';
  return '';
}

/**
 * Shelf code → center grid position (col, row) for bot navigation.
 */
export const SHELF_POSITIONS = {
  'A1': { x: 3, y: 4 },
  'A2': { x: 8, y: 4 },
  'B1': { x: 3, y: 7 },
  'B2': { x: 8, y: 7 },
  'C1': { x: 3, y: 10 },
  'C2': { x: 8, y: 10 },
};

export const PACKING_POSITION = { x: 15, y: 13 };
export const DOCK_Y = 1;
