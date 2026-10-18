import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/auth_token_storage.dart';
import 'token_storage_provider.dart';

class AuthState {
  const AuthState({this.isLoggedIn = false});

  final bool isLoggedIn;
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
    required String accessToken,
    String? refreshToken,
  }) async {
    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
    state = const AuthState(isLoggedIn: true);
  }

  Future<void> logout() async {
    await _storage.clearTokens();
    state = const AuthState();
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);