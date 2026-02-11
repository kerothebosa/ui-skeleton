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
});
