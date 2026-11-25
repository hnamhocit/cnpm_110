import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_application_2/core/services/contest_cache_manager.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (MethodCall methodCall) async {
        return '.';
      },
    );
  });

  group('ContestCacheManager Tests', () {
    test('returns same singleton instance', () {
      final instance1 = ContestCacheManager.instance;
      final instance2 = ContestCacheManager();

      expect(identical(instance1, instance2), isTrue);
      expect(ContestCacheManager.key, 'contest_entries_cache');
    });

    testWidgets('precache safely handles remote URLs and ignores invalid schemes', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              ContestCacheManager.precache(context, 'invalid-url');
              ContestCacheManager.precache(context, 'file:///path/to/file.jpg');
              ContestCacheManager.precache(
                context,
                'https://example.com/test-cache.jpg',
                isThumbnail: true,
              );
              ContestCacheManager.precache(
                context,
                'https://example.com/test-detail.jpg',
                isThumbnail: false,
              );

              return const SizedBox.shrink();
            },
          ),
        ),
      );

      await tester.pump();
    });
  });
}
