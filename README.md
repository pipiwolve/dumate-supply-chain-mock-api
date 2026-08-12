# Dumate 供应链协同演示系统

本项目提供三套供应链业务系统的固定种子模拟数据和 API 服务，供 Dumate 通过 HTTP/MCP 网关调用。三套系统为：ERP/OMS（采购订单、订单明细、到货记录、销售预测、促销计划、销售历史）、WMS（仓库、库存快照、库存流水）和 CRM/供应商系统（供应商、SKU 主数据、供应商沟通记录）。

## 启动

```bash
npm run generate
npm start
```

打开 `http://127.0.0.1:4173` 可查看系统接入门户。页面用于核验三套模拟系统、记录数量和接口状态，不承担业务看板或分析职责。

公网接入门户：`https://www.demofun.online`。Dumate MCP 地址：`https://www.demofun.online/api/mcp`。可直接参考 `DUMATE-OPERATING-PROMPT.md` 配置 Dumate 的连接和操作流程。

## 模拟数据

运行 `npm run generate` 会确定性生成以下数据文件：

- ERP/OMS：`orders.json`、`purchaseOrderItems.json`、`receivingRecords.json`、`salesForecast.json`、`promotionPlan.json`、`salesHistory.json`
- WMS：`warehouses.json`、`inventory.json`、`inventoryTransactions.json`
- CRM：`suppliers.json`、`skus.json`、`supplierCommunications.json`
- 服务元信息：`meta.json`

`scripts/generate-mock-data.mjs` 是唯一的模拟数据来源。完整接口清单见 `API.md`。除标准资源接口外，`POST /api/mcp` 提供工具网关：`tools/list` 和 `tools/call`。

## 当前范围

系统是 Dumate 的上游系统模拟器，所有数值均为模拟数据。Dumate 负责基于这些原始数据生成补货建议、异常预警、数据看板和定时推送。真实 ERP/WMS/CRM 接入、登录鉴权、消息通知和完整 MCP Streamable HTTP/SSE transport 留待后续实施。
