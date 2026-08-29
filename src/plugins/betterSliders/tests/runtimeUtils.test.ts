/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
    createNativeSliderTooltipController,
    createTransientVisibilityController,
    findDivergingBranches,
    installPreciseInputInteractionGuard,
    PRECISE_INPUT_MODAL_KEY,
    replacePreciseInputModal,
    scheduleDetachedCleanup,
    suppressSecondaryButtonEvent
} from "../runtimeUtils";

class TestEventTarget {
    listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

    addEventListener(type: string, listener: EventListenerOrEventListenerObject | null) {
        if (!listener) return;
        const listeners = this.listeners.get(type) ?? new Set();
        listeners.add(listener);
        this.listeners.set(type, listeners);
    }

    removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null) {
        if (!listener) return;
        this.listeners.get(type)?.delete(listener);
    }

    dispatch(type: string, event: Event) {
        for (const listener of this.listeners.get(type) ?? []) {
            if (typeof listener === "function") listener(event);
            else listener.handleEvent(event);
        }
    }
}

function secondaryEvent(target: object, calls: string[]) {
    return {
        button: 2,
        target,
        preventDefault: () => calls.push("prevent-default"),
        stopImmediatePropagation: () => calls.push("stop-immediate-propagation"),
        stopPropagation: () => calls.push("stop-propagation")
    } as unknown as MouseEvent;
}

interface TestNode {
    name: string;
    parentElement: TestNode | null;
}

function child(name: string, parentElement: TestNode | null): TestNode {
    return { name, parentElement };
}

describe("suppressSecondaryButtonEvent", () => {
    it("cancels the native secondary-button path before it can change the Slider", () => {
        const calls: string[] = [];

        suppressSecondaryButtonEvent({
            preventDefault: () => calls.push("prevent-default"),
            stopImmediatePropagation: () => calls.push("stop-immediate-propagation"),
            stopPropagation: () => calls.push("stop-propagation")
        });

        assert.deepEqual(calls, [
            "prevent-default",
            "stop-immediate-propagation",
            "stop-propagation"
        ]);
    });
});

describe("replacePreciseInputModal", () => {
    it("preserves an existing parent modal and replaces only a known Precise Input", () => {
        const calls: string[] = [];
        const closeCallbacks: Array<() => void> = [];
        const renderModal = () => null;
        const dependencies = {
            closeModal: (key: string) => calls.push(`close-modal:${key}`),
            openModal: (_render: typeof renderModal, options: { modalKey: string; onCloseCallback(): void; }) => {
                calls.push(`open-modal:${options.modalKey}`);
                closeCallbacks.push(options.onCloseCallback);
                return options.modalKey;
            }
        };

        replacePreciseInputModal(dependencies, renderModal);
        replacePreciseInputModal(dependencies, renderModal);
        closeCallbacks[0]();
        replacePreciseInputModal(dependencies, renderModal);
        closeCallbacks[1]();
        closeCallbacks[2]();
        replacePreciseInputModal(dependencies, renderModal);

        assert.deepEqual(calls, [
            `open-modal:${PRECISE_INPUT_MODAL_KEY}`,
            `close-modal:${PRECISE_INPUT_MODAL_KEY}`,
            `open-modal:${PRECISE_INPUT_MODAL_KEY}`,
            `close-modal:${PRECISE_INPUT_MODAL_KEY}`,
            `open-modal:${PRECISE_INPUT_MODAL_KEY}`,
            `open-modal:${PRECISE_INPUT_MODAL_KEY}`
        ]);
        closeCallbacks[3]();
    });
});

describe("installPreciseInputInteractionGuard", () => {
    it("closes Precise Input on the first Escape before the preserved menu can consume it", () => {
        const target = new TestEventTarget();
        const calls: string[] = [];
        const event = {
            key: "Escape",
            preventDefault: () => calls.push("prevent-default"),
            stopImmediatePropagation: () => calls.push("stop-immediate-propagation"),
            stopPropagation: () => calls.push("stop-propagation")
        } as unknown as KeyboardEvent;

        installPreciseInputInteractionGuard(target, {} as HTMLElement, () => calls.push("close-modal"));
        target.dispatch("keydown", event);

        assert.deepEqual(calls, [
            "prevent-default",
            "stop-immediate-propagation",
            "stop-propagation",
            "close-modal"
        ]);
    });

    it("keeps background context-menu interactions inert until the modal unmounts", () => {
        const target = new TestEventTarget();
        const modalChild = {};
        const modalAnchor = {
            contains: (node: object) => node === modalChild
        } as HTMLElement;
        const calls: string[] = [];
        const cleanup = installPreciseInputInteractionGuard(target, modalAnchor, () => calls.push("close-modal"));

        target.dispatch("pointerdown", secondaryEvent({}, calls));
        target.dispatch("mousedown", secondaryEvent(modalChild, calls));
        target.dispatch("contextmenu", secondaryEvent({}, calls));

        assert.deepEqual(calls, [
            "prevent-default",
            "stop-immediate-propagation",
            "stop-propagation",
            "prevent-default",
            "stop-immediate-propagation",
            "stop-propagation"
        ]);

        cleanup();
        target.dispatch("contextmenu", secondaryEvent({}, calls));
        assert.equal(calls.length, 6);
    });
});

