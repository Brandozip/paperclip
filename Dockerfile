# syntax=docker/dockerfile:1.20
# ── Stage 1: build only our Fireworks AI plugin ──────────────────────────────
FROM node:lts-trixie-slim AS plugin-builder
WORKDIR /plugin
COPY packages/plugins/plugin-fireworks-ai/package.json ./
# Install only the build tools we need (esbuild, typescript, react types)
RUN npm install --save-dev esbuild@^0.25.0 typescript@^5.6.2 @types/react@^18.3.3 react@^18.3.1
COPY packages/plugins/plugin-fireworks-ai/src ./src
COPY packages/plugins/plugin-fireworks-ai/esbuild.config.mjs ./
COPY packages/plugins/plugin-fireworks-ai/tsconfig.json ./
# Build worker + UI bundles via esbuild (no tsc type-check, just transpile)
RUN node esbuild.config.mjs

# ── Stage 2: the official Paperclip image + our plugin ───────────────────────
FROM paperclipai/paperclip:latest
# Copy built plugin artifacts into the app directory
COPY --from=plugin-builder /plugin/dist /app/packages/plugins/plugin-fireworks-ai/dist
COPY packages/plugins/plugin-fireworks-ai/package.json /app/packages/plugins/plugin-fireworks-ai/package.json
COPY packages/plugins/plugin-fireworks-ai/src /app/packages/plugins/plugin-fireworks-ai/src
