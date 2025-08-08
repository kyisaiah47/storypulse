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
		<div className="flex gap-2 items-center mt-2">
			<span className="font-semibold">Mode:</span>
			<button
				className={`px-3 py-1 rounded ${
					mode === "education" ? "bg-green-600 text-white" : "bg-gray-200"
				}`}
				onClick={() => setMode("education")}
			>
				Education
			</button>
			<button
				className={`px-3 py-1 rounded ${
					mode === "wildcard" ? "bg-purple-600 text-white" : "bg-gray-200"
				}`}
				onClick={() => setMode("wildcard")}
			>
				Wildcard
			</button>
		</div>
	);
}
