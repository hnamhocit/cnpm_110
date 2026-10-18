import 'package:dio/dio.dart';

import 'auth_service.dart';
import 'auth_token_storage.dart';

class AuthInterceptor extends Interceptor {
  factory AuthInterceptor({
    required Dio dio,
    required AuthTokenStorage tokenStorage,
    required AuthService authService,
    required Future<void> Function() onUnauthenticated,
  }) {
    return AuthInterceptor._(dio, tokenStorage, authService, onUnauthenticated);
  }

  AuthInterceptor._(
    this._dio,
    this._tokenStorage,
    this._authService,
    this._onUnauthenticated,
  );

  static const _skipAuthKey = 'skipAuth';
  static const _retriedKey = 'authRetried';

  final Dio _dio;
  final AuthTokenStorage _tokenStorage;
  final AuthService _authService;
  final Future<void> Function() _onUnauthenticated;

  Future<String>? _refreshInFlight;
  Future<void>? _logoutInFlight;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (options.extra[_skipAuthKey] == true) {
      handler.next(options);
      return;
    }

    final accessToken = await _tokenStorage.readAccessToken();
    if (accessToken != null && accessToken.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    } else {
      options.headers.remove('Authorization');
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final request = err.requestOptions;
    if (err.response?.statusCode != 401 ||
        request.extra[_skipAuthKey] == true ||
        request.extra[_retriedKey] == true) {
      handler.next(err);
      return;
    }

    late final String accessToken;
    try {
      final storedToken = await _tokenStorage.readAccessToken();
      final requestAuthorization = request.headers['Authorization'];
      if (storedToken != null &&
          storedToken.isNotEmpty &&
          requestAuthorization != 'Bearer $storedToken') {
        accessToken = storedToken;
      } else {
        // All requests that fail with 401 while refresh is running await one Future.
        accessToken = await (_refreshInFlight ??= _refreshAccessToken());
      }
    } catch (refreshError, refreshStackTrace) {
      try {
        await (_logoutInFlight ??= _clearSessionAndNotify());
      } catch (logoutError, logoutStackTrace) {
        handler.reject(
          DioException(
            requestOptions: request,
            error: logoutError,
            stackTrace: logoutStackTrace,
            message: 'Token refresh and logout handling failed.',
          ),
        );
        return;
      }
      handler.reject(
        DioException(
          requestOptions: request,
          error: refreshError,
          stackTrace: refreshStackTrace,
          message: 'Token refresh failed; the user has been logged out.',
        ),
      );
      return;
    }

    _logoutInFlight = null;
    final retryRequest = request.copyWith(
      headers: {...request.headers, 'Authorization': 'Bearer $accessToken'},
      extra: {...request.extra, _retriedKey: true},
    );

    try {
      handler.resolve(await _dio.fetch<dynamic>(retryRequest));
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }

  Future<String> _refreshAccessToken() {
    return _authService.refreshAccessToken().whenComplete(() {
      _refreshInFlight = null;
    });
  }

  Future<void> _clearSessionAndNotify() async {
    await _tokenStorage.clearTokens();
    await _onUnauthenticated();
  }
}
