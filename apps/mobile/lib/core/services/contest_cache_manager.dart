import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';

/// Singleton CacheManager chuyên biệt cho hình ảnh bài dự thi (Contest Entries).
/// Cấu hình giới hạn bộ nhớ đệm đĩa (max 300 objects) và thời gian lưu trữ (7 ngày)
/// để tránh phình dung lượng lưu trữ và đảm bảo tốc độ truy xuất tối ưu.
class ContestCacheManager extends CacheManager with ImageCacheManager {
  static const String key = 'contest_entries_cache';

  static final ContestCacheManager _instance = ContestCacheManager._internal();

  /// Truy cập singleton instance
  static ContestCacheManager get instance => _instance;

  /// Factory constructor trả về singleton
  factory ContestCacheManager() => _instance;

  ContestCacheManager._internal()
      : super(
          Config(
            key,
            stalePeriod: const Duration(days: 7),
            maxNrOfCacheObjects: 300,
            repo: JsonCacheInfoRepository(databaseName: key),
            fileService: HttpFileService(),
          ),
        );

  /// Precache trước một hình ảnh vào ContestCacheManager để sẵn sàng hiển thị ngay lập tức
  static void precache(
    BuildContext context,
    String url, {
    bool isThumbnail = true,
  }) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) return;

    final provider = CachedNetworkImageProvider(
      url,
      cacheManager: _instance,
      maxWidth: isThumbnail ? 800 : 1920,
      maxHeight: isThumbnail ? 800 : 1920,
    );

    precacheImage(provider, context).catchError((_) {
      // Bỏ qua lỗi ngầm khi precache (mạng yếu hoặc URL không hợp lệ) để không làm crash UI
    });
  }

  /// Xóa toàn bộ bộ nhớ đệm ảnh bài dự thi khi cần giải phóng dung lượng thủ công
  Future<void> clearContestCache() async {
    await emptyCache();
  }
}
