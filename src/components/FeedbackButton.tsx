import * as React from "react";
import Modal from "./Modal";

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const openFeedback = () => setIsOpen(true);
  const closeFeedback = () => setIsOpen(false);

  // Handle Escape key to close modal (focus trap is handled by Modal)
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeFeedback();
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

      <Modal
        isOpen={isOpen}
        labelledBy="feedback-heading"
        className="max-w-lg w-full"
        triggerRef={triggerRef}
      >
        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
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
        </div>

        {/* Non-scrolling footer — close button always visible */}
        <div className="px-6 pb-6 flex-shrink-0">
          <button
            onClick={closeFeedback}
            className="w-full text-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
