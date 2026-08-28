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
