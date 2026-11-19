import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_application_2/core/components/contest_cached_image.dart';
import 'package:flutter_application_2/core/services/contest_cache_manager.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    const channel = MethodChannel('plugins.flutter.io/path_provider');
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (MethodCall methodCall) async {
      return '.';
    });
  });

  group('ContestCacheManager', () {
    test('singleton returns same instance', () {
      final instance1 = ContestCacheManager.instance;
      final instance2 = ContestCacheManager();

      expect(identical(instance1, instance2), isTrue);
      expect(ContestCacheManager.key, equals('contest_entries_cache'));
    });

    testWidgets('precache helper runs safely without exception', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              ContestCacheManager.precache(
                context,
                'https://example.com/test_entry.jpg',
                isThumbnail: true,
              );
              return const SizedBox();
            },
          ),
        ),
      );

      expect(tester.takeException(), isNull);
    });
  });

  group('ContestCachedImage Widget', () {
    testWidgets('renders CachedNetworkImage with thumbnail constraints', (tester) async {
      const testUrl = 'https://example.com/contest_thumb.jpg';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ContestCachedImage(
              imageUrl: testUrl,
              width: 100,
              height: 100,
              isThumbnail: true,
            ),
          ),
        ),
      );

      final finder = find.byType(CachedNetworkImage);
      expect(finder, findsOneWidget);

      final widget = tester.widget<CachedNetworkImage>(finder);
      expect(widget.imageUrl, equals(testUrl));
      expect(widget.cacheManager, equals(ContestCacheManager.instance));
      expect(widget.maxWidthDiskCache, equals(800));
      expect(widget.maxHeightDiskCache, equals(800));
      expect(widget.fadeInDuration, equals(const Duration(milliseconds: 120)));
      expect(widget.fadeOutDuration, equals(const Duration(milliseconds: 50)));

      // RAM calculation: width (100) * dpr (e.g. 1.0 or 3.0)
      expect(widget.memCacheWidth, isNotNull);
      expect(widget.memCacheHeight, isNotNull);
    });

    testWidgets('safely handles double.infinity width and height using isFinite', (tester) async {
      const testUrl = 'https://example.com/full_entry.jpg';

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SizedBox(
              width: 300,
              height: 200,
              child: ContestCachedImage(
                imageUrl: testUrl,
                width: double.infinity,
                height: double.infinity,
                isThumbnail: false,
              ),
            ),
          ),
        ),
      );

      final finder = find.byType(CachedNetworkImage);
      expect(finder, findsOneWidget);

      final widget = tester.widget<CachedNetworkImage>(finder);
      // Because width was infinity, isFinite protected it from crash and applied fallback 1920
      expect(widget.memCacheWidth, equals(1920));
      expect(widget.memCacheHeight, equals(1920));
      expect(widget.maxWidthDiskCache, equals(1920));
      expect(widget.maxHeightDiskCache, equals(1920));
    });

    testWidgets('renders static lightweight placeholder without animated spinners', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ContestCachedImage(
              imageUrl: 'https://example.com/loading_entry.jpg',
              width: 80,
              height: 80,
            ),
          ),
        ),
      );

      // Lightweight placeholder uses static Icons.image_outlined rather than heavy CircularProgressIndicator
      expect(find.byIcon(Icons.image_outlined), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets('renders default error widget on error', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ContestCachedImage(
              imageUrl: 'https://example.com/error_entry.jpg',
              width: 80,
              height: 80,
            ),
          ),
        ),
      );

      final finder = find.byType(CachedNetworkImage);
      final widget = tester.widget<CachedNetworkImage>(finder);
      expect(widget.errorWidget, isNotNull);

      final context = tester.element(find.byType(Scaffold));
      final errorWidget = widget.errorWidget!(
        context,
        'https://example.com/error_entry.jpg',
        Exception('Network failed'),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(body: errorWidget),
        ),
      );

      expect(find.byIcon(Icons.broken_image_outlined), findsOneWidget);
    });
  });
}
