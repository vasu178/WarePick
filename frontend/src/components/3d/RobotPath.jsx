import React, { useMemo } from 'react';
import * as THREE from 'three';

export default function RobotPath({ points = [], color = '#3b82f6' }) {
  const curve = useMemo(() => {
    if (!points || points.length < 2) return null;
    
    // Filter out consecutive identical points to prevent NaN generation in TubeGeometry
    const filteredPoints = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const prev = filteredPoints[filteredPoints.length - 1];
      const curr = points[i];
      if (Math.abs(prev[0] - curr[0]) > 0.01 || Math.abs(prev[2] - curr[2]) > 0.01) {
        filteredPoints.push(curr);
      }
    }
    
    if (filteredPoints.length < 2) return null;
    
    const vectors = filteredPoints.map((p) => new THREE.Vector3(p[0], 0.05, p[2]));
    return new THREE.CatmullRomCurve3(vectors);
  }, [points]);

  if (!curve) return null;

  return (
    <mesh position={[0, 0.02, 0]}>
      <tubeGeometry args={[curve, 32, 0.05, 8, false]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}
