import { SkeletonEnhancer } from "../../src/core/enhancer";
import { FetchInterceptor } from "../../src/network/fetch-interceptor";
import type { NetworkEventSubscriber } from "../../src/network/types";

const createAbortError = (): Error => {
  if (typeof DOMException !== "undefined") {
    return new DOMException("The operation was aborted.", "AbortError");
  }

  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
};

const createResponse = (status = 200): Response =>
  ({
    ok: status >= 200 && status < 400,
    status
  }) as Response;

describe("FetchInterceptor error paths", () => {
  test("emits error and end when fetch rejects", async () => {
    const originalFetch = global.fetch;
    const onRequestStart = jest.fn();
    const onRequestEnd = jest.fn();
    const onError = jest.fn();
    const subscriber: NetworkEventSubscriber = {
      onRequestStart,
      onRequestEnd,
      onError
    };

    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const interceptor = new FetchInterceptor(subscriber);
    interceptor.install();

    await expect(fetch("/api/fail")).rejects.toThrow("network down");

    interceptor.uninstall();
    global.fetch = originalFetch;

    expect(onRequestStart).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onRequestEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        status: 0,
        aborted: false
      })
    );
  });

  test("marks aborted fetch requests", async () => {
    const originalFetch = global.fetch;
    const onRequestEnd = jest.fn();
    const subscriber: NetworkEventSubscriber = {
      onRequestStart: jest.fn(),
      onRequestEnd,
      onError: jest.fn()
    };

    global.fetch = jest.fn().mockRejectedValue(createAbortError()) as unknown as typeof fetch;

    const interceptor = new FetchInterceptor(subscriber);
    interceptor.install();

    await expect(fetch("/api/abort")).rejects.toThrow();

    interceptor.uninstall();
    global.fetch = originalFetch;

    expect(onRequestEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        aborted: true,
        ok: false
      })
    );
  });

  test("timeoutMode abort cancels request and emits aborted end", async () => {
    jest.useFakeTimers();
    document.body.innerHTML = `<main id="app"></main>`;
    const originalFetch = global.fetch;
    let abortCount = 0;

    global.fetch = jest.fn().mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) {
            return;
          }

          if (signal.aborted) {
            abortCount += 1;
            reject(createAbortError());
            return;
          }

          signal.addEventListener(
            "abort",
            () => {
              abortCount += 1;
              reject(createAbortError());
            },
            { once: true }
          );
        })
    ) as unknown as typeof fetch;

    const onRequestEnd = jest.fn();
    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      showDelayMs: 0,
      minVisibleMs: 0,
      requestTimeoutMs: 25,
      timeoutMode: "abort"
    });

    enhancer.on("request:end", onRequestEnd);
    enhancer.start();

    const request = fetch("/api/slow-abort");
    jest.advanceTimersByTime(30);
    await expect(request).rejects.toThrow();

    expect(abortCount).toBeGreaterThan(0);
    expect(onRequestEnd).toHaveBeenCalledTimes(1);
    expect(onRequestEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        status: 0,
        aborted: true
      })
    );

    enhancer.destroy();
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  test("timeoutMode synthetic does not abort and does not emit duplicate end", async () => {
    jest.useFakeTimers();
    document.body.innerHTML = `<main id="app"></main>`;
    const originalFetch = global.fetch;
    let abortCount = 0;
    const pendingRequest: { resolve?: (response: Response) => void } = {};

    global.fetch = jest.fn().mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          pendingRequest.resolve = resolve;
          const signal = init?.signal;
          if (!signal) {
            return;
          }

          signal.addEventListener(
            "abort",
            () => {
              abortCount += 1;
              reject(createAbortError());
            },
            { once: true }
          );
        })
    ) as unknown as typeof fetch;

    const onRequestEnd = jest.fn();
    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      showDelayMs: 0,
      minVisibleMs: 0,
      requestTimeoutMs: 25,
      timeoutMode: "synthetic"
    });

    enhancer.on("request:end", onRequestEnd);
    enhancer.start();
    void fetch("/api/slow-synthetic");

    jest.advanceTimersByTime(30);
    expect(onRequestEnd).toHaveBeenCalledTimes(1);
    expect(onRequestEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        status: 0,
        aborted: false
      })
    );
    expect(abortCount).toBe(0);

    if (pendingRequest.resolve) {
      pendingRequest.resolve(createResponse(200));
    }
    await Promise.resolve();
    expect(onRequestEnd).toHaveBeenCalledTimes(1);

    enhancer.destroy();
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  test("composes existing user signal with internal cancellation", async () => {
    const originalFetch = global.fetch;

    global.fetch = jest.fn().mockImplementation(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) {
            return;
          }

          if (signal.aborted) {
            reject(createAbortError());
            return;
          }

          signal.addEventListener("abort", () => reject(createAbortError()), { once: true });
        })
    ) as unknown as typeof fetch;

    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "body",
      requestTimeoutMs: 10_000,
      timeoutMode: "abort"
    });
    enhancer.start();

    const userController = new AbortController();
    const request = fetch("/api/user-signal", { signal: userController.signal });
    userController.abort();

    await expect(request).rejects.toThrow();

    enhancer.destroy();
    global.fetch = originalFetch;
  });
});
