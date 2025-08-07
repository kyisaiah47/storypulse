import React, { useState } from "react";

export default function InputBox({
	onSubmit,
}: {
	onSubmit: (input: string) => void;
}) {
	const [value, setValue] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (value.trim()) {
			onSubmit(value);
			setValue("");
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex gap-2 mt-4"
		>
			<input
				className="flex-1 border rounded px-3 py-2 text-black"
				type="text"
				placeholder="Type your story..."
				value={value}
				onChange={(e) => setValue(e.target.value)}
			/>
			<button
				type="submit"
				className="bg-blue-600 text-white px-4 py-2 rounded"
			>
				Send
			</button>
		</form>
	);
}
