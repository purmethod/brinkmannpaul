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

export interface LlmImage {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  data: string;
}

export interface Llm {
  chat(params: LlmChatParams): Promise<{ text: string; refused: boolean }>;
  /** Structured answer; `images` (base64) go before the prompt – used to read screenshots. */
  json<T>(schema: z.ZodType<T>, system: string, prompt: string, maxTokens?: number, images?: LlmImage[]): Promise<T | null>;
  /** One tiny real call: does Claude answer with this key and model? The error text never contains the key. */
  check?(): Promise<{ ok: boolean; error?: string }>;
}

/** Error text for logs and the health check – status and API message, the key masked. */
export function errorText(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.replace(/sk-ant-[A-Za-z0-9_-]+/g, "sk-ant-…").slice(0, 300);
}

/** 400 = the request shape (beta, fallbacks, effort) was rejected – worth one plain retry. */
const isBadRequest = (e: unknown) => (e as { status?: number })?.status === 400;

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
      const plain = () => client.messages.create({ model: params.model, max_tokens: params.max_tokens, system: params.system, messages: params.messages });
      let res;
      try {
        res = config.claudeFallbacks
          ? await client.beta.messages.create({
              ...params,
              betas: ["server-side-fallback-2026-07-01"],
              fallbacks: "default",
            })
          : await client.messages.create(params);
      } catch (e) {
        if (!isBadRequest(e)) throw e;
        // the extras were rejected: answer anyway with the plain request
        console.error("claude: request rejected, retrying plain", errorText(e));
        res = await plain();
      }
      if (res.stop_reason === "refusal") return { text: "", refused: true };
      const text = res.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .trim();
      return { text, refused: false };
    },

    async json(schema, system, prompt, maxTokens = 4000, images = []) {
      const content = images.length
        ? [
            ...images.map((i) => ({ type: "image" as const, source: { type: "base64" as const, media_type: i.mediaType, data: i.data } })),
            { type: "text" as const, text: prompt },
          ]
        : prompt;
      const res = await client.messages.parse({
        model: config.claudeModel,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content }],
        output_config: { format: zodOutputFormat(schema), ...(config.claudeJsonEffort ? { effort: config.claudeJsonEffort } : {}) },
      });
      if (res.stop_reason === "refusal") return null;
      return res.parsed_output ?? null;
    },

    async check() {
      try {
        const { text } = await this.chat({ system: "Antworte mit einem Wort.", context: "Healthcheck.", messages: [{ role: "user", content: "Bereit?" }], maxTokens: 16 });
        return text ? { ok: true } : { ok: false, error: "empty answer" };
      } catch (e) {
        return { ok: false, error: errorText(e) };
      }
    },
  };
}
