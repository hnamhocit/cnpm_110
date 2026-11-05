import 'dart:typed_data';

import 'package:flutter_application_2/core/services/image_compression_service.dart';
import 'package:flutter_application_2/models/image_attachment.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';

Uint8List _createSolidImage({
  required int width,
  required int height,
  required String format,
}) {
  final numChannels = format == 'png_alpha' ? 4 : 3;
  final image = img.Image(width: width, height: height, numChannels: numChannels);
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (format == 'png_alpha') {
        final a = (x + y) % 2 == 0 ? 0 : 255;
        image.setPixelRgba(x, y, (x * 5) % 256, (y * 7) % 256, ((x + y) * 3) % 256, a);
      } else {
        image.setPixelRgb(x, y, (x * 5) % 256, (y * 7) % 256, ((x + y) * 3) % 256);
      }
    }
  }
  if (format == 'jpg' || format == 'jpeg') {
    return Uint8List.fromList(img.encodeJpg(image, quality: 85));
  } else if (format == 'tiff' || format == 'tif') {
    return Uint8List.fromList(img.encodeTiff(image));
  } else if (format == 'bmp') {
    return Uint8List.fromList(img.encodeBmp(image));
  } else {
    return Uint8List.fromList(img.encodePng(image, level: 0));
  }
}

