# Dumate MCP 接入配置

## JSON 导入

在 Dumate 的“连接应用”窗口中选择“JSON 导入”，粘贴以下内容：

```json
{
  "mcpServers": {
    "dumateSupplyChainSystems": {
      "url": "https://www.demofun.online/api/mcp",
      "type": "streamableHttp",
      "headers": {}
    }
  }
}
```

点击“添加”后，应用名称和描述填写如下：

| 字段 | 内容 |
|---|---|
| 应用名称 | `供应链上游系统模拟器` |
| 应用描述 | `提供 ERP/OMS、WMS、CRM 固定种子演示数据，支持库存、销售预测、采购订单、供应商和订单状态查询。` |

## 手动配置

如果不使用 JSON 导入，按以下字段填写：

- 应用名称：`供应链上游系统模拟器`
- MCP Server URL：`https://www.demofun.online/api/mcp`
- 传输类型：`streamableHttp`
- Headers：留空，无需 API Key

当前公网服务是只读演示数据源，数据标签为“演示数据 · 固定种子”。

## 连接后应出现的工具

连接成功后，Dumate 应能发现以下 6 个工具：

- `get_inventory`：查询 WMS 库存快照
- `get_sales_forecast`：查询 ERP/OMS 销售预测
- `get_purchase_orders`：查询 ERP/OMS 采购订单
- `get_supplier_info`：查询 CRM 供应商主数据
- `get_supplier_communications`：查询 CRM 供应商沟通记录
- `get_order_status`：查询采购订单当前状态与历史

## 连接验收

在 Dumate 中完成连接后，执行以下指令：

```text
请验证“供应链上游系统模拟器”连接：
1. 确认 MCP 初始化成功；
2. 列出可用工具，并确认应有 6 个工具；
3. 调用 get_inventory，筛选 category=个护清洁；
4. 调用 get_purchase_orders，筛选 is_delayed=true；
5. 从返回结果中选一个订单号，调用 get_order_status 并包含状态历史；
6. 输出每个工具的调用结果数量、字段缺失和异常信息。
所有结果标记为“演示数据 · 固定种子”，不要创建采购订单、发送通知或写回上游系统。
```

## 能力边界

本 MCP 只提供上游事实数据查询，不提供写入接口。以下能力由 Dumate 自己负责：

- 补货建议与补货分析报告
- 异常预警与预警处理
- 数据看板
- 供应商沟通归档后的任务存储
- 定时报告和消息推送

如果 Dumate 返回“无法连接”或“没有发现工具”，先确认访问地址是否完整包含 `/api/mcp`，再检查 `type` 是否填写为 `streamableHttp`。

## 相关地址

- 接入门户：<https://www.demofun.online>
- MCP 入口：<https://www.demofun.online/api/mcp>
- 健康检查：<https://www.demofun.online/health>
- API 文档：`API.md`
- Dumate 操作 Prompt：`DUMATE-OPERATING-PROMPT.md`
