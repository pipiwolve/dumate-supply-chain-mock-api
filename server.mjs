import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handler } from "./lib/api-handler.mjs";

const PORT = Number(process.env.PORT || 4173);

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

async function serveStatic(req, res) {
  const requested = req.url === "/" ? "/index.html" : new URL(req.url, "http://localhost").pathname;
  const filePath = path.normalize(path.join(PUBLIC, requested));
  if (!filePath.startsWith(`${PUBLIC}${path.sep}`)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/") || req.url === "/health") return handler(req, res);
  return serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => console.log(`Dumate supply-chain demo running at http://127.0.0.1:${PORT}`));
