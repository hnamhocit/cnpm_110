import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/network/api_client.dart';
import 'package:flutter_application_2/core/network/auth_token_storage.dart';
import 'package:flutter_application_2/core/providers/api_client_provider.dart';
import 'package:flutter_application_2/core/providers/auth_provider.dart';
import 'package:flutter_application_2/core/providers/portfolio_provider.dart';
import 'package:flutter_application_2/models/user_portfolio.dart';
import 'package:flutter_application_2/screens/profile_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeTokenStorage implements AuthTokenStorage {
  @override
  Future<void> clearTokens() async {}

  @override
  Future<String?> readAccessToken() async => 'test-token';

  @override
  Future<String?> readRefreshToken() async => 'test-refresh-token';

  @override
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {}
}

class FakeAuthNotifier extends AuthNotifier {
  FakeAuthNotifier(this._initialState);
  final AuthState _initialState;

  @override
  AuthState build() => _initialState;
}

void main() {
  const testUser = AuthState(
    isLoggedIn: true,
    userId: 'user-001',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@filmcontest.vn',
    role: 'PARTICIPANT',
  );

  final samplePortfolio = UserPortfolio(
    id: 'user-001',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@filmcontest.vn',
    role: 'PARTICIPANT',
    stats: const PortfolioStats(
      totalSubmissions: 15,
      approvedWorks: 12,
      awardsCount: 2,
    ),
    awards: [
      const UserAward(
        id: 'award-01',
        contestId: 'contest-01',
        contestName: 'Cuộc Thi Ảnh Analog 2026',
        award: 'FIRST_PRIZE',
        submissionId: 'sub-01',
        submissionTitle: 'Bình Minh Sớm Trên Đồi Cù',
        photoUrl: 'https://images.unsplash.com/photo-test-gold.jpg',
        finalScore: 94.75,
        awardRank: 1,
        awardTitle: 'Giải Nhất (Gold Award)',
        juryCritique: 'Ánh sáng và độ hạt film Kodak Portra 400 được thể hiện xuất sắc.',
        filmStock: 'Kodak Portra 400',
        camera: 'Leica M6',
        filmFormat: '135',
        developmentLab: 'Llab Saigon',
      ),
      const UserAward(
        id: 'award-02',
        contestId: 'contest-02',
        contestName: 'Khoảnh Khắc Đen Trắng Việt Nam',
        award: 'SECOND_PRIZE',
        submissionId: 'sub-02',
        submissionTitle: 'Gánh Hàng Rong Phố Cổ',
        photoUrl: 'https://images.unsplash.com/photo-test-silver.jpg',
        finalScore: 89.20,
        awardRank: 2,
        awardTitle: 'Giải Nhì (Silver Award)',
        juryCritique: 'Độ tương phản đen trắng của Ilford HP5+ đầy cảm xúc.',
        filmStock: 'Ilford HP5 Plus 400',
        camera: 'Hasselblad 500 C/M',
        filmFormat: '120',
        developmentLab: 'Croplab Hanoi',
      ),
    ],
    curatedWorks: const [],
  );

  Widget createPortfolioTestWidget({
    required Widget child,
    UserPortfolio? portfolio,
    bool isLoading = false,
  }) {
    final client = ApiClient(
      baseUrl: 'http://localhost:8080',
      tokenStorage: FakeTokenStorage(),
      onUnauthenticated: () async {},
    );

    return ProviderScope(
      overrides: [
        authProvider.overrideWith(() => FakeAuthNotifier(testUser)),
        apiClientProvider.overrideWithValue(client),
        userPortfolioProvider.overrideWith((ref) async {
          if (isLoading) {
            await Future<void>.delayed(const Duration(seconds: 10));
          }
          return portfolio ?? samplePortfolio;
        }),
      ],
      child: MaterialApp(
        home: Scaffold(body: child),
      ),
    );
  }

  group('FPC-101: Portfolio Cá Nhân & Lịch Sử Giải Thưởng Tests', () {
    testWidgets('1. Hiển thị thông số Portfolio: Giải thưởng, Tác phẩm, Hợp lệ',
        (tester) async {
      await tester.pumpWidget(
        createPortfolioTestWidget(child: const ProfileScreen()),
      );
      await tester.pumpAndSettle();

      // Kiểm tra các số liệu thống kê
      expect(find.text('2'), findsOneWidget); // 2 giải thưởng
      expect(find.text('15'), findsOneWidget); // 15 bài thi
      expect(find.text('12'), findsOneWidget); // 12 tác phẩm hợp lệ
      expect(find.text('🏆 Giải thưởng'), findsOneWidget);
      expect(find.text('📸 Tác phẩm'), findsOneWidget);
      expect(find.text('✨ Hợp lệ'), findsOneWidget);
    });

    testWidgets('2. Hiển thị danh sách giải thưởng với thẻ vinh danh và thông số analog',
        (tester) async {
      await tester.pumpWidget(
        createPortfolioTestWidget(child: const ProfileScreen()),
      );
      await tester.pumpAndSettle();

      // Cuộn để thấy tủ giải thưởng
      await tester.scrollUntilVisible(
        find.text('Lịch Sử Giải Thưởng Đã Đạt'),
        100.0,
      );

      expect(find.text('Lịch Sử Giải Thưởng Đã Đạt'), findsOneWidget);
      expect(find.text('Giải Nhất (Gold Award)'), findsOneWidget);
      expect(find.text('Bình Minh Sớm Trên Đồi Cù'), findsOneWidget);
      expect(find.text('⭐ 94.75'), findsOneWidget);
      expect(find.text('Kodak Portra 400'), findsOneWidget);
      expect(find.text('Leica M6'), findsOneWidget);

      expect(find.text('Giải Nhì (Silver Award)'), findsOneWidget);
      expect(find.text('Gánh Hàng Rong Phố Cổ'), findsOneWidget);
      expect(find.text('⭐ 89.20'), findsOneWidget);
      expect(find.text('Ilford HP5 Plus 400'), findsOneWidget);
      expect(find.text('Hasselblad 500 C/M'), findsOneWidget);
    });

    testWidgets('3. Nhấn vào giải thưởng mở Lightbox toàn màn hình xem ảnh & nhận xét BGK',
        (tester) async {
      await tester.pumpWidget(
        createPortfolioTestWidget(child: const ProfileScreen()),
      );
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(
        find.text('Bình Minh Sớm Trên Đồi Cù'),
        200.0,
      );
      await tester.ensureVisible(find.text('Bình Minh Sớm Trên Đồi Cù'));
      await tester.pumpAndSettle();

      // Nhấn vào thẻ giải thưởng
      await tester.tap(find.text('Bình Minh Sớm Trên Đồi Cù'));
      await tester.pumpAndSettle();

      // Kiểm tra dialog Lightbox hiển thị
      expect(find.byType(Dialog), findsOneWidget);
      expect(
        find.textContaining('Ánh sáng và độ hạt film Kodak Portra 400 được thể hiện xuất sắc.'),
        findsOneWidget,
      );
      expect(find.text('Khổ 135'), findsOneWidget);
      expect(find.text('Llab Saigon'), findsOneWidget);

      // Đóng lightbox
      await tester.tap(find.byTooltip('Đóng'));
      await tester.pumpAndSettle();

      expect(find.byType(Dialog), findsNothing);
    });

    testWidgets('4. Hiển thị thông báo trống khi nhiếp ảnh gia chưa có giải thưởng',
        (tester) async {
      final emptyPortfolio = UserPortfolio(
        id: 'user-001',
        fullName: 'Lê Hoàng Nam',
        email: 'nam.le@filmcontest.vn',
        role: 'PARTICIPANT',
        stats: const PortfolioStats(
          totalSubmissions: 3,
          approvedWorks: 2,
          awardsCount: 0,
        ),
        awards: const [],
        curatedWorks: const [],
      );

      await tester.pumpWidget(
        createPortfolioTestWidget(
          child: const ProfileScreen(),
          portfolio: emptyPortfolio,
        ),
      );
      await tester.pumpAndSettle();

      await tester.scrollUntilVisible(
        find.text('Chưa có giải thưởng chính thức'),
        100.0,
      );

      expect(find.text('Chưa có giải thưởng chính thức'), findsOneWidget);
      expect(
        find.textContaining('Các giải thưởng từ cuộc thi đã công bố (PUBLISHED) sẽ tự động được lưu trữ'),
        findsOneWidget,
      );
    });
  });
}
