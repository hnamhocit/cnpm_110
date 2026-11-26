import 'package:flutter/material.dart';

/// Giải thưởng đã đạt của cá nhân trong lịch sử các cuộc thi (FPC-101 / SCR-PAR-08)
class UserAward {
  const UserAward({
    required this.id,
    required this.contestId,
    required this.contestName,
    required this.award,
    required this.awardRank,
    required this.awardTitle,
    required this.submissionId,
    required this.submissionTitle,
    required this.photoUrl,
    required this.finalScore,
    this.filmStock,
    this.camera,
    this.lens,
    this.filmFormat,
    this.developmentLab,
    this.juryCritique,
    this.awardedAt,
  });

  final String id;
  final String contestId;
  final String contestName;
  final String award;
  final int awardRank;
  final String awardTitle;
  final String submissionId;
  final String submissionTitle;
  final String photoUrl;
  final double finalScore;
  final String? filmStock;
  final String? camera;
  final String? lens;
  final String? filmFormat;
  final String? developmentLab;
  final String? juryCritique;
  final DateTime? awardedAt;

  bool get isGold => awardRank == 1 || award.toUpperCase() == 'GOLD';
  bool get isSilver => awardRank == 2 || award.toUpperCase() == 'SILVER';
  bool get isBronze => awardRank == 3 || award.toUpperCase() == 'BRONZE';

  String get rankEmoji => switch (awardRank) {
        1 => '🥇',
        2 => '🥈',
        3 => '🥉',
        _ => '🎖️',
      };

  Color get tierColor => switch (awardRank) {
        1 => const Color(0xFFFFD700),
        2 => const Color(0xFFC0C0C0),
        3 => const Color(0xFFCD7F32),
        _ => const Color(0xFF64B5F6),
      };

  String get formattedScore => '${finalScore.toStringAsFixed(2)} / 10';

  factory UserAward.fromJson(Map<String, dynamic> json) {
    final rawScore = json['finalScore'] ?? json['final_score'] ?? 0;
    final double parsedScore = rawScore is num
        ? rawScore.toDouble()
        : double.tryParse(rawScore.toString()) ?? 0.0;

    final rawRank = json['awardRank'] ?? json['award_rank'] ?? 1;
    final int parsedRank = rawRank is int
        ? rawRank
        : int.tryParse(rawRank.toString()) ?? 1;

    return UserAward(
      id: (json['id'] ?? '') as String,
      contestId: (json['contestId'] ?? json['contest_id'] ?? '') as String,
      contestName: (json['contestName'] ?? json['contest_name'] ?? 'Cuộc thi Phim') as String,
      award: (json['award'] ?? 'HONORABLE_MENTION') as String,
      awardRank: parsedRank,
      awardTitle: (json['awardTitle'] ?? json['award_title'] ?? 'Giải Thưởng') as String,
      submissionId: (json['submissionId'] ?? json['submission_id'] ?? '') as String,
      submissionTitle: (json['submissionTitle'] ?? json['submission_title'] ?? 'Tác phẩm') as String,
      photoUrl: (json['photoUrl'] ?? json['photo_url'] ?? '') as String,
      finalScore: parsedScore,
      filmStock: (json['filmStock'] ?? json['film_stock']) as String?,
      camera: (json['camera'] ?? json['camera_body']) as String?,
      lens: json['lens'] as String?,
      filmFormat: (json['filmFormat'] ?? json['film_format']) as String?,
      developmentLab: (json['developmentLab'] ?? json['dev_lab']) as String?,
      juryCritique: (json['juryCritique'] ?? json['jury_critique']) as String?,
      awardedAt: json['awardedAt'] != null || json['awarded_at'] != null
          ? DateTime.tryParse((json['awardedAt'] ?? json['awarded_at']) as String)?.toLocal()
          : null,
    );
  }
}

/// Thống kê Portfolio cá nhân
class PortfolioStats {
  const PortfolioStats({
    required this.totalSubmissions,
    required this.approvedWorks,
    required this.awardsCount,
  });

  final int totalSubmissions;
  final int approvedWorks;
  final int awardsCount;

