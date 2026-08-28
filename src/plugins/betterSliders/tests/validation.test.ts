/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validatePreciseInput } from "@plugins/betterSliders/validation";

describe("validatePreciseInput", () => {
    it("accepts complete ordinary decimal notation", () => {
        for (const [raw, value] of [["0", 0], ["12.34", 12.34], [".5", 0.5], ["-.25", -0.25]] as const) {
            assert.deepEqual(validatePreciseInput(raw, { max: 100, min: -100 }), { valid: true, value });
        }
    });

    it("separates empty input from invalid number syntax", () => {
        assert.deepEqual(validatePreciseInput("   ", { max: 100, min: 0 }), { reason: "empty", valid: false });
        for (const raw of ["abc", "50abc", "12.3.4", ".", "-", "-.", "NaN", "Infinity", "-Infinity", "+Infinity", "1e3"]) {
            assert.deepEqual(validatePreciseInput(raw, { max: 100, min: 0 }), {
                reason: "invalid-number",
                valid: false
            });
        }
    });

    it("rejects out-of-range values without clamping", () => {
        assert.deepEqual(validatePreciseInput("-1", { max: 1000, min: 0 }), { reason: "below-min", valid: false });
        assert.deepEqual(validatePreciseInput("1000.1", { max: 1000, min: 0 }), { reason: "above-max", valid: false });
    });

    it("requires an effective marker when marker sticking is enabled", () => {
        const contract = { markers: [1, 2, 4, 8], max: 8, min: 1, stickToMarkers: true } as const;
        assert.deepEqual(validatePreciseInput("4", contract), { valid: true, value: 4 });
        assert.deepEqual(validatePreciseInput("3", contract), { reason: "invalid-marker", valid: false });
    });

    it("respects an explicit keyboard step relative to the minimum", () => {
        const contract = { keyboardStep: 0.25, max: 1, min: -1 };
        assert.deepEqual(validatePreciseInput("-0.75", contract), { valid: true, value: -0.75 });
        assert.deepEqual(validatePreciseInput("-0.7", contract), { reason: "invalid-step", valid: false });
    });

    it("fails closed for an invalid effective contract", () => {
        assert.deepEqual(validatePreciseInput("1", { max: 0, min: 1 }), { reason: "invalid-contract", valid: false });
    });
});
