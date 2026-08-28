/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addGlobalContextMenuPatch, removeGlobalContextMenuPatch } from "@api/ContextMenu";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { LocaleStore, Menu, openModal, React } from "@webpack/common";

import { ValueInputModal } from "./components/ValueInputModal";
import { translate } from "./i18n";
import { EffectiveSliderContract, getWheelAdjustment } from "./sliderUtils";
import { PreciseInputContract } from "./validation";

interface SliderInstance {
    containerRef: React.RefObject<HTMLDivElement | null>;
    commitValue(value: number, markerIndex?: number): void;
    props: {
        disabled?: boolean;
        keyboardStep?: number;
        stickToMarkers?: boolean;
        value?: number;
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
const bindings = new WeakMap<SliderInstance, SliderBinding>();
const activeBindings = new Set<SliderBinding>();
let isStarted = false;

interface SliderBinding {
    contextMenuListener: (event: MouseEvent) => void;
    instance: SliderInstance;
    root: HTMLDivElement;
    wheelListener: (event: WheelEvent) => void;
}

interface PendingContextMenu {
    contract: PreciseInputContract;
    instance: SliderInstance;
}

let pendingContextMenu: PendingContextMenu | null = null;

function getCurrentValue(instance: SliderInstance) {
    return Number.isFinite(instance.props.value)
        ? instance.props.value!
        : instance.state.value;
}

function warnOnce(instance: SliderInstance, error: unknown) {
    if (warnedInstances.has(instance)) return;

    warnedInstances.add(instance);
    logger.warn("Slider enhancement failed open for an instance.", error);
}

function getPreciseInputContract(instance: SliderInstance): PreciseInputContract | null {
    const { props, state } = instance;
    const currentValue = getCurrentValue(instance);
    const keyboardStep = props.keyboardStep ?? 1;
    if (props.disabled
        || !Number.isFinite(currentValue)
        || !Number.isFinite(state.min)
        || !Number.isFinite(state.max)
        || state.min > state.max
        || !Number.isFinite(keyboardStep)
        || keyboardStep <= 0) {
        return null;
    }

    if (props.stickToMarkers
        && (!state.sortedMarkers?.length || state.sortedMarkers.some(marker => !Number.isFinite(marker)))) {
        return null;
    }

    return {
        keyboardStep,
        markers: state.sortedMarkers,
        max: state.max,
        min: state.min,
        stickToMarkers: props.stickToMarkers
    };
}

function openPreciseInput(instance: SliderInstance, contract: PreciseInputContract) {
    openModal(modalProps => React.createElement(ValueInputModal, {
        contract,
        initialValue: getCurrentValue(instance),
        modalProps,
        onCommit(value: number) {
            const markerIndex = contract.stickToMarkers
                ? contract.markers?.indexOf(value)
                : undefined;
            instance.commitValue(value, markerIndex === -1 ? undefined : markerIndex);
        }
    }));
}

function handleContextMenu(instance: SliderInstance, event: MouseEvent) {
    try {
        const contract = getPreciseInputContract(instance);
        if (!contract) return;

        event.preventDefault();
        const pending = pendingContextMenu = { contract, instance };
        setTimeout(() => {
            if (pendingContextMenu !== pending) return;

            pendingContextMenu = null;
            openPreciseInput(instance, contract);
        }, 0);
    } catch (error) {
        warnOnce(instance, error);
    }
}

function handleWheel(instance: SliderInstance, event: WheelEvent) {
    try {
        const contract: EffectiveSliderContract = {
            closestMarkerIndex: instance.state.closestMarkerIndex,
            current: getCurrentValue(instance),
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

function removeBinding(binding: SliderBinding) {
    binding.root.removeEventListener("contextmenu", binding.contextMenuListener);
    binding.root.removeEventListener("wheel", binding.wheelListener);
    activeBindings.delete(binding);
    bindings.delete(binding.instance);
}

function patchNativeContextMenu(_navId: string, children: Array<React.ReactElement | null>) {
    const pending = pendingContextMenu;
    if (!pending) return;

    pendingContextMenu = null;
    children.push(React.createElement(Menu.MenuItem, {
        action: () => openPreciseInput(pending.instance, pending.contract),
        id: "vc-better-sliders-precise-input",
        key: "vc-better-sliders-precise-input",
        label: translate(LocaleStore.locale, "contextMenu.preciseInput")
    }));
}

export default definePlugin({
    name: "BetterSliders",
    description: "Enhances Discord sliders with precise right-click value input and mouse-wheel adjustment.",
    authors: [Devs.Command1264],

    patches: [{
        find: "markDash",
        replacement: {
            match: /ref:this\.containerRef(?=,children:\[)/,
            replace: "ref:node=>$self.bindSlider(this,node)"
        }
    }],

    start() {
        isStarted = true;
        addGlobalContextMenuPatch(patchNativeContextMenu);
    },

    stop() {
        isStarted = false;
        pendingContextMenu = null;
        removeGlobalContextMenuPatch(patchNativeContextMenu);
        for (const binding of [...activeBindings]) {
            removeBinding(binding);
        }
    },

    bindSlider(instance: SliderInstance, root: HTMLDivElement | null) {
        instance.containerRef.current = root;

        const existing = bindings.get(instance);
        if (existing?.root === root) return;
        if (existing) removeBinding(existing);
        if (!root || !isStarted) return;

        const binding: SliderBinding = {
            contextMenuListener: event => handleContextMenu(instance, event),
            instance,
            root,
            wheelListener: event => handleWheel(instance, event)
        };
        bindings.set(instance, binding);
        activeBindings.add(binding);
        root.addEventListener("contextmenu", binding.contextMenuListener);
        root.addEventListener("wheel", binding.wheelListener, { passive: false });
    }
});
