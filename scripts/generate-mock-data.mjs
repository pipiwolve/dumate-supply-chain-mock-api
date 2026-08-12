import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const dataDir = path.join(ROOT, "data");
const now = "2026-08-11T09:00:00+08:00";

const suppliers = [
  { id: "SUP-001", name: "华东生活家居", category: "家居日用", contact: "周敏", phone: "138****2601", rating: "A", status: "活跃", paymentTerms: "月结 60 天", onTimeRate: 0.96, pendingCommunications: 1 },
  { id: "SUP-002", name: "禾木食品供应链", category: "食品饮料", contact: "李琦", phone: "139****4188", rating: "A", status: "活跃", paymentTerms: "月结 45 天", onTimeRate: 0.92, pendingCommunications: 2 },
  { id: "SUP-003", name: "南方个护制造", category: "个护清洁", contact: "陈晓", phone: "186****7034", rating: "B", status: "活跃", paymentTerms: "月结 30 天", onTimeRate: 0.87, pendingCommunications: 3 },
  { id: "SUP-004", name: "新潮数码配件", category: "数码配件", contact: "王涛", phone: "137****8290", rating: "B", status: "活跃", paymentTerms: "月结 30 天", onTimeRate: 0.84, pendingCommunications: 1 },
  { id: "SUP-005", name: "北辰纸品包装", category: "包装耗材", contact: "孙倩", phone: "188****1107", rating: "C", status: "暂停", paymentTerms: "款到发货", onTimeRate: 0.76, pendingCommunications: 0 },
  { id: "SUP-006", name: "优选服饰工厂", category: "服饰配件", contact: "赵恒", phone: "151****5166", rating: "A", status: "活跃", paymentTerms: "月结 60 天", onTimeRate: 0.94, pendingCommunications: 1 }
];

const skus = [
  { id: "SKU-1001", name: "轻量保温杯 480ml", category: "家居日用", supplierId: "SUP-001", unit: "个", leadTimeDays: 12, safetyDays: 14, standardPrice: 39 },
  { id: "SKU-1002", name: "折叠收纳箱 54L", category: "家居日用", supplierId: "SUP-001", unit: "个", leadTimeDays: 10, safetyDays: 10, standardPrice: 59 },
  { id: "SKU-1003", name: "香辣脆笋 150g", category: "食品饮料", supplierId: "SUP-002", unit: "袋", leadTimeDays: 7, safetyDays: 12, standardPrice: 12 },
  { id: "SKU-1004", name: "低糖燕麦饼 240g", category: "食品饮料", supplierId: "SUP-002", unit: "盒", leadTimeDays: 8, safetyDays: 15, standardPrice: 26 },
  { id: "SKU-1005", name: "氨基酸洁面 120g", category: "个护清洁", supplierId: "SUP-003", unit: "支", leadTimeDays: 18, safetyDays: 20, standardPrice: 46 },
  { id: "SKU-1006", name: "护手霜礼盒 3 支", category: "个护清洁", supplierId: "SUP-003", unit: "盒", leadTimeDays: 16, safetyDays: 18, standardPrice: 68 },
  { id: "SKU-1007", name: "编织充电线 1.5m", category: "数码配件", supplierId: "SUP-004", unit: "条", leadTimeDays: 9, safetyDays: 12, standardPrice: 29 },
  { id: "SKU-1008", name: "磁吸手机支架", category: "数码配件", supplierId: "SUP-004", unit: "个", leadTimeDays: 11, safetyDays: 16, standardPrice: 55 },
  { id: "SKU-1009", name: "环保快递箱 3 号", category: "包装耗材", supplierId: "SUP-005", unit: "个", leadTimeDays: 6, safetyDays: 10, standardPrice: 4.8 },
  { id: "SKU-1010", name: "抽绳束口袋", category: "包装耗材", supplierId: "SUP-005", unit: "个", leadTimeDays: 5, safetyDays: 9, standardPrice: 3.2 },
  { id: "SKU-1011", name: "速干运动帽", category: "服饰配件", supplierId: "SUP-006", unit: "顶", leadTimeDays: 14, safetyDays: 15, standardPrice: 39 },
  { id: "SKU-1012", name: "轻户外防晒袖", category: "服饰配件", supplierId: "SUP-006", unit: "双", leadTimeDays: 13, safetyDays: 14, standardPrice: 32 }
];

