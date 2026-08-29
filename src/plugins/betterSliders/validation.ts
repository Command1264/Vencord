/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface PreciseInputContract {
    keyboardStep?: number;
    markers?: readonly number[];
    max: number;
    min: number;
    stickToMarkers?: boolean;
}

export type ValidationResult = {
    valid: true;
    value: number;
} | {
    reason:
    | "above-max"
    | "below-min"
    | "empty"
    | "invalid-contract"
    | "invalid-marker"
    | "invalid-number"
    | "invalid-step"
    | "non-finite";
    valid: false;
};

const DECIMAL_PATTERN = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/;

function nearlyEqual(left: number, right: number) {
    const scale = Math.max(1, Math.abs(left), Math.abs(right));
    return Math.abs(left - right) <= Number.EPSILON * scale * 8;
}

function decimalPlaces(value: number) {
    const text = value.toString().toLowerCase();
    const [coefficient, exponentText] = text.split("e");
    const exponent = Number(exponentText ?? 0);
    const fractionLength = coefficient.split(".")[1]?.length ?? 0;

    return Math.max(0, fractionLength - exponent);
}

export function formatPreciseInputValue(value: number, contract: PreciseInputContract) {
    if (!Number.isFinite(value)) return String(value);
    if (!Number.isFinite(contract.min)
        || !Number.isFinite(contract.max)
        || contract.min > contract.max
        || value < contract.min
        || value > contract.max) {
        return String(value);
    }

    if (contract.stickToMarkers) {
        const marker = contract.markers?.find(candidate => Number.isFinite(candidate) && nearlyEqual(candidate, value));
        return String(marker ?? value);
    }

    const step = contract.keyboardStep;
    if (step == null || !Number.isFinite(step) || step <= 0) return String(value);

    const requestedStepCount = Math.round((value - contract.min) / step);
    const maximumStepRatio = (contract.max - contract.min) / step;
    const maximumStepCount = nearlyEqual(maximumStepRatio, Math.round(maximumStepRatio))
        ? Math.round(maximumStepRatio)
        : Math.floor(maximumStepRatio);
    const stepCount = Math.min(Math.max(requestedStepCount, 0), maximumStepCount);
    const normalized = contract.min + stepCount * step;
    const precision = Math.min(15, Math.max(decimalPlaces(step), decimalPlaces(contract.min)));
    const rounded = Number(normalized.toFixed(precision));

    return String(Object.is(rounded, -0) ? 0 : rounded);
}

export function validatePreciseInput(raw: string, contract: PreciseInputContract): ValidationResult {
    if (!Number.isFinite(contract.min)
        || !Number.isFinite(contract.max)
        || contract.min > contract.max
        || (contract.keyboardStep != null
            && (!Number.isFinite(contract.keyboardStep) || contract.keyboardStep <= 0))) {
        return { reason: "invalid-contract", valid: false };
    }

    const input = raw.trim();
    if (!input) return { reason: "empty", valid: false };
    if (!DECIMAL_PATTERN.test(input)) return { reason: "invalid-number", valid: false };

    const value = Number(input);
    if (!Number.isFinite(value)) return { reason: "non-finite", valid: false };
    if (value < contract.min) return { reason: "below-min", valid: false };
    if (value > contract.max) return { reason: "above-max", valid: false };

    if (contract.stickToMarkers) {
        if (!contract.markers?.some(marker => Number.isFinite(marker) && nearlyEqual(marker, value))) {
            return { reason: "invalid-marker", valid: false };
        }
    } else if (contract.keyboardStep != null) {
        const stepCount = (value - contract.min) / contract.keyboardStep;
        if (!nearlyEqual(stepCount, Math.round(stepCount))) {
            return { reason: "invalid-step", valid: false };
        }
    }

    return { valid: true, value };
}
