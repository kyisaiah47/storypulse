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
  "tree","tower","cave","village","water",
  "humanoid","warrior","mage","sprite",
  "sword","potion","gem","scroll","dragon"
] as const;

function brief<T>(arr: T[] | undefined, n: number): T[] {
  return Array.isArray(arr) ? arr.slice(-n) : [];
}

function summarizeWorld(world: WorldState) {
  return {
    locations: brief(world.locations, 6).map(pickCore),
    characters: brief(world.characters, 8).map(pickCore),
    items: brief(world.items, 8).map(pickCore),
    events: brief(world.events, 6).map(pickCore),
  };
  function pickCore(e: any) {
    // keep only small fields to save tokens
    return {
      name: e?.name ?? "",
      shape: e?.shape ?? "",
      size: e?.size ?? "",
      color: e?.color ?? "",
    };
  }
}

function sanitize(elements: any): StoryElements {
  const isHex = (s: any) => typeof s === "string" && /^#[0-9A-Fa-f]{6}$/.test(s);
  const coerce = (list: any[]): Element[] =>
    (Array.isArray(list) ? list : []).map((e) => {
      const name = String(e?.name ?? "").slice(0, 60) || "Untitled";
      const description = String(e?.description ?? "").slice(0, 500);
      const shape = SHAPES.includes(e?.shape) ? e.shape : "gem";
      const color = isHex(e?.color) ? e.color : "#"+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0");
      const size = (["small","medium","large"] as const).includes(e?.size) ? e.size : "medium";
      return { name, description, shape, color, size };
    });

  return {
    locations: coerce(elements?.locations ?? []),
    characters: coerce(elements?.characters ?? []),
    items: coerce(elements?.items ?? []),
    events: coerce(elements?.events ?? []),
  };
}

export async function generateStoryElements({
  input,
  world,
  mode,
  temperature = 0.6,
  maxTokens = 700,
}: {
  input: string;
  world: WorldState;
  mode: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<StoryElements> {
  const worldBrief = summarizeWorld(world);

  const response = await fetch("http://localhost:4000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-oss-20b",
      temperature,
      max_tokens: maxTokens,

      // 👇 tell your proxy to enable Ollama JSON mode
      format: "json",

      messages: [
        {
          role: "system",
          content:
`You are a world-building AI for a collaborative storytelling app.
Reasoning: medium
Return JSON only. No prose or commentary.
Output shape:
{ "locations":[], "characters":[], "items":[], "events":[] }
Each element must include:
- name (string, <=60 chars)
- description (string, <=500 chars)
- shape (one of: ${SHAPES.join(", ")})
- color ("#RRGGBB")
- size ("small" | "medium" | "large")`
        },
        {
          role: "user",
          content:
`Mode: ${mode}
Current world (brief): ${JSON.stringify(worldBrief)}

User input: ${input}

Respond ONLY with JSON of the required shape.`
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`LLM error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;

  // Some adapters already return parsed JSON; handle both cases.
  const parsed = typeof raw === "string" ? safeParseJSON(raw) : raw;
  if (!parsed) return { locations: [], characters: [], items: [], events: [] };

  return sanitize(parsed);
}

function safeParseJSON(s: string | undefined | null) {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
