import { EventBus } from "../../src/orchestrator/event-bus";
import type { SkeletonEnhancerEventMap } from "../../src/types/public";

describe("EventBus", () => {
  test("registers and emits typed events", () => {
    const bus = new EventBus<SkeletonEnhancerEventMap>();
    const handler = jest.fn();

    bus.on("request:start", handler);
    bus.emit("request:start", {
      requestId: "1",
      method: "GET",
      url: "/test",
      source: "fetch",
      startedAt: Date.now()
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: "1", method: "GET", url: "/test", source: "fetch" })
    );
  });

  test("removes listeners via off", () => {
    const bus = new EventBus<SkeletonEnhancerEventMap>();
    const handler = jest.fn();

    bus.on("request:start", handler);
    bus.off("request:start", handler);
    bus.emit("request:start", {
      requestId: "1",
      method: "GET",
      url: "/test",
      source: "fetch",
      startedAt: Date.now()
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
