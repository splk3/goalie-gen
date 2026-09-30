/**
 * Helpers for choosing a print strategy that reliably opens a print dialog.
 *
 * Desktop browsers honor jsPDF's `autoPrint()` when a generated PDF blob is
 * opened in a new tab. Mobile browsers (e.g. Chrome on Android) and installed
 * PWAs do not: they only display/download the PDF, and standalone PWAs may not
 * expose a browser menu to print it. On those platforms, the generated PDF is
 * rendered into the page and printed via `window.print()` (see
 * `printPdfBlob.ts`), which opens the native system print dialog.
 */

export const PDF_PRINT_ROOT_ID = "pdf-print-root";
export const PDF_PRINT_STYLE_ID = "pdf-print-style";

const MOBILE_USER_AGENT_PATTERN =
  /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i;

const STANDALONE_DISPLAY_MODES = ["standalone", "fullscreen", "minimal-ui"];

interface NavigatorWithExtras extends Navigator {
  userAgentData?: { mobile?: boolean };
  standalone?: boolean;
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as NavigatorWithExtras;
  if (nav.standalone === true) return true;
  if (typeof window.matchMedia !== "function") return false;
  return STANDALONE_DISPLAY_MODES.some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`)?.matches === true
  );
}

export function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as NavigatorWithExtras;
  if (nav.userAgentData?.mobile === true) return true;
  const userAgent = nav.userAgent || "";
  if (MOBILE_USER_AGENT_PATTERN.test(userAgent)) return true;
  // iPadOS reports a desktop Macintosh user agent but exposes touch points.
  return /Macintosh/i.test(userAgent) && (nav.maxTouchPoints || 0) > 1;
}

/**
 * Returns true when the browser cannot be relied on to auto-open the print
 * dialog for a PDF opened in a new tab, so the PDF should be printed in-page.
 */
export function shouldUseInPagePdfPrint(): boolean {
  return isMobileBrowser() || isStandalonePwa();
}

/**
 * Forces lazy-loaded images to load and waits (bounded by `timeoutMs`) for them
 * so they are included in native page printing.
 */
export async function loadImagesForPrint(
  root: ParentNode = document,
  timeoutMs = 3000
): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  const pending = images
    .map((img) => {
      if (img.getAttribute("loading") === "lazy") {
        img.setAttribute("loading", "eager");
      }
      if (img.complete) return null;
      return new Promise<void>((resolve) => {
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    })
    .filter((promise): promise is Promise<void> => promise !== null);

  if (pending.length === 0) return;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, timeoutMs);
  });
  await Promise.race([Promise.all(pending).then(() => undefined), timeout]);
  if (timeoutId !== undefined) clearTimeout(timeoutId);
}

/**
 * Removes the in-page PDF print container and styles added by `printPdfBlob`.
 */
export function cleanupPdfPrint(): void {
  if (typeof document === "undefined") return;
  document.getElementById(PDF_PRINT_ROOT_ID)?.remove();
  document.getElementById(PDF_PRINT_STYLE_ID)?.remove();
}
