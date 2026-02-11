import { SkeletonEnhancer } from "/dist/index.js";

const statusNode = document.querySelector("#status");
const setStatus = (message) => {
  if (statusNode) {
    statusNode.textContent = message;
  }
};

const enhancer = new SkeletonEnhancer({
  skeletonSelector: "#content",
  requestTimeoutMs: 1200,
  timeoutMode: "abort",
  showDelayMs: 120,
  minVisibleMs: 180,
  hooks: {
    onError: ({ error }) => {
      if (error.message.toLowerCase().includes("timed out")) {
        setStatus("Timed out");
        return;
      }

      setStatus("Request failed");
    }
  }
});
enhancer.start();

document.querySelector("#load-data")?.addEventListener("click", async () => {
  setStatus("Loading...");
  const response = await fetch("/api/data?delay=900");
  const payload = await response.json();
  setStatus(payload.message);
});

document.querySelector("#load-error")?.addEventListener("click", async () => {
  setStatus("Loading...");
  try {
    const response = await fetch("/api/error?delay=600");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch {
    setStatus("Request failed");
  }
});

document.querySelector("#load-many")?.addEventListener("click", async () => {
  setStatus("Loading x3...");
  const requests = [
    fetch("/api/data?delay=300"),
    fetch("/api/data?delay=650"),
    fetch("/api/data?delay=900")
  ];
  await Promise.all(requests);
  setStatus("Loaded x3");
});

document.querySelector("#load-fast")?.addEventListener("click", async () => {
  setStatus("Loading fast...");
  const response = await fetch("/api/data?delay=20");
  const payload = await response.json();
  setStatus(`Loaded fast (${payload.delay}ms)`);
});

document.querySelector("#load-timeout")?.addEventListener("click", () => {
  setStatus("Loading timeout...");
  void fetch("/api/never").catch(() => {
    // This request is intentionally left unresolved by the fixture server.
  });
});

document.querySelector("#load-mixed")?.addEventListener("click", async () => {
  setStatus("Loading mixed...");
  await Promise.allSettled([fetch("/api/data?delay=450"), fetch("/api/error?delay=350")]);
  setStatus("Mixed complete");
});

document.querySelector("#stop-during-request")?.addEventListener("click", async () => {
  setStatus("Stopping...");
  const request = fetch("/api/data?delay=900");
  setTimeout(() => {
    enhancer.stop();
  }, 120);
  await request;
  setStatus("Stopped cleanly");
});
