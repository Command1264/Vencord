# ADR 0002: Bind native interactions to the Slider root

- Status: Accepted
- Date: 2026-08-28

## Context

ADR 0001 selected Discord's shared Slider component as the integration boundary but left
page-scroll cancellation open. Discord Stable `1.0.9255` runtime testing showed that a
React synthetic `onWheel` handler receives Slider events through a passive event path, so
calling `preventDefault()` there does not reliably stop the settings page from scrolling.

The same runtime module renders an `animated.div` root with a stable `containerRef`. It has
no native root `onContextMenu` handler in the observed build. BetterSliders still needs to
coexist with a context menu opened by a Slider consumer or ancestor when one exists.

## Decision

The source patch composes the Slider root ref and delegates it to a plugin-owned
`bindSlider(instance, root)` adapter. The adapter preserves `containerRef.current` and
attaches one native `wheel` listener with `{ passive: false }` plus one native
`contextmenu` listener to that exact root. Capture-phase `pointerdown` and `mousedown`
listeners stop propagation only for the secondary button on a Slider that can open Precise
Input. They do not call `preventDefault()`, so the later context-menu event remains intact
while Discord's delegated drag handler cannot commit the right-click position first.

Bindings are idempotent per Slider instance. Ref changes and ref-null unmounts remove the
old listeners, and plugin stop removes every active binding. Handled wheel events commit
through native `commitValue` before calling `preventDefault()`.

Right-click records a pending Precise Input action and lets the event bubble. If Discord
opens a context menu synchronously, the global context-menu patch consumes the pending
action and appends one BetterSliders item. If no menu opens by the next task, BetterSliders
opens the Modal directly. Plugin stop clears pending work.

## Alternatives considered

### React synthetic `onWheel`

Rejected because the observed passive event path could adjust the value but could not
reliably prevent the settings page from scrolling.

### DOM scan or global `MutationObserver`

Rejected because it would rediscover components from unstable generated markup and add
work unrelated to actual Slider lifecycle events.

### Patch lifecycle methods

Rejected because composing the existing root ref provides mount, replacement, unmount,
and plugin-stop cleanup with a smaller patch surface.

## Consequences

- Handled wheel input can prevent page scrolling without changing native Slider rendering.
- Each mounted shared Slider has four lightweight native listeners while the plugin runs.
- The source patch depends on the observed `containerRef` render anchor and needs a runtime
  smoke test when Discord changes its Slider bundle.
- Direct Modal fallback is verified for the current Slider root. Coexistence with a real
  consumer-provided native context menu remains a compatibility scenario until one is found
  in the current client.
