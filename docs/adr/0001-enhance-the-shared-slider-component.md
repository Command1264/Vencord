# ADR 0001: Enhance the shared Slider component boundary

- Status: Accepted
- Date: 2026-08-28

## Context

BetterSliders must support Discord and Vencord Sliders with dynamic ranges while preserving
native dragging, keyboard operation, callbacks, disabled behavior, and feature ownership.
DOM discovery is unstable because Discord class names and markup are generated. Direct
integration with individual feature stores would duplicate business rules and would not
scale to unknown Slider consumers.

Repository inspection and a Discord Stable `1.0.9255` runtime probe showed that the shared
Slider class owns the live value and effective range in instance state. Its native
`commitValue` method updates state and invokes the component's configured callbacks. The
VolumeBooster plugin changes values before they reach the shared Slider, so final instance
props/state already represent the effective contract.

## Decision

BetterSliders enhances the shared Slider at its component boundary with a narrow source
patch. Runtime handlers read live state and final props for each interaction, compute a
policy result in pure functions, and commit handled values through native `commitValue`.

The integration must fail open. It will not scan the DOM, depend on generated CSS classes,
query feature stores, name-check other plugins, directly style the native handle, or call
multiple Slider callbacks itself.

## Alternatives considered

### DOM discovery and listeners

Rejected as the primary architecture because it depends on unstable markup and encourages
per-instance discovery. A component-owned non-passive wheel listener may be reconsidered
only if React's event path cannot satisfy the verified page-scroll requirement; that
fallback requires a separate decision with lifecycle and cleanup evidence.

### Per-feature store integrations

Rejected because each consumer owns different range and persistence rules. It would create
named dependencies and miss future or third-party Slider consumers.

### Replace the Slider component

Rejected because it would assume ownership of native rendering and interaction semantics,
increasing compatibility risk.

## Consequences

- Dynamic and VolumeBooster-modified ranges are consumed without special cases.
- Pure wheel and validation policies can be tested without mocking Discord internals.
- Discord bundle changes may break the source patch, so the patch needs a stable anchor and
  runtime smoke coverage.
- Only consumers of the shared Slider are supported.
- Page-scroll cancellation and native context-menu coexistence remain release blockers
  until verified in the current Discord runtime.
