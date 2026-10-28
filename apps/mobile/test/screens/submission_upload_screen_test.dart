import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/data/submission_repository.dart';
import 'package:flutter_application_2/core/services/image_picker_service.dart';
import 'package:flutter_application_2/models/image_attachment.dart';
import 'package:flutter_application_2/models/submission_data.dart';
import 'package:flutter_application_2/screens/submission/components/image_picker_card.dart';
import 'package:flutter_application_2/screens/submission/components/image_preview_dialog.dart';
import 'package:flutter_application_2/screens/submission/submission_upload_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';

// Minimal valid 1x1 PNG bytes for flutter image decoding
final Uint8List validPngBytes = Uint8List.fromList([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
  0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84,
  120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78,
  68, 174, 66, 96, 130
]);

class FakeImagePickerService implements ImagePickerService {
  FakeImagePickerService({this.nextAttachment});

  ImageAttachment? nextAttachment;

  @override
  Future<XFile?> pickImage({
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
  }) async {
    return nextAttachment?.file;
  }

  @override
  Future<ImageAttachment?> pickAttachment({
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
  }) async {
    return nextAttachment;
  }
}

class FakeSubmissionRepository implements SubmissionRepository {
  SubmissionData? lastSubmittedData;
  bool shouldThrow = false;

  @override
  Future<SubmissionResult> uploadSubmission(
    SubmissionData data, {
    void Function(int sent, int total)? onSendProgress,
  }) async {
    lastSubmittedData = data;
    if (shouldThrow) {
      throw Exception('Upload error');
    }
    return const SubmissionResult(
      id: 'sub-123',
      contestId: 'contest-456',
      categoryId: 'cat-789',
      title: 'Tác phẩm dự thi',
      imageOriginalPath: 'submissions/participant/sub-123.jpg',
      negativeProofPath: 'proofs/participant/sub-123.jpg',
      status: 'PENDING_AI',
    );
  }
}

