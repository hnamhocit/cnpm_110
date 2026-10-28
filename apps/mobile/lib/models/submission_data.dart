import 'film_dev_scan_params.dart';
import 'film_shooting_params.dart';
import 'image_attachment.dart';

class SubmissionData {
  const SubmissionData({
    required this.contestId,
    required this.categoryId,
    required this.title,
    this.description,
    required this.scanImage,
    this.negativeProof,
    this.shootingParams,
    this.devScanParams,
  });

  final String contestId;
  final String categoryId;
  final String title;
  final String? description;
  final ImageAttachment scanImage;
  final ImageAttachment? negativeProof;
  final FilmShootingParams? shootingParams;
  final FilmDevScanParams? devScanParams;

  SubmissionData copyWith({
    String? contestId,
    String? categoryId,
    String? title,
    String? description,
    ImageAttachment? scanImage,
    ImageAttachment? negativeProof,
    FilmShootingParams? shootingParams,
    FilmDevScanParams? devScanParams,
  }) {
    return SubmissionData(
      contestId: contestId ?? this.contestId,
      categoryId: categoryId ?? this.categoryId,
      title: title ?? this.title,
      description: description ?? this.description,
      scanImage: scanImage ?? this.scanImage,
      negativeProof: negativeProof ?? this.negativeProof,
      shootingParams: shootingParams ?? this.shootingParams,
      devScanParams: devScanParams ?? this.devScanParams,
    );
  }
}

class SubmissionResult {
  const SubmissionResult({
    required this.id,
    required this.contestId,
    required this.categoryId,
    required this.title,
    required this.imageOriginalPath,
    this.negativeProofPath,
    this.status = 'PENDING_AI',
    this.message,
  });

  factory SubmissionResult.fromJson(Map<String, dynamic> json) {
    return SubmissionResult(
      id: json['id'] as String? ?? '',
      contestId: json['contestId'] as String? ?? '',
      categoryId: json['categoryId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      imageOriginalPath: json['imageOriginalPath'] as String? ?? '',
      negativeProofPath: json['negativeProofPath'] as String?,
      status: json['status'] as String? ?? 'PENDING_AI',
      message: json['message'] as String?,
    );
  }

  final String id;
  final String contestId;
  final String categoryId;
  final String title;
  final String imageOriginalPath;
  final String? negativeProofPath;
  final String status;
  final String? message;
}
