export const getPdfWorkerSrc = (): string =>
  new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
