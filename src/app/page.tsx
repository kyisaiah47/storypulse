"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend } from "react-icons/fi";
import WorldMap3D from "./components/WorldMap3D";
import { useWorldState } from "./hooks/useWorldState";
import { generateStoryElements } from "./utils/gptOssApi";

// -------------------- ModeToggle (inline) --------------------
function ModeToggle({
	mode,
	setMode,
}: {
	mode: string;
	setMode: (m: string) => void;
}) {
	const modes = ["Education", "Wildcard"];
	return (
		<div className="flex gap-2">
			{modes.map((m) => (
				<button
					key={m}
					onClick={() => setMode(m.toLowerCase())}
					className={`px-3 py-1 rounded-full text-sm font-medium border border-white/20 backdrop-blur-sm transition
						${
							mode.toLowerCase() === m.toLowerCase()
								? "bg-white/30 text-white"
								: "bg-black/30 text-white hover:bg-white/20"
						}`}
				>
					{m}
				</button>
			))}
		</div>
	);
}

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
			>
				<FiSend size={18} />
			</button>
		</form>
	);
}

// -------------------- Page --------------------
interface Location {
	name: string;
	description: string;
}
interface Character {
	name: string;
	description: string;
}
interface Item {
	name: string;
	description: string;
}
interface Event {
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
			setWorld({
				locations: [...world.locations, ...(newElements.locations || [])],
				characters: [...world.characters, ...(newElements.characters || [])],
				items: [...world.items, ...(newElements.items || [])],
				events: [...world.events, ...(newElements.events || [])],
			});

			let aiText = "";
			if (newElements.locations?.length)
				aiText +=
					newElements.locations
						.map((l) => `Location: ${l.name} — ${l.description}`)
						.join("\n") + "\n";
			if (newElements.characters?.length)
				aiText +=
					newElements.characters
						.map((c) => `Character: ${c.name} — ${c.description}`)
						.join("\n") + "\n";
			if (newElements.items?.length)
				aiText +=
					newElements.items
						.map((i) => `Item: ${i.name} — ${i.description}`)
						.join("\n") + "\n";
			if (newElements.events?.length)
				aiText +=
					newElements.events
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
			{/* Full-screen 3D background */}
			<div className="absolute inset-0 z-0">
				<WorldMap3D
					world={world}
					loading={loading}
					error={error}
					setError={setError}
					style={{ width: "100%", height: "100%" }}
				/>
			</div>

			{/* Top Navigation */}
			<div className="absolute top-0 left-0 w-full flex justify-between items-center px-8 py-4 z-20 bg-black/30 backdrop-blur-md border-b border-white/10">
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
						className="absolute right-6 top-24 w-80 max-h-[70vh] overflow-y-auto p-4 bg-black/60 backdrop-blur-lg rounded-lg text-white border border-white/20 z-20 pointer-events-auto"
					>
						<h2 className="font-semibold text-lg mb-3">Story Log</h2>
						{storyLog.map((entry, idx) => (
							<div
								key={idx}
								className={`mb-2 ${
									entry.role === "user" ? "text-indigo-300" : "text-fuchsia-300"
								}`}
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
		</main>
	);
}
