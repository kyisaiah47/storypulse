// server.ts
import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434/api/chat";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "gpt-oss:20b";

const mapOptions = (b:any) => {
  const o:any = {};
  if (typeof b.temperature === "number") o.temperature = b.temperature;
  if (typeof b.top_p === "number") o.top_p = b.top_p;
  if (typeof b.max_tokens === "number") o.num_predict = b.max_tokens;
  return Object.keys(o).length ? o : undefined;
};

// Non-stream
app.post("/api/chat", async (req, res) => {
  try {
    const upstream = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      messages: req.body.messages,
      options: mapOptions(req.body),
      stream: false,
    }, { timeout: 60_000 });

    const msg = upstream.data?.message ?? { role: "assistant", content: "" };
    return res.json({
      id: `chatcmpl_${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now()/1000),
      model: OLLAMA_MODEL,
      choices: [{ index: 0, message: msg, finish_reason: "stop" }],
    });
  } catch (e:any) {
    return res.status(e?.response?.status || 500).json({ error: e?.message, upstream: e?.response?.data });
  }
});

// Streaming (SSE)
app.post("/api/chat/stream", async (req, res) => {
  try {
    const upstream = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      messages: req.body.messages,
      options: mapOptions(req.body),
      stream: true,
    }, { responseType: "stream", timeout: 0 });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    upstream.data.on("data", (buf: Buffer) => {
      const lines = buf.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const j = JSON.parse(line);
          if (j?.message?.content) {
            res.write(`data: ${JSON.stringify({
              id: `chatcmpl_${Date.now()}`,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now()/1000),
              model: OLLAMA_MODEL,
              choices: [{ index: 0, delta: { content: j.message.content }, finish_reason: null }],
            })}\n\n`);
          }
          if (j?.done) {
            res.write(`data: ${JSON.stringify({
              id: `chatcmpl_${Date.now()}`,
              object: "chat.completion.chunk",
              created: Math.floor(Date.now()/1000),
              model: OLLAMA_MODEL,
              choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
            })}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
          }
        } catch {/* ignore partials */}
      }
    });

    upstream.data.on("error", () => { try { res.end(); } catch {} });
    upstream.data.on("end", () => { try { res.end(); } catch {} });
  } catch (e:any) {
    res.status(500).json({ error: e?.message || "server_error" });
  }
});

app.listen(process.env.PORT || 4000, () =>
  console.log(`🚀 API on http://localhost:${process.env.PORT || 4000}`)
);
