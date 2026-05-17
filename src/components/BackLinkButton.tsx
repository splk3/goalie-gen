import * as React from "react";
import { Link } from "gatsby";

interface BackLinkButtonProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export default function BackLinkButton({ to, children, className = "" }: BackLinkButtonProps) {
  const baseClasses =
    "inline-flex max-w-full items-center justify-center gap-2 rounded-lg bg-usa-blue px-4 py-3 text-center font-bold text-white transition-colors hover:bg-blue-800 sm:w-auto sm:px-6";

  return (
    <Link to={to} className={[baseClasses, className].filter(Boolean).join(" ")}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-5 w-5 shrink-0"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
          clipRule="evenodd"
        />
      </svg>
      <span className="min-w-0 break-words">{children}</span>
    </Link>
  );
}
