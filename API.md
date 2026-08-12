# 供应链模拟系统 API

部署后根地址为 `https://www.demofun.online`，本地为 `http://127.0.0.1:4173`。MCP 地址为 `https://www.demofun.online/api/mcp`。

所有资源接口均为 `GET`，返回 JSON 数组；数据为固定种子演示数据。

## ERP/OMS

| 接口 | 对应模拟表 | 关键字段 |
|---|---|---|
| `/api/orders` | `purchase_orders` | `id`, `supplierId`, `orderDate`, `requiredDelivery`, `actualDelivery`, `status`, `statusKey`, `amount`, `owner`, `delayDays` |
| `/api/purchaseOrderItems` | `purchase_order_items` | `orderId`, `skuId`, `batchNo`, `quantity`, `unitPrice`, `receivedQuantity`, `qcPassed`, `qcFailed` |
| `/api/receivingRecords` | `receiving_records` | `id`, `orderId`, `skuId`, `receivedQuantity`, `qcPassed`, `qcFailed`, `receivedAt`, `warehouseId` |
| `/api/salesForecast` | `sales_forecast` | `skuId`, `forecastDate`, `forecastQuantity`, `forecastAmount`, `forecastSource`, `confidence`, `promotionFlag` |
| `/api/promotionPlan` | `promotion_plan` | `id`, `name`, `startDate`, `endDate`, `expectedSalesLift`, `bufferMultiplier`, `priority`, `skuIds` |
| `/api/salesHistory` | `sales_history` | `skuId`, `salesDate`, `channel`, `quantity`, `amount`, `returnQuantity` |

## WMS

| 接口 | 对应模拟表 | 关键字段 |
|---|---|---|
| `/api/warehouses` | `warehouses` | `id`, `name`, `type`, `address`, `contact`, `status` |
| `/api/inventory` | `inventory_snapshot` | `skuId`, `skuName`, `category`, `warehouse`, `available`, `inTransit`, `reserved`, `frozen`, `safety`, `status`, `lastUpdated` |
| `/api/inventoryTransactions` | `inventory_transactions` | `id`, `skuId`, `warehouseId`, `type`, `quantity`, `documentId`, `operatedAt`, `operator` |

## CRM / 供应商

| 接口 | 对应模拟表 | 关键字段 |
|---|---|---|
| `/api/suppliers` | `suppliers` | `id`, `name`, `category`, `contact`, `phone`, `rating`, `status`, `paymentTerms`, `onTimeRate`, `pendingCommunications` |
| `/api/skus` | `sku_master` | `id`, `name`, `category`, `supplierId`, `unit`, `leadTimeDays`, `safetyDays`, `standardPrice` |
| `/api/supplierCommunications` | `supplier_communications` | `id`, `supplierId`, `type`, `content`, `communicationTime`, `ourContact`, `supplierContact`, `keyPoint`, `actionItem`, `actionStatus` |

## 服务元信息

- `GET /api/summary`：仅提供原始数据规模与订单状态概览，便于 Dumate 做连接测试。
- `GET /health`：健康检查。

## MCP HTTP 工具网关

### 初始化

```http
POST /api/mcp
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"Dumate","version":"demo"}}}
```

### 列出工具

```http
POST /api/mcp
Content-Type: application/json

{"jsonrpc":"2.0","id":2,"method":"tools/list"}
```

### 调用工具

```http
POST /api/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_inventory",
    "arguments": { "category": "个护清洁" }
  }
}
```

当前工具名：`get_inventory`、`get_sales_forecast`、`get_purchase_orders`、`get_supplier_info`、`get_supplier_communications`、`get_order_status`。

## 关系

`suppliers.id -> skus.supplierId -> inventory.skuId / salesForecast.skuId`；`orders.id -> purchaseOrderItems.orderId -> receivingRecords.orderId`；`warehouses.id -> inventoryTransactions.warehouseId / receivingRecords.warehouseId`。

## 说明

当前数据接口是只读模拟源。补货建议、预警处理、定时推送和数据看板由 Dumate 负责，不在此服务内实现。真实系统接入、认证、限流、日志、消息通知和完整 MCP transport 属于后续工作。
