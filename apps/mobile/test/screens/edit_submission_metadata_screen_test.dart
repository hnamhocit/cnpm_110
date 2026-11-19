import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:flutter_application_2/core/data/submission_repository.dart';
import 'package:flutter_application_2/core/network/api_exception.dart';
import 'package:flutter_application_2/models/film_dev_scan_params.dart';
import 'package:flutter_application_2/models/film_shooting_params.dart';
import 'package:flutter_application_2/screens/submission/edit_submission_metadata_screen.dart';

class FakeSubmissionMetadataRepository implements SubmissionMetadataRepository {
  bool shouldThrow = false;
  ApiException? exceptionToThrow;
  String? lastUpdatedSubmissionId;
  FilmShootingParams? lastShootingParams;
  FilmDevScanParams? lastDevScanParams;

  @override
  Future<Map<String, dynamic>> updateSubmissionMetadata({
    required String submissionId,
    required FilmShootingParams shootingParams,
    FilmDevScanParams? devScanParams,
  }) async {
    lastUpdatedSubmissionId = submissionId;
    lastShootingParams = shootingParams;
    lastDevScanParams = devScanParams;

    if (shouldThrow) {
      throw exceptionToThrow ??
          const ApiException(
            'Không tìm thấy endpoint cập nhật metadata trên máy chủ (HTTP 404)',
            statusCode: 404,
          );
    }

    return {'success': true, 'message': 'Metadata updated successfully'};
  }
}

