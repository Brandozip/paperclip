import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import type { FireworksConfig } from "./manifest.js";
import { FIREWORKS_MODELS, FIREWORKS_BASE_URL } from "./models.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Test a Fireworks API key by sending a minimal chat completion. */
async function testFireworksConnection(
  ctx: Parameters<Parameters<typeof definePlugin>[0]["setup"]>[0],
  apiKey: string,
  modelId: string,
): Promise<{ ok: boolean; error?: string; latencyMs?: number }> {
  const start = Date.now();
  try {
    const response = await ctx.http.fetch(
      `${FIREWORKS_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 1,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: `HTTP ${response.status}: ${text.slice(0, 200)}` };
    }

    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info("Fireworks AI plugin starting");

    // ── Data: available models list ─────────────────────────────────────────
    ctx.data.register("models", async () => {
      return { models: FIREWORKS_MODELS };
    });

    // ── Data: current config + connection status ────────────────────────────
    ctx.data.register("status", async () => {
      const config = (await ctx.config.get()) as FireworksConfig | Record<string, unknown>;
      const apiKey = typeof config.apiKey === "string" ? config.apiKey : null;
      const smallModel =
        typeof config.smallModel === "string"
          ? config.smallModel
          : "accounts/fireworks/models/llama-v3p3-70b-instruct";
      const largeModel =
        typeof config.largeModel === "string"
          ? config.largeModel
          : "accounts/fireworks/models/llama-v3p1-405b-instruct";

      const configured = Boolean(apiKey);
      return {
        configured,
        smallModel,
        largeModel,
        baseUrl: FIREWORKS_BASE_URL,
        // Don't expose the raw key to the UI — just show whether it is set
        apiKeySet: configured,
      };
    });

    // ── Action: test connection ─────────────────────────────────────────────
    ctx.actions.register("test-connection", async () => {
      const config = (await ctx.config.get()) as FireworksConfig | Record<string, unknown>;
      const apiKey = typeof config.apiKey === "string" ? config.apiKey : "";
      const smallModel =
        typeof config.smallModel === "string"
          ? config.smallModel
          : "accounts/fireworks/models/llama-v3p3-70b-instruct";

      if (!apiKey) {
        return { ok: false, error: "No API key configured. Save your Fireworks API key first." };
      }

      ctx.logger.info("Testing Fireworks AI connection", { model: smallModel });
      const result = await testFireworksConnection(ctx, apiKey, smallModel);

      if (result.ok) {
        ctx.logger.info("Fireworks AI connection test passed", { latencyMs: result.latencyMs });
      } else {
        ctx.logger.warn("Fireworks AI connection test failed", { error: result.error });
      }

      return result;
    });

    // ── Action: generate env var snippet ────────────────────────────────────
    ctx.actions.register("generate-env-snippet", async () => {
      const config = (await ctx.config.get()) as FireworksConfig | Record<string, unknown>;
      const apiKey = typeof config.apiKey === "string" ? config.apiKey : "<your-api-key>";
      const smallModel =
        typeof config.smallModel === "string"
          ? config.smallModel
          : "accounts/fireworks/models/llama-v3p3-70b-instruct";
      const largeModel =
        typeof config.largeModel === "string"
          ? config.largeModel
          : "accounts/fireworks/models/llama-v3p1-405b-instruct";

      const providersJson = JSON.stringify({
        fireworks: {
          npm: "@ai-sdk/openai-compatible",
          baseURL: FIREWORKS_BASE_URL,
          apiKey: "{env:OPENAI_API_KEY}",
          models: {
            [smallModel]: {},
            [largeModel]: {},
          },
        },
      });

      const snippet = [
        `OPENAI_API_KEY=${apiKey}`,
        `OPENAI_BASE_URL=${FIREWORKS_BASE_URL}`,
        `DISABLE_OPENAI_DEFAULT_BASE_URL=true`,
        `PAPERCLIP_OPENCODE_PROVIDERS=${providersJson}`,
        `PAPERCLIP_OPENCODE_SMALL_MODEL=fireworks/${smallModel}`,
        `PAPERCLIP_OPENCODE_LARGE_MODEL=fireworks/${largeModel}`,
      ].join("\n");

      return { snippet };
    });

    ctx.logger.info("Fireworks AI plugin ready");
  },

  async onValidateConfig(config) {
    const apiKey = typeof config.apiKey === "string" ? config.apiKey : "";
    if (apiKey && !apiKey.startsWith("fw_")) {
      return {
        ok: false,
        warnings: ["API key does not start with 'fw_' — double-check it at fireworks.ai"],
      };
    }
    return { ok: true };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
