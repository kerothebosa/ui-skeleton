// @ts-nocheck
import { SkeletonEnhancer } from "../dist/index.js";
import "../dist/styles.css";
import { appendLogEntry, clearChildren, setNodeText } from "./demos/common.ts";
import { mountAnalyticsDemo } from "./demos/analytics.ts";
import { mountDashboardDemo } from "./demos/dashboard.ts";
import { mountFeedDemo } from "./demos/feed.ts";
import { mountFormsDemo } from "./demos/forms.ts";
import { mountOverviewDemo } from "./demos/overview.ts";
import { mountSearchDemo } from "./demos/search.ts";
import { mountTableDemo } from "./demos/table.ts";
import { mountWorkflowDemo } from "./demos/workflow.ts";
import { installPlaygroundMockApi, normalizeConfigUrl } from "./lib/mock-api.ts";

const DEFAULT_ROUTE = "overview";
const CONFIG_STORAGE_KEY = "@skeleton-ui/net/playground-config:v1";
const CONFIG_PAYLOAD_VERSION = 1;
const VALID_INTERCEPTORS = new Set(["fetch", "xhr"]);
const VALID_TIMEOUT_MODES = new Set(["abort", "synthetic"]);
const VALID_VISUAL_MODES = new Set(["overlay", "adaptive", "hybrid"]);
const VALID_ANIMATIONS = new Set(["shimmer", "wave", "pulse", "breathe", "none"]);
const VALID_THEMES = new Set(["classic", "cool", "warm", "contrast"]);

const mountNode = document.querySelector("#demo-mount");
const demoTitleNode = document.querySelector("#demo-title");
const eventLogNode = document.querySelector("#event-log");
const routeLabelNode = document.querySelector("#global-route-label");
const globalStatusNode = document.querySelector("#global-status-text");
const indicatorNode = document.querySelector("#global-skeleton-indicator");
const navLinks = Array.from(document.querySelectorAll("[data-route-link]"));

installPlaygroundMockApi();

let activeEnhancer = null;
let currentCleanup = () => {};
let activeObserver = null;
// Demo-only shared config so every route can mimic real app-level config wiring.
let playgroundConfig = null;

const routes = {
  overview: { title: "Overview", mount: mountOverviewDemo },
  dashboard: { title: "Dashboard", mount: mountDashboardDemo },
  forms: { title: "Forms", mount: mountFormsDemo },
  table: { title: "Data Table", mount: mountTableDemo },
  search: { title: "Search Lab", mount: mountSearchDemo },
  workflow: { title: "Workflow Lab", mount: mountWorkflowDemo },
  feed: { title: "Feed Lab", mount: mountFeedDemo },
  analytics: { title: "Analytics Lab", mount: mountAnalyticsDemo }
};

const DEFAULT_PLAYGROUND_CONFIG = Object.freeze({
  showDelayMs: 120,
  minVisibleMs: 180,
  requestTimeoutMs: 10_000,
  timeoutMode: "abort",
  enabledInterceptors: ["fetch", "xhr"],
  skeletonVisuals: {
    mode: "hybrid",
    animation: "shimmer",
    theme: "classic",
    adaptive: {
      maxDepth: 4,
      maxPlaceholders: 180,
      minBlockHeightPx: 12,
      lineGapPx: 6,
      ignoreSelectors: []
    }
  }
});

const deepClone = (value = null) => {
  if (value === null || value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
};

const clampNumber = (value, fallback, min, max) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(numeric)));
};

const sanitizeInterceptors = (input = null, fallback = []) => {
  if (!Array.isArray(input)) {
    return [...fallback];
  }
  const next = Array.from(
    new Set(
      input
        .map((item = "") => String(item).trim().toLowerCase())
        .filter((item = "") => VALID_INTERCEPTORS.has(item))
    )
  );
  return next;
};

const sanitizeTheme = (theme = undefined, fallback = "classic") => {
  if (typeof theme === "string" && VALID_THEMES.has(theme)) {
    return theme;
  }

  if (theme && typeof theme === "object") {
    const baseColor = typeof theme.baseColor === "string" ? theme.baseColor.trim() : "";
    const highlightColor =
      typeof theme.highlightColor === "string" ? theme.highlightColor.trim() : "";

    if (!baseColor || !highlightColor) {
      return fallback;
    }

    return {
      baseColor,
      highlightColor,
      durationMs: clampNumber(theme.durationMs, 1200, 200, 12_000),
      easing: typeof theme.easing === "string" ? theme.easing : "ease-in-out"
    };
  }

  return fallback;
};

