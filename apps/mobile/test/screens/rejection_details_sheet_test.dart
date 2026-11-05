import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_2/models/user_submission.dart';
import 'package:flutter_application_2/screens/submission/components/rejection_details_sheet.dart';

void main() {
  final sampleDisqualifiedSubmission = UserSubmission(
    id: 'sub-test-01',
    submissionCode: 'SUB-2026-DISQ1',
    contestId: 'contest-01',
    contestTitle: 'Khoảnh Khắc Đen Trắng 2026',
    categoryId: 'cat-01',
    title: 'Hoàng Hôn Trên Phố',
    status: SubmissionStatus.disqualified,
    rejectionReason: 'Ảnh scan không đạt độ phân giải cạnh ngắn 2000px và nghi vấn trùng lặp pHash với bài thi khác.',
    imageOriginalPath: 'https://example.com/disq.jpg',
    updatedAt: DateTime(2026, 11, 4, 15, 30),
  );

  final sampleExpiredProofSubmission = UserSubmission(
    id: 'sub-test-02',
    submissionCode: 'SUB-2026-EXPIR',
    contestId: 'contest-01',
    contestTitle: 'Sắc Màu Phim Âm Bản',
    categoryId: 'cat-01',
    title: 'Góc Phố Cổ Hà Nội',
    status: SubmissionStatus.disqualifiedNoProof,
    rejectionReason: null,
    imageOriginalPath: 'https://example.com/expired.jpg',
    updatedAt: DateTime(2026, 11, 3, 10, 0),
  );

  Widget createWidgetForTesting(UserSubmission submission, {void Function(String, String)? onAppeal}) {
    return MaterialApp(
      home: Scaffold(
        body: Builder(
          builder: (context) => ElevatedButton(
            onPressed: () {
              RejectionDetailsSheet.show(
                context,
                submission: submission,
                onAppealSubmitted: onAppeal,
              );
            },
            child: const Text('Mở chi tiết từ chối'),
          ),
        ),
      ),
    );
  }

  group('RejectionDetailsSheet Widget Tests (FPC-64)', () {
    testWidgets('hiển thị đầy đủ thông tin bài thi và lý do chính thức từ BTC', (tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1600));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(createWidgetForTesting(sampleDisqualifiedSubmission));
      await tester.tap(find.text('Mở chi tiết từ chối'));
      await tester.pumpAndSettle();

      // Kiểm tra tiêu đề và mã bài thi
      expect(find.text('Chi tiết lý do từ chối bài thi'), findsOneWidget);
      expect(find.text('Hoàng Hôn Trên Phố'), findsOneWidget);
      expect(find.textContaining('SUB-2026-DISQ1'), findsOneWidget);
      expect(find.textContaining('Khoảnh Khắc Đen Trắng 2026'), findsOneWidget);

      // Kiểm tra nội dung lý do chính thức
      expect(find.text('Lý do chính thức từ Ban tổ chức (BR-18)'), findsOneWidget);
      expect(
        find.textContaining('Ảnh scan không đạt độ phân giải cạnh ngắn 2000px'),
        findsOneWidget,
      );

      // Kiểm tra phát hiện quy chuẩn liên quan (BR-07, BR-09/10)
      expect(find.textContaining('Quy định BR-07'), findsOneWidget);
      expect(find.textContaining('Quy định BR-09 & BR-10'), findsOneWidget);

      // Kiểm tra các bước hướng dẫn
      expect(find.text('Hướng dẫn khắc phục & Bổ sung thông tin'), findsOneWidget);
      expect(find.text('Kiểm tra dải phim âm bản & Sổ tay cuộn phim'), findsOneWidget);
      expect(find.text('Chụp lại dải âm bản hoặc quét lại tệp ảnh'), findsOneWidget);
      expect(find.text('Gửi đơn giải trình / khiếu nại tới Ban tổ chức'), findsOneWidget);
    });

    testWidgets('hiển thị thông báo tự động cho bài thi quá hạn nộp âm bản BR-19', (tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1600));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(createWidgetForTesting(sampleExpiredProofSubmission));
      await tester.tap(find.text('Mở chi tiết từ chối'));
      await tester.pumpAndSettle();

      expect(find.text('Góc Phố Cổ Hà Nội'), findsOneWidget);
      expect(find.textContaining('SUB-2026-EXPIR'), findsOneWidget);

      // Phải có thông báo tự động về quá hạn 48h
      expect(
        find.textContaining('quá thời hạn 48 giờ nộp ảnh chụp dải phim âm bản đối chứng (Quy định BR-19)'),
        findsOneWidget,
      );

      // Phải phát hiện quy chế BR-19
      expect(find.textContaining('Quy định BR-19: Hạn chót 48 giờ'), findsOneWidget);
    });

    testWidgets('mở Dialog hướng dẫn chụp dải phim âm bản chuẩn', (tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1600));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      await tester.pumpWidget(createWidgetForTesting(sampleDisqualifiedSubmission));
      await tester.tap(find.text('Mở chi tiết từ chối'));
      await tester.pumpAndSettle();

      final guideBtn = find.byKey(const Key('negative_proof_guide_button'));
      expect(guideBtn, findsOneWidget);
      await tester.tap(guideBtn);
      await tester.pumpAndSettle();

      // Kiểm tra dialog mở ra
      expect(find.text('Chuẩn chụp ảnh Dải phim âm bản'), findsOneWidget);
      expect(find.textContaining('1. Nguồn sáng nền (Backlight)'), findsOneWidget);
      expect(find.textContaining('2. Viền Rebate Edge chứa mã vạch'), findsOneWidget);
      expect(find.textContaining('3. Tính liên tục của cuộn phim'), findsOneWidget);

      // Bấm nút đã hiểu để đóng
      await tester.tap(find.text('Đã hiểu quy chuẩn'));
      await tester.pumpAndSettle();
      expect(find.text('Chuẩn chụp ảnh Dải phim âm bản'), findsNothing);
    });

    testWidgets('mở Dialog giải trình, kiểm tra validation >= 10 ký tự và gửi thành công', (tester) async {
      await tester.binding.setSurfaceSize(const Size(800, 1600));
      addTearDown(() => tester.binding.setSurfaceSize(null));

      String? submittedCategory;
      String? submittedContent;

      await tester.pumpWidget(createWidgetForTesting(
        sampleDisqualifiedSubmission,
        onAppeal: (cat, content) {
          submittedCategory = cat;
          submittedContent = content;
        },
      ));
      await tester.tap(find.text('Mở chi tiết từ chối'));
      await tester.pumpAndSettle();

      final appealBtn = find.byKey(const Key('rejection_appeal_button'));
      expect(appealBtn, findsOneWidget);
      await tester.tap(appealBtn);
      await tester.pumpAndSettle();

      // Kiểm tra dialog mở
      expect(find.text('Gửi giải trình cho Ban tổ chức'), findsOneWidget);

      // Thử submit trống -> Báo lỗi
      final submitBtn = find.byKey(const Key('appeal_submit_button'));
      await tester.tap(submitBtn);
      await tester.pumpAndSettle();

      expect(
        find.text('Vui lòng nhập nội dung giải trình tối thiểu 10 ký tự.'),
        findsOneWidget,
      );
      expect(submittedContent, isNull);

      // Nhập dưới 10 ký tự -> Vẫn báo lỗi
      final contentField = find.byKey(const Key('appeal_content_field'));
      await tester.enterText(contentField, 'Quá ngắn');
      await tester.tap(submitBtn);
      await tester.pumpAndSettle();

      expect(
        find.text('Vui lòng nhập nội dung giải trình tối thiểu 10 ký tự.'),
        findsOneWidget,
      );

      // Nhập đủ ký tự hợp lệ
      await tester.enterText(
        contentField,
        'Tôi xin gửi lại ảnh chụp dải phim âm bản có viền rebate edge rõ nét.',
      );
      await tester.tap(submitBtn);
      await tester.pump(const Duration(milliseconds: 500));
      await tester.pumpAndSettle();

      // Xác nhận callback được gọi
      expect(submittedCategory, isNotNull);
      expect(
        submittedContent,
        'Tôi xin gửi lại ảnh chụp dải phim âm bản có viền rebate edge rõ nét.',
      );

      // Xác nhận SnackBar thông báo thành công
      expect(find.textContaining('Đã gửi giải trình cho bài thi'), findsOneWidget);
    });
  });
}
