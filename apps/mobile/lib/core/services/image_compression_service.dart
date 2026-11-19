import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';

import '../../models/image_attachment.dart';

/// Exception phát sinh trong quá trình nén và xử lý hình ảnh.
class ImageCompressionException implements Exception {
  const ImageCompressionException(this.message);

  final String message;

  @override
  String toString() => 'ImageCompressionException: $message';
}

/// Cấu hình thông số nén ảnh phía client.
class ImageCompressionConfig {
  const ImageCompressionConfig({
    this.quality = 85,
    this.maxLongEdge = 4096,
    this.minShortEdge = 2000,
    this.requireMinShortEdge = false,
    this.compressThresholdBytes = 4 * 1024 * 1024, // 4 MiB
    this.targetMaxBytes = 25 * 1024 * 1024, // 25 MiB (Chuẩn BR-07)
    this.convertToJpeg = true,
  });

  /// Chất lượng nén JPEG (1 - 100). Khuyến nghị 80-85 để giữ trọn chi tiết hạt phim.
  final int quality;

  /// Kích thước tối đa của cạnh dài nhất (pixels).
  final int maxLongEdge;

  /// Kích thước tối thiểu của cạnh ngắn nhất (pixels, BR-07 yêu cầu >= 2000px cho ảnh scan).
  final int minShortEdge;

  /// Yêu cầu cạnh ngắn bắt buộc phải >= [minShortEdge]. Nếu nhỏ hơn, ném [ImageCompressionException].
  final bool requireMinShortEdge;

  /// Ngưỡng dung lượng (bytes). Nếu ảnh nhỏ hơn ngưỡng này, đúng định dạng và kích thước phù hợp, bỏ qua nén.
  final int compressThresholdBytes;

  /// Dung lượng tối đa mục tiêu (bytes).
  final int targetMaxBytes;

  /// Chuyển đổi định dạng sang JPEG chuẩn để đảm bảo tương thích Backend.
  final bool convertToJpeg;

  /// Cấu hình mặc định cho ảnh scan bài thi theo chuẩn BR-07 (Min 2000px, Max 25MB, định dạng JPEG/TIFF).
  static const forScan = ImageCompressionConfig(
    quality: 85,
    maxLongEdge: 4096,
    minShortEdge: 2000,
    requireMinShortEdge: true,
    compressThresholdBytes: 5 * 1024 * 1024, // 5 MiB
    targetMaxBytes: 25 * 1024 * 1024, // 25 MiB
    convertToJpeg: true,
  );

  /// Cấu hình mặc định cho ảnh âm bản đối chứng (Negative Proof / Contact Sheet).
  /// Không áp dụng ràng buộc 2000px vì backend cho phép từ 1px trở lên, tối đa 20MB.
  static const forProof = ImageCompressionConfig(
    quality: 80,
    maxLongEdge: 3200,
    minShortEdge: 1200,
    requireMinShortEdge: false,
    compressThresholdBytes: 3 * 1024 * 1024, // 3 MiB
    targetMaxBytes: 20 * 1024 * 1024, // 20 MiB
    convertToJpeg: true,
  );
}

/// Kết quả sau khi nén ảnh.
class CompressionResult {
  const CompressionResult({
    required this.attachment,
    required this.originalSizeBytes,
    required this.compressedSizeBytes,
    this.originalWidth,
    this.originalHeight,
    this.compressedWidth,
    this.compressedHeight,
    required this.wasCompressed,
  });

  final ImageAttachment attachment;
  final int originalSizeBytes;
  final int compressedSizeBytes;
  final int? originalWidth;
  final int? originalHeight;
  final int? compressedWidth;
  final int? compressedHeight;
  final bool wasCompressed;

  /// Tỷ lệ dung lượng đã giảm được (0.0 đến 1.0).
  double get savedRatio => originalSizeBytes > 0
      ? math.max(0.0, 1.0 - (compressedSizeBytes / originalSizeBytes))
      : 0.0;

  /// Phần trăm dung lượng đã giảm được (0% đến 100%).
  double get savedPercent => savedRatio * 100;
}

/// Dữ liệu đầu vào truyền sang Isolate worker để xử lý nén ngầm.
class _CompressParams {
  const _CompressParams({
    required this.bytes,
    required this.fileName,
    required this.config,
    this.mimeType,
  });

  final Uint8List bytes;
  final String fileName;
  final ImageCompressionConfig config;
  final String? mimeType;
}

