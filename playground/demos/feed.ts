// @ts-nocheck
import { fetchJson, renderComparePanels, setNodeText, toQuery, withNoPackageLoad } from "./common.ts";

const feedBody = (mode = "") => `
  <h4>${mode}</h4>
  <p data-role="${mode}-status">Status: idle</p>
  <ul class="feed-list" data-role="${mode}-list"></ul>
`;

export const mountFeedDemo = (ctx = {}) => {
  const mountNode = ctx.mountNode;
  if (!mountNode) {
    return () => {};
  }

  const surfaces = renderComparePanels(mountNode, {
    headline: "Live-feed style polling and acknowledgement flow comparison.",
    code: "FEED-CMP-07",
    controlsHtml: `
      <div class="control-grid">
        <button type="button" data-action="load">FEED-LOAD-81</button>
        <button type="button" data-action="poll">FEED-POLL-82</button>
        <button type="button" data-action="ack">FEED-ACK-83</button>
      </div>
    `,
    withSurfaceId: "feed-with-surface",
    withoutSurfaceId: "feed-without-surface",
    withBodyHtml: feedBody("with"),
    withoutBodyHtml: feedBody("without")
  });

  const listeners = [];
  const withStatus = mountNode.querySelector('[data-role="with-status"]');
  const withoutStatus = mountNode.querySelector('[data-role="without-status"]');
  const withList = mountNode.querySelector('[data-role="with-list"]');
  const withoutList = mountNode.querySelector('[data-role="without-list"]');

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

  const renderList = (node = null, items = []) => {
    if (!node) {
      return;
    }
    node.innerHTML = "";
    items.forEach((item = {}) => {
      const li = document.createElement("li");
      li.textContent = `${item.code ?? "EVT"} | ${item.message ?? "event"} | ${item.level ?? "info"}`;
      node.append(li);
    });
  };

  const loadFeed = async () => {
    setStatus("Loading feed");
    try {
      const [withData, withoutData] = await Promise.all([
        fetchJson("/api/feed/list?delay=320"),
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchJson("/api/feed/list?delay=320"))
      ]);
      renderList(withList, withData.items ?? []);
      renderList(withoutList, withoutData.items ?? []);
      setStatus("Feed loaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Feed load failed (${message})`);
    }
  };

  const pollBurst = async () => {
    setStatus("Polling burst in progress");
    try {
      await Promise.all([
        fetchJson("/api/feed/list?delay=220"),
        fetchJson("/api/feed/list?delay=360"),
        fetchJson("/api/feed/list?delay=520"),
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchJson("/api/feed/list?delay=220")),
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchJson("/api/feed/list?delay=360")),
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchJson("/api/feed/list?delay=520"))
      ]);
      await loadFeed();
      setStatus("Polling burst complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Polling burst failed (${message})`);
    }
  };

  const ackTop = async () => {
    setStatus("Acknowledging top feed item");
    try {
      const [withAck, withoutAck] = await Promise.all([
        fetchJson(`/api/feed/ack?${toQuery({ id: 1, delay: 200 })}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "FEED-ACK-W" })
        }),
        withNoPackageLoad(surfaces?.withoutSurface, () =>
          fetchJson(`/api/feed/ack?${toQuery({ id: 1, delay: 200 })}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: "FEED-ACK-N" })
          })
        )
      ]);
      setStatus(`Ack complete (${withAck.message ?? "ok"} / ${withoutAck.message ?? "ok"})`);
      await loadFeed();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Ack failed (${message})`);
    }
  };

  ctx.createEnhancer({
    skeletonSelector: "#feed-with-surface"
  });

  addListener(mountNode.querySelector('[data-action="load"]'), "click", () => void loadFeed());
  addListener(mountNode.querySelector('[data-action="poll"]'), "click", () => void pollBurst());
  addListener(mountNode.querySelector('[data-action="ack"]'), "click", () => void ackTop());

  setStatus("Feed compare ready");
  void loadFeed();

  return () => {
    listeners.forEach((cleanup = () => {}) => cleanup());
    listeners.length = 0;
    ctx.disposeEnhancer();
  };
};
