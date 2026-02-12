// @ts-nocheck

const countries = [
  { code: "US", name: "United States" },
  { code: "DE", name: "Germany" },
  { code: "TR", name: "Turkey" },
  { code: "JP", name: "Japan" }
];

const citiesByCountry = {
  US: ["New York", "Austin", "Seattle", "San Diego"],
  DE: ["Berlin", "Munich", "Hamburg", "Cologne"],
  TR: ["Istanbul", "Ankara", "Izmir", "Bursa"],
  JP: ["Tokyo", "Osaka", "Kyoto", "Fukuoka"]
};

const statuses = ["Active", "Review", "Hold"];
const regions = ["North", "South", "East", "West"];
const tableItems = Array.from({ length: 52 }, (_, index) => {
  const id = index + 1;
  const region = regions[index % regions.length];
  return {
    id,
    customer: `Customer ${String(id).padStart(2, "0")}`,
    region,
    amount: 120 + id * 9,
    status: statuses[index % statuses.length],
    updatedAt: new Date(Date.now() - id * 12 * 60 * 60 * 1000).toISOString()
  };
});

const jsonResponse = (status = 200, payload = {}) => {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
};

const textResponse = (status = 200, text = "") => {
  return new Response(text, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
};

const noContent = (status = 204) => {
  return new Response(null, { status });
};

const createAbortError = () => {
  return new DOMException("The operation was aborted.", "AbortError");
};

const wait = async (ms = 0, signal: AbortSignal | null = null) => {
  if (signal?.aborted) {
    throw createAbortError();
  }

  await new Promise((resolveWait, rejectWait) => {
    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolveWait(null);
    }, ms);

    const onAbort = () => {
      cleanup();
      rejectWait(createAbortError());
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
};

const timeoutPromise = (signal: AbortSignal | null = null) => {
  return new Promise<Response>((_, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }
    if (signal) {
      signal.addEventListener(
        "abort",
        () => {
          reject(createAbortError());
        },
        { once: true }
      );
    }
  });
};

const normalizeDelay = (requestUrl: URL, fallback = 500) => {
  const raw = Number(requestUrl.searchParams.get("delay") ?? fallback);
  if (!Number.isFinite(raw)) {
    return fallback;
  }
  return Math.max(0, Math.min(Math.trunc(raw), 30_000));
};

const normalizeStatus = (requestUrl: URL, fallback = 200) => {
  const raw = Number(requestUrl.searchParams.get("status") ?? fallback);
  if (!Number.isFinite(raw)) {
    return fallback;
  }
  const status = Math.trunc(raw);
  if (status < 100 || status > 599) {
    return fallback;
  }
  return status;
};

const shouldTimeout = (requestUrl: URL) => {
  return requestUrl.searchParams.get("mode") === "timeout";
};

const getApiPathname = (requestUrl: URL) => {
  const marker = "/api/";
  const index = requestUrl.pathname.indexOf(marker);
  if (index < 0) {
    return "";
  }
  return requestUrl.pathname.slice(index);
};

const readJsonBody = async (input: RequestInfo | URL, init: RequestInit | undefined) => {
  const initBody = init?.body;
  if (typeof initBody === "string") {
    try {
      return JSON.parse(initBody);
    } catch {
      return {};
    }
  }

  if (input instanceof Request) {
    try {
      const raw = await input.clone().text();
      if (!raw.trim()) {
        return {};
      }
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  return {};
};

const sortRows = (items = [], sortKey = "id", order = "asc") => {
  const factor = order === "desc" ? -1 : 1;
  const next = [...items];
  next.sort((left, right) => {
    const a = left[sortKey];
    const b = right[sortKey];
    if (typeof a === "number" && typeof b === "number") {
      return (a - b) * factor;
    }
    return String(a).localeCompare(String(b)) * factor;
  });
  return next;
};

const sendDataResponse = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  const delay = normalizeDelay(requestUrl, 700);
  const status = normalizeStatus(requestUrl, 200);
  await wait(delay, signal);

  if (status >= 400) {
    return jsonResponse(status, { message: "data endpoint forced error", delay });
  }

  return jsonResponse(status, {
    message: `Loaded data after ${delay}ms`,
    delay,
    timestamp: new Date().toISOString()
  });
};

const sendDashboardResponse = async (
  requestUrl: URL,
  segment = "",
  signal: AbortSignal | null = null
) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }

  const delay = normalizeDelay(requestUrl, 600);
  const status = normalizeStatus(requestUrl, 200);
  await wait(delay, signal);

  if (status >= 400) {
    return jsonResponse(status, { message: `${segment} failed`, segment, delay });
  }

  const payloadBySegment = {
    kpi: { headline: "Revenue +12.8% vs last month", value: 128_400 },
    activity: { summary: "24 new signups, 8 upgrades, 3 churn events" },
    chart: { summary: "Peak traffic between 10:00 and 14:00 UTC" },
    alerts: { summary: "2 critical alerts, 5 warnings, 11 info events" }
  };

  return jsonResponse(200, {
    segment,
    delay,
    ...(payloadBySegment[segment] ?? { summary: "No segment payload" })
  });
};

