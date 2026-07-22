import React from 'react';
import { Text } from '@react-three/drei';

export default function PackingStation({ position = [-1, 0, 7.5] }) {
  return (
    <group position={position}>
      {/* Zone Floor Base */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[8, 2.5]} />
        <meshStandardMaterial color="#1c1917" roughness={0.6} />
      </mesh>

      {/* Amber Safety Border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[8.2, 2.7]} />
        <meshBasicMaterial color="#f97316" wireframe />
      </mesh>

      {/* Packing Desks / Workbenches (P1 and P2) */}
      {[-2, 2].map((x, idx) => (
        <group key={idx} position={[x, 0.5, 0]}>
          {/* Desk Top */}
          <mesh castShadow position={[0, 0.3, 0]}>
            <boxGeometry args={[2.2, 0.1, 1.4]} />
            <meshStandardMaterial color="#3b3b4f" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Desk Legs */}
          {[-0.9, 0.9].map((lx) =>
            [-0.5, 0.5].map((lz) => (
              <mesh key={`${lx}-${lz}`} position={[lx, -0.15, lz]}>
                <cylinderGeometry args={[0.04, 0.04, 0.7]} />
                <meshStandardMaterial color="#1e1e2d" metalness={0.8} />
              </mesh>
            ))
          )}
          {/* Workbench Monitor / Terminal */}
          <mesh position={[0, 0.75, -0.4]}>
            <boxGeometry args={[0.6, 0.4, 0.05]} />
            <meshStandardMaterial color="#0f172a" emissive="#38bdf8" emissiveIntensity={0.2} />
          </mesh>
          {/* Label P1 / P2 */}
          <Text
            position={[0, 1.2, 0]}
            fontSize={0.25}
            color="#fbbf24"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#451a03"
          >
            {`P${idx + 1}`}
          </Text>
        </group>
      ))}

      {/* Floating Zone Title */}
      <Text
        position={[0, 2.2, 0]}
        fontSize={0.4}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#0f172a"
      >
        PACKING STATION
      </Text>
    </group>
  );
}
