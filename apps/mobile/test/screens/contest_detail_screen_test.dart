import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/providers/auth_provider.dart';
import 'package:flutter_application_2/core/providers/contest_detail_provider.dart';
import 'package:flutter_application_2/models/contest.dart';
import 'package:flutter_application_2/screens/contest/contest_detail_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

class FakeAuthNotifier extends AuthNotifier {
  FakeAuthNotifier(this._initialState);

  final AuthState _initialState;

  @override
  AuthState build() => _initialState;
}

void main() {
  const contestId = 'contest-test-123';

  Contest createContest({
    ContestStatus status = ContestStatus.open,
    DateTime? startAt,
    DateTime? endAt,
    String name = 'Cuộc thi Phim Thử Nghiệm',
  }) {
    return Contest(
      id: contestId,
      name: name,
      status: status,
      description: 'Mô tả chi tiết cuộc thi',
      startAt: startAt ?? DateTime.now().subtract(const Duration(days: 2)),
      endAt: endAt ?? DateTime.now().add(const Duration(days: 5)),
    );
  }

  Widget createTestWidget({
    required AuthState authState,
    required Contest contest,
    void Function(String route, Object? extra)? onNavigated,
  }) {
    final router = GoRouter(
      initialLocation: '/contests/$contestId',
      routes: [
        GoRoute(
          path: '/contests/:id',
          builder: (context, state) =>
              ContestDetailScreen(contestId: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) {
            onNavigated?.call('/login', state.extra);
            return const Scaffold(body: Text('Login Screen'));
          },
        ),
        GoRoute(
          path: '/contests/:id/submit',
          builder: (context, state) {
            onNavigated?.call(state.matchedLocation, state.extra);
            return const Scaffold(body: Text('Submit Screen'));
          },
        ),
      ],
    );

    return ProviderScope(
      overrides: [
        authProvider.overrideWith(() => FakeAuthNotifier(authState)),
        contestDetailProvider(contestId).overrideWith((ref) async => contest),
      ],
      child: MaterialApp.router(
        routerConfig: router,
      ),
    );
  }

  group('FPC-13: Contest Registration Flow Tests', () {
    testWidgets('1. Chưa đăng nhập: hiển thị SnackBar cảnh báo và điều hướng sang /login',
        (tester) async {
      String? navigatedRoute;

      final testWidget = createTestWidget(
        authState: const AuthState(isLoggedIn: false),
        contest: createContest(),
        onNavigated: (route, _) {
          navigatedRoute = route;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      // Nút "Đăng ký tham gia" hiển thị
      final registerButton = find.text('Đăng ký tham gia');
      expect(registerButton, findsOneWidget);

      await tester.tap(registerButton);
      await tester.pumpAndSettle();

      // Kiểm tra SnackBar yêu cầu đăng nhập
      expect(
        find.text('Vui lòng đăng nhập để đăng ký tham gia cuộc thi'),
        findsOneWidget,
      );

      // Kiểm tra điều hướng tới /login
      expect(navigatedRoute, '/login');
      expect(find.text('Login Screen'), findsOneWidget);

      // Không hiển thị SnackBar FPC-42
      expect(find.textContaining('FPC-42'), findsNothing);
    });

    testWidgets('2. Giám khảo (Judge): bị chặn theo BR-21, hiển thị thông báo lỗi',
        (tester) async {
      String? navigatedRoute;

      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: 'JUDGE',
          userId: 'judge-1',
        ),
        contest: createContest(),
        onNavigated: (route, extra) {
          navigatedRoute = route;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      // Thông báo BR-21 hiển thị
      expect(
        find.text(
          'Tài khoản vai trò JUDGE không được phép đăng ký tham gia cuộc thi (Quy định BR-21).',
        ),
        findsOneWidget,
      );

      // Không điều hướng sang submit
      expect(navigatedRoute, isNull);
    });

    testWidgets('3. Ban tổ chức (Organizer): bị chặn theo BR-21, hiển thị thông báo lỗi',
        (tester) async {
      String? navigatedRoute;

      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: 'ORGANIZER',
          userId: 'organizer-1',
        ),
        contest: createContest(),
        onNavigated: (route, extra) {
          navigatedRoute = route;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      expect(
        find.text(
          'Tài khoản vai trò ORGANIZER không được phép đăng ký tham gia cuộc thi (Quy định BR-21).',
        ),
        findsOneWidget,
      );
      expect(navigatedRoute, isNull);
    });

    testWidgets(
        '4. Thí sinh (Participant) + Cuộc thi mở: điều hướng đến /contests/:id/submit với title',
        (tester) async {
      String? navigatedRoute;
      Object? navigatedExtra;

      final contest = createContest(
        name: 'Khoảnh Khắc Phim 2026',
        status: ContestStatus.open,
      );

      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: 'PARTICIPANT',
          userId: 'user-123',
        ),
        contest: contest,
        onNavigated: (route, extra) {
          navigatedRoute = route;
          navigatedExtra = extra;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      expect(navigatedRoute, '/contests/$contestId/submit');
      expect(navigatedExtra, isA<Map<String, dynamic>>());
      final extraMap = navigatedExtra as Map<String, dynamic>;
      expect(extraMap['contestTitle'], 'Khoảnh Khắc Phim 2026');
      expect(find.text('Submit Screen'), findsOneWidget);
    });

    testWidgets('5. Thí sinh: Cuộc thi chưa mở (draft hoặc startAt ở tương lai) bị chặn',
        (tester) async {
      String? navigatedRoute;

      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: 'PARTICIPANT',
          userId: 'user-123',
        ),
        contest: createContest(
          status: ContestStatus.draft,
          startAt: DateTime.now().add(const Duration(days: 3)),
        ),
        onNavigated: (route, extra) {
          navigatedRoute = route;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      expect(find.text('Cuộc thi chưa mở cổng đăng ký.'), findsOneWidget);
      expect(navigatedRoute, isNull);
    });

    testWidgets('6. Thí sinh: Cuộc thi đã kết thúc/quá hạn theo BR-08 bị từ chối',
        (tester) async {
      String? navigatedRoute;

      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: 'PARTICIPANT',
          userId: 'user-123',
        ),
        contest: createContest(
          status: ContestStatus.completed,
          endAt: DateTime.now().subtract(const Duration(days: 1)),
        ),
        onNavigated: (route, extra) {
          navigatedRoute = route;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      expect(
        find.text('Cổng đăng ký cho cuộc thi này đã chính thức đóng (BR-08).'),
        findsOneWidget,
      );
      expect(navigatedRoute, isNull);
    });

    testWidgets('7. Xác nhận hoàn toàn không còn placeholder SnackBar FPC-42',
        (tester) async {
      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: 'PARTICIPANT',
        ),
        contest: createContest(),
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      expect(find.textContaining('FPC-42'), findsNothing);
    });

    testWidgets('8. Role null: chặn đăng ký và hiển thị thông báo lỗi',
        (tester) async {
      String? navigatedRoute;

      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: null,
          userId: 'user-null-role',
        ),
        contest: createContest(),
        onNavigated: (route, extra) {
          navigatedRoute = route;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      expect(
        find.text(
          'Không xác định được vai trò tài khoản. Vui lòng đăng nhập lại.',
        ),
        findsOneWidget,
      );
      expect(navigatedRoute, isNull);
    });

    testWidgets('9. Role rỗng: chặn đăng ký và hiển thị thông báo lỗi',
        (tester) async {
      String? navigatedRoute;

      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: '   ',
          userId: 'user-empty-role',
        ),
        contest: createContest(),
        onNavigated: (route, extra) {
          navigatedRoute = route;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      expect(
        find.text(
          'Không xác định được vai trò tài khoản. Vui lòng đăng nhập lại.',
        ),
        findsOneWidget,
      );
      expect(navigatedRoute, isNull);
    });

    testWidgets('10. Role không xác định / Admin: chặn đăng ký',
        (tester) async {
      String? navigatedRoute;

      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: 'ADMIN',
          userId: 'admin-1',
        ),
        contest: createContest(),
        onNavigated: (route, extra) {
          navigatedRoute = route;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      expect(
        find.text(
          'Chỉ tài khoản Thí sinh (Participant) mới được phép đăng ký tham gia cuộc thi.',
        ),
        findsOneWidget,
      );
      expect(navigatedRoute, isNull);
    });

    testWidgets('11. Cuộc thi ở trạng thái PUBLISHED: đóng cổng đăng ký theo BR-08/BR-16',
        (tester) async {
      String? navigatedRoute;

      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: 'PARTICIPANT',
          userId: 'user-123',
        ),
        contest: createContest(
          status: ContestStatus.published,
        ),
        onNavigated: (route, extra) {
          navigatedRoute = route;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      expect(
        find.text('Cổng đăng ký cho cuộc thi này đã chính thức đóng (BR-08).'),
        findsOneWidget,
      );
      expect(navigatedRoute, isNull);
    });

    testWidgets(
        '12. BR-08 Deadline: now < endAt (chưa tới hạn nộp) -> Thí sinh đăng ký thành công',
        (tester) async {
      String? navigatedRoute;
      Object? navigatedExtra;

      // Cuộc thi đang mở, endAt ở tương lai (now < endAt)
      final futureEndAt = DateTime.now().add(const Duration(hours: 3));
      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: 'PARTICIPANT',
          userId: 'user-valid-time',
        ),
        contest: createContest(
          status: ContestStatus.open,
          endAt: futureEndAt,
        ),
        onNavigated: (route, extra) {
          navigatedRoute = route;
          navigatedExtra = extra;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      expect(navigatedRoute, '/contests/$contestId/submit');
      expect(navigatedExtra, isNotNull);
      expect(find.text('Submit Screen'), findsOneWidget);
    });

    testWidgets(
        '13. BR-08 Deadline: now >= endAt (chạm hoặc quá hạn) -> Bị chặn đăng ký',
        (tester) async {
      String? navigatedRoute;

      // Cuộc thi có endAt đã chạm hoặc quá hạn
      final testWidget = createTestWidget(
        authState: const AuthState(
          isLoggedIn: true,
          role: 'PARTICIPANT',
          userId: 'user-deadline-reached',
        ),
        contest: createContest(
          status: ContestStatus.open,
          endAt: DateTime.now().subtract(const Duration(milliseconds: 10)),
        ),
        onNavigated: (route, extra) {
          navigatedRoute = route;
        },
      );

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đăng ký tham gia'));
      await tester.pumpAndSettle();

      expect(
        find.text('Cổng đăng ký cho cuộc thi này đã chính thức đóng (BR-08).'),
        findsOneWidget,
      );
      expect(navigatedRoute, isNull);
      expect(find.text('Submit Screen'), findsNothing);
    });

    test('14. BR-08 Boundary Logic: now == endAt -> !now.isBefore(endAt) đánh giá true (bị chặn)', () {
      final fixedMoment = DateTime(2026, 11, 3, 23, 0, 0);
      final exactDeadline = DateTime(2026, 11, 3, 23, 0, 0);
      final beforeDeadline = DateTime(2026, 11, 3, 22, 59, 59);
      final afterDeadline = DateTime(2026, 11, 3, 23, 0, 1);

      // now < endAt: không bị coi là hết hạn (isDeadlinePassed = false)
      final passedBefore = !beforeDeadline.isBefore(exactDeadline);
      expect(passedBefore, isFalse);

      // now == endAt: chính xác mốc deadline -> bị chặn (isDeadlinePassed = true) theo BR-08
      final passedAtMoment = !fixedMoment.isBefore(exactDeadline);
      expect(passedAtMoment, isTrue);

      // now > endAt: quá hạn -> bị chặn (isDeadlinePassed = true)
      final passedAfter = !afterDeadline.isBefore(exactDeadline);
      expect(passedAfter, isTrue);
    });
  });
}
