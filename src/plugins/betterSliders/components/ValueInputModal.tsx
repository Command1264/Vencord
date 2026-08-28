/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { Paragraph } from "@components/Paragraph";
import { translate, TranslationKey } from "@plugins/betterSliders/i18n";
import { formatPreciseInputValue, PreciseInputContract, validatePreciseInput,ValidationResult } from "@plugins/betterSliders/validation";
import { RenderModalProps } from "@vencord/discord-types";
import { Forms, LocaleStore, Modal, React, TextInput, useEffect, useRef, useState, useStateFromStores } from "@webpack/common";

interface ValueInputModalProps {
    contract: PreciseInputContract;
    initialValue: number;
    modalProps: RenderModalProps;
    onCommit(value: number): void;
}

type ValidationReason = Extract<ValidationResult, { valid: false; }>["reason"];

const validationKeys: Record<ValidationReason, TranslationKey> = {
    "above-max": "error.aboveMax",
    "below-min": "error.belowMin",
    "empty": "error.empty",
    "invalid-contract": "error.invalidContract",
    "invalid-marker": "error.invalidMarker",
    "invalid-number": "error.invalidNumber",
    "invalid-step": "error.invalidStep",
    "non-finite": "error.nonFinite"
};

export function ValueInputModal({ contract, initialValue, modalProps, onCommit }: ValueInputModalProps) {
    const locale = useStateFromStores([LocaleStore], () => LocaleStore.locale);
    const [rawValue, setRawValue] = useState(() => formatPreciseInputValue(initialValue, contract));
    const inputRef = useRef<HTMLInputElement>(null);
    const committedRef = useRef(false);
    const id = React.useId();
    const inputId = `vc-better-sliders-value-${id}`;
    const rangeId = `vc-better-sliders-range-${id}`;
    const errorId = `vc-better-sliders-error-${id}`;
    const validation = validatePreciseInput(rawValue, contract);
    const errorMessage = validation.valid
        ? undefined
        : translate(locale, validationKeys[validation.reason], { max: contract.max, min: contract.min });

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    function submit() {
        if (!validation.valid || committedRef.current) return;

        committedRef.current = true;
        onCommit(validation.value);
        modalProps.onClose();
    }

    return (
        <Modal
            {...modalProps}
            title={translate(locale, "modal.title")}
            actions={[
                {
                    text: translate(locale, "action.cancel"),
                    variant: "secondary",
                    onClick: modalProps.onClose
                },
                {
                    text: translate(locale, "action.apply"),
                    variant: "primary",
                    onClick: submit,
                    disabled: !validation.valid
                }
            ]}
        >
            <Flex flexDirection="column" gap={8}>
                <Forms.FormTitle tag="h5">
                    {translate(locale, "modal.valueLabel")}
                </Forms.FormTitle>
                <TextInput
                    id={inputId}
                    aria-label={translate(locale, "modal.valueLabel")}
                    inputMode="decimal"
                    inputRef={inputRef}
                    maxLength={64}
                    value={rawValue}
                    onChange={setRawValue}
                    onKeyDown={event => {
                        if (event.key !== "Enter") return;

                        event.preventDefault();
                        submit();
                    }}
                    aria-describedby={errorMessage ? `${rangeId} ${errorId}` : rangeId}
                    aria-invalid={Boolean(errorMessage)}
                />
                <Paragraph id={rangeId} color="text-muted">
                    {translate(locale, "modal.range", { max: contract.max, min: contract.min })}
                </Paragraph>
                {errorMessage && (
                    <Paragraph id={errorId} color="text-danger" role="alert">
                        {errorMessage}
                    </Paragraph>
                )}
            </Flex>
        </Modal>
    );
}
