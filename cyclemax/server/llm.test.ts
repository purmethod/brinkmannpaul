import { beforeEach, describe, expect, it, vi } from "vitest";
import { readConfig } from "./env";

const calls = { beta: vi.fn(), plain: vi.fn() };
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { create: (p: unknown) => calls.beta(p) } };
    messages = { create: (p: unknown) => calls.plain(p), parse: vi.fn() };
  },
}));

const { createClaude } = await import("./llm");
const answer = { stop_reason: "end_turn", content: [{ type: "text", text: "Ruhig bleiben." }] };
const llm = () => createClaude(readConfig({ ANTHROPIC_API_KEY: "sk-ant-test" }))!;
const ask = () => llm().chat({ system: "s", context: "c", messages: [{ role: "user", content: "hi" }] });

describe("claude client", () => {
  beforeEach(() => {
    calls.beta.mockReset();
    calls.plain.mockReset();
  });

  it("answers with the fallback beta by default", async () => {
    calls.beta.mockResolvedValue(answer);
    expect(await ask()).toEqual({ text: "Ruhig bleiben.", refused: false });
    expect(calls.plain).not.toHaveBeenCalled();
  });

  it("retries plain (no beta, no effort) when the request shape is rejected", async () => {
    calls.beta.mockRejectedValue(Object.assign(new Error("400 fallbacks: Extra inputs are not permitted"), { status: 400 }));
    calls.plain.mockResolvedValue(answer);
    expect((await ask()).text).toBe("Ruhig bleiben.");
    const sent = calls.plain.mock.calls[0][0];
    expect(sent).not.toHaveProperty("output_config");
    expect(sent).not.toHaveProperty("betas");
  });

  it("does not retry on a bad key – check() reports it without the key", async () => {
    calls.beta.mockRejectedValue(Object.assign(new Error("401 invalid x-api-key sk-ant-test"), { status: 401 }));
    await expect(ask()).rejects.toThrow(/401/);
    expect(calls.plain).not.toHaveBeenCalled();
    expect(await llm().check!()).toEqual({ ok: false, error: "401 invalid x-api-key sk-ant-…" });
  });

  it("ignores spaces and line breaks around a pasted key", () => {
    expect(readConfig({ ANTHROPIC_API_KEY: " sk-ant-abc\n" }).anthropicApiKey).toBe("sk-ant-abc");
    expect(readConfig({ ANTHROPIC_API_KEY: "  " }).anthropicApiKey).toBeNull();
  });
});
