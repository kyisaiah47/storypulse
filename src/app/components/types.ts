export type MaterialProps = {
	color?: string;
	metalness?: number;
	roughness?: number;
	opacity?: number;
	transparent?: boolean;
	emissive?: string;
	emissiveIntensity?: number;
	// Add more meshStandardMaterial props as needed
};

export type BoxGeometryArgs = [
	width?: number,
	height?: number,
	depth?: number,
	widthSegments?: number,
	heightSegments?: number,
	depthSegments?: number
];

export type ConeGeometryArgs = [
	radius?: number,
	height?: number,
	radialSegments?: number,
	heightSegments?: number,
	openEnded?: boolean,
	thetaStart?: number,
	thetaLength?: number
];

export type CylinderGeometryArgs = [
	radiusTop?: number,
	radiusBottom?: number,
	height?: number,
	radialSegments?: number,
	heightSegments?: number,
	openEnded?: boolean,
	thetaStart?: number,
	thetaLength?: number
];

export type SphereGeometryArgs = [
	radius?: number,
	widthSegments?: number,
	heightSegments?: number,
	phiStart?: number,
	phiLength?: number,
	thetaStart?: number,
	thetaLength?: number
];

export type OctahedronGeometryArgs = [radius?: number, detail?: number];
export type DodecahedronGeometryArgs = [radius?: number, detail?: number];

export type CapsuleGeometryArgs = [
	radius?: number,
	length?: number,
	capSegments?: number,
	radialSegments?: number,
	heightSegments?: number
];

export type EntityOnClick = string | { action: string; [key: string]: unknown };
export type EntityOnHover =
	| string
	| { tooltip: string; [key: string]: unknown };

export type LightProps = {
	type: "point" | "spot" | "directional" | "ambient";
	color?: string;
	intensity?: number;
	position?: [number, number, number];
	[key: string]: unknown;
};

export type GeometryArgs =
	| BoxGeometryArgs
	| ConeGeometryArgs
	| CylinderGeometryArgs
	| SphereGeometryArgs
	| OctahedronGeometryArgs
	| DodecahedronGeometryArgs
	| CapsuleGeometryArgs;

export type AnimationProps = {
	type?: "spin" | "bounce" | "pulse" | "none";
	speed?: number;
};

export type Entity = {
	name?: string;
	label?: string;
	icon?: string;
	emoji?: string;
	description?: string;
	shape?: string;
	color?: string;
	size?: string;
	geometry?:
		| "boxGeometry"
		| "coneGeometry"
		| "cylinderGeometry"
		| "sphereGeometry"
		| "octahedronGeometry"
		| "dodecahedronGeometry"
		| "capsuleGeometry";
	args?: GeometryArgs;
	material?: MaterialProps;
	position?: [number, number, number];
	rotation?: [number, number, number];
	scale?: [number, number, number];
	animation?: AnimationProps;
	onClick?: EntityOnClick;
	onHover?: EntityOnHover;
	lights?: LightProps[];
	children?: Entity[];
};

export type PinProps = {
	position: [number, number, number];
	entity: Entity;
	type: "location" | "character" | "item";
	onClick: () => void;
};
