// @ts-nocheck
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const projectRoot = resolve(__dirname, "..");
const playgroundRoot = resolve(projectRoot, "playground");
const port = Number(process.env.PORT ?? "4174");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".ts", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

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

const wait = async (ms = 0) => {
  await new Promise((resolveWait) => setTimeout(resolveWait, ms));
};

const sendText = (res: ServerResponse, statusCode = 200, body = "") => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(body);
};

const sendJson = (res: ServerResponse, statusCode = 200, payload = {}) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const sendNoContent = (res: ServerResponse, statusCode = 204) => {
  res.statusCode = statusCode;
  res.end();
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

const isInsideRoot = (candidatePath: string) => {
  const rel = relative(projectRoot, candidatePath);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
};

const resolveStaticPath = (pathname = "") => {
  if (pathname === "/" || pathname === "/index.html" || pathname === "/playground") {
    return join(playgroundRoot, "index.html");
  }

  if (pathname === "/main.ts" || pathname === "/style.css") {
    return join(playgroundRoot, pathname.slice(1));
  }

  if (pathname.startsWith("/demos/")) {
    return join(playgroundRoot, pathname.slice(1));
  }

  if (pathname.startsWith("/config/")) {
    return join(playgroundRoot, pathname.slice(1));
  }

  if (pathname.startsWith("/playground/") || pathname.startsWith("/dist/")) {
    return resolve(projectRoot, `.${pathname}`);
  }

  return null;
};

const sendFile = async (res: ServerResponse, absolutePath = "") => {
  try {
    const fileStat = await stat(absolutePath);
    const filePath = fileStat.isDirectory() ? join(absolutePath, "index.html") : absolutePath;
    const content = await readFile(filePath);
    res.statusCode = 200;
    res.setHeader("Content-Type", mimeTypes.get(extname(filePath)) ?? "application/octet-stream");
    res.end(content);
  } catch {
    sendText(res, 404, "Not found");
  }
};

const readJsonBody = async (req: IncomingMessage) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const maybeTimeout = (requestUrl: URL) => {
  if (shouldTimeout(requestUrl)) {
    return true;
  }
  return false;
};

const sendDataResponse = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  const delay = normalizeDelay(requestUrl, 700);
  const status = normalizeStatus(requestUrl, 200);
  await wait(delay);

  if (status >= 400) {
    sendJson(res, status, { message: "data endpoint forced error", delay });
    return;
  }

  sendJson(res, status, {
    message: `Loaded data after ${delay}ms`,
    delay,
    timestamp: new Date().toISOString()
  });
};

const sendDashboardResponse = async (requestUrl: URL, res: ServerResponse, segment = "") => {
  if (maybeTimeout(requestUrl)) {
    return;
  }

  const delay = normalizeDelay(requestUrl, 600);
  const status = normalizeStatus(requestUrl, 200);
  await wait(delay);

  if (status >= 400) {
    sendJson(res, status, { message: `${segment} failed`, segment, delay });
    return;
  }

  const payloadBySegment = {
    kpi: { headline: "Revenue +12.8% vs last month", value: 128_400 },
    activity: { summary: "24 new signups, 8 upgrades, 3 churn events" },
    chart: { summary: "Peak traffic between 10:00 and 14:00 UTC" },
    alerts: { summary: "2 critical alerts, 5 warnings, 11 info events" }
  };

  sendJson(res, 200, {
    segment,
    delay,
    ...(payloadBySegment[segment] ?? { summary: "No segment payload" })
  });
};

const sendCountries = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 220));
  sendJson(res, 200, { countries });
};

const sendCities = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 400));
  const country = requestUrl.searchParams.get("country") ?? "";
  sendJson(res, 200, { country, cities: citiesByCountry[country] ?? [] });
};

const sendEmailValidation = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 200));
  const email = String(requestUrl.searchParams.get("email") ?? "").toLowerCase();
  const available = !email.includes("taken") && !email.includes("used") && !email.includes("busy");
  sendJson(res, 200, {
    email,
    available,
    message: available ? "Email is available" : "Email is already in use"
  });
};

