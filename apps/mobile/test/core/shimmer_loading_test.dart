import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/components/shimmer_loading.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shimmer/shimmer.dart';

void main() {
  group('Shimmer & Skeleton Loading Components', () {
    testWidgets('ShimmerLoading renders child with Shimmer effect in Light mode', (
      tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ShimmerLoading(
              child: Text('Đang tải dữ liệu...'),
            ),
          ),
        ),
      );

      expect(find.byType(Shimmer), findsOneWidget);
      expect(find.text('Đang tải dữ liệu...'), findsOneWidget);
    });

    testWidgets('ShimmerLoading renders in Dark mode with dark base colors', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: ThemeData.dark(),
          home: const Scaffold(
            body: ShimmerLoading(
              child: SkeletonBox(width: 100, height: 20),
            ),
          ),
        ),
      );

      expect(find.byType(Shimmer), findsOneWidget);
      expect(find.byType(SkeletonBox), findsOneWidget);
    });

    testWidgets('SkeletonBox renders with custom dimensions and radius', (
      tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SkeletonBox(
              width: 150,
              height: 25,
              borderRadius: 12,
            ),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration?;

      expect(container.constraints?.minWidth, 150);
      expect(container.constraints?.minHeight, 25);
      expect(decoration?.borderRadius, BorderRadius.circular(12));
    });

    testWidgets('SkeletonCircle renders as circular shape', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SkeletonCircle(radius: 20),
          ),
        ),
      );

      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration?;

      expect(container.constraints?.minWidth, 40);
      expect(container.constraints?.minHeight, 40);
      expect(decoration?.shape, BoxShape.circle);
    });

    testWidgets('ShimmerImagePlaceholder renders placeholder with icon', (
      tester,
    ) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: ShimmerImagePlaceholder(
              width: 120,
              height: 120,
              showIcon: true,
            ),
          ),
        ),
      );

      expect(find.byType(Shimmer), findsOneWidget);
      expect(find.byIcon(Icons.image_outlined), findsOneWidget);
    });

    testWidgets('WinnersShowcaseSkeleton renders podium and card skeletons', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: WinnersShowcaseSkeleton(),
          ),
        ),
      );

      expect(find.byType(PodiumSkeleton), findsOneWidget);
      expect(find.byType(WinnerCardSkeleton), findsWidgets);
    });

    testWidgets('SubmissionsListSkeleton renders 4 item skeletons', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SubmissionsListSkeleton(),
          ),
        ),
      );

      expect(find.byType(SubmissionsListSkeleton), findsOneWidget);
      expect(find.byType(Shimmer), findsOneWidget);
    });

    testWidgets('PhotoGridSkeleton renders grid with specified items', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PhotoGridSkeleton(itemCount: 4),
          ),
        ),
      );

      expect(find.byType(GridView), findsOneWidget);
      expect(find.byType(Shimmer), findsOneWidget);
    });
  });
}
