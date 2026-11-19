import 'package:flutter/material.dart';
import 'package:flutter_application_2/models/user_submission.dart';
import 'package:flutter_application_2/screens/submission/components/moderation_timeline_widget.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('ModerationTimelineWidget renders approved submission steps', (tester) async {
    const sub = UserSubmission(
      id: 'sub-approved-01',
      submissionCode: 'SUB-2026-0001',
      contestId: 'c1',
      categoryId: 'cat1',
      title: 'Ảnh Phim Mùa Hạ',
      imageOriginalPath: 'path.jpg',
      negativeProofPath: 'proofs/sub-01.jpg',
      status: SubmissionStatus.approved,
    );

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ModerationTimelineWidget(submission: sub),
        ),
      ),
    );

    expect(find.text('Tiến trình kiểm duyệt thời gian thực'), findsOneWidget);
    expect(find.text('Nộp bài dự thi'), findsOneWidget);
    expect(find.text('Thẩm định AI & Trùng lặp'), findsOneWidget);
    expect(find.text('Xác thực dải âm bản gốc (BR-06, BR-19)'), findsOneWidget);
    expect(find.text('Hợp lệ (Đã phê duyệt)'), findsOneWidget);
  });

  testWidgets('ModerationTimelineWidget renders proof requested step with BR-19 info', (tester) async {
    final sub = UserSubmission(
      id: 'sub-proof-02',
      submissionCode: 'SUB-2026-0002',
      contestId: 'c1',
      categoryId: 'cat1',
      title: 'Góc Phố Vắng',
      imageOriginalPath: 'path.jpg',
      status: SubmissionStatus.proofRequested,
      proofDeadlineAt: DateTime.now().add(const Duration(hours: 40)),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ModerationTimelineWidget(submission: sub),
        ),
      ),
    );

    expect(find.text('Tiến trình kiểm duyệt thời gian thực'), findsOneWidget);
    expect(find.text('Đang chờ duyệt'), findsOneWidget);
    expect(find.textContaining('BR-19'), findsWidgets);
  });

  testWidgets('ModerationTimelineWidget displays rejection reason for disqualified submission (BR-18)', (tester) async {
    const sub = UserSubmission(
      id: 'sub-disqualified-03',
      submissionCode: 'SUB-2026-0003',
      contestId: 'c1',
      categoryId: 'cat1',
      title: 'Bình Minh Trên Biển',
      imageOriginalPath: 'path.jpg',
      status: SubmissionStatus.disqualified,
      rejectionReason: 'Trùng mã băm Perceptual Hash với bài thi khác (BR-10)',
    );

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: ModerationTimelineWidget(submission: sub),
        ),
      ),
    );

    expect(find.text('Tiến trình kiểm duyệt thời gian thực'), findsOneWidget);
    expect(find.text('Bị từ chối (Loại bài thi)'), findsOneWidget);
    expect(find.textContaining('Lý do: Trùng mã băm Perceptual Hash'), findsOneWidget);
    expect(find.textContaining('BR-18'), findsOneWidget);
  });
}
