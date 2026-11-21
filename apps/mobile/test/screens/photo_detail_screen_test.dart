import 'package:flutter/material.dart';
import 'package:flutter_application_2/models/contest_winner.dart';
import 'package:flutter_application_2/screens/contest/photo_detail_screen.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const sampleWinner = ContestWinner(
    submissionId: 'sub-test-detail',
    contestId: 'contest-test-id',
    contestName: 'Khoảnh Khắc Mùa Thu 2026',
    award: 'GOLD',
    awardRank: 1,
    awardTitle: 'Giải Nhất (Gold Award)',
    title: 'Sương Khói Ba Vì',
    authorName: 'Đỗ Hoàng Long',
    photoUrl: 'https://example.com/photo.jpg',
    filmStock: 'Kodak Portra 400',
    camera: 'Leica M6',
    lens: 'Summicron 35mm f/2',
    filmFormat: '135',
    developmentLab: 'LLab Saigon',
    finalScore: 9.85,
    juryCritique: 'Độ chuyển màu analog cực kỳ tinh tế và giàu cảm xúc.',
    isProofVerified: true,
    isResultsLocked: true,
  );

  Widget createTestWidget() {
    return MaterialApp(
      home: Builder(
        builder: (context) => Scaffold(
          body: ElevatedButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const PhotoDetailScreen(
                    winner: sampleWinner,
                    contestTitle: 'Khoảnh Khắc Mùa Thu 2026',
                  ),
                ),
              );
            },
            child: const Text('Open Photo Detail'),
          ),
        ),
      ),
    );
  }

  group('PhotoDetailScreen Widget Tests', () {
    testWidgets('renders PhotoDetailScreen with Hero, InteractiveViewer and metadata', (
      tester,
    ) async {
      tester.view.physicalSize = const Size(1080, 2400);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Photo Detail'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      // Check Hero with expected tag
      final heroFinder = find.byType(Hero);
      expect(heroFinder, findsOneWidget);
      final hero = tester.widget<Hero>(heroFinder);
      expect(hero.tag, 'winner_photo_sub-test-detail');

      // Check InteractiveViewer
      expect(find.byType(InteractiveViewer), findsOneWidget);

      // Check Title and Author
      expect(find.text('Sương Khói Ba Vì'), findsOneWidget);
      expect(find.text('Nhiếp ảnh gia: Đỗ Hoàng Long'), findsOneWidget);

      // Check Award Title & Score
      expect(find.text('Giải Nhất (Gold Award)'), findsOneWidget);
      expect(find.textContaining('9.85'), findsOneWidget);

      // Check Analog Metadata (BR-22)
      expect(find.text('Kodak Portra 400'), findsOneWidget);
      expect(find.text('Leica M6'), findsOneWidget);
      expect(find.text('Summicron 35mm f/2'), findsOneWidget);
      expect(find.text('Khổ 135'), findsOneWidget);
      expect(find.text('LLab Saigon'), findsOneWidget);

      // Check BR-17 Watermark & BR-16 lock
      expect(find.text('FPC Exhibition Archive (BR-17)'), findsOneWidget);
      expect(find.text('BR-16 Locked'), findsOneWidget);

      // Check Jury Critique
      expect(find.textContaining('Độ chuyển màu analog'), findsOneWidget);
    });

    testWidgets('double tap zooms the photo in and out', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Photo Detail'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      final viewer = find.byType(InteractiveViewer);
      expect(viewer, findsOneWidget);

      // Double tap to zoom
      await tester.tap(viewer, warnIfMissed: false);
      await tester.pump(const Duration(milliseconds: 50));
      await tester.tap(viewer, warnIfMissed: false);
      await tester.pump(const Duration(milliseconds: 300));

      // Tapping toggles overlay visibility
      await tester.tap(viewer, warnIfMissed: false);
      await tester.pump(const Duration(milliseconds: 300));
    });

    testWidgets('back button navigates back to previous screen', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      addTearDown(() => tester.view.resetPhysicalSize());

      await tester.pumpWidget(createTestWidget());
      await tester.tap(find.text('Open Photo Detail'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      final backButton = find.byTooltip('Quay lại');
      expect(backButton, findsOneWidget);
      await tester.tap(backButton);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));

      expect(find.text('Open Photo Detail'), findsOneWidget);
    });
  });
}
