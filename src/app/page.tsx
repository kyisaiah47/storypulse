"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend } from "react-icons/fi";
import ModeToggle from "./components/ModeToggle";
import { useWorldState } from "./hooks/useWorldState";
import { generateStoryElements } from "./utils/gptOssApi";
import WorldMap3D from "./components/WorldMap3D";

// -------------------- InputBox (inline) --------------------
function InputBox({ onSubmit }: { onSubmit: (text: string) => void }) {
	const [value, setValue] = useState("");
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!value.trim()) return;
		onSubmit(value.trim());
		setValue("");
	};
	return (
		<form
			onSubmit={handleSubmit}
			className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 w-full"
		>
			<input
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder="Type your story..."
				className="flex-1 bg-transparent outline-none text-white placeholder-white/60"
			/>
			<button
				type="submit"
				className="p-2 rounded-full bg-white/30 hover:bg-white/40 transition text-white"
				aria-label="Send"
			>
				<FiSend size={18} />
			</button>
		</form>
	);
}

// -------------------- Page --------------------
interface Base {
	id?: string; // <- allow id from backend or add one client-side
	name: string;
	description: string;
	shape?: string;
	color?: string;
	size?: string;
}
interface Location extends Base {}
interface Character extends Base {}
interface Item extends Base {}
interface Event {
	id?: string;
	name: string;
	description: string;
}
interface WorldState {
	locations: Location[];
	characters: Character[];
	items: Item[];
	events: Event[];
}

export default function Page() {
	const [world, setWorld] = useWorldState() as [
		WorldState,
		React.Dispatch<React.SetStateAction<WorldState>>
	];
	const [mode, setMode] = useState("education");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [storyLog, setStoryLog] = useState<
		{ role: "user" | "ai"; content: string }[]
	>([]);

	// Ensure world is initialized empty on first mount
	useEffect(() => {
		if (!world || !Array.isArray(world.locations)) {
			setWorld({ locations: [], characters: [], items: [], events: [] });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ---------- ID helpers (stable keys) ----------
	const uid = () =>
		globalThis.crypto?.randomUUID?.() ??
		Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

	const withIds = <T extends { id?: string }>(
		arr: T[] | undefined,
		kind: string
	): (T & { id: string })[] =>
		(Array.isArray(arr) ? arr : []).map((e) => ({
			id: e.id ?? `${kind}:${uid()}`,
			...e,
		}));

	const handleInput = async (input: string) => {
		setLoading(true);
		setError(null);
		setStoryLog((log) => [...log, { role: "user", content: input }]);
		try {
			const newElements: Partial<WorldState> = await generateStoryElements({
				input,
				world,
				mode,
			});

			// Stamp stable IDs on ingest to avoid duplicate/unstable keys
			const stamped = {
				locations: withIds(newElements.locations, "loc"),
				characters: withIds(newElements.characters, "char"),
				items: withIds(newElements.items, "item"),
				events: withIds(newElements.events, "evt"),
			};

			// Merge into world (preserve order, no in-place mutations)
			setWorld((prev) => ({
				locations: [...(prev?.locations ?? []), ...(stamped.locations ?? [])],
				characters: [
					...(prev?.characters ?? []),
					...(stamped.characters ?? []),
				],
				items: [...(prev?.items ?? []), ...(stamped.items ?? [])],
				events: [...(prev?.events ?? []), ...(stamped.events ?? [])],
			}));

			// Build readable AI summary log
			let aiText = "";
			if (stamped.locations?.length)
				aiText +=
					stamped.locations
						.map((l) => `Location: ${l.name} — ${l.description}`)
						.join("\n") + "\n";
			if (stamped.characters?.length)
				aiText +=
					stamped.characters
						.map((c) => `Character: ${c.name} — ${c.description}`)
						.join("\n") + "\n";
			if (stamped.items?.length)
				aiText +=
					stamped.items
						.map((i) => `Item: ${i.name} — ${i.description}`)
						.join("\n") + "\n";
			if (stamped.events?.length)
				aiText +=
					stamped.events
						.map((e) => `Event: ${e.name} — ${e.description}`)
						.join("\n") + "\n";

			if (aiText.trim()) {
				setStoryLog((log) => [...log, { role: "ai", content: aiText.trim() }]);
			}
		} catch (err: unknown) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to generate story elements."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="relative w-screen h-screen overflow-hidden font-sans bg-black">
			{/* Optional: Clear World Button */}
			<button
				onClick={() =>
					setWorld({ locations: [], characters: [], items: [], events: [] })
				}
				className="absolute bottom-10 right-8 z-30 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
			>
				Clear World
			</button>

			{/* Full-screen 3D background */}
			<div className="absolute inset-0 z-0">
				<WorldMap3D
					world={world}
					loading={loading}
					error={error}
					setError={setError}
				/>
			</div>

			{/* Top Navigation */}
			<div className="absolute top-0 left-0 w-full flex justify-between items-center px-8 py-4 z-20 backdrop-blur-md">
				<h1 className="text-white font-extrabold tracking-tight text-2xl">
					StoryPulse
				</h1>
				<div className="flex items-center gap-4">
					<span className="text-white text-sm">Mode:</span>
					<ModeToggle
						mode={mode}
						setMode={setMode}
					/>
				</div>
			</div>

			{/* Story Log Panel */}
			<AnimatePresence>
				{storyLog.length > 0 && (
					<motion.div
						initial={{ opacity: 0, x: 80 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 80 }}
						transition={{ duration: 0.4 }}
						className="absolute left-8 top-24 w-80 max-h-[70vh] overflow-y-auto p-4 bg-white/40 backdrop-blur-lg rounded-lg text-white border border-white/30 z-20 pointer-events-auto"
					>
						<h2 className="font-bold mb-1">Story Log</h2>
						{storyLog.map((entry, idx) => (
							<div
								key={idx}
								className="mb-2 text-sm text-white"
							>
								<span className="font-bold">
									{entry.role === "user" ? "You: " : "AI: "}
								</span>
								<span style={{ whiteSpace: "pre-line" }}>{entry.content}</span>
							</div>
						))}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Input Box */}
			<div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[80%] max-w-2xl z-20 pointer-events-auto">
				<InputBox onSubmit={handleInput} />
			</div>

			{/* Error Toast (simple) */}
			{error && (
				<div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white px-4 py-2 rounded">
					{error}
				</div>
			)}
		</main>
	);
}
