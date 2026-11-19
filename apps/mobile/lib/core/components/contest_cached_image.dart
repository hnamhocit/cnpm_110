import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';

import '../services/contest_cache_manager.dart';

/// Chế độ hiển thị ảnh dự thi: thumbnail trong danh sách hoặc chi tiết/fullscreen.
enum ContestImageDisplayMode {
  /// Thumbnail nhỏ hiển thị trong danh sách hoặc grid (giới hạn disk ~600-800px, RAM theo widget size)
  thumbnail,

  /// Ảnh chi tiết hoặc xem toàn màn hình (giới hạn disk/RAM ~1440-1920px)
  detail,
}

/// Widget hiển thị hình ảnh bài dự thi tối ưu hóa toàn diện:
/// 1. Tối ưu RAM: Tự động downsampling (`memCacheWidth`/`memCacheHeight`) theo kích thước thực tế * devicePixelRatio,
///    kiểm tra `isFinite` an toàn để không bao giờ bị crash khi `width`/`height` là `double.infinity` hoặc `null`.
/// 2. Tối ưu Disk: Phân biệt `isThumbnail` (hoặc `displayMode`) để giới hạn `maxWidthDiskCache`/`maxHeightDiskCache` (800px vs 1920px).
/// 3. Tối ưu UI & Scroll Jank: Placeholder tĩnh siêu nhẹ (tránh animation liên tục khi cuộn), error widget rõ ràng,
///    và rút ngắn `fadeInDuration`/`fadeOutDuration` (120ms/50ms) giúp lướt mượt mà không khựng.
/// 4. Quản lý Cache: Sử dụng `ContestCacheManager.instance` riêng biệt cho bài dự thi.
class ContestCachedImage extends StatelessWidget {
  const ContestCachedImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.isThumbnail = true,
    this.displayMode,
    this.memCacheWidth,
    this.memCacheHeight,
    this.maxWidthDiskCache,
    this.maxHeightDiskCache,
    this.placeholder,
    this.errorWidget,
    this.fadeInDuration = const Duration(milliseconds: 120),
    this.fadeOutDuration = const Duration(milliseconds: 50),
    this.cacheKey,
    this.httpHeaders,
    this.cacheManager,
  });

  /// URL hình ảnh từ Cloud Storage / R2
  final String imageUrl;

  /// Chiều rộng widget (logical pixels)
  final double? width;

  /// Chiều cao widget (logical pixels)
  final double? height;

  /// Cách co giãn hình ảnh
  final BoxFit fit;

  /// Bo góc hình ảnh nếu có
  final BorderRadius? borderRadius;

  /// Cờ phân biệt ảnh thumbnail (mặc định true) hay ảnh chi tiết full-size
  final bool isThumbnail;

  /// Chế độ hiển thị ảnh tùy chọn (nếu truyền vào sẽ ưu tiên hơn isThumbnail)
  final ContestImageDisplayMode? displayMode;

  /// Chỉ định trực tiếp giới hạn decode RAM chiều rộng
  final int? memCacheWidth;

  /// Chỉ định trực tiếp giới hạn decode RAM chiều cao
  final int? memCacheHeight;

  /// Chỉ định trực tiếp giới hạn lưu cache đĩa chiều rộng
  final int? maxWidthDiskCache;

  /// Chỉ định trực tiếp giới hạn lưu cache đĩa chiều cao
  final int? maxHeightDiskCache;

  /// Placeholder tùy biến (nếu để null sẽ dùng placeholder tĩnh siêu nhẹ)
  final Widget Function(BuildContext context, String url)? placeholder;

  /// Error widget tùy biến
  final Widget Function(BuildContext context, String url, Object error)?
      errorWidget;

  /// Thời gian hiệu ứng mờ nạp ảnh xong (mặc định rút ngắn còn 120ms để tránh scroll jank)
  final Duration fadeInDuration;

  /// Thời gian ẩn placeholder (mặc định rút ngắn còn 50ms)
  final Duration fadeOutDuration;

  /// Khóa bộ nhớ đệm tùy chọn
  final String? cacheKey;

  /// Headers HTTP đính kèm nếu cần
  final Map<String, String>? httpHeaders;

  /// CacheManager tùy chọn (mặc định sử dụng ContestCacheManager.instance)
  final BaseCacheManager? cacheManager;

  bool get _isThumbMode =>
      displayMode != null ? displayMode == ContestImageDisplayMode.thumbnail : isThumbnail;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final dpr = MediaQuery.devicePixelRatioOf(context);

    // 1. Tối ưu RAM: Tính toán kích thước giải mã an toàn (chống Out-Of-Memory)
    int? resolvedMemCacheWidth = memCacheWidth;
    int? resolvedMemCacheHeight = memCacheHeight;

    if (resolvedMemCacheWidth == null &&
        width != null &&
        width!.isFinite &&
        width! > 0) {
      resolvedMemCacheWidth = (width! * dpr).round();
    }

    if (resolvedMemCacheHeight == null &&
        height != null &&
        height!.isFinite &&
        height! > 0) {
      resolvedMemCacheHeight = (height! * dpr).round();
    }

    // Đảm bảo không bao giờ decode full size ảnh khổng lồ (vd: 50MB-100MB scan) nếu width/height không finite
    if (_isThumbMode) {
      resolvedMemCacheWidth ??= 800;
      resolvedMemCacheHeight ??= 800;
    } else {
      // Với ảnh chi tiết toàn màn hình, giới hạn tối đa 1920px để bảo vệ RAM thiết bị yếu
      resolvedMemCacheWidth ??= 1920;
      resolvedMemCacheHeight ??= 1920;
      if (resolvedMemCacheWidth > 1920) resolvedMemCacheWidth = 1920;
      if (resolvedMemCacheHeight > 1920) resolvedMemCacheHeight = 1920;
    }

    // 2. Tối ưu Disk: Thumbnail lưu ~600-800px, Detail lưu ~1440-1920px
    final int resolvedMaxWidthDisk =
        maxWidthDiskCache ?? (_isThumbMode ? 800 : 1920);
    final int resolvedMaxHeightDisk =
        maxHeightDiskCache ?? (_isThumbMode ? 800 : 1920);

    // 3. UI Tải: Placeholder tĩnh siêu nhẹ - không tạo animation loop khi scroll
    Widget image = CachedNetworkImage(
      imageUrl: imageUrl,
      cacheKey: cacheKey,
      cacheManager: cacheManager ?? ContestCacheManager.instance,
      httpHeaders: httpHeaders,
      width: width,
      height: height,
      fit: fit,
      memCacheWidth: resolvedMemCacheWidth,
      memCacheHeight: resolvedMemCacheHeight,
      maxWidthDiskCache: resolvedMaxWidthDisk,
      maxHeightDiskCache: resolvedMaxHeightDisk,
      fadeInDuration: fadeInDuration,
      fadeOutDuration: fadeOutDuration,
      placeholder: placeholder ??
          (context, url) => Container(
                width: width,
                height: height,
                color: colorScheme.surfaceContainerHighest.withValues(
                  alpha: 0.4,
                ),
                child: Center(
                  child: Icon(
                    Icons.image_outlined,
                    size: (width != null && width!.isFinite && width! < 60)
                        ? 20
                        : 28,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
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
                    size: (width != null && width!.isFinite && width! < 60)
                        ? 20
                        : 28,
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
