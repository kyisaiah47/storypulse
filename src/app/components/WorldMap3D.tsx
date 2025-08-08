"use client";
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, AdaptiveDpr, Preload } from "@react-three/drei";
import * as THREE from "three";
import type { WorldState } from "../hooks/useWorldState";

type Entity = {
	name?: string;
	description?: string;
	shape?: string;
	color?: string;
	size?: string;
	geometry?: string; // e.g. "boxGeometry", "coneGeometry", etc.
	args?: any[]; // geometry args array
};

type PinProps = {
	position: [number, number, number];
	entity: Entity;
	type: "location" | "character" | "item";
	onClick: () => void;
};

function Pin({ position, entity, type, onClick }: PinProps) {
	// Allow AI to specify geometry and args directly
	const getGeometry = () => {
		if (entity.geometry && Array.isArray(entity.args)) {
			switch (entity.geometry) {
				case "boxGeometry":
					return <boxGeometry args={entity.args} />;
				case "coneGeometry":
					return <coneGeometry args={entity.args} />;
				case "cylinderGeometry":
					return <cylinderGeometry args={entity.args} />;
				case "sphereGeometry":
					return <sphereGeometry args={entity.args} />;
				case "octahedronGeometry":
					return <octahedronGeometry args={entity.args} />;
				case "dodecahedronGeometry":
					return <dodecahedronGeometry args={entity.args} />;
				case "capsuleGeometry":
					return <capsuleGeometry args={entity.args} />;
				default:
					return null;
			}
		}
		// Fallback to shape/size logic
		return getGeometryFromShape(entity.shape, entity.size);
	};
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

	const getGeometryFromShape = (shape?: string, size?: string) => {
		const sizeMultiplier =
			size === "large" ? 1.4 : size === "small" ? 0.7 : 1.0;
		switch (shape) {
			// Story locations
			case "castle":
				return (
					<boxGeometry
						args={[
							1.2 * sizeMultiplier,
							1.2 * sizeMultiplier,
							1.2 * sizeMultiplier,
						]}
					/>
				);
			case "forest":
				return (
					<coneGeometry
						args={[1.0 * sizeMultiplier, 2.0 * sizeMultiplier, 12]}
					/>
				);
			case "village":
				return (
					<boxGeometry
						args={[
							1.0 * sizeMultiplier,
							0.7 * sizeMultiplier,
							1.0 * sizeMultiplier,
						]}
					/>
				);
			case "cave":
				return <sphereGeometry args={[0.8 * sizeMultiplier, 10, 8]} />;
			case "temple":
				return (
					<cylinderGeometry
						args={[
							0.7 * sizeMultiplier,
							0.7 * sizeMultiplier,
							1.2 * sizeMultiplier,
							16,
						]}
					/>
				);
			case "ruins":
				return <dodecahedronGeometry args={[0.7 * sizeMultiplier, 0]} />;
			case "mountain":
				return (
					<coneGeometry
						args={[1.2 * sizeMultiplier, 2.5 * sizeMultiplier, 8]}
					/>
				);
			case "lake":
				return (
					<cylinderGeometry
						args={[
							1.2 * sizeMultiplier,
							1.2 * sizeMultiplier,
							0.2 * sizeMultiplier,
							18,
						]}
					/>
				);
			// Old mappings for backward compatibility
			case "tree":
				return (
					<coneGeometry
						args={[0.6 * sizeMultiplier, 1.6 * sizeMultiplier, 8]}
					/>
				);
			case "tower":
				return (
					<cylinderGeometry
						args={[
							0.3 * sizeMultiplier,
							0.5 * sizeMultiplier,
							2.0 * sizeMultiplier,
							8,
						]}
					/>
				);
			// Characters and items (unchanged)
			case "warrior":
				return (
					<capsuleGeometry
						args={[0.4 * sizeMultiplier, 1.2 * sizeMultiplier, 4, 8]}
					/>
				);
			case "mage":
				return (
					<coneGeometry
						args={[0.6 * sizeMultiplier, 1.8 * sizeMultiplier, 6]}
					/>
				);
			case "sprite":
				return <octahedronGeometry args={[0.5 * sizeMultiplier, 0]} />;
			case "humanoid":
				return (
					<capsuleGeometry
						args={[0.3 * sizeMultiplier, 1.0 * sizeMultiplier, 4, 8]}
					/>
				);
			case "dragon":
				return <dodecahedronGeometry args={[0.9 * sizeMultiplier, 0]} />;
			case "sword":
				return (
					<boxGeometry
						args={[
							0.1 * sizeMultiplier,
							1.2 * sizeMultiplier,
							0.1 * sizeMultiplier,
						]}
					/>
				);
			case "potion":
				return (
					<cylinderGeometry
						args={[
							0.2 * sizeMultiplier,
							0.3 * sizeMultiplier,
							0.8 * sizeMultiplier,
							8,
						]}
					/>
				);
			case "gem":
				return <octahedronGeometry args={[0.4 * sizeMultiplier, 1]} />;
			case "scroll":
				return (
					<cylinderGeometry
						args={[
							0.1 * sizeMultiplier,
							0.1 * sizeMultiplier,
							0.8 * sizeMultiplier,
							8,
						]}
					/>
				);
			// Fallback based on type
			case undefined:
			default:
				if (type === "location")
					return <octahedronGeometry args={[0.8 * sizeMultiplier, 0]} />;
				if (type === "character")
					return (
						<coneGeometry
							args={[0.5 * sizeMultiplier, 1.4 * sizeMultiplier, 8]}
						/>
					);
				if (type === "item")
					return (
						<boxGeometry
							args={[
								0.7 * sizeMultiplier,
								0.7 * sizeMultiplier,
								0.7 * sizeMultiplier,
							]}
						/>
					);
				return <sphereGeometry args={[0.6 * sizeMultiplier, 16, 16]} />;
		}
	};

	const getMaterial = () => {
		// Storyful color palette for locations
		let color = entity.color;
		if (!color && type === "location") {
			switch (entity.shape) {
				case "castle":
					color = "#b0a99f";
					break; // stone gray
				case "forest":
					color = "#228B22";
					break; // forest green
				case "village":
					color = "#e2c290";
					break; // thatch yellow
				case "cave":
					color = "#444444";
					break; // dark gray
				case "temple":
					color = "#d4cfc9";
					break; // marble
				case "ruins":
					color = "#8a7f7f";
					break; // old stone
				case "mountain":
					color = "#888888";
					break; // mountain gray
				case "lake":
					color = "#3fa7d6";
					break; // blue
				default:
					color = "#f59e42"; // fallback orange
			}
		}
		if (!color && type === "character") color = "#3b82f6";
		if (!color && type === "item") color = "#10b981";
		const baseProps = { color };
		switch (entity.shape) {
			case "lake":
				return (
					<meshStandardMaterial
						{...baseProps}
						transparent
						opacity={0.7}
						roughness={0.15}
						metalness={0.1}
					/>
				);
			case "forest":
				return (
					<meshStandardMaterial
						{...baseProps}
						roughness={0.7}
						metalness={0.05}
					/>
				);
			case "castle":
			case "temple":
				return (
					<meshStandardMaterial
						{...baseProps}
						metalness={0.4}
						roughness={0.3}
					/>
				);
			case "ruins":
				return (
					<meshStandardMaterial
						{...baseProps}
						metalness={0.2}
						roughness={0.6}
					/>
				);
			case "cave":
			case "mountain":
				return (
					<meshStandardMaterial
						{...baseProps}
						roughness={0.8}
						metalness={0.05}
					/>
				);
			case "gem":
				return (
					<meshStandardMaterial
						{...baseProps}
						metalness={0.9}
						roughness={0.1}
						emissive={color}
						emissiveIntensity={0.2}
					/>
				);
			case "sword":
				return (
					<meshStandardMaterial
						{...baseProps}
						metalness={0.8}
						roughness={0.2}
					/>
				);
			default:
				switch (type) {
					case "location":
						return (
							<meshStandardMaterial
								{...baseProps}
								metalness={0.1}
								roughness={0.3}
								emissive={color}
								emissiveIntensity={0.1}
							/>
						);
					case "character":
						return (
							<meshStandardMaterial
								{...baseProps}
								metalness={0.3}
								roughness={0.4}
							/>
						);
					case "item":
						return (
							<meshStandardMaterial
								{...baseProps}
								metalness={0.7}
								roughness={0.2}
								emissive={color}
								emissiveIntensity={0.05}
							/>
						);
					default:
						return <meshStandardMaterial {...baseProps} />;
				}
		}
	};

	const label =
		entity.name ||
		(type === "location"
			? "Location"
			: type === "character"
			? "Character"
			: "Item");
	const color =
		entity.color ||
		(type === "location"
			? "#f59e42"
			: type === "character"
			? "#3b82f6"
			: "#10b981");

	return (
		<group
			position={position}
			onClick={onClick}
		>
			<mesh
				ref={ref}
				castShadow
				receiveShadow
			>
				{getGeometry()}
				{getMaterial()}
			</mesh>
			{/* Add a subtle glow effect for atmosphere */}
			<mesh
				scale={[1.4, 1.4, 1.4]}
				ref={ref}
			>
				<sphereGeometry args={[0.6, 8, 8]} />
				<meshBasicMaterial
					color={color}
					transparent
					opacity={0.08}
				/>
			</mesh>
			<Html
				transform
				distanceFactor={4}
				style={{
					pointerEvents: "none",
					color: "#fff",
					fontWeight: 700,
					fontSize: 14,
					textShadow: "0 0 6px #000",
					textAlign: "center",
					marginTop:
						type === "character"
							? "-25px"
							: type === "location"
							? "-15px"
							: "-10px",
				}}
			>
				{label}
			</Html>
		</group>
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
				camera={{ position: [0, 6, 10], fov: 70, near: 0.1, far: 200 }}
			>
				{/* Softer depth so the horizon feels natural */}
				<fog
					attach="fog"
					args={["#c9c9c9", 30, 100]}
				/>

				{/* Warmer lighting */}
				<ambientLight
					color="#fff4e6"
					intensity={0.55}
				/>
				<directionalLight
					color="#ffdca8"
					position={[10, 12, 6]}
					intensity={1.15}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
				/>

				{/* Ground */}
				<mesh
					rotation={[-Math.PI / 2, 0, 0]}
					receiveShadow
				>
					<planeGeometry args={[200, 200]} />
					<meshStandardMaterial color="#a9a9a9" />
				</mesh>

				{/* Pins */}
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
