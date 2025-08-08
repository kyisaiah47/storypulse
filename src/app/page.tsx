"use client";
import React, { useState } from "react";
import InputBox from "./components/InputBox";
import ModeToggle from "./components/ModeToggle";
import WorldMap3D from "./components/WorldMap3D";
import { useWorldState } from "./hooks/useWorldState";
import { generateStoryElements } from "./utils/gptOssApi";

export default function Page() {
	const [world, setWorld] = useWorldState();
	const [mode, setMode] = useState("education");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [storyLog, setStoryLog] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);

	const handleInput = async (input: string) => {
		setLoading(true);
		setError(null);
		setStoryLog((log) => [...log, { role: 'user', content: input }]);
		try {
			const newElements = await generateStoryElements({ input, world, mode });
			setWorld({
				locations: [...world.locations, ...(newElements.locations || [])],
				characters: [...world.characters, ...(newElements.characters || [])],
				items: [...world.items, ...(newElements.items || [])],
				events: [...world.events, ...(newElements.events || [])],
			});
			// Add AI response to story log (summarize new elements)
			let aiText = '';
			if (newElements.locations?.length)
				aiText += newElements.locations.map((l: any) => `Location: ${l.name} — ${l.description}`).join('\n') + '\n';
			if (newElements.characters?.length)
				aiText += newElements.characters.map((c: any) => `Character: ${c.name} — ${c.description}`).join('\n') + '\n';
			if (newElements.items?.length)
				aiText += newElements.items.map((i: any) => `Item: ${i.name} — ${i.description}`).join('\n') + '\n';
			if (newElements.events?.length)
				aiText += newElements.events.map((e: any) => `Event: ${e.name} — ${e.description}`).join('\n') + '\n';
			if (aiText.trim()) {
				setStoryLog((log) => [...log, { role: 'ai', content: aiText.trim() }]);
			}
		} catch (err: any) {
			setError(err?.message || "Failed to generate story elements.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-sky-700 relative overflow-hidden">
			{/* Animated background blobs */}
			<div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-purple-500 opacity-30 rounded-full blur-3xl animate-pulse z-0" />
			<div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-sky-400 opacity-20 rounded-full blur-2xl animate-pulse z-0" />
			<div className="absolute bottom-0 left-1/2 w-[350px] h-[350px] bg-indigo-400 opacity-20 rounded-full blur-2xl animate-pulse z-0" />

			{/* Top status bar */}
			<div className="fixed top-0 left-0 w-full flex items-center justify-between px-8 py-4 bg-black/40 backdrop-blur-md z-20 border-b border-white/10 shadow-lg">
				<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-lg select-none">
					<span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">StoryPulse</span>
				</h1>
				<div className="flex items-center gap-4">
					<ModeToggle mode={mode} setMode={setMode} />
					{/* You can add session info, avatar, or score here */}
				</div>
			</div>

			{/* Central game window */}
				<div className="relative z-10 w-full flex flex-col items-center justify-center pt-32 pb-24">
					<div className="w-full max-w-6xl flex flex-col sm:flex-row gap-6 items-start justify-center">
						{/* Game window (3D map) */}
						<div className="flex-1 min-w-[350px] max-w-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/20 rounded-3xl shadow-2xl border-2 border-white/20 p-2 sm:p-4 flex flex-col items-center game-window">
							<WorldMap3D
								world={world}
								loading={loading}
								error={error}
								setError={setError}
							/>
						</div>
						{/* Story output panel */}
						<div className="w-full sm:w-[340px] max-w-sm h-[420px] bg-black/60 border border-white/20 rounded-2xl shadow-xl p-4 flex flex-col gap-2 overflow-y-auto text-white font-mono text-sm story-panel">
							<div className="font-bold text-lg mb-2 text-yellow-300 tracking-wide">Story Log</div>
							{storyLog.length === 0 && <div className="text-white/60 italic">No story yet. Start typing below!</div>}
							{storyLog.map((entry, idx) => (
								<div key={idx} className={entry.role === 'user' ? 'text-blue-200' : 'text-pink-200'}>
									<span className="font-semibold mr-1">{entry.role === 'user' ? 'You:' : 'AI:'}</span>
									<span style={{ whiteSpace: 'pre-line' }}>{entry.content}</span>
								</div>
							))}
						</div>
					</div>
				</div>

			{/* Command bar/input at the bottom */}
			<div className="fixed bottom-0 left-0 w-full flex items-center justify-center pb-6 z-30">
				<div className="w-full max-w-2xl px-4">
					<div className="bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-white/30 p-2 flex items-center">
						<InputBox onSubmit={handleInput} />
					</div>
				</div>
			</div>
		</main>
	);
