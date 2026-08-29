# BetterSliders UserPlugin distribution

## Purpose

This flow produces a portable, source-only BetterSliders package for Vencord's
`src/userplugins` directory. It does not publish a complete Vencord build, install files into a
user's Discord client, or add an auto-updater.

The generated ZIP contains the same runtime source used by this fork plus package-local install,
license, compatibility, and provenance metadata. No GitHub Actions runner is required.

## Create a development artifact

From the repository root:

```sh
pnpm package:better-sliders-userplugin -- --version 0.1.0-dev
```

The default output directory is `dist/better-sliders-userplugin` and contains:

- `better-sliders-userplugin-v<version>.zip`;
- `better-sliders-userplugin-v<version>.zip.sha256`.

Development artifacts record the current source commit and whether the source tree was dirty.
They are for local verification, not publication.

## Verify the portable integration seam

Use a detached Worktree at the Vencord commit recorded in the generated `manifest.json`. Extract
the archive so `src/userplugins/betterSliders/index.ts` exists, then run:

```sh
pnpm install --frozen-lockfile
pnpm exec eslint src/userplugins/betterSliders --rule "path-alias/no-relative:off"
pnpm testTsc
pnpm buildStandalone
pnpm generatePluginJson
```

The scoped lint override is intentional. Vencord's repository lint policy normally requires
`@plugins/*`, but that alias resolves only `src/plugins`; a portable UserPlugin must use relative
self-imports when installed under `src/userplugins`. All other lint rules remain active.

`generatePluginJson` is a repository regression gate and intentionally omits UserPlugins from its
published official-plugin list. The standalone renderer build is the loading evidence: it must
contain BetterSliders with Vencord's generated `userPlugin` metadata.

This verification proves that the packaged source is structurally independent and buildable. It
does not replace Discord runtime acceptance when the shared Slider bundle or compatibility
baseline changes.

## Create a release artifact

Release mode is deliberately fail-closed:

```sh
pnpm package:better-sliders-userplugin -- --release --version 0.1.0-rc.2
```

It succeeds only when:

- the complete Git working tree is clean;
- `HEAD` has the exact tag `better-sliders-v<version>`; and
- `git tag -v` verifies that tag's signature.

Create the tag only after all automated and required Discord acceptance gates pass. Publishing the
resulting files to GitHub Releases remains a separately authorized remote operation.

## Verify downloads

Windows PowerShell:

```powershell
$expected = (Get-Content .\better-sliders-userplugin-v0.1.0-rc.2.zip.sha256).Split()[0]
$actual = (Get-FileHash .\better-sliders-userplugin-v0.1.0-rc.2.zip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw "BetterSliders checksum mismatch" }
```

Linux:

```sh
sha256sum --check better-sliders-userplugin-v0.1.0-rc.2.zip.sha256
```

On macOS, compare the first field of the `.sha256` file with:

```sh
shasum -a 256 better-sliders-userplugin-v0.1.0-rc.2.zip
```

After verification, follow the `README.md` contained in the archive. Updates and removal remain
manual and require rebuilding Vencord.

The authoritative end-user installation, update, removal, and troubleshooting tutorial is
[`distribution/better-sliders-userplugin/README.md`](../../distribution/better-sliders-userplugin/README.md).
The packaging command copies that guide into the root of every BetterSliders UserPlugin archive.
