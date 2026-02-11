import { SkeletonEnhancer } from "../../src/core/enhancer";

describe("SkeletonEnhancer", () => {
  test("transitions lifecycle across start, stop, and destroy", () => {
    document.body.innerHTML = `<main id="app"></main>`;

    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      showDelayMs: 0,
      minVisibleMs: 0
    });
    expect(enhancer.getState()).toBe("idle");
    expect(enhancer.isRunning()).toBe(false);

    enhancer.start();
    expect(enhancer.getState()).toBe("running");
    expect(enhancer.isRunning()).toBe(true);

    enhancer.stop();
    expect(enhancer.getState()).toBe("stopped");
    expect(enhancer.isRunning()).toBe(false);

    enhancer.destroy();
    expect(enhancer.getState()).toBe("destroyed");
    expect(enhancer.isRunning()).toBe(false);
  });

  test("forwards emitted events to user subscribers", async () => {
    document.body.innerHTML = `<main id="app"></main>`;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200
    }) as unknown as typeof global.fetch;

    const onRequestStart = jest.fn();
    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      showDelayMs: 0,
      minVisibleMs: 0
    });

    enhancer.on("request:start", onRequestStart);
    enhancer.start();

    await fetch("/api/ping");

    expect(onRequestStart).toHaveBeenCalledTimes(1);
    expect(onRequestStart).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "fetch",
        method: "GET"
      })
    );
    enhancer.destroy();
    global.fetch = originalFetch;
  });

  test("filters requests with shouldHandleRequest", async () => {
    document.body.innerHTML = `<main id="app"></main>`;
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200
    }) as unknown as typeof global.fetch;

    const onRequestStart = jest.fn();
    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      shouldHandleRequest: ({ url }) => !url.includes("/ignore"),
      showDelayMs: 0,
      minVisibleMs: 0
    });

    enhancer.on("request:start", onRequestStart);
    enhancer.start();

    await fetch("/api/ignore");
    await fetch("/api/handle");

    expect(onRequestStart).toHaveBeenCalledTimes(1);
    expect(onRequestStart).toHaveBeenCalledWith(expect.objectContaining({ url: "/api/handle" }));

    enhancer.destroy();
    global.fetch = originalFetch;
  });

  test("supports additive skeletonVisuals config without breaking existing options", async () => {
    jest.useFakeTimers();
    document.body.innerHTML = `<main id="app"><p>content block</p></main>`;

    const app = document.querySelector("#app") as HTMLElement;
    const paragraph = app.querySelector("p") as HTMLElement;

    app.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 320, bottom: 180, width: 320, height: 180 } as DOMRect);
    paragraph.getBoundingClientRect = () =>
      ({ left: 20, top: 24, right: 280, bottom: 64, width: 260, height: 40 } as DOMRect);

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ ok: true, status: 200 });
          }, 40);
        })
    ) as unknown as typeof global.fetch;

    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      showDelayMs: 0,
      minVisibleMs: 0,
      skeletonVisuals: {
        mode: "adaptive",
        animation: "none",
        theme: "cool"
      }
    });

    enhancer.start();

    const req = fetch("/api/visuals");
    jest.advanceTimersByTime(5);

    const node = app.querySelector('[data-skeleton-node="sknet-skeleton-node"]');
    expect(node).not.toBeNull();
    expect(node?.getAttribute("data-skeleton-mode")).toBe("adaptive");
    expect(node?.querySelector('[data-skeleton-placeholder="block"]')).not.toBeNull();

    const styleTag = document.head.querySelector('[data-sknet-style^="sknet-visual-"]');
    expect(styleTag?.textContent).toContain("animation: none");

    jest.advanceTimersByTime(50);
    await req;

    enhancer.destroy();
    global.fetch = originalFetch;
    jest.useRealTimers();
  });
});
