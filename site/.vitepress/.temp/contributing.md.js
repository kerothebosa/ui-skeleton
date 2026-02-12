import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Contributing","description":"","frontmatter":{},"headers":[],"relativePath":"contributing.md","filePath":"contributing.md"}');
const _sfc_main = { name: "contributing.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="contributing" tabindex="-1">Contributing <a class="header-anchor" href="#contributing" aria-label="Permalink to &quot;Contributing&quot;">​</a></h1><h2 id="workflow" tabindex="-1">Workflow <a class="header-anchor" href="#workflow" aria-label="Permalink to &quot;Workflow&quot;">​</a></h2><ol><li>Install dependencies: <ul><li><code>npm ci</code></li></ul></li><li>Run quality gates before PR: <ul><li><code>npm run lint</code></li><li><code>npm run typecheck</code></li><li><code>npm run test</code></li><li><code>npm run test:e2e</code></li></ul></li><li>Keep public API updates documented in: <ul><li><code>README.md</code></li><li><code>docs/api-reference.md</code></li><li><code>docs/playground.md</code> (when playground config or scenarios change)</li></ul></li></ol><h2 id="engineering-expectations" tabindex="-1">Engineering Expectations <a class="header-anchor" href="#engineering-expectations" aria-label="Permalink to &quot;Engineering Expectations&quot;">​</a></h2><ul><li>Preserve additive API compatibility when possible.</li><li>Add tests for every behavior change and edge case.</li><li>Keep request lifecycle and cleanup deterministic.</li><li>Prefer typed interfaces and avoid untyped event payloads.</li></ul><h2 id="release-hygiene" tabindex="-1">Release Hygiene <a class="header-anchor" href="#release-hygiene" aria-label="Permalink to &quot;Release Hygiene&quot;">​</a></h2><ul><li>Bump version in <code>package.json</code>.</li><li>Tag using semantic format (<code>vX.Y.Z</code>).</li><li>Push tag to trigger publish workflow.</li></ul><h2 id="publish-gate-policy" tabindex="-1">Publish Gate Policy <a class="header-anchor" href="#publish-gate-policy" aria-label="Permalink to &quot;Publish Gate Policy&quot;">​</a></h2><p>Publish workflow executes full validation before npm publish:</p><ul><li><code>npm run lint</code></li><li><code>npm run typecheck</code></li><li><code>npm run test</code></li><li><code>npm run test:e2e</code></li><li><code>npm run pack:check</code></li></ul><p>If any step fails, publish is blocked.</p></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("contributing.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const contributing = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  contributing as default
};
