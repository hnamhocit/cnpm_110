import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_application_2/models/image_attachment.dart';
import 'package:flutter_application_2/models/submission_data.dart';
import 'package:flutter_application_2/screens/submission/components/image_picker_card.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';

final Uint8List validPngBytes = Uint8List.fromList([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
  0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84,
  120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78,
  68, 174, 66, 96, 130
]);

void main() {
  group('ImageAttachment Model', () {
    test('formats size correctly across B, KB, and MB', () {
      final bAttachment = ImageAttachment(
        file: XFile('test.jpg'),
        name: 'test.jpg',
        sizeInBytes: 500,
      );
      expect(bAttachment.formattedSize, '500 B');

      final kbAttachment = ImageAttachment(
        file: XFile('test.jpg'),
        name: 'test.jpg',
        sizeInBytes: 1536,
      );
      expect(kbAttachment.formattedSize, '1.5 KB');

      final mbAttachment = ImageAttachment(
        file: XFile('test.jpg'),
        name: 'test.jpg',
        sizeInBytes: 5 * 1024 * 1024,
      );
      expect(mbAttachment.formattedSize, '5.00 MB');
    });

    test('copyWith updates properties properly', () {
      final original = ImageAttachment(
        file: XFile('test1.jpg'),
        name: 'test1.jpg',
        sizeInBytes: 100,
      );

      final copy = original.copyWith(name: 'renamed.jpg', sizeInBytes: 200);
      expect(copy.name, 'renamed.jpg');
      expect(copy.sizeInBytes, 200);
      expect(copy.file.path, 'test1.jpg');
    });
  });

  group('SubmissionData Model', () {
    test('creates and converts correctly', () {
      final attachment = ImageAttachment(
        file: XFile('scan.jpg'),
        name: 'scan.jpg',
        sizeInBytes: 2000,
      );

      final data = SubmissionData(
        contestId: 'contest-1',
        categoryId: 'cat-1',
        title: 'Film Photo',
        description: 'Shot on Portra 400',
        scanImage: attachment,
      );

      expect(data.title, 'Film Photo');
      expect(data.scanImage.name, 'scan.jpg');
      expect(data.negativeProof, isNull);

      final copy = data.copyWith(title: 'Updated Title');
      expect(copy.title, 'Updated Title');
      expect(copy.contestId, 'contest-1');
    });

    test('SubmissionResult parses from JSON correctly', () {
      final json = {
        'id': 'sub-999',
        'contestId': 'contest-1',
        'categoryId': 'cat-1',
        'title': 'My Film',
        'imageOriginalPath': 'submissions/p1/sub-999.jpg',
        'negativeProofPath': 'proofs/p1/sub-999.jpg',
        'status': 'PENDING_AI',
      };

      final result = SubmissionResult.fromJson(json);
      expect(result.id, 'sub-999');
      expect(result.status, 'PENDING_AI');
      expect(result.negativeProofPath, 'proofs/p1/sub-999.jpg');
    });
  });

  group('ImagePickerCard Widget', () {
    testWidgets('renders empty state and responds to buttons', (tester) async {
      ImageSource? pickedSource;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ImagePickerCard(
              title: 'Ảnh scan bài thi',
              subtitle: 'Bắt buộc • Tối đa 100MB',
              isRequired: true,
              onPickRequested: (source) async {
                pickedSource = source;
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Ảnh scan bài thi'), findsOneWidget);
      expect(find.text('Bắt buộc'), findsOneWidget);
      expect(find.text('Chưa có ảnh được chọn'), findsOneWidget);

      await tester.tap(find.widgetWithText(FilledButton, 'Thư viện ảnh'));
      await tester.pumpAndSettle();
      expect(pickedSource, ImageSource.gallery);

      await tester.tap(find.widgetWithText(OutlinedButton, 'Máy ảnh'));
      await tester.pumpAndSettle();
      expect(pickedSource, ImageSource.camera);
    });

    testWidgets('renders attached image and actions', (tester) async {
      bool previewTapped = false;
      bool removeTapped = false;

      final attachment = ImageAttachment(
        file: XFile.fromData(validPngBytes, name: 'film_scan.png'),
        name: 'film_scan.png',
        sizeInBytes: 4096,
        bytes: validPngBytes,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ImagePickerCard(
              title: 'Ảnh âm bản / Contact Sheet',
              subtitle: 'Tùy chọn • Tối đa 20MB',
              attachment: attachment,
              isRequired: false,
              onPickRequested: (_) async {},
              onPreview: () => previewTapped = true,
              onRemove: () => removeTapped = true,
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('film_scan.png'), findsOneWidget);
      expect(find.text('4.0 KB'), findsOneWidget);
      expect(find.text('Tùy chọn'), findsOneWidget);

      await tester.tap(find.text('Xem lớn'));
      expect(previewTapped, isTrue);

      await tester.tap(find.text('Xóa'));
      expect(removeTapped, isTrue);
    });

    testWidgets('renders error message when present', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ImagePickerCard(
              title: 'Ảnh scan bài thi',
              subtitle: 'Bắt buộc',
              errorMessage: 'Dung lượng file quá lớn',
              onPickRequested: (_) async {},
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Dung lượng file quá lớn'), findsOneWidget);
    });
  });
}
