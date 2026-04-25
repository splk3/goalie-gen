import * as React from "react";

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function FeedbackPopup() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);

  const openFeedback = () => setIsOpen(true);
  const closeFeedback = () => setIsOpen(false);

  // Focus first focusable element on open; restore focus to trigger on close
  React.useEffect(() => {
    if (isOpen) {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      }
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Handle Escape and focus trap (Tab / Shift+Tab)
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeFeedback();
        return;
      }

      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

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
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={openFeedback}
        className="inline-flex items-center justify-center rounded-md border border-white/40 bg-transparent px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-usa-blue dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white dark:focus-visible:ring-offset-gray-800"
      >
        Give Feedback
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeFeedback}
        >
          <div
            ref={dialogRef}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="feedback-heading"
              className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4"
            >
              Give Feedback
            </h2>

            <div className="space-y-3">
              <a
                href="https://github.com/splk3/goalie-gen/issues/new?template=bug_report.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-usa-red hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Report a Bug or Issue
              </a>
              <a
                href="https://github.com/splk3/goalie-gen/issues/new?template=feature_request.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-usa-blue hover:bg-blue-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Request a New Feature
              </a>
              <a
                href="https://github.com/splk3/goalie-gen/issues/new?template=new-drill-template.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Add a New Drill
              </a>
            </div>

            <button
              onClick={closeFeedback}
              className="mt-5 w-full text-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
