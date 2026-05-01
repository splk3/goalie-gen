import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageUploaderProps {
  onImageCropped: (file: File | null, previewUrl: string | null) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onImageCropped, disabled = false }: ImageUploaderProps) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [validationError, setValidationError] = useState<string>("");
  const [aspectWarning, setAspectWarning] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setValidationError("Please select an image file");
        setImgSrc("");
        setAspectWarning("");
        onImageCropped(null, null);
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setValidationError("Image file size must be less than 5MB");
        setImgSrc("");
        setAspectWarning("");
        onImageCropped(null, null);
        return;
      }

      setValidationError("");
      setAspectWarning("");
      setFileName(file.name);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImgSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImgSrc("");
      setValidationError("");
      setAspectWarning("");
      onImageCropped(null, null);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;

    const ratio = width / height;

    let c: Crop;
    if (ratio > 2) {
      c = centerCrop(
        makeAspectCrop({ width: 100, unit: "%" }, 2, width, height),
        width,
        height
      );
      setAspectWarning("Image is very wide. The recommended maximum ratio is 2:1. Please adjust the crop area.");
    } else if (ratio < 0.5) {
      c = centerCrop(
        makeAspectCrop({ height: 100, unit: "%" }, 0.5, width, height),
        width,
        height
      );
      setAspectWarning("Image is very tall. The recommended maximum ratio is 1:2. Please adjust the crop area.");
    } else {
      c = {
        unit: "%",
        width: 100,
        height: 100,
        x: 0,
        y: 0
      };
      setAspectWarning("");
    }

    setCrop(c);
    // Important: we need to trigger completedCrop so it immediately gives us the crop coordinates for rendering and drawing!
    // ReactCrop itself fires onComplete on user interaction, but we must set initial crop state:
    setCompletedCrop(c as PixelCrop);
  };

  const generateCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Check if the crop dimensions are zero
    if (!completedCrop.width || !completedCrop.height) return;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.imageSmoothingQuality = "high";

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const base64Image = canvas.toDataURL("image/png");
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], fileName.replace(/\.[^/.]+$/, "") + "_cropped.png", { type: "image/png" });
      onImageCropped(file, base64Image);
    }, "image/png");
  }, [completedCrop, fileName, onImageCropped]);

  useEffect(() => {
    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      generateCroppedImage();
    } else if (!imgSrc) {
      onImageCropped(null, null);
    }
  }, [completedCrop, imgSrc, generateCroppedImage]);

  return (
    <div className="mb-6">
      <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
        Image (Optional)
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        disabled={disabled}
        className="w-full px-4 py-2 border-2 border-usa-blue dark:border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-usa-blue dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-usa-blue file:text-white hover:file:bg-blue-900 dark:file:bg-blue-600 dark:hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
      />

      {validationError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-lg text-sm">
          {validationError}
        </div>
      )}

      {aspectWarning && (
        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
          {aspectWarning}
        </div>
      )}

      {imgSrc && (
        <div className="mt-4 flex justify-center bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-2 overflow-hidden">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            minWidth={50}
            minHeight={50}
          >
            <img
              ref={imgRef}
              alt="Crop preview"
              src={imgSrc}
              onLoad={onImageLoad}
              className="max-w-full"
              style={{ maxHeight: "400px", objectFit: "contain", display: "block" }}
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>
      )}
    </div>
  );
}
