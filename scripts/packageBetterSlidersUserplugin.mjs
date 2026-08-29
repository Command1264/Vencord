/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { strToU8, zipSync } from "fflate";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginSource = join(repositoryRoot, "src", "plugins", "betterSliders");
const packageSource = join(repositoryRoot, "distribution", "better-sliders-userplugin");
const upstreamVencordCommit = "bc680139be4526aa5525d33fbac8a271eb0cfd02";
const runtimeFiles = [
    "components/ValueInputModal.tsx",
    "i18n.ts",
    "index.ts",
    "runtimeUtils.ts",
    "settings.tsx",
    "settingsUtils.ts",
    "sliderUtils.ts",
    "validation.ts"
];

function readArguments(argv) {
    const options = {
        output: join(repositoryRoot, "dist", "better-sliders-userplugin"),
        release: false,
        version: ""
    };

    for (let index = 0; index < argv.length; index++) {
        const argument = argv[index];
        if (argument === "--") continue;
        if (argument === "--release") {
            options.release = true;
            continue;
        }
        if (argument === "--output" || argument === "--version") {
            const value = argv[++index];
            if (!value) throw new Error(`Missing value for ${argument}.`);
            options[argument.slice(2)] = value;
            continue;
        }

        throw new Error(`Unknown argument: ${argument}`);
    }

    if (!/^[0-9A-Za-z][0-9A-Za-z.-]*$/.test(options.version)) {
        throw new Error("--version must contain only letters, numbers, dots, and hyphens.");
    }

    return options;
}

function runGit(arguments_) {
    return execFileSync("git", arguments_, {
        cwd: repositoryRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
    }).trim();
}

function validateRelease(version) {
    if (runGit(["status", "--porcelain", "--untracked-files=all"])) {
        throw new Error("Release packaging requires a clean working tree.");
    }

    const expectedTag = `better-sliders-v${version}`;
    let actualTag;
    try {
        actualTag = runGit(["describe", "--exact-match", "--tags", "HEAD"]);
    } catch {
        throw new Error(`Release packaging requires exact tag ${expectedTag} at HEAD.`);
    }
    if (actualTag !== expectedTag) {
        throw new Error(`Release packaging requires exact tag ${expectedTag} at HEAD; found ${actualTag}.`);
    }

    try {
        runGit(["tag", "-v", expectedTag]);
    } catch {
        throw new Error(`Release packaging requires a valid signature on tag ${expectedTag}.`);
    }
}

function addFile(entries, archivePath, sourcePath) {
    entries[archivePath] = new Uint8Array(readFileSync(sourcePath));
}

function createArchive(version, sourceMetadata) {
    const entries = {};
    addFile(entries, "betterSliders/COMPATIBILITY.md", join(packageSource, "COMPATIBILITY.md"));
    addFile(entries, "betterSliders/LICENSE", join(repositoryRoot, "LICENSE"));
    addFile(entries, "betterSliders/README.md", join(packageSource, "README.md"));
    for (const relativePath of runtimeFiles) {
        addFile(entries, `betterSliders/${relativePath}`, join(pluginSource, relativePath));
    }
    entries["betterSliders/manifest.json"] = strToU8(`${JSON.stringify({
        license: "GPL-3.0-or-later",
        name: "BetterSliders",
        schemaVersion: 1,
        ...sourceMetadata,
        targetDirectory: "src/userplugins/betterSliders",
        upstreamVencordCommit,
        version
    }, null, 4)}\n`);

    return zipSync(entries, {
        level: 9,
        mtime: new Date(1980, 0, 1, 0, 0, 0)
    });
}

function main() {
    const { output, release, version } = readArguments(process.argv.slice(2));
    if (release) validateRelease(version);
    const outputDirectory = resolve(output);
    const archiveName = `better-sliders-userplugin-v${version}.zip`;
    const archive = createArchive(version, {
        sourceCommit: runGit(["rev-parse", "HEAD"]),
        sourceRepository: "https://github.com/Command1264/Vencord",
        sourceTreeDirty: Boolean(runGit(["status", "--porcelain", "--untracked-files=all"]))
    });
    const hash = createHash("sha256").update(archive).digest("hex");

    mkdirSync(outputDirectory, { recursive: true });
    writeFileSync(join(outputDirectory, archiveName), archive);
    writeFileSync(join(outputDirectory, `${archiveName}.sha256`), `${hash}  ${archiveName}\n`);
    console.log(`Created ${join(outputDirectory, archiveName)}`);
}

try {
    main();
} catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
}
