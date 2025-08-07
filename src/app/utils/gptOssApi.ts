// Placeholder for gpt-oss API call
export async function generateStoryElements({
	input,
	world,
	mode,
}: {
	input: string;
	world: any;
	mode: string;
}) {
	// Call backend Express proxy, which forwards to gpt-oss
	const response = await fetch('http://localhost:4000/api/chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			messages: [
				{ role: 'system', content: `You are a world-building AI for a collaborative storytelling app. Mode: ${mode}. World state: ${JSON.stringify(world)}. Respond in JSON with new locations, characters, items, and events only.` },
				{ role: 'user', content: input },
			],
			model: 'gpt-oss-20b', // or 'gpt-oss-120b' if using the larger model
			max_tokens: 512,
		}),
	});
	const data = await response.json();
	// Expecting the model to return a JSON string in data.choices[0].message.content
	try {
		const content = data.choices?.[0]?.message?.content;
		if (content) {
			return JSON.parse(content);
		}
	} catch (e) {
		// fallback or error handling
	}
	// fallback: return empty structure
	return { locations: [], characters: [], items: [], events: [] };
}