const sanitizeAdaptive = (input = {}, fallback = {}) => {
  const source = input && typeof input === "object" ? input : {};
  return {
    maxDepth: clampNumber(source.maxDepth, fallback.maxDepth ?? 4, 1, 10),
    maxPlaceholders: clampNumber(source.maxPlaceholders, fallback.maxPlaceholders ?? 180, 10, 600),
    minBlockHeightPx: clampNumber(source.minBlockHeightPx, fallback.minBlockHeightPx ?? 12, 6, 64),
    lineGapPx: clampNumber(source.lineGapPx, fallback.lineGapPx ?? 6, 2, 24),
    ignoreSelectors: Array.isArray(source.ignoreSelectors)
      ? source.ignoreSelectors
          .filter((item = "") => typeof item === "string")
          .map((item = "") => item.trim())
          .filter(Boolean)
          .slice(0, 24)
      : [...(fallback.ignoreSelectors ?? [])]
  };
};

const mergeConfig = (base = {}, patch = {}) => {
  const patchVisuals = patch.skeletonVisuals ?? {};
  const patchAdaptive = patchVisuals.adaptive ?? {};

  return {
    ...base,
    ...patch,
    enabledInterceptors:
      patch.enabledInterceptors !== undefined ? patch.enabledInterceptors : base.enabledInterceptors,
    skeletonVisuals: {
      ...(base.skeletonVisuals ?? {}),
      ...patchVisuals,
      adaptive: {
        ...(base.skeletonVisuals?.adaptive ?? {}),
        ...patchAdaptive
      }
    }
  };
};

const normalizeConfig = (rawConfig = {}, fallback = DEFAULT_PLAYGROUND_CONFIG) => {
  const merged = mergeConfig(fallback, rawConfig && typeof rawConfig === "object" ? rawConfig : {});
  const visuals = merged.skeletonVisuals ?? {};

  return {
    showDelayMs: clampNumber(merged.showDelayMs, fallback.showDelayMs, 0, 5_000),
    minVisibleMs: clampNumber(merged.minVisibleMs, fallback.minVisibleMs, 0, 12_000),
    requestTimeoutMs: clampNumber(merged.requestTimeoutMs, fallback.requestTimeoutMs, 200, 120_000),
    timeoutMode: VALID_TIMEOUT_MODES.has(merged.timeoutMode)
      ? merged.timeoutMode
      : fallback.timeoutMode,
    enabledInterceptors: sanitizeInterceptors(
      merged.enabledInterceptors,
      fallback.enabledInterceptors ?? []
    ),
    skeletonVisuals: {
      mode: VALID_VISUAL_MODES.has(visuals.mode) ? visuals.mode : fallback.skeletonVisuals.mode,
      animation: VALID_ANIMATIONS.has(visuals.animation)
        ? visuals.animation
        : fallback.skeletonVisuals.animation,
      theme: sanitizeTheme(visuals.theme, fallback.skeletonVisuals.theme),
      adaptive: sanitizeAdaptive(visuals.adaptive, fallback.skeletonVisuals.adaptive)
    }
  };
};

const readStoredConfig = () => {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const payload = parsed?.playgroundConfig ?? parsed;
    return normalizeConfig(payload);
  } catch {
    return null;
  }
};

