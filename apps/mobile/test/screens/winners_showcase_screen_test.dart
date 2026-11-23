import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/data/contest_repository.dart';
import 'package:flutter_application_2/core/providers/contest_provider.dart';
import 'package:flutter_application_2/models/contest.dart';
import 'package:flutter_application_2/models/contest_winner.dart';
import 'package:flutter_application_2/screens/contest/contest_detail_screen.dart';
import 'package:flutter_application_2/screens/contest/winners_showcase_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

class MockContestRepository implements ContestRepository {
  MockContestRepository({
    this.results,
    this.shouldThrow = false,
    this.errorMessage = 'Lỗi kết nối máy chủ',
    this.contest,
  });

  final ContestResults? results;
  final bool shouldThrow;
  final String errorMessage;
  final Contest? contest;

  @override
  Future<ContestPage> fetchContests({
    ContestStatus? status,
    int page = 1,
    int limit = 10,
  }) async {
    return ContestPage(items: [], page: 1, totalPages: 1);
  }

  @override
  Future<Contest> fetchContest(String id) async {
    if (contest != null) return contest!;
    return Contest(
      id: id,
      name: 'Cuộc thi Mẫu',
      status: ContestStatus.published,
    );
  }

  @override
  Future<ContestResults> fetchContestResults(String contestId) async {
    if (shouldThrow) {
      throw Exception(errorMessage);
    }
    if (results != null) {
      return results!;
    }
    throw Exception('Không có dữ liệu');
  }
}

