import 'package:flutter_application_2/models/user_submission.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SubmissionStatus Tests', () {
    test('parses all status strings correctly', () {
      expect(SubmissionStatus.fromString('PENDING_AI'), SubmissionStatus.pendingAi);
      expect(SubmissionStatus.fromString('SUBMITTED'), SubmissionStatus.pendingAi);
      expect(SubmissionStatus.fromString('VERIFYING_AI'), SubmissionStatus.pendingAi);
      expect(SubmissionStatus.fromString('FLAGGED'), SubmissionStatus.aiFlagged);
      expect(SubmissionStatus.fromString('AI_FLAGGED'), SubmissionStatus.aiFlagged);
      expect(SubmissionStatus.fromString('PROOF_REQUESTED'), SubmissionStatus.proofRequested);
      expect(SubmissionStatus.fromString('PROOF_SUBMITTED'), SubmissionStatus.proofSubmitted);
      expect(SubmissionStatus.fromString('APPROVED'), SubmissionStatus.approved);
      expect(SubmissionStatus.fromString('APPROVED_FOR_JUDGING'), SubmissionStatus.approved);
      expect(SubmissionStatus.fromString('DISQUALIFIED'), SubmissionStatus.disqualified);
      expect(SubmissionStatus.fromString('DISQUALIFIED_NO_PROOF'), SubmissionStatus.disqualifiedNoProof);
      expect(SubmissionStatus.fromString('WITHDRAWN'), SubmissionStatus.withdrawn);
      expect(SubmissionStatus.fromString('UNKNOWN_XYZ'), SubmissionStatus.pendingAi);
      expect(SubmissionStatus.fromString(null), SubmissionStatus.pendingAi);
    });

    test('isUrgent is true only for proofRequested', () {
      expect(SubmissionStatus.proofRequested.isUrgent, isTrue);
      expect(SubmissionStatus.pendingAi.isUrgent, isFalse);
      expect(SubmissionStatus.approved.isUrgent, isFalse);
      expect(SubmissionStatus.disqualified.isUrgent, isFalse);
    });

    test('labels and icons are non-null', () {
      for (final status in SubmissionStatus.values) {
        expect(status.label, isNotEmpty);
        expect(status.icon, isNotNull);
      }
    });
  });

  group('SubmissionFilmMetadata Tests', () {
    test('summary formats correctly with brand, camera and frame', () {
      const meta = SubmissionFilmMetadata(
        filmBrand: 'Kodak',
        filmStock: 'Portra 400',
        filmFormat: '135',
        cameraBody: 'Leica M6',
        frameNumber: '14',
      );
      expect(meta.summary, 'Kodak Portra 400 • Leica M6 • Frame #14');
    });

    test('summary handles missing fields gracefully', () {
      const meta = SubmissionFilmMetadata(
        filmStock: 'Ilford HP5 Plus',
      );
      expect(meta.summary, 'Ilford HP5 Plus');
    });

    test('fromJson parses string or int iso values', () {
      final json = {
        'filmBrand': 'Fujifilm',
        'filmStock': 'Pro 400H',
        'isoRated': '400',
        'isoShot': 800,
        'cameraBody': 'Contax T2',
      };
      final meta = SubmissionFilmMetadata.fromJson(json);
      expect(meta.isoRated, 400);
      expect(meta.isoShot, 800);
      expect(meta.cameraBody, 'Contax T2');
    });
  });

  group('UserSubmission Tests', () {
    test('fromJson parses correctly with all attributes', () {
      final json = {
        'id': '750e8400-e29b-41d4-a716-446655440002',
        'submissionCode': 'SUB-2026-0089',
        'contestId': 'contest-01',
        'contestTitle': 'Hanoi Analog 2026',
        'categoryId': 'cat-01',
        'title': 'Gánh Hàng Rong',
        'description': 'Bình minh phố cổ',
        'imageOriginalPath': 'submissions/raw/0089.jpg',
        'imagePreviewPath': 'submissions/preview/0089.jpg',
        'negativeProofPath': 'proofs/0089.jpg',
        'fileSizeBytes': 15728640,
        'width': 4500,
        'height': 3000,
        'status': 'APPROVED',
        'filmMetadata': {
          'filmBrand': 'Kodak',
          'filmStock': 'Tri-X 400',
          'cameraBody': 'Leica M6',
          'frameNumber': '14',
        },
      };

      final sub = UserSubmission.fromJson(json);
      expect(sub.id, '750e8400-e29b-41d4-a716-446655440002');
      expect(sub.displayCode, 'SUB-2026-0089');
      expect(sub.title, 'Gánh Hàng Rong');
      expect(sub.status, SubmissionStatus.approved);
      expect(sub.formattedFileSize, '15.0 MB');
      expect(sub.formattedResolution, '4500 × 3000 px');
      expect(sub.hasProofAttached, isTrue);
      expect(sub.bestDisplayImagePath, 'submissions/preview/0089.jpg');
      expect(sub.filmMetadata?.summary, 'Kodak Tri-X 400 • Leica M6 • Frame #14');
    });

    test('displayCode falls back to truncated UUID when submissionCode is null', () {
      final json = {
        'id': 'abcdef12-3456-7890-abcd-ef1234567890',
        'contestId': 'contest-01',
        'categoryId': 'cat-01',
        'title': 'Test Title',
        'imageOriginalPath': 'path.jpg',
        'status': 'PENDING_AI',
      };
      final sub = UserSubmission.fromJson(json);
      expect(sub.displayCode, 'SUB-ABCDEF12');
    });

    test('remainingProofText calculates remaining 48h deadline (BR-19)', () {
      final futureDeadline = DateTime.now().add(const Duration(hours: 36, minutes: 30));
      final json = {
        'id': 'sub-proof-01',
        'contestId': 'c1',
        'categoryId': 'cat1',
        'title': 'Waiting Proof',
        'imageOriginalPath': 'path.jpg',
        'status': 'PROOF_REQUESTED',
        'proofDeadlineAt': futureDeadline.toIso8601String(),
      };
      final sub = UserSubmission.fromJson(json);
      expect(sub.remainingProofText, contains('Còn lại 36 giờ'));
      expect(sub.remainingProofText, contains('BR-19'));
    });

    test('remainingProofText reports expired when deadline has passed', () {
      final pastDeadline = DateTime.now().subtract(const Duration(minutes: 5));
      final json = {
        'id': 'sub-proof-02',
        'contestId': 'c1',
        'categoryId': 'cat1',
        'title': 'Expired Proof',
        'imageOriginalPath': 'path.jpg',
        'status': 'PROOF_REQUESTED',
        'proofDeadlineAt': pastDeadline.toIso8601String(),
      };
      final sub = UserSubmission.fromJson(json);
      expect(sub.remainingProofText, 'Đã hết hạn 48 giờ nộp âm bản');
    });

    test('fromJson parses snake_case keys and flattened metadata correctly', () {
      final json = {
        'id': 'sub-snake-01',
        'submission_code': 'SUB-2026-9999',
        'contest_id': 'contest-snake',
        'contest_title': 'Cuộc thi phim',
        'category_id': 'cat-snake',
        'title': 'Bình Minh',
        'image_original_path': 'submissions/original.jpg',
        'image_preview_path': 'submissions/preview.jpg',
        'file_size_bytes': 10485760,
        'width_px': 3000,
        'height_px': 2000,
        'status': 'APPROVED_FOR_JUDGING',
        'film_brand': 'Fujifilm',
        'film_stock': 'Industrial 100',
        'camera_body': 'Olympus OM-1',
        'frame_number': 5,
        'rejection_reason': null,
      };

      final sub = UserSubmission.fromJson(json);
      expect(sub.id, 'sub-snake-01');
      expect(sub.submissionCode, 'SUB-2026-9999');
      expect(sub.contestId, 'contest-snake');
      expect(sub.contestTitle, 'Cuộc thi phim');
      expect(sub.imageOriginalPath, 'submissions/original.jpg');
      expect(sub.imagePreviewPath, 'submissions/preview.jpg');
      expect(sub.formattedFileSize, '10.0 MB');
      expect(sub.formattedResolution, '3000 × 2000 px');
      expect(sub.status, SubmissionStatus.approved);
      expect(sub.filmMetadata?.filmStock, 'Industrial 100');
      expect(sub.filmMetadata?.cameraBody, 'Olympus OM-1');
      expect(sub.filmMetadata?.frameNumber, '5');
    });
  });
}
