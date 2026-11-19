import 'package:flutter_application_2/models/contest_winner.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ContestWinner and ContestResults Models (FPC-100)', () {
    test('ContestWinner.fromJson parses all fields correctly', () {
      final json = {
        'submissionId': 'sub-1001',
        'contestId': 'contest-01',
        'contestName': 'Cuộc thi Phim Mùa Thu 2026',
        'award': 'GOLD',
        'awardRank': 1,
        'awardTitle': 'Giải Nhất (Gold Award)',
        'title': 'Sương Sớm Ba Vì',
        'authorName': 'Đỗ Hoàng Long',
        'photoUrl': 'https://example.com/sapa.jpg',
        'filmStock': 'Kodak Portra 400',
        'camera': 'Leica M6',
        'lens': 'Summicron 35mm f/2',
        'filmFormat': '135',
        'developmentLab': 'LLab Saigon',
        'finalScore': 9.75,
        'juryCritique': 'Chất lượng đo sáng và tương phản tuyệt đối.',
        'isProofVerified': true,
        'resultsLocked': true,
      };

      final winner = ContestWinner.fromJson(json);

      expect(winner.submissionId, 'sub-1001');
      expect(winner.contestId, 'contest-01');
      expect(winner.contestName, 'Cuộc thi Phim Mùa Thu 2026');
      expect(winner.award, 'GOLD');
      expect(winner.awardRank, 1);
      expect(winner.isGold, true);
      expect(winner.isSilver, false);
      expect(winner.isBronze, false);
      expect(winner.isPodium, true);
      expect(winner.title, 'Sương Sớm Ba Vì');
      expect(winner.authorName, 'Đỗ Hoàng Long');
      expect(winner.filmStock, 'Kodak Portra 400');
      expect(winner.camera, 'Leica M6');
      expect(winner.lens, 'Summicron 35mm f/2');
      expect(winner.filmFormat, '135');
      expect(winner.developmentLab, 'LLab Saigon');
      expect(winner.finalScore, 9.75);
      expect(winner.formattedScore, '9.75 / 10');
      expect(winner.juryCritique, 'Chất lượng đo sáng và tương phản tuyệt đối.');
      expect(winner.isProofVerified, true);
      expect(winner.isResultsLocked, true);
      expect(winner.rankEmoji, '🥇');
    });

    test('AwardTier correctly categorizes ranks and codes', () {
      expect(AwardTier.fromRankOrCode(1), AwardTier.gold);
      expect(AwardTier.fromRankOrCode(2), AwardTier.silver);
      expect(AwardTier.fromRankOrCode(3), AwardTier.bronze);
      expect(AwardTier.fromRankOrCode(4), AwardTier.honorableMention);
      expect(AwardTier.fromRankOrCode(5), AwardTier.other);

      expect(AwardTier.fromRankOrCode(99, 'GOLD'), AwardTier.gold);
      expect(AwardTier.fromRankOrCode(99, 'SILVER'), AwardTier.silver);
      expect(AwardTier.fromRankOrCode(99, 'BRONZE'), AwardTier.bronze);
    });

    test('ContestResults.fromJson parses contest info and sorts winners', () {
      final json = {
        'contestId': 'contest-01',
        'contestName': 'Cuộc thi Phim Mùa Thu 2026',
        'status': 'published',
        'resultsLocked': true,
        'winners': [
          {
            'submissionId': 'sub-bronze',
            'award': 'BRONZE',
            'awardRank': 3,
            'awardTitle': 'Giải Ba',
            'title': 'Chiều Muộn',
            'authorName': 'Tác giả 3',
            'photoUrl': 'https://example.com/3.jpg',
            'finalScore': 9.15,
          },
          {
            'submissionId': 'sub-gold',
            'award': 'GOLD',
            'awardRank': 1,
            'awardTitle': 'Giải Nhất',
            'title': 'Bình Minh',
            'authorName': 'Tác giả 1',
            'photoUrl': 'https://example.com/1.jpg',
            'finalScore': 9.80,
          },
          {
            'submissionId': 'sub-silver',
            'award': 'SILVER',
            'awardRank': 2,
            'awardTitle': 'Giải Nhì',
            'title': 'Hoàng Hôn',
            'authorName': 'Tác giả 2',
            'photoUrl': 'https://example.com/2.jpg',
            'finalScore': 9.40,
          },
          {
            'submissionId': 'sub-hm',
            'award': 'HONORABLE_MENTION',
            'awardRank': 4,
            'awardTitle': 'Giải Khuyến Khích',
            'title': 'Góc Phố',
            'authorName': 'Tác giả 4',
            'photoUrl': 'https://example.com/4.jpg',
            'finalScore': 8.70,
          },
        ],
      };

      final results = ContestResults.fromJson(json);

      expect(results.contestId, 'contest-01');
      expect(results.contestName, 'Cuộc thi Phim Mùa Thu 2026');
      expect(results.status, 'published');
      expect(results.resultsLocked, true);
      expect(results.winners.length, 4);

      // Verify sorting by awardRank
      expect(results.winners[0].awardRank, 1);
      expect(results.winners[1].awardRank, 2);
      expect(results.winners[2].awardRank, 3);
      expect(results.winners[3].awardRank, 4);

      // Verify getters
      expect(results.goldWinner?.submissionId, 'sub-gold');
      expect(results.silverWinner?.submissionId, 'sub-silver');
      expect(results.bronzeWinner?.submissionId, 'sub-bronze');
      expect(results.podiumWinners.length, 3);
      expect(results.otherWinners.length, 1);
      expect(results.otherWinners.first.submissionId, 'sub-hm');
    });
  });
}
