import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

export default function FloorGrid() {
  const gridHelper = useMemo(() => {
    const grid = new THREE.GridHelper(26, 26, '#3b4252', '#242933');
    grid.position.y = 0.01;
    return grid;
  }, []);

  return (
    <group>
      {/* Dark metallic main floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[28, 22]} />
        <meshStandardMaterial color="#12141a" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* Grid Helper */}
      <primitive object={gridHelper} />

      {/* Walkways / Safety border lines around the main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[26.4, 20.4]} />
        <meshBasicMaterial color="#3b4252" wireframe />
      </mesh>

      {/* Main Center Walkway Highlight */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -0.5]}>
        <planeGeometry args={[1.5, 14]} />
        <meshBasicMaterial color="#1e2330" transparent opacity={0.6} />
      </mesh>

      {/* Directional Walkway Arrows / Markings */}
      {/*
      <group position={[0, 0.03, -8.8]}>
        <Html transform position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5}>
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest pointer-events-none select-none opacity-40">
            NORTH AGV LANE ▼
          </div>
        </Html>
      </group>

      <group position={[0, 0.03, 8.2]}>
        <Html transform position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.5}>
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest pointer-events-none select-none opacity-40">
            SOUTH AGV LANE ▲
          </div>
        </Html>
      </group>
      */}
    </group>
  );
}
