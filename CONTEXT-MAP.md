# Context Map

## Managed contexts

- [BetterSliders](./src/plugins/betterSliders/CONTEXT.md) — adds optional interaction
  methods to supported Discord sliders without replacing their native contract.

## Scope

This map documents the domain introduced by this fork. Existing Vencord packages and
plugins remain governed by their upstream code and documentation; their absence from this
map does not imply that they belong to the BetterSliders context.

## Relationships

- **BetterSliders → Discord Slider**: BetterSliders consumes the effective contract exposed
  by Discord's shared Slider component and commits changes through its native behavior.
- **Other slider patches → BetterSliders**: range-changing patches run independently;
  BetterSliders observes the resulting runtime contract rather than integrating with a
  named plugin.
