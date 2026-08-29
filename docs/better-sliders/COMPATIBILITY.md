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
| BetterSliders product-code HEAD | `a7084b87c9fbb1d5dbbd1e59f934e917ad6da0f6` |
| Callback measurement checkout | `aa397776` (documentation-only commit above the product-code HEAD) |
| Branch | `codex/feat/better-sliders-poc` |
| Remote state at callback capture | `origin/codex/feat/better-sliders-poc` at `67c52b7ecbf2f42782a6f2160d68167808bc824e` |
| Instrumentation disposition | Temporary and uncommitted; removed before this evidence update |

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
| Vencord continuous Slider | Notification Timeout (`0..20000`) opened Precise Input at the unchanged live value `5000` after a right-click away from the handle. Exact input `7500` committed, and the final RC repeat showed the consumer-native `5.00s` wheel Tooltip before restoring exact `5000`. | Runtime result on Vencord Notification Settings. Modifier, reverse-wheel, persistence, and both bounds were previously accepted through the plugin settings and shared policy rather than repeated on this consumer. |
| Vencord marker Slider | Notification Log Limit (`[0, 25, 50, 75, 100, 200]`) opened at the unchanged live value `50`; the final RC repeat moved `50 -> 25 -> 0`, confirmed a lower-bound no-op, accepted exact marker `200` with the native `∞` display, confirmed an upper-bound no-op, and restored `200 -> 100 -> 75 -> 50`. Off-marker `3` still produced one localized error with Apply disabled. | Runtime result on Vencord Notification Settings, including both endpoints and the custom endpoint renderer. |
| Disabled Vencord Slider | Selecting “Always use Desktop notifications” visually disabled Notification Timeout. Right-click opened no Precise Input dialog and a wheel event left its value and page position unchanged. The original notification style was restored. | Runtime result on Vencord Notification Settings. |
| VolumeBooster user-volume Slider | The native user context menu exposed an effective `0..1000` range. Right-click opened Precise Input without closing the user menu or changing `113.419`; the modal normalized the field to `113`. One wheel event moved `113.419 -> 112.419`; exact input `250` committed; `1001` produced one localized upper-bound error with Apply disabled; and boundary `1000` committed. | End-to-end runtime result on the named Stable baseline. The user was temporarily locally muted for above-200 checks, then restored to unmuted. The final volume was restored to `113`; the original pointer residue `.419` was not recoverable through the integer-step Precise Input path. |
| VolumeBooster stream-volume Slider | The live-stream context menu exposed `直播音量 73.2688` and accepted one BetterSliders wheel step to `72.2688` without closing the menu. A following inverse wheel step restored exactly `73.2688`. | Runtime result for the wheel path and effective range consumer. That earlier run did not complete Shift/Ctrl, exact input above 200, bounds, or native drag; the later extended-range row closes the exact-input and boundary gaps. The stream was returned to its original unmuted state. |
| Stream-volume extended range | A later release-candidate run opened the live-stream Precise Input dialog at the unchanged original value `100` with an effective `0..1000` range. Exact `250` committed, `1001` produced one localized upper-bound error with Apply disabled, and boundary `1000` committed. Entering `250` and choosing Cancel kept `100`. A native primary-button drag then changed the live value to `338.71` and showed native `339%` feedback; Precise Input restored exact `100`, confirmed through the native menu's accessibility value. | End-to-end runtime evidence for stream exact input above 200, upper-bound rejection, boundary commit, Cancel, native drag preservation, native menu preservation, and exact restoration. Shift/Ctrl wheel input remains unexercised because the desktop driver cannot hold a modifier while sending a wheel event. |
| Stream secondary-button regression and fix | Before the fix, right-clicking the visible stream-volume handle changed `73.2688` to the pointer-derived `91.3979`. After suppression was added, the same context-menu path at `182.796` opened one Precise Input dialog while the exact live value remained `182.796`. A later layering run opened at displayed value `183` without changing it. | Reproducible regression followed by runtime acceptance on the same Discord Stable build. The later run kept the source stream menu open and showed the Modal above its overlapping area. |
| Precise Input Modal coordination | Opening Precise Input from a user-volume menu kept the native menu visible beneath the Modal. The first Escape closed only Precise Input, a second Escape closed the preserved menu, and a secondary-button press on the dimmed background left both surfaces open. | Runtime verified for event priority, background-menu inertness, and restoration of native menu behavior after Modal close. Layering and single-dialog replacement remain covered by the earlier stream run and coordinator test. |
| Native wheel value feedback | A user-volume wheel step displayed Discord's native `105%` Tooltip even though the pointer was on the track away from the grabber. The Tooltip disappeared after the 1000 ms ownership window, and the test volume was restored exactly to `110`. | Runtime verified on the named Stable baseline for native percent formatting, transient visibility, ref-rerender survival, and state restoration. Consumer-provided custom `onValueRender` output still needs a separate runtime pass. |
| Custom native wheel value feedback | A Notification Timeout wheel step displayed the consumer's native `5.06s` value bubble. After the 1000 ms ownership window, visibility returned to Discord's normal hover behavior; the value was restored to `5s`. Notification Log Limit was also restored to `50` after marker-slider diagnostics. | Runtime verified on the named Stable baseline for a consumer-formatted continuous Slider. The marker Slider does not render a native hover bubble, so BetterSliders deliberately adds no duplicate label. |
| Light and custom theme surfaces | In Discord Light, the BetterSliders settings dialog and Precise Input dialog were visually inspected with their native menu/Modal layering intact. The same surfaces were inspected with the installed Vencord Local Theme `Fallout 4 Terminal`; the theme supplied its own typography, colors, borders, and focus styling without breaking layout or interaction. | Runtime visual evidence on the named Stable baseline. The Local Theme was disabled afterward and Discord was restored to the user's original second Dark preset. User volume remained `110`; stream volume was restored to `100`. |
| Shared Slider callback order/count | Continuous wheel, native keyboard, Precise Input Enter, and Precise Input Apply each produced one `commitValue`, then one `asValueChanges`, then one `onValueChange`. A marker wheel move produced one `commitValue(value, markerIndex)` and one `onValueChange`, with no `asValueChanges`. Cancel, Escape, and continuous/marker boundary no-ops produced no callbacks. Native pointer input bypassed `commitValue`: `asValueChanges` followed movement and `onValueChange` fired once at the end. | Runtime traces from microphone volume and Notification Log Limit on the named Stable baseline. A pointer click emitted one interim callback; the sampled drag emitted two because the automation generated two movement updates. In this build the final pointer `onValueChange` argument was the pre-interaction value while interim callbacks carried movement values; this records native behavior, not a BetterSliders transformation. Temporary instrumentation was removed before commit, and microphone volume `100` plus Log Limit `50` were restored exactly. |
| Marker duplicate and tie policy | Temporary diagnostic Sliders confirmed that duplicate markers at the current value did not trap a wheel event and that an equidistant off-marker value moved to the lower or upper marker according to wheel direction. | Targeted runtime diagnostics on the named Stable baseline. The diagnostic UI used local React state only, was removed before the formal product build, and persisted no settings. Invalid unsorted/out-of-range lists are covered at the pure-policy seam and fail open. |
| Final RC repeat | Microphone volume moved `100 -> 99 -> 100` with native percent feedback. Notification Timeout showed `5.00s`; Notification Log Limit exercised both endpoints and `∞`; disabled Timeout ignored wheel/right-click and its enabling setting was restored. User volume kept its native menu open, showed native `110%`, layered Precise Input above the menu, closed Modal then menu across two Escapes, rejected `1001` once, accepted `1000`, and restored `110`. Stream volume kept its menu open, showed native `100%`, layered Precise Input above it, accepted `250`, and restored `100`. | Direct release-candidate repeat on Discord Stable `1.0.9255`. All touched values and notification style were restored; Discord was returned to its original voice-grid state. Stable-key replacement remains directly covered by the two-trigger coordinator test because the Modal intentionally makes background retrigger paths inert. |
| Portable UserPlugin RC | The deterministic `better-sliders-userplugin-v0.1.0-dev.zip` from source commit `a502a955b62c2f084bd5a19428ed4dd2b08df774` was extracted to `src/userplugins/betterSliders` in a clean detached upstream checkout, built, injected, and loaded by Discord. BetterSliders appeared enabled with the `NEW` marker, its settings opened with persisted Shift `5`, Ctrl `10`, and reverse-wheel values, microphone volume moved `100 -> 99 -> 100` with native `99%` feedback, and Precise Input rendered above the preserved native audio menu. One Escape closed Precise Input while leaving that menu open. | Distinct runtime acceptance of the packaged UserPlugin path on Discord Stable `1.0.9255` and upstream Vencord `bc680139be4526aa5525d33fbac8a271eb0cfd02`. Archive SHA-256: `b3c317df02860e8b6ae407cbcc76dcfef7a11e1e53fc35154958db314d772574`. User- and stream-volume behavior was not repeated in this packaging-only pass; those consumers remain covered by the identical-source final RC rows above. |

