import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/components/custom_dropdown_field.dart';
import 'package:flutter_application_2/models/film_dev_scan_params.dart';
import 'package:flutter_application_2/screens/film_dev_scan/film_dev_scan_form.dart';
import 'package:flutter_application_2/screens/film_dev_scan/film_dev_scan_screen.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('FilmDevScanParams Model', () {
    test('creates model with all fields and converts to Map and API fields', () {
      final params = FilmDevScanParams(
        labName: 'Llab',
        scannerModel: 'Noritsu HS-1800',
        scanResolution: 'Độ phân giải cao (3000 x 4500 ~ 13.5MP)',
        devChemistry: 'C-41 (Âm bản màu)',
        scanFormat: 'JPEG (Chuẩn)',
        notes: 'Push 1 stop, scan viền film',
      );

      expect(params.labName, 'Llab');
      expect(params.scannerModel, 'Noritsu HS-1800');
      expect(params.scanResolution, 'Độ phân giải cao (3000 x 4500 ~ 13.5MP)');
      expect(params.devChemistry, 'C-41 (Âm bản màu)');
      expect(params.scanFormat, 'JPEG (Chuẩn)');
      expect(params.notes, 'Push 1 stop, scan viền film');

      final map = params.toMap();
      expect(map['labName'], 'Llab');
      expect(map['scannerModel'], 'Noritsu HS-1800');
      expect(map['scanResolution'], 'Độ phân giải cao (3000 x 4500 ~ 13.5MP)');

      final apiFields = params.toApiFormDataFields();
      expect(apiFields['devLabName'], 'Llab');
      expect(apiFields['scannerModel'], 'Noritsu HS-1800');
      expect(apiFields['scanResolution'], 'Độ phân giải cao (3000 x 4500 ~ 13.5MP)');
      expect(apiFields['devChemistry'], 'C-41 (Âm bản màu)');
    });

    test('reconstructs fromMap correctly', () {
      final map = {
        'labName': 'Croplab',
        'scannerModel': 'Fuji Frontier SP-3000',
        'scanResolution': 'Siêu cao (4000 x 6000 ~ 24MP)',
        'devChemistry': 'B&W (Đen trắng chuẩn D-76 / XTOL)',
        'notes': 'Quét mộc không chỉnh màu',
      };

      final params = FilmDevScanParams.fromMap(map);
      expect(params.labName, 'Croplab');
      expect(params.scannerModel, 'Fuji Frontier SP-3000');
      expect(params.scanResolution, 'Siêu cao (4000 x 6000 ~ 24MP)');
      expect(params.devChemistry, 'B&W (Đen trắng chuẩn D-76 / XTOL)');
      expect(params.notes, 'Quét mộc không chỉnh màu');
    });

    test('copyWith updates properties properly', () {
      const original = FilmDevScanParams(
        labName: 'Llab',
        scannerModel: 'Noritsu HS-1800',
        scanResolution: 'Tiêu chuẩn (2000 x 3000 ~ 6MP)',
      );

      final updated = original.copyWith(
        labName: 'Nadar Lab',
        scannerModel: 'Epson Perfection V850 Pro',
      );

      expect(updated.labName, 'Nadar Lab');
      expect(updated.scannerModel, 'Epson Perfection V850 Pro');
      expect(updated.scanResolution, 'Tiêu chuẩn (2000 x 3000 ~ 6MP)');
    });
  });

  group('FilmDevScanForm Widget', () {
    testWidgets('renders all essential fields for film dev and scan info', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmDevScanForm(onSubmit: (_) {}),
            ),
          ),
        ),
      );

      // Section titles
      expect(find.text('1. Thông tin Lab tráng phim *'), findsOneWidget);
      expect(find.text('2. Thiết bị scan (Scanner) *'), findsOneWidget);
      expect(find.text('3. Độ phân giải scan (Resolution) *'), findsOneWidget);

      // Buttons
      expect(find.text('Lưu thông tin tráng scan'), findsOneWidget);
      expect(find.text('Đặt lại form'), findsOneWidget);
    });

    testWidgets('submits default selected options successfully', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      FilmDevScanParams? submitted;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmDevScanForm(
                onSubmit: (p) => submitted = p,
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Lưu thông tin tráng scan'));
      await tester.pumpAndSettle();

      expect(submitted, isNotNull);
      expect(submitted!.labName, 'Llab');
      expect(submitted!.scannerModel, 'Noritsu HS-1800');
      expect(
        submitted!.scanResolution,
        'Độ phân giải cao (3000 x 4500 ~ 13.5MP)',
      );
    });

    testWidgets('allows entering custom lab name when selecting Khác', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      FilmDevScanParams? submitted;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmDevScanForm(
                onSubmit: (p) => submitted = p,
              ),
            ),
          ),
        ),
      );

      // Select "Khác (Nhập tên Lab)" from Lab dropdown
      await tester.tap(find.text('Llab'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Khác (Nhập tên Lab)').last);
      await tester.pumpAndSettle();

      // Custom input field should appear
      expect(find.text('Nhập tên Lab tráng *'), findsOneWidget);

      // Try submit without entering custom lab -> should show validation error
      await tester.tap(find.text('Lưu thông tin tráng scan'));
      await tester.pumpAndSettle();
      expect(find.text('Tên Lab tráng không được để trống'), findsOneWidget);

      // Enter custom lab name
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Nhập tên Lab tráng *'),
        'My Hometown Darkroom',
      );

      await tester.tap(find.text('Lưu thông tin tráng scan'));
      await tester.pumpAndSettle();

      expect(submitted, isNotNull);
      expect(submitted!.labName, 'My Hometown Darkroom');
    });

    testWidgets('allows entering custom scanner model when selecting Khác', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      FilmDevScanParams? submitted;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmDevScanForm(
                onSubmit: (p) => submitted = p,
              ),
            ),
          ),
        ),
      );

      // Select "Khác (Nhập thiết bị)" from Scanner dropdown
      await tester.tap(find.text('Noritsu HS-1800'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Khác (Nhập thiết bị)').last);
      await tester.pumpAndSettle();

      expect(find.text('Nhập tên thiết bị scan *'), findsOneWidget);

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Nhập tên thiết bị scan *'),
        'Sony A7IV Macro Scanner',
      );

      await tester.tap(find.text('Lưu thông tin tráng scan'));
      await tester.pumpAndSettle();

      expect(submitted, isNotNull);
      expect(submitted!.scannerModel, 'Sony A7IV Macro Scanner');
    });

    testWidgets('resets form when reset button is pressed', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      var resetCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmDevScanForm(
                onSubmit: (_) {},
                onReset: () => resetCalled = true,
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Đặt lại form'));
      await tester.pumpAndSettle();

      expect(resetCalled, isTrue);
    });
  });

  group('FilmDevScanScreen Widget', () {
    testWidgets('renders screen and shows summary modal on submit', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const MaterialApp(
          home: FilmDevScanScreen(),
        ),
      );

      expect(find.text('Thông tin tráng scan'), findsOneWidget);

      await tester.tap(find.text('Lưu thông tin tráng scan'));
      await tester.pumpAndSettle();

      // Summary bottom sheet should be visible
      expect(find.text('Thông tin tráng scan đã lưu'), findsOneWidget);
      expect(
        find.descendant(
          of: find.byType(DraggableScrollableSheet),
          matching: find.text('Llab'),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: find.byType(DraggableScrollableSheet),
          matching: find.text('Noritsu HS-1800'),
        ),
        findsOneWidget,
      );

      // Tap confirm button
      await tester.tap(find.text('Xác nhận & Hoàn tất'));
      await tester.pumpAndSettle();

      // Card on screen should reflect saved data
      expect(
        find.text(
          'Đã lưu: Llab | Noritsu HS-1800 (Độ phân giải cao (3000 x 4500 ~ 13.5MP))',
        ),
        findsOneWidget,
      );
    });
  });
}
