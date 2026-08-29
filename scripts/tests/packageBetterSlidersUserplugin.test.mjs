/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, describe, it } from "node:test";

import { strFromU8, unzipSync } from "fflate";

const repositoryRoot = resolve(import.meta.dirname, "../..");
const outputDirectory = mkdtempSync(join(tmpdir(), "better-sliders-package-test-"));
const pnpmEntryPoint = process.env.npm_execpath;

after(() => rmSync(outputDirectory, { recursive: true }));

describe("BetterSliders UserPlugin package CLI", () => {
    it("is available through the documented pnpm command", () => {
        assert.ok(pnpmEntryPoint, "pnpm must provide npm_execpath while running this test");

        execFileSync(process.execPath, [
            pnpmEntryPoint,
            "package:better-sliders-userplugin",
            "--",
            "--version", "0.1.0-test.0",
            "--output", outputDirectory
        ], { cwd: repositoryRoot });

        assert.ok(readFileSync(join(
            outputDirectory,
            "better-sliders-userplugin-v0.1.0-test.0.zip"
        )).byteLength > 0);
    });

    it("keeps the self-contained author visible to the fork plugin-list generator", () => {
        assert.ok(pnpmEntryPoint, "pnpm must provide npm_execpath while running this test");

        const output = execFileSync(process.execPath, [
            pnpmEntryPoint,
            "exec", "tsx", "scripts/generatePluginList.ts"
        ], {
            cwd: repositoryRoot,
            encoding: "utf8"
        });
        const plugin = JSON.parse(output).find(candidate => candidate.name === "BetterSliders");

        assert.deepEqual(plugin.authors, [{
            id: "306858118891962369",
            name: "Command1264"
        }]);
    });

    it("creates an installable source archive with compatibility metadata and a matching checksum", () => {
        execFileSync(process.execPath, [
            "scripts/packageBetterSlidersUserplugin.mjs",
            "--version", "0.1.0-test.1",
            "--output", outputDirectory
        ], { cwd: repositoryRoot });

        const archiveName = "better-sliders-userplugin-v0.1.0-test.1.zip";
        const archive = readFileSync(join(outputDirectory, archiveName));
        const checksum = readFileSync(join(outputDirectory, `${archiveName}.sha256`), "utf8");
        const entries = unzipSync(archive);

        assert.deepEqual(Object.keys(entries).sort(), [
            "betterSliders/COMPATIBILITY.md",
            "betterSliders/LICENSE",
            "betterSliders/README.md",
            "betterSliders/components/ValueInputModal.tsx",
            "betterSliders/i18n.ts",
            "betterSliders/index.ts",
            "betterSliders/manifest.json",
            "betterSliders/runtimeUtils.ts",
            "betterSliders/settings.tsx",
            "betterSliders/settingsUtils.ts",
            "betterSliders/sliderUtils.ts",
            "betterSliders/validation.ts"
        ]);

        const manifest = JSON.parse(strFromU8(entries["betterSliders/manifest.json"]));
        const { sourceCommit, sourceTreeDirty, ...stableManifest } = manifest;
        assert.match(sourceCommit, /^[0-9a-f]{40}$/);
        assert.equal(typeof sourceTreeDirty, "boolean");
        assert.deepEqual(stableManifest, {
            license: "GPL-3.0-or-later",
            name: "BetterSliders",
            schemaVersion: 1,
            sourceRepository: "https://github.com/Command1264/Vencord",
            targetDirectory: "src/userplugins/betterSliders",
            upstreamVencordCommit: "bc680139be4526aa5525d33fbac8a271eb0cfd02",
            version: "0.1.0-test.1"
        });

        const expectedHash = createHash("sha256").update(archive).digest("hex");
        assert.equal(checksum, `${expectedHash}  ${archiveName}\n`);
    });

    it("rejects release packaging unless the repository is clean and exactly tagged for the version", () => {
        const result = spawnSync(process.execPath, [
            "scripts/packageBetterSlidersUserplugin.mjs",
            "--release",
            "--version", "0.0.0-never-a-release-test",
            "--output", outputDirectory
        ], {
            cwd: repositoryRoot,
            encoding: "utf8"
        });

        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /Release packaging requires/);
    });

    it("contains no fork-global BetterSliders import or author dependency", () => {
        execFileSync(process.execPath, [
            "scripts/packageBetterSlidersUserplugin.mjs",
            "--version", "0.1.0-test.2",
            "--output", outputDirectory
        ], { cwd: repositoryRoot });

        const archive = readFileSync(join(outputDirectory, "better-sliders-userplugin-v0.1.0-test.2.zip"));
        const entries = unzipSync(archive);
        const source = Object.entries(entries)
            .filter(([path]) => /\.[cm]?[jt]sx?$/.test(path))
            .map(([, contents]) => strFromU8(contents))
            .join("\n");

        assert.doesNotMatch(source, /@plugins\/betterSliders/);
        assert.doesNotMatch(source, /Devs\.Command1264/);
        assert.match(source, /id:\s*306858118891962369n/);
    });

    it("reproduces identical archive bytes for the same source and version", () => {
        const firstOutput = join(outputDirectory, "repro-a");
        const secondOutput = join(outputDirectory, "repro-b");
        const arguments_ = [
            "scripts/packageBetterSlidersUserplugin.mjs",
            "--version", "0.1.0-test.3"
        ];

        execFileSync(process.execPath, [...arguments_, "--output", firstOutput], { cwd: repositoryRoot });
        execFileSync(process.execPath, [...arguments_, "--output", secondOutput], { cwd: repositoryRoot });

        const archiveName = "better-sliders-userplugin-v0.1.0-test.3.zip";
        assert.deepEqual(
            readFileSync(join(firstOutput, archiveName)),
            readFileSync(join(secondOutput, archiveName))
        );
    });
});
