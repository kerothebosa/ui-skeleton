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
    expect(
      target
        ?.querySelector('[data-skeleton-node="sknet-skeleton-node"]')
        ?.classList.contains("custom-overlay")
    ).toBe(true);

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

  test("renders adaptive placeholders in adaptive mode", () => {
    document.body.innerHTML = `
      <main id="app" data-skeleton-visible="false">
        <section id="card"><h2>Title</h2><p>Paragraph content</p></section>
      </main>
    `;

    const app = document.querySelector("#app") as HTMLElement;
    const card = document.querySelector("#card") as HTMLElement;
    const heading = card.querySelector("h2") as HTMLElement;
    const paragraph = card.querySelector("p") as HTMLElement;

    app.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 320, bottom: 180, width: 320, height: 180 } as DOMRect);
    card.getBoundingClientRect = () =>
      ({ left: 8, top: 8, right: 300, bottom: 160, width: 292, height: 152 } as DOMRect);
    heading.getBoundingClientRect = () =>
      ({ left: 20, top: 20, right: 260, bottom: 44, width: 240, height: 24 } as DOMRect);
    paragraph.getBoundingClientRect = () =>
      ({ left: 20, top: 54, right: 280, bottom: 104, width: 260, height: 50 } as DOMRect);

    const manager = new SkeletonManager({
      selector: "#app",
      className: "active-skeleton",
      overlayClassName: "custom-overlay",
      visuals: {
        mode: "adaptive",
        animation: "wave"
      }
    });

    manager.show("request-adaptive");

    const skeletonNode = app.querySelector('[data-skeleton-node="sknet-skeleton-node"]');
    expect(skeletonNode?.getAttribute("data-skeleton-mode")).toBe("adaptive");
    expect(skeletonNode?.querySelectorAll('[data-skeleton-placeholder="block"]').length).toBeGreaterThan(
      0
    );

    manager.cleanup();
  });

  test("hybrid mode falls back to overlay when adaptive candidates are unavailable", () => {
    document.body.innerHTML = `<main id="app" data-skeleton-visible="false"></main>`;
    const app = document.querySelector("#app") as HTMLElement;
    app.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 300, bottom: 160, width: 300, height: 160 } as DOMRect);

    const manager = new SkeletonManager({
      selector: "#app",
      className: "active-skeleton",
      overlayClassName: "custom-overlay",
      visuals: {
        mode: "hybrid"
      }
    });

    manager.show("request-hybrid");

    const skeletonNode = app.querySelector('[data-skeleton-node="sknet-skeleton-node"]');
    expect(skeletonNode?.getAttribute("data-skeleton-mode")).toBe("overlay");
    expect(skeletonNode?.querySelector('[data-skeleton-placeholder="block"]')).toBeNull();

    manager.cleanup();
  });

  test("adaptive mode still renders skeleton node when ignoreSelectors is empty or invalid", () => {
    document.body.innerHTML = `
      <main id="app" data-skeleton-visible="false">
        <section id="card"><p>Loaded content</p></section>
      </main>
    `;

    const app = document.querySelector("#app") as HTMLElement;
    const card = document.querySelector("#card") as HTMLElement;
    const paragraph = card.querySelector("p") as HTMLElement;

    app.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 320, bottom: 160, width: 320, height: 160 } as DOMRect);
    card.getBoundingClientRect = () =>
      ({ left: 10, top: 10, right: 300, bottom: 120, width: 290, height: 110 } as DOMRect);
    paragraph.getBoundingClientRect = () =>
      ({ left: 20, top: 20, right: 280, bottom: 48, width: 260, height: 28 } as DOMRect);

    const manager = new SkeletonManager({
      selector: "#app",
      className: "active-skeleton",
      overlayClassName: "custom-overlay",
      visuals: {
        mode: "adaptive",
        adaptive: {
          ignoreSelectors: ["", "[]invalid"]
        }
      }
    });

    expect(() => manager.show("request-adaptive-ignore")).not.toThrow();
    const skeletonNode = app.querySelector('[data-skeleton-node="sknet-skeleton-node"]');
    expect(skeletonNode).not.toBeNull();

    manager.cleanup();
  });
});
