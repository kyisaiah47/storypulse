"use client";
import React from "react";
import ModeToggle from "./ModeToggle";

interface StatusBarProps {
	mode: string;
	setMode: (mode: string) => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ mode, setMode }) => (
	<div className="fixed top-0 left-0 w-full flex items-center justify-between px-8 py-4 bg-white/10 backdrop-blur-lg z-20 border-b border-white/10 shadow-md">
		<h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 drop-shadow select-none">
			<span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
				StoryPulse
			</span>
		</h1>
		<div className="flex items-center gap-4">
			<ModeToggle
				mode={mode}
				setMode={setMode}
			/>
		</div>
	</div>
);

export default StatusBar;
