import sharp, { type Metadata } from "sharp";

export class ImageValidationError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 413 | 415 = 400,
  ) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export type ImageValidationOptions = {
  maxBytes: number;
  minWidth: number;
  minHeight: number;
  maxPixels: number;
};

export type ValidatedImage = {
  format: "jpeg" | "tiff";
  extension: "jpg" | "tiff";
  contentType: "image/jpeg" | "image/tiff";
  width: number;
  height: number;
  size: number;
};

export async function validateImage(
  file: File,
  options: ImageValidationOptions,
): Promise<ValidatedImage> {
  for (const [name, value] of Object.entries(options)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`Invalid image validation option: ${name}`);
    }
  }

  if (file.size === 0) {
    throw new ImageValidationError("Image must not be empty");
  }

  if (file.size > options.maxBytes) {
    throw new ImageValidationError(
      `Image exceeds ${options.maxBytes} bytes`,
      413,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const signature = buffer.subarray(0, 4);

  const isJpeg =
    signature[0] === 0xff &&
    signature[1] === 0xd8 &&
    signature[2] === 0xff;

  const isTiff =
    // TIFF little-endian or BigTIFF little-endian.
    (signature[0] === 0x49 &&
      signature[1] === 0x49 &&
      (signature[2] === 0x2a || signature[2] === 0x2b) &&
      signature[3] === 0x00) ||
    // TIFF big-endian or BigTIFF big-endian.
    (signature[0] === 0x4d &&
      signature[1] === 0x4d &&
      signature[2] === 0x00 &&
      (signature[3] === 0x2a || signature[3] === 0x2b));

  if (!isJpeg && !isTiff) {
    throw new ImageValidationError(
      "Only JPEG and TIFF images are accepted",
      415,
    );
  }

  const decoderOptions = {
    failOn: "warning" as const,
    limitInputPixels: options.maxPixels,
  };

  let metadata: Metadata;

  try {
    metadata = await sharp(buffer, decoderOptions).metadata();
  } catch {
    throw new ImageValidationError(
      "Image cannot be read or exceeds the pixel limit",
    );
  }

  const format = metadata.format;

  if (
    (format !== "jpeg" && format !== "tiff") ||
    (isJpeg && format !== "jpeg") ||
    (isTiff && format !== "tiff")
  ) {
    throw new ImageValidationError("Image format is invalid", 415);
  }

  if ((metadata.pages ?? 1) !== 1) {
    throw new ImageValidationError(
      "Only single-page images are accepted",
    );
  }

  const rawWidth = metadata.width;
  const rawHeight = metadata.height;

  if (!rawWidth || !rawHeight) {
    throw new ImageValidationError("Image dimensions are missing");
  }

  // EXIF orientations 5–8 swap the displayed width and height.
  const swapDimensions = [5, 6, 7, 8].includes(
    metadata.orientation ?? 1,
  );

  const width = swapDimensions ? rawHeight : rawWidth;
  const height = swapDimensions ? rawWidth : rawHeight;

  if (width * height > options.maxPixels) {
    throw new ImageValidationError("Image exceeds the pixel limit");
  }

  if (width < options.minWidth || height < options.minHeight) {
    throw new ImageValidationError(
      `Image must be at least ${options.minWidth} x ${options.minHeight} pixels`,
    );
  }

  // Decode pixel data as well: metadata alone cannot detect all damaged files.
  // stats() avoids returning a large raw pixel buffer to JavaScript.
  try {
    await sharp(buffer, decoderOptions).stats();
  } catch {
    throw new ImageValidationError(
      "Image pixel data is damaged or incomplete",
    );
  }

  return {
    format,
    extension: format === "jpeg" ? "jpg" : "tiff",
    contentType: format === "jpeg" ? "image/jpeg" : "image/tiff",
    width,
    height,
    size: file.size,
  };
}