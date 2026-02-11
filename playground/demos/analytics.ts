// @ts-nocheck
import { fetchJson, renderComparePanels, setNodeText, toQuery, withNoPackageLoad } from "./common.ts";

const analyticsBody = (mode = "") => `
  <h4>${mode}</h4>
  <p data-role="${mode}-status">Status: idle</p>
  <p data-role="${mode}-query">Query: not started</p>
  <p data-role="${mode}-summary">Summary: pending</p>
  <p data-role="${mode}-export">Export: not prepared</p>
`;

export const mountAnalyticsDemo = (ctx = {}) => {
  const mountNode = ctx.mountNode;
  if (!mountNode) {
    return () => {};
  }

  const surfaces = renderComparePanels(mountNode, {
    headline: "Report generation flow with chained analytics calls and export preparation.",
    code: "ANL-CMP-08",
    controlsHtml: `
      <div class="control-grid">
        <button type="button" data-action="run">ANL-RUN-91</button>
        <button type="button" data-action="slow">ANL-SLOW-92</button>
        <button type="button" data-action="error">ANL-ERR-93</button>
      </div>
    `,
    withSurfaceId: "analytics-with-surface",
    withoutSurfaceId: "analytics-without-surface",
    withBodyHtml: analyticsBody("with"),
    withoutBodyHtml: analyticsBody("without")
  });

  const listeners = [];
  const withStatus = mountNode.querySelector('[data-role="with-status"]');
  const withoutStatus = mountNode.querySelector('[data-role="without-status"]');
  const withQuery = mountNode.querySelector('[data-role="with-query"]');
  const withoutQuery = mountNode.querySelector('[data-role="without-query"]');
  const withSummary = mountNode.querySelector('[data-role="with-summary"]');
  const withoutSummary = mountNode.querySelector('[data-role="without-summary"]');
  const withExport = mountNode.querySelector('[data-role="with-export"]');
  const withoutExport = mountNode.querySelector('[data-role="without-export"]');

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

  const reset = () => {
    setNodeText(withQuery, "Query: not started");
    setNodeText(withoutQuery, "Query: not started");
    setNodeText(withSummary, "Summary: pending");
    setNodeText(withoutSummary, "Summary: pending");
    setNodeText(withExport, "Export: not prepared");
    setNodeText(withoutExport, "Export: not prepared");
  };

  const runAnalytics = async (mode = "normal") => {
    const delay = mode === "slow" ? 1300 : 460;
    const status = mode === "error" ? 503 : "";
    setStatus(`Analytics ${mode} in progress`);
    reset();

    try {
      const runChain = async (variant = "with") => {
        const wrap = (task = () => Promise.resolve({})) => {
          if (variant === "with") {
            return task();
          }
          return withNoPackageLoad(surfaces?.withoutSurface, task);
        };

        const queryResult = await wrap(() =>
          fetchJson(`/api/analytics/query?${toQuery({ delay, status, query: "monthly" })}`)
        );
        const summaryResult = await wrap(() =>
          fetchJson(`/api/analytics/summary?${toQuery({ delay: delay + 180, status, reportId: queryResult.id })}`)
        );
        const exportResult = await wrap(() =>
          fetchJson(`/api/analytics/export?${toQuery({ delay: delay + 260, status, reportId: queryResult.id })}`)
        );

        return { queryResult, summaryResult, exportResult };
      };

      const [withRun, withoutRun] = await Promise.all([runChain("with"), runChain("without")]);

      setNodeText(withQuery, `Query: ${withRun.queryResult.message ?? "done"}`);
      setNodeText(withoutQuery, `Query: ${withoutRun.queryResult.message ?? "done"}`);
      setNodeText(withSummary, `Summary: ${withRun.summaryResult.summary ?? "ready"}`);
      setNodeText(withoutSummary, `Summary: ${withoutRun.summaryResult.summary ?? "ready"}`);
      setNodeText(withExport, `Export: ${withRun.exportResult.url ?? "prepared"}`);
      setNodeText(withoutExport, `Export: ${withoutRun.exportResult.url ?? "prepared"}`);
      setStatus(`Analytics ${mode} complete`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Analytics ${mode} failed (${message})`);
      setNodeText(withExport, `Export: failed (${message})`);
      setNodeText(withoutExport, `Export: failed (${message})`);
    }
  };

  ctx.createEnhancer({
    skeletonSelector: "#analytics-with-surface"
  });

  addListener(mountNode.querySelector('[data-action="run"]'), "click", () => void runAnalytics("normal"));
  addListener(mountNode.querySelector('[data-action="slow"]'), "click", () => void runAnalytics("slow"));
  addListener(mountNode.querySelector('[data-action="error"]'), "click", () => void runAnalytics("error"));

  setStatus("Analytics compare ready");

  return () => {
    listeners.forEach((cleanup = () => {}) => cleanup());
    listeners.length = 0;
    ctx.disposeEnhancer();
  };
};