const sendCountries = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 220), signal);
  return jsonResponse(200, { countries });
};

const sendCities = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 400), signal);
  const country = requestUrl.searchParams.get("country") ?? "";
  return jsonResponse(200, { country, cities: citiesByCountry[country] ?? [] });
};

const sendEmailValidation = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 200), signal);
  const email = String(requestUrl.searchParams.get("email") ?? "").toLowerCase();
  const available = !email.includes("taken") && !email.includes("used") && !email.includes("busy");
  return jsonResponse(200, {
    email,
    available,
    message: available ? "Email is available" : "Email is already in use"
  });
};

const sendFormSubmit = async (
  requestUrl: URL,
  body = {},
  signal: AbortSignal | null = null
) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }

  await wait(normalizeDelay(requestUrl, 420), signal);
  const forcedStatus = normalizeStatus(requestUrl, 200);

  const fields = {
    name: String(body.name ?? "").trim(),
    email: String(body.email ?? "").trim(),
    country: String(body.country ?? "").trim(),
    city: String(body.city ?? "").trim(),
    postalCode: String(body.postalCode ?? "").trim()
  };

  if (forcedStatus >= 400) {
    return jsonResponse(forcedStatus, {
      message: "Forced form submit error",
      fields
    });
  }

  const missing = Object.entries(fields)
    .filter((entry = []) => !entry[1])
    .map((entry = []) => entry[0]);

  if (missing.length > 0) {
    return jsonResponse(422, { message: `Missing required fields: ${missing.join(", ")}` });
  }

  if (fields.email.toLowerCase().includes("taken")) {
    return jsonResponse(409, { message: "Email already exists" });
  }

  return jsonResponse(200, {
    message: "Form submitted successfully",
    reference: `SUB-${Date.now()}`,
    fields
  });
};

const sendTableItems = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 380), signal);

  const page = Math.max(1, Number(requestUrl.searchParams.get("page") ?? "1"));
  const pageSize = Math.max(1, Math.min(25, Number(requestUrl.searchParams.get("pageSize") ?? "7")));
  const sort = requestUrl.searchParams.get("sort") ?? "id";
  const order = requestUrl.searchParams.get("order") ?? "asc";
  const q = String(requestUrl.searchParams.get("q") ?? "").toLowerCase().trim();

  const filtered = tableItems.filter((item) => {
    if (!q) {
      return true;
    }
    return (
      String(item.customer).toLowerCase().includes(q) ||
      String(item.region).toLowerCase().includes(q) ||
      String(item.status).toLowerCase().includes(q)
    );
  });

  const sorted = sortRows(filtered, sort, order);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const pageItems = sorted.slice(offset, offset + pageSize);

  return jsonResponse(200, {
    page: safePage,
    pageSize,
    total,
    totalPages,
    items: pageItems
  });
};

const sendRowDetail = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 260), signal);

  const id = Number(requestUrl.searchParams.get("id") ?? "0");
  const row = tableItems.find((item) => item.id === id);
  if (!row) {
    return jsonResponse(404, { message: `Row ${id} not found` });
  }

  return jsonResponse(200, {
    id: row.id,
    history: [
      `Order created for ${row.customer}`,
      `Region review in ${row.region}`,
      `Status moved to ${row.status}`
    ],
    amount: row.amount
  });
};

