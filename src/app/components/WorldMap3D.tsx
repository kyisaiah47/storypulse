"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
	OrbitControls,
	AdaptiveDpr,
	Preload,
	Sky,
	ContactShadows,
} from "@react-three/drei";
import type { WorldState } from "../hooks/useWorldState";
import Pin from "./Pin";
import type { Entity } from "./types";

type WorldMap3DProps = {
	world: WorldState;
	loading?: boolean;
	error?: string | null;
	setError?: (e: string | null) => void;
};

export default function WorldMap3D({
	world,
	loading,
	error,
	setError,
}: WorldMap3DProps) {
	const [selected, setSelected] = useState<{
		label: string;
		description: string;
	} | null>(null);

	const safeArr = (arr: unknown): Entity[] => (Array.isArray(arr) ? arr : []);
	const locations: Entity[] = safeArr(world.locations);
	const characters: Entity[] = safeArr(world.characters);
	const items: Entity[] = safeArr(world.items);

	// Enhanced layout: more natural positioning with randomization
	const pinPositions = (
		arr: Entity[],
		baseRadius: number,
		yLevel: number,
		spread = 1
	) => {
		if (arr.length === 0) return [];

		return arr.map((_, i) => {
			const angle = (i / arr.length) * 2 * Math.PI;
			const radius = baseRadius + (Math.random() - 0.5) * spread * 3;
			const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 2;
			const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 2;
			const y = yLevel + (Math.random() - 0.5) * 0.5;
			return [x, y, z] as [number, number, number];
		});
	};

	const locPositions = pinPositions(locations, 12, 0.8, 1.5);
	const charPositions = pinPositions(characters, 8, 1.2, 1);
	const itemPositions = pinPositions(items, 5, 0.4, 0.8);

	return (
		<div className="w-full h-screen bg-black relative">
			<Canvas
				shadows
				dpr={[1, 2]}
				camera={{ position: [0, 5.2, 10], fov: 60, near: 0.1, far: 200 }}
			>
				{/* Sky / horizon */}
				<Sky
					distance={4500}
					turbidity={4}
					rayleigh={1.5}
					mieCoefficient={0.004}
					mieDirectionalG={0.9}
					inclination={0.48} // sun height
					azimuth={0.2} // sun direction
				/>

				{/* Subtle depth */}
				<fog
					attach="fog"
					args={["#d5d0c8", 35, 100]}
				/>

				{/* Warm lighting */}
				<ambientLight
					color="#fff4e6"
					intensity={0.45}
				/>
				<directionalLight
					color="#ffdca8"
					position={[10, 12, 6]}
					intensity={1.1}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
					shadow-camera-far={60}
				/>

				{/* Ground: soft sand tone */}
				<mesh
					rotation={[-Math.PI / 2, 0, 0]}
					receiveShadow
				>
					<planeGeometry args={[220, 220]} />
					<meshStandardMaterial
						color="#d9c7b0"
						roughness={0.9}
						metalness={0.02}
					/>
				</mesh>

				{/* Soft contact shadows to anchor objects */}
				<ContactShadows
					position={[0, 0.01, 0]}
					opacity={0.35}
					scale={40}
					blur={2.5}
					far={8}
					resolution={1024}
					frames={1}
				/>

				{/* Pins … (unchanged) */}
				{locations.map((loc, i) => (
					<Pin
						key={`loc-${i}`}
						position={locPositions[i]}
						entity={loc}
						type="location"
						onClick={() =>
							setSelected({
								label: loc.name || "Location",
								description: loc.description || "",
							})
						}
					/>
				))}
				{characters.map((char, i) => (
					<Pin
						key={`char-${i}`}
						position={charPositions[i]}
						entity={char}
						type="character"
						onClick={() =>
							setSelected({
								label: char.name || "Character",
								description: char.description || "",
							})
						}
					/>
				))}
				{items.map((item, i) => (
					<Pin
						key={`item-${i}`}
						position={itemPositions[i]}
						entity={item}
						type="item"
						onClick={() =>
							setSelected({
								label: item.name || "Item",
								description: item.description || "",
							})
						}
					/>
				))}

				<OrbitControls
					makeDefault
					target={[0, 1.2, 0]}
					minPolarAngle={0.55}
					maxPolarAngle={1.35}
					minDistance={6}
					maxDistance={22}
					enableDamping
					dampingFactor={0.08}
				/>
				<AdaptiveDpr pixelated />
				<Preload all />
			</Canvas>

			{/* Description overlay */}
			{selected && (
				<div className="absolute top-20 right-8 bg-white/40 backdrop-blur-md border border-white/30 rounded shadow-lg px-6 py-4 z-10 max-w-xs text-white">
					<div className="font-bold mb-1">{selected.label}</div>
					<div className="mb-2 text-sm">{selected.description}</div>
					<button
						className="text-white underline text-xs"
						onClick={() => setSelected(null)}
					>
						Close
					</button>
				</div>
			)}

			{/* Error overlay */}
			{error && setError && (
				<div className="absolute top-20 right-8 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-20">
					{error}
					<button
						className="ml-2 text-xs underline"
						onClick={() => setError(null)}
					>
						Dismiss
					</button>
				</div>
			)}

			{/* Loading overlay */}
			{loading && (
				<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 px-4 py-2 rounded shadow z-20 text-black">
					Loading...
				</div>
			)}
		</div>
	);
}
