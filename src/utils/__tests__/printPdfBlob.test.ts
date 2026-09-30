import { printPdfBlob, renderPdfBlobToImages } from "../printPdfBlob";
import { cleanupPdfPrint, PDF_PRINT_ROOT_ID, PDF_PRINT_STYLE_ID } from "../printSupport";

const mockRender = jest.fn(() => ({ promise: Promise.resolve() }));
const mockPageCleanup = jest.fn();
const mockLoadingTaskDestroy = jest.fn(() => Promise.resolve());
const mockGetDocument = jest.fn();
const mockGlobalWorkerOptions = { workerSrc: "" };

jest.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
  GlobalWorkerOptions: mockGlobalWorkerOptions,
}));
jest.mock("../pdfjsWorkerSrc", () => ({
  getPdfWorkerSrc: () => "/pdf.worker.min.mjs",
}));

// A4 in PDF points.
const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

function mockPdfWithPages(numPages: number) {
  mockGetDocument.mockReturnValue({
    promise: Promise.resolve({
      numPages,
      getPage: jest.fn(() =>
        Promise.resolve({
          getViewport: ({ scale }: { scale: number }) => ({
            width: A4_WIDTH_PT * scale,
            height: A4_HEIGHT_PT * scale,
          }),
          render: mockRender,
          cleanup: mockPageCleanup,
        })
      ),
    }),
    destroy: mockLoadingTaskDestroy,
  });
}

function createPdfBlob(): Blob {
  const blob = new Blob(["%PDF-1.3"], { type: "application/pdf" });
  // jsdom's Blob does not implement arrayBuffer() in all versions.
  Object.defineProperty(blob, "arrayBuffer", {
    value: () => Promise.resolve(new TextEncoder().encode("%PDF-1.3").buffer),
  });
  return blob;
}

describe("printPdfBlob", () => {
  const originalPrint = window.print;
  const originalToDataUrl = HTMLCanvasElement.prototype.toDataURL;
  const originalCompleteDescriptor = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "complete"
  );

  beforeEach(() => {
    mockRender.mockClear();
    mockPageCleanup.mockClear();
    mockLoadingTaskDestroy.mockClear();
    mockGetDocument.mockReset();
    mockGlobalWorkerOptions.workerSrc = "";
    window.print = jest.fn();
    HTMLCanvasElement.prototype.toDataURL = jest.fn(() => "data:image/png;base64,AAAA");
    // jsdom does not decode images; treat rendered page images as loaded.
    Object.defineProperty(HTMLImageElement.prototype, "complete", {
      configurable: true,
      get: () => true,
    });
  });

  afterEach(() => {
    cleanupPdfPrint();
    window.print = originalPrint;
    HTMLCanvasElement.prototype.toDataURL = originalToDataUrl;
    if (originalCompleteDescriptor) {
      Object.defineProperty(HTMLImageElement.prototype, "complete", originalCompleteDescriptor);
    }
  });

  it("renders every PDF page to an image sized to the PDF page", async () => {
    mockPdfWithPages(2);

    const pages = await renderPdfBlobToImages(createPdfBlob(), 2);

    expect(mockGlobalWorkerOptions.workerSrc).toBe("/pdf.worker.min.mjs");
    expect(pages).toHaveLength(2);
    expect(pages[0].src).toBe("data:image/png;base64,AAAA");
    expect(pages[0].widthMm).toBe(210);
    expect(pages[0].heightMm).toBe(297);
    expect(mockRender).toHaveBeenCalledTimes(2);
    expect(mockRender).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "print", viewport: expect.anything() })
    );
    expect(mockPageCleanup).toHaveBeenCalledTimes(2);
    expect(mockLoadingTaskDestroy).toHaveBeenCalledTimes(1);
  });

  it("prints the rendered PDF pages instead of the web page layout", async () => {
    mockPdfWithPages(2);

    await printPdfBlob(createPdfBlob());

    expect(window.print).toHaveBeenCalledTimes(1);
    const root = document.getElementById(PDF_PRINT_ROOT_ID);
    expect(root).not.toBeNull();
    expect(root?.querySelectorAll("img")).toHaveLength(2);
    const style = document.getElementById(PDF_PRINT_STYLE_ID);
    expect(style?.textContent).toContain("@media print");
    expect(style?.textContent).toContain(`body > *:not(#${PDF_PRINT_ROOT_ID})`);
    expect(style?.textContent).toContain("@page { size: 210mm 297mm; margin: 0; }");

    window.dispatchEvent(new Event("afterprint"));
    expect(document.getElementById(PDF_PRINT_ROOT_ID)).toBeNull();
    expect(document.getElementById(PDF_PRINT_STYLE_ID)).toBeNull();
  });

  it("does not print when the PDF has no pages", async () => {
    mockPdfWithPages(0);

    await expect(printPdfBlob(createPdfBlob())).rejects.toThrow(/no pages/);
    expect(window.print).not.toHaveBeenCalled();
    expect(document.getElementById(PDF_PRINT_ROOT_ID)).toBeNull();
  });
});
