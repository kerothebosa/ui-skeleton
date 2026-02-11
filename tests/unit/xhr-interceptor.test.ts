import { XhrInterceptor } from "../../src/network/xhr-interceptor";
import type { NetworkEventSubscriber } from "../../src/network/types";

describe("XhrInterceptor", () => {
  test("emits request start and end around successful XHR", () => {
    const openSpy = jest.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(function () {
      // No-op in test.
    });
    const sendSpy = jest.spyOn(XMLHttpRequest.prototype, "send").mockImplementation(function (
      this: XMLHttpRequest
    ) {
      Object.defineProperty(this, "status", { configurable: true, value: 204 });
      this.dispatchEvent(new Event("loadend"));
    });

    const onRequestStart = jest.fn();
    const onRequestEnd = jest.fn();
    const onError = jest.fn();
    const subscriber: NetworkEventSubscriber = {
      onRequestStart,
      onRequestEnd,
      onError
    };

    const interceptor = new XhrInterceptor(subscriber);
    interceptor.install();

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/xhr-success");
    xhr.send();

    interceptor.uninstall();
    openSpy.mockRestore();
    sendSpy.mockRestore();

    expect(onRequestStart).toHaveBeenCalledTimes(1);
    expect(onRequestStart).toHaveBeenCalledWith(
      expect.objectContaining({
        canAbort: true,
        cancel: expect.any(Function)
      })
    );
    expect(onRequestEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "xhr",
        ok: true,
        status: 204
      })
    );
    expect(onError).not.toHaveBeenCalled();
  });

  test("cancel callback aborts request and emits one terminal event", () => {
    const openSpy = jest.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(function () {
      // No-op in test.
    });
    const sendSpy = jest.spyOn(XMLHttpRequest.prototype, "send").mockImplementation(function () {
      // Keep request pending until cancel callback triggers abort.
    });
    const abortSpy = jest.spyOn(XMLHttpRequest.prototype, "abort").mockImplementation(function (
      this: XMLHttpRequest
    ) {
      Object.defineProperty(this, "status", { configurable: true, value: 0 });
      Object.defineProperty(this, "readyState", { configurable: true, value: XMLHttpRequest.DONE });
      this.dispatchEvent(new Event("abort"));
      this.dispatchEvent(new Event("loadend"));
    });

    let cancel: (() => void) | undefined;
    const onRequestEnd = jest.fn();
    const onError = jest.fn();
    const subscriber: NetworkEventSubscriber = {
      onRequestStart: (event) => {
        cancel = event.cancel;
      },
      onRequestEnd,
      onError
    };

    const interceptor = new XhrInterceptor(subscriber);
    interceptor.install();

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/xhr-cancel");
    xhr.send();
    cancel?.();

    interceptor.uninstall();
    openSpy.mockRestore();
    sendSpy.mockRestore();
    abortSpy.mockRestore();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onRequestEnd).toHaveBeenCalledTimes(1);
    expect(onRequestEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "xhr",
        aborted: true
      })
    );
  });

  test("emits error events for failing XHR", () => {
    const openSpy = jest.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(function () {
      // No-op in test.
    });
    const sendSpy = jest.spyOn(XMLHttpRequest.prototype, "send").mockImplementation(function (
      this: XMLHttpRequest
    ) {
      this.dispatchEvent(new Event("error"));
      this.dispatchEvent(new Event("loadend"));
    });

    const onRequestEnd = jest.fn();
    const onError = jest.fn();
    const subscriber: NetworkEventSubscriber = {
      onRequestStart: jest.fn(),
      onRequestEnd,
      onError
    };

    const interceptor = new XhrInterceptor(subscriber);
    interceptor.install();

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/xhr-error");
    xhr.send();

    interceptor.uninstall();
    openSpy.mockRestore();
    sendSpy.mockRestore();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onRequestEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "xhr",
        ok: false
      })
    );
  });

  test("restores patched XHR prototype on uninstall", () => {
    const openBefore = XMLHttpRequest.prototype.open;
    const sendBefore = XMLHttpRequest.prototype.send;
    const subscriber: NetworkEventSubscriber = {
      onRequestStart: jest.fn(),
      onRequestEnd: jest.fn(),
      onError: jest.fn()
    };

    const interceptor = new XhrInterceptor(subscriber);
    interceptor.install();

    expect(XMLHttpRequest.prototype.open).not.toBe(openBefore);
    expect(XMLHttpRequest.prototype.send).not.toBe(sendBefore);

    interceptor.uninstall();

    expect(XMLHttpRequest.prototype.open).toBe(openBefore);
    expect(XMLHttpRequest.prototype.send).toBe(sendBefore);
  });

  test("install and uninstall are idempotent", () => {
    const subscriber: NetworkEventSubscriber = {
      onRequestStart: jest.fn(),
      onRequestEnd: jest.fn(),
      onError: jest.fn()
    };

    const interceptor = new XhrInterceptor(subscriber);
    interceptor.install();
    interceptor.install();
    expect(interceptor.isInstalled()).toBe(true);

    interceptor.uninstall();
    interceptor.uninstall();
    expect(interceptor.isInstalled()).toBe(false);
  });
});
