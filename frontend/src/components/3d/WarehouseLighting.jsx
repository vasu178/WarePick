import React from 'react';

export default function WarehouseLighting() {
  return (
    <group>
      {/* Soft Ambient Light */}
      <ambientLight intensity={0.75} color="#dbeafe" />

      {/* Main Directional Sun Light */}
      <directionalLight
        position={[15, 25, 12]}
        intensity={1.2}
        color="#ffffff"
      />

      {/* Secondary Fill Light */}
      <directionalLight position={[-15, 15, -12]} intensity={0.4} color="#93c5fd" />

      {/* High-Tech Blue Accent Spot Lights */}
      <pointLight position={[-10, 8, -8]} intensity={0.8} color="#3b82f6" distance={15} />
      <pointLight position={[10, 8, -8]} intensity={0.8} color="#3b82f6" distance={15} />
      <pointLight position={[0, 8, 8]} intensity={0.6} color="#60a5fa" distance={15} />
    </group>
  );
}
