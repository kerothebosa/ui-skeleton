// @ts-nocheck
import { fetchJson, renderComparePanels, setNodeText, toQuery, withNoPackageLoad } from "./common.ts";

const tableBody = (mode = "") => `
  <h4>${mode}</h4>
  <p data-role="${mode}-status">Status: idle</p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Customer</th>
          <th>Region</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody data-role="${mode}-rows"></tbody>
    </table>
  </div>
`;

export const mountTableDemo = (ctx = {}) => {
  const mountNode = ctx.mountNode;
  if (!mountNode) {
    return () => {};
  }

  const surfaces = renderComparePanels(mountNode, {
    headline: "Table query behavior with synchronized filter, sort, pagination, and bulk row details.",
    code: "TBL-CMP-04",
    controlsHtml: `
      <div class="table-controls">
        <label>
          Search
          <input type="search" data-role="filter" placeholder="Search customer or region..." />
        </label>
        <label>
          Sort
          <select data-role="sort">
            <option value="id">ID</option>
            <option value="customer">Customer</option>
            <option value="region">Region</option>
            <option value="amount">Amount</option>
          </select>
        </label>
        <label>
          Order
          <select data-role="order">
            <option value="asc">ASC</option>
            <option value="desc">DESC</option>
          </select>
        </label>
        <button type="button" data-action="bulk">TBL-BULK-47</button>
        <button type="button" data-action="prev">Prev</button>
        <button type="button" data-action="next">Next</button>
      </div>
      <p data-role="page-label">Page 1 / 1</p>
    `,
    withSurfaceId: "table-with-surface",
    withoutSurfaceId: "table-without-surface",
    withBodyHtml: tableBody("with"),
    withoutBodyHtml: tableBody("without")
  });

  const listeners = [];
  const filterInput = mountNode.querySelector('[data-role="filter"]');
  const sortSelect = mountNode.querySelector('[data-role="sort"]');
  const orderSelect = mountNode.querySelector('[data-role="order"]');
  const pageLabelNode = mountNode.querySelector('[data-role="page-label"]');
  const withStatus = mountNode.querySelector('[data-role="with-status"]');
  const withoutStatus = mountNode.querySelector('[data-role="without-status"]');
  const withRowsNode = mountNode.querySelector('[data-role="with-rows"]');
  const withoutRowsNode = mountNode.querySelector('[data-role="without-rows"]');

  let page = 1;
  let totalPages = 1;
  let rows = [];
  let filterTimer = null;

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

  const renderRows = (node = null, list = []) => {
    if (!node) {
      return;
    }
    node.innerHTML = "";
    list.forEach((item = {}) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.id ?? "-"}</td>
        <td>${item.customer ?? "-"}</td>
        <td>${item.region ?? "-"}</td>
        <td>${item.amount ?? "-"}</td>
        <td>${item.status ?? "-"}</td>
      `;
      node.append(tr);
    });
  };

  const currentFilter = () => {
    if (!(filterInput instanceof HTMLInputElement)) {
      return "";
    }
    return filterInput.value.trim();
  };
  const currentSort = () => {
    return sortSelect instanceof HTMLSelectElement ? sortSelect.value : "id";
  };
  const currentOrder = () => {
    return orderSelect instanceof HTMLSelectElement ? orderSelect.value : "asc";
  };

  const updatePageLabel = () => {
    setNodeText(pageLabelNode, `Page ${page} / ${totalPages}`);
  };

  const loadRows = async () => {
    setStatus("Table load in progress");
    const query = toQuery({
      page,
      pageSize: 7,
      sort: currentSort(),
      order: currentOrder(),
      q: currentFilter(),
      delay: 420
    });
    try {
      const [withData, withoutData] = await Promise.all([
        fetchJson(`/api/table/items?${query}`),
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchJson(`/api/table/items?${query}`))
      ]);
      rows = Array.isArray(withData.items) ? withData.items : [];
      totalPages = Number(withData.totalPages ?? 1) || 1;
      renderRows(withRowsNode, withData.items ?? []);
      renderRows(withoutRowsNode, withoutData.items ?? []);
      updatePageLabel();
      setStatus(`Loaded ${rows.length} rows`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Table load failed (${message})`);
    }
  };

  const bulkRefresh = async () => {
    if (rows.length === 0) {
      setStatus("No rows to refresh");
      return;
    }

    setStatus("Bulk row detail refresh");
    try {
      const withJobs = rows.map((row = {}, index = 0) => {
        return fetchJson(`/api/table/row-detail?${toQuery({ id: row.id, delay: 180 + index * 120 })}`);
      });
      const withoutJobs = rows.map((row = {}, index = 0) => {
        return withNoPackageLoad(surfaces?.withoutSurface, () =>
          fetchJson(`/api/table/row-detail?${toQuery({ id: row.id, delay: 180 + index * 120 })}`)
        );
      });
      await Promise.all([...withJobs, ...withoutJobs]);
      setStatus(`Bulk refresh complete (${rows.length} rows)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Bulk refresh failed (${message})`);
    }
  };

  const queueReload = () => {
    if (filterTimer) {
      clearTimeout(filterTimer);
    }
    filterTimer = setTimeout(() => {
      page = 1;
      void loadRows();
    }, 300);
  };

  ctx.createEnhancer({
    skeletonSelector: "#table-with-surface"
  });

  addListener(filterInput, "input", () => {
    queueReload();
  });
  addListener(sortSelect, "change", () => {
    page = 1;
    void loadRows();
  });
  addListener(orderSelect, "change", () => {
    page = 1;
    void loadRows();
  });
  addListener(mountNode.querySelector('[data-action="prev"]'), "click", () => {
    if (page > 1) {
      page -= 1;
      void loadRows();
    }
  });
  addListener(mountNode.querySelector('[data-action="next"]'), "click", () => {
    if (page < totalPages) {
      page += 1;
      void loadRows();
    }
  });
  addListener(mountNode.querySelector('[data-action="bulk"]'), "click", () => {
    void bulkRefresh();
  });

  setStatus("Table compare ready");
  updatePageLabel();
  void loadRows();

  return () => {
    listeners.forEach((cleanup = () => {}) => cleanup());
    listeners.length = 0;
    if (filterTimer) {
      clearTimeout(filterTimer);
    }
    ctx.disposeEnhancer();
  };
};