void main() {
  late FakeImagePickerService fakePicker;
  late FakeSubmissionRepository fakeRepo;

  setUp(() {
    fakePicker = FakeImagePickerService();
    fakeRepo = FakeSubmissionRepository();
  });

  Widget buildTestWidget({
    ValueChanged<SubmissionResult>? onSubmissionSuccess,
  }) {
    return ProviderScope(
      overrides: [
        imagePickerServiceProvider.overrideWithValue(fakePicker),
        submissionRepositoryProvider.overrideWithValue(fakeRepo),
      ],
      child: MaterialApp(
        home: SubmissionUploadScreen(
          contestId: 'contest-456',
          contestTitle: 'Cuộc thi nhiếp ảnh phim',
          categoryId: 'cat-789',
          onSubmissionSuccess: onSubmissionSuccess,
        ),
      ),
    );
  }

  group('SubmissionUploadScreen Widget', () {
    testWidgets('renders all sections for FPC-45', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Nộp bài thi ảnh'), findsOneWidget);
      expect(find.text('Cuộc thi nhiếp ảnh phim'), findsOneWidget);
      expect(find.text('1. Thông tin tác phẩm'), findsOneWidget);
      expect(find.text('Tiêu đề tác phẩm *'), findsOneWidget);
      expect(find.text('2. Tải lên ảnh scan bài dự thi'), findsOneWidget);
      expect(find.text('Ảnh scan bài thi'), findsOneWidget);
      expect(find.text('Bắt buộc'), findsOneWidget);
      expect(
        find.text('3. Đính kèm ảnh âm bản (Negative / Contact Sheet)'),
        findsOneWidget,
      );
      expect(find.text('Ảnh âm bản / Contact Sheet'), findsOneWidget);
      expect(find.text('Tùy chọn'), findsOneWidget);
      expect(
        find.text('4. Thông số kỹ thuật chụp & tráng scan'),
        findsOneWidget,
      );
      expect(find.text('Nộp bài thi'), findsOneWidget);
      expect(find.text('Đặt lại form'), findsOneWidget);
    });

    testWidgets('shows validation error when scan image is missing on submit',
        (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Tiêu đề tác phẩm *'),
        'Hoàng hôn Đà Lạt',
      );

      await tester.tap(find.widgetWithText(FilledButton, 'Nộp bài thi'));
      await tester.pumpAndSettle();

      expect(
        find.text('Vui lòng chọn ảnh scan bài dự thi (bắt buộc).'),
        findsOneWidget,
      );
      expect(fakeRepo.lastSubmittedData, isNull);
    });

    testWidgets('picks scan image, displays preview, and opens full preview dialog',
        (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      fakePicker.nextAttachment = ImageAttachment(
        file: XFile.fromData(validPngBytes, name: 'scan_sample.png'),
        name: 'scan_sample.png',
        sizeInBytes: 2450,
        bytes: validPngBytes,
      );

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      // Tap gallery button on scan image card
      final galleryButtons = find.widgetWithText(FilledButton, 'Thư viện ảnh');
      await tester.tap(galleryButtons.first);
      await tester.pumpAndSettle();

      // Preview details shown
      expect(find.text('scan_sample.png'), findsOneWidget);
      expect(find.text('2.4 KB'), findsOneWidget);
      expect(find.text('Xem lớn'), findsOneWidget);

      // Tap 'Xem lớn' to open ImagePreviewDialog
      await tester.tap(find.text('Xem lớn'));
      await tester.pumpAndSettle();

      expect(find.byType(ImagePreviewDialog), findsOneWidget);
      expect(find.text('Xem trước ảnh scan bài thi'), findsOneWidget);

      // Close dialog
      await tester.tap(find.byTooltip('Đóng'));
      await tester.pumpAndSettle();
      expect(find.byType(ImagePreviewDialog), findsNothing);

      // Remove image
      await tester.tap(find.text('Xóa'));
      await tester.pumpAndSettle();
      expect(find.text('Chưa có ảnh được chọn'), findsNWidgets(2));
    });

    testWidgets('picks negative proof, displays preview, and submits successfully',
        (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      SubmissionResult? successResult;

      await tester.pumpWidget(buildTestWidget(
        onSubmissionSuccess: (res) => successResult = res,
      ));
      await tester.pumpAndSettle();

      // Enter title
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Tiêu đề tác phẩm *'),
        'Phố cổ Hội An',
      );

      // Pick Scan Image
      fakePicker.nextAttachment = ImageAttachment(
        file: XFile.fromData(validPngBytes, name: 'scan_main.png'),
        name: 'scan_main.png',
        sizeInBytes: 3000,
        bytes: validPngBytes,
      );
      final scanGalleryButton = find.widgetWithText(FilledButton, 'Thư viện ảnh').first;
      await tester.tap(scanGalleryButton);
      await tester.pumpAndSettle();

      // Pick Negative Proof
      fakePicker.nextAttachment = ImageAttachment(
        file: XFile.fromData(validPngBytes, name: 'negative_strip.png'),
        name: 'negative_strip.png',
        sizeInBytes: 1500,
        bytes: validPngBytes,
      );
      final proofCard = find.widgetWithText(ImagePickerCard, 'Ảnh âm bản / Contact Sheet');
      final proofGalleryButton = find.descendant(
        of: proofCard,
        matching: find.widgetWithText(FilledButton, 'Thư viện ảnh'),
      );
      await tester.tap(proofGalleryButton);
      await tester.pumpAndSettle();

      expect(find.text('negative_strip.png'), findsOneWidget);

      // Submit Form
      await tester.tap(find.widgetWithText(FilledButton, 'Nộp bài thi'));
      await tester.pumpAndSettle();

      expect(fakeRepo.lastSubmittedData, isNotNull);
      expect(fakeRepo.lastSubmittedData!.title, 'Phố cổ Hội An');
      expect(fakeRepo.lastSubmittedData!.scanImage.name, 'scan_main.png');
      expect(fakeRepo.lastSubmittedData!.negativeProof?.name, 'negative_strip.png');
      expect(successResult?.id, 'sub-123');

      // Success dialog shown
      expect(find.text('Nộp bài thi thành công!'), findsOneWidget);
      expect(find.text('Hoàn tất & Về trang chủ'), findsOneWidget);
    });

    testWidgets('resets form when reset button is pressed', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Tiêu đề tác phẩm *'),
        'Test Reset Title',
      );

      fakePicker.nextAttachment = ImageAttachment(
        file: XFile.fromData(validPngBytes, name: 'to_be_reset.png'),
        name: 'to_be_reset.png',
        sizeInBytes: 1000,
        bytes: validPngBytes,
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Thư viện ảnh').first);
      await tester.pumpAndSettle();

      expect(find.text('to_be_reset.png'), findsOneWidget);

      // Tap reset button
      await tester.tap(find.widgetWithText(OutlinedButton, 'Đặt lại form'));
      await tester.pumpAndSettle();

      expect(find.text('to_be_reset.png'), findsNothing);
      expect(find.text('Test Reset Title'), findsNothing);
    });
  });
}
