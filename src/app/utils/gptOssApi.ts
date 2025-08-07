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
	// TODO: Replace with real gpt-oss call
	// For now, return mock data
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				locations: input.includes("village")
					? [
							{
								name: "Desert Village",
								description: "A small village in the desert.",
							},
					  ]
					: [],
				characters: input.includes("stranger")
					? [
							{
								name: "Mysterious Stranger",
								description: "A stranger with a glowing artifact.",
							},
					  ]
					: [],
				items: input.includes("artifact")
					? [
							{
								name: "Glowing Artifact",
								description: "An artifact that glows with a strange light.",
							},
					  ]
					: [],
				events: [],
			});
		}, 800);
	});
}
