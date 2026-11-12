import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/data/submission_repository.dart';
import 'package:flutter_application_2/core/network/api_exception.dart';
import 'package:flutter_application_2/models/image_attachment.dart';
import 'package:flutter_application_2/models/submission_data.dart';
import 'package:flutter_application_2/models/user_submission.dart';
import 'package:flutter_application_2/screens/submission/components/image_preview_dialog.dart';
import 'package:flutter_application_2/screens/submission/my_submissions_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class MockSubmissionRepo implements SubmissionRepository {
  MockSubmissionRepo({
    this.submissions = const [],
    this.shouldThrow = false,
  });

  List<UserSubmission> submissions;
  bool shouldThrow;

  @override
  Future<SubmissionResult> uploadSubmission(
    SubmissionData data, {
    void Function(int sent, int total)? onSendProgress,
  }) async {
    throw UnimplementedError();
  }

  @override
  Future<List<UserSubmission>> getMySubmissions({
    String? contestId,
    String? status,
  }) async {
    if (shouldThrow) {
      throw const ApiException('Lỗi kết nối máy chủ');
    }
    return submissions;
  }

  @override
  Future<void> uploadNegativeProof({
    required String submissionId,
    required ImageAttachment proofImage,
  }) async {}
}

final sampleSubmissions = [
  UserSubmission(
    id: 'sub-01',
    submissionCode: 'SUB-2026-0001',
    contestId: 'contest-01',
    contestTitle: 'Hanoi Analog 2026',
    categoryId: 'cat-01',
    title: 'Phố Cổ Mùa Thu',
    imageOriginalPath: 'https://example.com/photos/sub-01.jpg',
    imagePreviewPath: 'https://example.com/photos/sub-01_thumb.jpg',
    fileSizeBytes: 12582912,
    width: 3000,
    height: 2000,
    status: SubmissionStatus.approved,
    filmMetadata: const SubmissionFilmMetadata(
      filmBrand: 'Kodak',
      filmStock: 'Portra 400',
      cameraBody: 'Leica M6',
      frameNumber: '12',
    ),
  ),
  UserSubmission(
    id: 'sub-02',
    submissionCode: 'SUB-2026-0002',
    contestId: 'contest-01',
    contestTitle: 'Hanoi Analog 2026',
    categoryId: 'cat-01',
    title: 'Góc Phố Tràng Tiền',
    imageOriginalPath: 'https://example.com/photos/sub-02.jpg',
    status: SubmissionStatus.proofRequested,
    proofDeadlineAt: DateTime.now().add(const Duration(hours: 30)),
    filmMetadata: const SubmissionFilmMetadata(
      filmBrand: 'Fujifilm',
      filmStock: 'Superia 400',
      cameraBody: 'Nikon FM2',
      frameNumber: '24',
    ),
  ),
  UserSubmission(
    id: 'sub-03',
    submissionCode: 'SUB-2026-0003',
    contestId: 'contest-02',
    categoryId: 'cat-02',
    title: 'Bến Thuyền Hoàng Hôn',
    imageOriginalPath: '',
    status: SubmissionStatus.disqualified,
    rejectionReason: 'Ảnh không đạt chuẩn độ phân giải tối thiểu 2000px',
  ),
];

Widget createTestWidget(MockSubmissionRepo repo) {
  return ProviderScope(
    overrides: [
      submissionRepositoryProvider.overrideWithValue(repo),
    ],
    child: const MaterialApp(
      home: MySubmissionsScreen(),
    ),
  );
}

