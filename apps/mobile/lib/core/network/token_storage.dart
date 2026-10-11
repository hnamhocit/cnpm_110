/// Abstraction for securely persisting authentication tokens.
///
/// Implement this with the storage solution used by the app, for example
/// `flutter_secure_storage`.
abstract interface class TokenStorage {
  Future<String?> readAccessToken();

  Future<String?> readRefreshToken();

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  });

  Future<void> clearTokens();
}