void main() {
  const testContestId = 'contest-fpc-100';

  final sampleWinners = [
    const ContestWinner(
      submissionId: 'sub-gold',
      contestId: testContestId,
      contestName: 'Nhiếp ảnh Phim Mùa Thu 2026',
      award: 'GOLD',
      awardRank: 1,
      awardTitle: 'Giải Nhất (Gold Award)',
      title: 'Sương Sớm Ba Vì',
      authorName: 'Đỗ Hoàng Long',
      photoUrl: 'https://example.com/gold.jpg',
      filmStock: 'Kodak Portra 400',
      camera: 'Leica M6',
      lens: 'Summicron 35mm f/2',
      filmFormat: '135',
      developmentLab: 'LLab Saigon',
      finalScore: 9.75,
      juryCritique: 'Độ chuyển màu và tương phản analog hoàn hảo.',
      isProofVerified: true,
      isResultsLocked: true,
    ),
    const ContestWinner(
      submissionId: 'sub-silver',
      contestId: testContestId,
      contestName: 'Nhiếp ảnh Phim Mùa Thu 2026',
      award: 'SILVER',
      awardRank: 2,
      awardTitle: 'Giải Nhì (Silver Award)',
      title: 'Hoàng Hôn Phố Cổ',
      authorName: 'Trần Minh Anh',
      photoUrl: 'https://example.com/silver.jpg',
      filmStock: 'Fujifilm Pro 400H',
      camera: 'Contax G2',
      lens: 'Planar 45mm f/2',
      filmFormat: '135',
      developmentLab: 'Croplab Hà Nội',
      finalScore: 9.42,
      juryCritique: 'Tông màu xanh ngọc đặc trưng rất nghệ thuật.',
      isProofVerified: true,
      isResultsLocked: true,
    ),
    const ContestWinner(
      submissionId: 'sub-bronze',
      contestId: testContestId,
      contestName: 'Nhiếp ảnh Phim Mùa Thu 2026',
      award: 'BRONZE',
      awardRank: 3,
      awardTitle: 'Giải Ba (Bronze Award)',
      title: 'Người Lái Đò',
      authorName: 'Lê Quốc Bảo',
      photoUrl: 'https://example.com/bronze.jpg',
      filmStock: 'Ilford HP5 Plus',
      camera: 'Hasselblad 500C/M',
      lens: 'Planar 80mm f/2.8',
      filmFormat: '120_66',
      developmentLab: 'Zone5 Film Lab',
      finalScore: 9.18,
      juryCritique: 'Nổi khối đen trắng xuất sắc trên khổ phim 6x6.',
      isProofVerified: true,
      isResultsLocked: true,
    ),
    const ContestWinner(
      submissionId: 'sub-hm',
      contestId: testContestId,
      contestName: 'Nhiếp ảnh Phim Mùa Thu 2026',
      award: 'HONORABLE_MENTION',
      awardRank: 4,
      awardTitle: 'Giải Khuyến Khích',
      title: 'Vết Thời Gian',
      authorName: 'Nguyễn Thu Hà',
      photoUrl: 'https://example.com/hm.jpg',
      filmStock: 'Kodak Tri-X 400',
      camera: 'Nikon FM2',
      lens: '50mm f/1.4',
      filmFormat: '135',
      developmentLab: 'Darkroom Saigon',
      finalScore: 8.85,
      juryCritique: 'Chất ảnh mộc mạc và chân thực.',
      isProofVerified: true,
      isResultsLocked: true,
    ),
  ];

  final sampleResults = ContestResults(
    contestId: testContestId,
    contestName: 'Nhiếp ảnh Phim Mùa Thu 2026',
    status: 'published',
    resultsLocked: true,
    winners: sampleWinners,
  );

  Widget createShowcaseWidget({
    required ContestRepository repo,
  }) {
    return ProviderScope(
      overrides: [
        contestRepositoryProvider.overrideWithValue(repo),
      ],
      child: const MaterialApp(
        home: WinnersShowcaseScreen(
          contestId: testContestId,
          contestTitle: 'Nhiếp ảnh Phim Mùa Thu 2026',
        ),
      ),
    );
  }

  group('WinnersShowcaseScreen Widget Tests (FPC-100)', () {
    testWidgets('renders error state with retry button on failure', (tester) async {
      final repo = MockContestRepository(
        shouldThrow: true,
        errorMessage: 'Cuộc thi chưa công bố kết quả chính thức',
      );

      await tester.pumpWidget(createShowcaseWidget(repo: repo));
      await tester.pump();
      await tester.pump();

      expect(find.text('Chưa thể tải kết quả vinh danh'), findsOneWidget);
      expect(find.textContaining('Cuộc thi chưa công bố kết quả chính thức'), findsOneWidget);
      expect(find.text('Thử lại'), findsOneWidget);
    });

    testWidgets('renders empty state when contest has no winners', (tester) async {
      final emptyResults = ContestResults(
        contestId: testContestId,
        contestName: 'Cuộc thi Trống',
        status: 'published',
        resultsLocked: true,
        winners: [],
      );
      final repo = MockContestRepository(results: emptyResults);

      await tester.pumpWidget(createShowcaseWidget(repo: repo));
      await tester.pump();

      expect(find.text('Chưa có danh sách đạt giải'), findsOneWidget);
      expect(find.textContaining('đang trong quá trình thẩm định'), findsOneWidget);
    });

    testWidgets('renders full Winners Showcase with Podium and details', (tester) async {
      tester.view.physicalSize = const Size(800, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final repo = MockContestRepository(results: sampleResults);

      await tester.pumpWidget(createShowcaseWidget(repo: repo));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // App bar & Header Banner
      expect(find.text('Bảng Vàng Vinh Danh'), findsWidgets);
      expect(find.textContaining('NHIẾP ẢNH PHIM MÙA THU 2026'), findsOneWidget);
      expect(find.text('BR-16: Kết quả chính thức đã khóa (Read-Only)'), findsOneWidget);

      // Top 3 Podium
      expect(find.text('TOP 3 KIỆT TÁC DẪN ĐẦU'), findsOneWidget);
      expect(find.text('#1'), findsOneWidget);
      expect(find.text('#2'), findsOneWidget);
      expect(find.text('#3'), findsOneWidget);

      // Section title
      expect(find.text('Danh Sách Tác Phẩm Đạt Giải (4)'), findsOneWidget);

      // Winners Card details
      expect(find.text('Sương Sớm Ba Vì'), findsWidgets);
      expect(find.text('Tác giả: Đỗ Hoàng Long'), findsWidgets);
      expect(find.text('Giải Nhất (Gold Award)'), findsWidgets);
      expect(find.text('9.75 / 10'), findsWidgets);

      // Analog specs chips (BR-22)
      expect(find.text('Kodak Portra 400'), findsWidgets);
      expect(find.text('Leica M6'), findsWidgets);
      expect(find.text('Summicron 35mm f/2'), findsWidgets);

      // Verification badges (BR-06 & BR-16)
      expect(find.text('Bằng chứng âm bản đã xác minh (BR-06)'), findsWidgets);
      expect(find.text('Đã khóa (BR-16)'), findsWidgets);

      // Jury critique
      expect(find.textContaining('Độ chuyển màu và tương phản analog hoàn hảo.'), findsOneWidget);
    });

    testWidgets('tapping Info icon in AppBar opens rules bottom sheet', (tester) async {
      final repo = MockContestRepository(results: sampleResults);

      await tester.pumpWidget(createShowcaseWidget(repo: repo));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      final infoButton = find.byIcon(Icons.info_outline);
      expect(infoButton, findsOneWidget);
      await tester.tap(infoButton);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Quy định Bảng vàng Vinh danh'), findsOneWidget);
      expect(find.textContaining('Result Immutability'), findsOneWidget);
      expect(find.textContaining('Negative Proof'), findsOneWidget);

      // Close bottom sheet
      await tester.tap(find.text('Đã hiểu'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Quy định Bảng vàng Vinh danh'), findsNothing);
    });

    testWidgets('ContestDetailScreen displays Winners Showcase banner & button for published contest', (tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(() => tester.view.resetPhysicalSize());

      final publishedContest = Contest(
        id: testContestId,
        name: 'Cuộc thi Đã Công Bố 2026',
        status: ContestStatus.published,
        description: 'Mô tả cuộc thi đã công bố',
      );

      final router = GoRouter(
        initialLocation: '/contests/$testContestId',
        routes: [
          GoRoute(
            path: '/contests/:id',
            builder: (context, state) =>
                ContestDetailScreen(contestId: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/contests/:id/winners',
            builder: (context, state) =>
                const Scaffold(body: Text('Winners Showcase Screen Target')),
          ),
        ],
      );

      final repo = MockContestRepository(
        contest: publishedContest,
        results: sampleResults,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            contestRepositoryProvider.overrideWithValue(repo),
          ],
          child: MaterialApp.router(
            routerConfig: router,
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Banner should be visible in detail screen
      expect(find.text('BẢNG VÀNG VINH DANH'), findsOneWidget);
      expect(find.text('Xem Bảng Vàng Vinh Danh'), findsOneWidget);

      // Tap on bottom button to navigate to winners showcase
      await tester.tap(find.text('Xem Bảng Vàng Vinh Danh'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Winners Showcase Screen Target'), findsOneWidget);
    });
  });
}
