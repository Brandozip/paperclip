/**
 * Well-known Fireworks AI models, grouped by capability tier.
 * These IDs match the `accounts/fireworks/models/<slug>` format used in
 * PAPERCLIP_OPENCODE_PROVIDERS / PAPERCLIP_ADAPTER_MODELS.
 */

export interface FireworksModel {
  id: string;
  displayName: string;
  tier: "small" | "large" | "vision" | "code";
  contextWindow: number;
}

export const FIREWORKS_MODELS: FireworksModel[] = [
  // ── Small / fast ─────────────────────────────────────────────────────────
  {
    id: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    displayName: "Llama 3.3 70B Instruct",
    tier: "small",
    contextWindow: 128_000,
  },
  {
    id: "accounts/fireworks/models/llama-v3p1-70b-instruct",
    displayName: "Llama 3.1 70B Instruct",
    tier: "small",
    contextWindow: 128_000,
  },
  {
    id: "accounts/fireworks/models/mixtral-8x7b-instruct",
    displayName: "Mixtral 8x7B Instruct",
    tier: "small",
    contextWindow: 32_768,
  },
  {
    id: "accounts/fireworks/models/gemma2-9b-it",
    displayName: "Gemma 2 9B IT",
    tier: "small",
    contextWindow: 8_192,
  },

  // ── Large / powerful ─────────────────────────────────────────────────────
  {
    id: "accounts/fireworks/models/llama-v3p1-405b-instruct",
    displayName: "Llama 3.1 405B Instruct",
    tier: "large",
    contextWindow: 128_000,
  },
  {
    id: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    displayName: "Llama 3.1 8B Instruct",
    tier: "large",
    contextWindow: 128_000,
  },
  {
    id: "accounts/fireworks/models/mixtral-8x22b-instruct",
    displayName: "Mixtral 8x22B Instruct",
    tier: "large",
    contextWindow: 65_536,
  },
  {
    id: "accounts/fireworks/models/qwen2p5-72b-instruct",
    displayName: "Qwen 2.5 72B Instruct",
    tier: "large",
    contextWindow: 131_072,
  },

  // ── Code-focused ──────────────────────────────────────────────────────────
  {
    id: "accounts/fireworks/models/deepseek-coder-v2-instruct",
    displayName: "DeepSeek Coder V2 Instruct",
    tier: "code",
    contextWindow: 163_840,
  },
  {
    id: "accounts/fireworks/models/qwen2p5-coder-32b-instruct",
    displayName: "Qwen 2.5 Coder 32B Instruct",
    tier: "code",
    contextWindow: 131_072,
  },
];

export const FIREWORKS_BASE_URL = "https://api.fireworks.ai/inference/v1";
