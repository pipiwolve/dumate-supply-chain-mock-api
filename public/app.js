const endpoints = ["summary", "inventory", "orders", "suppliers", "replenishment", "alerts", "meta"];
const viewTitles = {
  overview: "运营总览",
  inventory: "库存状态",
  orders: "采购订单",
  suppliers: "供应商",
  replenishment: "补货建议",
  alerts: "异常预警",
};

const state = { activeView: "overview", data: null, filters: { query: "", status: "all" } };
const content = document.querySelector("#content");
const pageTitle = document.querySelector("#page-title");
const syncLabel = document.querySelector("#sync-label");
const refreshButton = document.querySelector("#refresh-button");

const formatNumber = (value) => new Intl.NumberFormat("zh-CN").format(value);
const safe = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
const badgeClass = (value) => value === "高" ? "high" : value === "中" ? "medium" : value === "低" ? "low" : "observe";
const statusClass = (value) => {
  if (["正常", "已入库", "已确认", "活跃", "已发货"].includes(value)) return "good";
  if (["低于安全库存", "待确认", "处理中", "待处理", "暂停"].includes(value)) return "warning";
  if (["已延期", "缺货"].includes(value)) return "danger";
  return "";
};
const status = (value) => `<span class="status ${statusClass(value)}">${safe(value)}</span>`;
const priority = (value) => `<span class="priority ${badgeClass(value)}">${safe(value)}</span>`;

async function loadData() {
  refreshButton.disabled = true;
  refreshButton.textContent = "正在刷新";
  try {
    const response = await Promise.all(endpoints.map(async (name) => {
      const result = await fetch(`/api/${name}`);
      if (!result.ok) throw new Error(`无法加载 ${name}`);
      return [name, await result.json()];
    }));
    state.data = Object.fromEntries(response);
    syncLabel.textContent = `数据快照 · ${new Date(state.data.summary.generatedAt).toLocaleString("zh-CN", { hour12: false })}`;
    document.querySelector("#nav-alert-count").textContent = state.data.summary.openAlerts;
    render();
  } catch (error) {
    content.innerHTML = `<section class="error-state"><h2>数据加载失败</h2><p>${safe(error.message)}</p><button class="button button-primary" data-retry type="button">重新加载</button></section>`;
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "刷新数据";
  }
}

function metric(label, value, note, variant = "") {
  return `<article class="metric ${variant}"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-note">${note}</div></article>`;
}

function table(headers, rows) {
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th class="${h.align || ""}">${h.label}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}

function renderOverview() {
  const { summary, alerts, replenishment, orders } = state.data;
  const highReplenishment = replenishment.filter((row) => row.priority === "高");
  const activeOrders = orders.filter((row) => !["已入库", "已取消"].includes(row.status)).slice(0, 5);
  return `
    <section class="metrics" aria-label="关键指标">
      ${metric("待处理异常", summary.openAlerts, "需要安排下一步动作", "risk")}
      ${metric("低库存 SKU", summary.lowStock, `共 ${summary.totalSkus} 个 SKU`, "warning")}
      ${metric("在途采购订单", summary.inTransitOrders, `${summary.delayedOrders} 单存在交期偏差`, "")}
      ${metric("活跃供应商", summary.activeSuppliers, `${summary.highPriority} 个高优先级补货项`, "good")}
    </section>
    <section class="layout-two">
      <article class="panel">
        <div class="panel-header"><div><h2 class="panel-title">高优先级补货</h2><span class="panel-subtitle">按库存覆盖天数排序</span></div><button class="button button-secondary" data-open-view="replenishment" type="button">查看全部</button></div>
        ${table(
          [{ label: "SKU" }, { label: "当前 / 安全库存" }, { label: "覆盖天数" }, { label: "建议补货", align: "align-right" }, { label: "优先级" }],
          highReplenishment.map((row) => `<tr><td><div class="strong">${safe(row.skuName)}</div><span class="code">${safe(row.skuId)}</span></td><td>${formatNumber(row.current)} / ${formatNumber(row.safety)}</td><td>${row.coverage} 天</td><td class="align-right strong">${formatNumber(row.suggested)}</td><td>${priority(row.priority)}</td></tr>`),
        )}
      </article>
      <article class="panel"><div class="panel-header"><div><h2 class="panel-title">需要处理</h2><span class="panel-subtitle">按风险等级显示</span></div><button class="button button-secondary" data-open-view="alerts" type="button">全部预警</button></div><div class="panel-body">${renderAlertRows(alerts.slice(0, 3), true)}</div></article>
    </section>
    <section class="layout-wide panel">
      <div class="panel-header"><div><h2 class="panel-title">采购到货节点</h2><span class="panel-subtitle">进行中的订单与负责人</span></div><button class="button button-secondary" data-open-view="orders" type="button">订单明细</button></div>
      ${table(
        [{ label: "采购订单" }, { label: "供应商" }, { label: "要求交期" }, { label: "状态" }, { label: "负责人" }, { label: "金额", align: "align-right" }],
        activeOrders.map((row) => `<tr><td class="strong">${safe(row.id)}</td><td>${safe(row.supplierName)}</td><td>${safe(row.requiredDelivery)}</td><td>${status(row.status)}</td><td>${safe(row.owner)}</td><td class="align-right">¥${formatNumber(row.amount)}</td></tr>`),
      )}
    </section>`;
}