const sendTelemetry = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 320), signal);
  const status = normalizeStatus(requestUrl, 204);
  if (status === 204) {
    return noContent(204);
  }
  return jsonResponse(status, { message: "telemetry received", at: new Date().toISOString() });
};

const sendSearchSuggest = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 160), signal);
  const q = String(requestUrl.searchParams.get("q") ?? "")
    .toLowerCase()
    .trim();
  const pool = ["north", "south", "east", "west", "active", "review", "hold", "customer"];
  const items = pool.filter((item) => item.includes(q)).slice(0, 6);
  return jsonResponse(200, { q, items });
};

const sendSearchResults = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 360), signal);
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    return jsonResponse(status, { message: "Search backend unavailable" });
  }

  const q = String(requestUrl.searchParams.get("q") ?? "")
    .toLowerCase()
    .trim();
  const page = Math.max(1, Number(requestUrl.searchParams.get("page") ?? "1"));
  const pageSize = 6;
  const filtered = tableItems.filter((item) => {
    if (!q) {
      return true;
    }
    return (
      item.customer.toLowerCase().includes(q) ||
      item.region.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q)
    );
  });
  const offset = (page - 1) * pageSize;
  const items = filtered.slice(offset, offset + pageSize).map((item) => ({
    id: item.id,
    label: `${item.customer} | ${item.region} | ${item.status} | $${item.amount}`
  }));
  return jsonResponse(200, {
    q,
    page,
    total: filtered.length,
    items
  });
};

const sendWorkflowStep = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 280), signal);
  const step = Number(requestUrl.searchParams.get("step") ?? "1");
  const labels = {
    1: "Cart validated",
    2: "Address verified",
    3: "Payment tokenized",
    4: "Review assembled"
  };
  return jsonResponse(200, {
    step,
    label: labels[step] ?? `Step ${step} complete`
  });
};

const sendWorkflowFinalize = async (
  requestUrl: URL,
  body = {},
  signal: AbortSignal | null = null
) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 360), signal);
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    return jsonResponse(status, {
      message: "Workflow finalize failed",
      input: body
    });
  }

  return jsonResponse(200, {
    summary: "Review confirmed",
    message: `Workflow completed (${String(body.code ?? "unknown")})`
  });
};

const sendFeedList = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 320), signal);
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    return jsonResponse(status, { message: "Feed service unavailable" });
  }

  const items = Array.from({ length: 6 }, (_, index) => {
    const id = index + 1;
    return {
      id,
      code: `EVT-${String(id).padStart(2, "0")}`,
      level: ["info", "warn", "error"][index % 3],
      message: `Feed event ${id} generated at ${new Date(Date.now() - index * 9_000).toISOString()}`
    };
  });

  return jsonResponse(200, { items });
};

const sendFeedAck = async (requestUrl: URL, body = {}, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 200), signal);
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    return jsonResponse(status, { message: "Ack failed" });
  }

  const id = Number(requestUrl.searchParams.get("id") ?? "0");
  return jsonResponse(200, {
    id,
    message: `Ack accepted for item ${id}`,
    code: String(body.code ?? "unknown")
  });
};

const sendAnalyticsQuery = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 420), signal);
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    return jsonResponse(status, { message: "Query service unavailable" });
  }

  const query = requestUrl.searchParams.get("query") ?? "default";
  const id = `RPT-${Date.now()}`;
  return jsonResponse(200, {
    id,
    query,
    message: `Query accepted (${query})`
  });
};

const sendAnalyticsSummary = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 520), signal);
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    return jsonResponse(status, { message: "Summary failed" });
  }

  const reportId = requestUrl.searchParams.get("reportId") ?? "unknown";
  return jsonResponse(200, {
    reportId,
    summary: "Top region: North | Growth: +11.2% | Churn: 1.9%"
  });
};