const sendFormSubmit = async (req: IncomingMessage, requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 420));

  const forcedStatus = normalizeStatus(requestUrl, 200);
  const body = await readJsonBody(req);
  const fields = {
    name: String(body.name ?? "").trim(),
    email: String(body.email ?? "").trim(),
    country: String(body.country ?? "").trim(),
    city: String(body.city ?? "").trim(),
    postalCode: String(body.postalCode ?? "").trim()
  };

  if (forcedStatus >= 400) {
    sendJson(res, forcedStatus, {
      message: "Forced form submit error",
      fields
    });
    return;
  }

  const missing = Object.entries(fields)
    .filter((entry = []) => {
      const value = entry[1];
      return !value;
    })
    .map((entry = []) => entry[0]);

  if (missing.length > 0) {
    sendJson(res, 422, { message: `Missing required fields: ${missing.join(", ")}` });
    return;
  }

  if (fields.email.toLowerCase().includes("taken")) {
    sendJson(res, 409, { message: "Email already exists" });
    return;
  }

  sendJson(res, 200, {
    message: "Form submitted successfully",
    reference: `SUB-${Date.now()}`,
    fields
  });
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

const sendTableItems = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 380));

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

  sendJson(res, 200, {
    page: safePage,
    pageSize,
    total,
    totalPages,
    items: pageItems
  });
};

const sendRowDetail = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 260));

  const id = Number(requestUrl.searchParams.get("id") ?? "0");
  const row = tableItems.find((item) => item.id === id);
  if (!row) {
    sendJson(res, 404, { message: `Row ${id} not found` });
    return;
  }

  sendJson(res, 200, {
    id: row.id,
    history: [
      `Order created for ${row.customer}`,
      `Region review in ${row.region}`,
      `Status moved to ${row.status}`
    ],
    amount: row.amount
  });
};

const sendTelemetry = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 320));
  const status = normalizeStatus(requestUrl, 204);
  if (status === 204) {
    sendNoContent(res, status);
    return;
  }
  sendJson(res, status, { message: "telemetry received", at: new Date().toISOString() });
};

const sendSearchSuggest = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 160));
  const q = String(requestUrl.searchParams.get("q") ?? "").toLowerCase().trim();
  const pool = ["north", "south", "east", "west", "active", "review", "hold", "customer"];
  const items = pool.filter((item) => item.includes(q)).slice(0, 6);
  sendJson(res, 200, { q, items });
};

const sendSearchResults = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 360));
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    sendJson(res, status, { message: "Search backend unavailable" });
    return;
  }

  const q = String(requestUrl.searchParams.get("q") ?? "").toLowerCase().trim();
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
  sendJson(res, 200, {
    q,
    page,
    total: filtered.length,
    items
  });
};

const sendWorkflowStep = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 280));
  const step = Number(requestUrl.searchParams.get("step") ?? "1");
  const labels = {
    1: "Cart validated",
    2: "Address verified",
    3: "Payment tokenized",
    4: "Review assembled"
  };
  sendJson(res, 200, {
    step,
    label: labels[step] ?? `Step ${step} complete`
  });
};

const sendWorkflowFinalize = async (req: IncomingMessage, requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 360));
  const status = normalizeStatus(requestUrl, 200);
  const body = await readJsonBody(req);
  if (status >= 400) {
    sendJson(res, status, {
      message: "Workflow finalize failed",
      input: body
    });
    return;
  }

  sendJson(res, 200, {
    summary: "Review confirmed",
    message: `Workflow completed (${String(body.code ?? "unknown")})`
  });
};

const sendFeedList = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 320));
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    sendJson(res, status, { message: "Feed service unavailable" });
    return;
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

  sendJson(res, 200, { items });
};

const sendFeedAck = async (req: IncomingMessage, requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 200));
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    sendJson(res, status, { message: "Ack failed" });
    return;
  }

  const id = Number(requestUrl.searchParams.get("id") ?? "0");
  const body = await readJsonBody(req);
  sendJson(res, 200, {
    id,
    message: `Ack accepted for item ${id}`,
    code: String(body.code ?? "unknown")
  });
};

const sendAnalyticsQuery = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 420));
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    sendJson(res, status, { message: "Query service unavailable" });
    return;
  }

  const query = requestUrl.searchParams.get("query") ?? "default";
  const id = `RPT-${Date.now()}`;
  sendJson(res, 200, {
    id,
    query,
    message: `Query accepted (${query})`
  });
};

const sendAnalyticsSummary = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 520));
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    sendJson(res, status, { message: "Summary failed" });
    return;
  }

  const reportId = requestUrl.searchParams.get("reportId") ?? "unknown";
  sendJson(res, 200, {
    reportId,
    summary: "Top region: North | Growth: +11.2% | Churn: 1.9%"
  });
};