const warehouses = [
  { id: "WH-001", name: "华东一仓", type: "自有仓", address: "上海市青浦区", contact: "赵师傅", status: "正常" },
  { id: "WH-002", name: "华南中心仓", type: "第三方仓", address: "广州市番禺区", contact: "黄经理", status: "正常" },
  { id: "WH-003", name: "华北前置仓", type: "自有仓", address: "北京市大兴区", contact: "刘师傅", status: "正常" }
];

const inventorySeed = [
  ["SKU-1001", 420, 180, 56, 0, 360, "华东一仓", "正常"],
  ["SKU-1002", 86, 40, 14, 0, 120, "华东一仓", "低于安全库存"],
  ["SKU-1003", 1200, 400, 260, 0, 900, "华南中心仓", "正常"],
  ["SKU-1004", 310, 0, 90, 0, 420, "华南中心仓", "低于安全库存"],
  ["SKU-1005", 72, 20, 18, 5, 110, "华东一仓", "低于安全库存"],
  ["SKU-1006", 18, 60, 8, 0, 48, "华东一仓", "低于安全库存"],
  ["SKU-1007", 630, 140, 120, 0, 480, "华东一仓", "正常"],
  ["SKU-1008", 52, 0, 12, 0, 96, "华北前置仓", "低于安全库存"],
  ["SKU-1009", 1800, 0, 500, 0, 1200, "华南中心仓", "正常"],
  ["SKU-1010", 380, 0, 80, 0, 600, "华南中心仓", "低于安全库存"],
  ["SKU-1011", 22, 80, 6, 0, 40, "华北前置仓", "低于安全库存"],
  ["SKU-1012", 160, 30, 24, 0, 120, "华北前置仓", "正常"]
];

const inventory = inventorySeed.map(([skuId, available, inTransit, reserved, frozen, safety, warehouse, status], index) => ({
  skuId, skuName: skus[index].name, category: skus[index].category, warehouseId: warehouses?.find((row) => row.name === warehouse)?.id || null, warehouse, available, inTransit, reserved, frozen, safety, status, lastUpdated: now
}));

const orders = [
  { id: "PO-260801-001", supplierId: "SUP-001", supplierName: "华东生活家居", orderDate: "2026-08-01", requiredDelivery: "2026-08-13", actualDelivery: null, status: "生产中", statusKey: "in_production", amount: 38160, items: 2, owner: "林珊", delayDays: 0 },
  { id: "PO-260802-002", supplierId: "SUP-002", supplierName: "禾木食品供应链", orderDate: "2026-08-02", requiredDelivery: "2026-08-10", actualDelivery: null, status: "已延期", statusKey: "delayed", amount: 29800, items: 2, owner: "林珊", delayDays: 1 },
  { id: "PO-260803-003", supplierId: "SUP-003", supplierName: "南方个护制造", orderDate: "2026-08-03", requiredDelivery: "2026-08-17", actualDelivery: null, status: "待确认", statusKey: "pending", amount: 22400, items: 2, owner: "周岚", delayDays: 0 },
  { id: "PO-260804-004", supplierId: "SUP-004", supplierName: "新潮数码配件", orderDate: "2026-08-04", requiredDelivery: "2026-08-14", actualDelivery: null, status: "已确认", statusKey: "confirmed", amount: 41200, items: 2, owner: "周岚", delayDays: 0 },
  { id: "PO-260805-005", supplierId: "SUP-005", supplierName: "北辰纸品包装", orderDate: "2026-08-05", requiredDelivery: "2026-08-11", actualDelivery: null, status: "缺货", statusKey: "stockout", amount: 10800, items: 2, owner: "林珊", delayDays: 0 },
  { id: "PO-260806-006", supplierId: "SUP-006", supplierName: "优选服饰工厂", orderDate: "2026-08-06", requiredDelivery: "2026-08-19", actualDelivery: null, status: "已确认", statusKey: "confirmed", amount: 19600, items: 2, owner: "陈默", delayDays: 0 },
  { id: "PO-260728-007", supplierId: "SUP-001", supplierName: "华东生活家居", orderDate: "2026-07-28", requiredDelivery: "2026-08-06", actualDelivery: "2026-08-06", status: "已入库", statusKey: "received", amount: 17400, items: 1, owner: "陈默", delayDays: 0 },
  { id: "PO-260729-008", supplierId: "SUP-002", supplierName: "禾木食品供应链", orderDate: "2026-07-29", requiredDelivery: "2026-08-07", actualDelivery: "2026-08-07", status: "已入库", statusKey: "received", amount: 13300, items: 1, owner: "陈默", delayDays: 0 },
  { id: "PO-260730-009", supplierId: "SUP-003", supplierName: "南方个护制造", orderDate: "2026-07-30", requiredDelivery: "2026-08-12", actualDelivery: null, status: "已发货", statusKey: "shipped", amount: 9200, items: 1, owner: "周岚", delayDays: 0 },
  { id: "PO-260731-010", supplierId: "SUP-004", supplierName: "新潮数码配件", orderDate: "2026-07-31", requiredDelivery: "2026-08-08", actualDelivery: "2026-08-09", status: "已入库", statusKey: "received", amount: 8600, items: 1, owner: "陈默", delayDays: 1 }
];

