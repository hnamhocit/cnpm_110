import 'package:flutter/material.dart';

/// Hạng giải thưởng chính thức (BR-16 & DTO 4.9.4)
enum AwardTier {
  gold('Giải Nhất (Gold)', 1, Color(0xFFFFD700), Color(0xFFFFF8E1), '🥇'),
  silver('Giải Nhì (Silver)', 2, Color(0xFFC0C0C0), Color(0xFFECEFF1), '🥈'),
  bronze('Giải Ba (Bronze)', 3, Color(0xFFCD7F32), Color(0xFFEFEBE9), '🥉'),
  honorableMention('Giải Khuyến Khích', 4, Color(0xFF64B5F6), Color(0xFFE3F2FD), '🎖️'),
  other('Giải Thưởng', 99, Color(0xFF90A4AE), Color(0xFFECEFF1), '🏆');

  const AwardTier(
    this.label,
    this.rank,
    this.primaryColor,
    this.backgroundColor,
    this.emoji,
  );

  final String label;
  final int rank;
  final Color primaryColor;
  final Color backgroundColor;
  final String emoji;

  static AwardTier fromRankOrCode(int rank, [String? code]) {
    final normalized = (code ?? '').toUpperCase();
    if (rank == 1 || normalized == 'GOLD' || normalized.contains('NHẤT') || normalized.contains('FIRST')) {
      return AwardTier.gold;
    }
    if (rank == 2 || normalized == 'SILVER' || normalized.contains('NHÌ') || normalized.contains('SECOND')) {
      return AwardTier.silver;
    }
    if (rank == 3 || normalized == 'BRONZE' || normalized.contains('BA') || normalized.contains('THIRD')) {
      return AwardTier.bronze;
    }
    if (rank == 4 || normalized == 'HONORABLE_MENTION' || normalized.contains('KHUYẾN KHÍCH')) {
      return AwardTier.honorableMention;
    }
    return AwardTier.other;
  }
}

/// Thông tin một tác phẩm đạt giải trên Bảng vàng vinh danh (SCR-PAR-08)
class ContestWinner {
  const ContestWinner({
    required this.submissionId,
    this.contestId,
    this.contestName,
    required this.award,
    required this.awardRank,
    required this.awardTitle,
    required this.title,
    required this.authorName,
    required this.photoUrl,
    this.filmStock,
    this.camera,
    this.lens,
    this.filmFormat,
    this.developmentLab,
    required this.finalScore,
    this.juryCritique,
    this.isProofVerified = true,
    this.isResultsLocked = true,
    this.publishedAt,
  });

  final String submissionId;
  final String? contestId;
  final String? contestName;
  final String award;
  final int awardRank;
  final String awardTitle;
  final String title;
  final String authorName;
  final String photoUrl;
  final String? filmStock;
  final String? camera;
  final String? lens;
  final String? filmFormat;
  final String? developmentLab;
  final double finalScore;
  final String? juryCritique;

  /// BR-06: Xác nhận tác phẩm đã xác minh bằng chứng âm bản
  final bool isProofVerified;

  /// BR-16: Điểm số và thông tin bài thi đã khóa (Read-Only)
  final bool isResultsLocked;

  final DateTime? publishedAt;

  AwardTier get tier => AwardTier.fromRankOrCode(awardRank, award);
  bool get isPodium => awardRank <= 3;
  bool get isGold => awardRank == 1;
  bool get isSilver => awardRank == 2;
  bool get isBronze => awardRank == 3;
  String get rankEmoji => tier.emoji;
  String get formattedScore => '${finalScore.toStringAsFixed(2)} / 10';