void main() {
  testWidgets('displays submissions list with titles and status badges', (tester) async {
    await tester.binding.setSurfaceSize(const Size(800, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final repo = MockSubmissionRepo(submissions: sampleSubmissions);

    await tester.pumpWidget(createTestWidget(repo));
    await tester.pump(); // Start fetching
    await tester.pump(const Duration(milliseconds: 100)); // Finish async

    expect(find.text('Bài thi của tôi'), findsOneWidget);
    expect(find.text('Trực tiếp'), findsOneWidget);
    expect(find.text('Phố Cổ Mùa Thu'), findsOneWidget);
    expect(find.text('Góc Phố Tràng Tiền'), findsOneWidget);
    expect(find.text('Bến Thuyền Hoàng Hôn'), findsOneWidget);

    expect(find.text('Hợp lệ'), findsNWidgets(2)); // ChoiceChip and Card status badge
    expect(find.text('Cần nộp âm bản'), findsOneWidget);
    expect(find.text('Bị từ chối'), findsNWidgets(2)); // ChoiceChip and Card status badge
  });

  testWidgets('displays urgent banner when proof is requested (BR-19)', (tester) async {
    final repo = MockSubmissionRepo(submissions: sampleSubmissions);

    await tester.pumpWidget(createTestWidget(repo));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Cần bổ sung âm bản khẩn cấp (BR-19)'), findsOneWidget);
    expect(find.text('Bạn có 1 bài thi cần tải dải âm bản trong 48 giờ.'), findsOneWidget);
    expect(find.text('Nộp âm bản'), findsWidgets);
  });

  testWidgets('filters list by choice chips (Đang chờ duyệt, Hợp lệ, Bị từ chối)', (tester) async {
    final repo = MockSubmissionRepo(submissions: sampleSubmissions);

    await tester.pumpWidget(createTestWidget(repo));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Tap on 'Hợp lệ' filter chip
    await tester.tap(find.widgetWithText(ChoiceChip, 'Hợp lệ'));
    await tester.pumpAndSettle();

    expect(find.text('Phố Cổ Mùa Thu'), findsOneWidget);
    expect(find.text('Góc Phố Tràng Tiền'), findsNothing);
    expect(find.text('Bến Thuyền Hoàng Hôn'), findsNothing);

    // Tap on 'Bị từ chối' filter chip
    await tester.tap(find.widgetWithText(ChoiceChip, 'Bị từ chối'));
    await tester.pumpAndSettle();

    expect(find.text('Bến Thuyền Hoàng Hôn'), findsOneWidget);
    expect(find.text('Phố Cổ Mùa Thu'), findsNothing);
    expect(find.text('Lý do: Ảnh không đạt chuẩn độ phân giải tối thiểu 2000px'), findsOneWidget);

    // Tap on 'Đang chờ duyệt' filter chip (includes Góc Phố Tràng Tiền which needs proof)
    await tester.tap(find.widgetWithText(ChoiceChip, 'Đang chờ duyệt'));
    await tester.pumpAndSettle();

    expect(find.text('Góc Phố Tràng Tiền'), findsOneWidget);
    expect(find.text('Phố Cổ Mùa Thu'), findsNothing);
    expect(find.text('Bến Thuyền Hoàng Hôn'), findsNothing);
  });

  testWidgets('filters list by search text field', (tester) async {
    final repo = MockSubmissionRepo(submissions: sampleSubmissions);

    await tester.pumpWidget(createTestWidget(repo));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Enter search query
    await tester.enterText(find.byType(TextField), 'Tràng Tiền');
    await tester.pumpAndSettle();

    expect(find.text('Góc Phố Tràng Tiền'), findsOneWidget);
    expect(find.text('Phố Cổ Mùa Thu'), findsNothing);
    expect(find.text('Bến Thuyền Hoàng Hôn'), findsNothing);
  });

  testWidgets('displays empty state when user has no submissions', (tester) async {
    final repo = MockSubmissionRepo(submissions: const []);

    await tester.pumpWidget(createTestWidget(repo));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Bạn chưa có bài dự thi nào'), findsOneWidget);
    expect(find.text('Khám phá cuộc thi'), findsOneWidget);
  });

  testWidgets('displays error state with retry button on failure', (tester) async {
    final repo = MockSubmissionRepo(shouldThrow: true);

    await tester.pumpWidget(createTestWidget(repo));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Đã xảy ra lỗi'), findsOneWidget);
    expect(find.text('Lỗi kết nối máy chủ'), findsOneWidget);
    expect(find.text('Thử lại'), findsOneWidget);

    // Turn off error and tap retry
    repo.shouldThrow = false;
    repo.submissions = sampleSubmissions;
    await tester.tap(find.text('Thử lại'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Phố Cổ Mùa Thu'), findsOneWidget);
  });

  testWidgets('tapping card opens submission details bottom sheet', (tester) async {
    await tester.binding.setSurfaceSize(const Size(800, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final repo = MockSubmissionRepo(submissions: sampleSubmissions);

    await tester.pumpWidget(createTestWidget(repo));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Tap on the first card
    await tester.tap(find.text('Phố Cổ Mùa Thu'));
    await tester.pumpAndSettle();

    expect(find.text('Tiến trình kiểm duyệt thời gian thực'), findsOneWidget);
    expect(find.text('Nộp bài dự thi'), findsOneWidget);
    expect(find.text('Thẩm định AI & Trùng lặp'), findsOneWidget);
    expect(find.text('Hợp lệ (Đã phê duyệt)'), findsOneWidget);

    // Scroll down bottom sheet to reveal lower sections
    await tester.drag(find.text('Tiến trình kiểm duyệt thời gian thực'), const Offset(0, -400));
    await tester.pumpAndSettle();

    expect(find.text('Thông số tệp ảnh (BR-07)'), findsOneWidget);
    expect(find.text('Siêu dữ liệu Analog (BR-22)'), findsOneWidget);

    await tester.drag(find.text('Siêu dữ liệu Analog (BR-22)'), const Offset(0, -300));
    await tester.pumpAndSettle();

    expect(find.text('Đóng'), findsOneWidget);

    // Tap close
    await tester.tap(find.text('Đóng'));
    await tester.pumpAndSettle();
    expect(find.text('Tiến trình kiểm duyệt thời gian thực'), findsNothing);
  });

  testWidgets('tapping thumbnail opens image preview dialog', (tester) async {
    final repo = MockSubmissionRepo(submissions: sampleSubmissions);

    await tester.pumpWidget(createTestWidget(repo));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Tap on fullscreen icon on thumbnail
    final fullscreenIcon = find.byIcon(Icons.fullscreen).first;
    await tester.tap(fullscreenIcon);
    await tester.pumpAndSettle();

    expect(find.byType(ImagePreviewDialog), findsOneWidget);
    expect(find.text('Phố Cổ Mùa Thu'), findsWidgets);

    // Tap close
    await tester.tap(find.byIcon(Icons.close));
    await tester.pumpAndSettle();
    expect(find.byType(ImagePreviewDialog), findsNothing);
  });

  testWidgets('tapping rejection guidance button on rejected card opens rejection details sheet (FPC-64)', (tester) async {
    await tester.binding.setSurfaceSize(const Size(800, 1600));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final repo = MockSubmissionRepo(submissions: sampleSubmissions);

    await tester.pumpWidget(createTestWidget(repo));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    // Find rejection guidance button for sub-03
    final guidanceBtn = find.byKey(const Key('card_rejection_guidance_sub-03'));
    expect(guidanceBtn, findsOneWidget);

    await tester.tap(guidanceBtn);
    await tester.pumpAndSettle();

    // Verify RejectionDetailsSheet opens
    expect(find.text('Chi tiết lý do từ chối bài thi'), findsOneWidget);
    expect(find.text('Bến Thuyền Hoàng Hôn'), findsWidgets);
    expect(find.textContaining('SUB-2026-0003'), findsWidgets);
    expect(find.text('Lý do chính thức từ Ban tổ chức (BR-18)'), findsOneWidget);
    expect(find.textContaining('Ảnh không đạt chuẩn độ phân giải tối thiểu 2000px'), findsWidgets);
    expect(find.textContaining('Quy định BR-07'), findsOneWidget);
    expect(find.text('Hướng dẫn khắc phục & Bổ sung thông tin'), findsOneWidget);
  });
}
