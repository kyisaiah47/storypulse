"use client";
import React from "react";

export default function ModeToggle({
	mode,
	setMode,
}: {
	mode: string;
	setMode: (m: string) => void;
}) {
	return (
		<div className="flex gap-2">
			{["Education", "Wildcard"].map((m) => (
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
