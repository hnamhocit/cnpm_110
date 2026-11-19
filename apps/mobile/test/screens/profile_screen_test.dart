import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application_2/core/components/custom_button.dart';
import 'package:flutter_application_2/core/network/api_client.dart';
import 'package:flutter_application_2/core/network/auth_token_storage.dart';
import 'package:flutter_application_2/core/providers/api_client_provider.dart';
import 'package:flutter_application_2/core/providers/auth_provider.dart';
import 'package:flutter_application_2/screens/profile/change_password_screen.dart';
import 'package:flutter_application_2/screens/profile/edit_profile_screen.dart';
import 'package:flutter_application_2/screens/profile_screen.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeAuthNotifier extends AuthNotifier {
  FakeAuthNotifier(this._initialState);

  final AuthState _initialState;

  @override
  AuthState build() => _initialState;
}

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

class MockAdapter implements HttpClientAdapter {
  MockAdapter(this.handler);

  final Future<ResponseBody> Function(RequestOptions options) handler;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return handler(options);
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  const testUser = AuthState(
    isLoggedIn: true,
    userId: 'user-001',
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@filmcontest.vn',
    role: 'PARTICIPANT',
  );

  Widget createTestWidget({
    required Widget child,
    AuthState authState = testUser,
    HttpClientAdapter? adapter,
    bool pushAsRoute = false,
  }) {
    final client = ApiClient(
      baseUrl: 'http://localhost:8080',
      tokenStorage: FakeTokenStorage(),
      onUnauthenticated: () async {},
    );
    if (adapter != null) {
      client.dio.httpClientAdapter = adapter;
    }

    return ProviderScope(
      overrides: [
        authProvider.overrideWith(() => FakeAuthNotifier(authState)),
        apiClientProvider.overrideWithValue(client),
      ],
      child: MaterialApp(
        home: pushAsRoute
            ? Scaffold(
                body: Builder(
                  builder: (context) => Center(
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(builder: (_) => child),
                      ),
                      child: const Text('Open Page'),
                    ),
                  ),
                ),
              )
            : Scaffold(body: child),
      ),
    );
  }

  group('FPC-15: ProfileScreen Tests', () {
    testWidgets('1. Hiển thị thông tin người dùng từ authProvider (không hardcode)',
        (tester) async {
      await tester.pumpWidget(
        createTestWidget(child: const ProfileScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Lê Hoàng Nam'), findsOneWidget);
      expect(find.text('nam.le@filmcontest.vn'), findsOneWidget);
      expect(find.text('PARTICIPANT'), findsOneWidget);
      expect(find.text('L'), findsOneWidget); // Avatar letter

      // Xác nhận không còn tên hardcode cũ
      expect(find.text('Nguyễn Văn A'), findsNothing);
      expect(find.text('user@example.com'), findsNothing);
    });

    testWidgets('2. Nhấn "Cập nhật thông tin" điều hướng sang EditProfileScreen',
        (tester) async {
      await tester.pumpWidget(
        createTestWidget(child: const ProfileScreen()),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Cập nhật thông tin'));
      await tester.pumpAndSettle();

      expect(find.byType(EditProfileScreen), findsOneWidget);
      expect(find.text('Thông tin tài khoản'), findsOneWidget);
    });

    testWidgets('3. Nhấn "Đổi mật khẩu" điều hướng sang ChangePasswordScreen',
        (tester) async {
      await tester.pumpWidget(
        createTestWidget(child: const ProfileScreen()),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Đổi mật khẩu'));
      await tester.pumpAndSettle();

      expect(find.byType(ChangePasswordScreen), findsOneWidget);
      expect(find.text('Thiết lập mật khẩu mới'), findsOneWidget);
    });

    testWidgets('4. Nhấn "Cài đặt ứng dụng" mở dialog thông tin, không dùng SnackBar demo',
        (tester) async {
      await tester.pumpWidget(
        createTestWidget(child: const ProfileScreen()),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Cài đặt ứng dụng'));
      await tester.pumpAndSettle();

      expect(find.text('Phiên bản: 1.0.0 (Build 2026)'), findsOneWidget);
      expect(find.textContaining('(bản demo)'), findsNothing);

      // Đóng dialog
      await tester.tap(find.text('Đóng'));
      await tester.pumpAndSettle();
    });

    testWidgets('5. Nhấn "Trợ giúp" mở dialog hỗ trợ, không dùng SnackBar demo',
        (tester) async {
      await tester.pumpWidget(
        createTestWidget(child: const ProfileScreen()),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Trợ giúp'));
      await tester.pumpAndSettle();

      expect(find.textContaining('support@filmcontest.vn'), findsOneWidget);
      expect(find.textContaining('(bản demo)'), findsNothing);

      await tester.tap(find.text('Đóng'));
      await tester.pumpAndSettle();
    });
  });

  group('FPC-15: EditProfileScreen Tests', () {
    testWidgets('6. Hiển thị thông tin ban đầu và kiểm tra validation họ tên',
        (tester) async {
      await tester.pumpWidget(
        createTestWidget(child: const EditProfileScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('Lê Hoàng Nam'), findsOneWidget);
      expect(find.text('nam.le@filmcontest.vn'), findsOneWidget);

      // Xóa họ tên và bấm Lưu
      await tester.enterText(find.byType(TextFormField).first, '');
      await tester.tap(find.text('Lưu thay đổi'));
      await tester.pumpAndSettle();

      expect(find.text('Họ và tên không được để trống'), findsOneWidget);

      // Nhập tên quá ngắn (< 2 ký tự)
      await tester.enterText(find.byType(TextFormField).first, 'A');
      await tester.tap(find.text('Lưu thay đổi'));
      await tester.pumpAndSettle();

      expect(find.text('Họ và tên phải có ít nhất 2 ký tự'), findsOneWidget);
    });

    testWidgets('7. Gửi API cập nhật hồ sơ và xử lý trường hợp 404 từ máy chủ',
        (tester) async {
      final mockAdapter = MockAdapter((options) async {
        expect(options.path, '/api/v1/users/me/profile');
        expect(options.method, 'PUT');
        return ResponseBody.fromString(
          jsonEncode({'error': 'Not Found'}),
          404,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      });

      await tester.pumpWidget(
        createTestWidget(
          child: const EditProfileScreen(),
          adapter: mockAdapter,
        ),
      );
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'Lê Hoàng Nam Mới');
      await tester.tap(find.text('Lưu thay đổi'));
      await tester.pumpAndSettle();

      // Thông báo rõ ràng về việc máy chủ chưa hỗ trợ API
      expect(
        find.textContaining('Máy chủ chưa hỗ trợ API cập nhật hồ sơ'),
        findsOneWidget,
      );
    });

    testWidgets('8. Cập nhật hồ sơ thành công khi API phản hồi 200',
        (tester) async {
      final mockAdapter = MockAdapter((options) async {
        return ResponseBody.fromString(
          jsonEncode({'message': 'Profile updated successfully'}),
          200,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      });

      await tester.pumpWidget(
        createTestWidget(
          child: const EditProfileScreen(),
          adapter: mockAdapter,
          pushAsRoute: true,
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Open Page'));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).first, 'Lê Hoàng Nam Đã Sửa');
      await tester.tap(find.text('Lưu thay đổi'));
      await tester.pumpAndSettle();

      expect(find.text('Cập nhật thông tin thành công'), findsOneWidget);
    });
  });

  group('FPC-15: ChangePasswordScreen Tests', () {
    testWidgets('9. Form đổi mật khẩu kiểm tra validation đầy đủ',
        (tester) async {
      await tester.pumpWidget(
        createTestWidget(child: const ChangePasswordScreen()),
      );
      await tester.pumpAndSettle();

      // 1. Để trống bấm Lưu
      await tester.tap(find.widgetWithText(CustomButton, 'Đổi mật khẩu'));
      await tester.pumpAndSettle();

      expect(find.text('Mật khẩu hiện tại không được để trống'), findsOneWidget);
      expect(find.text('Mật khẩu mới không được để trống'), findsOneWidget);
      expect(find.text('Xác nhận mật khẩu không được để trống'), findsOneWidget);

      // 2. Mật khẩu mới quá ngắn (< 8 ký tự)
      final textFields = find.byType(TextFormField);
      await tester.enterText(textFields.at(0), 'OldPass@123');
      await tester.enterText(textFields.at(1), 'short');
      await tester.enterText(textFields.at(2), 'short');
      await tester.tap(find.widgetWithText(CustomButton, 'Đổi mật khẩu'));
      await tester.pumpAndSettle();

      expect(find.text('Mật khẩu phải có ít nhất 8 ký tự'), findsOneWidget);

      // 3. Mật khẩu mới trùng mật khẩu hiện tại (Vi phạm BR)
      await tester.enterText(textFields.at(0), 'SamePassword@2026');
      await tester.enterText(textFields.at(1), 'SamePassword@2026');
      await tester.enterText(textFields.at(2), 'SamePassword@2026');
      await tester.tap(find.widgetWithText(CustomButton, 'Đổi mật khẩu'));
      await tester.pumpAndSettle();

      expect(
        find.text('Mật khẩu mới không được trùng với mật khẩu hiện tại'),
        findsOneWidget,
      );

      // 4. Mật khẩu xác nhận không khớp
      await tester.enterText(textFields.at(0), 'OldPassword@2025');
      await tester.enterText(textFields.at(1), 'NewPassword@2026');
      await tester.enterText(textFields.at(2), 'MismatchPassword@2026');
      await tester.tap(find.widgetWithText(CustomButton, 'Đổi mật khẩu'));
      await tester.pumpAndSettle();

      expect(find.text('Mật khẩu xác nhận không khớp'), findsOneWidget);
    });

    testWidgets('10. Đổi mật khẩu gọi API và xử lý thông báo 404 từ máy chủ',
        (tester) async {
      final mockAdapter = MockAdapter((options) async {
        expect(options.path, '/api/v1/users/me/password');
        expect(options.method, 'PATCH');
        return ResponseBody.fromString(
          jsonEncode({'error': 'Not Found'}),
          404,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      });

      await tester.pumpWidget(
        createTestWidget(
          child: const ChangePasswordScreen(),
          adapter: mockAdapter,
        ),
      );
      await tester.pumpAndSettle();

      final textFields = find.byType(TextFormField);
      await tester.enterText(textFields.at(0), 'OldPassword@2025');
      await tester.enterText(textFields.at(1), 'NewPassword@2026');
      await tester.enterText(textFields.at(2), 'NewPassword@2026');

      await tester.tap(find.widgetWithText(CustomButton, 'Đổi mật khẩu'));
      await tester.pumpAndSettle();

      expect(
        find.textContaining('Máy chủ chưa hỗ trợ API đổi mật khẩu'),
        findsOneWidget,
      );
    });

    testWidgets('11. Đổi mật khẩu thành công khi API phản hồi 200',
        (tester) async {
      final mockAdapter = MockAdapter((options) async {
        return ResponseBody.fromString(
          jsonEncode({'message': 'Password changed successfully'}),
          200,
          headers: {
            Headers.contentTypeHeader: [Headers.jsonContentType],
          },
        );
      });

      await tester.pumpWidget(
        createTestWidget(
          child: const ChangePasswordScreen(),
          adapter: mockAdapter,
          pushAsRoute: true,
        ),
      );
      await tester.pumpAndSettle();

      await tester.tap(find.text('Open Page'));
      await tester.pumpAndSettle();

      final textFields = find.byType(TextFormField);
      await tester.enterText(textFields.at(0), 'OldPassword@2025');
      await tester.enterText(textFields.at(1), 'NewPassword@2026');
      await tester.enterText(textFields.at(2), 'NewPassword@2026');

      await tester.tap(find.widgetWithText(CustomButton, 'Đổi mật khẩu'));
      await tester.pumpAndSettle();

      expect(find.text('Đổi mật khẩu thành công'), findsOneWidget);
    });
  });
}