const sendAnalyticsExport = async (requestUrl: URL, res: ServerResponse) => {
  if (maybeTimeout(requestUrl)) {
    return;
  }
  await wait(normalizeDelay(requestUrl, 620));
  const status = normalizeStatus(requestUrl, 200);
  if (status >= 400) {
    sendJson(res, status, { message: "Export failed" });
    return;
  }

  const reportId = requestUrl.searchParams.get("reportId") ?? "unknown";
  sendJson(res, 200, {
    reportId,
    url: `/exports/${reportId}.csv`,
    message: "Export prepared"
  });
};

const handleApiRoute = async (req: IncomingMessage, requestUrl: URL, res: ServerResponse) => {
  const { pathname } = requestUrl;

  if (pathname === "/api/data") {
    await sendDataResponse(requestUrl, res);
    return true;
  }

  if (pathname === "/api/dashboard/kpi") {
    await sendDashboardResponse(requestUrl, res, "kpi");
    return true;
  }
  if (pathname === "/api/dashboard/activity") {
    await sendDashboardResponse(requestUrl, res, "activity");
    return true;
  }
  if (pathname === "/api/dashboard/chart") {
    await sendDashboardResponse(requestUrl, res, "chart");
    return true;
  }
  if (pathname === "/api/dashboard/alerts") {
    await sendDashboardResponse(requestUrl, res, "alerts");
    return true;
  }

  if (pathname === "/api/forms/countries") {
    await sendCountries(requestUrl, res);
    return true;
  }
  if (pathname === "/api/forms/cities") {
    await sendCities(requestUrl, res);
    return true;
  }
  if (pathname === "/api/forms/validate-email") {
    await sendEmailValidation(requestUrl, res);
    return true;
  }
  if (pathname === "/api/forms/submit") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Method not allowed" });
      return true;
    }
    await sendFormSubmit(req, requestUrl, res);
    return true;
  }

  if (pathname === "/api/table/items") {
    await sendTableItems(requestUrl, res);
    return true;
  }
  if (pathname === "/api/table/row-detail") {
    await sendRowDetail(requestUrl, res);
    return true;
  }

  if (pathname === "/api/telemetry") {
    await sendTelemetry(requestUrl, res);
    return true;
  }

  if (pathname === "/api/search/suggest") {
    await sendSearchSuggest(requestUrl, res);
    return true;
  }
  if (pathname === "/api/search/results") {
    await sendSearchResults(requestUrl, res);
    return true;
  }

  if (pathname === "/api/workflow/step") {
    await sendWorkflowStep(requestUrl, res);
    return true;
  }
  if (pathname === "/api/workflow/finalize") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Method not allowed" });
      return true;
    }
    await sendWorkflowFinalize(req, requestUrl, res);
    return true;
  }

  if (pathname === "/api/feed/list") {
    await sendFeedList(requestUrl, res);
    return true;
  }
  if (pathname === "/api/feed/ack") {
    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Method not allowed" });
      return true;
    }
    await sendFeedAck(req, requestUrl, res);
    return true;
  }

  if (pathname === "/api/analytics/query") {
    await sendAnalyticsQuery(requestUrl, res);
    return true;
  }
  if (pathname === "/api/analytics/summary") {
    await sendAnalyticsSummary(requestUrl, res);
    return true;
  }
  if (pathname === "/api/analytics/export") {
    await sendAnalyticsExport(requestUrl, res);
    return true;
  }

  return false;
};

const handler = async (req: IncomingMessage, res: ServerResponse) => {
  const requestUrl = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);

  if (requestUrl.pathname === "/health") {
    sendText(res, 200, "ok");
    return;
  }

  const handledApiRoute = await handleApiRoute(req, requestUrl, res);
  if (handledApiRoute) {
    return;
  }

  const staticPath = resolveStaticPath(requestUrl.pathname);
  if (!staticPath) {
    sendText(res, 404, "Not found");
    return;
  }

  if (!isInsideRoot(staticPath)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  await sendFile(res, staticPath);
};

// Demo/test-only local server; not part of published library runtime.
createServer((req, res) => {
  void handler(req, res).catch((error: unknown) => {
    console.error("Unhandled playground server error:", error);
    if (!res.headersSent) {
      sendText(res, 500, "Internal server error");
    } else {
      res.end();
    }
  });
})
  .listen(port, "127.0.0.1", () => {
    console.log(`Playground server running at http://127.0.0.1:${port}`);
  })
  .on("error", (error) => {
    console.error("Playground server failed:", error);
    process.exit(1);
  });
