// @ts-nocheck
import { fetchJson, renderComparePanels, setNodeText, toQuery, withNoPackageLoad } from "./common.ts";

const searchBody = (mode = "") => `
  <h4>${mode}</h4>
  <p data-role="${mode}-status">Status: idle</p>
  <div class="result-block">
    <h5>Suggestions</h5>
    <ul data-role="${mode}-suggestions"></ul>
  </div>
  <div class="result-block">
    <h5>Results</h5>
    <ul data-role="${mode}-results"></ul>
  </div>
`;

export const mountSearchDemo = (ctx = {}) => {
  const mountNode = ctx.mountNode;
  if (!mountNode) {
    return () => {};
  }

  const surfaces = renderComparePanels(mountNode, {
    headline: "Search-oriented UX with debounce, parallel suggestions/results, and pagination.",
    code: "SRCH-CMP-05",
    controlsHtml: `
      <div class="table-controls">
        <label>
          Query
          <input type="search" data-role="query" placeholder="type: north, customer, active..." />
        </label>
        <button type="button" data-action="run">SRCH-RUN-61</button>
        <button type="button" data-action="next">SRCH-NXT-62</button>
        <button type="button" data-action="error">SRCH-ERR-63</button>
      </div>
      <p data-role="page">Page 1</p>
    `,
    withSurfaceId: "search-with-surface",
    withoutSurfaceId: "search-without-surface",
    withBodyHtml: searchBody("with"),
    withoutBodyHtml: searchBody("without")
  });

  const listeners = [];
  const queryInput = mountNode.querySelector('[data-role="query"]');
  const pageNode = mountNode.querySelector('[data-role="page"]');
  const withStatus = mountNode.querySelector('[data-role="with-status"]');
  const withoutStatus = mountNode.querySelector('[data-role="without-status"]');
  const withSuggestions = mountNode.querySelector('[data-role="with-suggestions"]');
  const withoutSuggestions = mountNode.querySelector('[data-role="without-suggestions"]');
  const withResults = mountNode.querySelector('[data-role="with-results"]');
  const withoutResults = mountNode.querySelector('[data-role="without-results"]');

  let page = 1;
  let debounceTimer = null;

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

  const setPage = () => {
    setNodeText(pageNode, `Page ${page}`);
  };

  const listItems = (node = null, values = []) => {
    if (!node) {
      return;
    }
    node.innerHTML = "";
    values.forEach((value = "") => {
      const li = document.createElement("li");
      li.textContent = String(value);
      node.append(li);
    });
  };

  const currentQuery = () => {
    if (!(queryInput instanceof HTMLInputElement)) {
      return "";
    }
    return queryInput.value.trim();
  };

  const runSearch = async (opts = {}) => {
    const q = currentQuery();
    const status = opts.status ?? "";
    setStatus(`Search in progress (q=${q || "empty"})`);
    try {
      const query = toQuery({ q, page, delay: 380, status });
      const [withPack, withoutPack] = await Promise.all([
        Promise.all([
          fetchJson(`/api/search/suggest?${toQuery({ q, delay: 180 })}`),
          fetchJson(`/api/search/results?${query}`)
        ]),
        Promise.all([
          fetchJson(`/api/search/suggest?${toQuery({ q, delay: 180 })}`),
          withNoPackageLoad(surfaces?.withoutSurface, () => fetchJson(`/api/search/results?${query}`))
        ])
      ]);

      listItems(withSuggestions, withPack[0].items ?? []);
      listItems(withoutSuggestions, withoutPack[0].items ?? []);
      listItems(withResults, (withPack[1].items ?? []).map((item = {}) => item.label ?? "unknown"));
      listItems(withoutResults, (withoutPack[1].items ?? []).map((item = {}) => item.label ?? "unknown"));
      setStatus(`Search complete (${withPack[1].items?.length ?? 0} results)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Search failed (${message})`);
      listItems(withResults, [`Error: ${message}`]);
      listItems(withoutResults, [`Error: ${message}`]);
    }
  };

  const queueSearch = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      page = 1;
      setPage();
      void runSearch();
    }, 320);
  };

  ctx.createEnhancer({
    skeletonSelector: "#search-with-surface"
  });

  addListener(queryInput, "input", () => {
    queueSearch();
  });
  addListener(mountNode.querySelector('[data-action="run"]'), "click", () => {
    page = 1;
    setPage();
    void runSearch();
  });
  addListener(mountNode.querySelector('[data-action="next"]'), "click", () => {
    page += 1;
    setPage();
    void runSearch();
  });
  addListener(mountNode.querySelector('[data-action="error"]'), "click", () => {
    page = 1;
    setPage();
    void runSearch({ status: 503 });
  });

  setStatus("Search compare ready");
  setPage();
  listItems(withSuggestions, ["Try queries: north, active, customer"]);
  listItems(withoutSuggestions, ["Try queries: north, active, customer"]);
  listItems(withResults, ["No query yet"]);
  listItems(withoutResults, ["No query yet"]);

  return () => {
    listeners.forEach((cleanup = () => {}) => cleanup());
    listeners.length = 0;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    ctx.disposeEnhancer();
  };
};
