import 'package:flutter/material.dart';
import 'package:flutter_application_2/models/contest.dart';
import 'package:flutter_application_2/screens/contest/contest_card.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Widget buildTestWidget(Contest contest, {VoidCallback? onTap}) {
    return MaterialApp(
      home: Scaffold(
        body: ContestCard(
          contest: contest,
          onTap: onTap,
        ),
      ),
    );
  }

  group('ContestCard tests', () {
    testWidgets('renders contest with all dates provided', (tester) async {
      final contest = Contest(
        id: 'c1',
        name: 'Film Photo Awards',
        description: 'Annual analog photo competition',
        status: ContestStatus.open,
        startAt: DateTime(2026, 11, 1),
        endAt: DateTime(2026, 11, 30),
      );

      await tester.pumpWidget(buildTestWidget(contest));

      expect(find.text('Film Photo Awards'), findsOneWidget);
      expect(find.text('Annual analog photo competition'), findsOneWidget);
      expect(find.text(ContestStatus.open.label), findsOneWidget);
      expect(find.text('01/11/2026 - 30/11/2026'), findsOneWidget);
    });

    testWidgets('handles null dates safely without crash', (tester) async {
      final contest = Contest(
        id: 'c2',
        name: 'TBD Contest',
        description: null,
        status: ContestStatus.draft,
        startAt: null,
        endAt: null,
      );

      await tester.pumpWidget(buildTestWidget(contest));

      expect(find.text('TBD Contest'), findsOneWidget);
      expect(find.text('Chưa cập nhật'), findsOneWidget);
    });

    testWidgets('triggers onTap callback when tapped', (tester) async {
      var tapped = false;
      final contest = Contest(
        id: 'c3',
        name: 'Tappable Contest',
        status: ContestStatus.ongoing,
      );

      await tester.pumpWidget(buildTestWidget(contest, onTap: () => tapped = true));
      await tester.tap(find.text('Tappable Contest'));
      await tester.pump();

      expect(tapped, isTrue);
    });
  });
}
