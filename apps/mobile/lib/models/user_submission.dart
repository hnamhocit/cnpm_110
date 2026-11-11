import 'package:flutter/material.dart';

enum ModerationStatusGroup {
  pending('Đang chờ duyệt'),
  approved('Hợp lệ'),
  rejected('Bị từ chối');

  const ModerationStatusGroup(this.label);
  final String label;
}

enum SubmissionStatus {
  pendingAi,
  aiFlagged,
  proofRequested,
  proofSubmitted,
  approved,
  disqualified,
  disqualifiedNoProof,
  withdrawn;

  static SubmissionStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING_AI':
      case 'SUBMITTED':
      case 'VERIFYING_AI':
        return SubmissionStatus.pendingAi;
      case 'FLAGGED':
      case 'AI_FLAGGED':
        return SubmissionStatus.aiFlagged;
      case 'PROOF_REQUESTED':
        return SubmissionStatus.proofRequested;
      case 'PROOF_SUBMITTED':
        return SubmissionStatus.proofSubmitted;
      case 'APPROVED':
      case 'APPROVED_FOR_JUDGING':
        return SubmissionStatus.approved;
      case 'DISQUALIFIED':
        return SubmissionStatus.disqualified;
      case 'DISQUALIFIED_NO_PROOF':
        return SubmissionStatus.disqualifiedNoProof;
      case 'WITHDRAWN':
        return SubmissionStatus.withdrawn;
      default:
        return SubmissionStatus.pendingAi;
    }
  }

  ModerationStatusGroup get moderationGroup {
    switch (this) {
      case SubmissionStatus.pendingAi:
      case SubmissionStatus.aiFlagged:
      case SubmissionStatus.proofRequested:
      case SubmissionStatus.proofSubmitted:
        return ModerationStatusGroup.pending;
      case SubmissionStatus.approved:
        return ModerationStatusGroup.approved;
      case SubmissionStatus.disqualified:
      case SubmissionStatus.disqualifiedNoProof:
      case SubmissionStatus.withdrawn:
        return ModerationStatusGroup.rejected;
    }
  }

  String get moderationGroupLabel => moderationGroup.label;

  String get label {
    switch (this) {
      case SubmissionStatus.pendingAi:
        return 'Đang chờ duyệt';
      case SubmissionStatus.aiFlagged:
        return 'Cảnh báo AI';
      case SubmissionStatus.proofRequested:
        return 'Cần nộp âm bản';
      case SubmissionStatus.proofSubmitted:
        return 'Đã nộp âm bản';
      case SubmissionStatus.approved:
        return 'Hợp lệ';
      case SubmissionStatus.disqualified:
        return 'Bị từ chối';
      case SubmissionStatus.disqualifiedNoProof:
        return 'Bị từ chối (quá hạn âm bản)';
      case SubmissionStatus.withdrawn:
        return 'Đã rút';
    }
  }

  Color getBadgeColor(ColorScheme colorScheme) {
    switch (this) {
      case SubmissionStatus.pendingAi:
        return Colors.amber.shade800;
      case SubmissionStatus.aiFlagged:
        return Colors.orange.shade900;
      case SubmissionStatus.proofRequested:
        return colorScheme.error;
      case SubmissionStatus.proofSubmitted:
        return Colors.blue.shade700;
      case SubmissionStatus.approved:
        return Colors.green.shade700;
      case SubmissionStatus.disqualified:
      case SubmissionStatus.disqualifiedNoProof:
        return colorScheme.error;
      case SubmissionStatus.withdrawn:
        return colorScheme.outline;
    }
  }

  Color getBadgeBackgroundColor(ColorScheme colorScheme) {
    switch (this) {
      case SubmissionStatus.pendingAi:
        return Colors.amber.shade50;
      case SubmissionStatus.aiFlagged:
        return Colors.orange.shade50;
      case SubmissionStatus.proofRequested:
        return colorScheme.errorContainer.withValues(alpha: 0.3);
      case SubmissionStatus.proofSubmitted:
        return Colors.blue.shade50;
      case SubmissionStatus.approved:
        return Colors.green.shade50;
      case SubmissionStatus.disqualified:
      case SubmissionStatus.disqualifiedNoProof:
        return colorScheme.errorContainer.withValues(alpha: 0.2);
      case SubmissionStatus.withdrawn:
        return colorScheme.surfaceContainerHighest;
    }
  }

  IconData get icon {
    switch (this) {
      case SubmissionStatus.pendingAi:
        return Icons.hourglass_top_rounded;
      case SubmissionStatus.aiFlagged:
        return Icons.warning_amber_rounded;
      case SubmissionStatus.proofRequested:
        return Icons.report_problem_rounded;
      case SubmissionStatus.proofSubmitted:
        return Icons.mark_email_read_rounded;
      case SubmissionStatus.approved:
        return Icons.check_circle_rounded;
      case SubmissionStatus.disqualified:
      case SubmissionStatus.disqualifiedNoProof:
        return Icons.cancel_rounded;
      case SubmissionStatus.withdrawn:
        return Icons.remove_circle_outline_rounded;
    }
  }

  bool get isUrgent => this == SubmissionStatus.proofRequested;
}

