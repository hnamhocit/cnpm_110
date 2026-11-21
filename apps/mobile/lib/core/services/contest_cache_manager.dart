import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';

/// Singleton CacheManager chuyên biệt cho hình ảnh bài dự thi & ảnh triển lãm (Contest Entries / Winners).
/// Cấu hình giới hạn bộ nhớ đệm đĩa (tối đa 300 đối tượng) và thời gian lưu trữ (7 ngày)
/// để tránh phình bộ nhớ thiết bị đồng thời duy trì tốc độ đọc từ đĩa siêu nhanh.
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

  /// Precache trước một hình ảnh vào cache để khi người dùng cuộn đến sẽ hiển thị tức thì
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
      // Bỏ qua lỗi precache ngầm (mạng yếu hoặc URL hỏng) để không gián đoạn UI
    });
  }

  /// Xóa bộ nhớ đệm hình ảnh bài thi khi cần giải phóng dung lượng thủ công
  Future<void> clearContestCache() async {
    await emptyCache();
  }
}