/// Dữ liệu đầu ra trả về từ Isolate worker.
class _CompressOutput {
  const _CompressOutput({
    required this.bytes,
    required this.fileName,
    required this.mimeType,
    required this.originalWidth,
    required this.originalHeight,
    required this.width,
    required this.height,
    required this.wasCompressed,
  });

  final Uint8List bytes;
  final String fileName;
  final String mimeType;
  final int originalWidth;
  final int originalHeight;
  final int width;
  final int height;
  final bool wasCompressed;
}

/// Worker thực thi nén ảnh độc lập (chạy trong isolate qua compute hoặc trực tiếp).
_CompressOutput _compressIsolateWorker(_CompressParams params) {
  final bytes = params.bytes;
  final config = params.config;
  final fileName = params.fileName;

  if (bytes.isEmpty) {
    throw const ImageCompressionException('Dữ liệu ảnh rỗng (0 bytes).');
  }

  var image = img.decodeImage(bytes);
  if (image == null) {
    throw const ImageCompressionException(
      'Không thể giải mã hình ảnh. Định dạng không được hỗ trợ hoặc tệp bị hỏng.',
    );
  }

  // Tự động xoay ảnh theo chiều EXIF để tránh bị quay ngang/ngược khi hiển thị
  image = img.bakeOrientation(image);

  final origWidth = image.width;
  final origHeight = image.height;
  final origShortEdge = math.min(origWidth, origHeight);

  // BR-07: Ràng buộc cạnh ngắn tối thiểu cho ảnh scan (>= 2000px)
  if (config.requireMinShortEdge && origShortEdge < config.minShortEdge) {
    throw ImageCompressionException(
      'Ảnh scan không đạt chuẩn BR-07: cạnh ngắn phải từ ${config.minShortEdge}px trở lên (hiện tại: ${origShortEdge}px).',
    );
  }

  // Kiểm tra định dạng thực tế từ byte dữ liệu (không phụ thuộc vào đuôi file hay mime giả)
  final isRealJpeg = _isJpeg(bytes);
  final isRealTiff = _isTiff(bytes);

  final maxEdge = math.max(origWidth, origHeight);
  final minEdge = origShortEdge;
  final needsResize = maxEdge > config.maxLongEdge;
  final isOverThreshold = bytes.length > config.compressThresholdBytes;

  // LỖI 1 FIX: Điều kiện bypass bỏ qua nén.
  // Backend chỉ chấp nhận JPEG và TIFF.
  // - Nếu convertToJpeg == true: CHỈ CÓ ảnh thực sự là JPEG (isRealJpeg), không cần resize và dưới ngưỡng dung lượng mới được bypass.
  //   PNG, WebP, GIF... và TIFF (khi cần convert sang JPEG) tuyệt đối KHÔNG được bypass!
  // - Nếu convertToJpeg == false: JPEG hoặc TIFF thực sự, không cần resize và dưới ngưỡng dung lượng mới được bypass.
  final canBypass = !needsResize &&
      !isOverThreshold &&
      (isRealJpeg || (isRealTiff && !config.convertToJpeg));

  if (canBypass) {
    return _CompressOutput(
      bytes: bytes,
      fileName: isRealJpeg ? _ensureExtension(fileName, '.jpg') : fileName,
      mimeType: isRealJpeg ? 'image/jpeg' : 'image/tiff',
      originalWidth: origWidth,
      originalHeight: origHeight,
      width: origWidth,
      height: origHeight,
      wasCompressed: false,
    );
  }

  // Tính toán kích thước mới:
  // 1. Tuyệt đối KHÔNG upscale (phóng lớn) nếu ảnh gốc vốn có cạnh ngắn < minShortEdge.
  // 2. Với ảnh panorama hoặc tỷ lệ rất dài: Nếu downscale theo maxLongEdge làm cạnh ngắn
  //    tụt xuống dưới minShortEdge (trong khi ảnh gốc đạt chuẩn), ta ưu tiên giữ cạnh ngắn = minShortEdge
  //    để đảm bảo không vi phạm ràng buộc cơ sở dữ liệu `check_short_edge` (LEAST(width, height) >= 2000).
  var targetWidth = origWidth;
  var targetHeight = origHeight;

  if (needsResize) {
    var scale = config.maxLongEdge / maxEdge;
    var candidateW = (origWidth * scale).round();
    var candidateH = (origHeight * scale).round();

    final candidateMin = math.min(candidateW, candidateH);
    if (minEdge >= config.minShortEdge && candidateMin < config.minShortEdge) {
      // Cân bằng: giữ cạnh ngắn ở mức minShortEdge
      final safeScale = config.minShortEdge / minEdge;
      candidateW = (origWidth * safeScale).round();
      candidateH = (origHeight * safeScale).round();
    }

    targetWidth = candidateW;
    targetHeight = candidateH;
  }

  img.Image processed = image;
  if (targetWidth != origWidth || targetHeight != origHeight) {
    processed = img.copyResize(
      image,
      width: targetWidth,
      height: targetHeight,
      interpolation: img.Interpolation.cubic,
    );
  }

  // Xử lý Alpha Channel (độ trong suốt): Nếu ảnh PNG có alpha channel,
  // ghép kênh màu lên nền trắng sạch sẽ trước khi nén JPEG để tránh vệt đen
  if (processed.hasAlpha && (config.convertToJpeg || isRealJpeg)) {
    final opaqueImage = img.Image(
      width: processed.width,
      height: processed.height,
      numChannels: 3,
    );
    img.fill(opaqueImage, color: img.ColorRgb8(255, 255, 255));
    img.compositeImage(opaqueImage, processed);
    processed = opaqueImage;
  }

  // Mã hóa định dạng đầu ra
  Uint8List outputBytes;
  String outputMime;
  String outputName;

  if (config.convertToJpeg || isRealJpeg || isRealTiff) {
    var quality = math.max(60, config.quality);
    outputBytes = Uint8List.fromList(img.encodeJpg(processed, quality: quality));

    // Nén thích ứng (adaptive): lặp có chặn nếu vượt quá targetMaxBytes.
    // Tuyệt đối không giảm quality xuống dưới 60 để bảo toàn chi tiết hạt phim (grain).
    while (outputBytes.length > config.targetMaxBytes && quality > 60) {
      quality = math.max(60, quality - 10);
      outputBytes = Uint8List.fromList(img.encodeJpg(processed, quality: quality));
    }

    // Kiểm tra an toàn: nếu chất lượng tối thiểu 60 mà vẫn vượt quá targetMaxBytes
    if (outputBytes.length > config.targetMaxBytes) {
      final mb = (outputBytes.length / (1024 * 1024)).toStringAsFixed(1);
      final maxMb = (config.targetMaxBytes / (1024 * 1024)).toStringAsFixed(0);
      throw ImageCompressionException(
        'Dung lượng ảnh sau khi nén (${mb}MB) vẫn vượt quá giới hạn cho phép ${maxMb}MB của cuộc thi (BR-07).',
      );
    }

    outputMime = 'image/jpeg';
    outputName = _ensureExtension(fileName, '.jpg');
  } else {
    outputBytes = Uint8List.fromList(img.encodePng(processed, level: 6));
    outputMime = 'image/png';
    outputName = _ensureExtension(fileName, '.png');
  }

  // Đảm bảo file nén không bị rỗng
  if (outputBytes.isEmpty) {
    throw const ImageCompressionException('Quá trình nén tạo ra tệp rỗng.');
  }

  return _CompressOutput(
    bytes: outputBytes,
    fileName: outputName,
    mimeType: outputMime,
    originalWidth: origWidth,
    originalHeight: origHeight,
    width: processed.width,
    height: processed.height,
    wasCompressed: true,
  );
}