const persistConfig = (nextConfig = {}) => {
  try {
    const payload = {
      schema: "@skeleton-ui/net/playground-config",
      version: CONFIG_PAYLOAD_VERSION,
      updatedAt: new Date().toISOString(),
      playgroundConfig: nextConfig
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage can fail in restricted environments; ignore for demo.
  }
};

const extractConfigPayload = (payload = {}) => {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  if (payload.playgroundConfig && typeof payload.playgroundConfig === "object") {
    return payload.playgroundConfig;
  }
  if (payload.skeletonEnhancerOptions && typeof payload.skeletonEnhancerOptions === "object") {
    return payload.skeletonEnhancerOptions;
  }
  if (payload.enhancer && typeof payload.enhancer === "object") {
    return payload.enhancer;
  }
  return payload;
};

const getPlaygroundConfig = () => {
  return deepClone(playgroundConfig ?? DEFAULT_PLAYGROUND_CONFIG);
};

const setPlaygroundConfig = (next = {}, options = {}) => {
  const replace = options.replace === true;
  const persist = options.persist !== false;
  const source = options.source ?? "manual";
  const statusMessage = options.statusMessage ?? "";

  const base = replace ? DEFAULT_PLAYGROUND_CONFIG : playgroundConfig ?? DEFAULT_PLAYGROUND_CONFIG;
  const merged = replace ? next : mergeConfig(base, next);
  playgroundConfig = normalizeConfig(merged);

  if (persist) {
    persistConfig(playgroundConfig);
  }

  appendGlobalLog(`config:update source=${source}`);
  if (statusMessage) {
    setGlobalStatus(statusMessage);
  }

  return getPlaygroundConfig();
};

const applyPlaygroundConfigPayload = (payload = {}, options = {}) => {
  const extracted = extractConfigPayload(payload);
  return setPlaygroundConfig(extracted, options);
};

const resetPlaygroundConfig = (options = {}) => {
  return setPlaygroundConfig(DEFAULT_PLAYGROUND_CONFIG, {
    replace: true,
    persist: options.persist !== false,
    source: options.source ?? "reset",
    statusMessage: options.statusMessage ?? "Playground config reset to defaults"
  });
};

const loadPlaygroundConfigFromUrl = async (url = "", options = {}) => {
  if (!url || typeof url !== "string") {
    throw new Error("config URL is required");
  }

  const resolvedUrl = normalizeConfigUrl(url);
  const response = await fetch(resolvedUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading config`);
  }

  const payload = await response.json();
  return applyPlaygroundConfigPayload(payload, {
    replace: options.replace !== false,
    persist: options.persist !== false,
    source: options.source ?? `url:${resolvedUrl}`,
    statusMessage: options.statusMessage ?? `Config loaded from ${resolvedUrl}`
  });
};

const setGlobalStatus = (status = "") => {
  setNodeText(globalStatusNode, `Global status: ${status}`);
};

const setIndicator = (active = false) => {
  if (!indicatorNode) {
    return;
  }
  indicatorNode.setAttribute("data-state", active ? "active" : "idle");
  indicatorNode.textContent = active ? "Skeleton: showing" : "Skeleton: idle";
};

const appendGlobalLog = (message = "") => {
  appendLogEntry(eventLogNode, message, 80);
};

const disconnectObserver = () => {
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
};

const observeSkeletonTarget = (selector = "") => {
  disconnectObserver();
  setIndicator(false);
  if (!selector) {
    return;
  }

  const target = document.querySelector(selector);
  if (!target) {
    appendGlobalLog(`skeleton target not found: ${selector}`);
    return;
  }

  const refreshIndicator = () => {
    setIndicator(target.getAttribute("data-skeleton-visible") === "true");
  };

  refreshIndicator();
  activeObserver = new MutationObserver(() => {
    refreshIndicator();
  });
  activeObserver.observe(target, { attributes: true, attributeFilter: ["data-skeleton-visible"] });
};

const callHook = (hook = null, payload = {}) => {
  if (typeof hook !== "function") {
    return;
  }
  hook(payload);
};

const disposeEnhancer = () => {
  disconnectObserver();
  setIndicator(false);
  if (activeEnhancer) {
    activeEnhancer.destroy();
    activeEnhancer = null;
  }
};

const createEnhancer = (options = {}) => {
  disposeEnhancer();
  const config = getPlaygroundConfig();

  const userHooks = options.hooks ?? {};
  const routeVisuals = options.skeletonVisuals ?? {};
  const mergedVisuals = {
    ...(config.skeletonVisuals ?? {}),
    ...routeVisuals,
    adaptive: {
      ...(config.skeletonVisuals?.adaptive ?? {}),
      ...(routeVisuals.adaptive ?? {})
    }
  };

  const enhancer = new SkeletonEnhancer({
    ...options,
    showDelayMs: config.showDelayMs,
    minVisibleMs: config.minVisibleMs,
    requestTimeoutMs: config.requestTimeoutMs,
    timeoutMode: config.timeoutMode,
    enabledInterceptors: config.enabledInterceptors,
    skeletonVisuals: mergedVisuals,
    hooks: {
      ...userHooks,
      onRequestStart: (event) => {
        appendGlobalLog(`request:start ${event.requestId} ${event.method} ${event.url}`);
        callHook(userHooks.onRequestStart, event);
      },
      onRequestEnd: (event) => {
        appendGlobalLog(`request:end ${event.requestId} ${event.status} ${event.durationMs}ms`);
        callHook(userHooks.onRequestEnd, event);
      },
      onSkeletonShow: (event) => {
        appendGlobalLog(`skeleton:show ${event.requestId}`);
        callHook(userHooks.onSkeletonShow, event);
      },
      onSkeletonHide: (event) => {
        appendGlobalLog(`skeleton:hide ${event.requestId}`);
        callHook(userHooks.onSkeletonHide, event);
      },
      onError: (event) => {
        appendGlobalLog(`error ${event.error.message}`);
        setGlobalStatus(`error (${event.error.message})`);
        callHook(userHooks.onError, event);
      }
    }
  });

  enhancer.start();
  activeEnhancer = enhancer;

  const selector = options.skeletonSelector ?? "body";
  observeSkeletonTarget(selector);
  return enhancer;
};

const setActiveNav = (routeKey = "") => {
  navLinks.forEach((node) => {
    if (!(node instanceof HTMLAnchorElement)) {
      return;
    }
    const key = node.getAttribute("data-route-link");
    node.setAttribute("data-active", key === routeKey ? "true" : "false");
  });
};

const currentRouteKey = () => {
  const raw = location.hash.replace(/^#\/?/, "").trim();
  if (!raw) {
    return DEFAULT_ROUTE;
  }
  const key = raw.split("?")[0];
  return routes[key] ? key : DEFAULT_ROUTE;
};

const mountRoute = () => {
  if (!mountNode) {
    return;
  }

  const routeKey = currentRouteKey();
  const route = routes[routeKey] ?? routes[DEFAULT_ROUTE];

  if (!location.hash || !routes[location.hash.replace(/^#\/?/, "").split("?")[0]]) {
    location.hash = `#/${routeKey}`;
  }

  currentCleanup();
  currentCleanup = () => {};
  disposeEnhancer();
  clearChildren(mountNode);
  clearChildren(eventLogNode);
  setIndicator(false);
  setActiveNav(routeKey);
  setNodeText(routeLabelNode, `Route: ${route.title}`);
  setNodeText(demoTitleNode, route.title);
  setGlobalStatus(`${route.title} ready`);
  appendGlobalLog(`route switched to ${route.title}`);

  const cleanup = route.mount({
    mountNode,
    createEnhancer,
    disposeEnhancer,
    appendGlobalLog,
    setGlobalStatus,
    getPlaygroundConfig,
    setPlaygroundConfig,
    resetPlaygroundConfig,
    applyPlaygroundConfigPayload,
    loadPlaygroundConfigFromUrl
  });

  if (typeof cleanup === "function") {
    currentCleanup = cleanup;
  }
};

const bootstrapPlaygroundConfig = async () => {
  playgroundConfig = normalizeConfig(DEFAULT_PLAYGROUND_CONFIG);
  const stored = readStoredConfig();
  if (stored) {
    playgroundConfig = normalizeConfig(stored);
    appendGlobalLog("config: restored from local storage");
  }

  const urlParams = new URLSearchParams(location.search);
  const configUrl = urlParams.get("config") ?? "";
  if (!configUrl) {
    return;
  }

  try {
    await loadPlaygroundConfigFromUrl(configUrl, {
      replace: true,
      source: "startup-query",
      statusMessage: `Startup config loaded from ${configUrl}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendGlobalLog(`config load failed: ${message}`);
    setGlobalStatus(`Config load failed (${message})`);
  }
};

window.addEventListener("hashchange", () => {
  mountRoute();
});

void bootstrapPlaygroundConfig().then(() => {
  mountRoute();
});
