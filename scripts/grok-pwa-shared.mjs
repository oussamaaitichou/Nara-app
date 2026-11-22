/**
 * Minimal platform PWA helpers for Vercel production (Nara).
 * Grok preview extensions disabled by default.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const DEFAULT_APP_NAME = "Nara";
export const OG_SERVICE_URL_DEFAULT = "https://og.grok.me";
export const OG_SITE_REL_PATH = "src/lib/og/site.json";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function readGrokExtensionsEnabled() {
  const fromProcess = typeof process !== "undefined" ? process.env?.VITE_GROK_EXTENSIONS : "";
  return String(fromProcess ?? "").trim() === "1";
}

export function readGrokProjectId() {
  const fromProcess = typeof process !== "undefined" ? process.env?.VITE_PROJECT_ID : "";
  return String(fromProcess ?? "").trim();
}

export function isInstallQuery(url) {
  const query = String(url ?? "").split("?", 2)[1] ?? "";
  const params = new URLSearchParams(query);
  const install = params.get("install");
  const platform = (params.get("platform") ?? "").toLowerCase();
  return (install === "1" || install === "true") && platform === "ios";
}

export function isDocumentPath(pathname) {
  const path = String(pathname ?? "");
  return (
    !path.startsWith("/__grok/") &&
    !path.startsWith("/api/") &&
    !path.startsWith("/@") &&
    !path.startsWith("/node_modules") &&
    !/\.[a-z0-9]+$/i.test(path)
  );
}

export function acceptsHtml(accept) {
  const value = String(accept ?? "");
  return value === "" || value.includes("text/html") || value.includes("*/*");
}

export function stripInstallParams(url) {
  const [path = "/", query = ""] = String(url ?? "/").split("?", 2);
  const params = new URLSearchParams(query);
  params.delete("install");
  params.delete("platform");
  const rest = params.toString();
  return rest ? `${path}?${rest}` : path;
}

export function appNameFromHost(hostHeader) {
  return DEFAULT_APP_NAME;
}

export function renderInstallPageHtml(template, { host, url } = {}) {
  return String(template)
    .replaceAll("{{APP_NAME}}", escapeHtml(appNameFromHost(host)))
    .replaceAll("{{APP_URL}}", escapeHtml(stripInstallParams(url)));
}

export function renderWebManifest(hostHeader) {
  const name = appNameFromHost(hostHeader);
  return JSON.stringify({
    name,
    short_name: name.slice(0, 12),
    start_url: "/",
    display: "standalone",
    background_color: "#f0ebe3",
    theme_color: "#1B5C4E",
    icons: [{ src: "/icon-180.png", sizes: "180x180", type: "image/png" }],
  });
}

export function stripGrokExtensionsScript(html) {
  return String(html).replace(
    /<script\b[^>]*\bsrc\s*=\s*["'][^"']*\/grok-app-builder\/extensions\.js[^"']*["'][^>]*>\s*<\/script>/gi,
    "",
  );
}

export function injectGrokPwaHead(html, ctx = {}) {
  let next = stripGrokExtensionsScript(String(html ?? ""));
  // No Grok extensions in production by default
  return next;
}

/**
 * Streaming head injector: buffers until </head>, then flushes rest.
 */
export function createHeadInjector(ctx = {}) {
  let headDone = false;
  let buffer = Buffer.alloc(0);
  const marker = Buffer.from("</head>", "utf8");

  const apply = (html) => injectGrokPwaHead(html, ctx);

  return {
    push(chunk) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      if (headDone) return [buf];
      buffer = Buffer.concat([buffer, buf]);
      const idx = buffer.indexOf(marker);
      if (idx === -1) {
        if (buffer.length > 512 * 1024) {
          headDone = true;
          const out = Buffer.from(apply(buffer.toString("utf8")), "utf8");
          buffer = Buffer.alloc(0);
          return [out];
        }
        return [];
      }
      headDone = true;
      const headEnd = idx + marker.length;
      const head = buffer.subarray(0, headEnd).toString("utf8");
      const rest = buffer.subarray(headEnd);
      buffer = Buffer.alloc(0);
      const out = [Buffer.from(apply(head), "utf8")];
      if (rest.length) out.push(rest);
      return out;
    },
    flush() {
      if (headDone) {
        if (!buffer.length) return [];
        const rest = buffer;
        buffer = Buffer.alloc(0);
        return [rest];
      }
      if (!buffer.length) return [];
      const rest = buffer;
      buffer = Buffer.alloc(0);
      return [Buffer.from(apply(rest.toString("utf8")), "utf8")];
    },
  };
}
