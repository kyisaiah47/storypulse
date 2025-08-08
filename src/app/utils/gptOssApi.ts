// lib/generateStoryElements.ts
type WorldState = {
  locations?: any[];
  characters?: any[];
  items?: any[];
  events?: any[];
  // ...whatever else you track
};

type StoryElements = {
  locations: any[];
  characters: any[];
  items: any[];
  events: any[];
};

function summarizeWorld(world: WorldState): Partial<WorldState> {
  // keep it lean to save tokens
  const pick = <T>(arr: T[] | undefined, n: number) => (Array.isArray(arr) ? arr.slice(0, n) : []);
  return {
    locations: pick(world.locations, 6),
    characters: pick(world.characters, 8),
    items: pick(world.items, 8),
    events: pick(world.events, 6),
  };
}

export async function generateStoryElements({
  input,
  world,
  mode,
  temperature = 0.6,
  maxTokens = 600,
}: {
  input: string;
  world: WorldState;
  mode: "seed" | "expand" | "connect" | string;
  temperature?: number;
  maxTokens?: number;
}): Promise<StoryElements> {
  const worldBrief = summarizeWorld(world);

  const res = await fetch("http://localhost:4000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // OpenAI-style body for your proxy
      model: "gpt-oss-20b",
      temperature,
      max_tokens: maxTokens,

      // ✅ Ask for JSON only, and signal the proxy to enable Ollama JSON mode
      format: "json",                 // <-- custom flag your backend will look for
      messages: [
        {
          role: "system",
          content:
            "You are a world-building AI for a collaborative storytelling app.\n" +
            "Reasoning: medium\n" +
            "Return JSON only. No prose, no commentary.",
        },
        {
          role: "user",
          content:
            `Mode: ${mode}\n` +
            `Current world (brief): ${JSON.stringify(worldBrief)}\n\n` +
            `Task: Based on the user input, respond ONLY with JSON of the shape:\n` +
            `{ "locations":[], "characters":[], "items":[], "events":[] }\n\n` +
            `User input: ${input}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  // Expect OpenAI-ish shape from your proxy
  const raw = data?.choices?.[0]?.message?.content;
  if (typeof raw !== "string") {
    // Try non-stream Ollama passthrough (some adapters return the object already)
    if (raw && typeof raw === "object") return raw as StoryElements;
    throw new Error("LLM returned no content");
  }

  try {
    const parsed = JSON.parse(raw);
    // minimal guards
    return {
      locations: Array.isArray(parsed.locations) ? parsed.locations : [],
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      items: Array.isArray(parsed.items) ? parsed.items : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    // If the model ever leaks text, this keeps your app stable.
    return { locations: [], characters: [], items: [], events: [] };
  }
}
