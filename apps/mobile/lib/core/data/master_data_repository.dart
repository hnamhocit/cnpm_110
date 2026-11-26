import 'package:dio/dio.dart';

import '../../models/master_data.dart';
import '../network/api_exception.dart';

abstract interface class MasterDataRepository {
  Future<List<FilmStockItem>> fetchFilmStocks({String? search});
  Future<List<CameraItem>> fetchCameras({String? search});
  Future<List<LensItem>> fetchLenses({String? search, String? mountType});
  Future<List<FilmLabItem>> fetchFilmLabs({String? search});
  Future<MasterDataCatalog> fetchCatalog();
}

class ApiMasterDataRepository implements MasterDataRepository {
  const ApiMasterDataRepository(this._dio);

  final Dio _dio;

  List<dynamic> _extractItems(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      final data = responseData['data'];
      if (data is Map<String, dynamic> && data['items'] is List) {
        return data['items'] as List;
      }
      if (data is List) return data;
    }
    return const [];
  }

  @override
  Future<List<FilmStockItem>> fetchFilmStocks({String? search}) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/api/v1/master-data/film-stocks',
        queryParameters: {
          if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
          'limit': 100,
        },
      );
      return _extractItems(res.data)
          .map((e) => FilmStockItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<List<CameraItem>> fetchCameras({String? search}) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/api/v1/master-data/cameras',
        queryParameters: {
          if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
          'limit': 100,
        },
      );
      return _extractItems(res.data)
          .map((e) => CameraItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<List<LensItem>> fetchLenses({String? search, String? mountType}) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/api/v1/master-data/lenses',
        queryParameters: {
          if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
          if (mountType != null && mountType.trim().isNotEmpty)
            'mount_type': mountType.trim(),
          'limit': 100,
        },
      );
      return _extractItems(res.data)
          .map((e) => LensItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<List<FilmLabItem>> fetchFilmLabs({String? search}) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(
        '/api/v1/master-data/film-labs',
        queryParameters: {
          if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
          'limit': 100,
        },
      );
      return _extractItems(res.data)
          .map((e) => FilmLabItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<MasterDataCatalog> fetchCatalog() async {
    final results = await Future.wait([
      fetchFilmStocks().catchError((_) => <FilmStockItem>[]),
      fetchCameras().catchError((_) => <CameraItem>[]),
      fetchLenses().catchError((_) => <LensItem>[]),
      fetchFilmLabs().catchError((_) => <FilmLabItem>[]),
    ]);
    return MasterDataCatalog(
      filmStocks: results[0] as List<FilmStockItem>,
      cameras: results[1] as List<CameraItem>,
      lenses: results[2] as List<LensItem>,
      filmLabs: results[3] as List<FilmLabItem>,
    );
  }
}
