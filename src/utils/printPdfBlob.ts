import {
  cleanupPdfPrint,
  loadImagesForPrint,
  PDF_PRINT_ROOT_ID,
  PDF_PRINT_STYLE_ID,
} from "./printSupport";
import { getPdfWorkerSrc } from "./pdfjsWorkerSrc";

/**
 * Prints a generated PDF on browsers that cannot auto-print a PDF blob
 * (mobile browsers and installed PWAs).
 *
 * Each PDF page is rendered to an image with pdf.js, the images are placed in a
 * print-only container sized to the PDF page, and `window.print()` opens the
 * native print dialog. The printed output therefore matches the downloaded PDF
 * rather than the web page's print layout.
 */

const POINTS_PER_INCH = 72;
const MM_PER_INCH = 25.4;
// Render at 2.5x of 72 DPI (~180 DPI) for crisp print output without
// exhausting memory on mobile devices.
const PRINT_RENDER_SCALE = 2.5;

export interface RenderedPdfPage {
  src: string;
  widthMm: number;
  heightMm: number;
}

const pointsToMm = (points: number): number =>
  Math.round((points / POINTS_PER_INCH) * MM_PER_INCH * 100) / 100;

export async function renderPdfBlobToImages(
  blob: Blob,
  scale = PRINT_RENDER_SCALE
): Promise<RenderedPdfPage[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = getPdfWorkerSrc();
  }

  const data = new Uint8Array(await blob.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  try {
    const pdf = await loadingTask.promise;
    const pages: RenderedPdfPage[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport, intent: "print" }).promise;
      pages.push({
        src: canvas.toDataURL("image/png"),
        widthMm: pointsToMm(baseViewport.width),
        heightMm: pointsToMm(baseViewport.height),
      });
      // Release canvas memory promptly on memory-constrained devices.
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
    }
    return pages;
  } finally {
    await loadingTask.destroy();
  }
}

const buildPrintStyles = (page: RenderedPdfPage): string => `
#${PDF_PRINT_ROOT_ID} { display: none; }
@media print {
  @page { size: ${page.widthMm}mm ${page.heightMm}mm; margin: 0; }
  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
  body > *:not(#${PDF_PRINT_ROOT_ID}) { display: none !important; }
  #${PDF_PRINT_ROOT_ID} { display: block !important; }
  #${PDF_PRINT_ROOT_ID} img { display: block; break-after: page; page-break-after: always; }
  #${PDF_PRINT_ROOT_ID} img:last-child { break-after: auto; page-break-after: auto; }
}
`;

export async function printPdfBlob(blob: Blob): Promise<void> {
  cleanupPdfPrint();
  const pages = await renderPdfBlobToImages(blob);
  if (pages.length === 0) {
    throw new Error("Generated PDF has no pages to print");
  }

  const style = document.createElement("style");
  style.id = PDF_PRINT_STYLE_ID;
  style.textContent = buildPrintStyles(pages[0]);

  const root = document.createElement("div");
  root.id = PDF_PRINT_ROOT_ID;
  root.setAttribute("aria-hidden", "true");
  pages.forEach((page, index) => {
    const img = document.createElement("img");
    img.src = page.src;
    img.alt = `PDF page ${index + 1}`;
    img.style.width = `${page.widthMm}mm`;
    img.style.height = `${page.heightMm}mm`;
    root.appendChild(img);
  });

  document.head.appendChild(style);
  document.body.appendChild(root);
  await loadImagesForPrint(root);

  window.addEventListener("afterprint", cleanupPdfPrint, { once: true });
  window.print();
}
