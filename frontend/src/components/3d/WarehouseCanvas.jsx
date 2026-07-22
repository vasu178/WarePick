import React, { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import WarehouseScene from './WarehouseScene';

export default function WarehouseCanvas({
  bots = [],
  botPositions = {},
  orders = [],
  onBotClick,
}) {
  const controlsRef = useRef();

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="w-full h-full absolute inset-0 bg-[#0a0c10] rounded-xl border border-outline-variant shadow-inner overflow-hidden select-none">
      {/* Top 3D Control Bar overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => {
            if (controlsRef.current) {
              controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + Math.PI / 4);
              controlsRef.current.update();
            }
          }}
          className="w-8 h-8 bg-slate-900/90 border border-slate-700/60 rounded flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-md backdrop-blur-md"
          title="Rotate Left"
        >
          <i className="fa-solid fa-arrow-rotate-left text-xs"></i>
        </button>
        <button
          onClick={() => {
            if (controlsRef.current) {
              controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() - Math.PI / 4);
              controlsRef.current.update();
            }
          }}
          className="w-8 h-8 bg-slate-900/90 border border-slate-700/60 rounded flex items-center justify-center text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-md backdrop-blur-md"
          title="Rotate Right"
        >
          <i className="fa-solid fa-arrow-rotate-right text-xs"></i>
        </button>
        <button
          onClick={handleResetView}
          className="w-8 h-8 bg-slate-900/90 border border-slate-700/60 rounded flex items-center justify-center text-sky-400 hover:text-white hover:bg-slate-800 transition-colors shadow-md text-xs font-mono font-bold backdrop-blur-md"
          title="Reset Isometric Camera"
        >
          3D
        </button>
      </div>

      {/* Top Left Badge Overlay */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          3D Digital Twin – Active
        </span>
      </div>

      {/* Main R3F Canvas */}
      <Canvas
        orthographic
        camera={{
          position: [18, 18, 18],
          zoom: 32,
          near: -200,
          far: 1000,
        }}
        shadows={false}
      >
        <OrbitControls
          ref={controlsRef}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.05}
          enableZoom={true}
          enablePan={true}
          minZoom={15}
          maxZoom={80}
          dampingFactor={0.05}
        />
        <WarehouseScene
          bots={bots}
          botPositions={botPositions}
          orders={orders}
          onBotClick={onBotClick}
        />
      </Canvas>
    </div>
  );
}
