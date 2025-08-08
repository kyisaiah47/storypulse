// lib/ai.ts
export async function chat(messages: any[], opts?: {temperature?:number; max_tokens?:number}) {
  const r = await fetch("/api/chat", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ messages, ...opts }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function streamChat(messages:any[], opts?: {signal?:AbortSignal; temperature?:number; max_tokens?:number}, onToken?:(t:string)=>void) {
  return fetch("/api/chat/stream", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ messages, stream: true, ...opts }),
    signal: opts?.signal,
  }).then(async r => {
    const reader = r.body!.getReader();
    const dec = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";
      for (const f of frames) {
        if (!f.startsWith("data:")) continue;
        const payload = f.slice(5).trim();
        if (payload === "[DONE]") return;
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content ?? "";
        if (delta && onToken) onToken(delta);
      }
    }
  });
}
