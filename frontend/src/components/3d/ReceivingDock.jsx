import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export default function ReceivingDock({ position = [0, 0, -8.2] }) {
  const lightRef = useRef();

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.4;
    }
  });

  return (
    <group position={position}>
      {/* Zone Floor Marking */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[14, 2.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* Safety Border Frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[14.2, 2.7]} />
        <meshBasicMaterial color="#eab308" wireframe />
      </mesh>

      {/* Rear Dock Wall / Door Slots */}
      <mesh castShadow position={[0, 1.2, -1.25]}>
        <boxGeometry args={[14, 2.4, 0.3]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Dock Doors (3 shutter doors) */}
      {[-4, 0, 4].map((x, idx) => (
        <group key={idx} position={[x, 1, -1.05]}>
          <mesh castShadow>
            <boxGeometry args={[2.5, 1.8, 0.1]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* LED Indicator above each door */}
          <mesh position={[0, 1.1, 0.1]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      {/* Animated Dock PointLight */}
      <pointLight ref={lightRef} position={[0, 2.5, 0]} color="#38bdf8" distance={6} />

      {/* Native WebGL 3D Text Label */}
      <Text
        position={[0, 2.8, 0]}
        fontSize={0.4}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#0f172a"
      >
        INBOUND / RECEIVING
      </Text>
    </group>
  );
}
