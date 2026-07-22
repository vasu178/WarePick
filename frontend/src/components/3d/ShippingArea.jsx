import React from 'react';
import { Text } from '@react-three/drei';

export default function ShippingArea({ position = [7.5, 0, 7.5] }) {
  return (
    <group position={position}>
      {/* Scaled down group for better proportions relative to the AGVs */}
      <group scale={0.7}>
        {/* Loading Dock Concrete Pad */}
        <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[3, 0.2, 2.5]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>

        {/* Yellow Safety Striping on Dock Edge */}
        <mesh position={[0, 0.205, 1.15]}>
          <boxGeometry args={[3, 0.01, 0.2]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>

        {/* Dock Door / Bumper Seal */}
        <mesh position={[0, 1.3, 1.35]}>
          <boxGeometry args={[2.4, 2.4, 0.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>

        {/* Truck Group (Backed into the dock along the Z axis) */}
        <group position={[0, 0, 1.45]}>
          {/* Trailer Cargo Box */}
          <mesh castShadow receiveShadow position={[0, 1.3, 2]}>
            <boxGeometry args={[2, 2.4, 4]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} metalness={0.1} />
          </mesh>

          {/* Rear Trailer Doors (Metallic) */}
          <mesh position={[0, 1.3, 0.01]}>
            <boxGeometry args={[1.9, 2.3, 0.01]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.5} metalness={0.8} />
          </mesh>
          {/* Door center seam */}
          <mesh position={[0, 1.3, 0.02]}>
            <boxGeometry args={[0.03, 2.3, 0.01]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>

          {/* Trailer Green Branding Stripe */}
          <mesh position={[1.01, 1.3, 2]}>
            <boxGeometry args={[0.01, 0.2, 4]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh position={[-1.01, 1.3, 2]}>
            <boxGeometry args={[0.01, 0.2, 4]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>

          {/* Truck Cab (Red) */}
          <mesh castShadow receiveShadow position={[0, 0.9, 4.7]}>
            <boxGeometry args={[1.8, 1.8, 1.4]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} metalness={0.6} />
          </mesh>

          {/* Cab Windshield */}
          <mesh position={[0, 1.35, 5.41]}>
            <boxGeometry args={[1.6, 0.6, 0.02]} />
            <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
          </mesh>

          {/* Front Grille */}
          <mesh position={[0, 0.6, 5.41]}>
            <boxGeometry args={[0.8, 0.6, 0.02]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.8} />
          </mesh>

          {/* Headlights */}
          <mesh position={[0.65, 0.5, 5.41]}>
            <boxGeometry args={[0.3, 0.2, 0.02]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
          <mesh position={[-0.65, 0.5, 5.41]}>
            <boxGeometry args={[0.3, 0.2, 0.02]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>

          {/* Exhaust Stack */}
          <mesh position={[0.9, 2.1, 4.1]}>
            <cylinderGeometry args={[0.06, 0.06, 1.4]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          
          {/* Side Windows */}
          <mesh position={[0.91, 1.35, 4.8]}>
            <boxGeometry args={[0.02, 0.6, 0.8]} />
            <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh position={[-0.91, 1.35, 4.8]}>
            <boxGeometry args={[0.02, 0.6, 0.8]} />
            <meshStandardMaterial color="#020617" roughness={0.1} metalness={0.9} />
          </mesh>

          {/* Wheels (6 pairs) */}
          {[
            [1, 0.3, 0.6], [-1, 0.3, 0.6],       // Rear trailer
            [1, 0.3, 1.4], [-1, 0.3, 1.4],       // Rear mid trailer
            [1, 0.3, 3.4], [-1, 0.3, 3.4],       // Front trailer
            [1, 0.3, 4.4], [-1, 0.3, 4.4],       // Rear cab
            [1, 0.3, 5.2], [-1, 0.3, 5.2],       // Front cab
          ].map((pos, i) => (
            <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
              <meshStandardMaterial color="#18181b" roughness={0.9} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Native WebGL Zone Title */}
      <Text
        position={[0, 2.6, 0]}
        fontSize={0.35}
        color="#10b981"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#0f172a"
      >
        SHIPPING DOCK
      </Text>
    </group>
  );
}
