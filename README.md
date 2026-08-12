# Dumate 供应链协同演示系统

本项目提供三套供应链业务系统的固定种子模拟数据和 API 服务，供 Dumate 通过 HTTP/MCP 网关调用。三套系统为：ERP/OMS（采购订单、订单明细、到货记录、销售预测、促销计划、销售历史）、WMS（仓库、库存快照、库存流水）和 CRM/供应商系统（供应商、SKU 主数据、供应商沟通记录）。

## 启动

```bash
npm run generate
npm start
```

打开 `http://127.0.0.1:4173`。页面看板只是本地调试入口，不属于本期云端交付范围。

## 模拟数据

运行 `npm run generate` 会确定性生成以下数据文件：

- ERP/OMS：`orders.json`、`purchaseOrderItems.json`、`receivingRecords.json`、`salesForecast.json`、`promotionPlan.json`、`salesHistory.json`
- WMS：`warehouses.json`、`inventory.json`、`inventoryTransactions.json`
- CRM：`suppliers.json`、`skus.json`、`supplierCommunications.json`
- DuMate 分析域：`replenishment.json`、`alerts.json`、`meta.json`

`scripts/generate-mock-data.mjs` 是唯一的模拟数据来源。完整接口清单见 `API.md`。除标准资源接口外，`POST /api/mcp` 提供工具网关：`tools/list` 和 `tools/call`。

## 当前范围

系统是演示环境，所有数值均为模拟数据。真实 ERP/WMS/CRM 接入、登录鉴权、消息通知和生产级 MCP Server 留待后续实施。