  factory PortfolioStats.fromJson(Map<String, dynamic> json) {
    return PortfolioStats(
      totalSubmissions: (json['totalSubmissions'] ?? json['total_submissions'] ?? 0) as int,
      approvedWorks: (json['approvedWorks'] ?? json['approved_works'] ?? 0) as int,
      awardsCount: (json['awardsCount'] ?? json['awards_count'] ?? 0) as int,
    );
  }
}

/// Tác phẩm trưng bày trong Portfolio
class CuratedWork {
  const CuratedWork({
    required this.id,
    required this.title,
    required this.photoUrl,
    this.contestName,
    this.filmStock,
    this.camera,
    this.lens,
    this.filmFormat,
    this.status = 'APPROVED',
  });

  final String id;
  final String title;
  final String photoUrl;
  final String? contestName;
  final String? filmStock;
  final String? camera;
  final String? lens;
  final String? filmFormat;
  final String status;

  factory CuratedWork.fromJson(Map<String, dynamic> json) {
    return CuratedWork(
      id: (json['id'] ?? '') as String,
      title: (json['title'] ?? 'Tác phẩm') as String,
      photoUrl: (json['photoUrl'] ?? json['photo_url'] ?? '') as String,
      contestName: (json['contestName'] ?? json['contest_name']) as String?,
      filmStock: (json['filmStock'] ?? json['film_stock']) as String?,
      camera: json['camera'] as String?,
      lens: json['lens'] as String?,
      filmFormat: (json['filmFormat'] ?? json['film_format']) as String?,
      status: (json['status'] ?? 'APPROVED') as String,
    );
  }
}

/// Portfolio toàn diện của người dùng (FPC-101)
class UserPortfolio {
  const UserPortfolio({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.createdAt,
    this.avatarUrl,
    required this.stats,
    required this.awards,
    required this.curatedWorks,
  });

  final String id;
  final String fullName;
  final String email;
  final String role;
  final DateTime? createdAt;
  final String? avatarUrl;
  final PortfolioStats stats;
  final List<UserAward> awards;
  final List<CuratedWork> curatedWorks;

  factory UserPortfolio.fromJson(Map<String, dynamic> json) {
    final user = (json['user'] as Map<String, dynamic>?) ?? json;
    final rawStats = (json['stats'] as Map<String, dynamic>?) ?? {};
    final rawAwards = (json['awards'] as List<dynamic>?) ?? [];
    final rawWorks = (json['curatedWorks'] as List<dynamic>?) ?? [];

    return UserPortfolio(
      id: (user['id'] ?? '') as String,
      fullName: (user['fullName'] ?? user['full_name'] ?? 'Nhiếp ảnh gia') as String,
      email: (user['email'] ?? '') as String,
      role: (user['role'] ?? 'Participant') as String,
      avatarUrl: user['avatarUrl'] as String?,
      createdAt: user['createdAt'] != null || user['created_at'] != null
          ? DateTime.tryParse((user['createdAt'] ?? user['created_at']) as String)?.toLocal()
          : null,
      stats: PortfolioStats.fromJson(rawStats),
      awards: rawAwards
          .whereType<Map<String, dynamic>>()
          .map(UserAward.fromJson)
          .toList(),
      curatedWorks: rawWorks
          .whereType<Map<String, dynamic>>()
          .map(CuratedWork.fromJson)
          .toList(),
    );
  }

  factory UserPortfolio.fromAuthAndSubmissions({
    required String id,
    required String fullName,
    required String email,
    required String role,
    DateTime? createdAt,
    int totalSubmissions = 0,
    int approvedWorks = 0,
    List<UserAward> awards = const [],
    List<CuratedWork> curatedWorks = const [],
  }) {
    return UserPortfolio(
      id: id,
      fullName: fullName,
      email: email,
      role: role,
      createdAt: createdAt,
      stats: PortfolioStats(
        totalSubmissions: totalSubmissions,
        approvedWorks: approvedWorks,
        awardsCount: awards.length,
      ),
      awards: awards,
      curatedWorks: curatedWorks,
    );
  }
}
