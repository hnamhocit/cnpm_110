import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/film_dev_scan_params.dart';
import '../../models/film_shooting_params.dart';
import '../../models/image_attachment.dart';
import '../../models/submission_data.dart';
import '../../models/user_submission.dart';
import '../network/api_exception.dart';
import '../providers/api_client_provider.dart';

abstract interface class SubmissionRepository {
  Future<SubmissionResult> uploadSubmission(
    SubmissionData data, {
    void Function(int sent, int total)? onSendProgress,
  });

  Future<List<UserSubmission>> getMySubmissions({
    String? contestId,
    String? status,
  });

  /// Upload ảnh dải phim âm bản đối chứng (BR-19 / UC-21)
  Future<void> uploadNegativeProof({
    required String submissionId,
    required ImageAttachment proofImage,
  });
}

abstract interface class SubmissionMetadataRepository {
  /// Chỉnh sửa siêu dữ liệu kỹ thuật phim (FPC-65 / UC-39 / BR-24)
  Future<Map<String, dynamic>> updateSubmissionMetadata({
    required String submissionId,
    required FilmShootingParams shootingParams,
    FilmDevScanParams? devScanParams,
  });
}

class ApiSubmissionRepository
    implements SubmissionRepository, SubmissionMetadataRepository {
  const ApiSubmissionRepository(this._dio);

  final Dio _dio;

  @override
  Future<SubmissionResult> uploadSubmission(
    SubmissionData data, {
    void Function(int sent, int total)? onSendProgress,
  }) async {
    try {
      final map = <String, dynamic>{
        'contestId': data.contestId,
        'categoryId': data.categoryId,
        'title': data.title,
        if (data.description != null && data.description!.isNotEmpty)
          'description': data.description,
      };

      // Shooting metadata (fallback defaults for contest schema requirements)
      final shooting = data.shootingParams;
      map['filmBrand'] = shooting?.filmBrand ?? 'Kodak';
      map['filmStock'] = shooting?.filmStock ?? 'Portra 400';
      map['filmFormat'] = shooting?.filmFormat ?? '35mm';
      map['isoRated'] = (shooting?.isoRated ?? 400).toString();
      map['isoShot'] = (shooting?.isoShot ?? 400).toString();
      map['cameraBody'] = shooting?.cameraBody ?? 'Film Camera';

      if (shooting?.lens != null && shooting!.lens!.isNotEmpty) {
        map['lens'] = shooting.lens;
      }
      if (shooting?.rollId != null && shooting!.rollId!.isNotEmpty) {
        map['rollId'] = shooting.rollId;
      }
      if (shooting?.frameNumber != null && shooting!.frameNumber!.isNotEmpty) {
        map['frameNumber'] = shooting.frameNumber;
      }

      // Dev & scan metadata
      final devScan = data.devScanParams;
      if (devScan?.labName != null && devScan!.labName.isNotEmpty) {
        map['devLabName'] = devScan.labName;
      }
      if (devScan?.devChemistry != null && devScan!.devChemistry!.isNotEmpty) {
        map['devChemistry'] = devScan.devChemistry;
      }
      if (devScan?.scannerModel != null && devScan!.scannerModel.isNotEmpty) {
        map['scannerModel'] = devScan.scannerModel;
      }

      // Attach scan image (mandatory)
      if (data.scanImage.bytes != null) {
        map['image'] = MultipartFile.fromBytes(
          data.scanImage.bytes!,
          filename: data.scanImage.name,
        );
      } else {
        map['image'] = await MultipartFile.fromFile(
          data.scanImage.file.path,
          filename: data.scanImage.name,
        );
      }

      // Attach negative proof (optional)
      if (data.negativeProof != null) {
        if (data.negativeProof!.bytes != null) {
          map['negativeProof'] = MultipartFile.fromBytes(
            data.negativeProof!.bytes!,
            filename: data.negativeProof!.name,
          );
        } else {
          map['negativeProof'] = await MultipartFile.fromFile(
            data.negativeProof!.file.path,
            filename: data.negativeProof!.name,
          );
        }
      }

      final formData = FormData.fromMap(map);

      final response = await _dio.post<Map<String, dynamic>>(
        '/api/v1/submissions',
        data: formData,
        onSendProgress: onSendProgress,
      );

      final body = response.data ?? const <String, dynamic>{};
      final resultData = body['data'] as Map<String, dynamic>? ?? body;

      return SubmissionResult.fromJson(resultData);
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<List<UserSubmission>> getMySubmissions({
    String? contestId,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        if (contestId != null && contestId.isNotEmpty) 'contestId': contestId,
        if (status != null && status.isNotEmpty) 'status': status,
      };

      Response<Map<String, dynamic>> response;
      try {
        response = await _dio.get<Map<String, dynamic>>(
          '/api/v1/submissions/my',
          queryParameters: queryParams,
        );
      } on DioException catch (e) {
        if (e.response?.statusCode == 404) {
          response = await _dio.get<Map<String, dynamic>>(
            '/api/v1/submissions',
            queryParameters: queryParams,
          );
        } else {
          rethrow;
        }
      }

      final body = response.data ?? const <String, dynamic>{};
      final rawData = body['data'];
      final List<dynamic> list = rawData is List<dynamic>
          ? rawData
          : (rawData is Map<String, dynamic>
              ? (rawData['items'] as List<dynamic>? ?? const [])
              : const []);

      return list
          .map((item) => UserSubmission.fromJson(item as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<void> uploadNegativeProof({
    required String submissionId,
    required ImageAttachment proofImage,
  }) async {
    try {
      final MultipartFile file;
      if (proofImage.bytes != null) {
        file = MultipartFile.fromBytes(
          proofImage.bytes!,
          filename: proofImage.name,
        );
      } else {
        file = await MultipartFile.fromFile(
          proofImage.file.path,
          filename: proofImage.name,
        );
      }

      final formData = FormData.fromMap({
        'negativeProof': file,
      });

      await _dio.post<Map<String, dynamic>>(
        '/api/v1/submissions/$submissionId/proof',
        data: formData,
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  @override
  Future<Map<String, dynamic>> updateSubmissionMetadata({
    required String submissionId,
    required FilmShootingParams shootingParams,
    FilmDevScanParams? devScanParams,
  }) async {
    try {
      final map = <String, dynamic>{
        'cameraBody': shootingParams.cameraBody,
        'filmBrand': shootingParams.filmBrand,
        'filmStock': shootingParams.filmStock,
        'filmFormat': shootingParams.filmFormat,
        'isoRated': shootingParams.isoRated,
        'isoShot': shootingParams.isoShot,
      };

      if (shootingParams.lens != null && shootingParams.lens!.isNotEmpty) {
        map['lens'] = shootingParams.lens;
      }
      if (shootingParams.frameNumber != null &&
          shootingParams.frameNumber!.isNotEmpty) {
        map['frameNumber'] = shootingParams.frameNumber;
      }
      if (shootingParams.rollId != null && shootingParams.rollId!.isNotEmpty) {
        map['rollId'] = shootingParams.rollId;
      }
      if (shootingParams.location != null &&
          shootingParams.location!.isNotEmpty) {
        map['location'] = shootingParams.location;
      }
      if (shootingParams.notes != null && shootingParams.notes!.isNotEmpty) {
        map['notes'] = shootingParams.notes;
      }

      // Dev & Scan metadata
      if (devScanParams?.labName != null && devScanParams!.labName.isNotEmpty) {
        map['devLabName'] = devScanParams.labName;
      }
      if (devScanParams?.scannerModel != null &&
          devScanParams!.scannerModel.isNotEmpty) {
        map['scannerModel'] = devScanParams.scannerModel;
      }
      if (devScanParams?.scanResolution != null &&
          devScanParams!.scanResolution.isNotEmpty) {
        map['scanResolution'] = devScanParams.scanResolution;
      }
      if (devScanParams?.devChemistry != null &&
          devScanParams!.devChemistry!.isNotEmpty) {
        map['devChemistry'] = devScanParams.devChemistry;
      }
      if (devScanParams?.scanFormat != null &&
          devScanParams!.scanFormat!.isNotEmpty) {
        map['scanFormat'] = devScanParams.scanFormat;
      }
      if (devScanParams?.notes != null && devScanParams!.notes!.isNotEmpty) {
        map['devNotes'] = devScanParams.notes;
      }

      final response = await _dio.put<Map<String, dynamic>>(
        '/api/v1/submissions/$submissionId/metadata',
        data: map,
      );

      return response.data ?? const <String, dynamic>{};
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }
}

final submissionRepositoryProvider = Provider<SubmissionRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return ApiSubmissionRepository(client.dio);
});

final submissionMetadataRepositoryProvider =
    Provider<SubmissionMetadataRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return ApiSubmissionRepository(client.dio);
});
