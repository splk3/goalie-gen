export async function getFittedImageDimensions(
  imageSrc: string,
  maxDimension: number
): Promise<{ width: number; height: number }> {
  let imgWidth = maxDimension;
  let imgHeight = maxDimension;

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageSrc;
    });

    const ratio = img.width / img.height;
    if (ratio > 1) {
      imgWidth = maxDimension;
      imgHeight = maxDimension / ratio;
    } else {
      imgHeight = maxDimension;
      imgWidth = maxDimension * ratio;
    }
  } catch (e) {
    console.error("Failed to parse image dimensions", e);
  }

  return { width: imgWidth, height: imgHeight };
}
