import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/app_notification.dart';
import '../../models/user_submission.dart';
import '../services/notification_service.dart';
import 'auth_provider.dart';

class NotificationsNotifier extends AsyncNotifier<List<AppNotification>> {
  NotificationService get _service => ref.read(notificationServiceProvider);

  String get _currentUserId {
    final authState = ref.read(authProvider);
    return authState.userId ?? authState.email ?? 'guest_user';
  }

  @override
  Future<List<AppNotification>> build() async {
    return _service.loadNotifications(_currentUserId);
  }

  /// Đánh dấu một thông báo là đã đọc
  Future<void> markAsRead(String id) async {
    final currentList = state.value ?? [];
    final updatedList = currentList.map((item) {
      if (item.id == id) {
        return item.copyWith(isRead: true);
      }
      return item;
    }).toList();

    state = AsyncValue.data(updatedList);
    await _service.saveNotifications(_currentUserId, updatedList);
  }

  /// Đánh dấu tất cả thông báo là đã đọc
  Future<void> markAllAsRead() async {
    final currentList = state.value ?? [];
    final updatedList = currentList.map((item) => item.copyWith(isRead: true)).toList();

    state = AsyncValue.data(updatedList);
    await _service.saveNotifications(_currentUserId, updatedList);
  }

  /// Xóa một thông báo
  Future<void> deleteNotification(String id) async {
    final currentList = state.value ?? [];
    final updatedList = currentList.where((item) => item.id != id).toList();

    state = AsyncValue.data(updatedList);
    await _service.saveNotifications(_currentUserId, updatedList);
  }

  /// Xóa sạch tất cả thông báo
  Future<void> clearAll() async {
    state = const AsyncValue.data([]);
    await _service.saveNotifications(_currentUserId, []);
  }

  /// Thêm một thông báo mới và kích hoạt In-App Banner
  Future<void> addNotification(
    AppNotification notification, {
    BuildContext? context,
    bool showInAppPush = true,
  }) async {
    final currentList = state.value ?? [];
    final updatedList = [notification, ...currentList];

    state = AsyncValue.data(updatedList);
    await _service.saveNotifications(_currentUserId, updatedList);

    if (showInAppPush) {
      _service.showInAppPushNotification(
        context: context,
        notification: notification,
      );
    }
  }

  /// Mô phỏng Push Notification bài thi vào vòng chấm điểm (Dùng cho Demo FPC-82)
  Future<void> simulateJudgingNotification({
    BuildContext? context,
    String? submissionTitle,
  }) async {
    final title = submissionTitle ?? 'Nắng Sớm Làng Chài Cổ Thạch';
    final now = DateTime.now();

    final testNotification = AppNotification(
      id: 'demo_judging_${now.millisecondsSinceEpoch}',
      title: 'Bài thi được đưa vào vòng chấm điểm 🎯',
      message:
          'Tác phẩm "$title" của bạn đã vượt qua khâu kiểm duyệt và chính thức bước vào vòng chấm điểm ẩn danh (Judging Round)!',
      type: NotificationType.submissionApprovedForJudging,
      createdAt: now,
      isRead: false,
      submissionTitle: title,
      contestTitle: 'Khoảnh Khắc Di Sản Việt Nam 2025',
      route: '/my-submissions',
    );

    await addNotification(testNotification, context: context, showInAppPush: true);
  }

  /// Tự động quét và phát hiện bài thi đạt APPROVED/APPROVED_FOR_JUDGING
  Future<void> syncJudgingNotifications(
    List<UserSubmission> submissions, {
    BuildContext? context,
  }) async {
    final newNotif = await _service.checkAndNotifyJudgingSubmission(
      userId: _currentUserId,
      submissions: submissions,
      context: context,
    );

    if (newNotif != null) {
      final currentList = state.value ?? [];
      final updatedList = [newNotif, ...currentList];
      state = AsyncValue.data(updatedList);
      await _service.saveNotifications(_currentUserId, updatedList);
    }
  }
}

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(
  NotificationsNotifier.new,
);

/// Provider đếm số thông báo chưa đọc
final unreadNotificationsCountProvider = Provider<int>((ref) {
  final notifsAsync = ref.watch(notificationsProvider);
  final notifs = notifsAsync.value ?? const [];
  return notifs.where((item) => !item.isRead).length;
});
