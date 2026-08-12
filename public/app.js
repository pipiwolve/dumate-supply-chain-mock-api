const resources = {
  erp: ["orders", "purchaseOrderItems", "receivingRecords", "salesForecast", "promotionPlan", "salesHistory"],
  wms: ["warehouses", "inventory", "inventoryTransactions"],
  crm: ["suppliers", "skus", "supplierCommunications"]
};

const $ = (id) => document.getElementById(id);

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return response.json();
}

async function refreshStatus() {
  const light = $("healthLight");
  const text = $("healthText");
  light.className = "status-light pending";
  text.textContent = "正在检查连接";
  try {
    await fetchJson("/health");
    const counts = await Promise.all(Object.entries(resources).map(async ([group, names]) => {
      const values = await Promise.all(names.map((name) => fetchJson(`/api/${name}`)));
      return [group, values.reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0)];
    }));
    for (const [group, count] of counts) $(`${group}Count`).textContent = `${count} 条记录`;
    light.className = "status-light";
    text.textContent = "服务在线 · API 可用";
    $("updatedAt").textContent = `最近检查 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    light.className = "status-light error";
    text.textContent = "连接异常 · 点击重试";
    $("updatedAt").textContent = "状态检查失败";
  }
}

$("refreshButton").addEventListener("click", refreshStatus);
$("copyButton").addEventListener("click", async () => {
  const value = `${location.origin}/api/mcp`;
  try { await navigator.clipboard.writeText(value); } catch { return; }
  const button = $("copyButton");
  button.textContent = "已复制";
  setTimeout(() => { button.textContent = "复制"; }, 1600);
});

refreshStatus();
