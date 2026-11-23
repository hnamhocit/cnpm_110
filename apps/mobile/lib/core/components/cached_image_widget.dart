import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';

import '../services/contest_cache_manager.dart';
import 'contest_cached_image.dart';
import 'shimmer_loading.dart';

/// Component hiển thị hình ảnh từ mạng có bộ nhớ đệm (Disk & RAM cache),
/// hỗ trợ tự động downsampling để tối ưu RAM, hiển thị placeholder shimmer/skeleton và error state.
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
    this.useShimmer = false,
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

  /// Bật hiệu ứng Shimmer Skeleton cho placeholder thay vì vòng xoay thông thường
  final bool useShimmer;

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
    final dpr = MediaQuery.devicePixelRatioOf(context);

    // Tính toán Downsampling thông minh vào RAM dựa theo kích thước màn hình
    int? resolvedMemCacheWidth = memCacheWidth;
    int? resolvedMemCacheHeight = memCacheHeight;

    if (resolvedMemCacheWidth == null && width != null && width!.isFinite && width! > 0) {
      resolvedMemCacheWidth = (width! * dpr).round();
    }
    if (resolvedMemCacheHeight == null && height != null && height!.isFinite && height! > 0) {
      resolvedMemCacheHeight = (height! * dpr).round();
    }

    return ContestCachedImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      borderRadius: borderRadius,
      cacheKey: cacheKey,
      cacheManager: cacheManager ?? ContestCacheManager.instance,
      httpHeaders: httpHeaders,
      isThumbnail: isThumbnail,
      memCacheWidth: resolvedMemCacheWidth,
      memCacheHeight: resolvedMemCacheHeight,
      maxWidthDiskCache: maxWidthDiskCache,
      maxHeightDiskCache: maxHeightDiskCache,
      fadeInDuration: fadeInDuration,
      fadeOutDuration: fadeOutDuration,
      placeholder: placeholder ??
          (context, url) {
            if (useShimmer) {
              return ShimmerImagePlaceholder(
                width: width,
                height: height,
                borderRadius: borderRadius,
              );
            }
            return Container(
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
            );
          },
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
  }
}