  factory ContestWinner.fromJson(Map<String, dynamic> json) {
    final rawScore = json['finalScore'] ?? json['final_score'] ?? json['score'] ?? 0;
    final double parsedScore = rawScore is num
        ? rawScore.toDouble()
        : double.tryParse(rawScore.toString()) ?? 0.0;

    final rawRank = json['awardRank'] ?? json['award_rank'] ?? json['rank'] ?? 1;
    final int parsedRank = rawRank is int
        ? rawRank
        : int.tryParse(rawRank.toString()) ?? 1;

    return ContestWinner(
      submissionId: (json['submissionId'] ?? json['submission_id'] ?? json['id'] ?? '') as String,
      contestId: (json['contestId'] ?? json['contest_id']) as String?,
      contestName: (json['contestName'] ?? json['contest_name']) as String?,
      award: (json['award'] ?? 'HONORABLE_MENTION') as String,
      awardRank: parsedRank,
      awardTitle: (json['awardTitle'] ?? json['award_title'] ?? json['award'] ?? 'Giải Thưởng') as String,
      title: (json['title'] ?? 'Tác phẩm không tên') as String,
      authorName: (json['authorName'] ?? json['author_name'] ?? 'Nghệ sĩ ẩn danh') as String,
      photoUrl: (json['photoUrl'] ?? json['photo_url'] ?? json['imageUrl'] ?? '') as String,
      filmStock: (json['filmStock'] ?? json['film_stock']) as String?,
      camera: (json['camera'] ?? json['camera_body']) as String?,
      lens: json['lens'] as String?,
      filmFormat: (json['filmFormat'] ?? json['film_format']) as String?,
      developmentLab: (json['developmentLab'] ?? json['dev_lab'] ?? json['dev_lab_name']) as String?,
      finalScore: parsedScore,
      juryCritique: (json['juryCritique'] ?? json['jury_critique'] ?? json['critique']) as String?,
      isProofVerified: json['isProofVerified'] ?? json['is_proof_verified'] ?? true,
      isResultsLocked: json['resultsLocked'] ?? json['is_results_locked'] ?? true,
      publishedAt: json['publishedAt'] != null
          ? DateTime.tryParse(json['publishedAt'] as String)?.toLocal()
          : null,
    );
  }
}

/// Dữ liệu toàn diện của Bảng vàng kết quả cuộc thi (DTO 4.9.4)
class ContestResults {
  const ContestResults({
    required this.contestId,
    required this.contestName,
    required this.status,
    required this.resultsLocked,
    required this.winners,
  });

  final String contestId;
  final String contestName;
  final String status;
  final bool resultsLocked;
  final List<ContestWinner> winners;

  ContestWinner? get goldWinner {
    try {
      return winners.firstWhere((w) => w.awardRank == 1);
    } catch (_) {
      return null;
    }
  }

  ContestWinner? get silverWinner {
    try {
      return winners.firstWhere((w) => w.awardRank == 2);
    } catch (_) {
      return null;
    }
  }

  ContestWinner? get bronzeWinner {
    try {
      return winners.firstWhere((w) => w.awardRank == 3);
    } catch (_) {
      return null;
    }
  }

  List<ContestWinner> get podiumWinners =>
      winners.where((w) => w.isPodium).toList()
        ..sort((a, b) => a.awardRank.compareTo(b.awardRank));

  List<ContestWinner> get otherWinners =>
      winners.where((w) => !w.isPodium).toList()
        ..sort((a, b) => a.awardRank.compareTo(b.awardRank));

  factory ContestResults.fromJson(Map<String, dynamic> json) {
    final rawWinners = json['winners'] as List<dynamic>? ?? const [];
    final parsedWinners = rawWinners
        .whereType<Map<String, dynamic>>()
        .map(ContestWinner.fromJson)
        .toList()
      ..sort((a, b) => a.awardRank.compareTo(b.awardRank));

    return ContestResults(
      contestId: (json['contestId'] ?? json['contest_id'] ?? '') as String,
      contestName: (json['contestName'] ?? json['contest_name'] ?? 'Bảng Vàng Vinh Danh') as String,
      status: (json['status'] ?? 'published') as String,
      resultsLocked: (json['resultsLocked'] ?? json['results_locked'] ?? true) as bool,
      winners: parsedWinners,
    );
  }
}
