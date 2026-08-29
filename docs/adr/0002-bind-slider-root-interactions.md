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
listeners call `preventDefault()`, `stopImmediatePropagation()`, and `stopPropagation()` only
for the secondary button on a Slider that can open Precise Input. This prevents same-target
and delegated native drag handlers from committing the right-click position first. The
separate root `contextmenu` listener still records the Precise Input action in the observed
Discord event path.

Bindings are idempotent per Slider instance. Ref changes and ref-null unmounts remove the
old listeners, and plugin stop removes every active binding. A per-instance wheel-bubble
coordinator survives the synchronous `null -> root` ref handoff caused by a Slider rerender;
it is disposed only after a deferred check confirms a real detach. Handled wheel events commit
through native `commitValue` before calling `preventDefault()`.

After a successful wheel commit, the coordinator temporarily acquires the Slider's native
`active` state. Discord's own Tooltip therefore renders the value through the consumer's
`onValueRender` contract (or its native default) without BetterSliders duplicating formatting
or generated markup. The coordinator releases only the state it acquired 1000 ms after the
latest handled wheel event, and plugin stop or a confirmed unmount cancels pending work.
Consumers such as `stickToMarkers` Sliders that do not render a native hover value bubble remain
unchanged; BetterSliders does not invent a second label for those consumers.

Right-click records a pending Precise Input action and lets the event bubble. If Discord
opens a context menu synchronously, the global context-menu patch consumes the pending
action and appends one BetterSliders item. If no menu opens by the next task, BetterSliders
opens the Modal directly. Before opening, BetterSliders closes any Precise Input Modal
registered under its fixed Modal key, but preserves the active consumer context menu. While
the Modal is mounted, BetterSliders finds the menu and Modal's common ancestor and temporarily
raises every Modal-exclusive ancestor above the menu without depending on generated Discord
classes. Cleanup restores the original inline positioning and stacking styles. This keeps the
Modal above the consumer menu and makes a later trigger replace, rather than stack on, the
earlier Modal. A capture-phase Modal interaction guard consumes the first Escape and closes the
Modal before Discord's preserved menu can handle it. It also consumes secondary-button events
outside the Modal while mounted, leaving the background menu visible but inert. Removing the
Modal restores the menu's native event behavior. Plugin stop clears pending work.

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
- Consumer context menus remain open and inert while Precise Input is displayed. The first
  Escape closes Precise Input; a later Escape may close the preserved menu normally.
- The fixed Modal key is plugin-global within the active Discord renderer, so repeated
  Precise Input triggers replace the existing BetterSliders Modal.
- Wheel feedback uses Discord's native Tooltip and value renderer, appears only after a
  successful adjustment, and is released 1000 ms after the latest handled wheel event.
