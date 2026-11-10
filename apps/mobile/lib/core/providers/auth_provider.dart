import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_exception.dart';
import '../network/auth_token_storage.dart';
import 'api_client_provider.dart';
import 'token_storage_provider.dart';

class AuthState {
  const AuthState({
    this.isLoggedIn = false,
    this.userId,
    this.fullName,
    this.email,
    this.role,
  });

  final bool isLoggedIn;
  final String? userId;
  final String? fullName;
  final String? email;
  final String? role;

  AuthState copyWith({
    bool? isLoggedIn,
    String? userId,
    String? fullName,
    String? email,
    String? role,
  }) {
    return AuthState(
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      userId: userId ?? this.userId,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      role: role ?? this.role,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  AuthTokenStorage get _storage => ref.read(authTokenStorageProvider);

  @override
  AuthState build() => const AuthState();

  Future<void> restoreSession() async {
    final token = await _storage.readAccessToken();
    state = AuthState(isLoggedIn: token != null && token.isNotEmpty);
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    try {
      final dio = ref.read(apiClientProvider).dio;
      final response = await dio.post('/api/v1/auth/login', data: {
        'email': email,
        'password': password,
      });

      final body = response.data as Map<String, dynamic>;
      final data = (body['data'] is Map<String, dynamic>)
          ? body['data'] as Map<String, dynamic>
          : body;

      final tokens = (data['tokens'] is Map<String, dynamic>)
          ? data['tokens'] as Map<String, dynamic>
          : data;

      final accessToken =
          (tokens['accessToken'] ?? data['accessToken']) as String;
      final refreshToken =
          (tokens['refreshToken'] ?? data['refreshToken']) as String?;
      final user = data['user'] as Map<String, dynamic>? ?? data;

      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      state = AuthState(
        isLoggedIn: true,
        userId: user['id'] as String? ?? user['userId'] as String?,
        fullName: user['fullName'] as String? ?? user['full_name'] as String?,
        email: user['email'] as String? ?? email,
        role: user['role'] as String?,
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
  }) async {
    try {
      final dio = ref.read(apiClientProvider).dio;
      final response = await dio.post('/api/v1/auth/register', data: {
        'fullName': fullName,
        'email': email,
        'password': password,
      });

      final body = response.data as Map<String, dynamic>;
      final data = (body['data'] is Map<String, dynamic>)
          ? body['data'] as Map<String, dynamic>
          : body;

      final tokens = (data['tokens'] is Map<String, dynamic>)
          ? data['tokens'] as Map<String, dynamic>
          : data;

      final accessToken =
          (tokens['accessToken'] ?? data['accessToken']) as String;
      final refreshToken =
          (tokens['refreshToken'] ?? data['refreshToken']) as String?;
      final user = data['user'] as Map<String, dynamic>? ?? data;

      await _storage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      state = AuthState(
        isLoggedIn: true,
        userId: user['id'] as String? ??
            user['userId'] as String? ??
            data['userId'] as String?,
        fullName: user['fullName'] as String? ??
            user['full_name'] as String? ??
            fullName,
        email: user['email'] as String? ?? email,
        role: user['role'] as String? ?? 'Participant',
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _storage.readRefreshToken();
      if (refreshToken != null && refreshToken.isNotEmpty) {
        final dio = ref.read(apiClientProvider).dio;
        await dio.post(
          '/api/v1/auth/logout',
          data: {'refreshToken': refreshToken},
        );
      }
    } catch (_) {
      // Ignore network errors on logout so local state always resets
    } finally {
      await _storage.clearTokens();
      state = const AuthState();
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
