import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/data/submission_repository.dart';
import 'package:flutter_application_2/core/services/image_picker_service.dart';
import 'package:flutter_application_2/models/image_attachment.dart';
import 'package:flutter_application_2/models/submission_data.dart';
import 'package:flutter_application_2/models/user_submission.dart';
import 'package:flutter_application_2/screens/submission/components/image_picker_card.dart';
import 'package:flutter_application_2/screens/submission/components/image_preview_dialog.dart';
import 'package:flutter_application_2/screens/submission/submission_upload_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image/image.dart' as img;
import 'package:image_picker/image_picker.dart';

// Minimal valid 1x1 PNG bytes for flutter image decoding (useful for proof tests)
final Uint8List validPngBytes = Uint8List.fromList([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
  0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84,
  120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78,
  68, 174, 66, 96, 130
]);

// Valid 2000x2000 scan JPEG satisfying BR-07
final Uint8List validScanJpgBytes = Uint8List.fromList(
  img.encodeJpg(
    img.fill(img.Image(width: 2000, height: 2000), color: img.ColorRgb8(100, 150, 200)),
    quality: 70,
  ),
);

// Substandard 1800x1200 scan JPEG (< 2000px short edge)
final Uint8List substandardScanJpgBytes = Uint8List.fromList(
  img.encodeJpg(
    img.fill(img.Image(width: 1800, height: 1200), color: img.ColorRgb8(100, 150, 200)),
    quality: 70,
  ),
);

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

  @override
  Future<List<UserSubmission>> getMySubmissions({
    String? contestId,
    String? status,
  }) async {
    return const [];
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
      expect(find.text('Bắt buộc • Tối đa 25MB (BR-07)'), findsOneWidget);
      expect(
        find.text('3. Đính kèm ảnh âm bản (Negative / Contact Sheet)'),
        findsOneWidget,
      );
      expect(find.text('Ảnh âm bản / Contact Sheet'), findsOneWidget);
      expect(find.text('Tùy chọn • Tối đa 20MB'), findsOneWidget);
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

    testWidgets('blocks scan image with short edge 1800px and displays BR-07 error',
        (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      fakePicker.nextAttachment = ImageAttachment(
        file: XFile.fromData(substandardScanJpgBytes, name: 'substandard_1800.jpg'),
        name: 'substandard_1800.jpg',
        sizeInBytes: substandardScanJpgBytes.length,
        bytes: substandardScanJpgBytes,
        mimeType: 'image/jpeg',
      );

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      // Tap gallery button on scan image card
      final galleryButtons = find.widgetWithText(FilledButton, 'Thư viện ảnh');
      await tester.tap(galleryButtons.first);
      await tester.pumpAndSettle();

      // BR-07 error displayed
      expect(
        find.textContaining('cạnh ngắn phải từ 2000px trở lên'),
        findsOneWidget,
      );

      // Submit should still fail
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Tiêu đề tác phẩm *'),
        'Tác phẩm bị từ chối',
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Nộp bài thi'));
      await tester.pumpAndSettle();

      expect(fakeRepo.lastSubmittedData, isNull);
    });

    testWidgets('picks valid scan image, displays preview, and opens full preview dialog',
        (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      fakePicker.nextAttachment = ImageAttachment(
        file: XFile.fromData(validScanJpgBytes, name: 'scan_sample.jpg'),
        name: 'scan_sample.jpg',
        sizeInBytes: validScanJpgBytes.length,
        bytes: validScanJpgBytes,
        mimeType: 'image/jpeg',
      );

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      // Tap gallery button on scan image card
      final galleryButtons = find.widgetWithText(FilledButton, 'Thư viện ảnh');
      await tester.tap(galleryButtons.first);
      await tester.pumpAndSettle();

      // Preview details shown
      expect(find.text('scan_sample.jpg'), findsOneWidget);
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

      // Pick Valid Scan Image
      fakePicker.nextAttachment = ImageAttachment(
        file: XFile.fromData(validScanJpgBytes, name: 'scan_main.jpg'),
        name: 'scan_main.jpg',
        sizeInBytes: validScanJpgBytes.length,
        bytes: validScanJpgBytes,
        mimeType: 'image/jpeg',
      );
      final scanGalleryButton = find.widgetWithText(FilledButton, 'Thư viện ảnh').first;
      await tester.tap(scanGalleryButton);
      await tester.pumpAndSettle();

      // Pick Negative Proof (Proof does not enforce 2000px)
      fakePicker.nextAttachment = ImageAttachment(
        file: XFile.fromData(validPngBytes, name: 'negative_strip.png'),
        name: 'negative_strip.png',
        sizeInBytes: validPngBytes.length,
        bytes: validPngBytes,
        mimeType: 'image/png',
      );
      final proofCard = find.widgetWithText(ImagePickerCard, 'Ảnh âm bản / Contact Sheet');
      final proofGalleryButton = find.descendant(
        of: proofCard,
        matching: find.widgetWithText(FilledButton, 'Thư viện ảnh'),
      );
      await tester.tap(proofGalleryButton);
      await tester.pumpAndSettle();

      // Proof is converted to JPEG
      expect(find.text('negative_strip.jpg'), findsOneWidget);

      // Submit Form
      await tester.tap(find.widgetWithText(FilledButton, 'Nộp bài thi'));
      await tester.pumpAndSettle();

      expect(fakeRepo.lastSubmittedData, isNotNull);
      expect(fakeRepo.lastSubmittedData!.title, 'Phố cổ Hội An');
      expect(fakeRepo.lastSubmittedData!.scanImage.name, 'scan_main.jpg');
      expect(fakeRepo.lastSubmittedData!.negativeProof?.name, 'negative_strip.jpg');
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
        file: XFile.fromData(validScanJpgBytes, name: 'to_be_reset.jpg'),
        name: 'to_be_reset.jpg',
        sizeInBytes: validScanJpgBytes.length,
        bytes: validScanJpgBytes,
        mimeType: 'image/jpeg',
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Thư viện ảnh').first);
      await tester.pumpAndSettle();

      expect(find.text('to_be_reset.jpg'), findsOneWidget);

      // Tap reset button
      await tester.tap(find.widgetWithText(OutlinedButton, 'Đặt lại form'));
      await tester.pumpAndSettle();

      expect(find.text('to_be_reset.jpg'), findsNothing);
      expect(find.text('Test Reset Title'), findsNothing);
    });

    testWidgets('clears old scan image immediately when user begins picking a new image', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      fakePicker.nextAttachment = ImageAttachment(
        file: XFile.fromData(validScanJpgBytes, name: 'first_scan.jpg'),
        name: 'first_scan.jpg',
        sizeInBytes: validScanJpgBytes.length,
        bytes: validScanJpgBytes,
        mimeType: 'image/jpeg',
      );

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      final galleryButtons = find.widgetWithText(FilledButton, 'Thư viện ảnh');
      await tester.tap(galleryButtons.first);
      await tester.pumpAndSettle();

      expect(find.text('first_scan.jpg'), findsOneWidget);

      // Now prepare a second attachment that is substandard (1800px)
      fakePicker.nextAttachment = ImageAttachment(
        file: XFile.fromData(substandardScanJpgBytes, name: 'second_scan_bad.jpg'),
        name: 'second_scan_bad.jpg',
        sizeInBytes: substandardScanJpgBytes.length,
        bytes: substandardScanJpgBytes,
        mimeType: 'image/jpeg',
      );

      // Tap 'Đổi ảnh' on scan card and choose 'Thư viện ảnh' from bottom sheet
      await tester.tap(find.text('Đổi ảnh'));
      await tester.pumpAndSettle();

      await tester.tap(find.widgetWithText(ListTile, 'Thư viện ảnh'));
      await tester.pumpAndSettle();

      // Old image 'first_scan.jpg' MUST NOT remain attached!
      expect(find.text('first_scan.jpg'), findsNothing);
      expect(find.textContaining('cạnh ngắn phải từ 2000px trở lên'), findsOneWidget);

      // If user tries to submit, it must fail because scan image is cleared
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Tiêu đề tác phẩm *'),
        'Test Submit After Failed Pick',
      );
      await tester.tap(find.widgetWithText(FilledButton, 'Nộp bài thi'));
      await tester.pumpAndSettle();

      expect(fakeRepo.lastSubmittedData, isNull);
    });
  });
}