import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_2/models/film_logbook.dart';
import 'package:flutter_application_2/models/master_data.dart';
import 'package:flutter_application_2/screens/film_dev_scan/film_dev_scan_form.dart';
import 'package:flutter_application_2/screens/film_params/film_params_form.dart';

void main() {
  group('M02 & M04 Mobile Models', () {
    test('parses MasterDataCatalog items from API JSON', () {
      final stock = FilmStockItem.fromJson({
        'id': 's1',
        'code': 'FILM-KODAK-PORTRA-400',
        'brand': 'Kodak',
        'name': 'Portra 400',
        'nominalIso': 400,
        'process': 'C-41',
        'supportedFormats': ['135', '120'],
      });
      expect(stock.displayName, 'Kodak Portra 400 (400)');
      expect(stock.supportedFormats, ['135', '120']);

      final cam = CameraItem.fromJson({
        'id': 'c1',
        'code': 'CAM-LEICA-M6',
        'brand': 'Leica',
        'model': 'M6 Classic',
        'cameraType': 'RANGEFINDER',
        'supportedFormat': '135',
      });
      expect(cam.displayName, 'Leica M6 Classic');

      final lab = FilmLabItem.fromJson({
        'id': 'l1',
        'code': 'LAB-VN-LLAB-SG',
        'name': 'LLab Saigon',
        'countryCode': 'VN',
        'city': 'Ho Chi Minh City',
        'supportedProcesses': ['C-41', 'B&W'],
        'scanners': ['NORITSU_HS1800'],
        'isVerifiedPartner': true,
      });
      expect(lab.isVerifiedPartner, true);
      expect(lab.displayName, 'LLab Saigon (Ho Chi Minh City)');
    });

    test('parses FilmRoll and FrameLog from API JSON', () {
      final roll = FilmRoll.fromJson({
        'id': 'r1',
        'rollCode': 'ROLL-2026-0001',
        'customFilmName': 'Kodak Portra 400',
        'format': '135',
        'isoRated': 400,
        'isoShot': 800,
        'pushPullEv': '+1 EV (Push 1 stop)',
        'devProcess': 'C-41',
        'loadDate': '2026-10-30',
        'status': 'SHOOTING',
        'loggedFramesCount': 1,
        'maxFrames': 39,
        'frames': [
          {
            'id': 'f1',
            'rollId': 'r1',
            'frameNumber': 15,
            'aperture': 'f/2.8',
            'shutterSpeed': '1/250s',
            'locationName': 'Da Lat',
          },
        ],
      });
      expect(roll.rollCode, 'ROLL-2026-0001');
      expect(roll.frames.length, 1);
      expect(roll.frames.first.frameNumber, 15);
    });
  });

  group('FPC-082 Master Data Form Integration', () {
    const catalog = MasterDataCatalog(
      filmStocks: [
        FilmStockItem(
          id: 's1',
          code: 'FILM-ILFORD-HP5-400',
          brand: 'Ilford',
          name: 'HP5 Plus',
          nominalIso: 400,
          process: 'B&W',
          supportedFormats: ['135'],
        ),
      ],
      cameras: [
        CameraItem(
          id: 'c1',
          code: 'CAM-NIKON-F3',
          brand: 'Nikon',
          model: 'F3 HP',
          cameraType: 'SLR',
          supportedFormat: '135',
        ),
      ],
      lenses: [
        LensItem(
          id: 'ln1',
          code: 'LENS-NIKON-50',
          brand: 'Nikon',
          model: 'Nikkor 50mm f/1.4',
          mountType: 'Nikon F',
          isPrime: true,
        ),
      ],
      filmLabs: [
        FilmLabItem(
          id: 'lb1',
          code: 'LAB-VN-CROPLAB',
          name: 'Croplab',
          countryCode: 'VN',
          city: 'Hanoi',
          supportedProcesses: ['C-41'],
          scanners: ['FUJI_FRONTIER_SP3000'],
          isVerifiedPartner: true,
        ),
      ],
    );

    testWidgets('FilmParamsForm renders Master Data chips and fills fields on tap', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmParamsForm(
                catalog: catalog,
                onSubmit: (_) {},
              ),
            ),
          ),
        ),
      );

      expect(find.text('Nikon F3 HP'), findsOneWidget);
      expect(find.text('Ilford HP5 Plus (400)'), findsOneWidget);

      await tester.tap(find.text('Nikon F3 HP'));
      await tester.pump();
      expect(find.text('Nikon F3 HP'), findsWidgets);
    });

    testWidgets('FilmDevScanForm renders FilmLab chips from catalog', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: FilmDevScanForm(
                catalog: catalog,
                onSubmit: (_) {},
              ),
            ),
          ),
        ),
      );

      expect(find.text('Croplab (Hanoi)'), findsOneWidget);
    });
  });
}
