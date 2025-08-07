import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { WorldState } from "../hooks/useWorldState";



function Pin({
	position,
	color,
	label,
	description,
	onClick,
}: {
	position: [number, number, number];
	color: string;
	label: string;
	description: string;
	onClick: () => void;
}) {
	return (
		<mesh
			position={position}
			onClick={onClick}
		>
			<sphereGeometry args={[0.4, 16, 16]} />
			<meshStandardMaterial color={color} />
			<Html
				distanceFactor={10}
				style={{
					pointerEvents: "none",
					color: "#fff",
					fontWeight: "bold",
					fontSize: "0.9rem",
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

	export default function WorldMap3D({ world, loading, error, setError }: WorldMap3DProps) {
		const [selected, setSelected] = useState<{ label: string; description: string } | null>(null);

		// Defensive: fallback for empty world state
		const safeArr = (arr: unknown) => Array.isArray(arr) ? arr : [];
		const locations = safeArr(world.locations);
		const characters = safeArr(world.characters);
		const items = safeArr(world.items);

		// Simple layout: spread pins in a circle for each type
		const pinPositions = (arr: unknown[], radius: number, y: number) =>
			arr.length === 0
				? []
				: arr.map((_, i) => {
						const angle = (i / arr.length) * 2 * Math.PI;
						return [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number];
					});

		const locPositions = pinPositions(locations, 8, 0.5);
		const charPositions = pinPositions(characters, 5, 1.5);
		const itemPositions = pinPositions(items, 3, 2.5);

	return (
		<div className="w-full h-[400px] bg-black rounded mt-4 relative">
			<Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
				{/* @ts-expect-error: JSX types for three.js elements */}
				<ambientLight intensity={0.5} />
				{/* @ts-expect-error: JSX types for three.js elements */}
				<directionalLight position={[10, 10, 5]} intensity={1} />
				{/* Ground plane */}
				{/* @ts-expect-error: JSX types for three.js elements */}
				<mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
					{/* @ts-expect-error: JSX types for three.js elements */}
					<planeGeometry args={[50, 50]} />
					{/* @ts-expect-error: JSX types for three.js elements */}
					<meshStandardMaterial color="#e0e0e0" />
				</mesh>
				{/* Locations */}
				{locations.map((loc: any, i: number) => (
					<Pin
						key={`loc-${i}`}
						position={locPositions[i]}
						color="#f59e42"
						label={loc.name || "Location"}
						description={loc.description || ""}
						onClick={() => setSelected({ label: loc.name, description: loc.description })}
					/>
				))}
				{/* Characters */}
				{characters.map((char: any, i: number) => (
					<Pin
						key={`char-${i}`}
						position={charPositions[i]}
						color="#3b82f6"
						label={char.name || "Character"}
						description={char.description || ""}
						onClick={() => setSelected({ label: char.name, description: char.description })}
					/>
				))}
				{/* Items */}
				{items.map((item: any, i: number) => (
					<Pin
						key={`item-${i}`}
						position={itemPositions[i]}
						color="#10b981"
						label={item.name || "Item"}
						description={item.description || ""}
						onClick={() => setSelected({ label: item.name, description: item.description })}
					/>
				))}
			</Canvas>
			{/* Description overlay */}
			{selected && (
				<div className="absolute left-1/2 top-4 -translate-x-1/2 bg-white bg-opacity-90 rounded shadow-lg px-6 py-4 z-10 max-w-xs text-black">
					<div className="font-bold mb-1">{selected.label}</div>
					<div className="mb-2 text-sm">{selected.description}</div>
					<button className="text-blue-600 underline text-xs" onClick={() => setSelected(null)}>
						Close
					</button>
				</div>
			)}
						{/* Error overlay */}
						{error && setError && (
							<div className="absolute left-1/2 top-20 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-20">
								{error}
								<button className="ml-2 text-xs underline" onClick={() => setError(null)}>Dismiss</button>
							</div>
						)}
						{/* Loading overlay */}
						{loading && (
							<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-80 px-4 py-2 rounded shadow z-20 text-black">
								Loading...
							</div>
						)}
		</div>
	);
}
