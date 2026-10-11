import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract interface class AuthTokenStorage {
  Future<String?> readAccessToken();

  Future<String?> readRefreshToken();

  Future<void> saveTokens({required String accessToken, String? refreshToken});

  Future<void> clearTokens();
}

class SecureAuthTokenStorage implements AuthTokenStorage {
  factory SecureAuthTokenStorage({
    FlutterSecureStorage storage = const FlutterSecureStorage(),
  }) {
    return SecureAuthTokenStorage._(storage);
  }

  const SecureAuthTokenStorage._(this._storage);

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  final FlutterSecureStorage _storage;

  @override
  Future<String?> readAccessToken() => _storage.read(key: _accessTokenKey);

  @override
  Future<String?> readRefreshToken() => _storage.read(key: _refreshTokenKey);

  @override
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: _refreshTokenKey, value: refreshToken);
    }
  }

  @override
  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
    ]);
  }
}
