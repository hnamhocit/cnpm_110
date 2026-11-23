import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_2/models/app_notification.dart';

void main() {
  group('AppNotification Model Tests (FPC-82)', () {
    test('Khởi tạo và mapping đầy đủ các trường thông báo vòng chấm điểm', () {
      final now = DateTime.now();
      final notification = AppNotification(
        id: 'notif_1',
        title: 'Bài thi được đưa vào vòng chấm điểm 🎯',
        message:
            'Tác phẩm "Hoàng Hôn Cầu Long Biên" của bạn đã được đưa vào vòng chấm điểm.',
        type: NotificationType.submissionApprovedForJudging,
        createdAt: now,
        isRead: false,
        submissionId: 'sub_123',
        submissionTitle: 'Hoàng Hôn Cầu Long Biên',
        contestId: 'contest_456',
        contestTitle: 'Khoảnh Khắc Di Sản Việt Nam 2025',
        route: '/my-submissions',
      );

      expect(notification.id, 'notif_1');
      expect(notification.type, NotificationType.submissionApprovedForJudging);
      expect(notification.type.label, 'Vòng chấm điểm');
      expect(notification.isRead, false);
      expect(notification.submissionId, 'sub_123');
      expect(notification.route, '/my-submissions');
    });

    test('Chuyển đổi toJson và fromJson chính xác', () {
      final now = DateTime(2026, 11, 19, 20, 0, 0);
      final original = AppNotification(
        id: 'test_id',
        title: 'Test Notification',
        message: 'Test Message',
        type: NotificationType.submissionApprovedForJudging,
        createdAt: now,
        isRead: true,
        submissionId: 'sub_999',
        submissionTitle: 'Photo Title',
        contestId: 'contest_888',
        route: '/my-submissions',
      );

      final json = original.toJson();
      expect(json['id'], 'test_id');
      expect(json['type'], 'submission_approved_for_judging');
      expect(json['is_read'], true);

      final parsed = AppNotification.fromJson(json);
      expect(parsed.id, original.id);
      expect(parsed.title, original.title);
      expect(parsed.message, original.message);
      expect(parsed.type, NotificationType.submissionApprovedForJudging);
      expect(parsed.isRead, true);
      expect(parsed.submissionId, 'sub_999');
      expect(parsed.route, '/my-submissions');
    });

    test('copyWith cập nhật trạng thái đã đọc thành công', () {
      final notif = AppNotification(
        id: 'copy_test',
        title: 'Title',
        message: 'Message',
        type: NotificationType.system,
        createdAt: DateTime.now(),
        isRead: false,
      );

      final readNotif = notif.copyWith(isRead: true);
      expect(readNotif.isRead, true);
      expect(readNotif.id, notif.id);
      expect(readNotif.title, notif.title);
    });

    test('timeAgo format thời gian tương đối', () {
      final now = DateTime.now();
      final recent = AppNotification(
        id: 'recent',
        title: 'Just now',
        message: 'Msg',
        type: NotificationType.system,
        createdAt: now.subtract(const Duration(seconds: 10)),
      );
      expect(recent.timeAgo, 'Vừa xong');

      final minutesAgo = AppNotification(
        id: 'mins',
        title: '10m',
        message: 'Msg',
        type: NotificationType.system,
        createdAt: now.subtract(const Duration(minutes: 10)),
      );
      expect(minutesAgo.timeAgo, '10 phút trước');
    });
  });
}
