// @ts-nocheck
import { fetchJson, renderComparePanels, setNodeText, toQuery, withNoPackageLoad } from "./common.ts";

const dashboardBody = (mode = "") => `
  <h4>${mode}</h4>
  <p data-role="${mode}-status">Status: idle</p>
  <div class="dashboard-grid-inner">
    <article class="dashboard-card">
      <h5>KPI</h5>
      <p data-card="${mode}-kpi">Not loaded</p>
    </article>
    <article class="dashboard-card">
      <h5>Activity</h5>
      <p data-card="${mode}-activity">Not loaded</p>
    </article>
    <article class="dashboard-card">
      <h5>Chart</h5>
      <p data-card="${mode}-chart">Not loaded</p>
    </article>
    <article class="dashboard-card">
      <h5>Alerts</h5>
      <p data-card="${mode}-alerts">Not loaded</p>
    </article>
  </div>
`;

export const mountDashboardDemo = (ctx = {}) => {
  const mountNode = ctx.mountNode;
  if (!mountNode) {
    return () => {};
  }

  const surfaces = renderComparePanels(mountNode, {
    headline: "Dashboard cards loaded in parallel and stressed in repeated waves.",
    code: "DB-CMP-02",
    controlsHtml: `
      <div class="control-grid">
        <button type="button" data-action="load">DB-LOAD-11</button>
        <button type="button" data-action="alerts">DB-ALERT-22</button>
        <button type="button" data-action="stress">DB-STRESS-33</button>
      </div>
    `,
    withSurfaceId: "dashboard-with-surface",
    withoutSurfaceId: "dashboard-without-surface",
    withBodyHtml: dashboardBody("with"),
    withoutBodyHtml: dashboardBody("without")
  });

  const listeners = [];
  const withStatus = mountNode.querySelector('[data-role="with-status"]');
  const withoutStatus = mountNode.querySelector('[data-role="without-status"]');
  const withCards = {
    kpi: mountNode.querySelector('[data-card="with-kpi"]'),
    activity: mountNode.querySelector('[data-card="with-activity"]'),
    chart: mountNode.querySelector('[data-card="with-chart"]'),
    alerts: mountNode.querySelector('[data-card="with-alerts"]')
  };
  const withoutCards = {
    kpi: mountNode.querySelector('[data-card="without-kpi"]'),
    activity: mountNode.querySelector('[data-card="without-activity"]'),
    chart: mountNode.querySelector('[data-card="without-chart"]'),
    alerts: mountNode.querySelector('[data-card="without-alerts"]')
  };

  const addListener = (node = null, eventName = "", handler = () => {}) => {
    if (!node || !eventName) {
      return;
    }
    node.addEventListener(eventName, handler);
    listeners.push(() => {
      node.removeEventListener(eventName, handler);
    });
  };

  const setStatus = (message = "") => {
    setNodeText(withStatus, `Status: ${message}`);
    setNodeText(withoutStatus, `Status: ${message}`);
    ctx.setGlobalStatus(message);
  };

  const renderCards = (cards = {}, payload = {}) => {
    setNodeText(cards.kpi, payload.kpi?.headline ?? "Unavailable");
    setNodeText(cards.activity, payload.activity?.summary ?? "Unavailable");
    setNodeText(cards.chart, payload.chart?.summary ?? "Unavailable");
    setNodeText(cards.alerts, payload.alerts?.summary ?? "Unavailable");
  };

  const fetchDashboard = async (baseDelay = 0) => {
    const requests = [
      fetchJson(`/api/dashboard/kpi?${toQuery({ delay: baseDelay + 420 })}`),
      fetchJson(`/api/dashboard/activity?${toQuery({ delay: baseDelay + 760 })}`),
      fetchJson(`/api/dashboard/chart?${toQuery({ delay: baseDelay + 960 })}`),
      fetchJson(`/api/dashboard/alerts?${toQuery({ delay: baseDelay + 640 })}`)
    ];
    const results = await Promise.all(requests);
    return {
      kpi: results[0],
      activity: results[1],
      chart: results[2],
      alerts: results[3]
    };
  };

  const loadDashboard = async () => {
    setStatus("Dashboard load in progress");
    try {
      const [withPayload, withoutPayload] = await Promise.all([
        fetchDashboard(0),
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchDashboard(0))
      ]);
      renderCards(withCards, withPayload);
      renderCards(withoutCards, withoutPayload);
      setStatus("Dashboard loaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Dashboard failed (${message})`);
    }
  };

  const refreshAlerts = async () => {
    setStatus("Alert refresh in progress");
    try {
      const [withData, withoutData] = await Promise.all([
        fetchJson("/api/dashboard/alerts?delay=260"),
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchJson("/api/dashboard/alerts?delay=260"))
      ]);
      setNodeText(withCards.alerts, withData.summary ?? "Alerts refreshed");
      setNodeText(withoutCards.alerts, withoutData.summary ?? "Alerts refreshed");
      setStatus("Alert refresh complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Alert refresh failed (${message})`);
    }
  };

  const stressRefresh = async () => {
    setStatus("Stress refresh in progress");
    try {
      await Promise.all([
        fetchDashboard(150),
        fetchDashboard(350),
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchDashboard(150)),
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchDashboard(350))
      ]);
      await loadDashboard();
      setStatus("Stress refresh complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Stress refresh failed (${message})`);
    }
  };

  ctx.createEnhancer({
    skeletonSelector: "#dashboard-with-surface"
  });

  addListener(mountNode.querySelector('[data-action="load"]'), "click", () => {
    void loadDashboard();
  });
  addListener(mountNode.querySelector('[data-action="alerts"]'), "click", () => {
    void refreshAlerts();
  });
  addListener(mountNode.querySelector('[data-action="stress"]'), "click", () => {
    void stressRefresh();
  });

  setStatus("Dashboard compare ready");
  void loadDashboard();

  return () => {
    listeners.forEach((cleanup = () => {}) => cleanup());
    listeners.length = 0;
    ctx.disposeEnhancer();
  };
};