class SubmissionFilmMetadata {
  const SubmissionFilmMetadata({
    this.filmBrand,
    this.filmStock,
    this.filmFormat,
    this.isoRated,
    this.isoShot,
    this.cameraBody,
    this.lens,
    this.rollId,
    this.frameNumber,
    this.devLabName,
    this.devChemistry,
    this.scannerModel,
  });

  factory SubmissionFilmMetadata.fromJson(Map<String, dynamic> json) {
    dynamic getField(String camel, String snake) => json[camel] ?? json[snake];

    final rated = getField('isoRated', 'iso_rated');
    final shot = getField('isoShot', 'iso_shot');

    return SubmissionFilmMetadata(
      filmBrand: getField('filmBrand', 'film_brand') as String?,
      filmStock: getField('filmStock', 'film_stock') as String?,
      filmFormat: getField('filmFormat', 'film_format') as String?,
      isoRated: rated is int
          ? rated
          : (rated != null ? int.tryParse(rated.toString()) : null),
      isoShot: shot is int
          ? shot
          : (shot != null ? int.tryParse(shot.toString()) : null),
      cameraBody: getField('cameraBody', 'camera_body') as String?,
      lens: json['lens'] as String?,
      rollId: getField('rollId', 'roll_id') as String?,
      frameNumber: getField('frameNumber', 'frame_number')?.toString(),
      devLabName: getField('devLabName', 'dev_lab_name') as String?,
      devChemistry: getField('devChemistry', 'dev_chemistry') as String?,
      scannerModel: getField('scannerModel', 'scanner_model') as String?,
    );
  }

  final String? filmBrand;
  final String? filmStock;
  final String? filmFormat;
  final int? isoRated;
  final int? isoShot;
  final String? cameraBody;
  final String? lens;
  final String? rollId;
  final String? frameNumber;
  final String? devLabName;
  final String? devChemistry;
  final String? scannerModel;

  Map<String, dynamic> toJson() {
    return {
      if (filmBrand != null) 'filmBrand': filmBrand,
      if (filmStock != null) 'filmStock': filmStock,
      if (filmFormat != null) 'filmFormat': filmFormat,
      if (isoRated != null) 'isoRated': isoRated,
      if (isoShot != null) 'isoShot': isoShot,
      if (cameraBody != null) 'cameraBody': cameraBody,
      if (lens != null) 'lens': lens,
      if (rollId != null) 'rollId': rollId,
      if (frameNumber != null) 'frameNumber': frameNumber,
      if (devLabName != null) 'devLabName': devLabName,
      if (devChemistry != null) 'devChemistry': devChemistry,
      if (scannerModel != null) 'scannerModel': scannerModel,
    };
  }

  String get summary {
    final parts = <String>[];
    if (filmStock != null && filmStock!.isNotEmpty) {
      if (filmBrand != null && filmBrand!.isNotEmpty && !filmStock!.startsWith(filmBrand!)) {
        parts.add('$filmBrand $filmStock');
      } else {
        parts.add(filmStock!);
      }
    } else if (filmBrand != null && filmBrand!.isNotEmpty) {
      parts.add(filmBrand!);
    }
    if (cameraBody != null && cameraBody!.isNotEmpty) {
      parts.add(cameraBody!);
    }
    if (frameNumber != null && frameNumber!.isNotEmpty) {
      parts.add('Frame #$frameNumber');
    }
    return parts.join(' • ');
  }
}

class UserSubmission {
  const UserSubmission({
    required this.id,
    this.submissionCode,
    required this.contestId,
    this.contestTitle,
    required this.categoryId,
    this.categoryName,
    this.participantId,
    required this.title,
    this.description,
    this.rejectionReason,
    required this.imageOriginalPath,
    this.imagePreviewPath,
    this.negativeProofPath,
    this.fileSizeBytes,
    this.width,
    this.height,
    required this.status,
    this.rawStatus,
    this.aiFlagged = false,
    this.filmMetadata,
    this.createdAt,
    this.updatedAt,
    this.proofRequestedAt,
    this.proofDeadlineAt,
  });

