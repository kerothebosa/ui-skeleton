import { SkeletonEnhancer } from "../../src/core/enhancer";
import * as guards from "../../src/utils/guards";

describe("SkeletonEnhancer lifecycle edge cases", () => {
  test("start is a no-op outside a browser environment", () => {
    const guardSpy = jest.spyOn(guards, "isBrowserEnvironment").mockReturnValue(false);
    const enhancer = new SkeletonEnhancer({ debug: true });

    enhancer.start();

    expect(enhancer.getState()).toBe("idle");
    expect(enhancer.isRunning()).toBe(false);
    guardSpy.mockRestore();
  });

  test("start and stop are idempotent", () => {
    document.body.innerHTML = `<main id="app"></main>`;
    const enhancer = new SkeletonEnhancer({ skeletonSelector: "#app" });

    enhancer.start();
    enhancer.start();
    expect(enhancer.getState()).toBe("running");

    enhancer.stop();
    enhancer.stop();
    expect(enhancer.getState()).toBe("stopped");

    enhancer.destroy();
  });

  test("destroy is safe after stop and remains idempotent", () => {
    document.body.innerHTML = `<main id="app"></main>`;
    const enhancer = new SkeletonEnhancer({ skeletonSelector: "#app" });

    enhancer.start();
    enhancer.stop();
    enhancer.destroy();
    enhancer.destroy();

    expect(enhancer.getState()).toBe("destroyed");
  });
});