function filters(placeholder, statuses = []) {
  return `<div class="filters"><input class="field search" id="query-filter" value="${safe(state.filters.query)}" placeholder="${placeholder}" aria-label="关键词筛选" />${statuses.length ? `<select class="field" id="status-filter" aria-label="状态筛选"><option value="all">全部状态</option>${statuses.map((item) => `<option value="${safe(item)}" ${state.filters.status === item ? "selected" : ""}>${safe(item)}</option>`).join("")}</select>` : ""}</div>`;
}

function renderInventory() {
  const query = state.filters.query.toLowerCase();
  const statusFilter = state.filters.status;
  const rows = state.data.inventory.filter((row) => (`${row.skuId}${row.skuName}${row.category}${row.warehouse}`).toLowerCase().includes(query) && (statusFilter === "all" || row.status === statusFilter));
  return `<section><div class="section-head"><div><h2>库存状态</h2><p>可用库存、在途库存和安全库存阈值</p></div>${filters("搜索 SKU、品类或仓库", ["正常", "低于安全库存"])}</div><article class="panel">${rows.length ? table([{ label: "SKU" }, { label: "品类 / 仓库" }, { label: "可用库存", align: "align-right" }, { label: "在途" , align: "align-right"}, { label: "预留" , align: "align-right"}, { label: "安全库存", align: "align-right" }, { label: "库存状态" }], rows.map((row) => `<tr><td><div class="strong">${safe(row.skuName)}</div><span class="code">${safe(row.skuId)}</span></td><td>${safe(row.category)}<br><span class="code">${safe(row.warehouse)}</span></td><td class="align-right strong">${formatNumber(row.available)}</td><td class="align-right">${formatNumber(row.inTransit)}</td><td class="align-right">${formatNumber(row.reserved)}</td><td class="align-right">${formatNumber(row.safety)}</td><td>${status(row.status)}</td></tr>`)) : empty("没有匹配的库存记录", "清除筛选")}</article></section>`;
}

function renderOrders() {
  const query = state.filters.query.toLowerCase();
  const statusFilter = state.filters.status;
  const rows = state.data.orders.filter((row) => (`${row.id}${row.supplierName}${row.owner}`).toLowerCase().includes(query) && (statusFilter === "all" || row.status === statusFilter));
  const statuses = [...new Set(state.data.orders.map((row) => row.status))];
  return `<section><div class="section-head"><div><h2>采购订单</h2><p>统一查看交期、订单状态和责任人</p></div>${filters("搜索订单号、供应商或负责人", statuses)}</div><article class="panel">${rows.length ? table([{ label: "采购订单" }, { label: "供应商" }, { label: "下单日期" }, { label: "要求交期" }, { label: "状态" }, { label: "负责人" }, { label: "金额", align: "align-right" }], rows.map((row) => `<tr><td><div class="strong">${safe(row.id)}</div><span class="code">${row.items} 个明细行</span></td><td>${safe(row.supplierName)}</td><td>${safe(row.orderDate)}</td><td>${safe(row.requiredDelivery)}</td><td>${status(row.status)}</td><td>${safe(row.owner)}</td><td class="align-right">¥${formatNumber(row.amount)}</td></tr>`)) : empty("没有匹配的采购订单", "清除筛选")}</article></section>`;
}

function renderSuppliers() {
  const query = state.filters.query.toLowerCase();
  const rows = state.data.suppliers.filter((row) => (`${row.id}${row.name}${row.category}${row.contact}`).toLowerCase().includes(query));
  return `<section><div class="section-head"><div><h2>供应商</h2><p>主数据、履约表现与待跟进沟通</p></div>${filters("搜索供应商、品类或联系人")}</div><article class="panel"><div class="panel-body"><div class="list-panel">${rows.length ? rows.map((row) => `<article class="supplier-row"><div><div class="strong">${safe(row.name)} <span class="rating">${safe(row.rating)} 级</span></div><div class="supplier-meta">${safe(row.id)} · ${safe(row.category)} · ${safe(row.contact)} ${safe(row.phone)}</div><div class="communication"><span>近 90 天准时交付 <strong>${Math.round(row.onTimeRate * 100)}%</strong></span><span>待回复 <strong>${row.pendingCommunications} 条</strong></span></div></div><div>${status(row.status)}</div></article>`).join("") : empty("没有匹配的供应商", "清除筛选")}</div></div></article></section>`;
}

