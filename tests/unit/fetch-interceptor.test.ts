import { FetchInterceptor } from "../../src/network/fetch-interceptor";
import type { NetworkEventSubscriber } from "../../src/network/types";

describe("FetchInterceptor", () => {
  test("emits start and end events around fetch requests", async () => {
    const originalFetch = global.fetch;
    const onRequestStart = jest.fn();
    const onRequestEnd = jest.fn();
    const onError = jest.fn();
    const subscriber: NetworkEventSubscriber = {
      onRequestStart,
      onRequestEnd,
      onError
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200
    }) as unknown as typeof global.fetch;

    const interceptor = new FetchInterceptor(subscriber);
    interceptor.install();

    await fetch("/api/check");

    interceptor.uninstall();
    global.fetch = originalFetch;

    expect(onRequestStart).toHaveBeenCalledTimes(1);
    expect(onRequestEnd).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(onRequestEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "fetch",
        ok: true,
        status: 200
      })
    );
  });

  test("install and uninstall are idempotent", () => {
    const subscriber: NetworkEventSubscriber = {
      onRequestStart: jest.fn(),
      onRequestEnd: jest.fn(),
      onError: jest.fn()
    };

    const interceptor = new FetchInterceptor(subscriber);
    interceptor.install();
    interceptor.install();
    expect(interceptor.isInstalled()).toBe(true);

    interceptor.uninstall();
    interceptor.uninstall();
    expect(interceptor.isInstalled()).toBe(false);
  });
});
