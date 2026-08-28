# BetterSliders Roadmap

## Product intent

BetterSliders is a generic Discord Slider interaction enhancer. It adds two optional ways to
operate a Supported Slider:

1. hover and use the wheel for incremental adjustment;
2. right-click and enter one Precise Input value.

Native dragging, keyboard operation, presentation, and feature ownership remain with the
original Slider. BetterSliders changes values only through the Slider's effective native
change behavior; it never writes directly to feature stores or visual handle styles.

## Non-negotiable invariants

- Read the Effective Slider Contract at interaction time. Never hard-code `0..100`, assume
  a percentage, or retain a mount-time value as the current value.
- Observe final runtime props after other patches. Do not import or query VolumeBooster or
  any other range-changing plugin by name.
- Fail open: invalid props, missing patches, or BetterSliders exceptions disable the
  enhancement while leaving the native Slider operational.
- Do not scan the DOM, depend on generated Discord CSS classes, or run a global
  `MutationObserver`.
- Do not handle disabled Sliders. Do not cancel their context menu or page scrolling.
- Do not convert arbitrary `onValueRender` React nodes to strings. Prefer a safe native text
  formatter and otherwise display the raw numeric value without an invented unit.
- BetterSliders-owned UI text goes through the plugin dictionary. Supported locales are
  English and explicit Traditional Chinese identifiers; all other locales, including
  Simplified Chinese, fall back to English.
- CSS classes use the `vc-better-sliders-` namespace and theme variables/components rather
  than hard-coded Discord colors.

## Effective Slider Contract discovery

Static repository evidence establishes that Discord's shared Slider is a stateful class.
Its props expose `initialValue`,
`defaultValue`, `minValue`, `maxValue`, `keyboardStep`, `markers`, `stickToMarkers`,
`disabled`, `getAriaValueText`, `onValueChange`, and `asValueChanges`.

Runtime inspection on Discord Stable `1.0.9255` with Vencord base
`bc680139be4526aa5525d33fbac8a271eb0cfd02` established that:

- the authoritative live value of a controlled Slider is available as final `props.value`;
  `state.value` can lag after a native commit, while `state.min` and `state.max` hold the
  effective bounds;
- effective sorted markers and the closest marker index are maintained in instance state;
- the observed defaults are `minValue: 0`, `maxValue: 100`, and `keyboardStep: 1`;
- native `commitValue(value, markerIndex?)` updates state and invokes the component's native
  change callbacks only when the committed value differs;
- the root is an `animated.div` with `containerRef`, and has no native root
  `onContextMenu` in the observed build;
- a composed root ref can attach a non-passive native wheel listener and clean it up without
  DOM discovery; and
- VolumeBooster changes caller-supplied maximum expressions, so the Slider's final runtime
  props/state are the correct compatibility boundary.

The stable design decisions are recorded in
[`ADR 0001`](../adr/0001-enhance-the-shared-slider-component.md) and
[`ADR 0002`](../adr/0002-bind-slider-root-interactions.md).
The following evidence remains required before release:

- marker sorting, duplicate, and tie behavior beyond the exercised marker contract.

