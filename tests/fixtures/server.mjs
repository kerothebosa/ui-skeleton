import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = normalize(resolve(__filename, ".."));
const projectRoot = resolve(__dirname, "..", "..");
const port = Number(process.env.PORT ?? 4173);

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"]
]);

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const sendFile = async (res, absolutePath) => {
  try {
    const fileStat = await stat(absolutePath);
    const path = fileStat.isDirectory() ? join(absolutePath, "index.html") : absolutePath;
    const content = await readFile(path);

    res.statusCode = 200;
    res.setHeader("Content-Type", mimeTypes.get(extname(path)) ?? "application/octet-stream");
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
};

const wait = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));

createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);

  if (requestUrl.pathname === "/health") {
    res.statusCode = 200;
    res.end("ok");
    return;
  }

  if (requestUrl.pathname === "/api/data") {
    const delay = Number(requestUrl.searchParams.get("delay") ?? 700);
    await wait(delay);
    sendJson(res, 200, { message: "Loaded data", delay });
    return;
  }

  if (requestUrl.pathname === "/api/error") {
    const delay = Number(requestUrl.searchParams.get("delay") ?? 500);
    await wait(delay);
    sendJson(res, 500, { message: "Forced error" });
    return;
  }

  if (requestUrl.pathname === "/api/never") {
    // Intentionally keep the response open to exercise timeout behavior.
    return;
  }

  let pathname = requestUrl.pathname;
  if (pathname === "/") {
    pathname = "/basic/";
  }

  if (pathname.startsWith("/basic")) {
    pathname = `/tests/fixtures/basic${pathname.slice("/basic".length)}`;
  }

  if (pathname.startsWith("/delayed-api")) {
    pathname = `/tests/fixtures/delayed-api${pathname.slice("/delayed-api".length)}`;
  }

  if (pathname.endsWith("/")) {
    pathname = `${pathname}index.html`;
  }

  const requestedPath = resolve(projectRoot, `.${pathname}`);

  if (!requestedPath.startsWith(projectRoot)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  await sendFile(res, requestedPath);
})
  .listen(port, "127.0.0.1", () => {
    console.log(`Fixture server running at http://127.0.0.1:${port}`);
  })
  .on("error", (error) => {
    console.error("Fixture server failed:", error);
    process.exit(1);
  });
