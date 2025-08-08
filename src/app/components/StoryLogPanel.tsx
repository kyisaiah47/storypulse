"use client";
import React from "react";

interface StoryLogEntry {
	role: "user" | "ai";
	content: string;
}

interface StoryLogPanelProps {
	storyLog: StoryLogEntry[];
}

const StoryLogPanel: React.FC<StoryLogPanelProps> = ({ storyLog }) => (
	<div className="w-full sm:w-[340px] max-w-sm h-[420px] bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 flex flex-col gap-3 overflow-y-auto text-neutral-900 font-sans text-base story-panel">
		<div className="font-bold text-lg mb-2 text-indigo-500 tracking-wide">
			Story Log
		</div>
		{storyLog.length === 0 && (
			<div className="text-neutral-500 italic">
				No story yet. Start typing below!
			</div>
		)}
		{storyLog.map((entry, idx) => (
			<div
				key={idx}
				className={
					entry.role === "user" ? "text-indigo-700" : "text-fuchsia-700"
				}
			>
				<span className="font-semibold mr-1">
					{entry.role === "user" ? "You:" : "AI:"}
				</span>
				<span style={{ whiteSpace: "pre-line" }}>{entry.content}</span>
			</div>
		))}
	</div>
);

export default StoryLogPanel;
