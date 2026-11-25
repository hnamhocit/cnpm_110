import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';

import '../../models/app_notification.dart';
import '../../models/user_submission.dart';

/// Global Key để có thể hiển thị In-App Push Notification từ bất kỳ đâu
final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

class NotificationService {
  NotificationService({
    FlutterSecureStorage storage = const FlutterSecureStorage(),
  }) : _storage = storage;

  final FlutterSecureStorage _storage;
  static const _storageKeyPrefix = 'user_notifications_cache_v1_';
  static const _notifiedSubmissionsKeyPrefix = 'notified_judging_submissions_';

  String _getKey(String userId) => '$_storageKeyPrefix$userId';
  String _getNotifiedKey(String userId) => '$_notifiedSubmissionsKeyPrefix$userId';

  /// Đọc danh sách thông báo từ bộ nhớ bảo mật
  Future<List<AppNotification>> loadNotifications(String userId) async {
    try {
      final rawData = await _storage.read(key: _getKey(userId));
      if (rawData == null || rawData.isEmpty) {
        return _getDefaultInitialNotifications();
      }

      final decoded = jsonDecode(rawData);
      if (decoded is List) {
        return decoded
            .map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return _getDefaultInitialNotifications();
    } catch (_) {
      return _getDefaultInitialNotifications();
    }
  }

  /// Lưu danh sách thông báo xuống bộ nhớ máy
  Future<void> saveNotifications(String userId, List<AppNotification> items) async {
    try {
      final payload = jsonEncode(items.map((e) => e.toJson()).toList());
      await _storage.write(key: _getKey(userId), value: payload);
    } catch (_) {}
  }

  /// Danh sách mẫu ban đầu khi người dùng mới vào app
  List<AppNotification> _getDefaultInitialNotifications() {
    final now = DateTime.now();
    return [
      AppNotification(
        id: 'init_judging_1',
        title: 'Bài thi được đưa vào vòng chấm điểm 🎯',
        message:
            'Tác phẩm "Nắng Sớm Làng Chài Cổ Thạch" đã vượt qua thẩm định AI và chính thức bước vào vòng chấm điểm ẩn danh (Judging Round)!',
        type: NotificationType.submissionApprovedForJudging,
        createdAt: now.subtract(const Duration(minutes: 15)),
        isRead: false,
        submissionTitle: 'Nắng Sớm Làng Chài Cổ Thạch',
        contestTitle: 'Khoảnh Khắc Di Sản Việt Nam 2025',
        route: '/my-submissions',
      ),
      AppNotification(
        id: 'init_welcome',
        title: 'Chào mừng bạn đến với CINEGEN! 📷',
        message:
            'Nền tảng nhiếp ảnh phim analog CINEGEN đã sẵn sàng. Chúc bạn có những tác phẩm giàu cảm xúc!',
        type: NotificationType.system,
        createdAt: now.subtract(const Duration(hours: 3)),
        isRead: true,
      ),
    ];
  }

  /// Hiển thị In-App Push Notification banner nổi bật trên giao diện
  void showInAppPushNotification({
    required BuildContext? context,
    required AppNotification notification,
  }) {
    final messenger = context != null
        ? ScaffoldMessenger.of(context)
        : rootScaffoldMessengerKey.currentState;

    if (messenger == null) return;

    messenger.clearSnackBars();
    messenger.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        elevation: 8,
        backgroundColor: const Color(0xFF1E293B), // Dark Slate
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: notification.type == NotificationType.submissionApprovedForJudging
                ? const Color(0xFF3B82F6) // Blue accent
                : Colors.amber,
            width: 1.5,
          ),
        ),
        duration: const Duration(seconds: 5),
        content: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: notification.type == NotificationType.submissionApprovedForJudging
                    ? Colors.blue.withValues(alpha: 0.2)
                    : Colors.amber.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(
                notification.type.icon,
                color: notification.type == NotificationType.submissionApprovedForJudging
                    ? const Color(0xFF60A5FA)
                    : Colors.amber,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'PUSH',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.message,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFFCBD5E1),
                      fontSize: 12,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        action: SnackBarAction(
          label: 'Xem bài',
          textColor: const Color(0xFF60A5FA),
          onPressed: () {
            if (context != null && context.mounted) {
              if (notification.route != null) {
                context.push(notification.route!);
              } else {
                context.push('/my-submissions');
              }
            }
          },
        ),
      ),
    );
  }

  /// Tự động kiểm tra danh sách bài thi của thí sinh:
  /// Nếu có bài thi nào chuyển sang trạng thái APPROVED / APPROVED_FOR_JUDGING
  /// mà chưa thông báo trước đó, tự động sinh Push Notification (FPC-82)
  Future<AppNotification?> checkAndNotifyJudgingSubmission({
    required String userId,
    required List<UserSubmission> submissions,
    BuildContext? context,
  }) async {
    try {
      final rawNotified = await _storage.read(key: _getNotifiedKey(userId));
      final Set<String> notifiedSet = rawNotified != null && rawNotified.isNotEmpty
          ? (jsonDecode(rawNotified) as List).map((e) => e.toString()).toSet()
          : <String>{};

      for (final sub in submissions) {
        final isApprovedForJudging = sub.status == SubmissionStatus.approved;
        if (isApprovedForJudging && !notifiedSet.contains(sub.id)) {
          // Phát hiện bài thi mới bước vào vòng chấm điểm!
          notifiedSet.add(sub.id);
          await _storage.write(
            key: _getNotifiedKey(userId),
            value: jsonEncode(notifiedSet.toList()),
          );

          final newNotification = AppNotification(
            id: 'notif_judging_${sub.id}_${DateTime.now().millisecondsSinceEpoch}',
            title: 'Bài thi được đưa vào vòng chấm điểm 🎯',
            message:
                'Tác phẩm "${sub.title}" của bạn đã vượt qua khâu thẩm định và chính thức bước vào vòng chấm điểm ẩn danh (Judging Round)!',
            type: NotificationType.submissionApprovedForJudging,
            createdAt: DateTime.now(),
            isRead: false,
            submissionId: sub.id,
            submissionTitle: sub.title,
            contestId: sub.contestId,
            route: '/my-submissions',
          );

          // Kích hoạt In-app Push Notification
          showInAppPushNotification(
            context: context,
            notification: newNotification,
          );

          return newNotification;
        }
      }
    } catch (_) {}
    return null;
  }
}

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});
