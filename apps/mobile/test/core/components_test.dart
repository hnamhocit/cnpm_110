import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_2/core/components/custom_button.dart';
import 'package:flutter_application_2/core/components/custom_input_field.dart';
import 'package:flutter_application_2/core/components/loading_dialog.dart';

void main() {
  group('CustomButton', () {
    testWidgets('renders label and calls onPressed', (tester) async {
      var pressed = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              label: 'Continue',
              onPressed: () => pressed = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Continue'));

      expect(pressed, isTrue);
    });

    testWidgets('shows progress and disables interaction while loading', (
      tester,
    ) async {
      var pressed = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CustomButton(
              label: 'Loading',
              onPressed: () => pressed = true,
              isLoading: true,
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester.tap(find.text('Loading'));
      expect(pressed, isFalse);
    });
  });

  group('CustomInputField', () {
    testWidgets('toggles password visibility', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: CustomInputField(isPassword: true)),
        ),
      );

      expect(
        tester.widget<TextField>(find.byType(TextField)).obscureText,
        isTrue,
      );
      await tester.tap(find.byTooltip('Show password'));
      await tester.pump();
      expect(
        tester.widget<TextField>(find.byType(TextField)).obscureText,
        isFalse,
      );
    });

    testWidgets('shows errorText', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: CustomInputField(errorText: 'Required field')),
        ),
      );

      expect(find.text('Required field'), findsOneWidget);
    });
  });

  testWidgets('LoadingDialog can be shown and hidden', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => Scaffold(
            body: TextButton(
              onPressed: () =>
                  LoadingDialog.show(context, message: 'Please wait'),
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Please wait'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    LoadingDialog.hide(tester.element(find.byType(Scaffold)));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Please wait'), findsNothing);
  });
}
