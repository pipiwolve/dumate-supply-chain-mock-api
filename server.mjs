import http from "node:http";
import { handler } from "./lib/api-handler.mjs";

const PORT = Number(process.env.PORT || 4173);

async function serveStatic(req, res) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ service: "dumate-supply-chain-systems", role: "upstream-system-simulator", systems: ["ERP/OMS", "WMS", "CRM"], mcpEndpoint: "/api/mcp", note: "补货建议、预警、看板和定时推送由 Dumate 负责" }));
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/") || req.url === "/health") return handler(req, res);
  return serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => console.log(`Dumate supply-chain demo running at http://127.0.0.1:${PORT}`));