## User-reported manual acceptance

The project owner reported the Settings MVP accepted after reloading Discord and exercising
the checklist. This establishes the following manual results for the evidence HEAD:

| Scenario | Reported result |
| --- | --- |
| Settings surface and locale | All five settings were visible; Traditional Chinese rendered correctly; switching Discord to English updated the settings UI. |
| Precise Input toggle | Turning it off returned right-click behavior to Discord and did not open Precise Input or change the value. |
| Wheel Adjustment toggle | Turning it off stopped BetterSliders wheel changes and preserved normal page scrolling. |
| Shift/Ctrl multipliers | Both configured multipliers took effect immediately. |
| Shift/Ctrl on VolumeBooster consumers | With the configured Shift `5` and Ctrl `10` multipliers, the project owner manually verified modifier-plus-wheel adjustment on both the live-stream volume Slider and a user-volume Slider. Both consumers adjusted normally. |
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

### Vertical Slider availability search

A repository-wide search of `src/**/*.ts` and `src/**/*.tsx` on the evidence HEAD found no
explicit vertical orientation on a shared Slider consumer. Source-authored Slider usages were
limited to BetterSliders' runtime enhancement, Vencord Notification Settings, and the generic
plugin [`SliderSetting.tsx`](../../src/components/settings/tabs/plugins/components/SliderSetting.tsx).
The only source match combining `orientation` with `"vertical"` belongs to the required
`ConcatenatedComponentExtractor` scroller patch, not a Slider. No user-visible shared vertical
Slider was available in the exercised Discord build, so runtime direction cannot be claimed.

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
  minima, fractional precision, marker navigation, duplicate skipping, direction-resolved
  off-marker ties, malformed marker lists, disabled contracts, invalid contracts, and zero-axis
  events. These are unit results, not Discord callback or consumer evidence.
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
  contracts, and only then prevents the wheel default. The runtime callback row above verifies
  the resulting observed callback order/count; production source remains uninstrumented.
