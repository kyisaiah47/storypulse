import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { WorldState } from "../hooks/useWorldState";

type PinType = "location" | "character" | "item";

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

export default function WorldMap3D({ world }: { world: WorldState }) {
	const [selected, setSelected] = useState<{
		label: string;
		description: string;
	} | null>(null);

	// Simple layout: spread pins in a circle for each type
	const pinPositions = (arr: any[], radius: number, y: number) =>
		arr.map((el, i) => {
			const angle = (i / arr.length) * 2 * Math.PI;
			return [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [
				number,
				number,
				number
			];
		});

	const locPositions = pinPositions(world.locations, 8, 0.5);
	const charPositions = pinPositions(world.characters, 5, 1.5);
	const itemPositions = pinPositions(world.items, 3, 2.5);

	return (
		<div className="w-full h-[400px] bg-black rounded mt-4 relative">
			<Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
				{/* @ts-expect-error: JSX types for three.js elements */}
				<ambientLight intensity={0.5} />
				{/* @ts-expect-error */}
				<directionalLight
					position={[10, 10, 5]}
					intensity={1}
				/>
				{/* Ground plane */}
				{/* @ts-expect-error */}
				<mesh
					rotation={[-Math.PI / 2, 0, 0]}
					receiveShadow
				>
					{/* @ts-expect-error */}
					<planeGeometry args={[50, 50]} />
					{/* @ts-expect-error */}
					<meshStandardMaterial color="#e0e0e0" />
				</mesh>
				{/* Locations */}
				{world.locations.map((loc, i) => (
					<Pin
						key={`loc-${i}`}
						position={locPositions[i]}
						color="#f59e42"
						label={loc.name || "Location"}
						description={loc.description || ""}
						onClick={() =>
							setSelected({ label: loc.name, description: loc.description })
						}
					/>
				))}
				{/* Characters */}
				{world.characters.map((char, i) => (
					<Pin
						key={`char-${i}`}
						position={charPositions[i]}
						color="#3b82f6"
						label={char.name || "Character"}
						description={char.description || ""}
						onClick={() =>
							setSelected({ label: char.name, description: char.description })
						}
					/>
				))}
				{/* Items */}
				{world.items.map((item, i) => (
					<Pin
						key={`item-${i}`}
						position={itemPositions[i]}
						color="#10b981"
						label={item.name || "Item"}
						description={item.description || ""}
						onClick={() =>
							setSelected({ label: item.name, description: item.description })
						}
					/>
				))}
			</Canvas>
			{/* Description overlay */}
			{selected && (
				<div className="absolute left-1/2 top-4 -translate-x-1/2 bg-white bg-opacity-90 rounded shadow-lg px-6 py-4 z-10 max-w-xs text-black">
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
		</div>
	);
}