const sendAnalyticsExport = async (requestUrl: URL, signal: AbortSignal | null = null) => {
  if (shouldTimeout(requestUrl)) {
    return timeoutPromise(signal);
  }
  await wait(normalizeDelay(requestUrl, 620), signal);
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    return jsonResponse(status, { message: "Export failed" });
  }

  const reportId = requestUrl.searchParams.get("reportId") ?? "unknown";
  return jsonResponse(200, {
    reportId,
    url: `/exports/${reportId}.csv`,
    message: "Export prepared"
  });
};

const methodNotAllowed = () => jsonResponse(405, { message: "Method not allowed" });

const handleApiRequest = async (ctx = {}) => {
  const { apiPath = "", requestUrl, method = "GET", body = {}, signal = null } = ctx;

  if (apiPath === "/api/data") return sendDataResponse(requestUrl, signal);

  if (apiPath === "/api/dashboard/kpi") return sendDashboardResponse(requestUrl, "kpi", signal);
  if (apiPath === "/api/dashboard/activity")
    return sendDashboardResponse(requestUrl, "activity", signal);
  if (apiPath === "/api/dashboard/chart") return sendDashboardResponse(requestUrl, "chart", signal);
  if (apiPath === "/api/dashboard/alerts") return sendDashboardResponse(requestUrl, "alerts", signal);

  if (apiPath === "/api/forms/countries") return sendCountries(requestUrl, signal);
  if (apiPath === "/api/forms/cities") return sendCities(requestUrl, signal);
  if (apiPath === "/api/forms/validate-email") return sendEmailValidation(requestUrl, signal);
  if (apiPath === "/api/forms/submit") {
    if (method !== "POST") return methodNotAllowed();
    return sendFormSubmit(requestUrl, body, signal);
  }

  if (apiPath === "/api/table/items") return sendTableItems(requestUrl, signal);
  if (apiPath === "/api/table/row-detail") return sendRowDetail(requestUrl, signal);

  if (apiPath === "/api/telemetry") return sendTelemetry(requestUrl, signal);

  if (apiPath === "/api/search/suggest") return sendSearchSuggest(requestUrl, signal);
  if (apiPath === "/api/search/results") return sendSearchResults(requestUrl, signal);

  if (apiPath === "/api/workflow/step") return sendWorkflowStep(requestUrl, signal);
  if (apiPath === "/api/workflow/finalize") {
    if (method !== "POST") return methodNotAllowed();
    return sendWorkflowFinalize(requestUrl, body, signal);
  }

  if (apiPath === "/api/feed/list") return sendFeedList(requestUrl, signal);
  if (apiPath === "/api/feed/ack") {
    if (method !== "POST") return methodNotAllowed();
    return sendFeedAck(requestUrl, body, signal);
  }

  if (apiPath === "/api/analytics/query") return sendAnalyticsQuery(requestUrl, signal);
  if (apiPath === "/api/analytics/summary") return sendAnalyticsSummary(requestUrl, signal);
  if (apiPath === "/api/analytics/export") return sendAnalyticsExport(requestUrl, signal);

  return textResponse(404, "Not found");
};

let mockInstalled = false;

export const normalizeConfigUrl = (value = "") => {
  const candidate = String(value).trim();
  if (!candidate) {
    return "";
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  if (candidate.startsWith("/config/")) {
    const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
    const relative = candidate.replace(/^\/+/, "");
    return new URL(relative, baseUrl).toString();
  }

  return candidate;
};

export const installPlaygroundMockApi = () => {
  if (mockInstalled) {
    return;
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlValue = input instanceof Request ? input.url : String(input);
    const requestUrl = new URL(urlValue, window.location.href);
    const apiPath = getApiPathname(requestUrl);

    if (!apiPath) {
      return nativeFetch(input, init);
    }

    const method =
      (init?.method ?? (input instanceof Request ? input.method : "GET") ?? "GET").toUpperCase();
    const body = await readJsonBody(input, init);
    const signal = init?.signal ?? (input instanceof Request ? input.signal : null);

    try {
      return await handleApiRequest({ apiPath, requestUrl, method, body, signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      return jsonResponse(500, {
        message: "Mock API failure",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  mockInstalled = true;
};
