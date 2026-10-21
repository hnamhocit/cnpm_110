import 'package:dio/dio.dart';

import '../../models/contest.dart';
import '../network/api_exception.dart';

abstract interface class ContestRepository {
  Future<ContestPage> fetchContests({
    ContestStatus? status,
    int page = 1,
    int limit = 10,
  });

  Future<Contest> fetchContest(String id);
}

class ApiContestRepository implements ContestRepository {
  const ApiContestRepository(this._dio);

  final Dio _dio;

  @override
  Future<ContestPage> fetchContests({
    ContestStatus? status,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/contests',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (status != null) 'status': status.name,
        },
      );

      final body = response.data ?? const <String, dynamic>{};
      final rows = body['data'] as List<dynamic>? ?? const [];
      final pagination =
          body['pagination'] as Map<String, dynamic>? ?? const {};

      return ContestPage(
        items: rows
            .map((row) => Contest.fromJson(row as Map<String, dynamic>))
            .toList(),
        page: pagination['page'] as int? ?? page,
        totalPages: pagination['totalPages'] as int? ?? 1,
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<Contest> fetchContest(String id) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/contests/$id');
      final body = response.data ?? const <String, dynamic>{};
      final data = body['data'] as Map<String, dynamic>?;

      if (data == null) {
        throw const ApiException('Không tìm thấy cuộc thi');
      }

      return Contest.fromJson(data);
    } on DioException catch (error) {
      if (error.response?.statusCode == 404) {
        throw const ApiException('Không tìm thấy cuộc thi');
      }
      throw ApiException.fromDio(error);
    }
  }
}