import 'package:dio/dio.dart';

import 'auth_interceptor.dart';
import 'auth_service.dart';
import 'auth_token_storage.dart';

class ApiClient {
  ApiClient({
    required String baseUrl,
    required AuthTokenStorage tokenStorage,
    required Future<void> Function() onUnauthenticated,
    AuthService? authService,
    String refreshPath = '/auth/refresh',
    Duration connectTimeout = const Duration(seconds: 15),
    Duration receiveTimeout = const Duration(seconds: 15),
  }) : dio = Dio(
         BaseOptions(
           baseUrl: baseUrl,
           connectTimeout: connectTimeout,
           receiveTimeout: receiveTimeout,
           headers: const {
             'Content-Type': 'application/json',
             'Accept': 'application/json',
           },
         ),
       ) {
    dio.interceptors.add(
      AuthInterceptor(
        dio: dio,
        tokenStorage: tokenStorage,
        authService:
            authService ??
            DioAuthService(
              baseUrl: baseUrl,
              tokenStorage: tokenStorage,
              refreshPath: refreshPath,
              connectTimeout: connectTimeout,
              receiveTimeout: receiveTimeout,
            ),
        onUnauthenticated: onUnauthenticated,
      ),
    );
  }

  final Dio dio;
}
