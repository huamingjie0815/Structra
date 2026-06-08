import { type KeyboardEvent, type RefObject, useEffect } from "react";

type ModalFocusLifecycleOptions = {
  rootRef: RefObject<HTMLElement>;
  active?: boolean;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

function getFocusableElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true"
  );
}

export function useModalFocusLifecycle({ rootRef, active = true }: ModalFocusLifecycleOptions) {
  useEffect(() => {
    if (!active) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = rootRef.current;
    const firstFocusable = root ? getFocusableElements(root)[0] : null;
    if (firstFocusable && !root?.contains(document.activeElement)) {
      firstFocusable.focus();
    }
    return () => {
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [active, rootRef]);

  return {
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      if (event.key !== "Tab") return;
      const root = rootRef.current;
      if (!root) return;
      const focusableElements = getFocusableElements(root);
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };
}
