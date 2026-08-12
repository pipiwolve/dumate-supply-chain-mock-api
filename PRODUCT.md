# Dumate 上游系统模拟器

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

主要用户是为 Dumate 设计和验证供应链案例的产品、集成与测试人员。他们需要快速核对 ERP/OMS、WMS、CRM 三套上游模拟系统是否在线、数据是否可查询、MCP 工具是否可调用。

## Product Purpose

Dumate 上游系统模拟器以固定种子生成三套系统的只读事实数据，并通过 REST API 与 JSON-RPC 风格 MCP 网关提供给 Dumate。它只负责模拟数据源，不负责业务决策。

## Positioning

系统的核心价值是提供稳定、可重复、可追溯的跨系统测试输入，让 Dumate 能验证查询、分析、看板、预警和编排流程。

## Operating Context

用户通常通过 Dumate 调用接口；浏览器入口是供人类核验系统目录、记录数量、健康状态和 MCP 接入地址的轻量门户。首期使用本地 JSON 数据源模拟 ERP/OMS、WMS 和 CRM。

## Capabilities and Constraints

- 提供 ERP/OMS、WMS、CRM 的固定种子模拟表和只读查询接口。
- 提供 `/health`、`/api/summary` 和 `/api/mcp` 连接验证入口。
- 模拟数据必须可重复生成，并明确标注为演示数据。
- 尚未接入真实 ERP/WMS/CRM、认证、消息通知或生产级 MCP Server；这些属于后续实施阶段。

## Evidence on Hand

- 供应链协同项目实施评估：`供应链协同项目实施评估-2026-08-11.md`
- 用户提供的供应链/采购协同案例视觉参考图（会话附件）。
- 没有真实客户名称、运营指标或生产数据，系统不得将模拟数据描述为客户成效。

## Product Principles

1. 事实可追溯：记录、订单、SKU、供应商和仓库保持可关联。
2. 接口清晰：每个模拟系统的职责和资源边界明确。
3. 演示诚实：模拟数据用于验证流程，不冒充真实业务结果。
4. 职责分离：补货建议、预警、看板和定时推送由 Dumate 负责。