  factory UserSubmission.fromJson(Map<String, dynamic> json) {
    dynamic getField(String camel, String snake) => json[camel] ?? json[snake];

    final rawStatusStr = (getField('status', 'submission_status') as String?) ?? 'PENDING_AI';
    final metadataRaw = getField('filmMetadata', 'film_metadata') as Map<String, dynamic>?;

    final filmMetadata = metadataRaw != null
        ? SubmissionFilmMetadata.fromJson(metadataRaw)
        : ((getField('filmStock', 'film_stock') != null || getField('cameraBody', 'camera_body') != null)
            ? SubmissionFilmMetadata.fromJson(json)
            : null);

    DateTime? parseDate(dynamic val) {
      if (val == null) return null;
      if (val is DateTime) return val;
      if (val is String && val.isNotEmpty) {
        return DateTime.tryParse(val)?.toLocal();
      }
      return null;
    }

    final fileSize = getField('fileSizeBytes', 'file_size_bytes');
    final widthVal = json['width'] ?? json['width_px'];
    final heightVal = json['height'] ?? json['height_px'];

    return UserSubmission(
      id: (json['id'] as String?) ?? '',
      submissionCode: (getField('submissionCode', 'submission_code') as String?) ??
          (json['code'] as String?),
      contestId: (getField('contestId', 'contest_id') as String?) ?? '',
      contestTitle: (getField('contestTitle', 'contest_title') as String?),
      categoryId: (getField('categoryId', 'category_id') as String?) ?? '',
      categoryName: (getField('categoryName', 'category_name') as String?),
      participantId: (getField('participantId', 'participant_id') as String?),
      title: (json['title'] as String?) ?? 'Tác phẩm chưa đặt tên',
      description: json['description'] as String?,
      rejectionReason: getField('rejectionReason', 'rejection_reason') as String?,
      imageOriginalPath: (getField('imageOriginalPath', 'image_original_path') as String?) ?? '',
      imagePreviewPath: getField('imagePreviewPath', 'image_preview_path') as String?,
      negativeProofPath: getField('negativeProofPath', 'negative_proof_path') as String?,
      fileSizeBytes: fileSize is int
          ? fileSize
          : (fileSize != null ? int.tryParse(fileSize.toString()) : null),
      width: widthVal is int
          ? widthVal
          : (widthVal != null ? int.tryParse(widthVal.toString()) : null),
      height: heightVal is int
          ? heightVal
          : (heightVal != null ? int.tryParse(heightVal.toString()) : null),
      status: SubmissionStatus.fromString(rawStatusStr),
      rawStatus: rawStatusStr,
      aiFlagged: (getField('aiFlagged', 'ai_flagged') as bool?) ?? false,
      filmMetadata: filmMetadata,
      createdAt: parseDate(json['createdAt'] ?? json['created_at'] ?? json['submittedAt'] ?? json['submitted_at']),
      updatedAt: parseDate(json['updatedAt'] ?? json['updated_at']),
      proofRequestedAt: parseDate(json['proofRequestedAt'] ?? json['proof_requested_at']),
      proofDeadlineAt: parseDate(json['proofDeadlineAt'] ?? json['proof_deadline_at']),
    );
  }

  final String id;
  final String? submissionCode;
  final String contestId;
  final String? contestTitle;
  final String categoryId;
  final String? categoryName;
  final String? participantId;
  final String title;
  final String? description;
  final String? rejectionReason;
  final String imageOriginalPath;
  final String? imagePreviewPath;
  final String? negativeProofPath;
  final int? fileSizeBytes;
  final int? width;
  final int? height;
  final SubmissionStatus status;
  final String? rawStatus;
  final bool aiFlagged;
  final SubmissionFilmMetadata? filmMetadata;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? proofRequestedAt;
  final DateTime? proofDeadlineAt;

  String get displayCode {
    if (submissionCode != null && submissionCode!.isNotEmpty) {
      return submissionCode!;
    }
    if (id.length >= 8) {
      return 'SUB-${id.substring(0, 8).toUpperCase()}';
    }
    return 'SUB-$id';
  }

  String get formattedFileSize {
    if (fileSizeBytes == null || fileSizeBytes! <= 0) return '';
    const bytesInMb = 1024 * 1024;
    final mb = fileSizeBytes! / bytesInMb;
    return '${mb.toStringAsFixed(1)} MB';
  }

  String get formattedResolution {
    if (width == null || height == null) return '';
    return '$width × $height px';
  }

  Duration? get remainingProofDuration {
    if (proofDeadlineAt == null) return null;
    final diff = proofDeadlineAt!.difference(DateTime.now());
    return diff.isNegative ? Duration.zero : diff;
  }

  String? get remainingProofText {
    final remaining = remainingProofDuration;
    if (remaining == null) return null;
    if (remaining == Duration.zero) return 'Đã hết hạn 48 giờ nộp âm bản';
    final hours = remaining.inHours;
    final minutes = remaining.inMinutes % 60;
    if (hours > 0) {
      return 'Còn lại $hours giờ $minutes phút (BR-19)';
    }
    return 'Còn lại $minutes phút (BR-19)';
  }

  String get bestDisplayImagePath {
    if (imagePreviewPath != null && imagePreviewPath!.isNotEmpty) {
      return imagePreviewPath!;
    }
    return imageOriginalPath;
  }

  bool get hasProofAttached {
    return negativeProofPath != null && negativeProofPath!.isNotEmpty;
  }
}
