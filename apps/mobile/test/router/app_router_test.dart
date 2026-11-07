import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/providers/contest_detail_provider.dart';
import 'package:flutter_application_2/models/contest.dart';
import 'package:flutter_application_2/router/app_router.dart';
import 'package:flutter_application_2/screens/contest/contest_detail_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

void main() {
  group('FPC-16: appRouter route configuration', () {
    test('contains no duplicate route paths', () {
      final routes = appRouter.configuration.routes.whereType<GoRoute>().toList();
      final paths = routes.map((r) => r.path).toList();
      final uniquePaths = paths.toSet();

      expect(
        paths.length,
        equals(uniquePaths.length),
        reason: 'Duplicate route paths found: ${paths.where((p) => paths.where((x) => x == p).length > 1)}',
      );
    });

    test('registers /contests/:id exactly once', () {
      final contestRoutes = appRouter.configuration.routes
          .whereType<GoRoute>()
          .where((r) => r.path == '/contests/:id')
          .toList();

      expect(contestRoutes.length, equals(1));
    });

    test('registers /contests/:id/submit for contest-specific submissions', () {
      final routes = appRouter.configuration.routes
          .whereType<GoRoute>()
          .where((r) => r.path == '/contests/:id/submit')
          .toList();

      expect(routes.length, equals(1));
    });

    test('registers /submissions/upload for general submissions', () {
      final routes = appRouter.configuration.routes
          .whereType<GoRoute>()
          .where((r) => r.path == '/submissions/upload')
          .toList();

      expect(routes.length, equals(1));
    });

    test('registers /film-dev-scan for film dev and scan params', () {
      final routes = appRouter.configuration.routes
          .whereType<GoRoute>()
          .where((r) => r.path == '/film-dev-scan')
          .toList();

      expect(routes.length, equals(1));
    });

    test('registers /film-params for film shooting params', () {
      final routes = appRouter.configuration.routes
          .whereType<GoRoute>()
          .where((r) => r.path == '/film-params')
          .toList();

      expect(routes.length, equals(1));
    });
  });

  group('FPC-16: ContestDetailScreen navigation button', () {
    testWidgets('shows "Nộp bài dự thi" button when contest is ongoing',
        (tester) async {
      final testContest = Contest(
        id: 'contest-456',
        name: 'Film Challenge 2026',
        status: ContestStatus.ongoing,
        startAt: DateTime.now().subtract(const Duration(days: 2)),
        endAt: DateTime.now().add(const Duration(days: 5)),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contestDetailProvider('contest-456').overrideWith(
              (ref) => Future.value(testContest),
            ),
          ],
          child: const MaterialApp(
            home: ContestDetailScreen(contestId: 'contest-456'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Nộp bài dự thi'), findsOneWidget);
      expect(find.text('Đăng ký tham gia'), findsOneWidget);
    });

    testWidgets('shows "Nộp bài dự thi" button when contest is open',
        (tester) async {
      final testContest = Contest(
        id: 'contest-123',
        name: 'Open Film Contest',
        status: ContestStatus.open,
        startAt: DateTime.now().subtract(const Duration(days: 1)),
        endAt: DateTime.now().add(const Duration(days: 10)),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contestDetailProvider('contest-123').overrideWith(
              (ref) => Future.value(testContest),
            ),
          ],
          child: const MaterialApp(
            home: ContestDetailScreen(contestId: 'contest-123'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Nộp bài dự thi'), findsOneWidget);
      expect(find.text('Đăng ký tham gia'), findsOneWidget);
    });

    testWidgets('does not show "Nộp bài dự thi" button when contest is draft',
        (tester) async {
      final testContest = Contest(
        id: 'contest-789',
        name: 'Draft Film Contest',
        status: ContestStatus.draft,
        startAt: DateTime.now().add(const Duration(days: 5)),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contestDetailProvider('contest-789').overrideWith(
              (ref) => Future.value(testContest),
            ),
          ],
          child: const MaterialApp(
            home: ContestDetailScreen(contestId: 'contest-789'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Nộp bài dự thi'), findsNothing);
      expect(find.text('Đăng ký tham gia'), findsOneWidget);
    });

    testWidgets('disables "Nộp bài dự thi" button when submission deadline is passed',
        (tester) async {
      final testContest = Contest(
        id: 'contest-999',
        name: 'Expired Film Contest',
        status: ContestStatus.ongoing,
        startAt: DateTime.now().subtract(const Duration(days: 10)),
        endAt: DateTime.now().subtract(const Duration(days: 1)),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contestDetailProvider('contest-999').overrideWith(
              (ref) => Future.value(testContest),
            ),
          ],
          child: const MaterialApp(
            home: ContestDetailScreen(contestId: 'contest-999'),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Button is rendered but disabled
      final submitButtonFinder = find.widgetWithText(FilledButton, 'Nộp bài dự thi');
      expect(submitButtonFinder, findsOneWidget);
      final button = tester.widget<FilledButton>(submitButtonFinder);
      expect(button.onPressed, isNull);
    });
  });
}
