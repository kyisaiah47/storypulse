"use client";

import React, { useState } from "react";
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
	shape?: string;
	color?: string;
	size?: string;
}
interface Character {
	name: string;
	description: string;
	shape?: string;
	color?: string;
	size?: string;
}
interface Item {
	name: string;
	description: string;
	shape?: string;
	color?: string;
	size?: string;
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
			console.log("DEBUG newElements:", newElements); // Debug log
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

	// Mock data for testing (with shape/color data)
	const mockWorld: WorldState = {
		locations: [
			{
				name: "Enchanted Forest",
				description: "A mystical forest full of secrets and ancient trees.",
				shape: "tree",
				color: "#228B22",
				size: "large",
			},
			{
				name: "Crystal Lake",
				description:
					"A shimmering lake with magical properties and hidden depths.",
				shape: "water",
				color: "#4682B4",
				size: "medium",
			},
			{
				name: "Sunspire Village",
				description:
					"A bustling village at the edge of the forest, home to many adventurers.",
				shape: "village",
				color: "#DEB887",
				size: "medium",
			},
			{
				name: "Obsidian Tower",
				description:
					"A dark, looming tower said to be the lair of a forgotten sorcerer.",
				shape: "tower",
				color: "#2F2F2F",
				size: "large",
			},
			{
				name: "Whispering Caves",
				description:
					"A network of caves that echo with the voices of the past.",
				shape: "cave",
				color: "#696969",
				size: "medium",
			},
		],
		characters: [
			{
				name: "Elyra",
				description: "A wise elf guardian who protects the forest.",
				shape: "humanoid",
				color: "#98FB98",
				size: "medium",
			},
			{
				name: "Tharn",
				description: "A wandering warrior seeking redemption.",
				shape: "warrior",
				color: "#B22222",
				size: "large",
			},
			{
				name: "Mira",
				description: "A curious inventor from Sunspire Village.",
				shape: "humanoid",
				color: "#FFB6C1",
				size: "small",
			},
			{
				name: "The Shadow Mage",
				description:
					"A mysterious figure rumored to dwell in the Obsidian Tower.",
				shape: "mage",
				color: "#483D8B",
				size: "medium",
			},
			{
				name: "Glim",
				description: "A mischievous sprite who knows every secret path.",
				shape: "sprite",
				color: "#FFD700",
				size: "small",
			},
		],
		items: [
			{
				name: "Ancient Sword",
				description: "A blade with runes of power, lost for centuries.",
				shape: "sword",
				color: "#C0C0C0",
				size: "medium",
			},
			{
				name: "Healing Potion",
				description: "Restores health instantly, brewed from rare herbs.",
				shape: "potion",
				color: "#FF69B4",
				size: "small",
			},
			{
				name: "Crystal Amulet",
				description: "Said to protect the wearer from dark magic.",
				shape: "gem",
				color: "#00CED1",
				size: "small",
			},
			{
				name: "Map of the Caves",
				description: "Shows hidden passages in the Whispering Caves.",
				shape: "scroll",
				color: "#F4A460",
				size: "medium",
			},
			{
				name: "Sunstone",
				description: "A gem that glows with the light of a summer day.",
				shape: "gem",
				color: "#FFA500",
				size: "small",
			},
		],
		events: [
			{
				name: "Moonrise Ritual",
				description:
					"A ceremony under the full moon that awakens ancient magic.",
			},
			{
				name: "Village Festival",
				description:
					"A celebration of the changing seasons in Sunspire Village.",
			},
			{
				name: "Forest Fire",
				description: "A sudden blaze threatens the Enchanted Forest.",
			},
			{
				name: "Cave-In",
				description:
					"A collapse blocks the main entrance to the Whispering Caves.",
			},
			{
				name: "Tower Awakening",
				description:
					"Strange lights and sounds emerge from the Obsidian Tower.",
			},
		],
	};

	return (
		<main className="relative w-screen h-screen overflow-hidden font-sans bg-black">
			{/* Mock Data Button for Testing */}
			<button
				onClick={() => setWorld(mockWorld)}
				className="absolute bottom-10 right-8 z-30 bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
			>
				Inject Mock World
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
