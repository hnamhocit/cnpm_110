import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:flutter_application_2/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: MainApp()));
    expect(find.byType(MainApp), findsOneWidget);

    // Allow splash screen delay to elapse and route transition to settle
    await tester.pump(const Duration(seconds: 2));
    await tester.pumpAndSettle();
  });
}
