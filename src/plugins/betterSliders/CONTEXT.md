# BetterSliders

BetterSliders adds optional interaction methods to Discord sliders while preserving the
meaning and behavior owned by each slider's original feature.

## Language

**Supported Slider**:
A slider rendered through the shared Discord Slider component whose effective contract is
valid and available to BetterSliders.
_Avoid_: Volume slider, every slider, fake slider

**Effective Slider Contract**:
The current value, allowed values, disabled state, display semantics, and native change
behavior that a Supported Slider exposes when the user interacts with it.
_Avoid_: Default range, BetterSliders range, volume range

**Precise Input**:
An explicit request to commit one exact allowed value. Invalid, disallowed, or out-of-range
requests are rejected rather than silently changed.
_Avoid_: Clamp input, snap input

**Wheel Adjustment**:
A directional request to move from the current value according to the Effective Slider
Contract. Movement stops at the allowed boundaries without showing an error.
_Avoid_: Scroll value, raw delta adjustment

**Interaction Enhancement**:
An additional way to operate a Supported Slider while leaving native dragging, keyboard
behavior, presentation, and feature ownership intact.
_Avoid_: Slider replacement, volume controller
