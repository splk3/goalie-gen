import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ImageUploader from "../ImageUploader";
import { rasterizeSvgFileToPngDataUrl } from "../../utils/svgRasterize";

jest.mock("../../utils/svgRasterize", () => ({
  isSvgImageFile: jest.fn((file: File) => file.type === "image/svg+xml"),
  rasterizeSvgFileToPngDataUrl: jest.fn(),
}));

// react-image-crop uses ResizeObserver internally; stub it for jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("ImageUploader", () => {
  let onImageCropped: jest.Mock;
  const mockedRasterizeSvgFileToPngDataUrl = jest.mocked(rasterizeSvgFileToPngDataUrl);

  beforeEach(() => {
    onImageCropped = jest.fn();
    mockedRasterizeSvgFileToPngDataUrl.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the label and file input", () => {
    render(<ImageUploader onImageCropped={onImageCropped} />);
    expect(screen.getByLabelText("Image (Optional)")).toBeInTheDocument();
  });

  it("calls onImageCropped(null, null) when a non-image file is selected", async () => {
    render(<ImageUploader onImageCropped={onImageCropped} />);

    const input = screen.getByLabelText("Image (Optional)") as HTMLInputElement;
    const nonImageFile = new File(["hello"], "document.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [nonImageFile] } });

    await waitFor(() => {
      expect(onImageCropped).toHaveBeenCalledWith(null, null);
    });

    expect(screen.getByText("Please select an image file")).toBeInTheDocument();
  });

  it("calls onImageCropped(null, null) when a file larger than 5 MB is selected", async () => {
    render(<ImageUploader onImageCropped={onImageCropped} />);

    const input = screen.getByLabelText("Image (Optional)") as HTMLInputElement;

    // Create a fake image file that is 6 MB
    const oversizedFile = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    // Override size because jsdom doesn't compute it from the buffer
    Object.defineProperty(oversizedFile, "size", { value: 6 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [oversizedFile] } });

    await waitFor(() => {
      expect(onImageCropped).toHaveBeenCalledWith(null, null);
    });

    expect(screen.getByText("Image file size must be less than 5MB")).toBeInTheDocument();
  });

  it("calls onImageCropped(null, null) when the input is cleared", async () => {
    render(<ImageUploader onImageCropped={onImageCropped} />);

    const input = screen.getByLabelText("Image (Optional)") as HTMLInputElement;

    // Clear the input (no files selected)
    fireEvent.change(input, { target: { files: [] } });

    await waitFor(() => {
      expect(onImageCropped).toHaveBeenCalledWith(null, null);
    });
  });

  it("shows no error for a valid small image file", async () => {
    // Mock FileReader to avoid async complexity in jsdom
    const mockFileReader = {
      readAsDataURL: jest.fn(function (this: FileReader) {
        // Trigger onloadend with a fake data URL
        setTimeout(() => {
          if (this.onloadend) {
            Object.defineProperty(this, "result", { value: "data:image/png;base64,abc" });
            this.onloadend(new ProgressEvent("loadend") as ProgressEvent<FileReader>);
          }
        }, 0);
      }),
      onloadend: null as EventListenerOrEventListenerObject | null,
      result: null as string | ArrayBuffer | null,
    };

    jest
      .spyOn(global, "FileReader")
      .mockImplementation(() => mockFileReader as unknown as FileReader);

    render(<ImageUploader onImageCropped={onImageCropped} />);

    const input = screen.getByLabelText("Image (Optional)") as HTMLInputElement;
    const validFile = new File(["img"], "logo.png", { type: "image/png" });
    Object.defineProperty(validFile, "size", { value: 1024 }); // 1 KB

    fireEvent.change(input, { target: { files: [validFile] } });

    // No validation error should be shown
    expect(screen.queryByText("Please select an image file")).not.toBeInTheDocument();
    expect(screen.queryByText("Image file size must be less than 5MB")).not.toBeInTheDocument();
  });

  it("disables the file input when disabled prop is true", () => {
    render(<ImageUploader onImageCropped={onImageCropped} disabled={true} />);
    const input = screen.getByLabelText("Image (Optional)") as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it("rasterizes SVG uploads before showing crop preview", async () => {
    mockedRasterizeSvgFileToPngDataUrl.mockResolvedValue("data:image/png;base64,svg-raster");
    render(<ImageUploader onImageCropped={onImageCropped} />);

    const input = screen.getByLabelText("Image (Optional)") as HTMLInputElement;
    const svgFile = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });

    fireEvent.change(input, { target: { files: [svgFile] } });

    await waitFor(() => {
      expect(mockedRasterizeSvgFileToPngDataUrl).toHaveBeenCalledWith(svgFile);
    });
    await waitFor(() => {
      expect(screen.getByAltText("Crop preview")).toHaveAttribute(
        "src",
        "data:image/png;base64,svg-raster"
      );
    });
  });

  it("shows an error and clears output when SVG rasterization fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockedRasterizeSvgFileToPngDataUrl.mockRejectedValue(new Error("broken svg"));
    render(<ImageUploader onImageCropped={onImageCropped} />);

    const input = screen.getByLabelText("Image (Optional)") as HTMLInputElement;
    const svgFile = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });

    fireEvent.change(input, { target: { files: [svgFile] } });

    await waitFor(() =>
      expect(
        screen.getByText(
          "Unable to process this SVG file. Please try another SVG or upload a PNG/JPG image."
        )
      ).toBeInTheDocument()
    );
    expect(onImageCropped).toHaveBeenCalledWith(null, null);
  });
});
