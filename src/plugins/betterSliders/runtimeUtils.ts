/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const PRECISE_INPUT_MODAL_KEY = "vc-better-sliders-precise-input";

interface SecondaryButtonEvent {
    preventDefault(): void;
    stopImmediatePropagation(): void;
    stopPropagation(): void;
}

interface InteractionEventTarget {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions): void;
}

interface PreciseInputModalDependencies<RenderModal> {
    closeModal(key: string): void;
    openModal(renderModal: RenderModal, options: { modalKey: string; }): string;
}

interface Branches<T> {
    commonAncestor: T;
    menuBranch: T;
    modalBranch: T;
    modalPath: T[];
}

interface InlineStyleSnapshot {
    position: string;
    positionPriority: string;
    zIndex: string;
    zIndexPriority: string;
}

interface VisibilityTimerDependencies {
    clearTimeout(timer: unknown): void;
    setTimeout(callback: () => void, delay: number): unknown;
}

const defaultVisibilityTimerDependencies: VisibilityTimerDependencies = {
    clearTimeout: timer => clearTimeout(timer as ReturnType<typeof setTimeout>),
    setTimeout: (callback, delay) => setTimeout(callback, delay)
};

export function createTransientVisibilityController(
    setVisible: (visible: boolean) => void,
    timers: VisibilityTimerDependencies = defaultVisibilityTimerDependencies,
    duration = 1000
) {
    let hideTimer: unknown;

    return {
        dispose() {
            if (hideTimer !== undefined) timers.clearTimeout(hideTimer);
            hideTimer = undefined;
            setVisible(false);
        },
        show() {
            if (hideTimer !== undefined) timers.clearTimeout(hideTimer);
            setVisible(true);
            hideTimer = timers.setTimeout(() => {
                hideTimer = undefined;
                setVisible(false);
            }, duration);
        }
    };
}

export function scheduleDetachedCleanup(
    isAttached: () => boolean,
    cleanup: () => void,
    schedule: (callback: () => void) => void = queueMicrotask
) {
    schedule(() => {
        if (!isAttached()) cleanup();
    });
}

export function suppressSecondaryButtonEvent(event: SecondaryButtonEvent) {
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
}

export function installPreciseInputInteractionGuard(
    target: InteractionEventTarget,
    modalAnchor: HTMLElement,
    onClose: () => void
) {
    const handleKeyDown = (event: Event) => {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key !== "Escape") return;

        suppressSecondaryButtonEvent(keyboardEvent);
        onClose();
    };

    const handleSecondaryButton = (event: Event) => {
        const mouseEvent = event as MouseEvent;
        if (mouseEvent.button !== 2 || modalAnchor.contains(mouseEvent.target as Node)) return;

        suppressSecondaryButtonEvent(mouseEvent);
    };

    target.addEventListener("keydown", handleKeyDown, true);
    target.addEventListener("pointerdown", handleSecondaryButton, true);
    target.addEventListener("mousedown", handleSecondaryButton, true);
    target.addEventListener("contextmenu", handleSecondaryButton, true);

    return () => {
        target.removeEventListener("keydown", handleKeyDown, true);
        target.removeEventListener("pointerdown", handleSecondaryButton, true);
        target.removeEventListener("mousedown", handleSecondaryButton, true);
        target.removeEventListener("contextmenu", handleSecondaryButton, true);
    };
}

export function replacePreciseInputModal<RenderModal>(
    dependencies: PreciseInputModalDependencies<RenderModal>,
    renderModal: RenderModal
) {
    dependencies.closeModal(PRECISE_INPUT_MODAL_KEY);
    return dependencies.openModal(renderModal, { modalKey: PRECISE_INPUT_MODAL_KEY });
}

export function findDivergingBranches<T extends { parentElement: T | null; }>(
    modalAnchor: T,
    menu: T
): Branches<T> | null {
    const modalAncestors = new Set<T>();

    for (let current: T | null = modalAnchor; current; current = current.parentElement) {
        modalAncestors.add(current);
    }

    let commonAncestor: T | null = menu;
    while (commonAncestor && !modalAncestors.has(commonAncestor)) {
        commonAncestor = commonAncestor.parentElement;
    }

    if (!commonAncestor || commonAncestor === modalAnchor || commonAncestor === menu) return null;

    const findBranch = (node: T) => {
        let branch = node;

        while (branch.parentElement && branch.parentElement !== commonAncestor) {
            branch = branch.parentElement;
        }

        return branch.parentElement === commonAncestor ? branch : null;
    };
    const modalBranch = findBranch(modalAnchor);
    const menuBranch = findBranch(menu);

    if (!modalBranch || !menuBranch || modalBranch === menuBranch) return null;

    const modalPath: T[] = [];
    for (let current: T | null = modalAnchor; current && current !== commonAncestor; current = current.parentElement) {
        modalPath.push(current);
    }

    return { commonAncestor, menuBranch, modalBranch, modalPath };
}

function restoreInlineStyle(element: HTMLElement, snapshot: InlineStyleSnapshot) {
    if (snapshot.position) {
        element.style.setProperty("position", snapshot.position, snapshot.positionPriority);
    } else {
        element.style.removeProperty("position");
    }

    if (snapshot.zIndex) {
        element.style.setProperty("z-index", snapshot.zIndex, snapshot.zIndexPriority);
    } else {
        element.style.removeProperty("z-index");
    }
}

export function elevateModalAboveMenu(modalAnchor: HTMLElement): (() => void) | undefined {
    const menus = document.querySelectorAll<HTMLElement>('[role="menu"]');
    const menu = menus[menus.length - 1];
    if (!menu) return;

    const branches = findDivergingBranches(modalAnchor, menu);
    if (!branches) return;

    const elevatedElements = branches.modalPath.map(element => ({
        element,
        snapshot: {
            position: element.style.getPropertyValue("position"),
            positionPriority: element.style.getPropertyPriority("position"),
            zIndex: element.style.getPropertyValue("z-index"),
            zIndexPriority: element.style.getPropertyPriority("z-index")
        } satisfies InlineStyleSnapshot
    }));

    for (const { element } of elevatedElements) {
        if (getComputedStyle(element).position === "static") {
            element.style.setProperty("position", "relative", "important");
        }
        element.style.setProperty("z-index", "2147483647", "important");
    }

    return () => {
        for (const { element, snapshot } of elevatedElements) {
            restoreInlineStyle(element, snapshot);
        }
    };
}
