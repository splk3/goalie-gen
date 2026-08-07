import * as React from "react";
import Modal from "./Modal";

const KIT_EMBED_SRC = "https://goaliegen.kit.com/b608e069fe/index.js";
const KIT_EMBED_UID = "b608e069fe";

export default function EmailSignupButton() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const formContainerRef = React.useRef<HTMLDivElement>(null);
  const hasLoadedFormRef = React.useRef<boolean>(false);

  const openSignup = () => setIsOpen(true);
  const closeSignup = () => setIsOpen(false);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSignup();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen || !formContainerRef.current || hasLoadedFormRef.current) return;

    const container = formContainerRef.current;
    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-uid", KIT_EMBED_UID);
    script.src = KIT_EMBED_SRC;
    container.appendChild(script);
    hasLoadedFormRef.current = true;
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={openSignup}
        className="inline-flex items-center justify-center rounded-md border border-white/40 bg-transparent px-3 py-1.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-usa-blue dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white dark:focus-visible:ring-offset-gray-800"
      >
        Get Email Updates
      </button>

      <Modal
        isOpen={isOpen}
        labelledBy="email-signup-heading"
        className="max-w-lg w-full"
        triggerRef={triggerRef}
        keepMounted={true}
      >
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          <h2
            id="email-signup-heading"
            className="text-2xl font-bold text-usa-blue dark:text-blue-400 mb-4"
          >
            Sign Up for Email Updates
          </h2>
          <div ref={formContainerRef} />
        </div>
        <div className="px-6 pb-6 flex-shrink-0">
          <button
            onClick={closeSignup}
            className="w-full text-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
