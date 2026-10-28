import 'package:flutter_riverpod/flutter_riverpod.dart';

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
    final dio = ref.read(apiClientProvider).dio;
    final response = await dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });

    final data = response.data as Map<String, dynamic>;
    final accessToken = data['accessToken'] as String;
    final refreshToken = data['refreshToken'] as String?;
    final user = data['user'] as Map<String, dynamic>? ?? data;

    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );

    state = AuthState(
      isLoggedIn: true,
      userId: user['id'] as String?,
      fullName: user['fullName'] as String?,
      email: user['email'] as String?,
      role: user['role'] as String?,
    );
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
  }) async {
    final dio = ref.read(apiClientProvider).dio;
    final response = await dio.post('/auth/register', data: {
      'fullName': fullName,
      'email': email,
      'password': password,
    });

    final data = response.data as Map<String, dynamic>;
    final accessToken = data['accessToken'] as String;
    final refreshToken = data['refreshToken'] as String?;

    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );

    state = AuthState(
      isLoggedIn: true,
      userId: data['userId'] as String? ?? data['id'] as String?,
      fullName: data['fullName'] as String?,
      email: data['email'] as String? ?? email,
      role: data['role'] as String?,
    );
  }

  Future<void> logout() async {
    await _storage.clearTokens();
    state = const AuthState();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);