const purchaseOrderItems = orders.flatMap((order, index) => {
  const firstSku = skus[(index * 2) % skus.length];
  const secondSku = skus[(index * 2 + 1) % skus.length];
  const quantity = 100 + index * 20;
  return [
    { orderId: order.id, skuId: firstSku.id, batchNo: `B-${order.id.slice(-3)}-A`, quantity, unitPrice: firstSku.standardPrice, receivedQuantity: order.status === "已入库" ? quantity : 0, qcPassed: order.status === "已入库" ? quantity : 0, qcFailed: 0 },
    ...(order.items > 1 ? [{ orderId: order.id, skuId: secondSku.id, batchNo: `B-${order.id.slice(-3)}-B`, quantity: Math.round(quantity * 0.7), unitPrice: secondSku.standardPrice, receivedQuantity: order.status === "已入库" ? Math.round(quantity * 0.7) : 0, qcPassed: order.status === "已入库" ? Math.round(quantity * 0.7) : 0, qcFailed: 0 }] : [])
  ];
});

const receivingRecords = orders.filter((order) => order.actualDelivery).map((order, index) => ({
  id: `RCV-2608-${String(index + 1).padStart(3, "0")}`,
  orderId: order.id,
  skuId: purchaseOrderItems.find((item) => item.orderId === order.id).skuId,
  receivedQuantity: purchaseOrderItems.find((item) => item.orderId === order.id).receivedQuantity,
  qcPassed: purchaseOrderItems.find((item) => item.orderId === order.id).qcPassed,
  qcFailed: 0,
  receivedAt: `${order.actualDelivery}T15:00:00+08:00`,
  warehouseId: index % 2 ? "WH-002" : "WH-001"
}));

const salesForecast = skus.map((sku, index) => ({
  skuId: sku.id, forecastDate: "2026-08-18", forecastQuantity: 80 + index * 17, forecastAmount: (80 + index * 17) * sku.standardPrice,
  forecastSource: index % 3 === 0 ? "大促计划" : index % 3 === 1 ? "人工调整" : "系统预测", confidence: Number((0.78 + (index % 4) * 0.04).toFixed(2)), promotionFlag: index % 3 !== 2
}));

const promotionPlan = [
  { id: "PROMO-2608-001", name: "夏日生活节", startDate: "2026-08-18", endDate: "2026-08-24", expectedSalesLift: 1.45, bufferMultiplier: 1.35, priority: "高", skuIds: skus.slice(0, 8).map((sku) => sku.id) },
  { id: "PROMO-2608-002", name: "开学季数码周", startDate: "2026-08-25", endDate: "2026-08-31", expectedSalesLift: 1.28, bufferMultiplier: 1.2, priority: "中", skuIds: skus.slice(6, 10).map((sku) => sku.id) }
];

