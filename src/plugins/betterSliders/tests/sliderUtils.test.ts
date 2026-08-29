/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getWheelAdjustment } from "../sliderUtils";

const baseContract = {
    current: 50,
    min: 0,
    max: 100,
    keyboardStep: 1
};

const settings = {
    ctrlMultiplier: 10,
    reverse: false,
    shiftMultiplier: 5
};

describe("getWheelAdjustment", () => {
    it("maps wheel direction to one native-sized adjustment", () => {
        assert.deepEqual(getWheelAdjustment(baseContract, { deltaY: -100 }, settings), {
            handled: true,
            nextValue: 51
        });
        assert.deepEqual(getWheelAdjustment(baseContract, { deltaY: 100 }, settings), {
            handled: true,
            nextValue: 49
        });
    });

    it("uses Ctrl before Shift and can reverse direction", () => {
        assert.equal(getWheelAdjustment(baseContract, {
            ctrlKey: true,
            deltaY: -1,
            shiftKey: true
        }, settings).nextValue, 60);
        assert.equal(getWheelAdjustment(baseContract, { deltaY: -1 }, {
            ...settings,
            reverse: true
        }).nextValue, 49);
    });

    it("clamps at the range and ignores a no-op at the boundary", () => {
        assert.deepEqual(getWheelAdjustment({ ...baseContract, current: 100 }, { deltaY: -1 }, settings), {
            handled: false,
            reason: "unchanged"
        });
        assert.equal(getWheelAdjustment({ ...baseContract, current: 99 }, { deltaY: -1 }, settings).nextValue, 100);
    });

    it("uses dynamic bounds instead of assuming a percentage range", () => {
        assert.equal(getWheelAdjustment({
            current: 200,
            keyboardStep: 1,
            max: 1000,
            min: -100
        }, { ctrlKey: true, deltaY: -1 }, settings).nextValue, 210);
        assert.equal(getWheelAdjustment({
            current: -99,
            keyboardStep: 1,
            max: 200,
            min: -100
        }, { deltaY: 1 }, settings).nextValue, -100);
    });

    it("normalizes fractional arithmetic to meaningful contract precision", () => {
        assert.equal(getWheelAdjustment({
            current: 0.2,
            keyboardStep: 0.1,
            max: 1,
            min: 0
        }, { deltaY: -1 }, settings).nextValue, 0.3);
        assert.equal(getWheelAdjustment({
            current: 0.05,
            keyboardStep: 0.1,
            max: 1.05,
            min: 0.05
        }, { deltaY: -1 }, settings).nextValue, 0.15);
        assert.equal(getWheelAdjustment({
            current: -0.2,
            keyboardStep: 0.1,
            max: 0,
            min: -1
        }, { deltaY: 1 }, settings).nextValue, -0.3);
    });

    it("moves through effective sorted markers one at a time", () => {
        assert.deepEqual(getWheelAdjustment({
            ...baseContract,
            current: 2,
            sortedMarkers: [1, 2, 4, 8],
            stickToMarkers: true
        }, { ctrlKey: true, deltaY: -1 }, settings), {
            handled: true,
            markerIndex: 2,
            nextValue: 4
        });
    });

    it("skips duplicate markers so one wheel event still changes the value", () => {
        assert.deepEqual(getWheelAdjustment({
            ...baseContract,
            current: 25,
            sortedMarkers: [0, 25, 25, 50],
            stickToMarkers: true
        }, { deltaY: -1 }, settings), {
            handled: true,
            markerIndex: 3,
            nextValue: 50
        });
    });

    it("uses wheel direction to resolve an off-marker tie", () => {
        const tiedContract = {
            ...baseContract,
            current: 3,
            sortedMarkers: [0, 2, 4, 6],
            stickToMarkers: true
        } as const;

        assert.deepEqual(getWheelAdjustment(tiedContract, { deltaY: 1 }, settings), {
            handled: true,
            markerIndex: 1,
            nextValue: 2
        });
    });

    it("fails open when the effective marker list is not sorted", () => {
        assert.deepEqual(getWheelAdjustment({
            ...baseContract,
            current: 50,
            sortedMarkers: [0, 50, 25, 100],
            stickToMarkers: true
        }, { deltaY: -1 }, settings), {
            handled: false,
            reason: "invalid-contract"
        });
    });

    it("fails open when an effective marker falls outside the Slider range", () => {
        assert.deepEqual(getWheelAdjustment({
            ...baseContract,
            current: 50,
            sortedMarkers: [-1, 50, 100],
            stickToMarkers: true
        }, { deltaY: 1 }, settings), {
            handled: false,
            reason: "invalid-contract"
        });
    });

    it("fails open for disabled or invalid contracts and zero-axis events", () => {
        assert.equal(getWheelAdjustment({ ...baseContract, disabled: true }, { deltaY: -1 }, settings).handled, false);
        assert.equal(getWheelAdjustment({ ...baseContract, min: Number.NaN }, { deltaY: -1 }, settings).handled, false);
        assert.equal(getWheelAdjustment({ ...baseContract, min: 101 }, { deltaY: -1 }, settings).handled, false);
        assert.equal(getWheelAdjustment(baseContract, { deltaY: 0 }, settings).handled, false);
    });
});