/// Kiểm tra chữ ký magic bytes của định dạng JPEG (FF D8 FF)
bool _isJpeg(Uint8List bytes) {
  if (bytes.length >= 3 &&
      bytes[0] == 0xFF &&
      bytes[1] == 0xD8 &&
      bytes[2] == 0xFF) {
    return true;
  }
  return false;
}

/// Kiểm tra chữ ký magic bytes của định dạng TIFF (Little-endian hoặc Big-endian)
bool _isTiff(Uint8List bytes) {
  if (bytes.length >= 4) {
    // Little-endian TIFF (II*\0) hoặc BigTIFF (II+\0)
    if (bytes[0] == 0x49 &&
        bytes[1] == 0x49 &&
        (bytes[2] == 0x2A || bytes[2] == 0x2B) &&
        bytes[3] == 0x00) {
      return true;
    }
    // Big-endian TIFF (MM\0*) hoặc BigTIFF (MM\0+)
    if (bytes[0] == 0x4D &&
        bytes[1] == 0x4D &&
        bytes[2] == 0x00 &&
        (bytes[3] == 0x2A || bytes[3] == 0x2B)) {
      return true;
    }
  }
  return false;
}

String _ensureExtension(String fileName, String ext) {
  final dotIdx = fileName.lastIndexOf('.');
  if (dotIdx == -1) return '$fileName$ext';
  return '${fileName.substring(0, dotIdx)}$ext';
}

