"use client";

import { useMemo, useState } from "react";
import * as THREE from "three"; // ⬅️ add this
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

	const safeArr = (arr: unknown): Entity[] =>
		Array.isArray(arr) ? (arr as Entity[]) : [];
	const locations = safeArr(world.locations);
	const characters = safeArr(world.characters);
	const items = safeArr(world.items);

	// ---------- stable IDs & seeded positions ----------
	const getId = (e: any, kind: string) =>
		e?.id && typeof e.id === "string"
			? e.id
			: `${kind}:${hashString(String(e?.name ?? "Untitled"))}`;

	function hashString(s: string) {
		let h = 0x811c9dc5;
		for (let i = 0; i < s.length; i++) {
			h ^= s.charCodeAt(i);
			h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
		}
		return h >>> 0;
	}

	function mulberry32(seed: number) {
		return function () {
			let t = (seed += 0x6d2b79f5);
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}

	function positionFor(
		id: string,
		index: number,
		total: number,
		baseRadius: number,
		yLevel: number,
		spread = 1
	) {
		const rand = mulberry32(hashString(id));
		const angleJitter = (rand() - 0.5) * (Math.PI / 6);
		const angle = (index / Math.max(1, total)) * Math.PI * 2 + angleJitter;
		const radius = baseRadius + (rand() - 0.5) * spread * 3;
		const x = Math.cos(angle) * radius + (rand() - 0.5) * 1.5;
		const z = Math.sin(angle) * radius + (rand() - 0.5) * 1.5;
		const y = yLevel + (rand() - 0.5) * 0.4;
		return [x, y, z] as [number, number, number];
	}

	function dedupe(ids: string[]) {
		const counts = new Map<string, number>();
		return ids.map((id) => {
			const n = (counts.get(id) ?? 0) + 1;
			counts.set(id, n);
			return n === 1 ? id : `${id}#${n}`;
		});
	}

	const baseLocIds = useMemo(
		() => locations.map((e) => getId(e, "loc")),
		[locations]
	);
	const baseCharIds = useMemo(
		() => characters.map((e) => getId(e, "char")),
		[characters]
	);
	const baseItemIds = useMemo(
		() => items.map((e) => getId(e, "item")),
		[items]
	);

	const locIds = useMemo(() => dedupe(baseLocIds), [baseLocIds]);
	const charIds = useMemo(() => dedupe(baseCharIds), [baseCharIds]);
	const itemIds = useMemo(() => dedupe(baseItemIds), [baseItemIds]);

	const locPositions = useMemo(
		() =>
			locIds.map((id, i) => positionFor(id, i, locIds.length, 14.5, 0.8, 2.4)),
		[locIds]
	);
	const charPositions = useMemo(
		() =>
			charIds.map((id, i) =>
				positionFor(id, i, charIds.length, 10.5, 1.1, 1.8)
			),
		[charIds]
	);
	const itemPositions = useMemo(
		() =>
			itemIds.map((id, i) => positionFor(id, i, itemIds.length, 6.5, 0.5, 1.3)),
		[itemIds]
	);

	return (
		<div className="w-full h-screen bg-black relative">
			<Canvas
				shadows
				dpr={[1, 2]}
				camera={{ position: [0, 5.2, 10], fov: 60, near: 0.1, far: 200 }}
			>
				{/* Sky / horizon */}
				<color
					attach="background"
					args={["#232933"]}
				/>
				<Sky
					distance={4500}
					turbidity={1.2}
					rayleigh={2.1}
					mieCoefficient={0.003}
					mieDirectionalG={0.85}
					inclination={0.42}
					azimuth={0.18}
				/>

				{/* Subtle depth */}
				<fog
					attach="fog"
					args={["#d4c6ad", 28, 90]}
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

				{/* Ground */}
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

				{/* Contact shadows */}
				<ContactShadows
					position={[0, 0.01, 0]}
					opacity={0.33}
					scale={42}
					blur={3}
					far={8}
					resolution={1024}
					frames={1}
				/>

				{/* Pins */}
				{locations.map((loc, i) => {
					const id = locIds[i];
					return (
						<Pin
							key={id}
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
					);
				})}
				{characters.map((char, i) => {
					const id = charIds[i];
					return (
						<Pin
							key={id}
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
					);
				})}
				{items.map((item, i) => {
					const id = itemIds[i];
					return (
						<Pin
							key={id}
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
					);
				})}

				{/* 👉 Drag to PAN, right-drag to rotate */}
				<OrbitControls
					makeDefault
					target={[0, 1.2, 0]}
					enableDamping
					dampingFactor={0.08}
					enablePan
					panSpeed={0.9}
					screenSpacePanning
					minPolarAngle={0.55}
					maxPolarAngle={1.35}
					minDistance={6}
					maxDistance={22}
					zoomSpeed={0.9}
					rotateSpeed={0.9}
					mouseButtons={{
						LEFT: THREE.MOUSE.PAN,
						MIDDLE: THREE.MOUSE.DOLLY,
						RIGHT: THREE.MOUSE.ROTATE,
					}}
					touches={{
						ONE: THREE.TOUCH.PAN,
						TWO: THREE.TOUCH.DOLLY_ROTATE,
					}}
				/>
				<AdaptiveDpr pixelated />
				<Preload all />
			</Canvas>

			{/* Description overlay */}
			{selected && (
				<div className="absolute top-8 right-8 bg-white/40 backdrop-blur-md border border-white/30 rounded-lg shadow-lg px-6 py-4 z-10 max-w-xs text-white">
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
