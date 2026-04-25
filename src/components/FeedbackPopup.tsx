import * as React from "react";

export default function FeedbackPopup() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const openFeedback = () => setIsOpen(true);
  const closeFeedback = () => setIsOpen(false);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        closeFeedback();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
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
