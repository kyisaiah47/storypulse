"use client";

import React, { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type {
	PinProps,
	BoxGeometryArgs,
	ConeGeometryArgs,
	CylinderGeometryArgs,
	SphereGeometryArgs,
	OctahedronGeometryArgs,
	DodecahedronGeometryArgs,
	CapsuleGeometryArgs,
} from "./types";

export default function Pin({ position, entity, type, onClick }: PinProps) {
	const [hovered, setHovered] = useState(false);
	const ref = useRef<THREE.Mesh>(null!);
	const { camera } = useThree();
	const [df, setDf] = useState(4); // label scale factor
	const worldPos = useMemo(() => new THREE.Vector3(), []);
	// Randomized phase so pins don't bounce in unison
	const phase = useMemo(() => Math.random() * Math.PI * 2, []);
	const baseY = position[1];

	useFrame(({ clock }) => {
		if (!ref.current) return;
		const t = clock.getElapsedTime();
		const anim = entity.animation?.type ?? "bounce";
		const speed = entity.animation?.speed ?? 1;
		// Animate mesh
		switch (anim) {
			case "spin":
				ref.current.rotation.y = t * speed;
				break;
			case "bounce":
				ref.current.position.y = baseY + Math.sin(t * speed + phase) * 0.25;
				break;
			case "pulse":
				ref.current.scale.setScalar(1 + Math.sin(t * speed + phase) * 0.15);
				break;
			case "none":
			default:
				// Subtle idle motion
				ref.current.position.y = baseY + Math.sin(t * 0.9 + phase) * 0.25;
				ref.current.rotation.y = Math.sin(t * 0.5 + phase) * 0.2;
				break;
		}
		// Distance-aware label scaling (tighter clamp)
		ref.current.getWorldPosition(worldPos);
		const dist = camera.position.distanceTo(worldPos);
		const next = THREE.MathUtils.clamp(dist / 5.2, 2.2, 5.2);
		if (Math.abs(next - df) > 0.05) setDf(next);
	});

	// Allow AI to specify geometry and args directly
	const getGeometry = () => {
		if (entity.geometry && entity.args) {
			switch (entity.geometry) {
				case "boxGeometry":
					return <boxGeometry args={entity.args as BoxGeometryArgs} />;
				case "coneGeometry":
					{
						/* Subtle aura */
					}
					<mesh scale={[1.3, 1.3, 1.3]}>
						<sphereGeometry args={[0.6, 14, 14]} />
						<meshBasicMaterial
							color={color}
							transparent
							opacity={hovered ? 0.14 : 0.07}
						/>
					</mesh>;
					{
						/* Ground ring to anchor */
					}
					<mesh
						rotation={[-Math.PI / 2, 0, 0]}
						position={[0, -0.01, 0]}
						receiveShadow
					>
						<ringGeometry args={[0.38, 0.6, 48]} />
						<meshBasicMaterial
							transparent
							opacity={hovered ? 0.18 : 0.1}
						/>
					</mesh>;
			}
		}
		// Fallback to shape/size logic
		return getGeometryFromShape(entity.shape, entity.size);
	};

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
		// If entity.material is present, use it for full customization
		if (entity.material) {
			// Merge color from entity.color if not present in material
			const matProps = { color: entity.color, ...entity.material };
			return <meshStandardMaterial {...matProps} />;
		}
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

	// Prefer label > emoji > icon > name > fallback
	let labelContent: React.ReactNode = null;
	if (entity.label) {
		labelContent = entity.label;
	} else if (entity.emoji) {
		labelContent = <span style={{ fontSize: 20 }}>{entity.emoji}</span>;
	} else if (entity.icon) {
		labelContent = <span style={{ fontSize: 18 }}>{entity.icon}</span>;
	} else if (entity.name) {
		labelContent = entity.name;
	} else {
		labelContent =
			type === "location"
				? "Location"
				: type === "character"
				? "Character"
				: "Item";
	}
	const color =
		entity.color ||
		(type === "location"
			? "#f59e42"
			: type === "character"
			? "#3b82f6"
			: "#10b981");

	// Handle click: call parent onClick and also handle entity.onClick action
	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (typeof entity.onClick === "string") {
			// Example: log or trigger event
			console.log("Entity onClick:", entity.onClick);
		} else if (typeof entity.onClick === "object" && entity.onClick?.action) {
			console.log("Entity onClick:", entity.onClick);
			console.log(
				"Entity onClick action:",
				entity.onClick.action,
				entity.onClick
			);
		}
		onClick();
	};

	// Tooltip for hover
	let tooltip: string | undefined = undefined;
	if (typeof entity.onHover === "string") {
		tooltip = entity.onHover;
	} else if (typeof entity.onHover === "object" && entity.onHover?.tooltip) {
		tooltip = entity.onHover.tooltip;
	}

	// Render lights for this entity
	const renderLights = () =>
		entity.lights?.map((light, idx) => {
			const common = {
				key: idx,
				color: light.color,
				intensity: light.intensity,
				position: light.position,
			};
			switch (light.type) {
				case "point":
					return <pointLight {...common} />;
				case "spot":
					return <spotLight {...common} />;
				case "directional":
					return <directionalLight {...common} />;
				case "ambient":
					return <ambientLight {...common} />;
				default:
					return null;
			}
		});

	return (
		<group
			position={entity.position ?? position}
			rotation={entity.rotation}
			scale={entity.scale}
			onClick={handleClick}
			onPointerOver={() => setHovered(true)}
			onPointerOut={() => setHovered(false)}
		>
			{renderLights()}
			<mesh
				ref={ref}
				castShadow
				receiveShadow
			>
				{getGeometry()}
				{getMaterial()}
			</mesh>
			{/* Subtle aura */}
			<mesh scale={[1.35, 1.35, 1.35]}>
				<sphereGeometry args={[0.6, 12, 12]} />
				<meshBasicMaterial
					color={color}
					transparent
					opacity={hovered ? 0.18 : 0.08}
				/>
			</mesh>
			{/* Ground ring to anchor */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[0, -0.01, 0]}
				receiveShadow
			>
				<ringGeometry args={[0.4, 0.65, 32]} />
				<meshBasicMaterial
					transparent
					opacity={hovered ? 0.22 : 0.12}
				/>
			</mesh>
			{/* Billboard label */}
			<Text
				position={[0, 1.05, 0]}
				fontSize={0.12 * df}
				color="#ffffff"
				anchorX="center"
				anchorY="bottom"
				outlineWidth={0.006}
				outlineColor="rgba(0,0,0,0.8)"
				maxWidth={2.2}
				billboard
				renderOrder={10}
				depthTest={false}
				transparent
				opacity={hovered ? 1 : 0.85}
				visible={hovered || df <= 4.8}
			>
				{String(labelContent)}
			</Text>
			{/* Recursively render children as sub-groups */}
			{entity.children?.map((child, idx) => (
				<Pin
					key={idx}
					position={child.position ?? [0, 0, 0]}
					entity={child}
					type={type}
					onClick={onClick}
				/>
			))}
		</group>
	);
}
