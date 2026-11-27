import 'package:dio/dio.dart';

import '../../models/film_logbook.dart';
import '../network/api_exception.dart';

abstract interface class FilmLogbookRepository {
  Future<List<FilmRoll>> fetchMyRolls({String? status});
  Future<FilmRoll> fetchRollDetail(String rollId);
  Future<FilmRoll> createRoll(Map<String, dynamic> payload);
  Future<FilmRoll> updateRoll(String rollId, Map<String, dynamic> payload);
  Future<void> deleteRoll(String rollId);
  Future<FrameLog> addFrame(String rollId, Map<String, dynamic> payload);
  Future<void> deleteFrame(String rollId, String frameId);
}

class ApiFilmLogbookRepository implements FilmLogbookRepository {
  const ApiFilmLogbookRepository(this._dio);

  final Dio _dio;

  @override
  Future<List<FilmRoll>> fetchMyRolls({String? status}) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/api/v1/film-rolls',
        queryParameters: {
          if (status != null && status.isNotEmpty) 'status': status,
          'limit': 50,
        },
      );
      final data = res.data?['data'];
      final items = data is Map<String, dynamic> ? data['items'] : null;
      if (items is! List) return const [];
      return items
          .map((e) => FilmRoll.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<FilmRoll> fetchRollDetail(String rollId) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/api/v1/film-rolls/$rollId',
      );
      return FilmRoll.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<FilmRoll> createRoll(Map<String, dynamic> payload) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/api/v1/film-rolls',
        data: payload,
      );
      return FilmRoll.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<FilmRoll> updateRoll(
    String rollId,
    Map<String, dynamic> payload,
  ) async {
    try {
      final res = await _dio.patch<Map<String, dynamic>>(
        '/api/v1/film-rolls/$rollId',
        data: payload,
      );
      return FilmRoll.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<void> deleteRoll(String rollId) async {
    try {
      await _dio.delete<Map<String, dynamic>>('/api/v1/film-rolls/$rollId');
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<FrameLog> addFrame(
    String rollId,
    Map<String, dynamic> payload,
  ) async {
    try {
      final res = await _dio.post<Map<String, dynamic>>(
        '/api/v1/film-rolls/$rollId/frames',
        data: payload,
      );
      return FrameLog.fromJson(res.data!['data'] as Map<String, dynamic>);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<void> deleteFrame(String rollId, String frameId) async {
    try {
      await _dio.delete<Map<String, dynamic>>(
        '/api/v1/film-rolls/$rollId/frames/$frameId',
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }
}
