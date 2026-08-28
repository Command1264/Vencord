# BetterSliders compatibility evidence

This document is the evidence ledger for Milestone 5. A source-level compatibility path is
not a runtime result: each entry below states exactly which kind of evidence exists.

## Evidence classes

- **Runtime verified** — directly exercised against the named Discord build.
- **User-reported manual acceptance** — the project owner completed the listed manual steps
  and reported the result in the project acceptance conversation. The conversation is not
  stored in this repository, so these entries intentionally have no source-code citation.
- **Static evidence only** — established from repository source, tests, or an ADR, but not
  exercised in Discord for this milestone.
- **Not exercised** — no qualifying runtime result has been recorded. This is a release
  evidence gap, not a failure claim.

## Evidence baseline

| Item | Recorded value |
| --- | --- |
| Discord client | Stable `1.0.9255` |
| Vencord base | `bc680139be4526aa5525d33fbac8a271eb0cfd02` |
| BetterSliders evidence HEAD | `fee196b515f5bff9d590c82b39ba82d949422b9d` |
| Branch | `codex/feat/better-sliders-poc` |
| Remote state at evidence capture | `origin/codex/feat/better-sliders-poc` at the same HEAD |

The Discord version and base-bound runtime discoveries are recorded in the
[Roadmap](./ROADMAP.md#effective-slider-contract-discovery),
[ADR 0001](../adr/0001-enhance-the-shared-slider-component.md), and
[ADR 0002](../adr/0002-bind-slider-root-interactions.md). Runtime conclusions in this
document are limited to that build and the explicitly named consumers.

## Runtime verified

| Scenario | Result | Evidence boundary |
| --- | --- | --- |
| Speaker-volume wheel adjustment | A handled wheel event changed the displayed value and did not move the Voice & Video settings page. | Runtime result recorded in the [Roadmap](./ROADMAP.md#effective-slider-contract-discovery) and the accepted non-passive root binding in [ADR 0002](../adr/0002-bind-slider-root-interactions.md). |
| Precise Input direct fallback | Right-click opened the modal when no native Slider context menu opened; initial focus/select, Traditional Chinese text, range error, disabled Apply, valid Enter commit, and Cancel-without-commit were exercised. | Runtime result recorded under [Milestone 3](./ROADMAP.md#milestone-3--precise-input); implementation path is in [`index.ts`](../../src/plugins/betterSliders/index.ts) and [`ValueInputModal.tsx`](../../src/plugins/betterSliders/components/ValueInputModal.tsx). |
| Secondary-button drag suppression | Right-clicking at the 10% position while the live value was 100 left the value unchanged and opened Precise Input at 100; a primary-button interaction at the same position still changed the native Slider to 10. | Runtime regression acceptance for the capture listeners implemented in [`index.ts`](../../src/plugins/betterSliders/index.ts), consistent with [ADR 0002](../adr/0002-bind-slider-root-interactions.md). |
| VolumeBooster boundary discovery | Runtime inspection established that the shared Slider's final props/state expose the effective range after VolumeBooster changes the caller-supplied maximum. | This verifies the **final-props boundary only**, as recorded in the [Roadmap](./ROADMAP.md#effective-slider-contract-discovery) and [ADR 0001](../adr/0001-enhance-the-shared-slider-component.md). It does not establish end-to-end wheel or Precise Input behavior above 200. |
| Discord microphone-volume Slider | On the Voice & Video page, right-clicking away from the handle opened Precise Input at the unchanged value `100`; one wheel event moved it to `99`; entering `100` and pressing Enter restored the original value. | Runtime result on the named Stable baseline. This verifies one native Discord settings Slider, not user-volume or stream-volume consumers. |
| Vencord continuous Slider | Notification Timeout (`0..20000`) opened Precise Input at the unchanged live value `5000` after a right-click away from the handle. Exact input `7500` committed, one wheel event moved `5000` to `4999`, and the original `5000` was restored. | Runtime result on Vencord Notification Settings. Modifier, reverse-wheel, persistence, and both bounds were not repeated on this consumer. |
| Vencord marker Slider | Notification Log Limit (`[0, 25, 50, 75, 100, 200]`) opened at the unchanged live value `50`; one wheel event moved to the adjacent marker `25`; off-marker `3` produced one localized error and disabled Apply; marker `75` committed. The original `50` was restored. | Runtime result on Vencord Notification Settings. The `200 -> ∞` endpoint was not exercised. |
| Disabled Vencord Slider | Selecting “Always use Desktop notifications” visually disabled Notification Timeout. Right-click opened no Precise Input dialog and a wheel event left its value and page position unchanged. The original notification style was restored. | Runtime result on Vencord Notification Settings. |
| VolumeBooster user-volume Slider | The native user context menu exposed an effective `0..1000` range. Right-click opened Precise Input without closing the user menu or changing `113.419`; the modal normalized the field to `113`. One wheel event moved `113.419 -> 112.419`; exact input `250` committed; `1001` produced one localized upper-bound error with Apply disabled; and boundary `1000` committed. | End-to-end runtime result on the named Stable baseline. The user was temporarily locally muted for above-200 checks, then restored to unmuted. The final volume was restored to `113`; the original pointer residue `.419` was not recoverable through the integer-step Precise Input path. |
| VolumeBooster stream-volume Slider | The live-stream context menu exposed `直播音量 73.2688` and accepted one BetterSliders wheel step to `72.2688` without closing the menu. A following inverse wheel step restored exactly `73.2688`. | Runtime result for the wheel path and effective range consumer. Shift/Ctrl, exact input above 200, bounds, and native drag were not completed. The stream was returned to its original unmuted state. |
| Stream secondary-button regression and fix | Before the fix, right-clicking the visible stream-volume handle changed `73.2688` to the pointer-derived `91.3979`. After suppression was added, the same context-menu path at `182.796` opened one Precise Input dialog while the exact live value remained `182.796`. A later layering run opened at displayed value `183` without changing it. | Reproducible regression followed by runtime acceptance on the same Discord Stable build. The later run kept the source stream menu open and showed the Modal above its overlapping area. |
| Precise Input Modal coordination | Opening Precise Input from a user-volume menu kept the native menu visible beneath the Modal. The first Escape closed only Precise Input, a second Escape closed the preserved menu, and a secondary-button press on the dimmed background left both surfaces open. | Runtime verified for event priority, background-menu inertness, and restoration of native menu behavior after Modal close. Layering and single-dialog replacement remain covered by the earlier stream run and coordinator test. |
| Native wheel value feedback | A user-volume wheel step displayed Discord's native `105%` Tooltip even though the pointer was on the track away from the grabber. The Tooltip disappeared after the 1000 ms ownership window, and the test volume was restored exactly to `110`. | Runtime verified on the named Stable baseline for native percent formatting, transient visibility, ref-rerender survival, and state restoration. Consumer-provided custom `onValueRender` output still needs a separate runtime pass. |

## User-reported manual acceptance

The project owner reported the Settings MVP accepted after reloading Discord and exercising
the checklist. This establishes the following manual results for the evidence HEAD:

| Scenario | Reported result |
| --- | --- |
| Settings surface and locale | All five settings were visible; Traditional Chinese rendered correctly; switching Discord to English updated the settings UI. |
| Precise Input toggle | Turning it off returned right-click behavior to Discord and did not open Precise Input or change the value. |
| Wheel Adjustment toggle | Turning it off stopped BetterSliders wheel changes and preserved normal page scrolling. |
| Shift/Ctrl multipliers | Both configured multipliers took effect immediately. |
| Reverse Wheel | The direction toggle took effect immediately. |
| Persistence | Settings remained after `Ctrl+R`. |
| Multiplier validation | `0`, `101`, and `1.5` each produced one consistent Discord/Vencord `TextInput.error` warning after commit `fee196b5`; invalid values did not replace the prior valid setting. |

The five persisted settings, defaults, and runtime normalization are visible in
[`settings.tsx`](../../src/plugins/betterSliders/settings.tsx) and
[`settingsUtils.ts`](../../src/plugins/betterSliders/settingsUtils.ts). The runtime adapters
read the effective settings for each interaction in
[`index.ts`](../../src/plugins/betterSliders/index.ts).

## Static evidence only

### Vencord Notification Settings consumer contracts

[`NotificationSettings.tsx`](../../src/components/settings/tabs/vencord/NotificationSettings.tsx)
provides the contracts behind three shared-Slider shapes that were runtime exercised above:

| Consumer shape | Static contract | Compatibility value |
| --- | --- | --- |
| Notification Timeout | `minValue={0}`, `maxValue={20_000}`, markers through 20,000, `stickToMarkers={false}` | Non-volume, continuous dynamic range with custom seconds rendering. |
| Notification Log Limit | `minValue={0}`, `maxValue={200}`, markers `[0, 25, 50, 75, 100, 200]`, `stickToMarkers={true}` | Marker-only navigation and a custom `200 -> ∞` renderer. |
| Disabled Notification Timeout | `disabled={settings.useNative === "always"}` | A real Vencord consumer for checking that BetterSliders neither handles input nor suppresses native wheel/context-menu behavior while disabled. |

## Runtime anomaly investigated during Milestone 5

One mouse-operated Apply attempt on the Notification Log Limit Precise Input dialog produced
an apparent click-through: the marker value committed, the dialog closed, and the underlying
Notification Timeout Slider moved from `5000` to `13381` at the same pointer location. Applying
with Enter did not reproduce the effect, and both affected settings were restored.

The follow-up investigation repeated the same `50 -> mouse Apply 75` path five consecutive
times at the same screen position. Every run committed Log Limit to `75` while Timeout stayed
at `5000`; Log Limit was restored to `50` after the loop. No red-capable product repro could be
established, so no speculative production change or implementation-coupled test was added.
The original observation remains recorded as a likely automation/event-timing anomaly and is
not an active release blocker unless it recurs under a repeatable user or runtime path.

### Pure-policy and implementation coverage

- [`sliderUtils.test.ts`](../../src/plugins/betterSliders/tests/sliderUtils.test.ts) covers
  direction, modifier priority, reverse direction, clamping, bounds through `1000`, negative
  minima, fractional precision, marker navigation, disabled contracts, invalid contracts,
  and zero-axis events. These are unit results, not Discord callback or consumer evidence.
- [`settingsUtils.test.ts`](../../src/plugins/betterSliders/tests/settingsUtils.test.ts) covers
  all five defaults and persisted choices, per-field fallback, non-finite/fractional/out-of-range
  multiplier rejection, and inclusive `1..100` boundaries.
- [`runtimeUtils.test.ts`](../../src/plugins/betterSliders/tests/runtimeUtils.test.ts) covers
  full secondary-event cancellation, two consecutive Precise Input requests, first-Escape
  priority, inert background secondary-button paths with cleanup, class-free common-ancestor
  branch discovery, the reset/disposal contract for 1000 ms transient visibility, and deferred
  cleanup that distinguishes a rerender ref handoff from a real detach.
- [`index.ts`](../../src/plugins/betterSliders/index.ts) reads live final props/state at event
  time, delegates handled changes once through native `commitValue`, skips disabled/invalid
  contracts, and only then prevents the wheel default. Static inspection alone cannot prove
  callback order/count in the Discord bundle.
- [`volumeBooster/index.ts`](../../src/plugins/volumeBooster/index.ts) changes the caller's
  `maxValue` expression for user and stream volume. BetterSliders has no named VolumeBooster
  dependency and consumes the shared Slider's final runtime props/state instead, as required
  by [ADR 0001](../adr/0001-enhance-the-shared-slider-component.md).

## Milestone 5 compatibility matrix

| Scenario | Current evidence | Status | Pending manual step |
| --- | --- | --- | --- |
| User/speaker volume | A named user-volume consumer exposed `0..1000`; wheel, Precise Input, `250`, invalid `1001`, boundary `1000`, and native user-menu coexistence were exercised. The original `113.419` was restored to the normalized integer `113`. | **Runtime verified** for the listed paths. | Exercise Shift/Ctrl, reverse wheel, native drag, both bounds through wheel, and exact residue restoration behavior on the release candidate. |
| Stream volume | A live stream exposed `73.2688`; one wheel step produced `72.2688` and an inverse step restored it. The secondary-button failure changed `73.2688 -> 91.3979`; after suppression was added, a second live-stream run preserved `182.796`. A later run kept the stream menu open, opened one unobscured Precise Input dialog at displayed value `183`, and placed the dialog above the menu's overlapping area. | **Runtime verified** for ordinary wheel, secondary-button suppression, context-menu preservation/layering, and one visible Precise Input dialog. | Exercise Shift/Ctrl, bounds, exact input above 200, Cancel, and native drag. Repeat rapid consecutive triggering manually if runtime evidence beyond the coordinator test is required. |
| Other Discord settings Slider | Voice & Video microphone volume was exercised at `100`: right-click-away preserved the value, one wheel event moved to `99`, and Enter restored `100`. | **Runtime verified** for one native continuous Slider. | Repeat native drag and bounds on the release candidate; choose another non-volume Slider if available. |
| Vencord continuous Slider | Notification Timeout was exercised for right-click suppression, `7500` exact input, one-step wheel movement, and restoration to `5000`. | **Runtime verified** for the listed paths. | Exercise Shift/Ctrl/reverse, both bounds, and persistence on the release candidate. |
| Vencord marker Slider | Notification Log Limit was exercised for adjacent-marker wheel movement (`50 -> 25`), valid marker `75`, off-marker `3`, right-click suppression, and restoration to `50`. Five follow-up mouse-Apply repetitions left the underlying Timeout at `5000`. | **Runtime verified** for the listed paths; the earlier one-off click-through observation was **not reproduced**. | Exercise both endpoints and the `200 -> ∞` display; reopen the anomaly only if a repeatable path changes another Slider. |
| Vertical Slider | Pure math is orientation-independent, but no vertical shared-Slider consumer or runtime event direction has been recorded. | **Not exercised**. | Locate an available shared vertical Slider; if none exists in this build, explicitly record “not available” with the search locations. Otherwise exercise both orientations without assuming direction. |
| Disabled Slider | Disabled Notification Timeout ignored right-click and wheel input, opened no Precise Input, and did not move the page or value. | **Runtime verified** on the named Vencord consumer. | Repeat on the release candidate and verify any consumer-specific native behavior that exists. |
| Native context-menu coexistence | Consumer context menus remain available, stream wheel input leaves its menu open, and Precise Input preserves the active stream menu while temporarily elevating its Modal above the overlapping menu area. | **Runtime verified** for stream menu availability, wheel coexistence, menu preservation, and Precise Input layering. The earlier user-menu run predates the layer-elevation policy. | Retest both user and stream menus on the release candidate, including one manual rapid-repeat trigger. |
| VolumeBooster-modified user/stream range | User volume exposed `0..1000` and accepted exact `250` plus boundary `1000`, while rejecting `1001`. Stream volume passed ordinary wheel restoration at `73.2688` and the fixed right-click path at `182.796`. | **Runtime verified end to end** for the listed user-volume paths; **partial** for stream. | Exercise exact stream input above 200, upper bound, modifiers, and native drag. |
| Dark, light, and custom themes | Settings, modal, focus, localized error, and disabled state were visually inspected in the active dark theme. Light and custom themes were not changed. | **Runtime verified: dark only** / **light and custom not exercised**. | Inspect the same surfaces in light and one custom theme, then restore the user's theme. |
| Callback order/count | Runtime code calls `commitValue` once for one handled discrete action; native callback behavior has not been measured. | **Static evidence only** / **not exercised**. | Instrument a representative Slider and record callback order/count for drag, keyboard, wheel, valid Apply/Enter, Cancel/Escape, bounds, and marker moves. Remove instrumentation before commit. |

## Validation record

Only completed checks reported during implementation are listed as passed. A later code change
must rerun the relevant checks before release.

| Validation | Recorded result | Scope caveat |
| --- | --- | --- |
| `pnpm test:better-sliders` | **Passed: 35/35** in the current working tree after the event-priority and native wheel-tooltip changes. | Pure BetterSliders suites only. |
| TypeScript (`pnpm testTsc`) | **Passed** in the current working tree after the menu-preserving layer fix. | Reported implementation check. |
| ESLint (`pnpm lint src/plugins/betterSliders`) | **Passed** in the current working tree after the menu-preserving layer fix. | Plugin-scoped lint result. |
| Discord desktop build (`pnpm build`) | **Passed** in the current working tree after the menu-preserving layer fix. | Build success is not a consumer compatibility run. |
| Full [`pnpm test`](../../package.json) pipeline | **Passed** in the current working tree after the event-priority and native wheel-tooltip changes, including standalone build, TypeScript, ESLint, stylelint, and plugin-list generation. | This is an automated build/static-validation result, not a Discord consumer compatibility run. |

Before release, rerun the complete `pnpm test` pipeline at the final release candidate and
record its commit. Keep every unexercised matrix row explicit; the current evidence does not
justify calling Milestone 5 or the plugin release-ready. Reopen the mouse-Apply anomaly only
if a repeatable user or runtime path reproduces it.
