import 'package:flutter/material.dart';

import '../../../models/user_submission.dart';

enum StepStatus {
  completed,
  inProgress,
  failed,
  pending;
}

class ModerationTimelineWidget extends StatelessWidget {
  const ModerationTimelineWidget({
    super.key,
    required this.submission,
  });

  final UserSubmission submission;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final steps = _calculateSteps();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.timeline_rounded, color: colorScheme.primary, size: 20),
            const SizedBox(width: 8),
            Text(
              'Tiến trình kiểm duyệt thời gian thực',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        for (var i = 0; i < steps.length; i++)
          _buildStepRow(
            context,
            step: steps[i],
            isLast: i == steps.length - 1,
          ),
      ],
    );
  }

  List<_TimelineStepData> _calculateSteps() {
    final status = submission.status;

    // Step 1: Nộp bài
    final step1 = _TimelineStepData(
      title: 'Nộp bài dự thi',
      subtitle: submission.createdAt != null
          ? 'Đã ghi nhận (${submission.displayCode})'
          : 'Mã bài thi: ${submission.displayCode}',
      status: StepStatus.completed,
    );

    // Step 2: Thẩm định AI
    final StepStatus step2Status;
    final String step2Subtitle;
    if (status == SubmissionStatus.pendingAi) {
      if (submission.aiFlagged) {
        step2Status = StepStatus.inProgress;
        step2Subtitle = 'Phát hiện nghi vấn rủi ro AI (P_AI >= 75% - BR-09)';
      } else {
        step2Status = StepStatus.inProgress;
        step2Subtitle = 'Đang trong hàng đợi thẩm định AI và Perceptual Hash';
      }
    } else {
      step2Status = StepStatus.completed;
      step2Subtitle = submission.aiFlagged
          ? 'Đã gắn cờ cảnh báo AI (chuyển sang bước đối chứng âm bản)'
          : 'Quét AI hoàn tất (P_AI < 75%, không trùng pHash)';
    }
    final step2 = _TimelineStepData(
      title: 'Thẩm định AI & Trùng lặp',
      subtitle: step2Subtitle,
      status: step2Status,
    );

    // Step 3: Đối chứng âm bản
    final StepStatus step3Status;
    final String step3Subtitle;
    if (status == SubmissionStatus.proofRequested) {
      step3Status = StepStatus.inProgress;
      step3Subtitle = submission.remainingProofText ??
          'Yêu cầu bổ sung ảnh dải âm bản trong vòng 48h (BR-19)';
    } else if (status == SubmissionStatus.proofSubmitted) {
      step3Status = StepStatus.inProgress;
      step3Subtitle = 'Đã nộp ảnh dải âm bản • Đang chờ Ban tổ chức soi hạt phim';
    } else if (status == SubmissionStatus.disqualifiedNoProof) {
      step3Status = StepStatus.failed;
      step3Subtitle = 'Quá hạn 48 giờ không nộp dải âm bản (BR-19)';
    } else if (submission.hasProofAttached) {
      step3Status = StepStatus.completed;
      step3Subtitle = 'Đã đính kèm ảnh chụp dải phim âm bản đối chứng';
    } else if (status == SubmissionStatus.approved) {
      step3Status = StepStatus.completed;
      step3Subtitle = 'Hồ sơ âm bản đạt chuẩn hoặc không bắt buộc upfront';
    } else if (status == SubmissionStatus.disqualified) {
      step3Status = StepStatus.failed;
      step3Subtitle = 'Thẩm định âm bản không hợp lệ hoặc vi phạm thể lệ';
    } else {
      step3Status = StepStatus.pending;
      step3Subtitle = 'Chờ Ban tổ chức xem xét yêu cầu đối chứng';
    }
    final step3 = _TimelineStepData(
      title: 'Xác thực dải âm bản gốc (BR-06, BR-19)',
      subtitle: step3Subtitle,
      status: step3Status,
    );

    // Step 4: Kết luận kiểm duyệt (Đang chờ duyệt, Hợp lệ, Bị từ chối)
    final StepStatus step4Status;
    final String step4Title;
    final String step4Subtitle;
    if (status == SubmissionStatus.approved) {
      step4Status = StepStatus.completed;
      step4Title = 'Hợp lệ (Đã phê duyệt)';
      step4Subtitle = 'Tác phẩm đủ điều kiện chuyển sang Hội đồng Giám khảo chấm ẩn danh (Double-Blind)';
    } else if (status == SubmissionStatus.disqualified ||
        status == SubmissionStatus.disqualifiedNoProof) {
      step4Status = StepStatus.failed;
      step4Title = 'Bị từ chối (Loại bài thi)';
      step4Subtitle = submission.rejectionReason != null &&
              submission.rejectionReason!.isNotEmpty
          ? 'Lý do: ${submission.rejectionReason} (BR-18)'
          : (status == SubmissionStatus.disqualifiedNoProof
              ? 'Lý do: Quá thời hạn 48 giờ nộp ảnh âm bản (BR-19)'
              : 'Tác phẩm không đáp ứng quy chế cuộc thi');
    } else if (status == SubmissionStatus.withdrawn) {
      step4Status = StepStatus.failed;
      step4Title = 'Đã rút bài thi';
      step4Subtitle = 'Thí sinh đã chủ động rút bài dự thi trước hạn chót';
    } else {
      step4Status = StepStatus.inProgress;
      step4Title = 'Đang chờ duyệt';
      step4Subtitle = 'Ban tổ chức đang thẩm định tính hợp lệ của bài thi';
    }
    final step4 = _TimelineStepData(
      title: step4Title,
      subtitle: step4Subtitle,
      status: step4Status,
    );

    return [step1, step2, step3, step4];
  }

  Widget _buildStepRow(
    BuildContext context, {
    required _TimelineStepData step,
    required bool isLast,
  }) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    Color iconBgColor;
    Color iconFgColor;
    IconData icon;

    switch (step.status) {
      case StepStatus.completed:
        iconBgColor = Colors.green.shade50;
        iconFgColor = Colors.green.shade700;
        icon = Icons.check_circle_rounded;
        break;
      case StepStatus.inProgress:
        iconBgColor = Colors.amber.shade50;
        iconFgColor = Colors.amber.shade900;
        icon = Icons.pending_rounded;
        break;
      case StepStatus.failed:
        iconBgColor = colorScheme.errorContainer.withValues(alpha: 0.2);
        iconFgColor = colorScheme.error;
        icon = Icons.cancel_rounded;
        break;
      case StepStatus.pending:
        iconBgColor = colorScheme.surfaceContainerHighest;
        iconFgColor = colorScheme.onSurfaceVariant.withValues(alpha: 0.5);
        icon = Icons.radio_button_unchecked_rounded;
        break;
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator & connecting line
          Column(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: iconFgColor.withValues(alpha: 0.4)),
                ),
                child: Center(
                  child: Icon(icon, size: 16, color: iconFgColor),
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    color: step.status == StepStatus.completed
                        ? Colors.green.shade300
                        : colorScheme.outlineVariant,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.title,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: step.status == StepStatus.failed
                          ? colorScheme.error
                          : (step.status == StepStatus.completed
                              ? Colors.green.shade800
                              : null),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    step.subtitle,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TimelineStepData {
  const _TimelineStepData({
    required this.title,
    required this.subtitle,
    required this.status,
  });

  final String title;
  final String subtitle;
  final StepStatus status;
}

