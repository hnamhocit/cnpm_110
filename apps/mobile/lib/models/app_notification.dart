import 'package:flutter/material.dart';

/// Các phân loại thông báo trong ứng dụng
enum NotificationType {
  /// Bài thi được duyệt đưa vào vòng chấm điểm ẩn danh (FPC-82 / BR-12)
  submissionApprovedForJudging('Vòng chấm điểm'),

  /// Yêu cầu nộp bằng chứng âm bản 48h (BR-19)
  proofRequested('Yêu cầu âm bản'),

  /// Công bố kết quả cuộc thi & Bảng vàng vinh danh (BR-16)
  resultsPublished('Công bố kết quả'),

  /// Thông báo chung từ hệ thống
  system('Hệ thống');

  const NotificationType(this.label);
  final String label;

  static NotificationType fromString(String? value) {
    switch (value?.toLowerCase()) {
      case 'submission_approved_for_judging':
      case 'approved_for_judging':
      case 'judging':
        return NotificationType.submissionApprovedForJudging;
      case 'proof_requested':
        return NotificationType.proofRequested;
      case 'results_published':
      case 'published':
        return NotificationType.resultsPublished;
      default:
        return NotificationType.system;
    }
  }

  String toKey() {
    switch (this) {
      case NotificationType.submissionApprovedForJudging:
        return 'submission_approved_for_judging';
      case NotificationType.proofRequested:
        return 'proof_requested';
      case NotificationType.resultsPublished:
        return 'results_published';
      case NotificationType.system:
        return 'system';
    }
  }

  IconData get icon {
    switch (this) {
      case NotificationType.submissionApprovedForJudging:
        return Icons.gavel_rounded;
      case NotificationType.proofRequested:
        return Icons.timer_outlined;
      case NotificationType.resultsPublished:
        return Icons.emoji_events_outlined;
      case NotificationType.system:
        return Icons.notifications_active_outlined;
    }
  }

  Color getColor(ColorScheme colorScheme) {
    switch (this) {
      case NotificationType.submissionApprovedForJudging:
        return Colors.blue.shade700;
      case NotificationType.proofRequested:
        return Colors.orange.shade800;
      case NotificationType.resultsPublished:
        return Colors.amber.shade700;
      case NotificationType.system:
        return colorScheme.primary;
    }
  }
}

/// Model lưu trữ thông báo (In-app & Push Notification)
class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.createdAt,
    this.isRead = false,
    this.submissionId,
    this.submissionTitle,
    this.contestId,
    this.contestTitle,
    this.route,
    this.extraData,
  });

  final String id;
  final String title;
  final String message;
  final NotificationType type;
  final DateTime createdAt;
  final bool isRead;
  final String? submissionId;
  final String? submissionTitle;
  final String? contestId;
  final String? contestTitle;
  final String? route;
  final Map<String, dynamic>? extraData;

  AppNotification copyWith({
    String? id,
    String? title,
    String? message,
    NotificationType? type,
    DateTime? createdAt,
    bool? isRead,
    String? submissionId,
    String? submissionTitle,
    String? contestId,
    String? contestTitle,
    String? route,
    Map<String, dynamic>? extraData,
  }) {
    return AppNotification(
      id: id ?? this.id,
      title: title ?? this.title,
      message: message ?? this.message,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      submissionId: submissionId ?? this.submissionId,
      submissionTitle: submissionTitle ?? this.submissionTitle,
      contestId: contestId ?? this.contestId,
      contestTitle: contestTitle ?? this.contestTitle,
      route: route ?? this.route,
      extraData: extraData ?? this.extraData,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'type': type.toKey(),
      'created_at': createdAt.toIso8601String(),
      'is_read': isRead,
      'submission_id': submissionId,
      'submission_title': submissionTitle,
      'contest_id': contestId,
      'contest_title': contestTitle,
      'route': route,
      'extra_data': extraData,
    };
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String? ?? UniqueKey().toString(),
      title: json['title'] as String? ?? 'Thông báo',
      message: json['message'] as String? ?? '',
      type: NotificationType.fromString(json['type'] as String?),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
      isRead: json['is_read'] as bool? ?? false,
      submissionId: json['submission_id'] as String?,
      submissionTitle: json['submission_title'] as String?,
      contestId: json['contest_id'] as String?,
      contestTitle: json['contest_title'] as String?,
      route: json['route'] as String?,
      extraData: json['extra_data'] as Map<String, dynamic>?,
    );
  }

  /// Trả về thời gian hiển thị tương đối thân thiện
  String get timeAgo {
    final now = DateTime.now();
    final diff = now.difference(createdAt);

    if (diff.inSeconds < 60) {
      return 'Vừa xong';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes} phút trước';
    } else if (diff.inHours < 24) {
      return '${diff.inHours} giờ trước';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} ngày trước';
    } else {
      return '${createdAt.day.toString().padLeft(2, '0')}/${createdAt.month.toString().padLeft(2, '0')}/${createdAt.year}';
    }
  }
}
