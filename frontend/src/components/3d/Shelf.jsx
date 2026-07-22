import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export default function Shelf({
  id,
  position = [0, 0, 0],
  capacityPct = 75,
  availableUnits = 45,
  reservedUnits = 12,
  assignedBot = null,
  isTargeted = false,
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef();

  // Target Y elevation on hover or targeted state
  const targetY = (hovered || isTargeted) ? 0.3 : 0;

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        Math.min(delta * 8, 1)
      );
    }
  });

  // Color mapping based on capacity or state
  const capacityColor = capacityPct > 85 ? '#ef4444' : capacityPct > 60 ? '#f59e0b' : '#10b981';
  const frameEmissive = isTargeted ? '#3b82f6' : hovered ? '#60a5fa' : '#000000';
  const emissiveIntensity = isTargeted ? 0.8 : hovered ? 0.4 : 0;

  // Realistic Rack Dimensions
  const w = 1.8;
  const h = 2.4;
  const d = 1.6;
  const postW = 0.12;
  const px = w / 2 - postW / 2;
  const pz = d / 2 - postW / 2;

  // Shelf Levels (Y heights)
  const levels = [0.3, 1.0, 1.7, 2.4];

  return (
    <group position={position}>
      <group
        ref={groupRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* 4 Corner Upright Posts (Industrial Blue) */}
        {[-px, px].map((x) =>
          [-pz, pz].map((z) => (
            <mesh key={`post-${x}-${z}`} position={[x, h / 2, z]} castShadow receiveShadow>
              <boxGeometry args={[postW, h, postW]} />
              <meshStandardMaterial
                color="#1e3a8a"
                roughness={0.7}
                metalness={0.6}
                emissive={frameEmissive}
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
          ))
        )}

        {/* Diagonal Cross Bracing on the sides (Left and Right faces) */}
        {[-px, px].map((x) => (
          <group key={`brace-${x}`}>
            {/* Cross brace 1 */}
            <mesh position={[x, h / 2, 0]} rotation={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.04, h, d - postW * 2]} />
              <meshStandardMaterial color="#1e3a8a" roughness={0.7} metalness={0.6} wireframe />
            </mesh>
          </group>
        ))}

        {/* Shelf Levels */}
        {levels.map((ly, lIdx) => (
          <group key={`level-${lIdx}`} position={[0, ly, 0]}>
            {/* Horizontal Beams (Front/Back) (Industrial Orange) */}
            {[-pz, pz].map((z) => (
              <group key={`beam-x-${z}`}>
                <mesh position={[0, 0, z]} castShadow receiveShadow>
                  <boxGeometry args={[w, 0.12, 0.08]} />
                  <meshStandardMaterial color="#ea580c" roughness={0.5} metalness={0.4} />
                </mesh>
                {/* LED Indicator Strip duplicated on front and back so it's 360 visible */}
                <mesh position={[0, 0, z > 0 ? z + 0.045 : z - 0.045]}>
                  <boxGeometry args={[1.4, 0.03, 0.01]} />
                  <meshBasicMaterial color={capacityColor} />
                </mesh>
              </group>
            ))}

            {/* Horizontal Beams (Left/Right) (Industrial Orange) */}
            {[-px, px].map((x) => (
              <group key={`beam-z-${x}`}>
                <mesh position={[x, 0, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.08, 0.12, d - postW * 2]} />
                  <meshStandardMaterial color="#ea580c" roughness={0.5} metalness={0.4} />
                </mesh>
                {/* LED Indicator Strip on left and right */}
                <mesh position={[x > 0 ? x + 0.045 : x - 0.045, 0, 0]}>
                  <boxGeometry args={[0.01, 0.03, 1.0]} />
                  <meshBasicMaterial color={capacityColor} />
                </mesh>
              </group>
            ))}

            {/* Wire Mesh / Decking */}
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[w - postW, d - postW]} />
              <meshStandardMaterial color="#52525b" roughness={0.9} metalness={0.8} wireframe />
            </mesh>

            {/* Cargo Boxes - Rendered open from all sides */}
            {lIdx < levels.length - 1 && (
              <group position={[0, 0.25, 0]}>
                {/* Box 1 (Bottom Left) */}
                <mesh position={[-0.4, 0, -0.3]} castShadow receiveShadow>
                  <boxGeometry args={[0.6, 0.4, 0.6]} />
                  <meshStandardMaterial color="#b45309" roughness={0.8} />
                </mesh>
                {/* Box 2 (Bottom Right) */}
                <mesh position={[0.4, 0, 0.3]} castShadow receiveShadow>
                  <boxGeometry args={[0.6, 0.4, 0.6]} />
                  <meshStandardMaterial color="#92400e" roughness={0.8} />
                </mesh>
                {/* Box 3 (Top Left - appears if over 50%) */}
                {capacityPct > 50 && (
                  <mesh position={[-0.4, 0.4, -0.3]} castShadow receiveShadow>
                    <boxGeometry args={[0.55, 0.35, 0.55]} />
                    <meshStandardMaterial color="#d97706" roughness={0.8} />
                  </mesh>
                )}
                {/* Box 4 (Top Right - appears if over 80%) */}
                {capacityPct > 80 && (
                  <mesh position={[0.4, 0.4, 0.3]} castShadow receiveShadow>
                    <boxGeometry args={[0.55, 0.35, 0.55]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.8} />
                  </mesh>
                )}
              </group>
            )}
          </group>
        ))}

        {/* Top Face Label Badge */}
        <Text
          position={[0, 2.9, 0]}
          fontSize={0.4}
          color={isTargeted ? "#ffffff" : "#cbd5e1"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor={isTargeted ? "#2563eb" : "#0f172a"}
        >
          {id}
        </Text>
      </group>
    </group>
  );
}
