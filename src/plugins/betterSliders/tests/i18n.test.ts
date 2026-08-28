/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { translate } from "@plugins/betterSliders/i18n";

describe("translate", () => {
    it("renders English and interpolates named values", () => {
        assert.equal(translate("en-US", "modal.title"), "Set exact slider value");
        assert.equal(
            translate("en-US", "modal.range", { max: 1000, min: -100 }),
            "Allowed range: -100 to 1000"
        );
    });

    it("renders explicit Traditional Chinese locales", () => {
        assert.equal(translate("zh-TW", "modal.title"), "精確設定滑桿數值");
        assert.equal(translate("zh-Hant", "action.apply"), "套用");
        assert.equal(translate("zh-Hant-TW", "action.cancel"), "取消");
    });

    it("falls back to English for Simplified Chinese and unrelated locales", () => {
        assert.equal(translate("zh-CN", "modal.title"), "Set exact slider value");
        assert.equal(translate("ja", "action.cancel"), "Cancel");
    });

    it("renders accessible field labels and actionable validation errors", () => {
        assert.equal(translate("en-US", "contextMenu.preciseInput"), "Set exact value…");
        assert.equal(translate("en-US", "modal.valueLabel"), "Slider value");
        assert.equal(
            translate("en-US", "error.aboveMax", { max: 200 }),
            "Enter a value no greater than 200."
        );
        assert.equal(translate("zh-TW", "error.invalidNumber"), "請輸入完整的十進位數字。");
        assert.equal(translate("zh-TW", "contextMenu.preciseInput"), "精確設定數值…");
    });
});
