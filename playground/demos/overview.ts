// @ts-nocheck
import {
  fetchJson,
  renderComparePanels,
  setNodeText,
  toQuery,
  withNoPackageLoad
} from "./common.ts";

const PRESETS = {
  classic_overlay: {
    label: "Classic Overlay",
    mode: "overlay",
    animation: "shimmer",
    theme: "classic",
    showDelayMs: 120,
    minVisibleMs: 180,
    requestTimeoutMs: 10_000,
    timeoutMode: "abort",
    enabledInterceptors: ["fetch", "xhr"]
  },
  adaptive_wave: {
    label: "Adaptive Wave",
    mode: "adaptive",
    animation: "wave",
    theme: "cool",
    showDelayMs: 90,
    minVisibleMs: 160,
    requestTimeoutMs: 10_000,
    timeoutMode: "abort",
    enabledInterceptors: ["fetch", "xhr"]
  },
  adaptive_pulse: {
    label: "Adaptive Pulse",
    mode: "adaptive",
    animation: "pulse",
    theme: "warm",
    showDelayMs: 70,
    minVisibleMs: 150,
    requestTimeoutMs: 10_000,
    timeoutMode: "abort",
    enabledInterceptors: ["fetch", "xhr"]
  },
  hybrid_calm: {
    label: "Hybrid Calm",
    mode: "hybrid",
    animation: "breathe",
    theme: "cool",
    showDelayMs: 130,
    minVisibleMs: 210,
    requestTimeoutMs: 12_000,
    timeoutMode: "abort",
    enabledInterceptors: ["fetch", "xhr"]
  },
  hybrid_contrast: {
    label: "Hybrid Contrast",
    mode: "hybrid",
    animation: "wave",
    theme: "contrast",
    showDelayMs: 100,
    minVisibleMs: 180,
    requestTimeoutMs: 4_000,
    timeoutMode: "synthetic",
    enabledInterceptors: ["fetch", "xhr"]
  }
};

const toNumber = (value = 0, fallback = 0) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.trunc(numeric);
};

const findPresetKey = (config = {}) => {
  return (
    Object.keys(PRESETS).find((presetKey = "") => {
      const preset = PRESETS[presetKey];
      return (
        preset.mode === config?.skeletonVisuals?.mode &&
        preset.animation === config?.skeletonVisuals?.animation &&
        preset.theme === config?.skeletonVisuals?.theme &&
        preset.showDelayMs === config?.showDelayMs &&
        preset.minVisibleMs === config?.minVisibleMs &&
        preset.requestTimeoutMs === config?.requestTimeoutMs &&
        preset.timeoutMode === config?.timeoutMode &&
        preset.enabledInterceptors.join(",") === (config?.enabledInterceptors ?? []).join(",")
      );
    }) ?? "custom"
  );
};

