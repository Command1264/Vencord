/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveBetterSlidersSettings } from "@plugins/betterSliders/settingsUtils";

describe("resolveBetterSlidersSettings", () => {
    it("provides the documented defaults when no settings were persisted", () => {
        assert.deepEqual(resolveBetterSlidersSettings({}), {
            ctrlMultiplier: 10,
            preciseInput: true,
            reverseWheel: false,
            shiftMultiplier: 5,
            wheelAdjustment: true
        });
    });

    it("uses each valid persisted feature choice", () => {
        assert.deepEqual(resolveBetterSlidersSettings({
            ctrlMultiplier: 42,
            preciseInput: false,
            reverseWheel: true,
            shiftMultiplier: 2,
            wheelAdjustment: false
        }), {
            ctrlMultiplier: 42,
            preciseInput: false,
            reverseWheel: true,
            shiftMultiplier: 2,
            wheelAdjustment: false
        });
    });

    it("falls back per field for malformed, non-finite, fractional, and out-of-range data", () => {
        assert.deepEqual(resolveBetterSlidersSettings({
            ctrlMultiplier: Number.POSITIVE_INFINITY,
            preciseInput: "false",
            reverseWheel: 1,
            shiftMultiplier: 1.5,
            wheelAdjustment: null
        }), {
            ctrlMultiplier: 10,
            preciseInput: true,
            reverseWheel: false,
            shiftMultiplier: 5,
            wheelAdjustment: true
        });
        assert.equal(resolveBetterSlidersSettings({ shiftMultiplier: 0 }).shiftMultiplier, 5);
        assert.equal(resolveBetterSlidersSettings({ ctrlMultiplier: 101 }).ctrlMultiplier, 10);
        assert.deepEqual(resolveBetterSlidersSettings(null), {
            ctrlMultiplier: 10,
            preciseInput: true,
            reverseWheel: false,
            shiftMultiplier: 5,
            wheelAdjustment: true
        });
    });

    it("accepts the inclusive multiplier boundaries", () => {
        const resolved = resolveBetterSlidersSettings({
            ctrlMultiplier: 100,
            shiftMultiplier: 1
        });

        assert.equal(resolved.ctrlMultiplier, 100);
        assert.equal(resolved.shiftMultiplier, 1);
    });
});
