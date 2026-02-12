import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Lifecycle And Events","description":"","frontmatter":{},"headers":[],"relativePath":"lifecycle-and-events.md","filePath":"lifecycle-and-events.md"}');
const _sfc_main = { name: "lifecycle-and-events.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="lifecycle-and-events" tabindex="-1">Lifecycle And Events <a class="header-anchor" href="#lifecycle-and-events" aria-label="Permalink to &quot;Lifecycle And Events&quot;">​</a></h1><h2 id="lifecycle-states" tabindex="-1">Lifecycle States <a class="header-anchor" href="#lifecycle-states" aria-label="Permalink to &quot;Lifecycle States&quot;">​</a></h2><ul><li><code>idle</code>: instance created, not started.</li><li><code>running</code>: interceptors installed, network events handled.</li><li><code>stopped</code>: interceptors uninstalled, in-flight skeleton state cleaned.</li><li><code>destroyed</code>: terminal state; no further start allowed.</li></ul><h2 id="start-stop-rules" tabindex="-1">Start/Stop Rules <a class="header-anchor" href="#start-stop-rules" aria-label="Permalink to &quot;Start/Stop Rules&quot;">​</a></h2><ul><li><code>start()</code> is idempotent while already running.</li><li><code>stop()</code> is idempotent while not running.</li><li><code>destroy()</code> is idempotent and always performs cleanup.</li><li>In non-browser environments, <code>start()</code> is a no-op.</li></ul><h2 id="event-timeline-per-request" tabindex="-1">Event Timeline Per Request <a class="header-anchor" href="#event-timeline-per-request" aria-label="Permalink to &quot;Event Timeline Per Request&quot;">​</a></h2><ol><li><code>request:start</code> emitted after request passes filter.</li><li>Skeleton show may occur after <code>showDelayMs</code>.</li><li><code>error</code> may occur on network failure/abort/timeout.</li><li><code>request:end</code> emitted once per tracked request.</li><li>Skeleton hide occurs immediately or delayed to satisfy <code>minVisibleMs</code>.</li></ol><p>Rendering guarantee:</p><ul><li>when <code>skeleton:show</code> is emitted, manager guarantees a visible skeleton node is inserted</li><li>adaptive rendering failures degrade to overlay mode rather than skipping DOM insertion</li></ul><h2 id="timeout-behavior" tabindex="-1">Timeout Behavior <a class="header-anchor" href="#timeout-behavior" aria-label="Permalink to &quot;Timeout Behavior&quot;">​</a></h2><ul><li><code>requestTimeoutMs</code> is handled by enhancer tracking.</li><li>On timeout: <ul><li><code>error</code> is emitted with timeout message.</li><li>synthetic <code>request:end</code> is emitted with <code>ok: false</code>, <code>status: 0</code>.</li><li>skeleton state is cleaned without waiting for the eventual network completion.</li></ul></li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("lifecycle-and-events.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const lifecycleAndEvents = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  lifecycleAndEvents as default
};
