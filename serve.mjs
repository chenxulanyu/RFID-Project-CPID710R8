#!/usr/bin/env node
// Zero-dependency static file server for the CPID710R8 web app.
// Serves web/dist with SPA fallback to index.html. Replaces `vite preview`
// in the coze vefaas runtime because the bytefaas filesystem does not
// let vite 8's config bundler create web/node_modules/.vite-temp.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "web", "dist");
const PORT = Number.parseInt(process.env.DEPLOY_RUN_PORT ?? "4173", 10);
const HOST = "0.0.0.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function safeJoin(root, urlPath) {
  // Strip query/hash, decode, normalize, and prevent path traversal.
  const cleanPath = urlPath.split("?")[0].split("#")[0];
  const decoded = decodeURIComponent(cleanPath);
  const joined = normalize(join(root, decoded));
  if (joined !== root && !joined.startsWith(root + sep)) return null;
  return joined;
}

const server = createServer(async (req, res) => {
  try {
    if (!req.url) {
      res.writeHead(400);
      res.end("bad request");
      return;
    }
    let filePath = safeJoin(ROOT, req.url);
    if (!filePath) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    let info;
    try {
      info = await stat(filePath);
    } catch {
      info = null;
    }
    if (!info || !info.isFile()) {
      // SPA fallback: any unknown route serves index.html.
      filePath = join(ROOT, "index.html");
      try {
        info = await stat(filePath);
      } catch {
        res.writeHead(404);
        res.end("not found");
        return;
      }
    }
    const data = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": info.size,
      "Cache-Control": extname(filePath) === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end("server error: " + (err instanceof Error ? err.message : String(err)));
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[serve] listening on http://${HOST}:${PORT} (root=${ROOT})`);
});
