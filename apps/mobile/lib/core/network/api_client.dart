import 'package:dio/dio.dart';

import 'auth_interceptor.dart';
import 'token_storage.dart';

class ApiClient {
  ApiClient({
    required String baseUrl,
    required TokenStorage tokenStorage,
    required Future<void> Function() onUnauthenticated,
    String refreshPath = '/auth/refresh',
    Duration connectTimeout = const Duration(seconds: 15),
    Duration receiveTimeout = const Duration(seconds: 15),
  }) : dio = Dio(
         BaseOptions(
           baseUrl: baseUrl,
           connectTimeout: connectTimeout,
           receiveTimeout: receiveTimeout,
           contentType: Headers.jsonContentType,
           headers: const {'Accept': 'application/json'},
         ),
       ) {
    // The refresh client deliberately has no auth interceptor to avoid a loop
    // if the refresh endpoint itself responds with 401.
    final refreshDio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: connectTimeout,
        receiveTimeout: receiveTimeout,
        contentType: Headers.jsonContentType,
        headers: const {'Accept': 'application/json'},
      ),
    );

    dio.interceptors.add(
      AuthInterceptor(
        dio: dio,
        refreshDio: refreshDio,
        tokenStorage: tokenStorage,
        onUnauthenticated: onUnauthenticated,
        refreshPath: refreshPath,
      ),
    );
  }

  /// Inject this Dio instance into repositories or data sources.
  final Dio dio;
}
