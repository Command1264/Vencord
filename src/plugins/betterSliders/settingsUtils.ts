/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface BetterSlidersSettings {
    ctrlMultiplier: number;
    preciseInput: boolean;
    reverseWheel: boolean;
    shiftMultiplier: number;
    wheelAdjustment: boolean;
}

export const DEFAULT_BETTER_SLIDERS_SETTINGS: Readonly<BetterSlidersSettings> = {
    ctrlMultiplier: 10,
    preciseInput: true,
    reverseWheel: false,
    shiftMultiplier: 5,
    wheelAdjustment: true
};

function resolveBoolean(value: unknown, fallback: boolean) {
    return typeof value === "boolean" ? value : fallback;
}

function resolveMultiplier(value: unknown, fallback: number) {
    return typeof value === "number"
        && Number.isInteger(value)
        && value >= 1
        && value <= 100
        ? value
        : fallback;
}

export function resolveBetterSlidersSettings(input: unknown): BetterSlidersSettings {
    const raw = input != null && typeof input === "object"
        ? input as Readonly<Record<string, unknown>>
        : {};

    return {
        ctrlMultiplier: resolveMultiplier(raw.ctrlMultiplier, DEFAULT_BETTER_SLIDERS_SETTINGS.ctrlMultiplier),
        preciseInput: resolveBoolean(raw.preciseInput, DEFAULT_BETTER_SLIDERS_SETTINGS.preciseInput),
        reverseWheel: resolveBoolean(raw.reverseWheel, DEFAULT_BETTER_SLIDERS_SETTINGS.reverseWheel),
        shiftMultiplier: resolveMultiplier(raw.shiftMultiplier, DEFAULT_BETTER_SLIDERS_SETTINGS.shiftMultiplier),
        wheelAdjustment: resolveBoolean(raw.wheelAdjustment, DEFAULT_BETTER_SLIDERS_SETTINGS.wheelAdjustment)
    };
}
