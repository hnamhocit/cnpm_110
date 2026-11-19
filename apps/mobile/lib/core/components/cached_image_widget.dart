import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';

import '../services/contest_cache_manager.dart';
import 'contest_cached_image.dart';

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
    this.cacheManager,
    this.isThumbnail = true,
    this.fadeInDuration = const Duration(milliseconds: 120),
    this.fadeOutDuration = const Duration(milliseconds: 50),
  });

  /// URL đầy đủ của hình ảnh
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

  /// Giới hạn chiều rộng giải mã vào RAM
  final int? memCacheWidth;

  /// Giới hạn chiều cao giải mã vào RAM
  final int? memCacheHeight;

  /// Chiều rộng tối đa khi lưu tệp vào bộ nhớ đệm đĩa
  final int? maxWidthDiskCache;

  /// Chiều cao tối đa khi lưu tệp vào bộ nhớ đệm đĩa
  final int? maxHeightDiskCache;

  /// Khóa bộ nhớ đệm tùy chọn
  final String? cacheKey;

  /// Headers HTTP khi gửi yêu cầu tải ảnh
  final Map<String, String>? httpHeaders;

  /// CacheManager tùy chọn (mặc định ContestCacheManager.instance)
  final BaseCacheManager? cacheManager;

  /// Cờ phân biệt thumbnail vs detail
  final bool isThumbnail;

  /// Thời gian hiệu ứng mờ chuyển dần khi ảnh nạp xong
  final Duration fadeInDuration;

  /// Thời gian hiệu ứng ẩn placeholder
  final Duration fadeOutDuration;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return ContestCachedImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      borderRadius: borderRadius,
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
                      value: 0.5,
                      color: colorScheme.primary,
                    ),
                  ),
                ),
              ),
      errorWidget: errorWidget,
      memCacheWidth: memCacheWidth,
      memCacheHeight: memCacheHeight,
      maxWidthDiskCache: maxWidthDiskCache,
      maxHeightDiskCache: maxHeightDiskCache,
      cacheKey: cacheKey,
      httpHeaders: httpHeaders,
      cacheManager: cacheManager ?? ContestCacheManager.instance,
      isThumbnail: isThumbnail,
      fadeInDuration: fadeInDuration,
      fadeOutDuration: fadeOutDuration,
    );
  }
}