const salesHistory = skus.flatMap((sku, skuIndex) => [
  { skuId: sku.id, salesDate: "2026-08-09", channel: "线上商城", quantity: 42 + skuIndex * 4, amount: (42 + skuIndex * 4) * sku.standardPrice, returnQuantity: skuIndex % 5 === 0 ? 2 : 0 },
  { skuId: sku.id, salesDate: "2026-08-10", channel: "直营网点", quantity: 28 + skuIndex * 3, amount: (28 + skuIndex * 3) * sku.standardPrice, returnQuantity: 0 }
]);

const supplierCommunications = [
  { id: "COM-001", supplierId: "SUP-002", type: "email", content: "请确认低糖燕麦饼 240g 的新到货日期，原计划已延期。", communicationTime: "2026-08-11T08:42:00+08:00", ourContact: "林珊", supplierContact: "李琦", keyPoint: "交期确认", actionItem: "确认新的到货日期", actionStatus: "待办" },
  { id: "COM-002", supplierId: "SUP-003", type: "wechat", content: "氨基酸洁面本周产能已排满，预计 8 月 29 日可发货。", communicationTime: "2026-08-10T17:30:00+08:00", ourContact: "周岚", supplierContact: "陈晓", keyPoint: "异常反馈", actionItem: "评估替代供应商", actionStatus: "待办" },
  { id: "COM-003", supplierId: "SUP-001", type: "meeting", content: "保温杯与收纳箱大促备货量已确认，分批到货。", communicationTime: "2026-08-10T15:10:00+08:00", ourContact: "陈默", supplierContact: "周敏", keyPoint: "交期确认", actionItem: null, actionStatus: "已完成" }
];

const orderStatusHistory = orders.flatMap((order) => [
  { orderId: order.id, status: "pending", changedAt: `${order.orderDate}T10:00:00+08:00`, changedBy: "系统", remark: "订单创建" },
  { orderId: order.id, status: order.statusKey, changedAt: `${order.orderDate}T16:00:00+08:00`, changedBy: order.owner, remark: order.status === "已延期" ? "供应商反馈产能不足" : "状态同步" }
]);

const inventoryTransactions = inventory.slice(0, 8).map((row, index) => ({
  id: `ITX-2608-${String(index + 1).padStart(3, "0")}`, skuId: row.skuId, warehouseId: index % 2 ? "WH-002" : "WH-001", type: index % 2 ? "出库" : "入库", quantity: 40 + index * 10, documentId: index % 2 ? `SO-2608-${index + 1}` : `RCV-2608-${index + 1}`, operatedAt: "2026-08-11T08:30:00+08:00", operator: index % 2 ? "系统" : "陈默"
}));

const dataset = { generatedAt: now, label: "演示数据 · 固定种子", suppliers, skus, inventory, orders, warehouses, purchaseOrderItems, receivingRecords, salesForecast, promotionPlan, salesHistory, supplierCommunications, orderStatusHistory, inventoryTransactions };
await fs.mkdir(dataDir, { recursive: true });
const expectedFiles = new Set([...Object.keys(dataset), "meta"].map((key) => `${key}.json`));
for (const filename of await fs.readdir(dataDir)) {
  if (filename.endsWith(".json") && !expectedFiles.has(filename)) await fs.unlink(path.join(dataDir, filename));
}
for (const [key, value] of Object.entries(dataset)) {
  if (key === "generatedAt" || key === "label") continue;
  await fs.writeFile(path.join(dataDir, `${key}.json`), `${JSON.stringify(value, null, 2)}\n`);
}
await fs.writeFile(path.join(dataDir, "meta.json"), `${JSON.stringify({ generatedAt: now, label: dataset.label }, null, 2)}\n`);
console.log(`Generated ${Object.keys(dataset).length - 2} datasets in ${dataDir}`);
