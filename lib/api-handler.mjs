import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DATA = path.join(ROOT, "data");
const routes = new Set(["suppliers", "skus", "inventory", "orders", "meta", "warehouses", "purchaseOrderItems", "receivingRecords", "salesForecast", "promotionPlan", "salesHistory", "supplierCommunications", "orderStatusHistory", "inventoryTransactions"]);

export async function loadDataset(name) {
  return JSON.parse(await fs.readFile(path.join(DATA, `${name}.json`), "utf8"));
}

async function summary() {
  const [inventory, orders, suppliers, meta] = await Promise.all(["inventory", "orders", "suppliers", "meta"].map(loadDataset));
  return {
    totalSkus: inventory.length,
    lowStock: inventory.filter((row) => row.status !== "正常").length,
    inTransitOrders: orders.filter((row) => !["已入库", "已取消"].includes(row.status)).length,
    delayedOrders: orders.filter((row) => row.statusKey === "delayed" || row.delayDays > 0).length,
    activeSuppliers: suppliers.filter((row) => row.status === "活跃").length,
    generatedAt: meta.generatedAt
  };
}

async function mcpCall(tool, args = {}) {
  const [inventory, orders, suppliers, forecast, communications, statusHistory] = await Promise.all(["inventory", "orders", "suppliers", "salesForecast", "supplierCommunications", "orderStatusHistory"].map(loadDataset));
  if (tool === "get_inventory") return inventory.filter((row) => (!args.sku_id || row.skuId.includes(args.sku_id)) && (!args.warehouse_id || row.warehouseId === args.warehouse_id || row.warehouse === args.warehouse_id) && (!args.category || row.category === args.category));
  if (tool === "get_sales_forecast") return forecast.filter((row) => !args.sku_id || row.skuId.includes(args.sku_id));
  if (tool === "get_purchase_orders") return orders.filter((row) => (!args.supplier_id || row.supplierId === args.supplier_id) && (!args.status || args.status === "all" || row.statusKey === args.status || row.status === args.status) && (args.is_delayed ? row.delayDays > 0 || row.statusKey === "delayed" : true));
  if (tool === "get_supplier_info") return suppliers.filter((row) => !args.supplier_id || row.id === args.supplier_id);
  if (tool === "get_order_status") return orders.filter((row) => !args.order_id || args.order_id.split(",").includes(row.id)).map((row) => ({ orderId: row.id, currentStatus: row.status, statusHistory: statusHistory.filter((item) => item.orderId === row.id), delayFlag: row.delayDays > 0 || row.statusKey === "delayed", delayDays: row.delayDays, abnormalFlag: ["delayed", "stockout"].includes(row.statusKey), abnormalType: row.statusKey === "stockout" ? "缺货" : row.statusKey === "delayed" ? "延期" : null }));
  if (tool === "get_supplier_communications") return communications.filter((row) => !args.supplier_id || row.supplierId === args.supplier_id);
  const error = new Error(`Unknown tool: ${tool}`); error.statusCode = 400; throw error;
}

function sendJson(res, payload, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function sendMcp(req, res, payload, status = 200) {
  // Dumate may negotiate either Streamable HTTP JSON or an SSE message.
  const accepts = String(req.headers?.accept || "");
  const wantsSse = accepts.includes("text/event-stream") && !accepts.includes("application/json");
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("MCP-Protocol-Version", "2025-06-18");
  // The data source is stateless, but clients still require a session handle
  // after initialize to associate subsequent tools/list and tools/call calls.
  res.setHeader("Mcp-Session-Id", req.headers?.["mcp-session-id"] || `demo-${Date.now().toString(36)}`);
  if (wantsSse) {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.end(`event: message\ndata: ${JSON.stringify(payload)}\n\n`);
    return;
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export async function handler(req, res) {
  try {
    const pathname = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;
    if (pathname === "/health") return sendJson(res, { status: "ok", service: "dumate-supply-chain-api" });
    if (pathname === "/api/summary") return sendJson(res, await summary());
    if (pathname === "/api/mcp" && req.method === "OPTIONS") {
      res.statusCode = 204;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id");
      res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id, MCP-Protocol-Version");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.end();
      return;
    }
    if (pathname === "/api/mcp" && req.method === "GET") {
      // Compatibility hint for clients configured with the legacy SSE transport.
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(`event: endpoint\ndata: /api/mcp\n\n`);
      return;
    }
    if (pathname === "/api/mcp" && req.method === "POST") {
      let rawBody = req.body;
      if (rawBody == null && req[Symbol.asyncIterator]) {
        rawBody = "";
        for await (const chunk of req) rawBody += chunk;
      }
      const payload = typeof rawBody === "object" ? rawBody : JSON.parse(rawBody || "{}");
      if (payload.method === "initialize") return sendMcp(req, res, { jsonrpc: "2.0", id: payload.id ?? null, result: { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "dumate-supply-chain-systems", version: "0.2.0" } } });
      if (["notifications/initialized", "notifications/cancelled", "notifications/progress"].includes(payload.method)) {
        res.statusCode = 202;
        res.setHeader("Cache-Control", "no-store");
        res.end();
        return;
      }
      if (payload.method === "ping") return sendMcp(req, res, { jsonrpc: "2.0", id: payload.id ?? null, result: {} });
      if (payload.method === "tools/list") return sendMcp(req, res, { jsonrpc: "2.0", id: payload.id ?? null, result: { tools: [
        { name: "get_inventory", description: "查询 WMS 库存快照", inputSchema: { type: "object", properties: { sku_id: { type: "string" }, warehouse_id: { type: "string" }, category: { type: "string" } } } },
        { name: "get_sales_forecast", description: "查询 ERP/OMS 销售预测", inputSchema: { type: "object", properties: { sku_id: { type: "string" }, start_date: { type: "string" }, end_date: { type: "string" } } } },
        { name: "get_purchase_orders", description: "查询 ERP/OMS 采购订单", inputSchema: { type: "object", properties: { supplier_id: { type: "string" }, status: { type: "string" }, is_delayed: { type: "boolean" } } } },
        { name: "get_supplier_info", description: "查询 CRM 供应商主数据", inputSchema: { type: "object", properties: { supplier_id: { type: "string" } } } },
        { name: "get_supplier_communications", description: "查询 CRM 供应商沟通记录", inputSchema: { type: "object", properties: { supplier_id: { type: "string" } } } },
        { name: "get_order_status", description: "查询采购订单当前状态与历史", inputSchema: { type: "object", properties: { order_id: { type: "string" }, include_history: { type: "boolean" } } } }
      ] } });
      if (payload.method === "tools/call") return sendMcp(req, res, { jsonrpc: "2.0", id: payload.id ?? null, result: { content: [{ type: "text", text: JSON.stringify(await mcpCall(payload.params?.name, payload.params?.arguments || {})) }] } });
      return sendMcp(req, res, { jsonrpc: "2.0", id: payload.id ?? null, error: { code: -32601, message: "Unsupported MCP gateway method" } }, 400);
    }
    const match = pathname.match(/^\/api\/([a-zA-Z]+)$/);
    if (match && routes.has(match[1])) return sendJson(res, await loadDataset(match[1]));
    return sendJson(res, { error: "Not found" }, 404);
  } catch (error) {
    console.error(error);
    return sendJson(res, { error: error.message || "Internal server error" }, error.statusCode || 500);
  }
}
