import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_2/core/providers/notification_provider.dart';
import 'package:flutter_application_2/models/app_notification.dart';
import 'package:flutter_application_2/screens/notifications_screen.dart';

void main() {
  group('NotificationsScreen Widget Tests (FPC-82)', () {
    testWidgets('Hiển thị danh sách thông báo và thẻ Vòng chấm điểm',
        (tester) async {
      final mockNotifications = [
        AppNotification(
          id: 'test_1',
          title: 'Bài thi được đưa vào vòng chấm điểm 🎯',
          message:
              'Tác phẩm "Nắng Sớm Làng Chài" của bạn đã chính thức bước vào vòng chấm điểm ẩn danh (Judging Round)!',
          type: NotificationType.submissionApprovedForJudging,
          createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
          isRead: false,
          submissionTitle: 'Nắng Sớm Làng Chài',
          route: '/my-submissions',
        ),
        AppNotification(
          id: 'test_2',
          title: 'Chào mừng bạn! 📷',
          message: 'Chào mừng bạn đến với hệ thống CINEGEN.',
          type: NotificationType.system,
          createdAt: DateTime.now().subtract(const Duration(hours: 1)),
          isRead: true,
        ),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            notificationsProvider.overrideWith(
              () => _MockNotificationsNotifier(mockNotifications),
            ),
          ],
          child: const MaterialApp(
            home: NotificationsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Kiểm tra tiêu đề màn hình
      expect(find.text('Thông báo'), findsOneWidget);

      // Kiểm tra thẻ thông báo vòng chấm điểm
      expect(find.text('Bài thi được đưa vào vòng chấm điểm 🎯'), findsOneWidget);
      expect(find.text('Vòng chấm điểm'), findsOneWidget);
      expect(find.text('Xem bài dự thi'), findsOneWidget);

      // Kiểm tra filter chips
      expect(find.text('Tất cả'), findsOneWidget);
      expect(find.text('Chưa đọc (1)'), findsOneWidget);
    });

    testWidgets('Lọc danh sách khi chọn tab "Chưa đọc"', (tester) async {
      final mockNotifications = [
        AppNotification(
          id: 'unread_1',
          title: 'Thông báo chưa đọc',
          message: 'Nội dung chưa đọc',
          type: NotificationType.submissionApprovedForJudging,
          createdAt: DateTime.now(),
          isRead: false,
        ),
        AppNotification(
          id: 'read_1',
          title: 'Thông báo đã đọc',
          message: 'Nội dung đã đọc',
          type: NotificationType.system,
          createdAt: DateTime.now(),
          isRead: true,
        ),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            notificationsProvider.overrideWith(
              () => _MockNotificationsNotifier(mockNotifications),
            ),
          ],
          child: const MaterialApp(
            home: NotificationsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Lúc đầu thấy cả 2
      expect(find.text('Thông báo chưa đọc'), findsOneWidget);
      expect(find.text('Thông báo đã đọc'), findsOneWidget);

      // Bấm chọn filter "Chưa đọc"
      await tester.tap(find.text('Chưa đọc (1)'));
      await tester.pumpAndSettle();

      // Chỉ còn thông báo chưa đọc
      expect(find.text('Thông báo chưa đọc'), findsOneWidget);
      expect(find.text('Thông báo đã đọc'), findsNothing);
    });
  });
}

class _MockNotificationsNotifier extends AsyncNotifier<List<AppNotification>>
    implements NotificationsNotifier {
  _MockNotificationsNotifier(this._initial);
  final List<AppNotification> _initial;

  @override
  Future<List<AppNotification>> build() async => _initial;

  @override
  Future<void> markAsRead(String id) async {
    final cur = state.value ?? [];
    state = AsyncValue.data(
      cur.map((e) => e.id == id ? e.copyWith(isRead: true) : e).toList(),
    );
  }

  @override
  Future<void> markAllAsRead() async {
    final cur = state.value ?? [];
    state = AsyncValue.data(cur.map((e) => e.copyWith(isRead: true)).toList());
  }

  @override
  Future<void> deleteNotification(String id) async {
    final cur = state.value ?? [];
    state = AsyncValue.data(cur.where((e) => e.id != id).toList());
  }

  @override
  Future<void> clearAll() async {
    state = const AsyncValue.data([]);
  }

  @override
  Future<void> addNotification(
    AppNotification notification, {
    BuildContext? context,
    bool showInAppPush = true,
  }) async {
    final cur = state.value ?? [];
    state = AsyncValue.data([notification, ...cur]);
  }

  @override
  Future<void> simulateJudgingNotification({
    BuildContext? context,
    String? submissionTitle,
  }) async {
    final cur = state.value ?? [];
    state = AsyncValue.data([
      AppNotification(
        id: 'sim_${DateTime.now().millisecondsSinceEpoch}',
        title: 'Bài thi được đưa vào vòng chấm điểm 🎯',
        message: 'Mô phỏng thành công',
        type: NotificationType.submissionApprovedForJudging,
        createdAt: DateTime.now(),
        isRead: false,
      ),
      ...cur,
    ]);
  }

  @override
  Future<void> syncJudgingNotifications(
    List<dynamic> submissions, {
    BuildContext? context,
  }) async {}
}
