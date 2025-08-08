"use client";
import React from "react";
import InputBox from "./InputBox";

interface CommandBarProps {
	onSubmit: (input: string) => void;
}

const CommandBar: React.FC<CommandBarProps> = ({ onSubmit }) => (
	<div className="fixed bottom-0 left-0 w-full flex items-center justify-center pb-8 z-30">
		<div className="w-full max-w-2xl px-4">
			<div className="bg-white/90 backdrop-blur-lg rounded-full shadow-md border border-white/30 p-2 flex items-center transition-all focus-within:ring-2 focus-within:ring-indigo-400">
				<InputBox onSubmit={onSubmit} />
			</div>
		</div>
	</div>
);

export default CommandBar;
