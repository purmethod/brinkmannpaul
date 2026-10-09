// Claude access – server only. The key never reaches the client.
// `Llm` is the seam for tests (mocked) and the offline fallback (null).
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type * as z from "zod/v4";
import type { ChatMessage } from "../shared/types";
import type { Config } from "./env";

export interface LlmChatParams {
  system: string;
  context: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

export interface Llm {
  chat(params: LlmChatParams): Promise<{ text: string; refused: boolean }>;
  json<T>(schema: z.ZodType<T>, system: string, prompt: string, maxTokens?: number): Promise<T | null>;
}

export function createClaude(config: Config): Llm | null {
  if (!config.anthropicApiKey) return null;
  const client = new Anthropic({ apiKey: config.anthropicApiKey, maxRetries: 2, timeout: 40_000 });
  const outputConfig = config.claudeEffort ? { output_config: { effort: config.claudeEffort } } : {};

  return {
    async chat({ system, context, messages, maxTokens = 700 }) {
      const params = {
        model: config.claudeModel,
        max_tokens: maxTokens,
        // Stable knowledge prefix is cached; the per-request context comes after it.
        system: [
          { type: "text" as const, text: system, cache_control: { type: "ephemeral" as const } },
          { type: "text" as const, text: context },
        ],
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        ...outputConfig,
      };
      const res = config.claudeFallbacks
        ? await client.beta.messages.create({
            ...params,
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
          })
        : await client.messages.create(params);
      if (res.stop_reason === "refusal") return { text: "", refused: true };
      const text = res.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .trim();
      return { text, refused: false };
    },

    async json(schema, system, prompt, maxTokens = 4000) {
      const res = await client.messages.parse({
        model: config.claudeModel,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
        output_config: { format: zodOutputFormat(schema), ...(config.claudeJsonEffort ? { effort: config.claudeJsonEffort } : {}) },
      });
      if (res.stop_reason === "refusal") return null;
      return res.parsed_output ?? null;
    },
  };
}
