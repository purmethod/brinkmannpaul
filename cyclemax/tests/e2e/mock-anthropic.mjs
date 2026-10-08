// Mock of the Anthropic Messages API for E2E tests (the real SDK talks to it via ANTHROPIC_BASE_URL).
import { createServer } from "node:http";

const port = Number(process.argv[2] ?? 8788);
createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
  const last = body.messages?.at(-1)?.content ?? "";
  const text = String(last).includes("antworten")
    ? "Sie ist überfordert, nicht gegen dich. Sag: „Ich bin da. Wir reden morgen in Ruhe.“"
    : "Bleib ruhig und bei dir. Atme zweimal tief, dann hör ihr zu, ohne zu argumentieren.";
  res.writeHead(200, { "content-type": "application/json" });
  res.end(
    JSON.stringify({
      id: "msg_mock",
      type: "message",
      role: "assistant",
      model: body.model,
      content: [{ type: "text", text }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 10, output_tokens: 10 },
    }),
  );
}).listen(port, () => console.log(`mock anthropic on ${port}`));
