import React, { useState, useEffect, useMemo } from 'react';
import FloorGrid from './FloorGrid';
import WarehouseLighting from './WarehouseLighting';
import ReceivingDock from './ReceivingDock';
import PackingStation from './PackingStation';
import ShippingArea from './ShippingArea';
import Shelf from './Shelf';
import Robot from './Robot';
import RobotPath from './RobotPath';

// Shelf layout definitions
const SHELVES_DATA = [
  { id: 'A1', pos: [-7.5, 0, -4.2], cap: 82, avail: 48, res: 12 },
  { id: 'A2', pos: [-7.5, 0, -0.5], cap: 64, avail: 32, res: 8 },
  { id: 'A3', pos: [-7.5, 0, 3.2], cap: 90, avail: 72, res: 18 },
  { id: 'B1', pos: [-2.5, 0, -4.2], cap: 45, avail: 22, res: 5 },
  { id: 'B2', pos: [-2.5, 0, -0.5], cap: 78, avail: 50, res: 14 },
  { id: 'B3', pos: [-2.5, 0, 3.2], cap: 55, avail: 30, res: 6 },
  { id: 'C1', pos: [2.5, 0, -4.2], cap: 88, avail: 68, res: 16 },
  { id: 'C2', pos: [2.5, 0, -0.5], cap: 92, avail: 80, res: 20 },
  { id: 'C3', pos: [2.5, 0, 3.2], cap: 70, avail: 40, res: 10 },
  { id: 'D1', pos: [7.5, 0, -4.2], cap: 60, avail: 35, res: 9 },
  { id: 'D2', pos: [7.5, 0, -0.5], cap: 85, avail: 65, res: 15 },
  { id: 'D3', pos: [7.5, 0, 3.2], cap: 73, avail: 45, res: 11 },
];

// Helper to convert backend 2D grid coordinates to 3D world units
function gridTo3DWorld(gx, gy) {
  if (gx === undefined || gy === undefined) return null;
  // backend grid approx 21x17
  const worldX = (gx - 10) * 1.1;
  const worldZ = (gy - 8.5) * 1.0;
  return [worldX, 0, worldZ];
}

export default function WarehouseScene({
  bots = [],
  botPositions = {},
  orders = [],
  onBotClick,
}) {
  // Define 5 distinct parking spots on the Inbound platform so they don't overlap
  const defaultInboundSpots = [
    [-4, 0, -8.2],
    [-2, 0, -8.2],
    [0, 0, -8.2],
    [2, 0, -8.2],
    [4, 0, -8.2],
  ];

  // Local state initialized with exactly 5 bots
  const [simulatedBots, setSimulatedBots] = useState(
    Array.from({ length: 5 }).map((_, i) => ({
      id: `${i + 1}`,
      bot_code: `BOT-0${i + 1}`,
      status: 'idle',
      pos: defaultInboundSpots[i],
      path: [],
    }))
  );

  // Sync real-time backend bot positions or run continuous simulation
  useEffect(() => {
    setSimulatedBots((prevSim) =>
      prevSim.map((bot, idx) => {
        // Find matching live bot data from backend by bot_code, or fallback to index
        const liveBot = (bots && bots.length > 0)
          ? (bots.find((b) => b.bot_code === bot.bot_code) || bots[idx])
          : null;
        
        const livePos = liveBot ? (botPositions[liveBot.id] || botPositions[liveBot.bot_code]) : null;
        const botStatus = livePos?.status || liveBot?.status || 'idle';
        
        let pos3D = livePos && livePos.x != null && livePos.y != null 
          ? gridTo3DWorld(livePos.x, livePos.y) 
          : null;
        
        if (!pos3D || botStatus === 'idle') {
          // If the bot has no backend coordinates, OR it is currently idle, park it at its designated dock spot
          pos3D = defaultInboundSpots[idx];
        }

        return {
          id: liveBot?.id || bot.id,
          bot_code: liveBot?.bot_code || bot.bot_code,
          status: botStatus,
          pos: pos3D,
          path: prevSim[idx]?.path || [],
        };
      })
    );
  }, [bots, botPositions]);

  // Removed fake simulation timer so bots stay at their default positions or follow real backend coordinates.

  return (
    <group>
      {/* Lighting */}
      <WarehouseLighting />

      {/* Floor & Grid */}
      <FloorGrid />

      {/* Warehouse Docks & Stations */}
      <ReceivingDock position={[0, 0, -8.2]} />
      <PackingStation position={[-1, 0, 7.5]} />
      <ShippingArea position={[7.5, 0, 7.5]} />

      {/* Shelves / Storage Racks */}
      {SHELVES_DATA.map((shelf) => (
        <Shelf
          key={shelf.id}
          id={shelf.id}
          position={shelf.pos}
          capacityPct={shelf.cap}
          availableUnits={shelf.avail}
          reservedUnits={shelf.res}
          assignedBot={simulatedBots.find((b) => b.status === 'picking')?.bot_code || null}
          isTargeted={simulatedBots.some((b) => b.status === 'picking')}
        />
      ))}

      {/* 3D Robots */}
      {simulatedBots.map((bot) => (
        <React.Fragment key={bot.id}>
          <Robot
            bot={bot}
            targetPos={bot.pos}
            onClick={onBotClick}
          />
        </React.Fragment>
      ))}
    </group>
  );
}
