import { SkeletonEnhancer } from "../../src/core/enhancer";
import type { NetworkInterceptor } from "../../src/types/public";

type MockInterceptor = NetworkInterceptor & {
  installMock: jest.Mock;
  uninstallMock: jest.Mock;
};

const createMockInterceptor = (name: string): MockInterceptor => {
  let installed = false;
  const installMock = jest.fn(() => {
    installed = true;
  });
  const uninstallMock = jest.fn(() => {
    installed = false;
  });

  return {
    name,
    install: installMock,
    uninstall: uninstallMock,
    isInstalled: () => installed,
    installMock,
    uninstallMock
  };
};

describe("Interceptor registry", () => {
  test("ignores duplicate interceptor names", () => {
    document.body.innerHTML = `<main id="app"></main>`;
    const first = createMockInterceptor("custom");
    const second = createMockInterceptor("custom");
    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      enabledInterceptors: []
    });

    enhancer.registerInterceptor(first);
    enhancer.registerInterceptor(second);
    enhancer.start();

    expect(first.installMock).toHaveBeenCalledTimes(1);
    expect(second.installMock).not.toHaveBeenCalled();
    enhancer.destroy();
  });

  test("unregisters interceptor and uninstalls it when running", () => {
    document.body.innerHTML = `<main id="app"></main>`;
    const custom = createMockInterceptor("custom-unregister");
    const enhancer = new SkeletonEnhancer({
      skeletonSelector: "#app",
      enabledInterceptors: []
    });

    enhancer.registerInterceptor(custom);
    enhancer.start();
    enhancer.unregisterInterceptor(custom.name);

    expect(custom.installMock).toHaveBeenCalledTimes(1);
    expect(custom.uninstallMock).toHaveBeenCalledTimes(1);
    enhancer.destroy();
  });

  test("unregistering unknown interceptor is a no-op", () => {
    document.body.innerHTML = `<main id="app"></main>`;
    const enhancer = new SkeletonEnhancer({ skeletonSelector: "#app" });

    expect(() => enhancer.unregisterInterceptor("does-not-exist")).not.toThrow();
    enhancer.destroy();
  });
});
