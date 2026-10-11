import 'package:dio/dio.dart';

import 'auth_token_storage.dart';

abstract interface class AuthService {
  /// Returns a fresh access token after persisting it and any rotated refresh token.
  Future<String> refreshAccessToken();
}

class DioAuthService implements AuthService {
  factory DioAuthService({
    required String baseUrl,
    required AuthTokenStorage tokenStorage,
    String refreshPath = '/auth/refresh',
    Duration connectTimeout = const Duration(seconds: 15),
    Duration receiveTimeout = const Duration(seconds: 15),
  }) {
    return DioAuthService._(
      tokenStorage,
      refreshPath,
      Dio(
        BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: connectTimeout,
          receiveTimeout: receiveTimeout,
          headers: const {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      ),
    );
  }

  DioAuthService._(this._tokenStorage, this._refreshPath, this._dio);

  final AuthTokenStorage _tokenStorage;
  final String _refreshPath;
  // This client deliberately has no auth interceptor, preventing refresh loops.
  final Dio _dio;

  @override
  Future<String> refreshAccessToken() async {
    final refreshToken = await _tokenStorage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      throw StateError('No refresh token is available.');
    }

    final response = await _dio.post<dynamic>(
      _refreshPath,
      data: {'refreshToken': refreshToken},
    );
    final data = response.data;
    if (data is! Map) {
      throw const FormatException('Invalid token refresh response.');
    }

    final accessToken = data['accessToken'];
    final newRefreshToken = data['refreshToken'];
    if (accessToken is! String || accessToken.isEmpty) {
      throw const FormatException(
        'Token refresh response has no valid accessToken.',
      );
    }
    if (newRefreshToken != null && newRefreshToken is! String) {
      throw const FormatException(
        'Token refresh response has an invalid refreshToken.',
      );
    }
    final String? validRefreshToken = newRefreshToken is String
        ? newRefreshToken
        : null;

    await _tokenStorage.saveTokens(
      accessToken: accessToken,
      refreshToken: validRefreshToken,
    );
    return accessToken;
  }
}
