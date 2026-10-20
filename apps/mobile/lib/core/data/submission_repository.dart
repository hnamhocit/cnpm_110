import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/submission_data.dart';
import '../network/api_exception.dart';
import '../providers/api_client_provider.dart';

abstract interface class SubmissionRepository {
  Future<SubmissionResult> uploadSubmission(
    SubmissionData data, {
    void Function(int sent, int total)? onSendProgress,
  });
}

class ApiSubmissionRepository implements SubmissionRepository {
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
}

final submissionRepositoryProvider = Provider<SubmissionRepository>((ref) {
  final client = ref.watch(apiClientProvider);
  return ApiSubmissionRepository(client.dio);
});
