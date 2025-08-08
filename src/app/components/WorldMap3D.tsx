"use client";
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, AdaptiveDpr, Preload } from "@react-three/drei";
import type { WorldState } from "../hooks/useWorldState";

type Entity = { name?: string; description?: string };

type PinProps = {
	position: [number, number, number];
	color: string;
	label: string;
	onClick: () => void;
};

function Pin({ position, color, label, onClick }: PinProps) {
	const ref = useRef<THREE.Mesh>(null!);
	// Randomized phase so pins don't bounce in unison
	const phase = useMemo(() => Math.random() * Math.PI * 2, []);
	const baseY = position[1];

	useFrame(({ clock }) => {
		const t = clock.getElapsedTime();
		const bob = Math.sin(t * 0.9 + phase) * 0.25; // gentle 0.25u bob
		if (ref.current) {
			ref.current.position.y = baseY + bob;
			ref.current.rotation.y = Math.sin(t * 0.5 + phase) * 0.2; // subtle sway
		}
	});

	return (
		<mesh
			ref={ref}
			position={position}
			onClick={onClick}
			castShadow
		>
			<sphereGeometry args={[0.6, 16, 16]} />
			<meshStandardMaterial color={color} />
			<Html
				transform
				distanceFactor={4}
				style={{
					pointerEvents: "none",
					color: "#fff",
					fontWeight: 700,
					fontSize: 14,
					textShadow: "0 0 4px #000",
				}}
			>
				{label}
			</Html>
		</mesh>
	);
}

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

	const pinPositions = (arr: Entity[], radius: number, y: number) =>
		arr.length === 0
			? []
			: arr.map((_, i) => {
					const angle = (i / arr.length) * 2 * Math.PI;
					return [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [
						number,
						number,
						number
					];
			  });

	const locPositions = pinPositions(locations, 8, 0.5);
	const charPositions = pinPositions(characters, 5, 1.5);
	const itemPositions = pinPositions(items, 3, 2.5);

	return (
		<div className="w-full h-screen bg-black relative">
			<Canvas
				shadows
				dpr={[1, 2]}
				camera={{ position: [0, 6, 10], fov: 70, near: 0.1, far: 200 }}
			>
				{/* Softer depth so the horizon feels natural */}
				{/* @ts-expect-error three types */}
				<fog
					attach="fog"
					args={["#c9c9c9", 30, 100]}
				/>

				{/* Warmer lighting */}
				{/* @ts-expect-error three types */}
				<ambientLight
					color="#fff4e6"
					intensity={0.55}
				/>
				{/* @ts-expect-error three types */}
				<directionalLight
					color="#ffdca8"
					position={[10, 12, 6]}
					intensity={1.15}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
				/>

				{/* Ground */}
				{/* @ts-expect-error three types */}
				<mesh
					rotation={[-Math.PI / 2, 0, 0]}
					receiveShadow
				>
					{/* @ts-expect-error three types */}
					<planeGeometry args={[200, 200]} />
					{/* @ts-expect-error three types */}
					<meshStandardMaterial color="#a9a9a9" />
				</mesh>

				{/* Pins */}
				{locations.map((loc, i) => (
					<Pin
						key={`loc-${i}`}
						position={locPositions[i]}
						color="#f59e42"
						label={loc.name || "Location"}
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
						color="#3b82f6"
						label={char.name || "Character"}
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
						color="#10b981"
						label={item.name || "Item"}
						onClick={() =>
							setSelected({
								label: item.name || "Item",
								description: item.description || "",
							})
						}
					/>
				))}

				{/* Controls & perf */}
				<OrbitControls
					makeDefault
					target={[0, 1.5, 0]}
					minPolarAngle={0.6}
					maxPolarAngle={1.3}
					enableDamping
					dampingFactor={0.08}
				/>
				<AdaptiveDpr pixelated />
				<Preload all />
			</Canvas>

			{/* Description overlay */}
			{selected && (
				<div className="absolute top-20 right-8 bg-white/90 rounded shadow-lg px-6 py-4 z-10 max-w-xs text-black">
					<div className="font-bold mb-1">{selected.label}</div>
					<div className="mb-2 text-sm">{selected.description}</div>
					<button
						className="text-blue-600 underline text-xs"
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
