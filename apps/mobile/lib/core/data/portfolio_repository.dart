import 'package:dio/dio.dart';

import '../../models/user_portfolio.dart';
import '../network/api_exception.dart';

abstract interface class PortfolioRepository {
  /// Lấy thông tin portfolio cá nhân, lịch sử giải thưởng & tác phẩm (FPC-101)
  Future<UserPortfolio> fetchMyPortfolio();
}

class ApiPortfolioRepository implements PortfolioRepository {
  const ApiPortfolioRepository(this._dio);

  final Dio _dio;

  @override
  Future<UserPortfolio> fetchMyPortfolio() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/api/v1/auth/portfolio',
      );

      final body = response.data ?? const <String, dynamic>{};
      final data = body['data'] as Map<String, dynamic>? ?? body;

      return UserPortfolio.fromJson(data);
    } on DioException catch (error) {
      if (error.response?.statusCode == 401) {
        throw const ApiException('Phiên đăng nhập đã hết hạn');
      }
      throw ApiException.fromDio(error);
    }
  }
}
