import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// Component hiển thị hình ảnh từ mạng có bộ nhớ đệm (Disk & RAM cache),
/// hỗ trợ tự động downsampling để tối ưu RAM, hiển thị placeholder và error state.
class CachedImageWidget extends StatelessWidget {
  const CachedImageWidget({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholder,
    this.errorWidget,
    this.memCacheWidth,
    this.memCacheHeight,
    this.maxWidthDiskCache,
    this.maxHeightDiskCache,
    this.cacheKey,
    this.httpHeaders,
    this.fadeInDuration = const Duration(milliseconds: 200),
    this.fadeOutDuration = const Duration(milliseconds: 100),
  });

  /// URL đầy đủ của hình ảnh (bao gồm cả presigned query tokens nếu có)
  final String imageUrl;

  /// Chiều rộng hiển thị (logical pixels)
  final double? width;

  /// Chiều cao hiển thị (logical pixels)
  final double? height;

  /// Chế độ co giãn hình ảnh
  final BoxFit fit;

  /// Bo góc hình ảnh
  final BorderRadius? borderRadius;

  /// Widget tùy biến hiển thị khi đang tải ảnh
  final Widget Function(BuildContext context, String url)? placeholder;

  /// Widget tùy biến hiển thị khi tải ảnh thất bại
  final Widget Function(BuildContext context, String url, Object error)?
      errorWidget;

  /// Giới hạn chiều rộng giải mã vào RAM (Downsampling để tránh OOM)
  final int? memCacheWidth;

  /// Giới hạn chiều cao giải mã vào RAM (Downsampling để tránh OOM)
  final int? memCacheHeight;

  /// Chiều rộng tối đa khi lưu tệp vào bộ nhớ đệm đĩa
  final int? maxWidthDiskCache;

  /// Chiều cao tối đa khi lưu tệp vào bộ nhớ đệm đĩa
  final int? maxHeightDiskCache;

  /// Khóa bộ nhớ đệm tùy chọn (nếu cần tách biệt với URL)
  final String? cacheKey;

  /// Headers HTTP khi gửi yêu cầu tải ảnh (VD: Bearer Token)
  final Map<String, String>? httpHeaders;

  /// Thời gian hiệu ứng mờ chuyển dần khi ảnh nạp xong
  final Duration fadeInDuration;

  /// Thời gian hiệu ứng ẩn placeholder
  final Duration fadeOutDuration;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    Widget image = CachedNetworkImage(
      imageUrl: imageUrl,
      cacheKey: cacheKey,
      httpHeaders: httpHeaders,
      width: width,
      height: height,
      fit: fit,
      memCacheWidth: memCacheWidth,
      memCacheHeight: memCacheHeight,
      maxWidthDiskCache: maxWidthDiskCache,
      maxHeightDiskCache: maxHeightDiskCache,
      fadeInDuration: fadeInDuration,
      fadeOutDuration: fadeOutDuration,
      placeholder: placeholder ??
          (context, url) => Container(
                width: width,
                height: height,
                color: colorScheme.surfaceContainerHighest.withValues(
                  alpha: 0.5,
                ),
                child: Center(
                  child: SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: colorScheme.primary,
                    ),
                  ),
                ),
              ),
      errorWidget: errorWidget ??
          (context, url, error) => Container(
                width: width,
                height: height,
                color: colorScheme.surfaceContainerHighest,
                child: Center(
                  child: Icon(
                    Icons.broken_image_outlined,
                    size: (width != null && width! < 60) ? 24 : 36,
                    color: colorScheme.outline,
                  ),
                ),
              ),
    );

    if (borderRadius != null) {
      image = ClipRRect(
        borderRadius: borderRadius!,
        child: image,
      );
    }

    return image;
  }
}