describe("findDivergingBranches", () => {
    it("finds the sibling layer branches without relying on Discord class names", () => {
        const root = child("root", null);
        const layerContainer = child("layer-container", root);
        const modalLayer = child("modal-layer", layerContainer);
        const dialog = child("dialog", modalLayer);
        const modalAnchor = child("modal-anchor", dialog);
        const menuLayer = child("menu-layer", layerContainer);
        const menu = child("menu", menuLayer);

        const result = findDivergingBranches(modalAnchor, menu);

        assert.equal(result?.commonAncestor, layerContainer);
        assert.equal(result?.modalBranch, modalLayer);
        assert.equal(result?.menuBranch, menuLayer);
        assert.deepEqual(result?.modalPath, [modalAnchor, dialog, modalLayer]);
    });

    it("returns null when one surface contains the other", () => {
        const modalAnchor = child("modal-anchor", null);
        const menu = child("menu", modalAnchor);

        assert.equal(findDivergingBranches(modalAnchor, menu), null);
    });
});

describe("createTransientVisibilityController", () => {
    it("keeps the native bubble visible for 1000 ms after the latest successful wheel adjustment", () => {
        const visibility: boolean[] = [];
        const delays: number[] = [];
        const callbacks = new Map<number, () => void>();
        const cleared: number[] = [];
        let nextTimer = 1;
        const controller = createTransientVisibilityController(
            visible => visibility.push(visible),
            {
                clearTimeout: timer => {
                    cleared.push(timer as number);
                    callbacks.delete(timer as number);
                },
                setTimeout: (callback, delay) => {
                    const timer = nextTimer++;
                    delays.push(delay);
                    callbacks.set(timer, callback);
                    return timer;
                }
            }
        );

        controller.show();
        controller.show();

        assert.deepEqual(visibility, [true, true]);
        assert.deepEqual(delays, [1000, 1000]);
        assert.deepEqual(cleared, [1]);

        callbacks.get(2)?.();
        assert.deepEqual(visibility, [true, true, false]);
    });

    it("cancels the pending hide and restores native visibility ownership on disposal", () => {
        const visibility: boolean[] = [];
        const cleared: unknown[] = [];
        const controller = createTransientVisibilityController(
            visible => visibility.push(visible),
            {
                clearTimeout: timer => cleared.push(timer),
                setTimeout: () => 42
            }
        );

        controller.show();
        controller.dispose();

        assert.deepEqual(cleared, [42]);
        assert.deepEqual(visibility, [true, false]);
    });
});

describe("createNativeSliderTooltipController", () => {
    it("forces the native Tooltip open for 1000 ms", () => {
        const forceOpenChanges: boolean[] = [];
        const callbacks = new Map<number, () => void>();
        let nextTimer = 1;
        const controller = createNativeSliderTooltipController({
            setForceOpen: forceOpen => forceOpenChanges.push(forceOpen)
        }, {
            clearTimeout: timer => callbacks.delete(timer as number),
            setTimeout: callback => {
                const timer = nextTimer++;
                callbacks.set(timer, callback);
                return timer;
            }
        });

        controller.show();
        callbacks.get(1)?.();

        assert.deepEqual(forceOpenChanges, [true, false]);
    });

    it("resets the release timer and closes the forced Tooltip on disposal", () => {
        const forceOpenChanges: boolean[] = [];
        const cleared: number[] = [];
        const callbacks = new Map<number, () => void>();
        let nextTimer = 1;
        const controller = createNativeSliderTooltipController({
            setForceOpen: forceOpen => forceOpenChanges.push(forceOpen)
        }, {
            clearTimeout: timer => {
                cleared.push(timer as number);
                callbacks.delete(timer as number);
            },
            setTimeout: callback => {
                const timer = nextTimer++;
                callbacks.set(timer, callback);
                return timer;
            }
        });

        controller.show();
        controller.show();
        controller.dispose();

        assert.deepEqual(cleared, [1, 2]);
        assert.deepEqual(forceOpenChanges, [true, true, false]);
    });
});

describe("scheduleDetachedCleanup", () => {
    it("keeps timer ownership across a synchronous null-to-root ref handoff", () => {
        let attached = false;
        let scheduled: (() => void) | undefined;
        let cleanupCount = 0;

        scheduleDetachedCleanup(
            () => attached,
            () => cleanupCount++,
            callback => scheduled = callback
        );
        attached = true;
        scheduled?.();

        assert.equal(cleanupCount, 0);
    });

    it("cleans up when the Slider remains detached through the microtask", () => {
        let scheduled: (() => void) | undefined;
        let cleanupCount = 0;

        scheduleDetachedCleanup(
            () => false,
            () => cleanupCount++,
            callback => scheduled = callback
        );
        scheduled?.();

        assert.equal(cleanupCount, 1);
    });
});
