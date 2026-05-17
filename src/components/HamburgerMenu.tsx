import * as React from "react";
import { Link } from "gatsby";

const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

interface NavLink {
  label: string;
  to: string;
}

const NAV_LINKS: (NavLink | null)[] = [
  { label: "Home", to: "/" },
  null,
  { label: "Goalie Drills", to: "/goalie-drills" },
  { label: "Team Drills with Goalie Focus", to: "/goalie-drills?team_drill=yes" },
  null,
  { label: "Goalie Evaluations", to: "/goalie-evals" },
  { label: "Club Resources", to: "/club-resources" },
  { label: "Coach Resources", to: "/coach-resources" },
  { label: "Goalie Resources", to: "/goalie-resources" },
];

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const wasOpenRef = React.useRef(false);

  const close = React.useCallback(() => setIsOpen(false), []);

  React.useEffect(() => {
    if (!isOpen) return;

    wasOpenRef.current = true;
    drawerRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key !== "Tab") {
        return;
      }

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!drawerRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, close]);

  React.useEffect(() => {
    if (isOpen || !wasOpenRef.current) {
      return;
    }

    wasOpenRef.current = false;
    buttonRef.current?.focus();
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="hamburger-menu-dialog"
        onClick={() => setIsOpen((v) => !v)}
        className="flex flex-col justify-center items-center w-10 h-10 gap-[5px] rounded-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-usa-blue"
      >
        <span className="block w-6 h-0.5 bg-white rounded-full" />
        <span className="block w-6 h-0.5 bg-white rounded-full" />
        <span className="block w-6 h-0.5 bg-white rounded-full" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop — semi-transparent, closes menu when clicked */}
          <div aria-hidden="true" className="fixed inset-0 bg-black/75 z-40" onClick={close} />

          {/* Drawer */}
          <div
            id="hamburger-menu-dialog"
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hamburger-menu-title"
            className="fixed top-0 left-0 h-full w-64 bg-usa-blue dark:bg-gray-900 text-usa-white z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-5 border-b border-white/20">
              <span id="hamburger-menu-title" className="font-bold text-lg">
                Navigation
              </span>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={close}
                className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <nav aria-label="Site navigation" className="flex-1 overflow-y-auto py-3">
              {NAV_LINKS.map((link, i) =>
                link === null ? (
                  <hr key={`divider-${i}`} className="border-white/20 mx-4 my-2" />
                ) : (
                  <Link
                    key={link.to + link.label}
                    to={link.to}
                    onClick={close}
                    className="block px-6 py-3 text-base font-medium hover:bg-white/10 transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
