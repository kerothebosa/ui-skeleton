import { SkeletonEnhancer } from "../../src/core/enhancer";

describe("Skeleton timing behavior", () => {
  test("does not show skeleton for fast requests below showDelayMs", async () => {
    jest.useFakeTimers();
    document.body.innerHTML = `<main id="app" data-skeleton-visible="false"></main>`;

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ ok: true, status: 200 });
          }, 20);
        })
    ) as unknown as typeof fetch;

    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      showDelayMs: 100,
      minVisibleMs: 0,
      requestTimeoutMs: 1000
    });

    enhancer.start();
    const request = fetch("/api/fast");
    jest.advanceTimersByTime(30);
    await request;

    const target = document.querySelector("#app");
    expect(target?.querySelector('[data-skeleton-node="sknet-skeleton-node"]')).toBeNull();
    expect(target?.getAttribute("data-skeleton-visible")).toBe("false");

    enhancer.destroy();
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  test("keeps skeleton visible for at least minVisibleMs", async () => {
    jest.useFakeTimers();
    document.body.innerHTML = `<main id="app" data-skeleton-visible="false"></main>`;

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ ok: true, status: 200 });
          }, 10);
        })
    ) as unknown as typeof fetch;

    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      showDelayMs: 0,
      minVisibleMs: 120,
      requestTimeoutMs: 1000
    });

    enhancer.start();
    const request = fetch("/api/min-visible");
    jest.advanceTimersByTime(15);
    await request;

    const target = document.querySelector("#app");
    expect(target?.getAttribute("data-skeleton-visible")).toBe("true");

    jest.advanceTimersByTime(121);
    expect(target?.getAttribute("data-skeleton-visible")).toBe("false");
    expect(target?.querySelector('[data-skeleton-node="sknet-skeleton-node"]')).toBeNull();

    enhancer.destroy();
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  test("cleans stale skeleton state on destroy during in-flight request", () => {
    jest.useFakeTimers();
    document.body.innerHTML = `<main id="app" data-skeleton-visible="false"></main>`;

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Keep pending so destroy must force cleanup.
        })
    ) as unknown as typeof fetch;

    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      showDelayMs: 0,
      minVisibleMs: 0,
      requestTimeoutMs: 5000
    });

    enhancer.start();
    void fetch("/api/pending");
    jest.advanceTimersByTime(1);

    const target = document.querySelector("#app");
    expect(target?.getAttribute("data-skeleton-visible")).toBe("true");

    enhancer.destroy();

    expect(target?.getAttribute("data-skeleton-visible")).toBe("false");
    expect(target?.querySelector('[data-skeleton-node="sknet-skeleton-node"]')).toBeNull();

    global.fetch = originalFetch;
    jest.useRealTimers();
  });
});
