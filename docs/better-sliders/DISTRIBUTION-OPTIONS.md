# BetterSliders Distribution Options

## Decision summary

BetterSliders should use a two-layer distribution strategy:

1. **Make a portable Custom UserPlugin package the primary near-term channel.** It keeps
   each tester on their own Vencord source checkout, limits the distributed payload to the
   BetterSliders source, and avoids taking responsibility for distributing a complete Vencord
   build. The trade-off is deliberate: Vencord documents UserPlugins as an advanced,
   source-build-only feature for which Vencord does not provide support, and it does not make
   them discoverable in the official plugin catalogue.
   ([custom-plugin installation guide](https://docs.vencord.dev/installing/custom-plugins/),
   [plugin layout guide](https://docs.vencord.dev/plugins/))
2. **Keep `Command1264/Vencord` as the integration, compatibility, and fallback distribution
   channel.** A fork build gives its users an ordinary `BetterSliders` entry in the Plugins
   page, but it makes the fork owner responsible for upstream synchronization, complete-build
   delivery, update metadata, platform packaging, and support. It should not become the
   primary general-user download until that release engineering exists.

The immediate deliverable should therefore be a versioned `betterSliders/` source archive that
can be placed at `src/userplugins/betterSliders`, plus checksums and compatibility metadata. The
fork remains the release-tested reference implementation. Prebuilt fork binaries and a branded
installer are later decisions, not prerequisites for distributing the UserPlugin.

## Research baseline and scope

This analysis is pinned to:

- [`better-sliders-v0.1.0-rc.1`](https://github.com/Command1264/Vencord/releases/tag/better-sliders-v0.1.0-rc.1),
  a signed source-only prerelease with no separately built binary assets;
- fork integration commit
  [`1ed51e0fc792647baafd1a1129d95b170506e8d5`](https://github.com/Command1264/Vencord/commit/1ed51e0fc792647baafd1a1129d95b170506e8d5);
  and
- upstream Vencord base
  [`bc680139be4526aa5525d33fbac8a271eb0cfd02`](https://github.com/Vendicated/Vencord/commit/bc680139be4526aa5525d33fbac8a271eb0cfd02).

The two options considered are a separately distributed Custom UserPlugin and the existing
Vencord fork. Upstream inclusion is not treated as a delivery plan. Runtime compatibility
claims remain limited to the environments recorded in
[`COMPATIBILITY.md`](./COMPATIBILITY.md).

## What Vencord actually loads

Vencord's source build scans `src/plugins` and `src/userplugins`, imports each eligible entry,
and records whether it came from the UserPlugin directory. It also scans both locations for a
plugin `native.ts`. This behavior is implemented in Vencord's
[`globPlugins`](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/scripts/build/common.mjs#L142-L189)
and
[`globNativesPlugin`](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/scripts/build/build.mjs#L58-L106)
build steps. The official instructions accept either a single `.ts`/`.tsx` file or a directory
with `index.ts`/`index.tsx`, and explicitly reserve `src/userplugins` for custom/private plugins.
([installation layout](https://docs.vencord.dev/installing/custom-plugins/#adding-your-plugin),
[plugin setup](https://docs.vencord.dev/plugins/#official-plugins-vs-userplugins))

Consequences:

- A UserPlugin is **compiled into that user's Vencord bundle**. It is not dynamically downloaded
  by an already-installed official binary.
- A UserPlugin appears in the Plugins page of the build that contains it, but is not published to
  Vencord's official plugin catalogue. Vencord marks it as a UserPlugin in generated plugin
  metadata, and its settings UI can filter for UserPlugins.
  ([build metadata](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/scripts/build/common.mjs#L179-L183),
  [Plugins page filter](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/src/components/settings/tabs/plugins/index.tsx#L297-L304))
- Moving BetterSliders from `src/plugins/betterSliders` to
  `src/userplugins/betterSliders` does not by itself remove its source patch. Plugin patches are
  part of the plugin definition imported by the same build pipeline.
- Vencord ignores `src/userplugins` in Git, which avoids ordinary conflicts with upstream files
  but also means the Vencord repository cannot update the plugin for the user.
  ([`.gitignore`](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/.gitignore#L22))

## Option 2: portable Custom UserPlugin

### User experience and discoverability

The user must first install Git, Node.js, and pnpm, clone Vencord, install locked dependencies,
and build it. For Discord Desktop, Vencord documents `pnpm build` followed by `pnpm inject`; for
Vesktop and web builds, it documents different installation steps.
([source-build prerequisites and commands](https://docs.vencord.dev/installing/))

After the BetterSliders folder is present and the build is restarted, BetterSliders is searchable
in that user's Plugins page. It is **not** searchable by someone using an official prebuilt
Vencord installation and it has no Vencord-hosted marketplace page. The project must supply its
own discovery surface: the GitHub repository, GitHub Releases, a stable documentation URL, and
release notifications.

The official custom-plugin guide intentionally warns that this is an advanced workflow and that
Vencord does not support custom plugins or custom installs. BetterSliders must therefore own its
installation instructions, issue template, compatibility reports, and uninstall recovery path.
([Vencord support boundary](https://docs.vencord.dev/installing/custom-plugins/))

### Proposed package

Publish one archive whose root is exactly `betterSliders/`, suitable for extraction into
`src/userplugins/`. It should contain:

- runtime source files (`index.ts`, `settings.tsx`, `settingsUtils.ts`, `sliderUtils.ts`,
  `validation.ts`, `runtimeUtils.ts`, `i18n.ts`, and `components/ValueInputModal.tsx`);
- a package-local `README.md` with install, update, disable, remove, and recovery instructions;
- a package-local compatibility file identifying the BetterSliders version, tested Vencord
  commit, tested Discord build, and unverified targets; and
- the GPL notice and source location.

Tests should remain in the development repository and be run before packaging. Including them in
the install archive is harmless but increases user-facing surface and requires rewriting their
current repository-specific import paths.

### Current portability gaps

Most of BetterSliders is already contained in one plugin directory and uses Vencord APIs that are
available to UserPlugins: ContextMenu, Settings, components, webpack common modules, logger, and
plugin definition types. Its entry point and patch are visible in the pinned
[`index.ts`](https://github.com/Command1264/Vencord/blob/1ed51e0fc792647baafd1a1129d95b170506e8d5/src/plugins/betterSliders/index.ts).
Four concrete gaps prevent a clean copy today:

1. **Author identity is fork-global.** `index.ts` imports `Devs.Command1264`, while that identity
   was added to the fork's global
   [`src/utils/constants.ts`](https://github.com/Command1264/Vencord/blob/1ed51e0fc792647baafd1a1129d95b170506e8d5/src/utils/constants.ts#L672-L675).
   Vencord's UserPlugin guide instructs UserPlugins to use an inline `{ name, id }` author object.
   ([UserPlugin author form](https://docs.vencord.dev/plugins/#plugin-boilerplate))
2. **The modal imports its siblings through the official-plugin alias.** The pinned
   [`ValueInputModal.tsx`](https://github.com/Command1264/Vencord/blob/1ed51e0fc792647baafd1a1129d95b170506e8d5/src/plugins/betterSliders/components/ValueInputModal.tsx#L9-L11)
   imports `@plugins/betterSliders/...`. After relocation, those imports still point at
   `src/plugins`, so they must become relative imports.
3. **Tests and the test script are repository-shaped.** Tests import
   `@plugins/betterSliders/...`, and `package.json` contains a plugin-specific command fixed to
   `src/plugins/betterSliders/tests/*.test.ts`. The distributable archive should not require the
   consumer to patch Vencord's `package.json`.
   ([fork package script](https://github.com/Command1264/Vencord/blob/1ed51e0fc792647baafd1a1129d95b170506e8d5/package.json#L34))
4. **Release evidence is repository-global.** The Roadmap, ADRs, context map, and compatibility
   ledger live outside the plugin directory. A small, generated package-local compatibility
   summary must travel with the archive; the canonical evidence can continue to live in this
   repository.

No Vencord core runtime change is required for the portable package once the author and import
couplings are removed. The existing global `Devs` addition and plugin-specific package script
should remain fork-only development conveniences, not UserPlugin installation prerequisites.

### Source-patch and webpack seam

Portability does not make the runtime seam more stable. BetterSliders currently finds Discord's
shared Slider through the string anchor `markDash`, replaces the `containerRef` assignment, and
then uses Slider instance fields such as `commitValue`, `containerRef`, `grabberRef`, range state,
and sorted markers.
([patch and binding implementation](https://github.com/Command1264/Vencord/blob/1ed51e0fc792647baafd1a1129d95b170506e8d5/src/plugins/betterSliders/index.ts#L224-L307))

That patch remains fully package-local and can work as a UserPlugin, but it is a Discord webpack
compatibility seam rather than a stable Vencord Slider API. Either a Discord bundle change or a
Vencord patcher/API change can break it. The UserPlugin should therefore declare a tested matrix,
fail open, and ask for the Discord build, Vencord commit, plugin version, and affected Slider in
every bug report. The fork has the same Discord seam; its advantage is only that the owner can pin
and test one complete Vencord revision before release.

### Install, update, and removal lifecycle

Recommended initial installation:

1. Follow Vencord's source installation guide through `pnpm install --frozen-lockfile`.
2. Extract the exact release archive to `src/userplugins/betterSliders`.
3. Verify its checksum and version metadata.
4. Run the Vencord build for the chosen target; on Discord Desktop, run `pnpm build` and perform
   the documented initial `pnpm inject`.
5. Restart Discord and enable BetterSliders.

Vencord's repository can update itself independently, but `src/userplugins` is ignored and no
official updater fetches an individual UserPlugin. A BetterSliders update therefore means
replacing only the exact plugin directory with a newer verified archive, rebuilding, and
restarting. An updater script may automate those steps later, but it must refuse dirty or
unexpected targets, verify the downloaded digest before replacement, and preserve a rollback
copy.

Removal has two levels:

- disabling BetterSliders in the Plugins page stops it without changing the source checkout;
- removing `src/userplugins/betterSliders`, rebuilding, and restarting removes it from the
  bundle. The user should use Vencord's Installer uninstall only when they intend to remove
  Vencord itself. Vencord documents Installer-based uninstallation in its
  [FAQ](https://vencord.dev/faq/#how-do-i-uninstall-vencord).

### Cross-platform reach

The package contains renderer code and no `native.ts`, so it does not add a plugin-specific
native executable. Vencord's source build nevertheless has platform-specific delivery steps for
Discord Desktop, Vesktop, Chrome/Chromium, Firefox, and userscripts.
([source-install target matrix](https://docs.vencord.dev/installing/#building-vencord))
BetterSliders has passed desktop and web builds at RC1, but its recorded runtime acceptance is
Discord Stable desktop only. A successful build is not runtime evidence for Vesktop or browser
targets.

For the first portable release, document Windows Discord Desktop as the supported guided path;
accept macOS/Linux source-build testers only with the platform and installer caveats from the
official guide. Treat Vesktop and browser operation as experimental until their Slider and modal
paths are exercised. Do not advertise mobile support; Vencord states that it supports desktop,
not mobile.
([platform statement](https://vencord.dev/faq/#is-there-a-mobile-version-of-vencord))

### Operational cost

The owner maintains the plugin package, compatibility metadata, and support documentation. Each
upstream update needs at least build/type/lint tests, while each relevant Discord update needs the
runtime matrix because the source patch can fail independently of the TypeScript build. Users
remain responsible for their Vencord source checkout and platform injection.

This is the smaller trust and support boundary: the project distributes BetterSliders source,
not an entire patched client build or installer.

## Option 3: the `Command1264/Vencord` fork

### User experience and discoverability

BetterSliders is already in `src/plugins`, so every build of the fork includes it and the Plugins
page can find it without a separate copy step. This is the only one of the two routes that can
eventually offer a one-download experience, but users must first discover and deliberately
install the unofficial fork; it does not make BetterSliders visible inside an official Vencord
binary.

The current RC is a source-only prerelease. GitHub automatically provides tag source archives,
but the release explicitly has no custom binary assets.
([RC1 release](https://github.com/Command1264/Vencord/releases/tag/better-sliders-v0.1.0-rc.1),
[GitHub source archives](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases#about-releases))
Therefore its current user journey is still clone/download, dependency install, build, and
inject—not a conventional installer download.

### Source-checkout installation and updater behavior

For an RC tester, the simplest maintained path is still Vencord's documented source workflow,
using `https://github.com/Command1264/Vencord` instead of the upstream clone URL. The fork's
[`pnpm inject` wrapper](https://github.com/Command1264/Vencord/blob/1ed51e0fc792647baafd1a1129d95b170506e8d5/scripts/runInstaller.mjs)
downloads the official cross-platform Installer CLI, points `VENCORD_USER_DATA_DIR` at the local
checkout, and marks it as a development install. This reuses the official patcher while loading
the locally built fork.

Non-standalone Vencord builds use the Git updater. It reads the checkout's `origin`, fetches the
current branch, pulls it, and rebuilds.
([Git updater](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/src/main/updater/git.ts))
This has two important channel implications:

- cloning a maintained fork branch can provide source-based updates tied to
  `Command1264/Vencord`;
- checking out a version tag gives a good immutable test baseline but leaves a detached HEAD,
  so the branch-based updater is not a reliable version-channel mechanism. Tagged users need a
  documented manual upgrade to the next tag and should not be told to use the built-in updater
  for that installation.

During RC, tags plus manual upgrades are safer than silently moving all testers with `main`.
Before general release, create and document one owner-controlled stable branch or implement an
explicit semantic-version channel; do not promise automatic updates from a detached tag.

### Standalone artifacts and remote identity

A standalone build switches from the Git updater to the HTTP updater.
([updater selection](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/src/main/updater/index.ts))
The build embeds the repository identity from `VENCORD_REMOTE` or the Git `origin`.
([remote embedding](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/scripts/build/common.mjs#L222-L239))
The HTTP updater then calls that repository's `/releases/latest`, expects the release name to end
with the built short Git hash, and downloads assets whose names begin with Vencord's expected
runtime filenames.
([HTTP updater](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/src/main/updater/http.ts),
[expected filenames](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/src/main/updater/common.ts))

RC1 is not compatible with that HTTP update protocol:

- it is a prerelease, while GitHub defines `/releases/latest` as the most recent non-prerelease,
  non-draft release;
  ([GitHub latest-release definition](https://docs.github.com/en/rest/releases/releases#get-the-latest-release))
- its release name does not end with the short target hash; and
- it has no Vencord runtime assets.

Creating a standalone fork channel therefore requires a deliberate release contract, not merely
attaching an arbitrary ZIP. At minimum it needs correctly named platform/runtime assets, embedded
`Command1264/Vencord` identity, a compatible latest-release title, rollback documentation, and
tests that the updater downloads and replaces the expected files.

The inherited build workflow does not publish fork artifacts: its upload steps are guarded by
`github.repository == 'Vendicated/Vencord'`.
([build workflow](https://github.com/Command1264/Vencord/blob/1ed51e0fc792647baafd1a1129d95b170506e8d5/.github/workflows/build.yml#L52-L70))
The fork must add its own authorized publishing process or manually build and upload assets.

The fork's current package metadata also still sends `homepage`, `bugs`, and `repository` users
to `Vendicated/Vencord`.
([fork package metadata](https://github.com/Command1264/Vencord/blob/1ed51e0fc792647baafd1a1129d95b170506e8d5/package.json#L5-L13))
That does not control the embedded updater remote, but it does affect tooling and support
expectations. Before presenting the fork as a distinct distribution, keep the upstream credit
while explicitly routing fork-specific documentation and bug reports to owner-controlled URLs.

### Installer choices

There are three materially different products that are easy to confuse:

1. **Source checkout plus `pnpm inject`** — available now and reuses the official Installer CLI
   as a patcher for the local `dist` directory.
2. **Prebuilt fork runtime assets** — requires the standalone release/update contract above and
   a safe way to place/select that runtime directory.
3. **A branded BetterSliders installer** — requires forking, building, distributing, and
   maintaining Vencord's Go Installer itself. The Installer has its own Go/GCC and Linux GUI
   build prerequisites.
   ([Installer source-build README](https://github.com/Vencord/Installer#building-from-source))

The third product should be deferred. It expands the security and cross-platform support surface
without changing BetterSliders' core behavior. A small source workflow or verified artifact
wrapper is a better first step.

### Cross-platform and update burden

Owning a complete fork means tracking both Vencord and Discord:

- upstream Vencord changes can alter APIs, build tooling, dependencies, installer behavior, or
  updater protocol;
- Discord changes can invalidate BetterSliders' `markDash`/`containerRef` source patch and Slider
  instance assumptions even if the fork merges cleanly and builds;
- desktop injection differs by Windows, macOS, and Linux packaging; Vesktop and browser builds
  have separate delivery paths.
  ([Vencord platform-specific source installation](https://docs.vencord.dev/installing/#installing-your-custom-build))

An upstream synchronization policy should therefore:

1. merge a reviewed upstream commit into a task branch rather than publishing directly;
2. run the complete Vencord build/type/lint/style/plugin-list suite;
3. rerun BetterSliders policy tests;
4. inspect whether its patch applied; and
5. rerun the high-risk Discord acceptance paths before promoting the result to the stable fork
   channel.

A clean Git merge is not a compatibility verdict. Conversely, delaying every upstream security
or Discord compatibility fix to protect BetterSliders would make the fork less safe. The owner
needs an explicit maximum synchronization lag and an emergency path to ship upstream fixes while
temporarily disabling BetterSliders if its seam fails.

### Operational cost

The fork owner becomes the first-line maintainer for the full installed build. Vencord states that
unofficial repackages are maintained by unrelated parties and directs their support questions to
those maintainers.
([unofficial-package support boundary](https://vencord.dev/faq/#i-see-there-are-packages-for-nix-or-another-platform-not-on-the-website-do-you-support-them))
The support queue can therefore include installation, updater, upstream regression, platform,
and Discord issues that are not caused by BetterSliders itself.

The fork is justified when its intended audience values one integrated build enough to support
that maintenance cost, or when BetterSliders needs fork-level changes that cannot live inside a
UserPlugin. Neither condition is currently required by the runtime implementation after the
identified portability fixes.

## Comparison

| Dimension | Custom UserPlugin | Own Vencord fork |
| --- | --- | --- |
| Visible in official prebuilt Vencord | No | No |
| Visible in the user's Plugins page | Yes, after source rebuild | Yes, in every fork build |
| Initial user skill level | Advanced source-build user | Advanced today; can become simpler with release engineering |
| Distributed trust surface | BetterSliders source package | Complete Vencord build and possibly installer |
| Plugin updates | Separate archive/script plus rebuild | Git branch pull/rebuild, or engineered standalone HTTP channel |
| Upstream Vencord updates | User updates their checkout | Fork owner integrates and validates them |
| Discord webpack seam | Same fragile seam | Same seam, but one tested Vencord revision can be pinned |
| Platform burden on owner | Plugin build compatibility and docs | Full build, artifact, installer/updater, and platform support |
| Rollback | Restore previous plugin folder and rebuild | Checkout previous tag/source or install previous complete artifact |
| Official Vencord support | Explicitly unsupported | Unofficial repackage; fork owner supports it |
| Best current audience | Technical RC testers | Existing fork testers and integration verification |
| Best future role | Primary independent plugin channel | Optional convenience build and compatibility reference |

## Artifact integrity, signing, and licensing

Both routes distribute code that users run inside Discord, so provenance must be visible rather
than implied.

Minimum policy for a UserPlugin archive:

- create it from a signed, immutable version tag;
- publish `SHA256SUMS` next to the archive and show verification commands for PowerShell,
  macOS, and Linux;
- record the source commit and tested Vencord/Discord versions inside the archive; and
- never replace an asset under an already-published version. Publish a new version instead.

GitHub verifies cryptographically signed tags and marks valid ones as Verified, which authenticates
the source ref.
([GitHub signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification))
GitHub's release-asset API also exposes a SHA-256 `digest`, but a human-readable checksum manifest
keeps verification available outside the API.
([release asset schema](https://docs.github.com/en/rest/releases/releases))

For future complete binaries, add artifact provenance when GitHub Actions capacity is available.
GitHub artifact attestations bind an artifact to its repository, workflow, commit, and build
event and can be verified with `gh attestation verify`; GitHub explicitly notes that provenance
does not prove the artifact is secure.
([artifact attestation guidance](https://docs.github.com/en/actions/concepts/security/artifact-attestations))
Immutable GitHub releases can additionally lock tags and assets after publication and create a
release attestation, but all assets should first be assembled in a draft.
([immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases))

Until Actions capacity returns, a manual source archive plus signed tag and checksum is adequate
for a technical RC if the release clearly says it is manually built. It is not equivalent to an
independent or hosted build attestation. If manual binary builds are ever published, pin Node and
pnpm, use the lockfile, set `SOURCE_DATE_EPOCH`, record the exact commands and builder OS, and
publish hashes. Vencord's build uses `SOURCE_DATE_EPOCH` when set and otherwise embeds the current
time, so reproducibility must be configured rather than assumed.
([build timestamp implementation](https://github.com/Vendicated/Vencord/blob/bc680139be4526aa5525d33fbac8a271eb0cfd02/scripts/build/common.mjs#L34-L36))

A checksum, signed Git tag, or GitHub attestation does not replace operating-system executable
signing. A separately distributed Windows installer can trigger SmartScreen and a macOS app can
trigger Gatekeeper unless the project obtains the corresponding signing/notarization credentials
or gives users an explicit verification and exception procedure. Official Vencord itself warns
that its Windows and macOS installers are unsigned, so a BetterSliders installer must not imply a
stronger platform signature than it actually has.
([official Vencord download warnings](https://vencord.dev/download/))

The fork declares `GPL-3.0-or-later`, and BetterSliders source files carry the same SPDX license.
Distribution must preserve license notices and satisfy the GPL's source obligations for any
complete object-code build; keep the exact corresponding source tag available with every binary
release. This is a project compliance recommendation, not legal advice.
([fork license](https://github.com/Command1264/Vencord/blob/1ed51e0fc792647baafd1a1129d95b170506e8d5/LICENSE),
[`package.json` license field](https://github.com/Command1264/Vencord/blob/1ed51e0fc792647baafd1a1129d95b170506e8d5/package.json#L13))

All installation pages should also disclose that this is an unofficial Vencord fork/UserPlugin
and is not endorsed by Discord or Vencord. Discord's current Terms prohibit unauthorized software
designed to modify its services, and Vencord's own FAQ says client modifications are against
Discord's Terms of Service. Users must make their own risk decision.
([Discord Terms](https://discord.com/terms),
[Vencord FAQ](https://vencord.dev/faq/#will-i-get-banned-for-using-vencord-will-plugin-x-get-me-banned))

## Phased delivery recommendation

### Phase A — portable source package

Goal: let technical testers add BetterSliders to a normal Vencord source checkout without
fork-global edits.

Required gates:

- inline the UserPlugin author identity;
- replace `@plugins/betterSliders` self-imports with relative imports;
- keep the package free of `package.json`, `Devs`, AGENTS, and repository-doc dependencies;
- prove the same source tree builds from `src/userplugins/betterSliders` against the pinned
  upstream Vencord commit;
- rerun all BetterSliders tests and the Vencord build/type/lint gates;
- rerun the critical Discord runtime acceptance matrix;
- produce the versioned archive and checksums from a signed tag; and
- publish install/update/remove/recovery instructions.

Do not create an auto-updater in this phase. Manual replacement is easier to audit and rollback.

### Phase B — maintained UserPlugin releases

Goal: make independent releases routine.

- maintain a compatibility manifest for each release;
- test against the current supported upstream Vencord commit before publishing;
- add Windows and POSIX checksum-verification helpers that never overwrite an unexpected target;
- add an issue template that captures the compatibility tuple;
- test Vesktop and browser targets before claiming support; and
- adopt immutable releases and hosted artifact attestations when the release pipeline is
  available.

The fork continues as the reference integration environment throughout this phase.

### Phase C — optional fork convenience build

Goal: reduce installation steps only after maintenance demand is demonstrated.

Proceed only after all of these are true:

- there are enough non-technical users to justify distributing a complete build;
- upstream sync and Discord smoke tests have a repeatable cadence;
- the project can support Windows, macOS, and Linux claims separately rather than assuming parity;
- a stable update channel, rollback channel, asset naming contract, and remote identity are
  tested end to end;
- every binary has a signed source ref, checksum, corresponding source, and build provenance; and
- the owner accepts first-line support for the entire unofficial build.

Start with prebuilt runtime assets plus a narrowly scoped installer wrapper. Fork the Installer
only if the official CLI cannot safely select those assets and the additional Go/cross-platform
maintenance is explicitly accepted.

## Decision criteria

Choose the **Custom UserPlugin as the primary channel now** if all of the following are acceptable:

- users can perform a source build;
- GitHub-based discovery is sufficient;
- plugin updates may require a rebuild and restart; and
- the project wants to own BetterSliders support without owning every Vencord installation issue.

Promote the **fork to a general-user primary channel** only when all of the following are true:

- a source-build workflow is no longer sufficient for the target audience;
- the project can publish and test complete artifacts on every claimed platform;
- the updater's repository, release title, hash, asset names, and rollback behavior are verified;
- upstream security fixes can be integrated within a documented maximum delay; and
- support capacity exists for installer, updater, Vencord, Discord, and BetterSliders failures.

If neither set of conditions holds, keep RC1 as a source-only fork release and recruit technical
testers; do not create an unsigned one-click installer merely to reduce the visible number of
steps.

## Recommended next implementation task

Create a portable-distribution branch that produces the same BetterSliders runtime source in two
contexts without duplicating its implementation:

1. the built-in fork location used for integration and compatibility testing; and
2. a staged `betterSliders/` UserPlugin release archive whose self-imports and author metadata are
   portable.

Validate the staged archive by copying it into `src/userplugins` of a clean checkout at the pinned
upstream commit, then run the automated gates and Discord acceptance. This test is the evidence
that the package is independent; merely moving files inside the current fork is not.
