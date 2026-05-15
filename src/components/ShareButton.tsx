import * as React from "react";

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "w-4 h-4"}
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

interface ShareButtonProps {
  label?: string;
  title?: string;
  className?: string;
  iconClassName?: string;
}

export default function ShareButton({
  label = "Share",
  title,
  className,
  iconClassName,
}: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const shareTitle = title ?? document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
      } catch {
        // User cancelled or share failed — no action needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API unavailable — no action
      }
    }
  };

  return (
    <button onClick={handleShare} className={className}>
      <ShareIcon className={iconClassName ?? "w-4 h-4"} />
      {copied ? "Copied!" : label}
    </button>
  );
}