export const mountOverviewDemo = (ctx = {}) => {
  const mountNode = ctx.mountNode;
  if (!mountNode) {
    return () => {};
  }

  const surfaces = renderComparePanels(mountNode, {
    headline: "Baseline request timing and lifecycle checks with side-by-side comparison.",
    code: "OVR-CMP-01",
    controlsHtml: `
      <div class="control-grid control-grid-secondary">
        <label class="inline-field">
          Preset
          <select data-role="preset">
            <option value="classic_overlay">Classic Overlay</option>
            <option value="adaptive_wave">Adaptive Wave</option>
            <option value="adaptive_pulse">Adaptive Pulse</option>
            <option value="hybrid_calm">Hybrid Calm</option>
            <option value="hybrid_contrast">Hybrid Contrast</option>
          </select>
        </label>
        <label class="inline-field">
          Mode
          <select data-role="mode">
            <option value="overlay">overlay</option>
            <option value="adaptive">adaptive</option>
            <option value="hybrid">hybrid</option>
          </select>
        </label>
        <label class="inline-field">
          Animation
          <select data-role="animation">
            <option value="shimmer">shimmer</option>
            <option value="wave">wave</option>
            <option value="pulse">pulse</option>
            <option value="breathe">breathe</option>
            <option value="none">none</option>
          </select>
        </label>
        <label class="inline-field">
          Theme
          <select data-role="theme">
            <option value="classic">classic</option>
            <option value="cool">cool</option>
            <option value="warm">warm</option>
            <option value="contrast">contrast</option>
          </select>
        </label>
        <label class="inline-field">
          Show delay
          <input data-role="show-delay" type="number" min="0" value="120" />
        </label>
        <label class="inline-field">
          Min visible
          <input data-role="min-visible" type="number" min="0" value="180" />
        </label>
        <label class="inline-field">
          Request timeout
          <input data-role="request-timeout" type="number" min="200" value="10000" />
        </label>
        <label class="inline-field">
          Timeout mode
          <select data-role="timeout-mode">
            <option value="abort">abort</option>
            <option value="synthetic">synthetic</option>
          </select>
        </label>
        <label class="inline-field">
          <input type="checkbox" data-role="int-fetch" checked />
          fetch
        </label>
        <label class="inline-field">
          <input type="checkbox" data-role="int-xhr" checked />
          xhr
        </label>
      </div>
      <div class="control-grid control-grid-secondary">
        <label class="inline-field">
          Config URL
          <input data-role="config-url" type="text" value="./config/default.json" />
        </label>
        <button type="button" data-action="load-config-url">Load config URL</button>
        <button type="button" data-action="import-config">Import config JSON</button>
        <button type="button" data-action="export-config">Export config JSON</button>
        <button type="button" data-action="reset-config">Reset global config</button>
        <input data-role="config-file" type="file" accept="application/json,.json" hidden />
      </div>
      <div class="control-grid">
        <button type="button" data-action="fast">OVR-FAST-10</button>
        <button type="button" data-action="medium">OVR-MED-20</button>
        <button type="button" data-action="slow">OVR-SLOW-30</button>
        <button type="button" data-action="concurrent">OVR-CON-40</button>
        <button type="button" data-action="timeout">OVR-TIME-50</button>
        <button type="button" data-action="stop">Stop enhancer</button>
        <button type="button" data-action="destroy">Destroy enhancer</button>
        <button type="button" data-action="restart">Restart enhancer</button>
      </div>
    `,
    withSurfaceId: "overview-with-surface",
    withoutSurfaceId: "overview-without-surface",
    withBodyHtml: `
      <h4>With Package</h4>
      <p data-role="with-status">Status: idle</p>
      <p data-role="with-output">Output: none</p>
    `,
    withoutBodyHtml: `
      <h4>Without Package</h4>
      <p data-role="without-status">Status: idle</p>
      <p data-role="without-output">Output: none</p>
    `
  });

  const withStatus = mountNode.querySelector('[data-role="with-status"]');
  const withOutput = mountNode.querySelector('[data-role="with-output"]');
  const withoutStatus = mountNode.querySelector('[data-role="without-status"]');
  const withoutOutput = mountNode.querySelector('[data-role="without-output"]');
  const presetSelect = mountNode.querySelector('[data-role="preset"]');
  const modeSelect = mountNode.querySelector('[data-role="mode"]');
  const animationSelect = mountNode.querySelector('[data-role="animation"]');
  const themeSelect = mountNode.querySelector('[data-role="theme"]');
  const showDelayInput = mountNode.querySelector('[data-role="show-delay"]');
  const minVisibleInput = mountNode.querySelector('[data-role="min-visible"]');
  const requestTimeoutInput = mountNode.querySelector('[data-role="request-timeout"]');
  const timeoutModeSelect = mountNode.querySelector('[data-role="timeout-mode"]');
  const intFetch = mountNode.querySelector('[data-role="int-fetch"]');
  const intXhr = mountNode.querySelector('[data-role="int-xhr"]');
  const configUrlInput = mountNode.querySelector('[data-role="config-url"]');
  const configFileInput = mountNode.querySelector('[data-role="config-file"]');

  const listeners = [];
  let enhancer = null;

  const addListener = (node = null, eventName = "", handler = () => {}) => {
    if (!node || !eventName) {
      return;
    }
    node.addEventListener(eventName, handler);
    listeners.push(() => {
      node.removeEventListener(eventName, handler);
    });
  };

  const setBothStatus = (message = "") => {
    setNodeText(withStatus, `Status: ${message}`);
    setNodeText(withoutStatus, `Status: ${message}`);
    ctx.setGlobalStatus(message);
  };

  const setBothOutput = (withMessage = "", withoutMessage = "") => {
    setNodeText(withOutput, `Output: ${withMessage}`);
    setNodeText(withoutOutput, `Output: ${withoutMessage}`);
  };

  const syncControlsFromConfig = (config = {}) => {
    const presetKey = findPresetKey(config);
    if (presetSelect) {
      if (!presetSelect.querySelector('option[value="custom"]')) {
        const customOption = document.createElement("option");
        customOption.value = "custom";
        customOption.textContent = "Custom";
        presetSelect.append(customOption);
      }
      presetSelect.value = presetKey;
    }

    if (modeSelect) modeSelect.value = config?.skeletonVisuals?.mode ?? "hybrid";
    if (animationSelect) animationSelect.value = config?.skeletonVisuals?.animation ?? "shimmer";
    if (themeSelect) {
      themeSelect.value =
        typeof config?.skeletonVisuals?.theme === "string"
          ? config.skeletonVisuals.theme
          : "classic";
    }
    if (showDelayInput) showDelayInput.value = String(config?.showDelayMs ?? 120);
    if (minVisibleInput) minVisibleInput.value = String(config?.minVisibleMs ?? 180);
    if (requestTimeoutInput) requestTimeoutInput.value = String(config?.requestTimeoutMs ?? 10_000);
    if (timeoutModeSelect) timeoutModeSelect.value = config?.timeoutMode ?? "abort";
    if (intFetch instanceof HTMLInputElement) {
      intFetch.checked = (config?.enabledInterceptors ?? []).includes("fetch");
    }
    if (intXhr instanceof HTMLInputElement) {
      intXhr.checked = (config?.enabledInterceptors ?? []).includes("xhr");
    }
  };

  const readControls = () => {
    const enabledInterceptors = [];
    if (intFetch instanceof HTMLInputElement && intFetch.checked) {
      enabledInterceptors.push("fetch");
    }
    if (intXhr instanceof HTMLInputElement && intXhr.checked) {
      enabledInterceptors.push("xhr");
    }

    return {
      showDelayMs: toNumber(showDelayInput?.value, 120),
      minVisibleMs: toNumber(minVisibleInput?.value, 180),
      requestTimeoutMs: toNumber(requestTimeoutInput?.value, 10_000),
      timeoutMode: timeoutModeSelect?.value ?? "abort",
      enabledInterceptors,
      skeletonVisuals: {
        mode: modeSelect?.value ?? "hybrid",
        animation: animationSelect?.value ?? "shimmer",
        theme: themeSelect?.value ?? "classic"
      }
    };
  };

  const applyPresetToControls = (presetKey = "classic_overlay") => {
    const preset = PRESETS[presetKey] ?? PRESETS.classic_overlay;
    if (modeSelect) modeSelect.value = preset.mode;
    if (animationSelect) animationSelect.value = preset.animation;
    if (themeSelect) themeSelect.value = preset.theme;
    if (showDelayInput) showDelayInput.value = String(preset.showDelayMs);
    if (minVisibleInput) minVisibleInput.value = String(preset.minVisibleMs);
    if (requestTimeoutInput) requestTimeoutInput.value = String(preset.requestTimeoutMs);
    if (timeoutModeSelect) timeoutModeSelect.value = preset.timeoutMode;
    if (intFetch instanceof HTMLInputElement) {
      intFetch.checked = preset.enabledInterceptors.includes("fetch");
    }
    if (intXhr instanceof HTMLInputElement) {
      intXhr.checked = preset.enabledInterceptors.includes("xhr");
    }
  };

  const applyControlsToGlobalConfig = (reason = "options changed") => {
    const next = ctx.setPlaygroundConfig(readControls(), {
      source: "overview-controls",
      statusMessage: `Config updated (${reason})`
    });
    syncControlsFromConfig(next);
    return next;
  };

  const createOverviewEnhancer = () => {
    enhancer = ctx.createEnhancer({
      skeletonSelector: "#overview-with-surface"
    });

    const config = ctx.getPlaygroundConfig();
    const mode = config?.skeletonVisuals?.mode;
    const animation = config?.skeletonVisuals?.animation;
    const theme =
      typeof config?.skeletonVisuals?.theme === "string"
        ? config.skeletonVisuals.theme
        : "custom";
    const timeoutMode = config?.timeoutMode;

    ctx.appendGlobalLog(
      `overview enhancer config mode=${mode} animation=${animation} theme=${theme} timeoutMode=${timeoutMode}`
    );
  };

  const ensureEnhancer = () => {
    if (!enhancer || (enhancer.getState && enhancer.getState() === "destroyed")) {
      createOverviewEnhancer();
      return;
    }
    if (enhancer.isRunning && !enhancer.isRunning()) {
      enhancer.start();
    }
  };

  const runRestart = (message = "Enhancer restarted") => {
    createOverviewEnhancer();
    setBothStatus(message);
    setBothOutput("with package ready", "without package ready");
  };

  const runPair = async (label = "", delay = 0) => {
    ensureEnhancer();
    setBothStatus(`${label} in progress`);
    setBothOutput(`waiting ${delay}ms`, "blank page while waiting...");

    try {
      const query = toQuery({ delay });
      const withTask = () => fetchJson(`/api/data?${query}`);
      const withoutTask = () => fetchJson(`/api/data?${query}`);
      const [withData, withoutData] = await Promise.all([
        withTask(),
        withNoPackageLoad(surfaces?.withoutSurface, withoutTask)
      ]);
      setBothStatus(`${label} complete`);
      setBothOutput(withData.message ?? "done", withoutData.message ?? "done");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBothStatus(`${label} failed`);
      setBothOutput(message, message);
    }
  };

  const runConcurrent = async () => {
    ensureEnhancer();
    const delays = [200, 640, 1240];
    setBothStatus("Concurrent wave in progress");
    setBothOutput("3x requests", "blank page while waiting...");

    try {
      const withJobs = delays.map((delay = 0) => fetchJson(`/api/data?${toQuery({ delay })}`));
      const withoutJobs = delays.map((delay = 0) =>
        withNoPackageLoad(surfaces?.withoutSurface, () => fetchJson(`/api/data?${toQuery({ delay })}`))
      );
      await Promise.all([...withJobs, ...withoutJobs]);
      setBothStatus("Concurrent wave complete");
      setBothOutput("all with-package requests complete", "all no-package requests complete");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBothStatus("Concurrent wave failed");
      setBothOutput(message, message);
    }
  };

  const runTimeout = () => {
    ensureEnhancer();
    const mode = timeoutModeSelect ? timeoutModeSelect.value : "abort";
    setBothStatus(`Timeout started (${mode})`);
    setBothOutput("with package: waiting", "without package: blank waiting");

    void fetch("/api/data?mode=timeout&delay=12000")
      .then(() => {
        setNodeText(withOutput, "Output: with package request resolved unexpectedly");
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        setNodeText(withOutput, `Output: with package rejected (${message})`);
      });

    void withNoPackageLoad(surfaces?.withoutSurface, () => fetch("/api/data?mode=timeout&delay=12000"))
      .then(() => {
        setNodeText(withoutOutput, "Output: without package request resolved unexpectedly");
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        setNodeText(withoutOutput, `Output: without package rejected (${message})`);
      });
  };

  const runStop = () => {
    if (!enhancer) {
      return;
    }
    enhancer.stop();
    setBothStatus("Enhancer stopped");
    setBothOutput("with package skeleton disabled", "without package unchanged");
  };

  const runDestroy = () => {
    if (!enhancer) {
      return;
    }
    enhancer.destroy();
    setBothStatus("Enhancer destroyed");
    setBothOutput("click restart to recreate enhancer", "without package unchanged");
  };

  const loadConfigFromUrl = async () => {
    const configUrl =
      configUrlInput instanceof HTMLInputElement ? configUrlInput.value.trim() : "";
    if (!configUrl) {
      setBothStatus("Config load failed (missing URL)");
      return;
    }

    try {
      const loaded = await ctx.loadPlaygroundConfigFromUrl(configUrl, {
        replace: true,
        source: "overview-url",
        statusMessage: `Config loaded (${configUrl})`
      });
      syncControlsFromConfig(loaded);
      runRestart("Enhancer restarted from config URL");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBothStatus(`Config load failed (${message})`);
      setBothOutput(`Config URL error: ${message}`, `Config URL error: ${message}`);
    }
  };

  const importConfigFile = async () => {
    if (!(configFileInput instanceof HTMLInputElement)) {
      return;
    }
    const file = configFileInput.files?.[0];
    if (!file) {
      setBothStatus("Config import canceled");
      return;
    }

    try {
      const rawText = await file.text();
      const payload = JSON.parse(rawText);
      const loaded = ctx.applyPlaygroundConfigPayload(payload, {
        replace: true,
        source: `overview-file:${file.name}`,
        statusMessage: `Config imported (${file.name})`
      });
      syncControlsFromConfig(loaded);
      runRestart("Enhancer restarted from config file");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBothStatus(`Config import failed (${message})`);
      setBothOutput(`Config file error: ${message}`, `Config file error: ${message}`);
    } finally {
      configFileInput.value = "";
    }
  };

  const exportCurrentConfig = () => {
    const payload = {
      schema: "@kerothebosa/ui-skeleton-net/playground-config",
      version: 1,
      generatedAt: new Date().toISOString(),
      playgroundConfig: ctx.getPlaygroundConfig()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "skeleton-playground-config.json";
    document.body.append(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setBothStatus("Config exported");
  };

  const resetGlobalConfig = () => {
    const next = ctx.resetPlaygroundConfig({
      source: "overview-reset",
      statusMessage: "Playground config reset"
    });
    syncControlsFromConfig(next);
    runRestart("Enhancer restarted with default config");
  };

  addListener(presetSelect, "change", () => {
    const selected = presetSelect?.value ?? "classic_overlay";
    if (selected === "custom") {
      return;
    }
    applyPresetToControls(selected);
    applyControlsToGlobalConfig(`preset ${selected}`);
    runRestart(`Preset applied (${selected})`);
  });

  [
    modeSelect,
    animationSelect,
    themeSelect,
    showDelayInput,
    minVisibleInput,
    requestTimeoutInput,
    timeoutModeSelect,
    intFetch,
    intXhr
  ].forEach((node) => {
    addListener(node, "change", () => {
      applyControlsToGlobalConfig("overview controls");
      runRestart();
    });
  });

  addListener(mountNode.querySelector('[data-action="fast"]'), "click", () => void runPair("Fast", 40));
  addListener(mountNode.querySelector('[data-action="medium"]'), "click", () =>
    void runPair("Medium", 540)
  );
  addListener(mountNode.querySelector('[data-action="slow"]'), "click", () => void runPair("Slow", 2300));
  addListener(mountNode.querySelector('[data-action="concurrent"]'), "click", () => void runConcurrent());
  addListener(mountNode.querySelector('[data-action="timeout"]'), "click", () => runTimeout());
  addListener(mountNode.querySelector('[data-action="stop"]'), "click", () => runStop());
  addListener(mountNode.querySelector('[data-action="destroy"]'), "click", () => runDestroy());
  addListener(mountNode.querySelector('[data-action="restart"]'), "click", () => runRestart("Enhancer restarted"));

  addListener(mountNode.querySelector('[data-action="load-config-url"]'), "click", () => {
    void loadConfigFromUrl();
  });
  addListener(mountNode.querySelector('[data-action="import-config"]'), "click", () => {
    configFileInput?.click();
  });
  addListener(configFileInput, "change", () => {
    void importConfigFile();
  });
  addListener(mountNode.querySelector('[data-action="export-config"]'), "click", () => {
    exportCurrentConfig();
  });
  addListener(mountNode.querySelector('[data-action="reset-config"]'), "click", () => {
    resetGlobalConfig();
  });

  syncControlsFromConfig(ctx.getPlaygroundConfig?.() ?? {});
  createOverviewEnhancer();
  setBothStatus("Overview compare ready");
  setBothOutput("choose an action", "choose an action");

  return () => {
    listeners.forEach((cleanup = () => {}) => cleanup());
    listeners.length = 0;
    ctx.disposeEnhancer();
  };
};
