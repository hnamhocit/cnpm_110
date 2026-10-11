import 'package:dio/dio.dart';

import 'token_storage.dart';

class AuthInterceptor extends Interceptor {
  static const _authorizationHeader = 'Authorization';

  AuthInterceptor({
    required this.dio,
    required this.refreshDio,
    required this.tokenStorage,
    required this.onUnauthenticated,
    required this.refreshPath,
  });

  static const _retryKey = 'auth_retry';

  final Dio dio;
  final Dio refreshDio;
  final TokenStorage tokenStorage;
  final Future<void> Function() onUnauthenticated;
  final String refreshPath;

  Future<String>? _refreshFuture;
  Future<void>? _logoutFuture;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    try {
      final accessToken = await tokenStorage.readAccessToken();
      if (accessToken != null && accessToken.isNotEmpty) {
        options.headers[_authorizationHeader] = 'Bearer $accessToken';
      } else {
        options.headers.remove(_authorizationHeader);
      }
      handler.next(options);
    } on Object catch (error, stackTrace) {
      handler.reject(
        DioException(
          requestOptions: options,
          error: error,
          stackTrace: stackTrace,
        ),
      );
    }
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final request = err.requestOptions;
    final rejectedAuthorization =
        request.headers[_authorizationHeader] as String?;

    if (err.response?.statusCode != 401 ||
        request.extra[_retryKey] == true ||
        rejectedAuthorization == null ||
        !rejectedAuthorization.startsWith('Bearer ')) {
      handler.next(err);
      return;
    }

    late final String accessToken;
    try {
      final currentAccessToken = await tokenStorage.readAccessToken();
      final rejectedToken = rejectedAuthorization.substring('Bearer '.length);

      // A different request may already have refreshed the token before this
      // 401 reached the interceptor, so retry with that token without refreshing again.
      accessToken =
          currentAccessToken != null &&
              currentAccessToken.isNotEmpty &&
              currentAccessToken != rejectedToken
          ? currentAccessToken
          : await _refreshAccessToken();
    } on Object catch (refreshError, stackTrace) {
      try {
        await _expireSession();
      } on Object catch (logoutError, logoutStackTrace) {
        handler.reject(
          DioException(
            requestOptions: request,
            error: logoutError,
            stackTrace: logoutStackTrace,
          ),
        );
        return;
      }

      handler.reject(
        DioException(
          requestOptions: request,
          error: refreshError,
          stackTrace: stackTrace,
        ),
      );
      return;
    }

    request.headers[_authorizationHeader] = 'Bearer $accessToken';
    request.extra[_retryKey] = true;
    try {
      final response = await dio.fetch<dynamic>(request);
      handler.resolve(response);
    } on DioException catch (retryError) {
      handler.reject(retryError);
    } on Object catch (retryError, stackTrace) {
      handler.reject(
        DioException(
          requestOptions: request,
          error: retryError,
          stackTrace: stackTrace,
        ),
      );
    }
  }

  Future<String> _refreshAccessToken() {
    final activeRefresh = _refreshFuture;
    if (activeRefresh != null) {
      return activeRefresh;
    }

    // Concurrent 401 handlers wait on this same future instead of refreshing again.
    final refresh = _requestNewAccessToken();
    _refreshFuture = refresh;
    return refresh.whenComplete(() {
      if (identical(_refreshFuture, refresh)) {
        _refreshFuture = null;
      }
    });
  }

  Future<String> _requestNewAccessToken() async {
    final refreshToken = await tokenStorage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      throw StateError('No refresh token is available.');
    }

    final response = await refreshDio.post<Map<String, dynamic>>(
      refreshPath,
      data: {'refreshToken': refreshToken},
    );
    final data = response.data;
    final accessToken = data?['accessToken'];
    final newRefreshToken = data?['refreshToken'];

    if (accessToken is! String || accessToken.isEmpty) {
      throw const FormatException(
        'The refresh response must contain a non-empty accessToken.',
      );
    }

    final String refreshTokenToSave;
    if (newRefreshToken == null) {
      refreshTokenToSave = refreshToken;
    } else if (newRefreshToken is String && newRefreshToken.isNotEmpty) {
      refreshTokenToSave = newRefreshToken;
    } else {
      throw const FormatException(
        'The rotated refreshToken must be a non-empty string.',
      );
    }

    await tokenStorage.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshTokenToSave,
    );
    return accessToken;
  }

  Future<void> _expireSession() {
    final activeLogout = _logoutFuture;
    if (activeLogout != null) {
      return activeLogout;
    }

    final logout = _clearAndNotify();
    _logoutFuture = logout;
    return logout.whenComplete(() {
      if (identical(_logoutFuture, logout)) {
        _logoutFuture = null;
      }
    });
  }

  Future<void> _clearAndNotify() async {
    await tokenStorage.clearTokens();
    await onUnauthenticated();
  }
}
