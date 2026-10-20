import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';

class ImageAttachment {
  const ImageAttachment({
    required this.file,
    required this.name,
    required this.sizeInBytes,
    this.bytes,
    this.mimeType,
    this.width,
    this.height,
  });

  final XFile file;
  final String name;
  final int sizeInBytes;
  final Uint8List? bytes;
  final String? mimeType;
  final int? width;
  final int? height;

  String get formattedSize {
    if (sizeInBytes < 1024) {
      return '$sizeInBytes B';
    } else if (sizeInBytes < 1024 * 1024) {
      final kb = sizeInBytes / 1024;
      return '${kb.toStringAsFixed(1)} KB';
    } else {
      final mb = sizeInBytes / (1024 * 1024);
      return '${mb.toStringAsFixed(2)} MB';
    }
  }

  ImageAttachment copyWith({
    XFile? file,
    String? name,
    int? sizeInBytes,
    Uint8List? bytes,
    String? mimeType,
    int? width,
    int? height,
  }) {
    return ImageAttachment(
      file: file ?? this.file,
      name: name ?? this.name,
      sizeInBytes: sizeInBytes ?? this.sizeInBytes,
      bytes: bytes ?? this.bytes,
      mimeType: mimeType ?? this.mimeType,
      width: width ?? this.width,
      height: height ?? this.height,
    );
  }
}
