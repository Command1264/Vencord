# BetterSliders UserPlugin compatibility

This package targets upstream Vencord commit
`bc680139be4526aa5525d33fbac8a271eb0cfd02` and was release-tested in the fork against Discord
Stable `1.0.9255`.

The packaged UserPlugin path was also runtime-accepted directly. The deterministic `0.1.0-dev`
archive from source commit `a502a955b62c2f084bd5a19428ed4dd2b08df774` was extracted into a clean
upstream checkout, built, injected, and loaded in Discord. BetterSliders appeared enabled with its
settings available; microphone volume moved `100 -> 99 -> 100` with native percentage feedback;
and Precise Input stayed above the preserved native audio menu while Escape closed the Modal first.
The tested archive SHA-256 was
`b3c317df02860e8b6ae407cbcc76dcfef7a11e1e53fc35154958db314d772574`.

Verified release-candidate coverage includes Discord microphone, user-volume, and stream-volume
sliders; Vencord continuous, marker, and disabled sliders; VolumeBooster-adjusted ranges; native
context-menu coexistence; precise input; wheel modifiers; and native value Tooltip feedback.

The package patches Discord's shared Slider using the observed `markDash` and `containerRef`
anchors. A Discord bundle change can invalidate that seam even when Vencord itself remains current.
Failure should leave native sliders operational, but the package must be revalidated before making
compatibility claims for a new Discord or Vencord baseline.

Not verified for this baseline:

- a shared vertical Slider, because none was available in the exercised Discord build;
- Vesktop and browser targets; and
- later Discord or Vencord revisions.

When reporting a problem, include the package version from `manifest.json`, Vencord commit, Discord
channel/build, operating system, affected Slider, relevant plugins, and reproduction steps.
