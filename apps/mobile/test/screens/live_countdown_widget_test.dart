import 'package:flutter/material.dart';
import 'package:flutter_application_2/screens/submission/components/live_countdown_widget.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('LiveCountdownWidget renders future deadline countdown correctly', (tester) async {
    final deadline = DateTime.now().add(const Duration(hours: 14, minutes: 30, seconds: 15));

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: LiveCountdownWidget(
            deadlineAt: deadline,
            prefixText: 'Còn lại: ',
          ),
        ),
      ),
    );

    // Initial render
    expect(find.byType(LiveCountdownWidget), findsOneWidget);
    expect(find.textContaining('Còn lại: 14:30:'), findsOneWidget);
    expect(find.byIcon(Icons.timer_outlined), findsOneWidget);
  });

  testWidgets('LiveCountdownWidget ticks every second', (tester) async {
    final deadline = DateTime.now().add(const Duration(seconds: 10));

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: LiveCountdownWidget(
            deadlineAt: deadline,
            prefixText: 'T: ',
          ),
        ),
      ),
    );

    expect(find.textContaining('T: 00:00:10'), findsOneWidget);

    // Advance 3 seconds
    await tester.pump(const Duration(seconds: 3));
    expect(find.textContaining('T: 00:00:07'), findsOneWidget);
  });

  testWidgets('LiveCountdownWidget shows urgent alarm icon when under 6 hours', (tester) async {
    final deadline = DateTime.now().add(const Duration(hours: 2, minutes: 15));

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: LiveCountdownWidget(
            deadlineAt: deadline,
          ),
        ),
      ),
    );

    expect(find.byIcon(Icons.alarm_on_rounded), findsOneWidget);
    expect(find.textContaining('02:15:'), findsOneWidget);
  });

  testWidgets('LiveCountdownWidget fires onExpired callback when timer reaches zero', (tester) async {
    final deadline = DateTime.now().add(const Duration(seconds: 1));
    var expiredCalled = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: LiveCountdownWidget(
            deadlineAt: deadline,
            onExpired: () => expiredCalled = true,
          ),
        ),
      ),
    );

    expect(expiredCalled, isFalse);
    // Advance 2 seconds
    await tester.pump(const Duration(seconds: 2));
    expect(expiredCalled, isTrue);
    expect(find.textContaining('(Hết hạn)'), findsOneWidget);
  });

  testWidgets('LiveCountdownWidget displays expired state when deadline is in the past', (tester) async {
    final pastDeadline = DateTime.now().subtract(const Duration(minutes: 10));

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: LiveCountdownWidget(
            deadlineAt: pastDeadline,
          ),
        ),
      ),
    );

    expect(find.textContaining('(Hết hạn)'), findsOneWidget);
  });
}

