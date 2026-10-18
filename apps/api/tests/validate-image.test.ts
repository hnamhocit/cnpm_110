import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import {
  validateImage,
  type ImageValidationOptions,
} from "../src/utils/validate-image";

const options: ImageValidationOptions = {
  maxBytes: 5 * 1024 * 1024,
  minWidth: 100,
  minHeight: 100,
  maxPixels: 1_000_000,
};

async function makeImage(
  format: "jpeg" | "tiff" | "png",
  width = 120,
  height = 100,
) {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 100, g: 150, b: 200 },
    },
  })
    .toFormat(format)
    .toBuffer();

  return new File([new Uint8Array(buffer)], `test.${format}`, {
    type: `image/${format}`,
  });
}

describe("FPC-33 image validation", () => {
  test("accepts JPEG and returns dimensions", async () => {
    const file = await makeImage("jpeg");
    const result = await validateImage(file, options);

    expect(result.format).toBe("jpeg");
    expect(result.extension).toBe("jpg");
    expect(result.contentType).toBe("image/jpeg");
    expect(result.width).toBe(120);
    expect(result.height).toBe(100);
    expect(result.size).toBe(file.size);
  });

  test("accepts TIFF", async () => {
    const result = await validateImage(await makeImage("tiff"), options);

    expect(result.format).toBe("tiff");
    expect(result.extension).toBe("tiff");
    expect(result.contentType).toBe("image/tiff");
  });

  test("accepts dimensions exactly at minimum", async () => {
    const result = await validateImage(
      await makeImage("jpeg", 100, 100),
      options,
    );

    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });

  test("rejects width below minimum", async () => {
    await expect(
      validateImage(await makeImage("jpeg", 99, 100), options),
    ).rejects.toMatchObject({ status: 400 });
  });

  test("rejects height below minimum", async () => {
    await expect(
      validateImage(await makeImage("jpeg", 100, 99), options),
    ).rejects.toMatchObject({ status: 400 });
  });

  test("rejects empty file", async () => {
    await expect(
      validateImage(new File([], "empty.jpg"), options),
    ).rejects.toMatchObject({ status: 400 });
  });

  test("rejects oversized file", async () => {
    const file = await makeImage("jpeg");

    await expect(
      validateImage(file, { ...options, maxBytes: file.size - 1 }),
    ).rejects.toMatchObject({ status: 413 });
  });

  test("accepts file exactly at size limit", async () => {
    const file = await makeImage("jpeg");
    const result = await validateImage(file, {
      ...options,
      maxBytes: file.size,
    });

    expect(result.size).toBe(file.size);
  });

  test("rejects PNG even with a JPEG filename and MIME", async () => {
    const png = await makeImage("png");
    const fakeJpeg = new File([await png.arrayBuffer()], "fake.jpg", {
      type: "image/jpeg",
    });

    await expect(
      validateImage(fakeJpeg, options),
    ).rejects.toMatchObject({ status: 415 });
  });

  test("rejects fake JPEG header", async () => {
    const file = new File(
      [new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x01])],
      "broken.jpg",
      { type: "image/jpeg" },
    );

    await expect(
      validateImage(file, options),
    ).rejects.toMatchObject({ status: 400 });
  });

  test("rejects image exceeding pixel limit", async () => {
    await expect(
      validateImage(await makeImage("jpeg"), {
        ...options,
        maxPixels: 10_000,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  test("detects format from content instead of MIME", async () => {
    const jpeg = await makeImage("jpeg");
    const file = new File([await jpeg.arrayBuffer()], "upload.bin", {
      type: "application/octet-stream",
    });

    const result = await validateImage(file, options);

    expect(result.format).toBe("jpeg");
    expect(result.contentType).toBe("image/jpeg");
  });
});
  test("respects EXIF orientation when checking dimensions", async () => {
    const buffer = await sharp({
      create: {
        width: 120,
        height: 100,
        channels: 3,
        background: "white",
      },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();

    const file = new File([new Uint8Array(buffer)], "rotated.jpg", {
      type: "image/jpeg",
    });

    const result = await validateImage(file, options);

    expect(result.width).toBe(100);
    expect(result.height).toBe(120);
  });

  test("rejects invalid validation configuration", async () => {
    const file = await makeImage("jpeg");

    await expect(
      validateImage(file, { ...options, minWidth: 0 }),
    ).rejects.toThrow("Invalid image validation option: minWidth");
  });