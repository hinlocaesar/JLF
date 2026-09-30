/**
 * Minimal zero-dependency static file server for local development / preview.
 *
 *   npm run dev        -> http://localhost:3000
 *   PORT=8080 npm run dev
 */
const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const url = require("node:url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

/** Resolve a request path to a safe absolute path inside ROOT. */
function resolveSafe(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const target = path.resolve(ROOT, "." + path.posix.normalize(decoded));
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  if (target !== ROOT && !target.startsWith(rootWithSep)) return null;
  return target;
}

async function statFile(filePath) {
  try {
    const stats = await fsp.stat(filePath);
    return stats.isFile() ? stats : null;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  let pathname = url.parse(req.url || "/").pathname || "/";

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end("Method Not Allowed");
  }

  // Directory request -> index.html
  if (pathname.endsWith("/")) pathname += "index.html";

  let filePath = resolveSafe(pathname);
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("403 Forbidden");
  }

  let stats = await statFile(filePath);
  if (!stats) {
    // Extensionless route -> try .html
    if (!path.extname(filePath)) {
      const asHtml = filePath + ".html";
      const htmlStats = await statFile(asHtml);
      if (htmlStats) {
        filePath = asHtml;
        stats = htmlStats;
      }
    }
  }
  if (!stats) {
    // SPA / pretty-URL fallback
    if (!path.extname(filePath)) {
      const index = path.join(ROOT, "index.html");
      const indexStats = await statFile(index);
      if (indexStats) {
        filePath = index;
        stats = indexStats;
      }
    }
  }

  if (!stats) {
    const body = `<!doctype html><meta charset="utf-8"><title>404</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0;background:#FFFCF7;color:#1B2A4A}
h1{font-size:5rem;margin:0}p{color:#64748B}</style>
<h1 style="text-align:center"><span style="display:block;font-size:1.25rem;color:#F59E0B">404</span>Page not found</h1>`;
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(req.method === "HEAD" ? "" : body);
  }

  const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  const etag = `W/"${stats.size.toString(16)}-${stats.mtimeMs.toString(16)}"`;
  const headers = {
    "Content-Type": type,
    "Content-Length": stats.size,
    ETag: etag,
    "Last-Modified": stats.mtime.toUTCString(),
    "Cache-Control": "no-cache",
  };

  if (req.headers["if-none-match"] === etag) {
    res.writeHead(304, { ETag: etag, "Cache-Control": "no-cache" });
    return res.end();
  }

  res.writeHead(200, headers);
  if (req.method === "HEAD") return res.end();

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => res.destroy());
  stream.pipe(res);
  stream.on("close", () => {
    const ms = Date.now() - started;
    process.stdout.write(`  ${String(res.statusCode)}  ${req.method.padEnd(4)}  ${req.url}  (${ms}ms)\n`);
  });
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`\n  JLFLC site running\n  ->  http://localhost:${PORT}\n\n  Watching: ${ROOT}\n  Press Ctrl+C to stop\n\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    process.stderr.write(`\n  Port ${PORT} is already in use. Try:  PORT=3001 npm run dev\n\n`);
    process.exit(1);
  }
  throw err;
});