- [`volumeBooster/index.ts`](../../src/plugins/volumeBooster/index.ts) changes the caller's
  `maxValue` expression for user and stream volume. BetterSliders has no named VolumeBooster
  dependency and consumes the shared Slider's final runtime props/state instead, as required
  by [ADR 0001](../adr/0001-enhance-the-shared-slider-component.md).

## Milestone 5 compatibility matrix

| Scenario | Current evidence | Status | Pending manual step |
| --- | --- | --- | --- |
| User/speaker volume | A named user-volume consumer exposed `0..1000`; wheel, Precise Input, `250`, invalid `1001`, boundary `1000`, native Tooltip, user-menu coexistence, Modal layering, and two-stage Escape were exercised. The final RC repeat restored exact `110`. The project owner separately reported Shift/Ctrl-plus-wheel behavior working normally on user volume. | **Runtime verified** for the directly exercised paths; **user-reported manual acceptance** for Shift/Ctrl wheel input. | Repeat only after a material shared-Slider, menu, or VolumeBooster change. |
| Stream volume | The final RC repeat exercised ordinary wheel with native `100%` feedback, menu preservation, Precise Input layering, exact `250`, and exact restoration to `100`. Earlier runs also covered invalid `1001`, boundary `1000`, Cancel, native drag, and secondary-button suppression. The project owner separately reported Shift/Ctrl-plus-wheel behavior working normally. | **Runtime verified** for ordinary wheel, secondary-button suppression, context-menu preservation/layering, exact input above 200, upper-bound rejection, boundary commit, Cancel, native drag, and restoration; **user-reported manual acceptance** for Shift/Ctrl wheel input. | Stable-key replacement is covered by the two-trigger coordinator test; repeat runtime checks after a material menu/Modal change. |
| Other Discord settings Slider | Voice & Video microphone volume was repeated at `100`: one wheel event moved to `99` with native `99%` feedback and the inverse event restored `100` with native `100%` feedback. | **Runtime verified** for one native continuous Slider on the final RC. | Choose another native non-volume Slider if a future build exposes one with a materially different contract. |
| Vencord continuous Slider | Notification Timeout was repeated at exact `5000` and displayed its consumer-native `5.00s` wheel feedback before exact restoration. | **Runtime verified** on the final RC for the listed paths. | Repeat after a material consumer formatting or shared-Slider change. |
| Vencord marker Slider | Notification Log Limit was repeated through `50 -> 25 -> 0`, lower no-op, exact `200 -> ∞`, upper no-op, and `200 -> 100 -> 75 -> 50`. Targeted diagnostics additionally exercised duplicate markers and an equidistant off-marker tie in both directions; malformed lists fail open in pure-policy tests. | **Runtime verified** on the final RC; the earlier one-off click-through observation was **not reproduced**. | Reopen the anomaly only if a repeatable path changes another Slider. |
| Vertical Slider | Pure math is orientation-independent. A repository-wide `src/**/*.ts(x)` search found no source-authored shared vertical Slider consumer; the one `orientation="vertical"`-shaped bundle patch extracts a scroller. No user-visible shared vertical Slider was available in the exercised Discord build. | **Not available on this build** / **runtime not exercised**. | Re-run the source and UI search on a future Discord build; if a shared vertical Slider appears, exercise both directions without assuming their mapping. |
| Disabled Slider | Disabled Notification Timeout ignored right-click and wheel input, opened no Precise Input, and did not move the page or value; the original notification style was restored. | **Runtime verified** on the final RC using the named Vencord consumer. | Repeat after a material disabled-state handling change. |
| Native context-menu coexistence | The final RC repeat kept both user and stream menus open during wheel input and displayed Precise Input above each overlapping menu. User-menu Escape priority closed the Modal first and the menu second. | **Runtime verified** for user and stream menu availability, wheel coexistence, menu preservation, layering, and Escape priority. Stable-key replacement is additionally covered by the two-trigger coordinator test. | Repeat after a material Discord menu/Modal implementation change. |
| VolumeBooster-modified user/stream range | User volume exposed `0..1000` and accepted exact `250` plus boundary `1000`, while rejecting `1001`. Stream volume now has the same end-to-end exact-input evidence from original `100` through `250`, invalid `1001`, boundary `1000`, Cancel, native drag, and exact restoration. The project owner manually accepted Shift/Ctrl wheel adjustment on both consumers. | **Runtime verified end to end** for the directly exercised paths; **user-reported manual acceptance** for modifier-wheel behavior. | No additional VolumeBooster-specific range step is currently required; repeat after material Slider or VolumeBooster changes. |
| Dark, light, and custom themes | Dark, Discord Light, and the installed Vencord Local Theme `Fallout 4 Terminal` were visually inspected. BetterSliders settings and Precise Input remained usable, native menus stayed beneath the Modal, and theme-owned styling was preserved. | **Runtime verified** for the named three theme configurations. | Repeat after material CSS, Discord Modal, or theme-token changes. |
| Callback order/count | Continuous discrete changes produced one `commitValue -> asValueChanges -> onValueChange` sequence. Marker wheel produced one `commitValue -> onValueChange` sequence. Native pointer input bypassed `commitValue`, emitted movement-driven `asValueChanges`, and ended with one `onValueChange`. Cancel, Escape, and clamped no-ops emitted no callbacks. | **Runtime verified** on microphone volume and Notification Log Limit; temporary instrumentation was removed before commit. | Repeat after a material Discord shared-Slider implementation change, and exercise duplicate/tied marker contracts if such a consumer becomes available. |