function renderReplenishment() {
  const query = state.filters.query.toLowerCase();
  const statusFilter = state.filters.status;
  const rows = state.data.replenishment.filter((row) => (`${row.skuId}${row.skuName}${row.category}`).toLowerCase().includes(query) && (statusFilter === "all" || row.priority === statusFilter));
  return `<section><div class="section-head"><div><h2>补货建议</h2><p>基于库存覆盖、销售预测与安全库存计算</p></div>${filters("搜索 SKU 或品类", ["高", "中", "低", "观察"])}</div><article class="panel">${rows.length ? table([{ label: "SKU" }, { label: "当前库存", align: "align-right" }, { label: "安全库存", align: "align-right" }, { label: "30 日预测", align: "align-right" }, { label: "覆盖天数", align: "align-right" }, { label: "建议补货", align: "align-right" }, { label: "预计到货" }, { label: "优先级" }], rows.map((row) => `<tr><td><div class="strong">${safe(row.skuName)}</div><span class="code">${safe(row.skuId)} · ${safe(row.category)}</span></td><td class="align-right">${formatNumber(row.current)}</td><td class="align-right">${formatNumber(row.safety)}</td><td class="align-right">${formatNumber(row.forecast30)}</td><td class="align-right strong">${row.coverage} 天</td><td class="align-right strong">${formatNumber(row.suggested)}</td><td>${safe(row.eta)}</td><td>${priority(row.priority)}</td></tr>`)) : empty("没有匹配的补货建议", "清除筛选")}</article></section>`;
}

function renderAlertRows(rows, compact = false) {
  return `<div class="alert-list">${rows.map((row) => `<article class="alert-row ${row.severity === "高" ? "high" : row.severity === "低" ? "low" : ""}"><span class="alert-bar"></span><div><h3 class="alert-title">${safe(row.title)}</h3><p class="alert-detail">${safe(row.detail)}</p><div class="alert-meta">${safe(row.source)} · ${safe(row.createdAt)} · ${safe(row.owner)}</div></div><div class="alert-status">${safe(row.status)}${compact ? "" : (row.status === "待处理" ? `<button class="alert-action" data-ack="${safe(row.id)}" type="button">标记处理中</button>` : "")}</div></article>`).join("")}</div>`;
}

function renderAlerts() {
  const query = state.filters.query.toLowerCase();
  const statusFilter = state.filters.status;
  const rows = state.data.alerts.filter((row) => (`${row.id}${row.title}${row.type}${row.owner}`).toLowerCase().includes(query) && (statusFilter === "all" || row.status === statusFilter));
  return `<section><div class="section-head"><div><h2>异常预警</h2><p>按预警等级处理库存、交期、质量和沟通异常</p></div>${filters("搜索预警标题、类型或负责人", ["待处理", "处理中", "已确认"])}</div><article class="panel"><div class="panel-body">${rows.length ? renderAlertRows(rows) : empty("没有匹配的预警", "清除筛选")}</div></article></section>`;
}

function empty(message, action) {
  return `<div class="empty"><p>${message}</p><button class="button button-secondary" data-clear-filters type="button">${action}</button></div>`;
}

function render() {
  if (!state.data) return;
  const activeElement = document.activeElement;
  const restoreQueryFocus = activeElement?.id === "query-filter";
  const selectionStart = restoreQueryFocus ? activeElement.selectionStart : null;
  pageTitle.textContent = viewTitles[state.activeView];
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.view === state.activeView));
  const renderer = { overview: renderOverview, inventory: renderInventory, orders: renderOrders, suppliers: renderSuppliers, replenishment: renderReplenishment, alerts: renderAlerts }[state.activeView];
  content.innerHTML = renderer();
  if (restoreQueryFocus) {
    const queryFilter = document.querySelector("#query-filter");
    queryFilter?.focus();
    queryFilter?.setSelectionRange(selectionStart, selectionStart);
  }
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) { state.activeView = viewButton.dataset.view; state.filters = { query: "", status: "all" }; render(); return; }
  const openView = event.target.closest("[data-open-view]");
  if (openView) { state.activeView = openView.dataset.openView; state.filters = { query: "", status: "all" }; render(); return; }
  if (event.target.closest("[data-retry]")) { loadData(); return; }
  if (event.target.closest("[data-clear-filters]")) { state.filters = { query: "", status: "all" }; render(); return; }
  const acknowledge = event.target.closest("[data-ack]");
  if (acknowledge) { const target = state.data.alerts.find((row) => row.id === acknowledge.dataset.ack); if (target) target.status = "处理中"; render(); }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "query-filter") { state.filters.query = event.target.value; render(); }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "status-filter") { state.filters.status = event.target.value; render(); }
});
refreshButton.addEventListener("click", loadData);
loadData();
