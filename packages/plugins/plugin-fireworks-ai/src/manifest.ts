import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import { z } from "@paperclipai/plugin-sdk";

const PLUGIN_ID = "brandotech.fireworks-ai";

export const SETTINGS_SLOT_ID = "fireworks-ai-settings";

// ---------------------------------------------------------------------------
// Instance config schema — shown as a form in the Paperclip Settings → Plugins
// UI. The host validates user input against this schema before passing it to
// the worker.
// ---------------------------------------------------------------------------
export const instanceConfigSchema = z.object({
  apiKey: z
    .string()
    .min(1)
    .describe("Fireworks AI API key (starts with fw_). Get one at fireworks.ai."),
  smallModel: z
    .string()
    .default("accounts/fireworks/models/llama-v3p3-70b-instruct")
    .describe(
      "Model ID used for fast, routine tasks (PAPERCLIP_OPENCODE_SMALL_MODEL). E.g. accounts/fireworks/models/llama-v3p3-70b-instruct",
    ),
  largeModel: z
    .string()
    .default("accounts/fireworks/models/llama-v3p1-405b-instruct")
    .describe(
      "Model ID used for complex, long-context tasks (PAPERCLIP_OPENCODE_LARGE_MODEL). E.g. accounts/fireworks/models/llama-v3p1-405b-instruct",
    ),
});

export type FireworksConfig = z.infer<typeof instanceConfigSchema>;

const manifest: PaperclipPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Fireworks AI",
  description:
    "Configure and validate your Fireworks AI API key and model selections. Sets up the Fireworks provider for OpenCode and Codex adapters used by your Paperclip agents.",
  author: "Brando Tech",
  categories: ["ai-provider"],
  capabilities: [
    "instance.settings.register",
    "plugin.state.read",
    "plugin.state.write",
    "http.outbound",
  ],
  instanceConfigSchema,
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "settingsPage",
        id: SETTINGS_SLOT_ID,
        displayName: "Fireworks AI",
        exportName: "FireworksSettingsPage",
      },
    ],
  },
};

export default manifest;
