// server.js
import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();

// --- config ---------------------------------------------------------
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json({ limit: "1mb" }));

const OLLAMA_URL =
	process.env.OLLAMA_URL ?? "http://127.0.0.1:11434/v1/chat/completions"; // default to v1
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "gpt-oss:20b";
const PORT = Number(process.env.PORT || 4000);

// detect API flavor by URL
const IS_V1 = /\/v1\//.test(OLLAMA_URL);

// --- utils ----------------------------------------------------------
function mapOptions(body) {
	const o = {};
	if (typeof body?.temperature === "number") o.temperature = body.temperature;
	if (typeof body?.top_p === "number") o.top_p = body.top_p;
	if (typeof body?.max_tokens === "number") o.num_predict = body.max_tokens;
	if (typeof body?.num_ctx === "number") o.num_ctx = body.num_ctx;
	if (typeof body?.num_batch === "number") o.num_batch = body.num_batch;
	return Object.keys(o).length ? o : undefined;
}

function stripReasoning(msg) {
	if (msg && typeof msg === "object") {
		delete msg.thinking;
		delete msg.reasoning;
	}
	return msg;
}

// naive rescue if model leaks prose before/after JSON
function extractFirstJsonObject(s) {
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

// --- stubborn model helpers ----------------------------------------
const EXAMPLE_JSON =
	'{"locations":[{"name":"Test Tower","description":"Stub.","shape":"tower","color":"#112233","size":"small"}],"characters":[{"name":"Test Keeper","description":"Stub.","shape":"humanoid","color":"#445566","size":"medium"}],"items":[{"name":"Test Prism","description":"Stub.","shape":"gem","color":"#778899","size":"small"}],"events":[{"name":"Test Reveal","description":"Stub.","shape":"scroll","color":"#AABBCC","size":"small"}]}';

function isStubbornModel(model) {
	// treat all gpt-oss models as stubborn; add others here if needed
	return /gpt-oss/i.test(model);
}

/**
 * If model is stubborn AND client asked for JSON, wrap messages with:
 *  - strict system
 *  - one-shot example
 *  - brace seed
 * Returns { messages, forcePlain } where forcePlain=true means: do NOT set response_format/format
 */
function wrapStubbornMessages(messages, wantsJson) {
	if (!wantsJson) return { messages, forcePlain: false };

	const userSeed = messages?.[messages.length - 1]?.content || "Seed: (none)";
	const systemMsg = {
		role: "system",
		content:
			'You output ONLY a single JSON object. No prose, no code fences, no comments, and no keys named thinking or reasoning. Schema: {"locations":[],"characters":[],"items":[],"events":[]}. Each element has name (<=60), description (<=500), shape (tree|tower|cave|village|water|humanoid|warrior|mage|sprite|sword|potion|gem|scroll|dragon), color ("#RRGGBB"), size ("small"|"medium"|"large"). Return exactly 1 location, 1 character, 1 item, 1 event.',
	};

	const wrapped = [
		systemMsg,
		{
			role: "user",
			content: "Example only. Follow exactly this shape and formatting:",
		},
		{ role: "assistant", content: EXAMPLE_JSON },
		{ role: "assistant", content: "{" }, // brace seed
		{ role: "user", content: userSeed },
	];

	return { messages: wrapped, forcePlain: true };
}

// --- health ---------------------------------------------------------
app.get("/health", (_req, res) => {
	res.json({ ok: true, upstream: OLLAMA_URL, mode: IS_V1 ? "v1" : "native" });
});

// --- non-stream -----------------------------------------------------
app.post("/api/chat", async (req, res) => {
	try {
		const model = req.body.model ?? DEFAULT_MODEL;
		const wantsJson = req.body?.format === "json";
		let messages = req.body.messages ?? [];

		// Stubborn-mode transform
		const stubborn = isStubbornModel(model);
		let forcePlain = false;
		if (stubborn && wantsJson) {
			const wrapped = wrapStubbornMessages(messages, wantsJson);
			messages = wrapped.messages;
			forcePlain = wrapped.forcePlain;
		}

		const payload = IS_V1
			? {
					model,
					messages,
					max_tokens: req.body.max_tokens ?? 600,
					temperature: stubborn
						? Math.min(req.body.temperature ?? 0.6, 0.4)
						: req.body.temperature ?? 0.6,
					response_format:
						wantsJson && !forcePlain ? { type: "json_object" } : undefined,
					stream: false,
			  }
			: {
					model,
					messages,
					options: mapOptions(req.body),
					...(wantsJson && !forcePlain ? { format: "json" } : {}),
					stream: false,
			  };

		const upstream = await axios.post(OLLAMA_URL, payload, {
			timeout: 90_000,
			headers: { "Content-Type": "application/json" },
			transitional: { clarifyTimeoutError: true },
			decompress: true,
			maxContentLength: Infinity,
			maxBodyLength: Infinity,
		});

		// Normalize response
		let msg = { role: "assistant", content: "" };
		let finish = "stop";

		if (IS_V1 && Array.isArray(upstream.data?.choices)) {
			msg = upstream.data.choices[0]?.message ?? msg;
			finish = upstream.data.choices[0]?.finish_reason ?? "stop";
		} else if (upstream.data?.message) {
			// native /api/chat
			msg = upstream.data.message ?? msg;
			finish = upstream.data.done ? "stop" : finish;
		} else if (typeof upstream.data?.response === "string") {
			// native /api/generate
			msg = { role: "assistant", content: upstream.data.response };
		}

		msg = stripReasoning(msg);

		// Optional rescue for JSON mode if content is a string blob
		if (wantsJson && typeof msg?.content === "string") {
			const rescued = extractFirstJsonObject(msg.content);
			if (rescued) msg.content = JSON.stringify(rescued);
		}

		return res.json({
			id: `chatcmpl_${Date.now()}`,
			object: "chat.completion",
			created: Math.floor(Date.now() / 1000),
			model,
			choices: [{ index: 0, message: msg, finish_reason: finish }],
		});
	} catch (e) {
		console.error("Upstream error:", e?.response?.data || e?.message);
		return res.status(e?.response?.status || 500).json({
			error: e?.message || "server_error",
			upstream: e?.response?.data,
		});
	}
});

// --- streaming (SSE) -----------------------------------------------
app.post("/api/chat/stream", async (req, res) => {
	try {
		const model = req.body.model ?? DEFAULT_MODEL;
		const wantsJson = req.body?.format === "json";
		let messages = req.body.messages ?? [];

		// Stubborn-mode transform for streaming too
		const stubborn = isStubbornModel(model);
		let forcePlain = false;
		if (stubborn && wantsJson) {
			const wrapped = wrapStubbornMessages(messages, wantsJson);
			messages = wrapped.messages;
			forcePlain = wrapped.forcePlain;
		}

		const payload = IS_V1
			? {
					model,
					messages,
					max_tokens: req.body.max_tokens ?? 600,
					temperature: stubborn
						? Math.min(req.body.temperature ?? 0.6, 0.4)
						: req.body.temperature ?? 0.6,
					response_format:
						wantsJson && !forcePlain ? { type: "json_object" } : undefined,
					stream: true,
			  }
			: {
					model,
					messages,
					options: mapOptions(req.body),
					...(wantsJson && !forcePlain ? { format: "json" } : {}),
					stream: true,
			  };

		const upstream = await axios.post(OLLAMA_URL, payload, {
			responseType: "stream",
			timeout: 0,
			headers: { "Content-Type": "application/json" },
		});

		// SSE headers
		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache, no-transform");
		res.setHeader("Connection", "keep-alive");

		// Heartbeat to keep proxies happy
		const heartbeat = setInterval(() => res.write(": ping\n\n"), 15_000);

		upstream.data.on("data", (buf) => {
			const chunk = buf.toString();

			if (IS_V1) {
				// OpenAI-style SSE
				for (const line of chunk.split("\n")) {
					const trimmed = line.trim();
					if (!trimmed.startsWith("data:")) continue;

					const payloadStr = trimmed.slice(5).trim();
					if (payloadStr === "[DONE]") {
						res.write(
							`data: ${JSON.stringify({
								id: `chatcmpl_${Date.now()}`,
								object: "chat.completion.chunk",
								created: Math.floor(Date.now() / 1000),
								model,
								choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
							})}\n\n`
						);
						res.write("data: [DONE]\n\n");
						continue;
					}

					try {
						const j = JSON.parse(payloadStr);
						const c = j.choices?.[0];
						const textChunk =
							(c?.delta?.content ?? "") ||
							(typeof c?.message?.content === "string"
								? c.message.content
								: "");

						if (textChunk) {
							res.write(
								`data: ${JSON.stringify({
									id: `chatcmpl_${Date.now()}`,
									object: "chat.completion.chunk",
									created: Math.floor(Date.now() / 1000),
									model,
									choices: [
										{
											index: 0,
											delta: { content: textChunk },
											finish_reason: null,
										},
									],
								})}\n\n`
							);
						}
					} catch {
						/* ignore partials */
					}
				}
			} else {
				// Native /api/chat stream: one JSON per line
				const lines = chunk.split("\n").filter(Boolean);
				for (const line of lines) {
					try {
						const j = JSON.parse(line);
						const content =
							typeof j?.message?.content === "string" ? j.message.content : "";
						if (content) {
							res.write(
								`data: ${JSON.stringify({
									id: `chatcmpl_${Date.now()}`,
									object: "chat.completion.chunk",
									created: Math.floor(Date.now() / 1000),
									model,
									choices: [
										{ index: 0, delta: { content }, finish_reason: null },
									],
								})}\n\n`
							);
						}
						if (j?.done) {
							res.write(
								`data: ${JSON.stringify({
									id: `chatcmpl_${Date.now()}`,
									object: "chat.completion.chunk",
									created: Math.floor(Date.now() / 1000),
									model,
									choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
								})}\n\n`
							);
							res.write("data: [DONE]\n\n");
						}
					} catch {
						/* ignore partials */
					}
				}
			}
		});

		const end = () => {
			clearInterval(heartbeat);
			try {
				res.end();
			} catch {}
		};

		upstream.data.on("end", end);
		upstream.data.on("error", end);
		req.on("close", end);
	} catch (e) {
		return res.status(500).json({ error: e?.message || "server_error" });
	}
});

// --- boot -----------------------------------------------------------
app.listen(PORT, () => {
	console.log(`🚀 API on http://localhost:${PORT}`);
	console.log(
		`→ Using ${
			IS_V1 ? "OpenAI-compatible /v1" : "native /api"
		} at ${OLLAMA_URL}`
	);
});
