/**
 * Shared CLI utilities for the `generate-test-*.ts` scripts.
 *
 * These helpers use Node.js APIs (fs, Buffer) and must NOT be imported from
 * web / Gatsby source code.
 */
import * as fs from "fs";

/**
 * Reads the pixel dimensions from a PNG or JPEG file without loading the
 * entire image into memory.  Returns `null` when the format is unrecognised or
 * an error occurs.
 */
export function getImageDimensions(filePath: string): { width: number; height: number } | null {
  try {
    const buffer = fs.readFileSync(filePath);

    // PNG: magic bytes 0x89504e47, width at offset 16, height at offset 20
    if (buffer.readUInt32BE(0) === 0x89504e47) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // JPEG: SOI marker 0xFFD8; scan for SOF0 (0xFFC0) or SOF2 (0xFFC2) segments
    if (buffer.readUInt16BE(0) === 0xffd8) {
      let offset = 2;
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset);
        offset += 2;
        if (marker === 0xffc0 || marker === 0xffc2) {
          const height = buffer.readUInt16BE(offset + 3);
          const width = buffer.readUInt16BE(offset + 5);
          return { width, height };
        }
        const segLength = buffer.readUInt16BE(offset);
        offset += segLength;
      }
    }

    return null;
  } catch (e) {
    console.error("Error reading image dimensions:", e);
    return null;
  }
}
