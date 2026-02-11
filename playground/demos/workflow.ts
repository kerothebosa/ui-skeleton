// @ts-nocheck
import { fetchJson, renderComparePanels, setNodeText, toQuery, withNoPackageLoad } from "./common.ts";

const workflowBody = (mode = "") => `
  <h4>${mode}</h4>
  <p data-role="${mode}-status">Status: idle</p>
  <ol class="step-list" data-role="${mode}-steps">
    <li>Step 1 - Cart</li>
    <li>Step 2 - Address</li>
    <li>Step 3 - Payment</li>
    <li>Step 4 - Review</li>
  </ol>
  <p data-role="${mode}-result">Result: pending</p>
`;

export const mountWorkflowDemo = (ctx = {}) => {
  const mountNode = ctx.mountNode;
  if (!mountNode) {
    return () => {};
  }

  const surfaces = renderComparePanels(mountNode, {
    headline: "Multi-step workflow simulation with dependent calls and final confirmation.",
    code: "FLOW-CMP-06",
    controlsHtml: `
      <div class="control-grid">
        <button type="button" data-action="run">FLOW-RUN-71</button>
        <button type="button" data-action="slow">FLOW-SLOW-72</button>
        <button type="button" data-action="error">FLOW-ERR-73</button>
      </div>
    `,
    withSurfaceId: "workflow-with-surface",
    withoutSurfaceId: "workflow-without-surface",
    withBodyHtml: workflowBody("with"),
    withoutBodyHtml: workflowBody("without")
  });

  const listeners = [];
  const withStatus = mountNode.querySelector('[data-role="with-status"]');
  const withoutStatus = mountNode.querySelector('[data-role="without-status"]');
  const withSteps = mountNode.querySelector('[data-role="with-steps"]');
  const withoutSteps = mountNode.querySelector('[data-role="without-steps"]');
  const withResult = mountNode.querySelector('[data-role="with-result"]');
  const withoutResult = mountNode.querySelector('[data-role="without-result"]');

  const addListener = (node = null, eventName = "", handler = () => {}) => {
    if (!node || !eventName) {
      return;
    }
    node.addEventListener(eventName, handler);
    listeners.push(() => {
      node.removeEventListener(eventName, handler);
    });
  };

  const setStatus = (message = "") => {
    setNodeText(withStatus, `Status: ${message}`);
    setNodeText(withoutStatus, `Status: ${message}`);
    ctx.setGlobalStatus(message);
  };

  const markStep = (listNode = null, step = 0, text = "") => {
    if (!listNode) {
      return;
    }
    const items = Array.from(listNode.querySelectorAll("li"));
    const node = items[step - 1];
    if (!node) {
      return;
    }
    node.textContent = `Step ${step} - ${text}`;
  };

  const resetSteps = () => {
    [withSteps, withoutSteps].forEach((listNode) => {
      if (!listNode) {
        return;
      }
      listNode.innerHTML = `
        <li>Step 1 - Cart</li>
        <li>Step 2 - Address</li>
        <li>Step 3 - Payment</li>
        <li>Step 4 - Review</li>
      `;
    });
    setNodeText(withResult, "Result: pending");
    setNodeText(withoutResult, "Result: pending");
  };

  const runWorkflow = async (mode = "normal") => {
    setStatus(`Workflow ${mode} started`);
    resetSteps();

    const delayBase = mode === "slow" ? 920 : 320;
    const maybeError = mode === "error" ? 500 : "";
    try {
      const run = async (prefix = "") => {
        const withPackage = prefix === "with";
        const noPackageWrap = (task = () => Promise.resolve({})) => {
          if (withPackage) {
            return task();
          }
          return withNoPackageLoad(surfaces?.withoutSurface, task);
        };

        const step1 = await noPackageWrap(() =>
          fetchJson(`/api/workflow/step?${toQuery({ step: 1, delay: delayBase })}`)
        );
        markStep(prefix === "with" ? withSteps : withoutSteps, 1, step1.label ?? "Cart ok");

        const step2 = await noPackageWrap(() =>
          fetchJson(`/api/workflow/step?${toQuery({ step: 2, delay: delayBase + 120 })}`)
        );
        markStep(prefix === "with" ? withSteps : withoutSteps, 2, step2.label ?? "Address ok");

        const step3 = await noPackageWrap(() =>
          fetchJson(`/api/workflow/step?${toQuery({ step: 3, delay: delayBase + 200 })}`)
        );
        markStep(prefix === "with" ? withSteps : withoutSteps, 3, step3.label ?? "Payment ok");

        const finalize = await noPackageWrap(() =>
          fetchJson(`/api/workflow/finalize?${toQuery({ delay: delayBase + 260, status: maybeError })}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: prefix, mode })
          })
        );
        markStep(prefix === "with" ? withSteps : withoutSteps, 4, finalize.summary ?? "Review ok");
        return finalize;
      };

      const [withFinalize, withoutFinalize] = await Promise.all([run("with"), run("without")]);
      setNodeText(withResult, `Result: ${withFinalize.message ?? "completed"}`);
      setNodeText(withoutResult, `Result: ${withoutFinalize.message ?? "completed"}`);
      setStatus(`Workflow ${mode} complete`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setNodeText(withResult, `Result: failed (${message})`);
      setNodeText(withoutResult, `Result: failed (${message})`);
      setStatus(`Workflow ${mode} failed (${message})`);
    }
  };

  ctx.createEnhancer({
    skeletonSelector: "#workflow-with-surface"
  });

  addListener(mountNode.querySelector('[data-action="run"]'), "click", () => {
    void runWorkflow("normal");
  });
  addListener(mountNode.querySelector('[data-action="slow"]'), "click", () => {
    void runWorkflow("slow");
  });
  addListener(mountNode.querySelector('[data-action="error"]'), "click", () => {
    void runWorkflow("error");
  });

  setStatus("Workflow compare ready");

  return () => {
    listeners.forEach((cleanup = () => {}) => cleanup());
    listeners.length = 0;
    ctx.disposeEnhancer();
  };
};
