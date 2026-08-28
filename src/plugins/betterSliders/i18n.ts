/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const english = {
    "action.apply": "Apply",
    "action.cancel": "Cancel",
    "contextMenu.preciseInput": "Set exact value…",
    "error.aboveMax": "Enter a value no greater than {max}.",
    "error.belowMin": "Enter a value no less than {min}.",
    "error.empty": "Enter a value.",
    "error.invalidContract": "This slider cannot accept precise input right now.",
    "error.invalidMarker": "Enter one of the slider's available marker values.",
    "error.invalidNumber": "Enter a complete decimal number.",
    "error.invalidStep": "Enter a value aligned with this slider's step.",
    "error.nonFinite": "Enter a finite decimal number.",
    "modal.range": "Allowed range: {min} to {max}",
    "modal.title": "Set exact slider value",
    "modal.valueLabel": "Slider value"
} as const;

export type TranslationKey = keyof typeof english;

const traditionalChinese: Partial<Record<TranslationKey, string>> = {
    "action.apply": "套用",
    "action.cancel": "取消",
    "contextMenu.preciseInput": "精確設定數值…",
    "error.aboveMax": "請輸入不大於 {max} 的數值。",
    "error.belowMin": "請輸入不小於 {min} 的數值。",
    "error.empty": "請輸入數值。",
    "error.invalidContract": "這個滑桿目前無法使用精確輸入。",
    "error.invalidMarker": "請輸入這個滑桿提供的標記數值。",
    "error.invalidNumber": "請輸入完整的十進位數字。",
    "error.invalidStep": "請輸入符合這個滑桿間距的數值。",
    "error.nonFinite": "請輸入有限的十進位數字。",
    "modal.range": "允許範圍：{min} 至 {max}",
    "modal.title": "精確設定滑桿數值",
    "modal.valueLabel": "滑桿數值"
};

const TRADITIONAL_CHINESE_LOCALES = new Set(["zh-hant", "zh-hk", "zh-mo", "zh-tw"]);

function isTraditionalChinese(locale: string) {
    return TRADITIONAL_CHINESE_LOCALES.has(locale) || locale.startsWith("zh-hant-");
}

function interpolate(template: string, values: Readonly<Record<string, string | number>>) {
    return template.replace(/\{([^}]+)\}/g, (placeholder, key: string) =>
        Object.hasOwn(values, key) ? String(values[key]) : placeholder);
}

export function translate(
    locale: string,
    key: TranslationKey,
    values: Readonly<Record<string, string | number>> = {}
) {
    const normalizedLocale = locale.toLowerCase().replaceAll("_", "-");
    const template = isTraditionalChinese(normalizedLocale)
        ? traditionalChinese[key] ?? english[key]
        : english[key];

    return interpolate(template, values);
}
