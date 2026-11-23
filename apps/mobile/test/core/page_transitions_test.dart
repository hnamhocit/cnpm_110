import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/utils/page_transitions.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppTransitions Page Transition Tests', () {
    testWidgets('slideUpFade creates valid CustomTransitionPage', (tester) async {
      const pageKey = ValueKey('test-slide-fade');
      const testChild = Text('Screen Content');

      final page = AppTransitions.slideUpFade(
        key: pageKey,
        child: testChild,
      );

      expect(page.key, pageKey);
      expect(page.transitionDuration, const Duration(milliseconds: 350));
      expect(page.reverseTransitionDuration, const Duration(milliseconds: 300));
    });

    testWidgets('fadeScale creates valid CustomTransitionPage', (tester) async {
      const pageKey = ValueKey('test-fade-scale');
      const testChild = Text('Photo Detail Content');

      final page = AppTransitions.fadeScale(
        key: pageKey,
        child: testChild,
      );

      expect(page.key, pageKey);
      expect(page.transitionDuration, const Duration(milliseconds: 380));
      expect(page.reverseTransitionDuration, const Duration(milliseconds: 300));
    });

    testWidgets('buildPageRoute transitions smoothly into new screen', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    AppTransitions.buildPageRoute(
                      page: const Scaffold(body: Text('Target Screen')),
                      isDetail: true,
                    ),
                  );
                },
                child: const Text('Open Detail'),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Open Detail'), findsOneWidget);
      await tester.tap(find.text('Open Detail'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 200));

      expect(find.byType(FadeTransition), findsWidgets);
      expect(find.byType(ScaleTransition), findsWidgets);

      await tester.pumpAndSettle();
      expect(find.text('Target Screen'), findsOneWidget);
    });

    testWidgets('buildPageRoute for list screen uses slide transition', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    AppTransitions.buildPageRoute(
                      page: const Scaffold(body: Text('List Screen')),
                      isDetail: false,
                    ),
                  );
                },
                child: const Text('Open List'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open List'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 150));

      expect(find.byType(SlideTransition), findsWidgets);
      expect(find.byType(FadeTransition), findsWidgets);

      await tester.pumpAndSettle();
      expect(find.text('List Screen'), findsOneWidget);
    });
  });
}
