/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";

import { EffectiveSliderContract, getWheelAdjustment } from "./sliderUtils";

interface SliderInstance {
    commitValue(value: number, markerIndex?: number): void;
    props: {
        disabled?: boolean;
        keyboardStep?: number;
        stickToMarkers?: boolean;
    };
    state: {
        closestMarkerIndex?: number | null;
        max: number;
        min: number;
        sortedMarkers?: number[];
        value: number;
    };
}

const logger = new Logger("BetterSliders");
const warnedInstances = new WeakSet<object>();

function warnOnce(instance: SliderInstance, error: unknown) {
    if (warnedInstances.has(instance)) return;

    warnedInstances.add(instance);
    logger.warn("Wheel enhancement failed open for a Slider instance.", error);
}

export default definePlugin({
    name: "BetterSliders",
    description: "Enhances Discord sliders with precise right-click value input and mouse-wheel adjustment.",
    authors: [Devs.Command1264],

    patches: [{
        find: "markDash",
        replacement: {
            match: /onKeyDown:this\.handleKeyDown/,
            replace: "onWheel:event=>$self.handleWheel(this,event),$&"
        }
    }],

    handleWheel(instance: SliderInstance, event: React.WheelEvent) {
        try {
            const contract: EffectiveSliderContract = {
                closestMarkerIndex: instance.state.closestMarkerIndex,
                current: instance.state.value,
                disabled: instance.props.disabled,
                keyboardStep: instance.props.keyboardStep ?? 1,
                max: instance.state.max,
                min: instance.state.min,
                sortedMarkers: instance.state.sortedMarkers,
                stickToMarkers: instance.props.stickToMarkers
            };
            const adjustment = getWheelAdjustment(contract, event, {
                ctrlMultiplier: 10,
                reverse: false,
                shiftMultiplier: 5
            });
            if (!adjustment.handled) return;

            instance.commitValue(adjustment.nextValue, adjustment.markerIndex);
            event.preventDefault();
        } catch (error) {
            warnOnce(instance, error);
        }
    }
});
