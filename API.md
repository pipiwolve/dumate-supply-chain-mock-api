# 供应链模拟系统 API

部署后根地址为 `https://<your-vercel-domain>`，本地为 `http://127.0.0.1:4173`。

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

## DuMate 分析域

- `GET /api/replenishment`：补货建议，字段包括 `skuId`, `current`, `safety`, `forecast30`, `suggested`, `coverage`, `priority`, `eta`。
- `GET /api/alerts`：异常预警，字段包括 `id`, `severity`, `type`, `title`, `detail`, `source`, `createdAt`, `owner`, `status`。
- `GET /api/summary`：聚合指标。
- `GET /health`：健康检查。

## MCP HTTP 工具网关

### 列出工具

```http
POST /api/mcp
Content-Type: application/json

{"method":"tools/list"}
```

### 调用工具

```http
POST /api/mcp
Content-Type: application/json

{
  "method": "tools/call",
  "params": {
    "name": "get_inventory",
    "arguments": { "category": "个护清洁" }
  }
}
```

当前工具名：`get_inventory`、`get_sales_forecast`、`get_purchase_orders`、`get_supplier_info`、`get_order_status`、`calculate_replenishment`、`upload_communication`。

## 关系

`suppliers.id -> skus.supplierId -> inventory.skuId / salesForecast.skuId / replenishment.skuId`；`orders.id -> purchaseOrderItems.orderId -> receivingRecords.orderId`；`warehouses.id -> inventoryTransactions.warehouseId / receivingRecords.warehouseId`。

## 说明

当前数据接口是只读模拟源；`upload_communication` 在 MCP 网关中返回模拟归档结果，不持久化写入。真实系统接入、认证、限流、日志、消息通知和数据库替换属于后续工作。
