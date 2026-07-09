import { usePluginAction, usePluginData } from "@paperclipai/plugin-sdk/ui";
import type { PluginSettingsPageProps } from "@paperclipai/plugin-sdk/ui";
import { createElement, Fragment, useState } from "react";
import { FIREWORKS_MODELS, FIREWORKS_BASE_URL } from "../models.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatusData {
  configured: boolean;
  apiKeySet: boolean;
  smallModel: string;
  largeModel: string;
  baseUrl: string;
}

interface TestResult {
  ok: boolean;
  error?: string;
  latencyMs?: number;
}

interface EnvSnippetResult {
  snippet: string;
}

// ---------------------------------------------------------------------------
// Inline styles — no Tailwind, no external CSS imports
// ---------------------------------------------------------------------------

const styles = {
  page: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    maxWidth: 720,
    margin: "0 auto",
    padding: "32px 24px",
    color: "var(--foreground, #f1f5f9)",
  } as React.CSSProperties,

  heading: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  } as React.CSSProperties,

  h1: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    color: "var(--foreground, #f1f5f9)",
  } as React.CSSProperties,

  badge: (ok: boolean) =>
    ({
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11,
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: 999,
      background: ok ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.1)",
      color: ok ? "#4ade80" : "#94a3b8",
      border: `1px solid ${ok ? "rgba(34,197,94,0.3)" : "rgba(148,163,184,0.2)"}`,
    }) as React.CSSProperties,

  dot: (ok: boolean) =>
    ({
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: ok ? "#4ade80" : "#94a3b8",
    }) as React.CSSProperties,

  subtitle: {
    fontSize: 13,
    color: "var(--muted-foreground, #94a3b8)",
    marginBottom: 32,
    lineHeight: 1.5,
  } as React.CSSProperties,

  card: {
    background: "var(--card, rgba(30,41,59,0.6))",
    border: "1px solid var(--border, rgba(148,163,184,0.15))",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 20,
  } as React.CSSProperties,

  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--foreground, #f1f5f9)",
    marginBottom: 16,
    letterSpacing: "0.03em",
    textTransform: "uppercase" as const,
    opacity: 0.7,
  },

  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },

  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--foreground, #f1f5f9)",
  } as React.CSSProperties,

  labelHint: {
    fontSize: 11,
    color: "var(--muted-foreground, #94a3b8)",
    marginLeft: 6,
    fontWeight: 400,
  } as React.CSSProperties,

  input: {
    width: "100%",
    padding: "9px 12px",
    fontSize: 13,
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    background: "var(--input, rgba(15,23,42,0.8))",
    border: "1px solid var(--border, rgba(148,163,184,0.2))",
    borderRadius: 8,
    color: "var(--foreground, #f1f5f9)",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  } as React.CSSProperties,

  select: {
    width: "100%",
    padding: "9px 12px",
    fontSize: 13,
    background: "var(--input, rgba(15,23,42,0.8))",
    border: "1px solid var(--border, rgba(148,163,184,0.2))",
    borderRadius: 8,
    color: "var(--foreground, #f1f5f9)",
    outline: "none",
    boxSizing: "border-box" as const,
    cursor: "pointer",
  } as React.CSSProperties,

  buttonRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  btn: (variant: "primary" | "secondary" | "ghost") => {
    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 18px",
      fontSize: 13,
      fontWeight: 500,
      borderRadius: 8,
      border: "1px solid transparent",
      cursor: "pointer",
      transition: "opacity 0.15s, background 0.15s",
      fontFamily: "inherit",
    };
    if (variant === "primary") {
      return {
        ...base,
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        color: "#fff",
        border: "1px solid rgba(99,102,241,0.5)",
      };
    }
    if (variant === "secondary") {
      return {
        ...base,
        background: "rgba(148,163,184,0.1)",
        color: "var(--foreground, #f1f5f9)",
        border: "1px solid rgba(148,163,184,0.2)",
      };
    }
    return {
      ...base,
      background: "transparent",
      color: "var(--muted-foreground, #94a3b8)",
    };
  },

  resultBox: (ok: boolean) =>
    ({
      marginTop: 12,
      padding: "10px 14px",
      borderRadius: 8,
      fontSize: 13,
      fontFamily: "'Fira Code', monospace",
      background: ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
      border: `1px solid ${ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
      color: ok ? "#4ade80" : "#f87171",
      lineHeight: 1.5,
    }) as React.CSSProperties,

  codeBox: {
    marginTop: 12,
    padding: "14px 16px",
    borderRadius: 8,
    fontSize: 12,
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    background: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(148,163,184,0.15)",
    color: "#a5f3fc",
    whiteSpace: "pre" as const,
    overflowX: "auto" as const,
    lineHeight: 1.7,
  } as React.CSSProperties,

  infoBox: {
    padding: "12px 16px",
    borderRadius: 8,
    fontSize: 12.5,
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.2)",
    color: "#a5b4fc",
    lineHeight: 1.6,
  } as React.CSSProperties,

  divider: {
    height: 1,
    background: "var(--border, rgba(148,163,184,0.1))",
    margin: "20px 0",
  } as React.CSSProperties,
};

// ---------------------------------------------------------------------------
// Model option group helpers
// ---------------------------------------------------------------------------

function ModelSelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  const grouped: Record<string, typeof FIREWORKS_MODELS> = {};
  for (const m of FIREWORKS_MODELS) {
    (grouped[m.tier] ??= []).push(m);
  }
  const tierLabels: Record<string, string> = {
    small: "Small / Fast",
    large: "Large / Powerful",
    code: "Code-Focused",
    vision: "Vision",
  };

  return createElement(
    "select",
    {
      id,
      style: styles.select,
      value,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value),
    },
    ...Object.entries(grouped).map(([tier, models]) =>
      createElement(
        "optgroup",
        { key: tier, label: tierLabels[tier] ?? tier },
        ...models.map((m) =>
          createElement("option", { key: m.id, value: m.id }, `${m.displayName} (${(m.contextWindow / 1000).toFixed(0)}k ctx)`),
        ),
      ),
    ),
    // Allow a custom model ID not in the list
    createElement(
      "option",
      { value: value, hidden: FIREWORKS_MODELS.some((m) => m.id === value) },
      value,
    ),
  );
}

// ---------------------------------------------------------------------------
// Main settings page component
// ---------------------------------------------------------------------------

export function FireworksSettingsPage({ context }: PluginSettingsPageProps) {
  const { data: status, loading: statusLoading } = usePluginData<StatusData>("status", {
    companyId: context.companyId,
  });

  const testConnection = usePluginAction<TestResult>("test-connection");
  const generateSnippet = usePluginAction<EnvSnippetResult>("generate-env-snippet");

  const [apiKey, setApiKey] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [smallModel, setSmallModel] = useState(
    () => status?.smallModel ?? "accounts/fireworks/models/llama-v3p3-70b-instruct",
  );
  const [largeModel, setLargeModel] = useState(
    () => status?.largeModel ?? "accounts/fireworks/models/llama-v3p1-405b-instruct",
  );

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testBusy, setTestBusy] = useState(false);

  const [snippet, setSnippet] = useState<string | null>(null);
  const [snippetBusy, setSnippetBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const isConnected = status?.configured && !statusLoading;

  async function handleTest() {
    setTestBusy(true);
    setTestResult(null);
    try {
      const result = await testConnection({ companyId: context.companyId });
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setTestBusy(false);
    }
  }

  async function handleGenerateSnippet() {
    setSnippetBusy(true);
    setSnippet(null);
    try {
      const result = await generateSnippet({ companyId: context.companyId });
      setSnippet(result.snippet);
    } catch (err) {
      setSnippet(`# Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSnippetBusy(false);
    }
  }

  async function handleCopy() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return createElement(
    "div",
    { style: styles.page },

    // ── Header ──────────────────────────────────────────────────────────────
    createElement(
      "div",
      { style: styles.heading },
      createElement(
        "svg",
        {
          width: 28,
          height: 28,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "#f97316",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("path", { d: "M12 2L2 7l10 5 10-5-10-5z" }),
        createElement("path", { d: "M2 17l10 5 10-5" }),
        createElement("path", { d: "M2 12l10 5 10-5" }),
      ),
      createElement("h1", { style: styles.h1 }, "Fireworks AI"),
      !statusLoading &&
        createElement(
          "span",
          { style: styles.badge(isConnected) },
          createElement("span", { style: styles.dot(isConnected) }),
          isConnected ? "Connected" : "Not configured",
        ),
    ),
    createElement(
      "p",
      { style: styles.subtitle },
      "Configure your Fireworks AI API key and model selections. After saving, use the env var snippet below to update your Railway deployment.",
    ),

    // ── API Key card ─────────────────────────────────────────────────────────
    createElement(
      "div",
      { style: styles.card },
      createElement("div", { style: styles.cardTitle }, "API Key"),
      createElement(
        "div",
        { style: styles.fieldGroup },
        createElement(
          "div",
          { style: styles.field },
          createElement(
            "label",
            { htmlFor: "fw-api-key", style: styles.label },
            "Fireworks API Key",
            createElement("span", { style: styles.labelHint }, "— starts with fw_"),
          ),
          createElement(
            "div",
            { style: { position: "relative" as const } },
            createElement("input", {
              id: "fw-api-key",
              type: apiKeyVisible ? "text" : "password",
              placeholder: status?.apiKeySet ? "••••••••••••••••••••••• (saved)" : "fw_…",
              value: apiKey,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value),
              style: { ...styles.input, paddingRight: 44 },
            }),
            createElement(
              "button",
              {
                type: "button",
                onClick: () => setApiKeyVisible((v) => !v),
                style: {
                  position: "absolute" as const,
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted-foreground, #94a3b8)",
                  fontSize: 16,
                  padding: 2,
                },
                title: apiKeyVisible ? "Hide key" : "Show key",
              },
              apiKeyVisible ? "🙈" : "👁️",
            ),
          ),
          createElement(
            "p",
            { style: { fontSize: 11, color: "var(--muted-foreground, #94a3b8)", margin: 0 } },
            "Get your key at ",
            createElement(
              "a",
              {
                href: "https://fireworks.ai/api-keys",
                target: "_blank",
                rel: "noopener noreferrer",
                style: { color: "#f97316" },
              },
              "fireworks.ai/api-keys",
            ),
            ".",
          ),
        ),
        createElement(
          "div",
          { style: styles.infoBox },
          "⚠️  Paperclip stores your API key in the plugin config. After saving, generate the env var snippet below and paste it into Railway to apply the key to your agents.",
        ),
      ),
    ),

    // ── Model selections card ────────────────────────────────────────────────
    createElement(
      "div",
      { style: styles.card },
      createElement("div", { style: styles.cardTitle }, "Model Selections"),
      createElement(
        "div",
        { style: styles.fieldGroup },
        createElement(
          "div",
          { style: styles.field },
          createElement(
            "label",
            { htmlFor: "fw-small-model", style: styles.label },
            "Small Model",
            createElement("span", { style: styles.labelHint }, "— fast & cost-effective"),
          ),
          createElement(ModelSelect, {
            id: "fw-small-model",
            value: smallModel,
            onChange: setSmallModel,
          }),
        ),
        createElement(
          "div",
          { style: styles.field },
          createElement(
            "label",
            { htmlFor: "fw-large-model", style: styles.label },
            "Large Model",
            createElement("span", { style: styles.labelHint }, "— powerful for complex tasks"),
          ),
          createElement(ModelSelect, {
            id: "fw-large-model",
            value: largeModel,
            onChange: setLargeModel,
          }),
        ),
      ),
    ),

    // ── Test connection card ─────────────────────────────────────────────────
    createElement(
      "div",
      { style: styles.card },
      createElement("div", { style: styles.cardTitle }, "Connection"),
      createElement("p", { style: { fontSize: 13, color: "var(--muted-foreground, #94a3b8)", margin: "0 0 14px" } },
        "Test that the saved API key can reach Fireworks AI using your small model.",
      ),
      createElement(
        "div",
        { style: styles.buttonRow },
        createElement(
          "button",
          {
            type: "button",
            style: styles.btn("secondary"),
            onClick: handleTest,
            disabled: testBusy,
          },
          testBusy ? "Testing…" : "🔌 Test Connection",
        ),
      ),
      testResult &&
        createElement(
          "div",
          { style: styles.resultBox(testResult.ok) },
          testResult.ok
            ? `✓ Connected (${testResult.latencyMs}ms) — Fireworks AI is responding correctly.`
            : `✗ Failed: ${testResult.error}`,
        ),
    ),

    // ── Env var snippet card ─────────────────────────────────────────────────
    createElement(
      "div",
      { style: styles.card },
      createElement("div", { style: styles.cardTitle }, "Railway Environment Variables"),
      createElement(
        "p",
        { style: { fontSize: 13, color: "var(--muted-foreground, #94a3b8)", margin: "0 0 14px" } },
        "Generate the env vars you need to set in Railway → sparkling-youth → Paperclip service to activate Fireworks AI for your agents.",
      ),
      createElement(
        "div",
        { style: styles.buttonRow },
        createElement(
          "button",
          {
            type: "button",
            style: styles.btn("primary"),
            onClick: handleGenerateSnippet,
            disabled: snippetBusy,
          },
          snippetBusy ? "Generating…" : "⚡ Generate Snippet",
        ),
        snippet &&
          createElement(
            "button",
            {
              type: "button",
              style: styles.btn("ghost"),
              onClick: handleCopy,
            },
            copied ? "✓ Copied!" : "📋 Copy",
          ),
      ),
      snippet &&
        createElement(
          Fragment,
          null,
          createElement("pre", { style: styles.codeBox }, snippet),
          createElement(
            "p",
            { style: { fontSize: 11, color: "var(--muted-foreground, #94a3b8)", marginTop: 8, marginBottom: 0 } },
            "Paste these into Railway → sparkling-youth → Paperclip → Variables and redeploy.",
          ),
        ),
    ),

    // ── Footer ───────────────────────────────────────────────────────────────
    createElement("div", { style: styles.divider }),
    createElement(
      "p",
      { style: { fontSize: 11, color: "var(--muted-foreground, #94a3b8)", margin: 0 } },
      "Base URL: ",
      createElement("code", { style: { fontFamily: "monospace" } }, FIREWORKS_BASE_URL),
      " · ",
      createElement(
        "a",
        { href: "https://fireworks.ai/models", target: "_blank", rel: "noopener noreferrer", style: { color: "#f97316" } },
        "Browse all models",
      ),
    ),
  );
}

export default FireworksSettingsPage;
