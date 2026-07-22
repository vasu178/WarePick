import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

function getBotStatusColor(statusStr) {
  if (!statusStr) return '#10b981'; // default idle green
  const s = statusStr.toLowerCase();
  if (s === 'idle') return '#10b981'; // Green
  if (s.includes('moving') || s.includes('picking') || s.includes('delivering') || s.includes('assigned') || s.includes('returning')) return '#3b82f6'; // Blue
  if (s.includes('charging')) return '#f97316'; // Orange
  if (s.includes('error') || s.includes('failed')) return '#ef4444'; // Red
  return '#10b981';
}

export default function Robot({
  bot,
  targetPos = [0, 0, 0],
  onClick,
}) {
  const meshRef = useRef();
  const ringRef = useRef();
  const currentPos = useRef(new THREE.Vector3(targetPos[0], 0.2, targetPos[2]));
  const currentRotation = useRef(0);

  // Decouple visual status from backend status so we can delay it
  const [visualStatus, setVisualStatus] = useState(bot?.status || 'idle');
  const arrivalTime = useRef(null);

  const statusStr = bot?.status || 'idle';
  const colorHex = getBotStatusColor(visualStatus); // Use visualStatus for color
  const botCode = bot?.bot_code || `BOT-${bot?.id?.slice(0, 2) || '01'}`;

  // Package visibility relies on the delayed visual status - ONLY show when delivering
  const hasPackage = visualStatus.includes('delivering');

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const targetVector = new THREE.Vector3(targetPos[0], 0.2, targetPos[2]);
    const distance = currentPos.current.distanceTo(targetVector);

    if (distance > 0.05) {
      // Bot is moving
      arrivalTime.current = null; // Reset arrival timer
      
      if (statusStr === 'idle' || statusStr === 'returning') {
         // The job is fully complete or it's returning empty, instantly drop the package
         if (visualStatus !== statusStr) setVisualStatus(statusStr);
      } else if (statusStr.includes('delivering')) {
         // It has picked up the item and is delivering it, instantly show the package while driving
         if (visualStatus !== statusStr) setVisualStatus(statusStr);
      } else if (statusStr === 'picking') {
         // It is driving to the shelf to pick the item, so it should be empty (moving)
         if (visualStatus !== 'moving') setVisualStatus('moving');
      } else if (visualStatus !== 'moving' && !hasPackage) {
         setVisualStatus('moving');
      }

      // Direction vector
      const dx = targetPos[0] - currentPos.current.x;
      const dz = targetPos[2] - currentPos.current.z;

      // Target rotation angle
      const targetAngle = Math.atan2(dx, dz);
      let diff = (targetAngle - currentRotation.current) % (2 * Math.PI);
      if (diff < -Math.PI) diff += 2 * Math.PI;
      if (diff > Math.PI) diff -= 2 * Math.PI;
      currentRotation.current += diff * Math.min(delta * 6, 1);

      // Lerp position
      currentPos.current.lerp(targetVector, Math.min(delta * 5, 1));
    } else {
      // Bot has arrived at target
      if (arrivalTime.current === null) {
        arrivalTime.current = Date.now();
      } else if (Date.now() - arrivalTime.current > 1000) {
        // Waited for 1 second near the shelf/station!
        // Now we can update to the actual backend status (picking, delivering, idle)
        if (visualStatus !== statusStr) {
          setVisualStatus(statusStr);
        }
      }
    }

    meshRef.current.position.copy(currentPos.current);
    meshRef.current.rotation.y = currentRotation.current;

    // Pulse status ring
    if (ringRef.current) {
      ringRef.current.material.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
    }
  });

  return (
    <group
      ref={meshRef}
      position={[targetPos[0], 0.2, targetPos[2]]}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(bot?.id);
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* Base Glowing Status Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <ringGeometry args={[0.55, 0.75, 32]} />
        <meshBasicMaterial color={colorHex} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* AGV Main Chassis (Square AMR / Kiva Style) */}
      <mesh castShadow position={[0, 0.12, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* 4 Drive Wheels */}
      {[
        [-0.42, 0.08, -0.25],
        [0.42, 0.08, -0.25],
        [-0.42, 0.08, 0.25],
        [0.42, 0.08, 0.25]
      ].map((pos, idx) => (
        <mesh key={idx} castShadow position={pos} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>
      ))}

      {/* Side LED Status Strips */}
      {[-0.41, 0.41].map((x) => (
        <mesh key={`led-${x}`} position={[x, 0.15, 0]}>
          <boxGeometry args={[0.02, 0.05, 0.6]} />
          <meshBasicMaterial color={colorHex} />
        </mesh>
      ))}

      {/* Front Lidar/Sensor Module */}
      <mesh position={[0, 0.28, 0.3]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.1, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 0.3]}>
        <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Directional Front Arrow Mesh (Embedded on top) */}
      <mesh position={[0, 0.23, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.1, 0.2, 3]} />
        <meshBasicMaterial color={colorHex} />
      </mesh>

      {/* Lifter Plate (Top Deck) - Raised slightly if it has a package */}
      <mesh castShadow position={[0, hasPackage ? 0.27 : 0.23, 0]}>
        <boxGeometry args={[0.65, 0.04, 0.65]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* Package Mesh on top when carrying */}
      {hasPackage && (
        <group position={[0, 0.49, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.4, 0.55]} />
            <meshStandardMaterial color="#d97706" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.21, 0]}>
            <boxGeometry args={[0.57, 0.02, 0.15]} />
            <meshStandardMaterial color="#fef3c7" />
          </mesh>
        </group>
      )}

      {/* Native WebGL 3D Badge */}
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false} 
      >
        <Text
          position={[0, 1.1, 0]}
          fontSize={0.25}
          color={colorHex}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#0f172a"
        >
          {botCode}
        </Text>
      </Billboard>
    </group>
  );
}
