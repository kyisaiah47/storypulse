// lib/generateStoryElements.ts
type Element = {
	name: string;
	description: string;
	shape: string;
	color: string; // "#RRGGBB"
	size: "small" | "medium" | "large";
};

type WorldState = {
	locations?: Element[];
	characters?: Element[];
	items?: Element[];
	events?: Element[];
};

type StoryElements = {
	locations: Element[];
	characters: Element[];
	items: Element[];
	events: Element[];
};

const SHAPES = [
	"tree",
	"tower",
	"cave",
	"village",
	"water",
	"humanoid",
	"warrior",
	"mage",
	"sprite",
	"sword",
	"potion",
	"gem",
	"scroll",
	"dragon",
] as const;

type Kind = keyof StoryElements;

// sensible defaults per kind if shape is missing/invalid
const DEFAULT_SHAPE: Record<Kind, (typeof SHAPES)[number]> = {
	locations: "cave",
	characters: "humanoid",
	items: "gem",
	events: "scroll",
};

// ---------- helpers ----------
function brief<T>(arr: T[] | undefined, n: number): T[] {
	return Array.isArray(arr) ? arr.slice(-n) : [];
}

function summarizeWorld(world: WorldState) {
	return {
		locations: brief(world.locations, 4).map(pickCore),
		characters: brief(world.characters, 6).map(pickCore),
		items: brief(world.items, 6).map(pickCore),
		events: brief(world.events, 4).map(pickCore),
	};
	function pickCore(e: any) {
		return {
			name: e?.name ?? "",
			shape: e?.shape ?? "",
			size: e?.size ?? "",
			color: e?.color ?? "",
		};
	}
}

function sanitize(elements: any): StoryElements {
	const isHex = (s: any) =>
		typeof s === "string" && /^#[0-9A-Fa-f]{6}$/.test(s);
	const nonEmpty = (s: any) => typeof s === "string" && s.trim().length > 0;
	const validShape = (s: any) =>
		typeof s === "string" && (SHAPES as readonly string[]).includes(s);

	const coerce = (list: any[], kind: Kind): Element[] =>
		(Array.isArray(list) ? list : []).map((e) => {
			const name = (nonEmpty(e?.name) ? String(e.name) : "Untitled").slice(
				0,
				60
			);
			const description = (
				nonEmpty(e?.description) ? String(e.description) : "No description."
			).slice(0, 500);
			const shape = validShape(e?.shape) ? e.shape : DEFAULT_SHAPE[kind];
			const color = isHex(e?.color)
				? e.color
				: "#" +
				  Math.floor(Math.random() * 0xffffff)
						.toString(16)
						.padStart(6, "0");
			const size = (["small", "medium", "large"] as const).includes(e?.size)
				? e.size
				: "medium";
			return { name, description, shape, color, size };
		});

	return {
		locations: coerce(elements?.locations ?? [], "locations"),
		characters: coerce(elements?.characters ?? [], "characters"),
		items: coerce(elements?.items ?? [], "items"),
		events: coerce(elements?.events ?? [], "events"),
	};
}

function extractFirstJsonObject(s: string | undefined | null): any | null {
	if (!s) return null;
	const start = s.indexOf("{");
	if (start === -1) return null;
	let depth = 0,
		end = -1;
	for (let i = start; i < s.length; i++) {
		const ch = s[i];
		if (ch === "{") depth++;
		else if (ch === "}") {
			depth--;
			if (depth === 0) {
				end = i + 1;
				break;
			}
		}
	}
	if (end === -1) return null;
	try {
		return JSON.parse(s.slice(start, end));
	} catch {
		return null;
	}
}

// Models that reliably obey JSON gates (OpenAI-compatible response_format)
function isJsonFriendlyModel(model: string) {
	// exclude gpt-oss; include smaller well-behaved families
	return /(llama\s*3|llama3|llama:|qwen|phi|mistral:7b|llava)/i.test(model);
}

// ---------- main ----------
export async function generateStoryElements({
	input,
	world,
	mode,
	temperature = 0.6,
	maxTokens = 500,
	model = process.env.NEXT_PUBLIC_MODEL ?? "llama3:8b",
}: {
	input: string;
	world: WorldState;
	mode: string;
	temperature?: number;
	maxTokens?: number;
	model?: string;
}): Promise<StoryElements> {
	const worldBrief = summarizeWorld(world);
	const jsonFriendly = isJsonFriendlyModel(model);

	const schemaLine =
		`Schema: {"locations":[],"characters":[],"items":[],"events":[]}.\n` +
		`Each element has name (<=60), description (<=500), shape ` +
		`(tree|tower|cave|village|water|humanoid|warrior|mage|sprite|sword|potion|gem|scroll|dragon), ` +
		`color ("#RRGGBB"), size ("small"|"medium"|"large").`;

	const baseSystem =
		`You output ONLY a single JSON object. No prose, no code fences, no comments, ` +
		`and no keys named thinking or reasoning. ${schemaLine} ` +
		`Return exactly 1 location, 1 character, 1 item, 1 event.`;

	// Messages differ slightly for stubborn models
	const messages = jsonFriendly
		? ([
				{ role: "system", content: baseSystem },
				{
					role: "user",
					content:
						`Mode: ${mode}\n` +
						`Current world (brief): ${JSON.stringify(worldBrief)}\n` +
						`Seed: ${input}\n` +
						`Return ONLY the minified JSON starting with { and ending with }.`,
				},
		  ] as const)
		: ([
				{ role: "system", content: baseSystem },
				{
					role: "user",
					content: "Example only. Follow exactly this shape and formatting:",
				},
				{
					role: "assistant",
					content:
						'{"locations":[{"name":"Test Tower","description":"Stub.","shape":"tower","color":"#112233","size":"small"}],"characters":[{"name":"Test Keeper","description":"Stub.","shape":"humanoid","color":"#445566","size":"medium"}],"items":[{"name":"Test Prism","description":"Stub.","shape":"gem","color":"#778899","size":"small"}],"events":[{"name":"Test Reveal","description":"Stub.","shape":"scroll","color":"#AABBCC","size":"small"}]}',
				},
				{ role: "assistant", content: "{" }, // brace seed to bias JSON start
				{
					role: "user",
					content:
						`Mode: ${mode}\n` +
						`Current world (brief): ${JSON.stringify(worldBrief)}\n` +
						`Seed: ${input}\n` +
						`Return ONLY the minified JSON starting with { and ending with }.`,
				},
		  ] as const);

	const body: any = {
		model,
		messages,
		max_tokens: Math.max(250, Math.min(maxTokens, 900)),
		temperature: jsonFriendly ? temperature : Math.min(temperature, 0.4), // cooler for stubborn models
		stream: false,
	};

	// Ask server to enforce JSON only when model tends to honor it
	if (jsonFriendly) body.format = "json"; // server maps to response_format or native format

	const response = await fetch("http://localhost:4000/api/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`LLM error ${response.status}: ${text}`);
	}

	const data = await response.json();
	const raw = data?.choices?.[0]?.message?.content;

	const parsed = typeof raw === "string" ? extractFirstJsonObject(raw) : raw;
	if (!parsed) return { locations: [], characters: [], items: [], events: [] };

	return sanitize(parsed);
}
