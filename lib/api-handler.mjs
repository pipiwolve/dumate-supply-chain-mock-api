import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DATA = path.join(ROOT, "data");
const routes = new Set(["suppliers", "skus", "inventory", "orders", "replenishment", "alerts", "meta", "warehouses", "purchaseOrderItems", "receivingRecords", "salesForecast", "promotionPlan", "salesHistory", "supplierCommunications", "orderStatusHistory", "inventoryTransactions"]);

export async function loadDataset(name) {
  return JSON.parse(await fs.readFile(path.join(DATA, `${name}.json`), "utf8"));
}

async function summary() {
  const [inventory, orders, suppliers, replenishment, alerts, meta] = await Promise.all(["inventory", "orders", "suppliers", "replenishment", "alerts", "meta"].map(loadDataset));
  return {
    totalSkus: inventory.length,
    lowStock: inventory.filter((row) => row.status !== "正常").length,
    inTransitOrders: orders.filter((row) => !["已入库", "已取消"].includes(row.status)).length,
    delayedOrders: orders.filter((row) => row.statusKey === "delayed" || row.delayDays > 0).length,
    activeSuppliers: suppliers.filter((row) => row.status === "活跃").length,
    highPriority: replenishment.filter((row) => row.priority === "高").length,
    openAlerts: alerts.filter((row) => row.status !== "已确认").length,
    generatedAt: meta.generatedAt
  };
}

async function mcpCall(tool, args = {}) {
  const [inventory, orders, suppliers, forecast, communications, statusHistory, replenishment] = await Promise.all(["inventory", "orders", "suppliers", "salesForecast", "supplierCommunications", "orderStatusHistory", "replenishment"].map(loadDataset));
  if (tool === "get_inventory") return inventory.filter((row) => (!args.sku_id || row.skuId.includes(args.sku_id)) && (!args.warehouse_id || row.warehouse === args.warehouse_id) && (!args.category || row.category === args.category));
  if (tool === "get_sales_forecast") return forecast.filter((row) => !args.sku_id || row.skuId.includes(args.sku_id));
  if (tool === "get_purchase_orders") return orders.filter((row) => (!args.supplier_id || row.supplierId === args.supplier_id) && (!args.status || args.status === "all" || row.statusKey === args.status || row.status === args.status) && (args.is_delayed ? row.delayDays > 0 || row.statusKey === "delayed" : true));
  if (tool === "get_supplier_info") return suppliers.filter((row) => !args.supplier_id || row.id === args.supplier_id);
  if (tool === "get_order_status") return orders.filter((row) => !args.order_id || args.order_id.split(",").includes(row.id)).map((row) => ({ orderId: row.id, currentStatus: row.status, statusHistory: statusHistory.filter((item) => item.orderId === row.id), delayFlag: row.delayDays > 0 || row.statusKey === "delayed", delayDays: row.delayDays, abnormalFlag: ["delayed", "stockout"].includes(row.statusKey), abnormalType: row.statusKey === "stockout" ? "缺货" : row.statusKey === "delayed" ? "延期" : null }));
  if (tool === "calculate_replenishment") return replenishment.filter((row) => !args.sku_id || args.sku_id.split(",").includes(row.skuId));
  if (tool === "upload_communication") return { archiveId: `COM-${Date.now()}`, status: "success", extractedKeyPoints: [{ type: "其他", description: "模拟归档：已接收沟通内容", actionItem: "由采购人员确认下一步跟进" }], followUpTasks: [{ taskId: `TASK-${Date.now()}`, taskDescription: "确认供应商回复并更新状态", dueDate: null, status: "待办" }] };
  const error = new Error(`Unknown tool: ${tool}`); error.statusCode = 400; throw error;
}

function sendJson(res, payload, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

export async function handler(req, res) {
  try {
    const pathname = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;
    if (pathname === "/health") return sendJson(res, { status: "ok", service: "dumate-supply-chain-api" });
    if (pathname === "/api/summary") return sendJson(res, await summary());
    if (pathname === "/api/mcp" && req.method === "POST") {
      let rawBody = req.body;
      if (rawBody == null && req[Symbol.asyncIterator]) {
        rawBody = "";
        for await (const chunk of req) rawBody += chunk;
      }
      const payload = typeof rawBody === "object" ? rawBody : JSON.parse(rawBody || "{}");
      if (payload.method === "tools/list") return sendJson(res, { tools: ["get_inventory", "get_sales_forecast", "get_purchase_orders", "get_supplier_info", "get_order_status", "calculate_replenishment", "upload_communication"].map((name) => ({ name })) });
      if (payload.method === "tools/call") return sendJson(res, { content: [{ type: "text", text: JSON.stringify(await mcpCall(payload.params?.name, payload.params?.arguments || {})) }] });
      return sendJson(res, { error: "Unsupported MCP gateway method" }, 400);
    }
    const match = pathname.match(/^\/api\/([a-zA-Z]+)$/);
    if (match && routes.has(match[1])) return sendJson(res, await loadDataset(match[1]));
    return sendJson(res, { error: "Not found" }, 404);
  } catch (error) {
    console.error(error);
    return sendJson(res, { error: error.message || "Internal server error" }, error.statusCode || 500);
  }
}
