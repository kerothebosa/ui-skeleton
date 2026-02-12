# Playground

The playground is a multi-route QA surface for validating how the package behaves in realistic request patterns.

Each scenario compares:

- with package (`@kerothebosa/ui-skeleton-net` active)
- without package (same UI/request flow, no skeleton enhancer)

## Run Locally (Consumer-Like Mode)

```bash
npm run demo:dev
```

Open:

```text
http://127.0.0.1:4174/#/overview
```

## Route Coverage

The demo includes scenario routes for:

- `overview`
- `dashboard`
- `analytics`
- `table`
- `search`
- `forms`
- `workflow`
- `feed`

## Config Presets and Import/Export Flow

- Start from built-in presets in `playground/config/*.json`.
- Switch between configurations to observe timing and skeleton visual differences.
- Import/export JSON-based config snapshots during manual QA sessions.

## Live Demo

- <a href="https://kerothebosa.github.io/ui-skeleton/demo/" target="_blank" rel="noreferrer">Open live demo in new tab</a>

<section class="page-flow-card">
  <p><strong>Continue with internals:</strong> see lifecycle sequencing in <a href="/lifecycle-and-events">Lifecycle &amp; Events</a>.</p>
  <p>For full option signatures, open the <a href="/api-reference">API Reference</a>.</p>
</section>

## Source Of Truth Guide

<!--@include: ../docs/playground.md-->
