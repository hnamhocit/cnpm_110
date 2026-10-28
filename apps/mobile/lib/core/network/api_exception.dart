import 'package:dio/dio.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  factory ApiException.fromDio(DioException error) {
    final statusCode = error.response?.statusCode;

    if (statusCode != null && statusCode >= 500) {
      return ApiException(
        'Máy chủ đang gặp sự cố, vui lòng thử lại sau',
        statusCode: statusCode,
      );
    }

    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final value = data['error'] ?? data['message'];
      if (value is String && value.isNotEmpty) {
        return ApiException(value, statusCode: statusCode);
      }
    }

    final fallback = switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout => 'Kết nối quá lâu, vui lòng thử lại',
      DioExceptionType.connectionError => 'Không kết nối được tới máy chủ',
      _ => 'Đã có lỗi xảy ra, vui lòng thử lại',
    };

    return ApiException(fallback, statusCode: statusCode);
  }

  @override
  String toString() => message;
}