void main() {
  const service = ImageCompressionService();

  group('ImageCompressionService', () {
    test('converts small PNG under 5MB to JPEG instead of bypassing (Lỗi 1)', () async {
      // Small PNG (50x50, ~8KB) must NOT be bypassed because Backend only accepts JPEG/TIFF
      final smallPng = _createSolidImage(width: 50, height: 50, format: 'png');
      final attachment = ImageAttachment(
        file: XFile.fromData(smallPng, name: 'logo.png'),
        name: 'logo.png',
        sizeInBytes: smallPng.length,
        bytes: smallPng,
        mimeType: 'image/png',
      );

      final result = await service.compressAttachment(
        attachment,
        config: const ImageCompressionConfig(
          compressThresholdBytes: 5 * 1024 * 1024, // 5 MiB threshold
          requireMinShortEdge: false,
          convertToJpeg: true,
        ),
      );

      // Must be converted to JPEG, never kept as PNG
      expect(result.wasCompressed, isTrue);
      expect(result.attachment.name, 'logo.jpg');
      expect(result.attachment.mimeType, 'image/jpeg');
      expect(result.attachment.bytes, isNotNull);
      // Check JPEG magic bytes: 0xFF, 0xD8, 0xFF
      expect(result.attachment.bytes![0], 0xFF);
      expect(result.attachment.bytes![1], 0xD8);
      expect(result.attachment.bytes![2], 0xFF);
    });

    test('skips re-compression for small, compliant JPEG with proper dimensions', () async {
      final compliantJpg = _createSolidImage(width: 2400, height: 2000, format: 'jpg');
      final attachment = ImageAttachment(
        file: XFile.fromData(compliantJpg, name: 'compliant_scan.jpg'),
        name: 'compliant_scan.jpg',
        sizeInBytes: compliantJpg.length,
        bytes: compliantJpg,
        mimeType: 'image/jpeg',
      );

      final result = await service.compressAttachment(
        attachment,
        config: ImageCompressionConfig.forScan,
      );

      expect(result.wasCompressed, isFalse);
      expect(result.compressedSizeBytes, compliantJpg.length);
      expect(result.attachment.name, 'compliant_scan.jpg');
      expect(result.attachment.mimeType, 'image/jpeg');
      expect(result.originalWidth, 2400);
      expect(result.originalHeight, 2000);
    });

    test('converts non-JPEG formats (BMP/WebP simulation) into standard JPEG', () async {
      final bmpBytes = _createSolidImage(width: 100, height: 100, format: 'bmp');
      final attachment = ImageAttachment(
        file: XFile.fromData(bmpBytes, name: 'unsupported_raw.bmp'),
        name: 'unsupported_raw.bmp',
        sizeInBytes: bmpBytes.length,
        bytes: bmpBytes,
        mimeType: 'image/bmp',
      );

      final result = await service.compressAttachment(
        attachment,
        config: const ImageCompressionConfig(
          requireMinShortEdge: false,
          convertToJpeg: true,
        ),
      );

      expect(result.wasCompressed, isTrue);
      expect(result.attachment.name, 'unsupported_raw.jpg');
      expect(result.attachment.mimeType, 'image/jpeg');
    });

    test('does not bypass fake JPEG file whose extension is .jpg but bytes are PNG', () async {
      final realPngBytes = _createSolidImage(width: 60, height: 60, format: 'png');
      final fakeJpgAttachment = ImageAttachment(
        file: XFile.fromData(realPngBytes, name: 'fake.jpg'),
        name: 'fake.jpg',
        sizeInBytes: realPngBytes.length,
        bytes: realPngBytes,
        mimeType: 'image/jpeg', // Fake mime
      );

      final result = await service.compressAttachment(
        fakeJpgAttachment,
        config: const ImageCompressionConfig(
          compressThresholdBytes: 5 * 1024 * 1024,
          requireMinShortEdge: false,
          convertToJpeg: true,
        ),
      );

      // Must be processed and encoded as true JPEG
      expect(result.wasCompressed, isTrue);
      expect(result.attachment.bytes![0], 0xFF);
      expect(result.attachment.bytes![1], 0xD8);
      expect(result.attachment.bytes![2], 0xFF);
    });

    test('blocks scan image with short edge 1800px (< 2000px) per BR-07 (Lỗi 2)', () async {
      final substandardJpg = _createSolidImage(width: 2400, height: 1800, format: 'jpg');
      final attachment = ImageAttachment(
        file: XFile.fromData(substandardJpg, name: 'substandard_1800px.jpg'),
        name: 'substandard_1800px.jpg',
        sizeInBytes: substandardJpg.length,
        bytes: substandardJpg,
        mimeType: 'image/jpeg',
      );

      expect(
        () => service.compressAttachment(
          attachment,
          config: ImageCompressionConfig.forScan,
        ),
        throwsA(
          isA<ImageCompressionException>().having(
            (e) => e.message,
            'message',
            contains('cạnh ngắn phải từ 2000px trở lên'),
          ),
        ),
      );
    });

    test('accepts scan image with short edge exactly 2000px per BR-07', () async {
      final validScanJpg = _createSolidImage(width: 3000, height: 2000, format: 'jpg');
      final attachment = ImageAttachment(
        file: XFile.fromData(validScanJpg, name: 'valid_scan_2000px.jpg'),
        name: 'valid_scan_2000px.jpg',
        sizeInBytes: validScanJpg.length,
        bytes: validScanJpg,
        mimeType: 'image/jpeg',
      );

      final result = await service.compressAttachment(
        attachment,
        config: ImageCompressionConfig.forScan,
      );

      expect(result.originalWidth, 3000);
      expect(result.originalHeight, 2000);
      expect(result.attachment.name, 'valid_scan_2000px.jpg');
    });

    test('does not enforce 2000px short edge on negative proof', () async {
      // 1600x1200 has short edge 1200 < 2000. It must be accepted for Proof
      final proofJpg = _createSolidImage(width: 1600, height: 1200, format: 'jpg');
      final attachment = ImageAttachment(
        file: XFile.fromData(proofJpg, name: 'negative_strip.jpg'),
        name: 'negative_strip.jpg',
        sizeInBytes: proofJpg.length,
        bytes: proofJpg,
        mimeType: 'image/jpeg',
      );

      final result = await service.compressAttachment(
        attachment,
        config: ImageCompressionConfig.forProof,
      );

      expect(result.attachment.name, 'negative_strip.jpg');
      expect(result.compressedHeight, 1200);
    });

    test('resizes and compresses oversized JPEG down to maxLongEdge', () async {
      final largeJpg = _createSolidImage(width: 4500, height: 3000, format: 'jpg');
      final attachment = ImageAttachment(
        file: XFile.fromData(largeJpg, name: 'film_scan_highres.jpg'),
        name: 'film_scan_highres.jpg',
        sizeInBytes: largeJpg.length,
        bytes: largeJpg,
        mimeType: 'image/jpeg',
      );

      final result = await service.compressAttachment(
        attachment,
        config: const ImageCompressionConfig(
          maxLongEdge: 4096,
          minShortEdge: 2000,
          quality: 85,
          compressThresholdBytes: 100 * 1024,
        ),
      );

      expect(result.wasCompressed, isTrue);
      expect(result.compressedWidth, 4096);
      expect(result.compressedHeight, (3000 * (4096 / 4500)).round());
      expect(result.compressedHeight! >= 2000, isTrue);
      expect(result.compressedSizeBytes < result.originalSizeBytes, isTrue);
      expect(result.savedPercent > 0, isTrue);
    });

    test('strictly preserves remote URLs and presigned query tokens without compressing', () async {
      const presignedUrl =
          'https://storage.googleapis.com/contest/submissions/123.jpg?X-Amz-Signature=sig999&token=secure123';
      final attachment = ImageAttachment(
        file: XFile(presignedUrl),
        name: '123.jpg',
        sizeInBytes: 1024 * 1024 * 15,
      );

      final result = await service.compressAttachment(
        attachment,
        config: ImageCompressionConfig.forScan,
      );

      expect(result.wasCompressed, isFalse);
      expect(result.attachment.file.path, presignedUrl);
      expect(result.compressedSizeBytes, attachment.sizeInBytes);
    });

    test('throws ImageCompressionException when given empty bytes', () async {
      final emptyAttachment = ImageAttachment(
        file: XFile.fromData(Uint8List(0), name: 'empty.jpg'),
        name: 'empty.jpg',
        sizeInBytes: 0,
        bytes: Uint8List(0),
      );

      expect(
        () => service.compressAttachment(emptyAttachment),
        throwsA(isA<ImageCompressionException>()),
      );
    });

    test('throws ImageCompressionException when image bytes are corrupted', () async {
      final corruptedBytes = Uint8List.fromList([1, 2, 3, 4, 5, 6, 7, 8]);
      final corruptedAttachment = ImageAttachment(
        file: XFile.fromData(corruptedBytes, name: 'corrupted.jpg'),
        name: 'corrupted.jpg',
        sizeInBytes: corruptedBytes.length,
        bytes: corruptedBytes,
      );

      expect(
        () => service.compressAttachment(corruptedAttachment),
        throwsA(isA<ImageCompressionException>()),
      );
    });

    test('converts and compresses uncompressed TIFF film scan to JPEG', () async {
      final tiffBytes = _createSolidImage(width: 800, height: 600, format: 'tiff');
      final attachment = ImageAttachment(
        file: XFile.fromData(tiffBytes, name: 'kodak_portra_scan.tif'),
        name: 'kodak_portra_scan.tif',
        sizeInBytes: tiffBytes.length,
        bytes: tiffBytes,
        mimeType: 'image/tiff',
      );

      final result = await service.compressAttachment(
        attachment,
        config: const ImageCompressionConfig(
          compressThresholdBytes: 10 * 1024,
          convertToJpeg: true,
          quality: 85,
        ),
      );

      expect(result.wasCompressed, isTrue);
      expect(result.attachment.name, 'kodak_portra_scan.jpg');
      expect(result.attachment.mimeType, 'image/jpeg');
      expect(result.compressedSizeBytes < result.originalSizeBytes, isTrue);
    });

    test('flattens PNG alpha channel onto white background before converting to JPEG', () async {
      final pngAlphaBytes = _createSolidImage(width: 300, height: 300, format: 'png_alpha');
      final attachment = ImageAttachment(
        file: XFile.fromData(pngAlphaBytes, name: 'transparent_overlay.png'),
        name: 'transparent_overlay.png',
        sizeInBytes: pngAlphaBytes.length,
        bytes: pngAlphaBytes,
        mimeType: 'image/png',
      );

      final result = await service.compressAttachment(
        attachment,
        config: const ImageCompressionConfig(
          compressThresholdBytes: 10 * 1024,
          convertToJpeg: true,
          quality: 85,
        ),
      );

      expect(result.wasCompressed, isTrue);
      expect(result.attachment.name, 'transparent_overlay.jpg');
      expect(result.attachment.mimeType, 'image/jpeg');

      final decoded = img.decodeJpg(result.attachment.bytes!);
      expect(decoded, isNotNull);
      expect(decoded!.hasAlpha, isFalse);
    });

    test('preserves short edge >= 2000px for extreme aspect ratio panoramas without shrinking below BR-07 limit', () async {
      final panoJpg = _createSolidImage(width: 6000, height: 2000, format: 'jpg');
      final attachment = ImageAttachment(
        file: XFile.fromData(panoJpg, name: 'xpan_panorama.jpg'),
        name: 'xpan_panorama.jpg',
        sizeInBytes: panoJpg.length,
        bytes: panoJpg,
        mimeType: 'image/jpeg',
      );

      final result = await service.compressAttachment(
        attachment,
        config: const ImageCompressionConfig(
          maxLongEdge: 4096,
          minShortEdge: 2000,
          compressThresholdBytes: 100 * 1024,
        ),
      );

      expect(result.wasCompressed, isTrue);
      expect(result.compressedHeight, 2000);
      expect(result.compressedWidth, 6000);
      expect(result.compressedHeight! >= 2000, isTrue);
    });

    test('does not upscale original image with short edge below 2000px when requireMinShortEdge is false', () async {
      final smallJpg = _createSolidImage(width: 1800, height: 1200, format: 'jpg');
      final attachment = ImageAttachment(
        file: XFile.fromData(smallJpg, name: 'substandard_short_edge.jpg'),
        name: 'substandard_short_edge.jpg',
        sizeInBytes: smallJpg.length,
        bytes: smallJpg,
        mimeType: 'image/jpeg',
      );

      final result = await service.compressAttachment(
        attachment,
        config: const ImageCompressionConfig(
          maxLongEdge: 4096,
          minShortEdge: 2000,
          requireMinShortEdge: false,
          compressThresholdBytes: 100 * 1024,
        ),
      );

      expect(result.compressedWidth, 1800);
      expect(result.compressedHeight, 1200);
      expect(result.compressedWidth! <= 1800, isTrue);
      expect(result.compressedHeight! <= 1200, isTrue);
    });

    test('adaptive compression uses math.max(60, quality - 10) and does not reduce quality below 60', () async {
      final normalJpg = _createSolidImage(width: 800, height: 600, format: 'jpg');
      final attachment = ImageAttachment(
        file: XFile.fromData(normalJpg, name: 'adaptive_quality.jpg'),
        name: 'adaptive_quality.jpg',
        sizeInBytes: normalJpg.length,
        bytes: normalJpg,
        mimeType: 'image/jpeg',
      );

      // Encode at quality 60 explicitly to get exact baseline byte size at quality 60
      final decoded = img.decodeImage(normalJpg)!;
      final q60Bytes = Uint8List.fromList(img.encodeJpg(decoded, quality: 60));

      // If targetMaxBytes is slightly larger than q60Bytes, adaptive loop steps down to 60 and succeeds!
      final result = await service.compressAttachment(
        attachment,
        config: ImageCompressionConfig(
          compressThresholdBytes: 10 * 1024,
          targetMaxBytes: q60Bytes.length + 500,
          quality: 85,
          requireMinShortEdge: false,
        ),
      );

      expect(result.wasCompressed, isTrue);
      expect(result.compressedSizeBytes <= q60Bytes.length + 500, isTrue);

      // If targetMaxBytes is smaller than q60Bytes, it cannot drop below 60 and throws ImageCompressionException
      expect(
        () => service.compressAttachment(
          attachment,
          config: ImageCompressionConfig(
            compressThresholdBytes: 10 * 1024,
            targetMaxBytes: q60Bytes.length - 50,
            quality: 85,
            requireMinShortEdge: false,
          ),
        ),
        throwsA(
          isA<ImageCompressionException>().having(
            (e) => e.message,
            'message',
            contains('vẫn vượt quá giới hạn cho phép'),
          ),
        ),
      );
    });

    test('throws ImageCompressionException when image cannot be compressed below targetMaxBytes', () async {
      final normalJpg = _createSolidImage(width: 800, height: 600, format: 'jpg');
      final attachment = ImageAttachment(
        file: XFile.fromData(normalJpg, name: 'large.jpg'),
        name: 'large.jpg',
        sizeInBytes: normalJpg.length,
        bytes: normalJpg,
        mimeType: 'image/jpeg',
      );

      expect(
        () => service.compressAttachment(
          attachment,
          config: const ImageCompressionConfig(
            compressThresholdBytes: 10 * 1024,
            targetMaxBytes: 100,
            requireMinShortEdge: false,
          ),
        ),
        throwsA(
          isA<ImageCompressionException>().having(
            (e) => e.message,
            'message',
            contains('vẫn vượt quá giới hạn cho phép'),
          ),
        ),
      );
    });
  });
}