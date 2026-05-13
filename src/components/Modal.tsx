import * as React from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  isOpen: boolean;
  labelledBy: string;
  children: React.ReactNode;
  className?: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Shared modal overlay component.
 *
 * - The visual dark backdrop is `aria-hidden="true"` (decorative only).
 * - The dialog receives `role="dialog"` and `aria-modal="true"`.
 * - Focus is moved to the first focusable element on open and restored to the
 *   trigger element on close (when `triggerRef` is provided).
 * - Tab / Shift+Tab navigation is trapped within the dialog while it is open.
 * - The dialog uses `flex flex-col max-h-[90vh]` so consumers can place a
 *   scrollable content section (`overflow-y-auto flex-1 min-h-0`) and a
 *   non-scrolling footer with action buttons (`flex-shrink-0`), ensuring
 *   close/cancel controls are always visible.
 */
export default function Modal({
  isOpen,
  labelledBy,
  children,
  className = "",
  triggerRef,
}: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const wasOpenRef = React.useRef<boolean>(false);

  // Focus the first focusable element when the modal opens; restore focus to
  // the trigger element when it closes.
  React.useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef?.current?.focus();
    }
  }, [isOpen, triggerRef]);

  // Keep Tab / Shift+Tab navigation within the dialog while it is open.
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // If focus escaped the dialog, pull it back in.
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Visual overlay — purely decorative, hidden from assistive technology */}
      <div aria-hidden="true" className="fixed inset-0 bg-black bg-opacity-50 z-50" />
      {/* Dialog centering container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
        <div
          ref={dialogRef}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col max-h-[90vh] ${className}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          {children}
        </div>
      </div>
    </>
  );
}
