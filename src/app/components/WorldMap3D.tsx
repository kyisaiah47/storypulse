import React from 'react';
import { Canvas } from '@react-three/fiber';


import type { WorldState } from '../hooks/useWorldState';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // Placeholder: Render pins for locations, characters, items
  return (
    <div className="w-full h-[400px] bg-black rounded mt-4">
      <Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
        {/* TODO: Render 3D world based on world state */}
        {/* @ts-expect-error: JSX types for three.js elements */}
        <ambientLight intensity={0.5} />
        {/* @ts-expect-error */}
        <directionalLight position={[10, 10, 5]} intensity={1} />
        {/* Example: Render a ground plane */}
        {/* @ts-expect-error */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          {/* @ts-expect-error */}
          <planeGeometry args={[50, 50]} />
          {/* @ts-expect-error */}
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        {/* TODO: Map over world.locations, world.characters, world.items */}
      </Canvas>
    </div>
  );
}
