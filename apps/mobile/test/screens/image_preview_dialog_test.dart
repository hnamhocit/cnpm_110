import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/components/cached_image_widget.dart';
import 'package:flutter_application_2/models/image_attachment.dart';
import 'package:flutter_application_2/screens/submission/components/image_preview_dialog.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';

final Uint8List validPngBytes = Uint8List.fromList([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
  0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84,
  120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78,
  68, 174, 66, 96, 130
]);

void main() {
  group('ImagePreviewDialog Widget', () {
    testWidgets(
      'renders CachedImageWidget when previewing remote URL with query tokens',
      (tester) async {
        const remoteUrl =
            'https://r2.cloudflarestorage.com/submissions/proof.jpg?X-Amz-Signature=sig789&token=abc';
        final attachment = ImageAttachment(
          file: XFile(remoteUrl),
          name: 'proof.jpg',
          sizeInBytes: 1024 * 1024 * 2,
        );

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ImagePreviewDialog(
                attachment: attachment,
                title: 'Xem ảnh âm bản',
              ),
            ),
          ),
        );
        await tester.pump();

        expect(find.text('Xem ảnh âm bản'), findsOneWidget);
        expect(find.byType(CachedImageWidget), findsOneWidget);
        final cachedWidget =
            tester.widget<CachedImageWidget>(find.byType(CachedImageWidget));
        expect(cachedWidget.imageUrl, remoteUrl);
        expect(cachedWidget.memCacheWidth, 1600);
        expect(cachedWidget.memCacheHeight, 1600);
      },
    );

    testWidgets('renders Image.file when previewing local file path', (
      tester,
    ) async {
      const localPath = '/data/user/0/com.app/cache/camera_capture.jpg';
      final attachment = ImageAttachment(
        file: XFile(localPath),
        name: 'camera_capture.jpg',
        sizeInBytes: 1024 * 300,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ImagePreviewDialog(
              attachment: attachment,
            ),
          ),
        ),
      );
      await tester.pump();

      expect(find.byType(CachedImageWidget), findsNothing);
      final imageWidget = tester.widget<Image>(find.byType(Image));
      expect(imageWidget.image, isA<FileImage>());
    });

    testWidgets(
      'renders Image.memory when previewing attachment with in-memory bytes',
      (tester) async {
        final attachment = ImageAttachment(
          file: XFile('in_memory.png'),
          name: 'in_memory.png',
          sizeInBytes: validPngBytes.length,
          bytes: validPngBytes,
        );

        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: ImagePreviewDialog(
                attachment: attachment,
              ),
            ),
          ),
        );
        await tester.pump();

        expect(find.byType(CachedImageWidget), findsNothing);
        final imageWidget = tester.widget<Image>(find.byType(Image));
        expect(imageWidget.image, isA<MemoryImage>());
      },
    );
  });
}