void main() {
  late FakeSubmissionMetadataRepository fakeRepo;

  setUp(() {
    fakeRepo = FakeSubmissionMetadataRepository();
  });

  Widget buildTestWidget({
    String submissionId = 'SUB-2026-0089',
    FilmShootingParams? shootingParams,
    FilmDevScanParams? devScanParams,
    DateTime? deadline,
    String? submissionStatus,
    String? contestStatus,
    void Function(FilmShootingParams, FilmDevScanParams)? onSaved,
  }) {
    return ProviderScope(
      overrides: [
        submissionMetadataRepositoryProvider.overrideWithValue(fakeRepo),
      ],
      child: MaterialApp(
        home: EditSubmissionMetadataScreen(
          submissionId: submissionId,
          initialShootingParams: shootingParams ??
              const FilmShootingParams(
                cameraBody: 'Leica M6',
                lens: 'Summicron 35mm f/2',
                filmStock: 'Tri-X 400',
                filmBrand: 'Kodak',
                filmFormat: '35mm',
                isoRated: 400,
                isoShot: 400,
                frameNumber: '14',
                location: 'Phố cổ Hà Nội',
                rollId: 'ROLL-2026-001',
              ),
          initialDevScanParams: devScanParams ??
              const FilmDevScanParams(
                labName: 'Llab',
                scannerModel: 'Noritsu HS-1800',
                scanResolution: 'Độ phân giải cao (3000 x 4500 ~ 13.5MP)',
                devChemistry: 'C-41 (Âm bản màu)',
                scanFormat: 'JPEG (Chuẩn)',
                notes: 'Tráng tiêu chuẩn',
              ),
          submissionDeadline: deadline ??
              DateTime.now().add(const Duration(days: 3)),
          submissionStatus: submissionStatus ?? 'SUBMITTED',
          contestStatus: contestStatus ?? 'PUBLISHED',
          onSaved: onSaved,
        ),
      ),
    );
  }

  group('EditSubmissionMetadataScreen - Hiển thị & Khởi tạo', () {
    testWidgets('hiển thị đầy đủ thông số metadata ban đầu và mã bài thi', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      expect(find.text('Chỉnh sửa Metadata bài thi'), findsOneWidget);
      expect(find.text('Mã bài thi: SUB-2026-0089'), findsOneWidget);

      // Shooting section
      expect(find.text('Leica M6'), findsOneWidget);
      expect(find.text('Summicron 35mm f/2'), findsOneWidget);
      expect(find.text('Tri-X 400'), findsOneWidget);
      expect(find.text('Kodak'), findsOneWidget);
      expect(find.text('35mm'), findsOneWidget);
      expect(find.text('14'), findsOneWidget);
      expect(find.text('Phố cổ Hà Nội'), findsOneWidget);
      expect(find.text('ROLL-2026-001'), findsOneWidget);

      // Dev & scan section
      expect(find.text('Llab'), findsOneWidget);
      expect(find.text('Noritsu HS-1800'), findsOneWidget);
      expect(find.text('Tráng tiêu chuẩn'), findsOneWidget);

      // Buttons
      expect(find.text('Lưu thay đổi metadata'), findsOneWidget);
      expect(find.text('Đặt lại ban đầu'), findsOneWidget);
    });

    testWidgets('hiển thị badge push/pull khi ISO chụp khác ISO danh định', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      const pushedParams = FilmShootingParams(
        cameraBody: 'Nikon FM2',
        filmStock: 'HP5 Plus',
        filmBrand: 'Ilford',
        filmFormat: '35mm',
        isoRated: 400,
        isoShot: 1600,
        frameNumber: '10',
      );

      await tester.pumpWidget(buildTestWidget(shootingParams: pushedParams));
      await tester.pumpAndSettle();

      expect(find.text('Push ISO (400 -> 1600)'), findsOneWidget);
    });
  });

  group('EditSubmissionMetadataScreen - Validation BR-22 & BR-23', () {
    testWidgets('BR-22: báo lỗi khi bỏ trống các trường bắt buộc', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      // Clear camera body
      final cameraField = find.widgetWithText(
        TextFormField,
        'Thân máy ảnh (Camera Body) *',
      );
      await tester.enterText(cameraField, '');

      // Clear film stock
      final stockField = find.widgetWithText(
        TextFormField,
        'Tên cuộn phim (Film Stock) *',
      );
      await tester.enterText(stockField, '');

      // Clear frame number
      final frameField = find.widgetWithText(
        TextFormField,
        'Số Frame trên cuộn phim *',
      );
      await tester.enterText(frameField, '');

      // Tap Save
      await tester.tap(find.text('Lưu thay đổi metadata'));
      await tester.pumpAndSettle();

      expect(find.text('Thân máy ảnh không được để trống'), findsOneWidget);
      expect(find.text('Tên cuộn phim không được để trống'), findsOneWidget);
      expect(
        find.text('Số frame trên cuộn phim không được để trống'),
        findsOneWidget,
      );
      expect(fakeRepo.lastUpdatedSubmissionId, isNull);
    });

    testWidgets('BR-23: kiểm tra giới hạn frame vật lý theo khổ phim', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      // Format 35mm: max 39
      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      final frameField = find.widgetWithText(
        TextFormField,
        'Số Frame trên cuộn phim *',
      );
      await tester.enterText(frameField, '40');

      await tester.tap(find.text('Lưu thay đổi metadata'));
      await tester.pumpAndSettle();

      expect(find.text('Khổ 35mm tối đa 39 frame theo BR-23'), findsOneWidget);
      expect(fakeRepo.lastUpdatedSubmissionId, isNull);

      // Now enter valid 39 frame
      await tester.enterText(frameField, '39');
      await tester.tap(find.text('Lưu thay đổi metadata'));
      await tester.pumpAndSettle();

      expect(find.text('Khổ 35mm tối đa 39 frame theo BR-23'), findsNothing);
      expect(fakeRepo.lastUpdatedSubmissionId, 'SUB-2026-0089');
    });

    testWidgets('BR-23: kiểm tra giới hạn frame cho khổ 120 (6x6)', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      const params120 = FilmShootingParams(
        cameraBody: 'Hasselblad 500 C/M',
        filmStock: 'Portra 160',
        filmBrand: 'Kodak',
        filmFormat: '120 (6x6)',
        isoRated: 160,
        isoShot: 160,
        frameNumber: '13',
      );

      await tester.pumpWidget(buildTestWidget(shootingParams: params120));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Lưu thay đổi metadata'));
      await tester.pumpAndSettle();

      expect(
        find.text('Khổ 120 (6x6) tối đa 12 frame theo BR-23'),
        findsOneWidget,
      );
      expect(fakeRepo.lastUpdatedSubmissionId, isNull);
    });
  });

  group('EditSubmissionMetadataScreen - Quy tắc BR-24 (Modification Lock)', () {
    testWidgets('BR-24: khóa chỉnh sửa khi đã quá thời hạn nhận bài', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final expiredDeadline = DateTime.now().subtract(
        const Duration(hours: 2),
      );

      await tester.pumpWidget(buildTestWidget(deadline: expiredDeadline));
      await tester.pumpAndSettle();

      // Lock banner should be visible
      expect(
        find.text('Khóa chỉnh sửa do quá hạn (BR-24)'),
        findsOneWidget,
      );

      // Tap Save button (it should be disabled)
      await tester.tap(find.text('Lưu thay đổi metadata'));
      await tester.pumpAndSettle();

      expect(fakeRepo.lastUpdatedSubmissionId, isNull);
    });

    testWidgets('BR-24: khóa chỉnh sửa khi bài thi ở trạng thái JUDGING', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(buildTestWidget(submissionStatus: 'JUDGING'));
      await tester.pumpAndSettle();

      expect(
        find.text('Khóa chỉnh sửa do đang chấm (BR-24)'),
        findsOneWidget,
      );

      await tester.tap(find.text('Lưu thay đổi metadata'));
      await tester.pumpAndSettle();

      expect(fakeRepo.lastUpdatedSubmissionId, isNull);
    });

    testWidgets(
      'BR-24: khóa chỉnh sửa khi bài thi ở trạng thái APPROVED_FOR_JUDGING',
      (tester) async {
        tester.view.physicalSize = const Size(800, 2400);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() => tester.view.resetPhysicalSize());

        await tester.pumpWidget(
          buildTestWidget(submissionStatus: 'APPROVED_FOR_JUDGING'),
        );
        await tester.pumpAndSettle();

        expect(
          find.text('Khóa chỉnh sửa do đang chấm (BR-24)'),
          findsOneWidget,
        );

        await tester.tap(find.text('Lưu thay đổi metadata'));
        await tester.pumpAndSettle();

        expect(fakeRepo.lastUpdatedSubmissionId, isNull);
      },
    );
  });

  group('EditSubmissionMetadataScreen - Quy tắc BR-19 (Proof Requested)', () {
    testWidgets('BR-19: hiển thị thông báo phân biệt rõ khi PROOF_REQUESTED', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(
        buildTestWidget(submissionStatus: 'PROOF_REQUESTED'),
      );
      await tester.pumpAndSettle();

      expect(
        find.text('Yêu cầu bổ sung âm bản (PROOF_REQUESTED)'),
        findsOneWidget,
      );
      expect(
        find.textContaining('không thay thế việc nộp ảnh đối chứng âm bản'),
        findsOneWidget,
      );
    });
  });

  group('EditSubmissionMetadataScreen - Lưu & Xử lý lỗi API', () {
    testWidgets('lưu metadata thành công và hiển thị SnackBar thành công', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      bool onSavedCalled = false;

      await tester.pumpWidget(
        buildTestWidget(
          onSaved: (shooting, devScan) {
            onSavedCalled = true;
          },
        ),
      );
      await tester.pumpAndSettle();

      // Edit location
      final locationField = find.widgetWithText(
        TextFormField,
        'Địa điểm chụp ảnh',
      );
      await tester.enterText(locationField, 'Hồ Gươm Hà Nội');

      // Tap save
      await tester.tap(find.text('Lưu thay đổi metadata'));
      await tester.pumpAndSettle();

      expect(fakeRepo.lastUpdatedSubmissionId, 'SUB-2026-0089');
      expect(fakeRepo.lastShootingParams?.location, 'Hồ Gươm Hà Nội');
      expect(onSavedCalled, isTrue);
      expect(
        find.text('Cập nhật thông số metadata thành công!'),
        findsOneWidget,
      );
    });

    testWidgets(
      'xử lý lỗi API trung thực và KHÔNG làm mất dữ liệu người dùng đã nhập',
      (tester) async {
        tester.view.physicalSize = const Size(800, 2400);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() => tester.view.resetPhysicalSize());

        fakeRepo.shouldThrow = true;
        fakeRepo.exceptionToThrow = const ApiException(
          'Máy chủ chưa hỗ trợ cập nhật metadata (HTTP 404)',
          statusCode: 404,
        );

        await tester.pumpWidget(buildTestWidget());
        await tester.pumpAndSettle();

        // User enters custom info
        final locationField = find.widgetWithText(
          TextFormField,
          'Địa điểm chụp ảnh',
        );
        await tester.enterText(locationField, 'Cố đô Huế');

        // Tap save
        await tester.tap(find.text('Lưu thay đổi metadata'));
        await tester.pumpAndSettle();

        // Verify error message displayed
        expect(
          find.text('Máy chủ chưa hỗ trợ cập nhật metadata (HTTP 404)'),
          findsOneWidget,
        );

        // Verify user entered data is NOT lost!
        expect(find.text('Cố đô Huế'), findsOneWidget);
      },
    );

    testWidgets('nút đặt lại ban đầu khôi phục các giá trị ban đầu', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(buildTestWidget());
      await tester.pumpAndSettle();

      final locationField = find.widgetWithText(
        TextFormField,
        'Địa điểm chụp ảnh',
      );
      await tester.enterText(locationField, 'Nha Trang');
      await tester.pumpAndSettle();
      expect(find.text('Nha Trang'), findsOneWidget);

      // Tap Reset
      await tester.tap(find.text('Đặt lại ban đầu'));
      await tester.pumpAndSettle();

      // Original location restored
      expect(find.text('Phố cổ Hà Nội'), findsOneWidget);
    });
  });
}
