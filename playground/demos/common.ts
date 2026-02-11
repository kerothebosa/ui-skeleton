// @ts-nocheck
// Shared demo helpers for playground-only pages.

export const setNodeText = (node = null, text = "") => {
  if (!node) {
    return;
  }

  node.textContent = text;
};

export const clearChildren = (node = null) => {
  if (!node) {
    return;
  }

  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

export const appendLogEntry = (listNode = null, message = "", maxEntries = 80) => {
  if (!listNode) {
    return;
  }

  const entry = document.createElement("li");
  entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  listNode.prepend(entry);

  while (listNode.children.length > maxEntries) {
    const last = listNode.lastElementChild;
    if (!last) {
      break;
    }
    listNode.removeChild(last);
  }
};

export const toQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach((entry = []) => {
    const key = entry[0];
    const value = entry[1];
    if (value === undefined || value === null || value === "") {
      return;
    }
    query.set(key, String(value));
  });
  return query.toString();
};

export const fetchJson = async (url = "", options = undefined) => {
  const response = await fetch(url, options);
  const rawText = await response.text();

  if (!response.ok) {
    const reason = rawText.trim().length > 0 ? rawText : "request failed";
    throw new Error(`HTTP ${response.status}: ${reason}`);
  }

  if (rawText.trim().length === 0) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
};

const setNoPackageState = (surface = null, state = "idle") => {
  if (!surface) {
    return;
  }
  surface.setAttribute("data-no-package-state", state);
};

export const withNoPackageLoad = async (surface = null, task = null) => {
  setNoPackageState(surface, "loading");

  try {
    const result = await (typeof task === "function" ? task() : task);
    setNoPackageState(surface, "flash");
    setTimeout(() => {
      setNoPackageState(surface, "idle");
    }, 260);
    return result;
  } catch (error) {
    setNoPackageState(surface, "error");
    throw error;
  }
};

export const renderComparePanels = (mountNode = null, config = {}) => {
  if (!mountNode) {
    return null;
  }

  const headline = config.headline ?? "";
  const code = config.code ?? "DEMO";
  const controlHtml = config.controlsHtml ?? "";
  const withTitle = config.withTitle ?? "With package";
  const withoutTitle = config.withoutTitle ?? "Without package";
  const withSurfaceId = config.withSurfaceId ?? "with-surface";
  const withoutSurfaceId = config.withoutSurfaceId ?? "without-surface";
  const withBodyHtml = config.withBodyHtml ?? "";
  const withoutBodyHtml = config.withoutBodyHtml ?? withBodyHtml;

  mountNode.innerHTML = `
    <section class="demo-section">
      <p class="demo-lead">${headline}</p>
      <div class="scenario-code">Scenario code: ${code}</div>
      ${controlHtml}
      <div class="compare-grid">
        <section class="compare-card compare-card-with">
          <h3>${withTitle}</h3>
          <p class="compare-note">Skeleton enhancer active</p>
          <section id="${withSurfaceId}" class="scenario-surface" data-skeleton-visible="false">
            ${withBodyHtml}
          </section>
        </section>
        <section class="compare-card compare-card-without">
          <h3>${withoutTitle}</h3>
          <p class="compare-note">No skeleton enhancer</p>
          <section id="${withoutSurfaceId}" class="scenario-surface scenario-surface-control">
            ${withoutBodyHtml}
          </section>
        </section>
      </div>
    </section>
  `;

  return {
    withSurface: mountNode.querySelector(`#${withSurfaceId}`),
    withoutSurface: mountNode.querySelector(`#${withoutSurfaceId}`)
  };
};
