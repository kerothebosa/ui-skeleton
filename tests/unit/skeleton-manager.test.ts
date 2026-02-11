import { SkeletonManager } from "../../src/dom/skeleton-manager";

describe("SkeletonManager", () => {
  test("adds and removes skeleton node", () => {
    document.body.innerHTML = `<main id="app" data-skeleton-visible="false"></main>`;
    const manager = new SkeletonManager({
      selector: "#app",
      className: "active-skeleton",
      overlayClassName: "custom-overlay"
    });

    manager.show("request-1");
    const target = document.querySelector("#app");

    expect(target?.getAttribute("data-skeleton-visible")).toBe("true");
    expect(target?.classList.contains("active-skeleton")).toBe(true);
    expect(target?.querySelector('[data-skeleton-node="sknet-skeleton-node"]')).not.toBeNull();
    expect(target?.querySelector('[data-skeleton-node="sknet-skeleton-node"]')?.className).toBe(
      "custom-overlay"
    );

    manager.hide("request-1");

    expect(target?.getAttribute("data-skeleton-visible")).toBe("false");
    expect(target?.classList.contains("active-skeleton")).toBe(false);
    expect(target?.querySelector('[data-skeleton-node="sknet-skeleton-node"]')).toBeNull();
  });

  test("keeps skeleton visible until all tracked requests complete", () => {
    document.body.innerHTML = `<main id="app" data-skeleton-visible="false"></main>`;
    const manager = new SkeletonManager({
      selector: "#app",
      className: "active-skeleton",
      overlayClassName: "custom-overlay"
    });

    manager.show("request-1");
    manager.show("request-2");
    manager.hide("request-1");

    const target = document.querySelector("#app");
    expect(target?.getAttribute("data-skeleton-visible")).toBe("true");

    manager.hide("request-2");
    expect(target?.getAttribute("data-skeleton-visible")).toBe("false");
  });

  test("does not duplicate overlay node for repeated show calls", () => {
    document.body.innerHTML = `<main id="app" data-skeleton-visible="false"></main>`;
    const manager = new SkeletonManager({
      selector: "#app",
      className: "active-skeleton",
      overlayClassName: "custom-overlay"
    });

    manager.show("request-1");
    manager.show("request-1");

    const target = document.querySelector("#app");
    expect(target?.querySelectorAll('[data-skeleton-node="sknet-skeleton-node"]').length).toBe(1);
  });

  test("handles missing target safely", () => {
    document.body.innerHTML = `<main id="app"></main>`;
    const manager = new SkeletonManager({
      selector: "#missing",
      className: "active-skeleton",
      overlayClassName: "custom-overlay"
    });

    expect(() => manager.show("request-1")).not.toThrow();
    expect(() => manager.hide("request-1")).not.toThrow();
    expect(() => manager.cleanup()).not.toThrow();
    expect(manager.getTarget()).toBeNull();
  });
});
