import { useState, useEffect } from "react";

export type WorldState = {
	locations: any[];
	characters: any[];
	items: any[];
	events: any[];
};

const STORAGE_KEY = "storypulse_world_state";

export function useWorldState() {
	const [world, setWorld] = useState<WorldState>({
		locations: [],
		characters: [],
		items: [],
		events: [],
	});

	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) setWorld(JSON.parse(saved));
	}, []);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(world));
	}, [world]);

	return [world, setWorld] as const;
}
