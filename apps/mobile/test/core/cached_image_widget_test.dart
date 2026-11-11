import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/components/cached_image_widget.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('CachedImageWidget', () {
    testWidgets('renders CachedNetworkImage with correct basic properties', (
      tester,
    ) async {
      const testUrl = 'https://example.com/photo.jpg';
      const headers = {'Authorization': 'Bearer token123'};

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CachedImageWidget(
              imageUrl: testUrl,
              width: 200,
              height: 150,
              fit: BoxFit.cover,
              memCacheWidth: 400,
              memCacheHeight: 300,
              maxWidthDiskCache: 800,
              maxHeightDiskCache: 600,
              cacheKey: 'custom-cache-key',
              httpHeaders: headers,
            ),
          ),
        ),
      );

      final cachedImageFinder = find.byType(CachedNetworkImage);
      expect(cachedImageFinder, findsOneWidget);

      final cachedImage =
          tester.widget<CachedNetworkImage>(cachedImageFinder);
      expect(cachedImage.imageUrl, testUrl);
      expect(cachedImage.width, 200);
      expect(cachedImage.height, 150);
      expect(cachedImage.fit, BoxFit.cover);
      expect(cachedImage.memCacheWidth, 400);
      expect(cachedImage.memCacheHeight, 300);
      expect(cachedImage.maxWidthDiskCache, 800);
      expect(cachedImage.maxHeightDiskCache, 600);
      expect(cachedImage.cacheKey, 'custom-cache-key');
      expect(cachedImage.httpHeaders, headers);
      // ClipRRect should not be present when borderRadius is null
      expect(find.byType(ClipRRect), findsNothing);
    });

    testWidgets('applies ClipRRect when borderRadius is specified', (
      tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CachedImageWidget(
              imageUrl: 'https://example.com/avatar.jpg',
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
          ),
        ),
      );

      final clipRRectFinder = find.byType(ClipRRect);
      expect(clipRRectFinder, findsOneWidget);

      final clipRRect = tester.widget<ClipRRect>(clipRRectFinder);
      expect(clipRRect.borderRadius, BorderRadius.circular(12));
      expect(find.byType(CachedNetworkImage), findsOneWidget);
    });

    testWidgets('shows default placeholder with progress indicator initially', (
      tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CachedImageWidget(
              imageUrl: 'https://example.com/loading-test.jpg',
              width: 100,
              height: 100,
            ),
          ),
        ),
      );

      // In test environment, CachedNetworkImage initially renders its placeholder
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders custom placeholder when provided', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CachedImageWidget(
              imageUrl: 'https://example.com/custom-loading.jpg',
              placeholder: (context, url) => const Text('Đang nạp ảnh...'),
            ),
          ),
        ),
      );

      expect(find.text('Đang nạp ảnh...'), findsOneWidget);
    });

    testWidgets('renders custom error widget when provided and error occurs', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CachedImageWidget(
              imageUrl: 'https://example.com/broken.jpg',
              errorWidget: (context, url, error) =>
                  const Text('Không thể tải hình ảnh'),
            ),
          ),
        ),
      );

      // Verify that CachedNetworkImage widget received the custom errorWidget builder
      final cachedImage =
          tester.widget<CachedNetworkImage>(find.byType(CachedNetworkImage));
      expect(cachedImage.errorWidget, isNotNull);

      // Directly invoke the errorWidget to verify its output
      final BuildContext context = tester.element(find.byType(Scaffold));
      final errorResult =
          cachedImage.errorWidget!(context, 'https://example.com/broken.jpg', Exception('404'));

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: errorResult,
          ),
        ),
      );
      expect(find.text('Không thể tải hình ảnh'), findsOneWidget);
    });

    testWidgets('renders default error widget with broken image icon', (
      tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: CachedImageWidget(
              imageUrl: 'https://example.com/default-err.jpg',
              width: 120,
              height: 120,
            ),
          ),
        ),
      );

      final cachedImage =
          tester.widget<CachedNetworkImage>(find.byType(CachedNetworkImage));
      expect(cachedImage.errorWidget, isNotNull);

      // Invoke default errorWidget callback
      final BuildContext context = tester.element(find.byType(Scaffold));
      final errorResult = cachedImage.errorWidget!(
        context,
        'https://example.com/default-err.jpg',
        Exception('Network failed'),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: errorResult,
          ),
        ),
      );

      expect(find.byIcon(Icons.broken_image_outlined), findsOneWidget);
    });
  });
}