Temporary runtime instrumentation on the same Discord Stable build established that continuous
wheel, native-keyboard, Precise Input Apply, and Precise Input Enter changes each call
`commitValue` once, followed by one `asValueChanges` callback and one `onValueChange` callback,
in that order. Marker wheel changes call `commitValue` once with the selected marker index and
then call `onValueChange` once without `asValueChanges`. Native pointer interaction bypasses
`commitValue`: `asValueChanges` follows pointer movement and `onValueChange` fires once at the
end. Cancel, Escape, and clamped wheel no-ops invoke neither callback. The instrumentation was
removed before commit; the detailed evidence boundary is recorded in
[`COMPATIBILITY.md`](./COMPATIBILITY.md#runtime-verified).

Discord Stable acceptance verified that a handled speaker-volume wheel event changed the
displayed value while the Voice & Video page position stayed fixed. A React synthetic
handler did not meet that requirement; the accepted non-passive root binding did.

Code must not call both callbacks merely because both are present; it delegates discrete
changes to `commitValue`.

## Wheel Adjustment contract

- Wheel up increases and wheel down decreases by default; reverse-wheel swaps direction.
- `deltaY === 0` is ignored. Delta magnitude and `deltaMode` never become numeric Slider
  movement; only direction is consumed.
- One wheel event produces at most one logical adjustment.
- `Ctrl` has priority over `Shift`; multipliers are not multiplied together. Defaults are
  normal `1`, Shift `5`, and Ctrl `10`. Alt has no behavior in the first release.
- Prefer the Slider's effective keyboard step. A fallback may be introduced only after
  runtime discovery and must be encapsulated behind one policy function.
- Normalize arithmetic to the effective step precision; never apply one fixed `toFixed`
  precision to every Slider.
- With `stickToMarkers`, navigate to the adjacent marker rather than inventing intermediate
  values.
- Clamp the result at the effective boundaries without showing an error.
- Call `preventDefault()` only after an eligible Slider event has been successfully handled.
- After a successful adjustment, show the Slider's native Tooltip using its native
  `onValueRender` result (or default formatting). Do not create a duplicate value label.
- If a Slider shape does not render a native hover value bubble, preserve that native behavior
  instead of introducing a BetterSliders-only label.
- Release wheel-triggered Tooltip visibility 1000 ms after the latest successful wheel event;
  each later successful event resets the timer. Disabled, invalid, zero-axis, and clamped no-op
  events do not start or reset it.

## Precise Input contract

- Open a native Vencord/Discord Modal from a Supported Slider's context-menu interaction,
  while preserving the open consumer context menu. Temporarily raise the Modal-exclusive
  ancestor path above the menu without relying on generated Discord classes, and restore the
  original inline styles when the Modal closes.
- A secondary-button press must not enter native drag handling or change the Slider before
  Precise Input opens. Primary-button dragging remains native.
- Register Precise Input under one stable Modal key. A later trigger closes and replaces the
  previous Precise Input Modal instead of stacking another dialog.
- While Precise Input is mounted, the first Escape closes it without closing the preserved
  consumer menu. Secondary-button interaction outside the Modal is inert until the Modal
  unmounts, after which Discord's native menu behavior resumes.
- Initialize the field from the live controlled value, safely normalize continuous pointer
  residue to the nearest permitted keyboard step, focus it, and select its contents.
- Allow intermediate input states while typing. Commit only once on valid Apply or Enter;
  Cancel and Escape never invoke a Slider callback.
- Trim surrounding whitespace. Empty input has its own validation reason.
- Accept ordinary signed decimal notation such as `0`, `12.34`, `.5`, `-0.5`, and `-.25`.
- Reject partial parses, malformed decimals, `NaN`, infinities, and scientific notation.
- Convert only after full-string syntax validation and require a finite result.
- Reject values below or above the range. Precise Input never silently clamps.
- When `stickToMarkers` is active, accept only an effective marker. Do not silently snap.
- Represent validation as a discriminated result with explicit reasons rather than a mixed
  string/number/null value.

## Localization and settings

- Read Discord's current UI locale from `LocaleStore.locale`, not `navigator.language`.
- React UI that must follow runtime changes subscribes through `useStateFromStores`.
- Keep English and Traditional Chinese dictionaries together behind typed keys and one
  interpolation function. Missing Traditional Chinese keys fall back to English; missing
  English keys warn once and render the key rather than throwing.
- Full runtime-localized settings require an `OptionType.COMPONENT` settings UI because
  standard setting metadata is static. This is an MVP phase, not part of the wheel PoC.
- Initial settings: Precise Input enabled, Wheel Adjustment enabled, Shift multiplier `5`,
  Ctrl multiplier `10`, and reverse wheel disabled. Multipliers must be finite and limited
  to a documented positive range such as `1..100`.

## Architecture boundaries

- `index.ts`/`index.tsx`: plugin metadata, source patches, and thin runtime adapters; use
  `.tsx` only once the module contains JSX.
- `sliderUtils.ts`: pure Effective Slider Contract math for Wheel Adjustment.
- `validation.ts`: pure Precise Input parsing and allowed-value validation.
- `i18n.ts`: locale normalization, dictionaries, interpolation, and fallbacks.
- `components/ValueInputModal.tsx`: modal state and rendering only.
- `settings.tsx`: persisted settings and the reactive localized settings component.
- `tests/`: public-seam behavior tests for pure modules.

Runtime event handlers catch unexpected failures, report actionable context through a
deduplicated `Logger("BetterSliders")`, and return without suppressing native behavior.

## Interaction, accessibility, and performance rules

- Attach interactions to the Slider root so the bar, handle, markers, labels, and nested
  children behave consistently. Do not patch a generated child class.
- Do not open a Modal, create a timer, or perform a webpack lookup on every wheel event.
  Resolve component/module dependencies once or lazily at module scope.
- Treat each discrete wheel or trackpad event as one directional adjustment regardless of
  `deltaMode` or magnitude. Add normalization/debounce only after measured touchpad evidence.
- An invalid or non-finite current value disables the enhancement. A finite value outside
  the current range is not changed during render; only an explicit user interaction may
  move it according to normal range policy.
- Native Slider rerendering owns handle position, width, and transform. BetterSliders never
  writes visual position directly.
- Build the Modal from existing Discord/Vencord Modal, TextInput, Button, Text, and Forms
  primitives. Inputs need a visible label or `aria-label`; errors should be associated with
  `aria-describedby`; Apply uses native disabled semantics.
- Verify dark, light, and custom themes. Any plugin CSS uses Discord variables and the
  `vc-better-sliders-` namespace.
- Production code must not log per-wheel values. Debug traces are temporary, removable,
  and never committed.

## Delivery phases

### Milestone 0 — Repository and durable guidance

- Configure GitHub Issues, triage roles, domain routing, and this Roadmap.
- Keep the one-time drafting source out of Git and remove it after this Roadmap is verified.
- Treat this fork as the delivery target. Any future upstream contribution requires a
  human-led rewrite and human-authored communication under Vencord's contribution policy.

### Milestone 1 — Runtime discovery and wheel tracer

- Build a development bundle and inspect the current Discord Slider module.
- Record state, defaults, markers, keyboard behavior, callbacks, and context-menu behavior.
- Establish a fail-open global component seam using stable anchors.
- Implement one wheel event → one native logical adjustment for dynamic integer ranges.
- Verify final props reflect VolumeBooster without any named integration.

Status: the component seam, live controlled value, native commit path, VolumeBooster
boundary, non-passive root listener lifecycle, and handled-wheel page-scroll cancellation
are verified. Callback order/count and real native context-menu coexistence are also runtime
verified. Marker sorting, duplicate, and tie cases remain open.

### Milestone 2 — Pure value policies

- Add vertical-slice tests for wheel direction, bounds, modifiers, fractional precision,
  invalid contracts, and marker navigation.
- Implement the minimum pure policy required by each failing test.
- Cover dynamic ranges (`0..100`, `0..200`, `0..1000`), negative minima, and fractional
  steps.

Status: the first public-seam suite covers dynamic positive and negative bounds through
`1000`, direction, modifier priority, reverse direction, fractional precision, marker
navigation, disabled state, and invalid contracts. Runtime callback coverage is complete for
the observed continuous and marker interactions. A shared vertical Slider was unavailable in
the exercised Discord build and remains explicitly unverified.

### Milestone 3 — Precise Input

- Add parsing and range-validation slices before Modal integration.
- Build the native Modal with focus/select, Apply/Cancel, Enter/Escape, accessible labels,
  disabled Apply, and localized errors.
- Add marker-only validation and safe value formatting.

Status: strict decimal syntax, finite/range/step/marker validation, safe display formatting,
and their pure tests are implemented. Discord Stable runtime acceptance covers direct
right-click fallback, initial focus/select, Traditional Chinese UI and range errors,
disabled Apply, valid Enter commit, Cancel without commit, and secondary-button drag
suppression. The event-order regression currently has no correct automated seam without
mocking Discord internals, so it retains a Discord runtime acceptance check. Native context-menu
coexistence, Escape priority, marker UI, and additional Slider consumers are now runtime
verified on the named Stable build.

### Milestone 4 — Localization and settings

- Add English and Traditional Chinese dictionaries and explicit fallback tests.
- Subscribe Modal and custom settings UI to Discord locale changes.
- Add validated feature toggles, multipliers, and reverse-wheel behavior.

Status: English and Traditional Chinese dictionaries, interpolation, explicit locale
fallback tests, reactive Modal locale subscription, validated persisted settings, and the
custom localized settings component are implemented. Discord runtime acceptance passed for
the settings UI, runtime locale change, immediate feature toggles, Shift/Ctrl multipliers,
reverse-wheel behavior, persistence, and consistent native `TextInput.error` validation for
`0`, `101`, and `1.5`.

### Milestone 5 — Compatibility and release evidence

- Exercise user volume, stream volume, other Discord settings, a Vencord-created Slider,
  vertical orientation where available, disabled state, and native context-menu coexistence.
- Exercise VolumeBooster-modified ranges and at least one non-volume dynamic range.
- Run unit tests, typecheck, lint, stylelint, plugin list generation, and standalone build.
- Document all runtime cases not exercised; do not convert assumptions into claims.

The evidence classes, completed results, source-only candidates, and pending runtime matrix
are maintained in [`COMPATIBILITY.md`](./COMPATIBILITY.md).

Status: the evidence ledger and static consumer inventory are established. Runtime checks now
cover a native Discord microphone-volume Slider, VolumeBooster-modified `0..1000` user- and
stream-volume Sliders, and Vencord continuous, marker, and disabled consumers. User and stream
volume both passed exact input above 200, upper-bound rejection, boundary commit, and restoration;
stream ordinary wheel and secondary-button suppression also passed while preserving its native
menu. Dark, Discord Light, and the installed Vencord Local Theme `Fallout 4 Terminal` were visually
accepted, after which the user's original Dark preset and disabled Local Theme state were restored.
A source and UI search found no shared vertical Slider on this build, so that row is explicitly
recorded as unavailable rather than passed. Stable-key replacement is covered by a two-trigger
coordinator test. Although the desktop driver cannot hold Shift/Ctrl while sending a wheel event,
the project owner manually accepted Shift/Ctrl-plus-wheel adjustment on both live-stream and user-
volume Sliders. Stream Cancel and native primary-button drag also passed with exact restoration to
`100`. Temporary runtime instrumentation completed callback order/count coverage for wheel,
keyboard, pointer, Apply, Enter, Cancel, Escape, clamped no-op, and marker wheel paths, then was
removed before commit. The final release-candidate automated pipeline passed. The earlier
mouse-Apply click-through observation remains non-repeatable. Marker sorting, duplicate, and tie
runtime cases and the explicit pending matrix repetitions remain, so BetterSliders is not
release-ready.

## Acceptance scenarios

1. `0..100`, current `50`: wheel up produces `51`; wheel down returns to `50`.
2. `0..1000`, current `500`: Precise Input `750` commits exactly `750`.
3. Out-of-range `1001` is rejected and Apply remains disabled.
4. `abc`, `50abc`, `12.3.4`, `NaN`, infinities, and `1e3` are rejected.
5. `.5` and a permitted negative decimal are accepted.
6. Wheel remains at max/min when moving beyond a boundary.
7. Step `0.1` never exposes `0.30000000000000004`.
8. Markers `[1, 2, 4, 8]` with marker sticking navigate in marker order; Precise Input `3`
   is rejected.
9. English renders English, explicit Traditional Chinese renders Traditional Chinese, and
   Japanese or Simplified Chinese renders English.
10. A runtime locale change updates newly opened UI and, where subscribed, existing UI.
11. Disabled or invalid Sliders produce no BetterSliders action and preserve native events.
12. VolumeBooster-modified final max values appear without a VolumeBooster dependency.
13. Right-clicking away from the current handle opens Precise Input without first changing
    the Slider value; left-click dragging remains native.
14. Opening Precise Input preserves its source context menu and renders above it; a later
    Precise Input trigger replaces the existing dialog so dialogs do not stack.

## Known constraints

- Custom components that do not use Discord's shared Slider are out of scope.
- Fake DOM/CSS sliders are out of scope.
- Hidden business scaling not exposed by the UI Slider contract is out of scope.
- Discord bundle changes can invalidate the patch; failure must leave native Sliders intact.
- Runtime claims are limited to the Discord Stable build and Slider contexts explicitly
  listed in the delivery evidence.

## Delivery checklist

- Report unit, type, lint, style, plugin-list, and standalone-build results separately.
- Report which Discord Slider contexts were exercised and which remain untested.
- Report branch, Worktree, commit, push, PR, merge, and cleanup state explicitly.
- Do not call the plugin release-ready while required Milestone 5 compatibility scenarios
  remain unverified.
