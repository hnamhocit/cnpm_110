import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_application_2/core/network/auth_interceptor.dart';
import 'package:flutter_application_2/core/network/auth_service.dart';
import 'package:flutter_application_2/core/network/auth_token_storage.dart';

void main() {
  group('AuthInterceptor', () {
    test(
      'shares one refresh and retries all concurrent unauthorized requests',
      () async {
        final tokenStorage = _MemoryTokenStorage()..accessToken = 'expired';
        final authService = _FakeAuthService(tokenStorage: tokenStorage);
        final adapter = _ProtectedResourceAdapter();
        final dio = Dio(BaseOptions(baseUrl: 'https://example.test'))
          ..httpClientAdapter = adapter;
        dio.interceptors.add(
          AuthInterceptor(
            dio: dio,
            tokenStorage: tokenStorage,
            authService: authService,
            onUnauthenticated: () async {},
          ),
        );

        final responses = await Future.wait([
          dio.get<dynamic>('/first'),
          dio.get<dynamic>('/second'),
        ]);

        expect(authService.refreshCount, 1);
        expect(responses, hasLength(2));
        expect(
          responses.every((response) => response.statusCode == 200),
          isTrue,
        );
        expect(adapter.authorizationHeaders, [
          'Bearer expired',
          'Bearer expired',
          'Bearer fresh-token',
          'Bearer fresh-token',
        ]);
        expect(tokenStorage.accessToken, 'fresh-token');
      },
    );

    test('reuses a refreshed token for a late 401 response', () async {
      final tokenStorage = _MemoryTokenStorage()..accessToken = 'expired';
      final authService = _FakeAuthService(tokenStorage: tokenStorage);
      final adapter = _ProtectedResourceAdapter(delayedPath: '/late');
      final dio = Dio(BaseOptions(baseUrl: 'https://example.test'))
        ..httpClientAdapter = adapter;
      dio.interceptors.add(
        AuthInterceptor(
          dio: dio,
          tokenStorage: tokenStorage,
          authService: authService,
          onUnauthenticated: () async {},
        ),
      );

      await Future.wait([
        dio.get<dynamic>('/early'),
        dio.get<dynamic>('/late'),
      ]);

      expect(authService.refreshCount, 1);
      expect(
        adapter.authorizationHeaders.where((value) {
          return value == 'Bearer fresh-token';
        }),
        hasLength(2),
      );
    });

    test('clears tokens and invokes logout when refresh fails', () async {
      final tokenStorage = _MemoryTokenStorage()..accessToken = 'expired';
      var logoutCount = 0;
      final dio = Dio(BaseOptions(baseUrl: 'https://example.test'))
        ..httpClientAdapter = _UnauthorizedAdapter();
      dio.interceptors.add(
        AuthInterceptor(
          dio: dio,
          tokenStorage: tokenStorage,
          authService: _FakeAuthService(tokenStorage: tokenStorage, fail: true),
          onUnauthenticated: () async {
            logoutCount++;
          },
        ),
      );

      await expectLater(
        dio.get<dynamic>('/private'),
        throwsA(isA<DioException>()),
      );

      expect(tokenStorage.accessToken, isNull);
      expect(logoutCount, 1);
    });
  });
}

class _MemoryTokenStorage implements AuthTokenStorage {
  String? accessToken;

  @override
  Future<void> clearTokens() async {
    accessToken = null;
  }

  @override
  Future<String?> readAccessToken() async => accessToken;

  @override
  Future<String?> readRefreshToken() async => 'refresh-token';

  @override
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    this.accessToken = accessToken;
  }
}

class _FakeAuthService implements AuthService {
  _FakeAuthService({required this.tokenStorage, this.fail = false});

  final _MemoryTokenStorage tokenStorage;
  final bool fail;
  int refreshCount = 0;

  @override
  Future<String> refreshAccessToken() async {
    refreshCount++;
    await Future<void>.delayed(const Duration(milliseconds: 20));
    if (fail) {
      throw StateError('Refresh failed');
    }
    await tokenStorage.saveTokens(accessToken: 'fresh-token');
    return 'fresh-token';
  }
}

class _ProtectedResourceAdapter implements HttpClientAdapter {
  _ProtectedResourceAdapter({this.delayedPath});

  final String? delayedPath;
  final authorizationHeaders = <String?>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    if (options.path == delayedPath) {
      await Future<void>.delayed(const Duration(milliseconds: 60));
    }
    final authorization = options.headers['Authorization'] as String?;
    authorizationHeaders.add(authorization);
    final statusCode = authorization == 'Bearer fresh-token' ? 200 : 401;
    return ResponseBody.fromString(
      jsonEncode({'ok': statusCode == 200}),
      statusCode,
      headers: {
        Headers.contentTypeHeader: ['application/json'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

class _UnauthorizedAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return ResponseBody.fromString(
      '{"message":"Unauthorized"}',
      401,
      headers: {
        Headers.contentTypeHeader: ['application/json'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}
