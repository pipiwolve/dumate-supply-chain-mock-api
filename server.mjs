import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handler } from "./lib/api-handler.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "public");
const PORT = Number(process.env.PORT || 4173);

async function serveStatic(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if (pathname === "/favicon.ico") { res.writeHead(204); return res.end(); }
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(requested).replace(/^\.\.(?:[\\/]|$)/, "");
  const filePath = path.join(PUBLIC, safePath);
  if (!filePath.startsWith(PUBLIC)) { res.writeHead(403); return res.end("Forbidden"); }
  try {
    const data = await fs.readFile(filePath);
    const type = filePath.endsWith(".html") ? "text/html; charset=utf-8" : filePath.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  } catch { res.writeHead(404); res.end("Not found"); }
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/") || req.url === "/health") return handler(req, res);
  return serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => console.log(`Dumate supply-chain demo running at http://127.0.0.1:${PORT}`));
