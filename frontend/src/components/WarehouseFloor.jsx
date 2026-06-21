import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GRID_LAYOUT, GRID_COLS, GRID_ROWS, getCellClass, getCellLabel } from '../data/warehouseGrid';

/**
 * WarehouseFloor — CSS Grid warehouse with animated bot markers.
 *
 * Props:
 *   bots: array of bot objects from Supabase { id, bot_code, status, x_position, y_position }
 *   botPositions: object from broadcast { [botId]: { x, y, status } } — overrides DB positions for smooth animation
 */
export default function WarehouseFloor({ bots = [], botPositions = {} }) {
  const cellSize = 38; // matches --cell-size

  const gridCells = useMemo(() => {
    const cells = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const cellType = GRID_LAYOUT[row]?.[col] || 'E';
        const label = getCellLabel(cellType, row, col);
        cells.push(
          <div
            key={`${row}-${col}`}
            className={`grid-cell ${getCellClass(cellType)}`}
            title={cellType !== 'E' ? `${cellType} (${col},${row})` : ''}
          >
            {label}
          </div>
        );
      }
    }
    return cells;
  }, []);

  return (
    <div className="warehouse-container">
      <div className="warehouse-grid">
        {gridCells}
      </div>

      {/* Bot overlay layer */}
      <div className="bot-layer">
        {bots.map((bot) => {
          // Use broadcast position if available, fallback to DB position
          const broadcast = botPositions[bot.id];
          const x = broadcast?.x ?? bot.x_position ?? 0;
          const y = broadcast?.y ?? bot.y_position ?? 0;
          const status = broadcast?.status ?? bot.status ?? 'idle';

          // Calculate pixel position (cell size + 1px gap)
          const leftPx = x * (cellSize + 1) + (cellSize - 28) / 2;
          const topPx = y * (cellSize + 1) + (cellSize - 28) / 2;

          const botNumber = bot.bot_code?.replace('BOT-0', '').replace('BOT-', '') || '?';

          return (
            <motion.div
              key={bot.id}
              className={`bot-marker bot-marker--${status}`}
              animate={{ left: leftPx, top: topPx }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 18,
                mass: 0.8,
              }}
              initial={false}
              title={`${bot.bot_code} — ${status}`}
              style={{ position: 'absolute' }}
            >
              {botNumber}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
