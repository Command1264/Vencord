/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { FormSwitch } from "@components/FormSwitch";
import { Margins } from "@utils/margins";
import { OptionType } from "@utils/types";
import { Forms, LocaleStore, TextInput, useEffect, useState, useStateFromStores } from "@webpack/common";

import { translate, TranslationKey } from "./i18n";
import { DEFAULT_BETTER_SLIDERS_SETTINGS, resolveBetterSlidersSettings } from "./settingsUtils";

type MultiplierSettingKey = "ctrlMultiplier" | "shiftMultiplier";

interface MultiplierSettingProps {
    descriptionKey: TranslationKey;
    locale: string;
    settingKey: MultiplierSettingKey;
    titleKey: TranslationKey;
    value: number;
}

function MultiplierSetting({ descriptionKey, locale, settingKey, titleKey, value }: MultiplierSettingProps) {
    const [input, setInput] = useState(String(value));
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setInput(String(value));
        setHasError(false);
    }, [value]);

    function handleChange(nextInput: string) {
        setInput(nextInput);

        const nextValue = resolveBetterSlidersSettings({
            [settingKey]: Number(nextInput)
        })[settingKey];
        const isValid = nextInput === String(nextValue);
        setHasError(!isValid);
        if (isValid) settings.store[settingKey] = nextValue;
    }

    return (
        <section className={Margins.bottom16}>
            <Forms.FormTitle tag="h5">{translate(locale, titleKey)}</Forms.FormTitle>
            <Forms.FormText className={Margins.bottom8}>{translate(locale, descriptionKey)}</Forms.FormText>
            <TextInput
                aria-invalid={hasError}
                aria-label={translate(locale, titleKey)}
                error={hasError ? translate(locale, "settings.multiplier.error") : undefined}
                inputMode="numeric"
                onChange={handleChange}
                type="text"
                value={input}
            />
        </section>
    );
}

function BetterSlidersSettingsComponent() {
    const locale = useStateFromStores([LocaleStore], () => LocaleStore.locale);
    const stored = settings.use([
        "ctrlMultiplier",
        "preciseInput",
        "reverseWheel",
        "shiftMultiplier",
        "wheelAdjustment"
    ]);
    const effective = resolveBetterSlidersSettings(stored);

    return (
        <>
            <FormSwitch
                description={translate(locale, "settings.preciseInput.description")}
                onChange={value => settings.store.preciseInput = value}
                title={translate(locale, "settings.preciseInput.title")}
                value={effective.preciseInput}
            />
            <FormSwitch
                description={translate(locale, "settings.wheelAdjustment.description")}
                onChange={value => settings.store.wheelAdjustment = value}
                title={translate(locale, "settings.wheelAdjustment.title")}
                value={effective.wheelAdjustment}
            />
            <MultiplierSetting
                descriptionKey="settings.shiftMultiplier.description"
                locale={locale}
                settingKey="shiftMultiplier"
                titleKey="settings.shiftMultiplier.title"
                value={effective.shiftMultiplier}
            />
            <MultiplierSetting
                descriptionKey="settings.ctrlMultiplier.description"
                locale={locale}
                settingKey="ctrlMultiplier"
                titleKey="settings.ctrlMultiplier.title"
                value={effective.ctrlMultiplier}
            />
            <FormSwitch
                description={translate(locale, "settings.reverseWheel.description")}
                hideBorder
                onChange={value => settings.store.reverseWheel = value}
                title={translate(locale, "settings.reverseWheel.title")}
                value={effective.reverseWheel}
            />
        </>
    );
}

export const settings = definePluginSettings({
    settingsUi: {
        type: OptionType.COMPONENT,
        component: BetterSlidersSettingsComponent
    },
    preciseInput: {
        type: OptionType.CUSTOM,
        default: DEFAULT_BETTER_SLIDERS_SETTINGS.preciseInput
    },
    wheelAdjustment: {
        type: OptionType.CUSTOM,
        default: DEFAULT_BETTER_SLIDERS_SETTINGS.wheelAdjustment
    },
    shiftMultiplier: {
        type: OptionType.CUSTOM,
        default: DEFAULT_BETTER_SLIDERS_SETTINGS.shiftMultiplier
    },
    ctrlMultiplier: {
        type: OptionType.CUSTOM,
        default: DEFAULT_BETTER_SLIDERS_SETTINGS.ctrlMultiplier
    },
    reverseWheel: {
        type: OptionType.CUSTOM,
        default: DEFAULT_BETTER_SLIDERS_SETTINGS.reverseWheel
    }
});

export function getBetterSlidersSettings() {
    return resolveBetterSlidersSettings(settings.store);
}
