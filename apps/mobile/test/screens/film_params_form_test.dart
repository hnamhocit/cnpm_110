import 'package:flutter/material.dart';
import 'package:flutter_application_2/models/film_shooting_params.dart';
import 'package:flutter_application_2/screens/film_params/film_params_form.dart';
import 'package:flutter_application_2/screens/film_params/film_params_screen.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('FilmShootingParams Model', () {
    test('serializes to map and deserializes correctly', () {
      const params = FilmShootingParams(
        cameraBody: 'Canon AE-1',
        lens: 'FD 50mm f/1.4',
        filmStock: 'Portra 400',
        filmBrand: 'Kodak',
        filmFormat: '35mm',
        isoRated: 400,
        isoShot: 800,
        frameNumber: '12',
        rollId: 'ROLL-01',
        devLabName: 'Llab',
        devChemistry: 'C-41',
        scannerModel: 'Noritsu HS-1800',
        notes: 'Sunset shoot',
      );

      final map = params.toMap();
      expect(map['cameraBody'], 'Canon AE-1');
      expect(map['lens'], 'FD 50mm f/1.4');
      expect(map['filmStock'], 'Portra 400');
      expect(map['filmBrand'], 'Kodak');
      expect(map['filmFormat'], '35mm');
      expect(map['isoRated'], 400);
      expect(map['isoShot'], 800);
      expect(map['frameNumber'], '12');
      expect(params.isPushedOrPulled, isTrue);

      final reconstructed = FilmShootingParams.fromMap(map);
      expect(reconstructed.cameraBody, 'Canon AE-1');
      expect(reconstructed.isoShot, 800);
      expect(reconstructed.devChemistry, 'C-41');

      final apiFields = params.toApiFormDataFields();
      expect(apiFields['cameraBody'], 'Canon AE-1');
      expect(apiFields['filmBrand'], 'Kodak');
      expect(apiFields['filmStock'], 'Portra 400');
      expect(apiFields['isoRated'], '400');
      expect(apiFields['isoShot'], '800');
      expect(apiFields['frameNumber'], '12');
    });

    test('detects push/pull correctly', () {
      const normal = FilmShootingParams(
        cameraBody: 'Nikon FM2',
        filmStock: 'HP5 Plus',
        filmBrand: 'Ilford',
        filmFormat: '35mm',
        isoRated: 400,
        isoShot: 400,
      );
      expect(normal.isPushedOrPulled, isFalse);

      const pushed = FilmShootingParams(
        cameraBody: 'Nikon FM2',
        filmStock: 'HP5 Plus',
        filmBrand: 'Ilford',
        filmFormat: '35mm',
        isoRated: 400,
        isoShot: 1600,
      );
      expect(pushed.isPushedOrPulled, isTrue);
    });
  });

  group('FilmParamsForm Widget', () {
    testWidgets('renders all essential fields for FPC-43', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmParamsForm(onSubmit: (_) {}),
            ),
          ),
        ),
      );

      expect(find.text('Thân máy ảnh (Camera Body) *'), findsOneWidget);
      expect(find.text('Ống kính (Lens)'), findsOneWidget);
      expect(find.text('Tên cuộn phim (Film Stock) *'), findsOneWidget);
      expect(find.text('ISO hộp phim (Rated) *'), findsOneWidget);
      expect(find.text('Số Frame (Frame #)'), findsOneWidget);
      expect(find.text('Lưu thông số phim'), findsOneWidget);
      expect(find.text('Đặt lại form'), findsOneWidget);
    });

    testWidgets('shows validation errors when required fields are empty', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmParamsForm(onSubmit: (_) {}),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Lưu thông số phim'));
      await tester.pumpAndSettle();

      expect(find.text('Thân máy ảnh không được để trống'), findsOneWidget);
      expect(find.text('Tên dòng phim không được để trống'), findsOneWidget);
    });

    testWidgets('submits valid shooting parameters', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      FilmShootingParams? submitted;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmParamsForm(
                onSubmit: (params) => submitted = params,
              ),
            ),
          ),
        ),
      );

      // Enter Camera Body
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Thân máy ảnh (Camera Body) *'),
        'Olympus OM-1',
      );

      // Enter Lens
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Ống kính (Lens)'),
        'Zuiko 50mm f/1.8',
      );

      // Enter Film Stock
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Tên cuộn phim (Film Stock) *'),
        'Gold 200',
      );

      // Enter Frame Number
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Số Frame (Frame #)'),
        '24',
      );

      await tester.tap(find.text('Lưu thông số phim'));
      await tester.pumpAndSettle();

      expect(submitted, isNotNull);
      expect(submitted!.cameraBody, 'Olympus OM-1');
      expect(submitted!.lens, 'Zuiko 50mm f/1.8');
      expect(submitted!.filmStock, 'Gold 200');
      expect(submitted!.frameNumber, '24');
      expect(submitted!.filmBrand, 'Kodak');
      expect(submitted!.isoRated, 400);
      expect(submitted!.isoShot, 400);
    });

    testWidgets('toggles push/pull ISO input', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmParamsForm(onSubmit: (_) {}),
            ),
          ),
        ),
      );

      expect(find.text('ISO khi bấm chụp (Shot ISO) *'), findsNothing);

      // Turn off match rated ISO switch
      await tester.tap(find.byType(SwitchListTile));
      await tester.pumpAndSettle();

      expect(find.text('ISO khi bấm chụp (Shot ISO) *'), findsOneWidget);
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
              child: FilmParamsForm(
                onSubmit: (_) {},
                onReset: () => resetCalled = true,
              ),
            ),
          ),
        ),
      );

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Thân máy ảnh (Camera Body) *'),
        'Minolta X-700',
      );

      await tester.tap(find.text('Đặt lại form'));
      await tester.pumpAndSettle();

      expect(resetCalled, isTrue);
      final cameraField = tester.widget<TextFormField>(
        find.widgetWithText(TextFormField, 'Thân máy ảnh (Camera Body) *'),
      );
      expect(cameraField.controller?.text, isEmpty);
    });
  });

  group('FilmParamsScreen Widget', () {
    testWidgets('renders screen and shows summary modal on submit', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        const MaterialApp(
          home: FilmParamsScreen(),
        ),
      );

      expect(find.text('Thông số chụp phim'), findsOneWidget);

      await tester.enterText(
        find.widgetWithText(TextFormField, 'Thân máy ảnh (Camera Body) *'),
        'Leica M6',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Ống kính (Lens)'),
        'Summicron 35mm f/2',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Tên cuộn phim (Film Stock) *'),
        'Portra 400',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Số Frame (Frame #)'),
        '08',
      );

      await tester.tap(find.text('Lưu thông số phim'));
      await tester.pumpAndSettle();

      // Summary bottom sheet should appear
      expect(find.text('Thông số phim đã nhập'), findsOneWidget);
      expect(
        find.descendant(
          of: find.byType(DraggableScrollableSheet),
          matching: find.text('Leica M6'),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: find.byType(DraggableScrollableSheet),
          matching: find.text('Summicron 35mm f/2'),
        ),
        findsOneWidget,
      );
      expect(
        find.descendant(
          of: find.byType(DraggableScrollableSheet),
          matching: find.text('08'),
        ),
        findsOneWidget,
      );

      // Confirm summary
      await tester.tap(find.text('Xác nhận & Hoàn tất'));
      await tester.pumpAndSettle();

      expect(find.text('Đã lưu thông số: Leica M6 | Kodak Portra 400'), findsOneWidget);
    });
  });
}