/// Service nén ảnh chuyên trách phía Client cho ứng dụng Film Contest Mobile.
class ImageCompressionService {
  const ImageCompressionService();

  /// Nén tệp đính kèm [attachment] theo cấu hình [config].
  ///
  /// Nếu [attachment] là URL mạng (remote URL có presigned token),
  /// hàm sẽ giữ nguyên và không nén để tránh làm hỏng token.
  Future<CompressionResult> compressAttachment(
    ImageAttachment attachment, {
    ImageCompressionConfig config = const ImageCompressionConfig(),
    bool useIsolate = true,
  }) async {
    final path = attachment.file.path;
    final isRemote = path.startsWith('http://') || path.startsWith('https://');

    // Không nén ảnh đã ở trên máy chủ hoặc URL presigned
    if (isRemote) {
      return CompressionResult(
        attachment: attachment,
        originalSizeBytes: attachment.sizeInBytes,
        compressedSizeBytes: attachment.sizeInBytes,
        originalWidth: attachment.width,
        originalHeight: attachment.height,
        compressedWidth: attachment.width,
        compressedHeight: attachment.height,
        wasCompressed: false,
      );
    }

    final Uint8List bytes;
    if (attachment.bytes != null && attachment.bytes!.isNotEmpty) {
      bytes = attachment.bytes!;
    } else {
      bytes = await attachment.file.readAsBytes();
    }

    final result = await compressBytes(
      bytes,
      fileName: attachment.name,
      mimeType: attachment.mimeType,
      originalPath: path,
      config: config,
      useIsolate: useIsolate,
    );

    // Nếu ảnh không cần nén, bảo toàn dữ liệu gốc nhưng cập nhật width/height/name/mime chuẩn
    if (!result.wasCompressed) {
      final preservedAttachment = ImageAttachment(
        file: result.attachment.file,
        name: result.attachment.name,
        sizeInBytes: attachment.sizeInBytes,
        bytes: attachment.bytes ?? bytes,
        mimeType: result.attachment.mimeType,
        width: result.originalWidth,
        height: result.originalHeight,
      );

      return CompressionResult(
        attachment: preservedAttachment,
        originalSizeBytes: attachment.sizeInBytes,
        compressedSizeBytes: attachment.sizeInBytes,
        originalWidth: result.originalWidth,
        originalHeight: result.originalHeight,
        compressedWidth: result.compressedWidth,
        compressedHeight: result.compressedHeight,
        wasCompressed: false,
      );
    }

    return result;
  }

  /// Nén mảng bytes ảnh [bytes] theo cấu hình [config].
  Future<CompressionResult> compressBytes(
    Uint8List bytes, {
    required String fileName,
    String? mimeType,
    String? originalPath,
    ImageCompressionConfig config = const ImageCompressionConfig(),
    bool useIsolate = true,
  }) async {
    final originalSize = bytes.length;
    final params = _CompressParams(
      bytes: bytes,
      fileName: fileName,
      mimeType: mimeType,
      config: config,
    );

    // Với ảnh dung lượng nhỏ (dưới ngưỡng nén), xử lý trực tiếp không cần spawn Isolate
    // để tiết kiệm CPU/RAM và tương thích hoàn hảo với FakeAsync trong Widget Tests.
    final _CompressOutput output;
    if (!useIsolate || bytes.length <= config.compressThresholdBytes) {
      output = _compressIsolateWorker(params);
    } else {
      output = await compute(_compressIsolateWorker, params);
    }

    final resultFile = XFile.fromData(
      output.bytes,
      name: output.fileName,
      path: originalPath,
      mimeType: output.mimeType,
    );

    final compressedAttachment = ImageAttachment(
      file: resultFile,
      name: output.fileName,
      sizeInBytes: output.bytes.length,
      bytes: output.bytes,
      mimeType: output.mimeType,
      width: output.width,
      height: output.height,
    );

    return CompressionResult(
      attachment: compressedAttachment,
      originalSizeBytes: originalSize,
      compressedSizeBytes: output.bytes.length,
      originalWidth: output.originalWidth,
      originalHeight: output.originalHeight,
      compressedWidth: output.width,
      compressedHeight: output.height,
      wasCompressed: output.wasCompressed,
    );
  }
}

final imageCompressionServiceProvider = Provider<ImageCompressionService>((ref) {
  return const ImageCompressionService();
});