## Validation record

Only completed checks reported during implementation are listed as passed. A later code change
must rerun the relevant checks before release.

| Validation | Recorded result | Scope caveat |
| --- | --- | --- |
| `pnpm test:better-sliders` | **Passed: 41/41** on product-code HEAD `a7084b87`; includes duplicate, tie, unsorted, and out-of-range marker cases. | Pure BetterSliders suites only. |
| TypeScript (`pnpm testTsc`) | **Passed** on the final RC after diagnostic removal. | Reported implementation check. |
| ESLint (`pnpm lint src/plugins/betterSliders`) | **Passed** on the final RC after diagnostic removal. | Plugin-scoped lint result. |
| Discord desktop build (`pnpm build`) | **Passed** on the final RC after diagnostic removal; a Discord reload confirmed the diagnostic panel was absent before runtime acceptance. | Build success is not a consumer compatibility run. |
| Full [`pnpm test`](../../package.json) pipeline | **Passed** on the final RC after diagnostic removal, including standalone build, TypeScript, ESLint, stylelint, and plugin-list generation. | This is an automated build/static-validation result, not a Discord consumer compatibility run. |

The complete `pnpm test` pipeline and targeted checks were rerun for the final release candidate
after temporary diagnostics were removed. Milestone 5 is complete and the plugin is release-ready
for the named Discord/Vencord baseline. Keep the unavailable vertical-Slider row explicit and
re-run it when a future build exposes such a consumer. Reopen the mouse-Apply anomaly only if a
repeatable user or runtime path reproduces it.
