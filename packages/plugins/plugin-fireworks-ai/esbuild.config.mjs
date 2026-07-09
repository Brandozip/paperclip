import esbuild from "esbuild";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Build the worker bundle (Node.js ESM)
await esbuild.build({
  entryPoints: ["src/worker.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outfile: "dist/worker.js",
  external: [
    // The host provides the SDK at runtime — do not bundle it
    "@paperclipai/plugin-sdk",
  ],
  banner: {
    js: "// @brandotech/plugin-fireworks-ai — worker bundle",
  },
});

console.log("✓ worker bundle built");

// Build the UI bundle (browser ESM, each export as its own file)
await esbuild.build({
  entryPoints: ["src/ui/index.tsx"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  outdir: "dist/ui",
  splitting: false,
  external: [
    // Host provides React and the SDK UI at runtime
    "react",
    "react/jsx-runtime",
    "@paperclipai/plugin-sdk/ui",
  ],
  banner: {
    js: "// @brandotech/plugin-fireworks-ai — ui bundle",
  },
});

console.log("✓ ui bundle built");
