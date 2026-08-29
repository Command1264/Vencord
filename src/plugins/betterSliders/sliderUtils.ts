/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface EffectiveSliderContract {
    current: number;
    disabled?: boolean;
    keyboardStep: number;
    max: number;
    min: number;
    sortedMarkers?: readonly number[];
    stickToMarkers?: boolean;
}

export interface WheelIntent {
    ctrlKey?: boolean;
    deltaY: number;
    shiftKey?: boolean;
}

export interface WheelSettings {
    ctrlMultiplier: number;
    reverse: boolean;
    shiftMultiplier: number;
}

export type WheelAdjustment = {
    handled: true;
    markerIndex?: number;
    nextValue: number;
} | {
    handled: false;
    nextValue?: never;
    reason: "disabled" | "invalid-contract" | "no-direction" | "unchanged";
};

function decimalPlaces(value: number) {
    const text = value.toString().toLowerCase();
    const [coefficient, exponentText] = text.split("e");
    const exponent = Number(exponentText ?? 0);
    const fractionLength = coefficient.split(".")[1]?.length ?? 0;

    return Math.max(0, fractionLength - exponent);
}

function normalizePrecision(value: number, contract: EffectiveSliderContract) {
    const precision = Math.min(15, Math.max(
        decimalPlaces(contract.current),
        decimalPlaces(contract.keyboardStep),
        decimalPlaces(contract.min),
        decimalPlaces(contract.max)
    ));
    const scale = 10 ** precision;

    return Math.round(value * scale) / scale;
}

function hasValidContract(contract: EffectiveSliderContract) {
    return [contract.current, contract.keyboardStep, contract.min, contract.max].every(Number.isFinite)
        && contract.keyboardStep > 0
        && contract.min <= contract.max;
}

export function getWheelAdjustment(
    contract: EffectiveSliderContract,
    intent: WheelIntent,
    settings: WheelSettings
): WheelAdjustment {
    if (contract.disabled) return { handled: false, reason: "disabled" };
    if (!hasValidContract(contract)) return { handled: false, reason: "invalid-contract" };
    if (!Number.isFinite(intent.deltaY) || intent.deltaY === 0) {
        return { handled: false, reason: "no-direction" };
    }

    const direction = Math.sign(-intent.deltaY) * (settings.reverse ? -1 : 1);

    if (contract.stickToMarkers) {
        const markers = contract.sortedMarkers;
        if (!markers?.length || markers.some((marker, index) => !Number.isFinite(marker)
            || marker < contract.min
            || marker > contract.max
            || (index > 0 && marker < markers[index - 1]))) {
            return { handled: false, reason: "invalid-contract" };
        }
        let markerIndex = direction > 0 ? 0 : markers.length - 1;
        while (markerIndex >= 0 && markerIndex < markers.length) {
            const marker = markers[markerIndex];
            if (direction > 0 ? marker > contract.current : marker < contract.current) {
                return { handled: true, markerIndex, nextValue: marker };
            }
            markerIndex += direction;
        }
        return { handled: false, reason: "unchanged" };
    }

    const multiplier = intent.ctrlKey
        ? settings.ctrlMultiplier
        : intent.shiftKey
            ? settings.shiftMultiplier
            : 1;
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
        return { handled: false, reason: "invalid-contract" };
    }

    const candidate = contract.current + direction * contract.keyboardStep * multiplier;
    const nextValue = normalizePrecision(Math.min(Math.max(candidate, contract.min), contract.max), contract);
    if (nextValue === contract.current) return { handled: false, reason: "unchanged" };

    return { handled: true, nextValue };
}
