# BetterSliders UserPlugin

BetterSliders adds optional mouse-wheel adjustment and precise right-click input to supported
Discord sliders while preserving their native behavior.

This package is an unofficial Vencord UserPlugin. Vencord documents UserPlugins as an advanced,
source-build-only feature and does not provide support for them. Client modifications may violate
Discord's Terms of Service; decide whether to use them at your own risk.

## Install

1. Follow Vencord's source-build instructions for your platform:
   <https://docs.vencord.dev/installing/>.
2. Verify this ZIP against the adjacent `.sha256` file.
3. Extract the archive so this file is located at
   `Vencord/src/userplugins/betterSliders/README.md`.
4. From the Vencord repository, install its locked dependencies and run the documented build and
   injection commands for your platform.
5. Enable **BetterSliders** from Vencord's Plugins settings and restart Discord if requested.

Do not place the ZIP itself in `src/userplugins`; extract the complete `betterSliders` directory.

## Update

UserPlugin updates are manual. Back up your Vencord settings, remove the existing
`src/userplugins/betterSliders` directory, extract the new verified package in its place, then
rebuild and restart Vencord. The built-in Vencord updater does not update this directory.

## Remove or recover

Disable BetterSliders first. Remove `src/userplugins/betterSliders`, rebuild Vencord, and restart
Discord. If a build fails, restore the previous verified package or remove the directory and build
again. BetterSliders is designed to fail open when its Discord Slider patch no longer matches, but
that is not a substitute for rebuilding without an incompatible package.

See `COMPATIBILITY.md` and `manifest.json` in this directory before reporting a problem. Reports
belong at <https://github.com/Command1264/Vencord/issues>, not Vencord's upstream support channels.

## License

BetterSliders is distributed under GPL-3.0-or-later. The complete license text is included as
`LICENSE`.
